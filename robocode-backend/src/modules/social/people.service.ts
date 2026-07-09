import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { NotifyService } from "../../common/notify.service";
import { isStaff } from "../../domain/roles";
import { levelProgress } from "../../domain/constants";
import type { AuthUser } from "../../auth/auth-user.type";
import { SocialAccessService, type FriendStatus } from "./social-access.service";
import type { ReportInput } from "./dto";

@Injectable()
export class PeopleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: SocialAccessService,
    private readonly notifier: NotifyService,
  ) {}

  /** A user's social profile page (card + bio + stats + projects + relationship). */
  async profile(viewer: AuthUser, userId: string) {
    const u = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { ...SocialAccessService.cardSelect, bio: true, status: true },
    });
    if (!u || u.status === "rejected") throw new NotFoundException("NOT_FOUND");

    const isSelf = viewer.id === userId;
    const isStaffViewer = isStaff(viewer.role);

    // Project visibility for the profile's project strip.
    const projectWhere: Record<string, unknown> = { ownerId: userId };
    if (!isSelf && !isStaffViewer) {
      projectWhere.OR = [{ visibility: "public" }, { visibility: "tenant", tenantId: viewer.tenantId }];
    }

    const [badges, projects, friendsCount, followersCount, followingCount, projectsCount, friendStatus, following, followPreview] =
      await Promise.all([
        this.prisma.userBadge.findMany({ where: { userId }, include: { badge: true }, orderBy: { awardedAt: "desc" }, take: 12 }),
        this.prisma.project.findMany({
          where: projectWhere,
          orderBy: { updatedAt: "desc" },
          take: 6,
          select: { id: true, title: true, boardType: true, thumbnail: true, visibility: true, updatedAt: true },
        }),
        this.prisma.friendship.count({ where: { status: "accepted", OR: [{ requesterId: userId }, { addresseeId: userId }] } }),
        this.prisma.follow.count({ where: { targetType: "user", targetId: userId } }),
        this.prisma.follow.count({ where: { followerId: userId } }),
        this.prisma.project.count({ where: projectWhere }),
        this.access.friendStatus(viewer.id, userId),
        isSelf ? Promise.resolve(false) : this.access.isFollowing(viewer.id, "user", userId),
        this.access.followPreview(viewer.id, "user", userId),
      ]);

    return {
      user: { ...this.access.card(u), bio: u.bio ?? null },
      progress: levelProgress(u.roboPoints),
      badges,
      projects,
      stats: { friends: friendsCount, followers: followersCount, following: followingCount, projects: projectsCount },
      followPreview,
      me: {
        isSelf,
        friendStatus,
        following,
        canViewWall: await this.access.canViewWall(viewer, "user", userId),
      },
    };
  }

  /** Platform-wide people search (students & teachers), with my relationship. */
  async search(viewer: AuthUser, query: string) {
    const q = (query ?? "").trim();
    if (q.length < 2) return { results: [] };
    const users = await this.prisma.user.findMany({
      where: {
        displayName: { contains: q, mode: "insensitive" },
        status: "active",
        role: { in: ["student", "teacher"] },
        id: { not: viewer.id },
      },
      select: SocialAccessService.cardSelect,
      take: 24,
      orderBy: { displayName: "asc" },
    });
    if (!users.length) return { results: [] };

    const ids = users.map((u) => u.id);
    const [friendships, follows] = await Promise.all([
      this.prisma.friendship.findMany({
        where: {
          OR: [
            { requesterId: viewer.id, addresseeId: { in: ids } },
            { addresseeId: viewer.id, requesterId: { in: ids } },
          ],
        },
      }),
      this.prisma.follow.findMany({ where: { followerId: viewer.id, targetType: "user", targetId: { in: ids } } }),
    ]);
    const followingSet = new Set(follows.map((f) => f.targetId));
    const rowFor = (otherId: string) =>
      friendships.find(
        (r) => (r.requesterId === viewer.id && r.addresseeId === otherId) || (r.addresseeId === viewer.id && r.requesterId === otherId),
      );
    const statusFor = (row: ReturnType<typeof rowFor>): FriendStatus => {
      if (!row) return "none";
      if (row.status === "accepted") return "friends";
      if (row.status === "blocked") return "blocked";
      return row.requesterId === viewer.id ? "outgoing" : "incoming";
    };

    return {
      results: users.map((u) => {
        const row = rowFor(u.id);
        // requestId lets the UI act on a pending request found via search.
        const requestId = row && row.status === "pending" ? row.id : null;
        return { ...this.access.card(u), friendStatus: statusFor(row), following: followingSet.has(u.id), requestId };
      }),
    };
  }

  /** Report content/users — opens a ModerationCase routed to the content's school. */
  async report(viewer: AuthUser, input: ReportInput) {
    let tenantId: string | null = viewer.tenantId;
    try {
      if (input.targetType === "post") {
        const p = await this.prisma.post.findUnique({ where: { id: input.targetId }, select: { tenantId: true } });
        tenantId = p?.tenantId ?? viewer.tenantId;
      } else if (input.targetType === "comment") {
        const c = await this.prisma.postComment.findUnique({ where: { id: input.targetId }, select: { tenantId: true } });
        tenantId = c?.tenantId ?? viewer.tenantId;
      } else if (input.targetType === "user") {
        const u = await this.prisma.user.findUnique({ where: { id: input.targetId }, select: { tenantId: true } });
        tenantId = u?.tenantId ?? viewer.tenantId;
      } else if (input.targetType === "project") {
        const p = await this.prisma.project.findUnique({ where: { id: input.targetId }, select: { tenantId: true } });
        tenantId = p?.tenantId ?? viewer.tenantId;
      } else if (input.targetType === "group") {
        const g = await this.prisma.group.findUnique({ where: { id: input.targetId }, select: { tenantId: true } });
        tenantId = g?.tenantId ?? viewer.tenantId;
      }
    } catch {
      tenantId = viewer.tenantId;
    }

    await this.prisma.moderationCase.create({
      data: {
        tenantId,
        reporterId: viewer.id,
        targetType: input.targetType,
        targetId: input.targetId,
        reason: input.reason.trim(),
        status: "open",
      },
    });
    return { ok: true };
  }
}
