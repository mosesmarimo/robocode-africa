import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { PointsService } from "../../common/points.service";
import { isStaff } from "../../domain/roles";
import type { AuthUser } from "../../auth/auth-user.type";

// ---------------------------------------------------------------------------
// Safety filter (ported verbatim from the old teams/actions.ts)
// ---------------------------------------------------------------------------

const BANNED_WORDS = [
  "idiot",
  "stupid",
  "dumb",
  "hate",
  "kill",
  "die",
  "ugly",
  "loser",
  "shut up",
  "crap",
  "damn",
  "hell",
  "bastard",
  "moron",
  "freak",
];

// Email pattern: something@something.tld
const EMAIL_RE = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/;
// Phone: 7+ consecutive digits (with optional separators)
const PHONE_RE = /(\+?\d[\s\-.]?){7,}/;

function filterMessage(body: string): "clean" | "blocked" {
  const lower = body.toLowerCase();
  for (const word of BANNED_WORDS) {
    // word-boundary aware: check for the word surrounded by non-alpha or string start/end
    if (new RegExp(`(?<![a-z])${word}(?![a-z])`, "i").test(lower)) {
      return "blocked";
    }
  }
  if (EMAIL_RE.test(body) || PHONE_RE.test(body)) {
    return "blocked";
  }
  return "clean";
}

const MAX_TEAM_SIZE = 8;

@Injectable()
export class TeamsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly points: PointsService,
  ) {}

  // =========================================================================
  // READS — teams
  // =========================================================================

  /**
   * /app/teams — the current user's teams plus other browsable teams in scope.
   * Platform staff (super_admin/moderator) browse all tenants; everyone else is
   * scoped to their own school. Mirrors the old TeamsPage RSC queries.
   */
  async listTeams(user: AuthUser) {
    const platform =
      isStaff(user.role) && (user.role === "super_admin" || user.role === "moderator");
    const tenantFilter = platform ? {} : { tenantId: user.tenantId };

    // Fetch teams the user is a member of
    const myMemberships = await this.prisma.teamMember.findMany({
      where: { userId: user.id, status: "active" },
      include: {
        team: {
          include: {
            _count: { select: { members: { where: { status: "active" } } } },
            captain: { select: { id: true, displayName: true } },
          },
        },
      },
      orderBy: { id: "desc" },
    });

    const myTeamIds = myMemberships.map((m) => m.team.id);

    // Browse: other teams in the tenant (not already a member)
    const browseTeams = await this.prisma.team.findMany({
      where: {
        ...tenantFilter,
        id: { notIn: myTeamIds },
      },
      include: {
        _count: { select: { members: { where: { status: "active" } } } },
        captain: { select: { id: true, displayName: true } },
      },
      orderBy: { roboPoints: "desc" },
      take: 20,
    });

    const totalPoints = myMemberships.reduce((sum, m) => sum + m.team.roboPoints, 0);

    return { myMemberships, browseTeams, totalPoints };
  }

  /**
   * /app/teams/[id] — a single team with members, captain, shared projects and
   * chat messages. Enforces the same visibility guard the page used: only active
   * members, same-school staff, or platform staff may view (else NOT_FOUND).
   */
  async getTeam(user: AuthUser, id: string) {
    const staffUser = isStaff(user.role);
    const isPlatformStaff = user.role === "super_admin" || user.role === "moderator";

    const team = await this.prisma.team.findUnique({
      where: { id },
      include: {
        captain: {
          select: { id: true, displayName: true, roboPoints: true },
        },
        members: {
          where: { status: "active" },
          include: {
            user: {
              select: { id: true, displayName: true, role: true, roboPoints: true },
            },
          },
          orderBy: [{ role: "asc" }, { id: "asc" }],
        },
      },
    });

    if (!team) throw new NotFoundException("Team not found");

    // Visibility: only members or staff in same tenant (or platform staff) can view
    const myMembership = team.members.find((m) => m.userId === user.id);
    const sameSchoolStaff = staffUser && team.tenantId === user.tenantId;
    const canView = !!myMembership || sameSchoolStaff || isPlatformStaff;

    if (!canView) throw new NotFoundException("Team not found");

    // Shared team projects
    const projects = await this.prisma.project.findMany({
      where: { teamId: team.id },
      orderBy: { updatedAt: "desc" },
      take: 8,
    });

    // Chat messages (approved for non-staff, all for staff)
    const chatMessages = await this.prisma.chatMessage.findMany({
      where: {
        teamId: team.id,
        ...(staffUser ? {} : { OR: [{ status: "approved" }, { userId: user.id }] }),
      },
      include: {
        user: { select: { id: true, displayName: true } },
      },
      orderBy: { createdAt: "asc" },
      take: 100,
    });

    const isMember = !!myMembership;
    const isCaptain = myMembership?.role === "captain";

    return {
      team,
      projects,
      chatMessages,
      isMember,
      isCaptain,
      sameSchoolStaff,
      isPlatformStaff,
    };
  }

  // =========================================================================
  // MUTATIONS — teams
  // =========================================================================

  /** createTeam — create a team and add the creator as captain. */
  async createTeam(user: AuthUser, name: string, description: string) {
    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length < 2) {
      return { error: "Team name must be at least 2 characters." };
    }

    const team = await this.prisma.team.create({
      data: {
        tenantId: user.tenantId,
        name: trimmedName,
        description: description.trim() || null,
        captainId: user.id,
        avatarSeed: trimmedName.toLowerCase().replace(/\s+/g, "-"),
      },
    });

    await this.prisma.teamMember.create({
      data: {
        teamId: team.id,
        userId: user.id,
        role: "captain",
        status: "active",
      },
    });

    await this.points.awardBadge(user.id, "team-player");

    return { teamId: team.id };
  }

  /** joinTeam — add the current user as an active member if there's room. */
  async joinTeam(user: AuthUser, teamId: string) {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      include: { members: true },
    });

    if (!team || team.tenantId !== user.tenantId) {
      return { error: "Team not found." };
    }

    const alreadyMember = team.members.some((m) => m.userId === user.id);
    if (alreadyMember) {
      return { error: "You are already a member of this team." };
    }

    const activeCount = team.members.filter((m) => m.status === "active").length;
    if (activeCount >= MAX_TEAM_SIZE) {
      return { error: "This team is full." };
    }

    await this.prisma.teamMember.create({
      data: {
        teamId: team.id,
        userId: user.id,
        role: "member",
        status: "active",
      },
    });

    await this.points.awardBadge(user.id, "team-player");

    return { ok: true };
  }

  /**
   * leaveTeam — remove the current user. If they are the captain, promote the
   * oldest remaining active member, or dissolve the team if none remain.
   */
  async leaveTeam(user: AuthUser, teamId: string) {
    const membership = await this.prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId: user.id } },
      include: { team: true },
    });

    if (!membership) {
      return { error: "You are not a member of this team." };
    }

    if (membership.role === "captain") {
      // Promote oldest other member to captain, or delete team if empty
      const others = await this.prisma.teamMember.findMany({
        where: { teamId, userId: { not: user.id }, status: "active" },
        orderBy: { id: "asc" },
      });
      if (others.length > 0) {
        // Promote the first member to captain
        await this.prisma.teamMember.update({
          where: { id: others[0].id },
          data: { role: "captain" },
        });
        await this.prisma.team.update({
          where: { id: teamId },
          data: { captainId: others[0].userId },
        });
      } else {
        // No other members — delete the team
        await this.prisma.team.delete({ where: { id: teamId } });
        return { ok: true, dissolved: true };
      }
    }

    await this.prisma.teamMember.delete({
      where: { teamId_userId: { teamId, userId: user.id } },
    });

    return { ok: true };
  }

  /**
   * postMessage — post a chat message to a team. Only active members may post;
   * messages are run through the safety filter and a moderation case is opened
   * for blocked content. Mirrors the old `postMessage` action.
   */
  async postMessage(user: AuthUser, teamId: string, body: string) {
    const trimmed = body.trim();
    if (!trimmed) return { error: "Message cannot be empty." };
    if (trimmed.length > 500) return { error: "Message too long (max 500 characters)." };

    // Only active team members may post
    const membership = await this.prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId: user.id } },
    });
    if (!membership || membership.status !== "active") {
      return { error: "You must be a team member to post messages." };
    }

    const safety = filterMessage(trimmed);
    const status = safety === "clean" ? "approved" : "blocked";

    const message = await this.prisma.chatMessage.create({
      data: {
        teamId,
        userId: user.id,
        body: trimmed,
        status,
      },
    });

    if (status === "blocked") {
      // Open a moderation case
      await this.prisma.moderationCase.create({
        data: {
          tenantId: user.tenantId,
          reporterId: null,
          targetType: "chat",
          targetId: message.id,
          reason: "Automated safety filter: possible profanity or PII detected.",
          status: "open",
        },
      });
    }

    return { messageId: message.id, status };
  }
}
