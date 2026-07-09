import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { PointsService } from "../../common/points.service";
import { NotifyService } from "../../common/notify.service";
import { POINTS } from "../../domain/constants";
import type { AuthUser } from "../../auth/auth-user.type";
import { SocialAccessService } from "./social-access.service";

@Injectable()
export class FriendsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: SocialAccessService,
    private readonly points: PointsService,
    private readonly notifier: NotifyService,
  ) {}

  /** My accepted friends + pending requests (incoming & outgoing). */
  async list(user: AuthUser) {
    const rows = await this.prisma.friendship.findMany({
      where: {
        OR: [{ requesterId: user.id }, { addresseeId: user.id }],
        status: { in: ["pending", "accepted"] },
      },
      include: {
        requester: { select: SocialAccessService.cardSelect },
        addressee: { select: SocialAccessService.cardSelect },
      },
      orderBy: { updatedAt: "desc" },
    });

    const friends = [];
    const incoming = [];
    const outgoing = [];
    for (const r of rows) {
      const other = r.requesterId === user.id ? r.addressee : r.requester;
      if (r.status === "accepted") {
        friends.push(this.access.card(other));
      } else if (r.addresseeId === user.id) {
        incoming.push({ id: r.id, user: this.access.card(r.requester), createdAt: r.createdAt });
      } else {
        outgoing.push({ id: r.id, user: this.access.card(r.addressee), createdAt: r.createdAt });
      }
    }
    return { friends, incoming, outgoing };
  }

  /** Send a friend request (platform-wide; cross-school allowed). */
  async sendRequest(user: AuthUser, userId: string) {
    if (userId === user.id) throw new BadRequestException({ message: "You can't friend yourself." });
    const target = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true, status: true, role: true } });
    if (!target) throw new NotFoundException("NOT_FOUND");
    if (target.role !== "student" && target.role !== "teacher") {
      // Keep connections between learners/teachers; don't friend platform/admin accounts.
      throw new BadRequestException({ message: "You can only connect with students and teachers." });
    }

    const existing = await this.access.friendshipRow(user.id, userId);
    if (existing) {
      if (existing.status === "accepted") throw new BadRequestException({ message: "You're already friends." });
      if (existing.status === "blocked") throw new BadRequestException({ message: "This connection is blocked." });
      if (existing.addresseeId === user.id) {
        throw new BadRequestException({ message: "This person already sent you a request — accept it instead." });
      }
      throw new BadRequestException({ message: "Friend request already sent." });
    }

    const row = await this.prisma.friendship.create({
      data: { requesterId: user.id, addresseeId: userId, status: "pending" },
    });
    await this.notifier.notify({
      userId,
      type: "friend_request",
      title: "New friend request",
      body: `${user.displayName} wants to connect.`,
      data: { actorId: user.id, actorName: user.displayName, friendshipId: row.id },
    });
    return { ok: true, friendshipId: row.id };
  }

  /** Accept an incoming request (only the addressee). */
  async accept(user: AuthUser, requestId: string) {
    const row = await this.prisma.friendship.findUnique({ where: { id: requestId } });
    if (!row || row.addresseeId !== user.id) throw new NotFoundException("NOT_FOUND");
    if (row.status !== "pending") throw new BadRequestException({ message: "This request is no longer pending." });

    // Conditional update: only the writer that flips pending->accepted proceeds,
    // so a concurrent double-accept can't double-fire notifications.
    const res = await this.prisma.friendship.updateMany({
      where: { id: row.id, status: "pending" },
      data: { status: "accepted", acceptedAt: new Date() },
    });
    if (res.count === 0) throw new BadRequestException({ message: "This request is no longer pending." });

    // Reward both sides for connecting (idempotent per user per pair).
    const [a, b] = [row.requesterId, row.addresseeId].sort();
    for (const uid of [row.requesterId, row.addresseeId]) {
      await this.points.awardPoints({
        userId: uid,
        delta: POINTS.FRIEND_CONNECT,
        reason: "Made a friend",
        refType: "friendship",
        refId: row.id,
        idemKey: `friend:${a}:${b}:${uid}`,
      });
      await this.points.awardBadge(uid, "social-butterfly");
    }

    await this.notifier.notify({
      userId: row.requesterId,
      type: "friend_accepted",
      title: "Friend request accepted",
      body: `${user.displayName} accepted your friend request.`,
      data: { actorId: user.id, actorName: user.displayName },
    });
    return { ok: true };
  }

  /** Decline an incoming request (removes the pending row — not a "message"). */
  async decline(user: AuthUser, requestId: string) {
    const row = await this.prisma.friendship.findUnique({ where: { id: requestId } });
    if (!row || row.addresseeId !== user.id) throw new NotFoundException("NOT_FOUND");
    if (row.status !== "pending") throw new BadRequestException({ message: "This request is no longer pending." });
    await this.prisma.friendship.delete({ where: { id: row.id } });
    return { ok: true };
  }

  /** Cancel an outgoing request I sent. */
  async cancel(user: AuthUser, requestId: string) {
    const row = await this.prisma.friendship.findUnique({ where: { id: requestId } });
    if (!row || row.requesterId !== user.id) throw new NotFoundException("NOT_FOUND");
    if (row.status !== "pending") throw new BadRequestException({ message: "This request is no longer pending." });
    await this.prisma.friendship.delete({ where: { id: row.id } });
    return { ok: true };
  }

  /** Remove an existing friend. */
  async unfriend(user: AuthUser, otherId: string) {
    const row = await this.access.friendshipRow(user.id, otherId);
    if (!row || row.status !== "accepted") throw new NotFoundException("NOT_FOUND");
    await this.prisma.friendship.delete({ where: { id: row.id } });
    return { ok: true };
  }

  /** Block a user: severs the connection (friendship + follows both ways) and
   * records a single canonical blocked row, atomically. */
  async block(user: AuthUser, otherId: string) {
    if (otherId === user.id) throw new BadRequestException({ message: "You can't block yourself." });
    await this.prisma.$transaction([
      this.prisma.friendship.deleteMany({
        where: {
          OR: [
            { requesterId: user.id, addresseeId: otherId },
            { requesterId: otherId, addresseeId: user.id },
          ],
        },
      }),
      this.prisma.follow.deleteMany({
        where: {
          targetType: "user",
          OR: [
            { followerId: user.id, targetId: otherId },
            { followerId: otherId, targetId: user.id },
          ],
        },
      }),
      this.prisma.friendship.create({
        data: { requesterId: user.id, addresseeId: otherId, status: "blocked" },
      }),
    ]);
    return { ok: true };
  }
}
