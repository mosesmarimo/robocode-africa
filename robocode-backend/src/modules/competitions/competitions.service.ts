import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { PointsService } from "../../common/points.service";
import { levelProgress } from "../../domain/constants";
import type { AuthUser } from "../../auth/auth-user.type";
import { gradeCode, type CheckRule } from "../../sim/grader";
import type { Prisma } from "@prisma/client";

@Injectable()
export class CompetitionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly points: PointsService,
  ) {}

  // =========================================================================
  // READS — competitions
  // =========================================================================

  /**
   * /app/competitions — list competitions visible to the user, grouped by status.
   * Platform staff (super_admin/moderator) see all; everyone else sees global
   * (tenantId null) + their own school's.
   */
  async listCompetitions(user: AuthUser) {
    const isPlatformStaff = user.role === "super_admin" || user.role === "moderator";

    const competitions = await this.prisma.competition.findMany({
      where: isPlatformStaff
        ? {}
        : { OR: [{ tenantId: null }, { tenantId: user.tenantId }] },
      include: {
        _count: { select: { entries: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Group by status: live → upcoming → judging → closed
    const STATUS_ORDER = ["live", "upcoming", "judging", "closed"];
    const grouped: Record<string, typeof competitions> = {};
    for (const s of STATUS_ORDER) grouped[s] = [];
    for (const c of competitions) {
      const bucket = STATUS_ORDER.includes(c.status) ? c.status : "closed";
      grouped[bucket].push(c);
    }

    const liveCount = grouped["live"].length;
    const upcomingCount = grouped["upcoming"].length;
    const totalEntrants = competitions.reduce((sum, c) => sum + c._count.entries, 0);

    return { competitions, grouped, liveCount, upcomingCount, totalEntrants };
  }

  /**
   * /app/competitions/[slug] — a single competition with rounds + standings.
   * Enforces the same scope guard the page used (non-platform-staff can only see
   * global or their own school's competitions).
   */
  async getCompetition(user: AuthUser, slug: string) {
    const isPlatformStaff = user.role === "super_admin" || user.role === "moderator";

    const competition = await this.prisma.competition.findUnique({
      where: { slug },
      include: {
        rounds: { orderBy: { order: "asc" } },
        entries: {
          orderBy: { totalScore: "desc" },
          include: {
            team: { select: { id: true, name: true, avatarSeed: true } },
          },
        },
      },
    });

    if (!competition) throw new NotFoundException("Competition not found");

    // Scope guard: non-platform-staff can only see global or their school's competitions
    if (!isPlatformStaff) {
      if (competition.tenantId !== null && competition.tenantId !== user.tenantId) {
        throw new NotFoundException("Competition not found");
      }
    }

    // Check if the current user already has their own entry
    const hasEntered = competition.entries.some((e) => e.userId === user.id);
    const canEnter =
      !hasEntered && (competition.status === "live" || competition.status === "upcoming");

    return { competition, hasEntered, canEnter };
  }

  // =========================================================================
  // MUTATIONS — competitions
  // =========================================================================

  /** Enter a competition (solo or as a team). Mirrors old `enterCompetition`. */
  async enterCompetition(user: AuthUser, competitionId: string, teamId?: string) {
    // Verify competition exists and is open for entries
    const competition = await this.prisma.competition.findUnique({
      where: { id: competitionId },
    });
    if (!competition) {
      return { ok: false, error: "Competition not found." };
    }
    if (competition.status !== "live" && competition.status !== "upcoming") {
      return { ok: false, error: "This competition is no longer accepting entries." };
    }

    // Check for an existing entry (by user or by team)
    const existingWhere = teamId
      ? { competitionId, teamId }
      : { competitionId, userId: user.id };

    const existing = await this.prisma.competitionEntry.findFirst({ where: existingWhere });
    if (existing) {
      return { ok: false, error: "You have already entered this competition." };
    }

    // Create the entry
    const entry = await this.prisma.competitionEntry.create({
      data: {
        competitionId,
        userId: teamId ? null : user.id,
        teamId: teamId ?? null,
        status: "registered",
        totalScore: 0,
      },
    });

    // Award badge + points (idempotent per user+competition)
    const idemKey = `competition-enter:${competitionId}:${user.id}`;
    await Promise.all([
      this.points.awardBadge(user.id, "competitor"),
      this.points.awardPoints({
        userId: user.id,
        delta: 75,
        reason: "Joined a competition",
        refType: "competition",
        refId: competitionId,
        idemKey,
        teamId: teamId ?? undefined,
      }),
    ]);

    return { ok: true, entryId: entry.id, redirect: `/app/competitions/${competition.slug}` };
  }

  // =========================================================================
  // READS — challenges (tasks)
  // =========================================================================

  /**
   * /app/challenges — all tasks plus the current user's best status per task
   * (passed wins over failed).
   */
  async listChallenges(user: AuthUser) {
    const tasks = await this.prisma.task.findMany({
      orderBy: [{ track: "asc" }, { difficulty: "asc" }],
    });

    // Fetch submissions for this user across the listed tasks
    const submissions = await this.prisma.submission.findMany({
      where: { userId: user.id, taskId: { in: tasks.map((t) => t.id) } },
      select: { taskId: true, status: true },
      orderBy: { createdAt: "desc" },
    });

    // Map taskId → best status (passed wins over failed)
    const bestStatus = new Map<string, string>();
    for (const s of submissions) {
      const cur = bestStatus.get(s.taskId);
      if (!cur || s.status === "passed") bestStatus.set(s.taskId, s.status);
    }

    const passedCount = tasks.filter((t) => bestStatus.get(t.id) === "passed").length;

    return {
      tasks,
      // Map serialises poorly over JSON; expose as a plain object.
      bestStatus: Object.fromEntries(bestStatus),
      passedCount,
      totalCount: tasks.length,
    };
  }

  /**
   * /app/challenges/[slug] — a single task with the current user's recent
   * submission history (last 10) and the derived best/passed submission.
   */
  async getChallenge(user: AuthUser, slug: string) {
    const task = await this.prisma.task.findUnique({ where: { slug } });
    if (!task) throw new NotFoundException("Challenge not found");

    // Fetch all submissions for this user+task to show history
    const submissions = await this.prisma.submission.findMany({
      where: { userId: user.id, taskId: task.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, status: true, score: true, createdAt: true },
    });

    const bestSubmission = submissions.find((s) => s.status === "passed") ?? submissions[0] ?? null;
    const isPassed = bestSubmission?.status === "passed";

    return { task, submissions, bestSubmission, isPassed };
  }

  // =========================================================================
  // READS — badges
  // =========================================================================

  /** /app/badges — all badges + which ones the current user has earned. */
  async listBadges(user: AuthUser) {
    const [allBadges, earnedRecords] = await Promise.all([
      this.prisma.badge.findMany({ orderBy: { name: "asc" } }),
      this.prisma.userBadge.findMany({
        where: { userId: user.id },
        include: { badge: true },
      }),
    ]);

    const earnedCount = earnedRecords.length;
    const totalCount = allBadges.length;

    return { allBadges, earnedRecords, earnedCount, totalCount };
  }

  // =========================================================================
  // READS — leaderboard
  // =========================================================================

  /**
   * /app/leaderboard — top students, teams and schools, tenant-scoped for
   * non-platform-staff. Also returns the current user's ranks + totals.
   */
  async getLeaderboard(user: AuthUser) {
    const isPlatformStaff = user.role === "super_admin" || user.role === "moderator";

    // --- Students ---
    const studentWhere = isPlatformStaff
      ? { role: "student", status: "active" }
      : { role: "student", status: "active", tenantId: user.tenantId };

    const topStudents = await this.prisma.user.findMany({
      where: studentWhere,
      orderBy: { roboPoints: "desc" },
      take: 50,
      select: {
        id: true,
        displayName: true,
        roboPoints: true,
        level: true,
        tenantId: true,
      },
    });

    const studentsWithLevel = topStudents.map((s) => ({
      ...s,
      computedLevel: levelProgress(s.roboPoints).level,
    }));

    // --- Teams ---
    const teamWhere = isPlatformStaff ? {} : { tenantId: user.tenantId };
    const topTeams = await this.prisma.team.findMany({
      where: teamWhere,
      orderBy: { roboPoints: "desc" },
      take: 50,
      select: {
        id: true,
        name: true,
        roboPoints: true,
        tenantId: true,
        kind: true,
        _count: { select: { members: true } },
      },
    });

    // --- Schools (aggregate student points per tenant) ---
    const schoolAgg = await this.prisma.user.groupBy({
      by: ["tenantId"],
      where: { role: "student", status: "active" },
      _sum: { roboPoints: true },
      _count: { id: true },
      orderBy: { _sum: { roboPoints: "desc" } },
      take: 50,
    });

    // Fetch tenant names for the aggregated tenantIds
    const tenantIds = schoolAgg.map((a) => a.tenantId);
    const tenants = await this.prisma.tenant.findMany({
      where: { id: { in: tenantIds } },
      select: { id: true, name: true },
    });
    const tenantMap = new Map(tenants.map((t) => [t.id, t.name]));

    const topSchools = schoolAgg.map((a) => ({
      tenantId: a.tenantId,
      name: tenantMap.get(a.tenantId) ?? "Unknown School",
      totalPoints: a._sum.roboPoints ?? 0,
      studentCount: a._count.id,
    }));

    // Current user's school rank (for highlighting)
    const userSchoolRank = topSchools.findIndex((s) => s.tenantId === user.tenantId) + 1;

    // Current user's student rank + total students in scope
    const userStudentRank = studentsWithLevel.findIndex((s) => s.id === user.id) + 1;
    const totalStudents = isPlatformStaff
      ? await this.prisma.user.count({ where: { role: "student", status: "active" } })
      : await this.prisma.user.count({
          where: { role: "student", status: "active", tenantId: user.tenantId },
        });

    return {
      isPlatformStaff,
      students: studentsWithLevel,
      teams: topTeams,
      schools: topSchools,
      userStudentRank,
      userSchoolRank,
      totalStudents,
      currentUserId: user.id,
      currentTenantId: user.tenantId,
    };
  }

  // =========================================================================
  // MUTATION — submit a challenge solution (runs the RVM grader server-side)
  // =========================================================================

  /**
   * submitSolution — auto-grade a task solution headlessly, record the
   * submission, and award points/badges on a pass (mirrors the old action).
   */
  async submitSolution(user: AuthUser, taskId: string, code: string) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundException("Task not found");

    const result = gradeCode(code, task.checks as { rules?: CheckRule[] } | null);

    await this.prisma.submission.create({
      data: {
        taskId,
        userId: user.id,
        code,
        status: result.passed ? "passed" : "failed",
        score: result.score,
        autoResult: result as unknown as Prisma.InputJsonValue,
      },
    });

    if (result.passed) {
      await this.points.awardPoints({
        userId: user.id,
        delta: task.points,
        reason: `Completed challenge: ${task.title}`,
        refType: "task",
        refId: taskId,
        idemKey: `task-${user.id}-${taskId}`,
      });
      if (task.track === "ai") await this.points.awardBadge(user.id, "ai-explorer");
    }

    return result;
  }
}
