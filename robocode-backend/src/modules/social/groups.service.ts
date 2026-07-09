import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { PointsService } from "../../common/points.service";
import { NotifyService } from "../../common/notify.service";
import { isStaff } from "../../domain/roles";
import { POINTS } from "../../domain/constants";
import type { AuthUser } from "../../auth/auth-user.type";
import { SocialAccessService } from "./social-access.service";
import type { CreateGroupInput, UpdateGroupInput } from "./dto";

const MAX_OWNED_GROUPS = 5;

@Injectable()
export class GroupsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: SocialAccessService,
    private readonly points: PointsService,
    private readonly notifier: NotifyService,
  ) {}

  private groupSummary(g: { id: string; name: string; description: string | null; avatarSeed: string; visibility: string; ownerId: string; _count?: { members: number } }) {
    return {
      id: g.id,
      name: g.name,
      description: g.description,
      avatarSeed: g.avatarSeed,
      visibility: g.visibility,
      ownerId: g.ownerId,
      memberCount: g._count?.members ?? 0,
    };
  }

  /** Groups I belong to + discoverable groups I can join (platform-wide). */
  async list(user: AuthUser) {
    const myMemberships = await this.prisma.groupMember.findMany({
      where: { userId: user.id },
      include: { group: { include: { _count: { select: { members: { where: { status: "active" } } } } } } },
      orderBy: { joinedAt: "desc" },
    });
    const myGroupIds = myMemberships.map((m) => m.groupId);

    const discoverable = await this.prisma.group.findMany({
      where: { visibility: "discoverable", id: { notIn: myGroupIds.length ? myGroupIds : ["__none__"] } },
      include: { _count: { select: { members: { where: { status: "active" } } } } },
      orderBy: { createdAt: "desc" },
      take: 40,
    });

    return {
      myGroups: myMemberships.map((m) => ({
        ...this.groupSummary(m.group),
        myRole: m.role,
        myStatus: m.status,
      })),
      discoverable: discoverable.map((g) => this.groupSummary(g)),
    };
  }

  /** A single group page: profile, members, my membership, follow + post perms. */
  async getOne(user: AuthUser, id: string) {
    const group = await this.prisma.group.findUnique({
      where: { id },
      include: {
        owner: { select: SocialAccessService.cardSelect },
        members: { include: { user: { select: SocialAccessService.cardSelect } }, orderBy: { joinedAt: "asc" } },
      },
    });
    if (!group) throw new NotFoundException("NOT_FOUND");

    const myMembership = group.members.find((m) => m.userId === user.id) ?? null;
    const amActiveMember = !!myMembership && myMembership.status === "active";
    const amAdmin = !!myMembership && myMembership.status === "active" && myMembership.role === "admin";
    const staff = isStaff(user.role);

    // Discoverable groups show their profile to anyone; private groups only to
    // members + staff.
    if (group.visibility === "private" && !amActiveMember && !staff) {
      throw new NotFoundException("NOT_FOUND");
    }

    // Pending join requests are only visible to admins/staff.
    const visibleMembers = group.members
      .filter((m) => m.status === "active" || amAdmin || staff)
      .map((m) => ({ ...this.access.card(m.user), role: m.role, status: m.status, joinedAt: m.joinedAt }));

    const canViewWall = amActiveMember || staff;
    const [following, followerCount, followPreview] = await Promise.all([
      this.access.isFollowing(user.id, "group", id),
      this.access.followerCount("group", id),
      this.access.followPreview(user.id, "group", id),
    ]);

    return {
      group: {
        ...this.groupSummary({ ...group, _count: { members: group.members.filter((m) => m.status === "active").length } }),
        owner: this.access.card(group.owner),
        createdAt: group.createdAt,
      },
      members: visibleMembers,
      activeMemberCount: group.members.filter((m) => m.status === "active").length,
      // Pending join-request activity is only visible to admins/staff.
      pendingCount: amAdmin || staff ? group.members.filter((m) => m.status === "pending").length : 0,
      me: {
        role: myMembership?.role ?? null,
        status: myMembership?.status ?? null,
        isAdmin: amAdmin,
        isMember: amActiveMember,
        canPost: amAdmin,
        canViewWall,
        canModerate: this.access.canModerate(user, group.tenantId),
        following,
      },
      followerCount,
      followPreview,
    };
  }

  async create(user: AuthUser, input: CreateGroupInput) {
    const owned = await this.prisma.group.count({ where: { ownerId: user.id } });
    if (owned >= MAX_OWNED_GROUPS) {
      throw new BadRequestException({ message: `You can own at most ${MAX_OWNED_GROUPS} groups.` });
    }
    const group = await this.prisma.group.create({
      data: {
        tenantId: user.tenantId,
        ownerId: user.id,
        name: input.name,
        description: input.description || null,
        members: { create: { userId: user.id, role: "admin", status: "active" } },
      },
    });
    await this.points.awardPoints({
      userId: user.id,
      delta: POINTS.GROUP_CREATE,
      reason: "Created a group",
      refType: "group",
      refId: group.id,
      idemKey: `group-create-${group.id}`,
    });
    await this.points.awardBadge(user.id, "group-founder");
    return { ok: true, groupId: group.id };
  }

  async update(user: AuthUser, id: string, input: UpdateGroupInput) {
    const group = await this.prisma.group.findUnique({ where: { id } });
    if (!group) throw new NotFoundException("NOT_FOUND");
    if (!(await this.access.isGroupAdmin(id, user.id))) throw new ForbiddenException("FORBIDDEN");
    await this.prisma.group.update({
      where: { id },
      data: {
        name: input.name?.trim() ?? undefined,
        description: input.description === undefined ? undefined : input.description.trim() || null,
        avatarSeed: input.avatarSeed?.trim() || undefined,
        visibility: input.visibility ?? undefined,
      },
    });
    return { ok: true };
  }

  /** Request to join a discoverable group (pending until an admin approves). */
  async requestJoin(user: AuthUser, id: string) {
    const group = await this.prisma.group.findUnique({ where: { id } });
    if (!group) throw new NotFoundException("NOT_FOUND");
    if (group.visibility !== "discoverable") {
      throw new ForbiddenException({ message: "This group is invite-only." });
    }
    const existing = await this.access.membership(id, user.id);
    if (existing) {
      if (existing.status === "active") throw new BadRequestException({ message: "You're already a member." });
      throw new BadRequestException({ message: "Your join request is pending approval." });
    }
    await this.prisma.groupMember.create({ data: { groupId: id, userId: user.id, role: "member", status: "pending" } });

    const admins = await this.prisma.groupMember.findMany({
      where: { groupId: id, role: "admin", status: "active" },
      select: { userId: true },
    });
    await Promise.all(
      admins.map((a) =>
        this.notifier.notify({
          userId: a.userId,
          type: "group_join_request",
          title: "New group join request",
          body: `${user.displayName} wants to join "${group.name}".`,
          data: { actorId: user.id, actorName: user.displayName, groupId: id },
        }),
      ),
    );
    return { ok: true, status: "pending" };
  }

  async approveMember(user: AuthUser, groupId: string, userId: string) {
    if (!(await this.access.isGroupAdmin(groupId, user.id))) throw new ForbiddenException("FORBIDDEN");
    const m = await this.access.membership(groupId, userId);
    if (!m || m.status !== "pending") throw new NotFoundException("NOT_FOUND");
    await this.prisma.groupMember.update({ where: { id: m.id }, data: { status: "active" } });
    const group = await this.prisma.group.findUnique({ where: { id: groupId }, select: { name: true } });
    await this.notifier.notify({
      userId,
      type: "group_join_approved",
      title: "Join request approved",
      body: `You're now a member of "${group?.name}".`,
      data: { groupId },
    });
    return { ok: true };
  }

  async declineMember(user: AuthUser, groupId: string, userId: string) {
    if (!(await this.access.isGroupAdmin(groupId, user.id))) throw new ForbiddenException("FORBIDDEN");
    const m = await this.access.membership(groupId, userId);
    if (!m || m.status !== "pending") throw new NotFoundException("NOT_FOUND");
    await this.prisma.groupMember.delete({ where: { id: m.id } });
    return { ok: true };
  }

  /** Remove an active member (admin only; cannot remove the owner). */
  async removeMember(user: AuthUser, groupId: string, userId: string) {
    if (!(await this.access.isGroupAdmin(groupId, user.id))) throw new ForbiddenException("FORBIDDEN");
    const group = await this.prisma.group.findUnique({ where: { id: groupId }, select: { ownerId: true } });
    if (!group) throw new NotFoundException("NOT_FOUND");
    if (userId === group.ownerId) throw new BadRequestException({ message: "The group owner can't be removed." });
    const m = await this.access.membership(groupId, userId);
    if (!m) throw new NotFoundException("NOT_FOUND");
    await this.prisma.groupMember.delete({ where: { id: m.id } });
    return { ok: true };
  }

  async setRole(user: AuthUser, groupId: string, userId: string, role: "admin" | "member") {
    if (!(await this.access.isGroupAdmin(groupId, user.id))) throw new ForbiddenException("FORBIDDEN");
    const group = await this.prisma.group.findUnique({ where: { id: groupId }, select: { ownerId: true } });
    if (!group) throw new NotFoundException("NOT_FOUND");
    if (userId === group.ownerId) throw new BadRequestException({ message: "The owner is always an admin." });
    const m = await this.access.membership(groupId, userId);
    if (!m || m.status !== "active") throw new NotFoundException("NOT_FOUND");
    await this.prisma.groupMember.update({ where: { id: m.id }, data: { role } });
    return { ok: true };
  }

  async leave(user: AuthUser, groupId: string) {
    const group = await this.prisma.group.findUnique({ where: { id: groupId }, select: { ownerId: true } });
    if (!group) throw new NotFoundException("NOT_FOUND");
    if (group.ownerId === user.id) {
      throw new BadRequestException({ message: "The owner can't leave their own group." });
    }
    const m = await this.access.membership(groupId, user.id);
    if (!m) throw new NotFoundException("NOT_FOUND");
    await this.prisma.groupMember.delete({ where: { id: m.id } });
    return { ok: true };
  }
}
