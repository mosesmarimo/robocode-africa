import { BadRequestException, ForbiddenException, Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { NotifyService } from "../../common/notify.service";
import type { AuthUser } from "../../auth/auth-user.type";
import { SocialAccessService } from "./social-access.service";

@Injectable()
export class FollowsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: SocialAccessService,
    private readonly notifier: NotifyService,
  ) {}

  /** Follow a user, project, or group (platform-wide). */
  async follow(user: AuthUser, targetType: string, targetId: string) {
    if (targetType === "user" && targetId === user.id) {
      throw new BadRequestException({ message: "You can't follow yourself." });
    }
    const target = await this.access.resolveTarget(targetType, targetId); // 404 if missing

    // A blocked relationship can't be re-established via a follow.
    if (targetType === "user" && (await this.access.isBlockedBetween(user.id, targetId))) {
      throw new ForbiddenException({ message: "You can't follow this user." });
    }
    // You may only follow a PROJECT you can already see — following must never
    // escalate a non-viewer into a viewer of a private/tenant project.
    if (targetType === "project" && !(await this.access.canViewWall(user, "project", targetId))) {
      throw new ForbiddenException({ message: "You can't follow this project." });
    }

    const existing = await this.prisma.follow.findUnique({
      where: { followerId_targetType_targetId: { followerId: user.id, targetType, targetId } },
    });
    if (existing) return { ok: true, following: true };

    await this.prisma.follow.create({ data: { followerId: user.id, targetType, targetId } });

    // Notify the owner (user themselves for a user target), unless it's self.
    if (target.ownerId && target.ownerId !== user.id) {
      const what =
        targetType === "user" ? "you" : targetType === "project" ? `your project "${target.name}"` : `your group "${target.name}"`;
      await this.notifier.notify({
        userId: target.ownerId,
        type: "new_follower",
        title: "New follower",
        body: `${user.displayName} started following ${what}.`,
        data: { actorId: user.id, actorName: user.displayName, targetType, targetId },
      });
    }
    return { ok: true, following: true };
  }

  async unfollow(user: AuthUser, targetType: string, targetId: string) {
    await this.prisma.follow.deleteMany({ where: { followerId: user.id, targetType, targetId } });
    return { ok: true, following: false };
  }

  /** Everything the current user follows, grouped by type. */
  async listMine(user: AuthUser) {
    const rows = await this.prisma.follow.findMany({
      where: { followerId: user.id },
      orderBy: { createdAt: "desc" },
    });
    const byType: Record<string, string[]> = { user: [], project: [], group: [] };
    for (const r of rows) (byType[r.targetType] ??= []).push(r.targetId);

    const [users, projects, groups] = await Promise.all([
      byType.user.length
        ? this.prisma.user.findMany({ where: { id: { in: byType.user } }, select: SocialAccessService.cardSelect })
        : [],
      byType.project.length
        ? this.prisma.project.findMany({
            where: { id: { in: byType.project } },
            select: { id: true, title: true, boardType: true, thumbnail: true, ownerId: true },
          })
        : [],
      byType.group.length
        ? this.prisma.group.findMany({
            where: { id: { in: byType.group } },
            select: { id: true, name: true, avatarSeed: true, description: true },
          })
        : [],
    ]);

    return {
      users: users.map((u) => this.access.card(u)),
      projects,
      groups,
    };
  }

  /**
   * Followers of a target, each annotated with the VIEWER's relationship so the
   * UI can surface mutuals ("people you know"). Friends are listed first.
   */
  async followers(user: AuthUser, targetType: string, targetId: string) {
    await this.access.resolveTarget(targetType, targetId);
    if (!(await this.access.canSeeFollowers(user, targetType, targetId))) {
      throw new ForbiddenException("FORBIDDEN");
    }
    const rows = await this.prisma.follow.findMany({
      where: { targetType, targetId },
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { follower: { select: SocialAccessService.cardSelect } },
    });
    const followerIds = rows.map((r) => r.followerId).filter((id) => id !== user.id);

    // Batch the viewer's relationship to each follower (friendship + follow).
    // Empty `in: []` simply matches nothing, so no length guard is needed.
    const [friendships, follows] = await Promise.all([
      this.prisma.friendship.findMany({
        where: {
          OR: [
            { requesterId: user.id, addresseeId: { in: followerIds } },
            { addresseeId: user.id, requesterId: { in: followerIds } },
          ],
        },
      }),
      this.prisma.follow.findMany({ where: { followerId: user.id, targetType: "user", targetId: { in: followerIds } } }),
    ]);
    const followingSet = new Set(follows.map((f) => f.targetId));
    const statusFor = (otherId: string): "self" | "none" | "friends" | "incoming" | "outgoing" | "blocked" => {
      if (otherId === user.id) return "self";
      const row = friendships.find(
        (r) => (r.requesterId === user.id && r.addresseeId === otherId) || (r.addresseeId === user.id && r.requesterId === otherId),
      );
      if (!row) return "none";
      if (row.status === "accepted") return "friends";
      if (row.status === "blocked") return "blocked";
      return row.requesterId === user.id ? "outgoing" : "incoming";
    };

    const followers = rows.map((r) => {
      const friendStatus = statusFor(r.followerId);
      return {
        ...this.access.card(r.follower),
        isFriend: friendStatus === "friends",
        friendStatus,
        following: followingSet.has(r.followerId),
      };
    });
    // Friends (mutuals) first, then everyone else.
    followers.sort((a, b) => Number(b.isFriend) - Number(a.isFriend));
    const friendCount = followers.filter((f) => f.isFriend).length;

    return { followers, total: followers.length, friendCount };
  }

  /** Lightweight "followed by people you know" preview for a target header. */
  async preview(user: AuthUser, targetType: string, targetId: string) {
    await this.access.resolveTarget(targetType, targetId);
    if (!(await this.access.canSeeFollowers(user, targetType, targetId))) {
      throw new ForbiddenException("FORBIDDEN");
    }
    return this.access.followPreview(user.id, targetType, targetId);
  }
}
