import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { isStaff } from "../../domain/roles";
import type { AuthUser } from "../../auth/auth-user.type";

/**
 * Centralised authorization + projections for the social graph.
 *
 * SAFETY MODEL (read this before changing any check):
 *  - The social graph is PLATFORM-WIDE: friendship/follow/group membership may
 *    cross schools, so visibility is decided by the social graph + project
 *    visibility, NOT by tenant. tenant is used ONLY to route moderation to the
 *    content author's school staff.
 *  - Walls:
 *      user profile wall -> self, friends, followers, or staff
 *      project wall      -> anyone who can view the project, or a follower, or staff
 *      group wall        -> active members, or staff (teachers can oversee groups)
 *  - Posting:
 *      user profile -> only the profile owner
 *      project      -> only the project owner
 *      group        -> only an active group admin
 *  - There are NO hard deletes: posts/comments are archived (soft-hidden,
 *    retained) by the author, the page owner/admin, or staff.
 */

export type PublicUserCard = {
  id: string;
  displayName: string;
  avatarSeed: string;
  role: string;
  tagline: string | null;
  level: number;
  roboPoints: number;
  schoolName: string | null;
};

export type FriendStatus = "self" | "none" | "friends" | "incoming" | "outgoing" | "blocked";

/** A polymorphic target resolved to the fields access checks need. */
export type ResolvedTarget = { tenantId: string; ownerId: string | null; visibility?: string; name?: string };

type UserWithTenant = {
  id: string;
  displayName: string;
  avatarSeed: string;
  role: string;
  tagline: string | null;
  level: number;
  roboPoints: number;
  tenant?: { name: string; isPlatform: boolean } | null;
};

@Injectable()
export class SocialAccessService {
  constructor(private readonly prisma: PrismaService) {}

  /** Minimal, minor-safe public projection of a user (never exposes email). */
  card(u: UserWithTenant): PublicUserCard {
    return {
      id: u.id,
      displayName: u.displayName,
      avatarSeed: u.avatarSeed,
      role: u.role,
      tagline: u.tagline ?? null,
      level: u.level,
      roboPoints: u.roboPoints,
      schoolName: u.tenant && !u.tenant.isPlatform ? u.tenant.name : null,
    };
  }

  /** Prisma `select` that yields the fields `card()` needs. */
  static readonly cardSelect = {
    id: true,
    displayName: true,
    avatarSeed: true,
    role: true,
    tagline: true,
    level: true,
    roboPoints: true,
    tenant: { select: { name: true, isPlatform: true } },
  } as const;

  // -------------------------------------------------------------------------
  // Friendship
  // -------------------------------------------------------------------------

  /** The single friendship row (either direction) between two users, if any. */
  async friendshipRow(aId: string, bId: string) {
    return this.prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: aId, addresseeId: bId },
          { requesterId: bId, addresseeId: aId },
        ],
      },
    });
  }

  /** Relationship of `otherId` as seen by `viewerId`. */
  async friendStatus(viewerId: string, otherId: string): Promise<FriendStatus> {
    if (viewerId === otherId) return "self";
    const row = await this.friendshipRow(viewerId, otherId);
    if (!row) return "none";
    if (row.status === "accepted") return "friends";
    if (row.status === "blocked") return "blocked";
    // pending
    return row.requesterId === viewerId ? "outgoing" : "incoming";
  }

  async areFriends(aId: string, bId: string): Promise<boolean> {
    if (aId === bId) return true;
    const row = await this.friendshipRow(aId, bId);
    return !!row && row.status === "accepted";
  }

  /** True if either user has blocked the other. */
  async isBlockedBetween(aId: string, bId: string): Promise<boolean> {
    if (aId === bId) return false;
    const row = await this.prisma.friendship.findFirst({
      where: {
        status: "blocked",
        OR: [
          { requesterId: aId, addresseeId: bId },
          { requesterId: bId, addresseeId: aId },
        ],
      },
      select: { id: true },
    });
    return !!row;
  }

  // -------------------------------------------------------------------------
  // Follows
  // -------------------------------------------------------------------------

  async isFollowing(followerId: string, targetType: string, targetId: string): Promise<boolean> {
    const row = await this.prisma.follow.findUnique({
      where: { followerId_targetType_targetId: { followerId, targetType, targetId } },
    });
    return !!row;
  }

  followerCount(targetType: string, targetId: string): Promise<number> {
    return this.prisma.follow.count({ where: { targetType, targetId } });
  }

  /** The set of a user's accepted-friend ids (used to mark mutuals). */
  async friendIdsOf(userId: string): Promise<Set<string>> {
    const rows = await this.prisma.friendship.findMany({
      where: { status: "accepted", OR: [{ requesterId: userId }, { addresseeId: userId }] },
      select: { requesterId: true, addresseeId: true },
    });
    const ids = new Set<string>();
    for (const r of rows) ids.add(r.requesterId === userId ? r.addresseeId : r.requesterId);
    return ids;
  }

  /**
   * "Followed by people you know": the viewer's own friends who follow this
   * target, plus the total follower count and how many of them are the viewer's
   * friends. Viewer-scoped and read-only.
   */
  async followPreview(
    viewerId: string,
    targetType: string,
    targetId: string,
    previewLimit = 6,
  ): Promise<{ followerCount: number; friendFollowerCount: number; friendFollowers: PublicUserCard[] }> {
    const [followerCount, friendIds] = await Promise.all([
      this.followerCount(targetType, targetId),
      this.friendIdsOf(viewerId),
    ]);
    if (friendIds.size === 0) return { followerCount, friendFollowerCount: 0, friendFollowers: [] };

    const friendFollows = await this.prisma.follow.findMany({
      where: { targetType, targetId, followerId: { in: [...friendIds] } },
      select: { followerId: true },
    });
    const friendFollowerIds = friendFollows.map((f) => f.followerId);
    if (friendFollowerIds.length === 0) return { followerCount, friendFollowerCount: 0, friendFollowers: [] };

    const preview = await this.prisma.user.findMany({
      where: { id: { in: friendFollowerIds.slice(0, previewLimit) } },
      select: SocialAccessService.cardSelect,
    });
    return { followerCount, friendFollowerCount: friendFollowerIds.length, friendFollowers: preview.map((u) => this.card(u)) };
  }

  /** Who may view a target's follower LIST: profiles are open to any signed-in
   * viewer; projects require wall visibility; groups require the group be
   * discoverable, or the viewer be an active member or staff. */
  async canSeeFollowers(viewer: AuthUser, targetType: string, targetId: string): Promise<boolean> {
    if (targetType === "user") return true;
    if (targetType === "project") return this.canViewWall(viewer, "project", targetId);
    if (targetType === "group") {
      if (isStaff(viewer.role)) return true;
      const g = await this.prisma.group.findUnique({ where: { id: targetId }, select: { visibility: true } });
      if (!g) return false;
      if (g.visibility === "discoverable") return true;
      return this.isActiveMember(targetId, viewer.id);
    }
    return false;
  }

  // -------------------------------------------------------------------------
  // Group membership helpers
  // -------------------------------------------------------------------------

  async membership(groupId: string, userId: string) {
    return this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
  }

  async isActiveMember(groupId: string, userId: string): Promise<boolean> {
    const m = await this.membership(groupId, userId);
    return !!m && m.status === "active";
  }

  async isGroupAdmin(groupId: string, userId: string): Promise<boolean> {
    const m = await this.membership(groupId, userId);
    return !!m && m.status === "active" && m.role === "admin";
  }

  // -------------------------------------------------------------------------
  // Moderation scope
  // -------------------------------------------------------------------------

  /** Platform staff (super_admin/moderator) can moderate anything; school staff
   * can moderate content authored within their own school. */
  canModerate(viewer: AuthUser, contentTenantId: string | null | undefined): boolean {
    if (viewer.role === "super_admin" || viewer.role === "moderator") return true;
    return isStaff(viewer.role) && !!contentTenantId && viewer.tenantId === contentTenantId;
  }

  // -------------------------------------------------------------------------
  // Target resolution + wall/post authorization
  // -------------------------------------------------------------------------

  /** Resolve a polymorphic target to its owner + moderation tenant. Throws 404. */
  async resolveTarget(targetType: string, targetId: string): Promise<ResolvedTarget> {
    if (targetType === "user") {
      const u = await this.prisma.user.findUnique({ where: { id: targetId }, select: { id: true, tenantId: true } });
      if (!u) throw new NotFoundException("NOT_FOUND");
      return { tenantId: u.tenantId, ownerId: u.id };
    }
    if (targetType === "project") {
      const p = await this.prisma.project.findUnique({
        where: { id: targetId },
        select: { id: true, ownerId: true, tenantId: true, visibility: true, title: true },
      });
      if (!p) throw new NotFoundException("NOT_FOUND");
      return { tenantId: p.tenantId, ownerId: p.ownerId, visibility: p.visibility, name: p.title };
    }
    if (targetType === "group") {
      const g = await this.prisma.group.findUnique({
        where: { id: targetId },
        select: { id: true, ownerId: true, tenantId: true, visibility: true, name: true },
      });
      if (!g) throw new NotFoundException("NOT_FOUND");
      return { tenantId: g.tenantId, ownerId: g.ownerId, visibility: g.visibility, name: g.name };
    }
    throw new NotFoundException("NOT_FOUND");
  }

  /** Can `viewer` read the wall (list posts) of this target? Pass `pre` (a
   * resolveTarget result) to avoid a redundant re-fetch of the target row. */
  async canViewWall(viewer: AuthUser, targetType: string, targetId: string, pre?: ResolvedTarget): Promise<boolean> {
    if (targetType === "user") {
      if (viewer.id === targetId) return true;
      if (isStaff(viewer.role)) return true; // staff oversight
      // One round-trip: friendship (block/accepted) + follow, in parallel.
      const [fr, follow] = await Promise.all([
        this.friendshipRow(viewer.id, targetId),
        this.prisma.follow.findUnique({
          where: { followerId_targetType_targetId: { followerId: viewer.id, targetType: "user", targetId } },
          select: { id: true },
        }),
      ]);
      if (fr?.status === "blocked") return false; // block severs all visibility
      if (fr?.status === "accepted") return true;
      return !!follow;
    }
    if (targetType === "project") {
      const p = pre ?? (await this.prisma.project.findUnique({
        where: { id: targetId },
        select: { ownerId: true, tenantId: true, visibility: true },
      })) as ResolvedTarget | null;
      if (!p) return false;
      if (p.ownerId === viewer.id) return true;
      if (this.canModerate(viewer, p.tenantId)) return true;
      if (p.visibility === "public") return true;
      if (p.visibility === "tenant" && p.tenantId === viewer.tenantId) return true;
      return this.isFollowing(viewer.id, "project", targetId);
    }
    if (targetType === "group") {
      if (!pre) {
        const g = await this.prisma.group.findUnique({ where: { id: targetId }, select: { tenantId: true } });
        if (!g) return false;
      }
      if (isStaff(viewer.role)) return true; // teachers/staff may view student groups
      return this.isActiveMember(targetId, viewer.id);
    }
    return false;
  }

  /** Can `viewer` post an update to this target's wall? Pass `pre` to avoid a
   * redundant target re-fetch. */
  async canPostTo(viewer: AuthUser, targetType: string, targetId: string, pre?: ResolvedTarget): Promise<boolean> {
    if (targetType === "user") return viewer.id === targetId; // only your own profile wall
    if (targetType === "project") {
      const ownerId = pre
        ? pre.ownerId
        : (await this.prisma.project.findUnique({ where: { id: targetId }, select: { ownerId: true } }))?.ownerId ?? null;
      return ownerId === viewer.id; // only the project owner
    }
    if (targetType === "group") return this.isGroupAdmin(targetId, viewer.id); // only group admins
    return false;
  }
}
