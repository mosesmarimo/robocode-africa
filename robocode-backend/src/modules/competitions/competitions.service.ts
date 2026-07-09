import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { PointsService } from "../../common/points.service";
import { GamificationService } from "../../common/gamification.service";
import { POINTS, levelProgress, challengeXp, trackForLanguage } from "../../domain/constants";
import type { AuthUser } from "../../auth/auth-user.type";
import { gradeCode, gradeOutput, type CheckRule, type GradeResult } from "../../sim/grader";
import { AiService } from "../ai/ai.service";
import { RunService, RateLimitExceededError } from "../run/run.service";
import { RUN_LANGUAGES, type RunLanguage } from "../run/dto";
import { TracksService } from "../tracks/tracks.service";
import type { Prisma } from "@prisma/client";

// File extension used when handing a coding-challenge submission to the AI
// run-code runtime, so it runs the snippet as the right language.
const CODING_EXT: Record<string, string> = {
  python: "py", javascript: "js", typescript: "ts", go: "go", rust: "rs",
  cpp: "cpp", csharp: "cs", sql: "sql", html: "html", css: "css", micropython: "py",
};

@Injectable()
export class CompetitionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly points: PointsService,
    private readonly gamification: GamificationService,
    private readonly ai: AiService,
    private readonly runService: RunService,
    private readonly tracks: TracksService,
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
          // Bound the standings payload to a top-N for large competitions.
          take: 100,
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

    // CompetitionEntry has no `user` relation, so attach solo-entrant info for the
    // standings list (team entries already include their team).
    const soloUserIds = competition.entries
      .filter((e) => e.userId && !e.teamId)
      .map((e) => e.userId as string);
    const soloUsers = soloUserIds.length
      ? await this.prisma.user.findMany({
          where: { id: { in: soloUserIds } },
          select: { id: true, displayName: true, avatarSeed: true },
        })
      : [];
    const userById = new Map(soloUsers.map((u) => [u.id, u]));
    const entries = competition.entries.map((e) => ({
      ...e,
      user: e.userId ? (userById.get(e.userId) ?? null) : null,
    }));

    // The current user counts as entered via a solo entry OR any team they belong to.
    // Use a targeted query (not the capped standings list) so a user whose entry
    // falls outside the top-N is still correctly detected as entered.
    const myTeamIds = (
      await this.prisma.teamMember.findMany({
        where: { userId: user.id, status: "active" },
        select: { teamId: true },
      })
    ).map((m) => m.teamId);
    const myEntryCount = await this.prisma.competitionEntry.count({
      where: {
        competitionId: competition.id,
        OR: [{ userId: user.id }, ...(myTeamIds.length ? [{ teamId: { in: myTeamIds } }] : [])],
      },
    });
    const hasEntered = myEntryCount > 0;
    const canEnter =
      !hasEntered && (competition.status === "live" || competition.status === "upcoming");

    return { competition: { ...competition, entries }, hasEntered, canEnter };
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
      throw new NotFoundException({ message: "Competition not found." });
    }
    // Tenant scope: only global competitions or the user's own school.
    if (competition.tenantId !== null && competition.tenantId !== user.tenantId) {
      throw new NotFoundException({ message: "Competition not found." });
    }
    if (competition.status !== "live" && competition.status !== "upcoming") {
      throw new BadRequestException({ message: "This competition is no longer accepting entries." });
    }

    // Entering as a team requires being an active member of that team (in this tenant).
    if (teamId) {
      const membership = await this.prisma.teamMember.findFirst({
        where: { teamId, userId: user.id, status: "active", team: { tenantId: user.tenantId } },
      });
      if (!membership) {
        throw new ForbiddenException({ message: "You can only enter a team you belong to." });
      }
    }

    // Check for an existing entry (by user or by team)
    const existingWhere = teamId
      ? { competitionId, teamId }
      : { competitionId, userId: user.id };

    const existing = await this.prisma.competitionEntry.findFirst({ where: existingWhere });
    if (existing) {
      throw new BadRequestException({ message: "You have already entered this competition." });
    }

    // Create the entry. The DB @@unique([competitionId,userId]) / ([competitionId,teamId])
    // closes the check-then-create race: a concurrent duplicate throws P2002.
    let entry;
    try {
      entry = await this.prisma.competitionEntry.create({
        data: {
          competitionId,
          userId: teamId ? null : user.id,
          teamId: teamId ?? null,
          status: "registered",
          totalScore: 0,
        },
      });
    } catch (e) {
      if (e && typeof e === "object" && (e as { code?: string }).code === "P2002") {
        throw new BadRequestException({ message: "You have already entered this competition." });
      }
      throw e;
    }

    // Award badge + points (idempotent per user+competition)
    const idemKey = `competition-enter:${competitionId}:${user.id}`;
    await Promise.all([
      this.points.awardBadge(user.id, "competitor"),
      this.points.awardPoints({
        userId: user.id,
        delta: POINTS.COMPETITION_PARTICIPATE,
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

    const checks = task.checks as { rules?: CheckRule[] } | null;
    const lang = task.language;
    let result: GradeResult;
    // Auditable record of which runtime actually produced the graded output —
    // "server" (jailed docker runner, matching RunOutcome.engine) or "ai"
    // (AI-simulated runtime). Left undefined for arduino/robotics
    // submissions, which use neither (the local RVM simulator grades those
    // instead — see the `else` branch below).
    let engine: "server" | "ai" | undefined;
    if (lang && lang !== "arduino") {
      // Coding-language challenge: run the submission and grade its stdout.
      // (Arduino/robotics tasks fall through to the simulator below.)
      const ext = CODING_EXT[lang] ?? "txt";
      const files = [{ name: `main.${ext}`, content: code }];
      // Prefer the jailed sandbox runner; it only supports a subset of
      // languages (see RUN_LANGUAGES — excludes html/css/micropython), and it
      // may be unconfigured (docker missing) in some environments — in both
      // cases fall back to the AI-simulated runtime so grading still works.
      // It may also reject the run with RateLimitExceededError if the caller
      // already spent their interactive Studio "Run" budget — grading must
      // never crash on that, so it falls back to AI the same way.
      let output = "";
      let ok = false;
      let runtimeError = true;
      let text: string | undefined;
      if ((RUN_LANGUAGES as readonly string[]).includes(lang)) {
        try {
          const run = await this.runService.execute(user, lang as RunLanguage, files);
          if (run.configured) {
            engine = "server";
            output = run.output;
            ok = run.ok;
            runtimeError = run.error;
            text = run.text;
          }
        } catch (err) {
          if (!(err instanceof RateLimitExceededError)) throw err;
          // Rate-limited: fall through to the AI-simulated runtime below.
        }
      }
      if (engine !== "server") {
        engine = "ai";
        const run = await this.ai.runCode(user, lang, files);
        output = run.output;
        ok = run.ok;
        runtimeError = run.error;
        text = run.text;
      }
      const runError = ok && !runtimeError ? undefined : (text || "Could not run your code.");
      result = gradeOutput(output, checks, runError);
    } else {
      result = gradeCode(code, checks, { board: task.boardType });
    }

    await this.prisma.submission.create({
      data: {
        taskId,
        userId: user.id,
        code,
        status: result.passed ? "passed" : "failed",
        score: result.score,
        autoResult: (engine ? { ...result, engine } : result) as unknown as Prisma.InputJsonValue,
      },
    });

    if (result.passed) {
      // Challenge language comes straight off the task (null → an
      // Arduino/robotics challenge graded by the local simulator, per the
      // `lang && lang !== "arduino"` branch above). Track: prefer the track
      // derived from that language (frozen 12 → coding|robotics); fall back
      // to the task's own `track` field only when it's already one of the
      // two gamification tracks (a task.track of "ai" isn't a valid ledger
      // track, so it's left untagged rather than mis-tagged).
      const track =
        trackForLanguage(task.language) ??
        (task.track === "coding" || task.track === "robotics" ? task.track : undefined);
      await this.gamification.completeTask({
        userId: user.id,
        type: "challenge",
        refId: taskId,
        language: task.language,
        track,
        xpOverride: challengeXp(task.difficulty),
      });
      await this.tracks.onChallengePassed(user.id, taskId);
      if (task.track === "ai") await this.points.awardBadge(user.id, "ai-explorer");
    }

    return result;
  }

  // =========================================================================
  // Post-solve solutions gallery (Codewars/Exercism-style) — see
  // docs/superpowers/specs/2026-07-04-competitor-iterations.md (Iteration 3).
  //
  // Youth-safety: every read/write below is gated on the caller themselves
  // having a PASSED submission for the task, so a student can never peek at
  // (or like) other solutions before solving it themselves ("no spoiling").
  // The gallery response is fully anonymized — no author id/displayName/email
  // is ever attached to a solution row.
  // =========================================================================

  /** Throws if `userId` has no passed submission for `taskId` (the shared gate
   *  for viewing and liking other students' solutions). */
  private async assertPassedTask(userId: string, taskId: string): Promise<void> {
    const passed = await this.prisma.submission.findFirst({
      where: { userId, taskId, status: "passed" },
      select: { id: true },
    });
    if (!passed) {
      throw new ForbiddenException("Solve it first to see other solutions.");
    }
  }

  /**
   * GET /challenges/:taskId/solutions — up to 20 other students' accepted
   * solutions for this task (never the caller's own), deduped to one per
   * author (their latest passed submission), ordered by likeCount desc then
   * recency. Anonymized: no author info is attached to the response.
   */
  async getChallengeSolutions(user: AuthUser, taskId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true, language: true },
    });
    if (!task) throw new NotFoundException("Challenge not found");

    await this.assertPassedTask(user.id, taskId);

    // Bounded pull of the most recent passed submissions for this task from
    // other authors — enough to dedup-by-author and still fill a top-20
    // gallery even on a popular task with many low-like submissions.
    const candidates = await this.prisma.submission.findMany({
      where: { taskId, status: "passed", userId: { not: user.id } },
      orderBy: { createdAt: "desc" },
      take: 500,
      select: {
        id: true,
        userId: true,
        code: true,
        isExemplar: true,
        createdAt: true,
        _count: { select: { likes: true } },
      },
    });

    // Dedup to one solution per author. Candidates are already ordered by
    // createdAt desc, so the first occurrence per userId is their latest.
    const seenAuthors = new Set<string>();
    const deduped: typeof candidates = [];
    for (const c of candidates) {
      if (seenAuthors.has(c.userId)) continue;
      seenAuthors.add(c.userId);
      deduped.push(c);
    }

    const likedRows = deduped.length
      ? await this.prisma.solutionLike.findMany({
          where: { userId: user.id, submissionId: { in: deduped.map((d) => d.id) } },
          select: { submissionId: true },
        })
      : [];
    const likedSet = new Set(likedRows.map((l) => l.submissionId));

    const solutions = deduped
      .map((c) => ({
        submissionId: c.id,
        language: task.language,
        code: c.code ?? "",
        likeCount: c._count.likes,
        likedByMe: likedSet.has(c.id),
        exemplar: c.isExemplar,
        _createdAt: c.createdAt, // sort key only — stripped before returning
      }))
      .sort((a, b) => b.likeCount - a.likeCount || b._createdAt.getTime() - a._createdAt.getTime())
      .slice(0, 20)
      .map(({ _createdAt, ...row }) => row);

    return { solutions };
  }

  /**
   * POST /challenges/solutions/:submissionId/like — toggle the caller's like
   * on another student's accepted solution. Gated the same way as the gallery
   * read (caller must have passed the task); the target submission must
   * itself be passed, and a student can't like their own solution.
   */
  async toggleSolutionLike(user: AuthUser, submissionId: string) {
    const submission = await this.prisma.submission.findUnique({
      where: { id: submissionId },
      select: { id: true, taskId: true, status: true, userId: true },
    });
    if (!submission) throw new NotFoundException("Solution not found");
    if (submission.status !== "passed") {
      throw new ForbiddenException("You can only like accepted solutions.");
    }
    if (submission.userId === user.id) {
      throw new ForbiddenException("You can't like your own solution.");
    }
    await this.assertPassedTask(user.id, submission.taskId);

    // Toggle: delete-then-create (mirrors posts.service.ts's like toggle).
    // The @@unique([submissionId, userId]) constraint makes a concurrent
    // double-create race safe — caught below and treated as already-liked.
    return this.prisma.$transaction(async (tx) => {
      const del = await tx.solutionLike.deleteMany({ where: { submissionId, userId: user.id } });
      if (del.count > 0) {
        const likeCount = await tx.solutionLike.count({ where: { submissionId } });
        return { liked: false, likeCount };
      }
      try {
        await tx.solutionLike.create({ data: { submissionId, userId: user.id } });
      } catch (e) {
        if (!(e && typeof e === "object" && (e as { code?: string }).code === "P2002")) throw e;
      }
      const likeCount = await tx.solutionLike.count({ where: { submissionId } });
      return { liked: true, likeCount };
    });
  }

  /**
   * POST /challenges/solutions/:submissionId/exemplar — teacher/admin toggle
   * for curating a solution as the highlighted exemplar in the gallery.
   * Gated by the `content.author` capability (teacher/school_admin/super_admin
   * — see domain/roles.ts), the same capability used to author lesson content.
   */
  async toggleSolutionExemplar(submissionId: string) {
    const submission = await this.prisma.submission.findUnique({
      where: { id: submissionId },
      select: { id: true, status: true, isExemplar: true },
    });
    if (!submission) throw new NotFoundException("Solution not found");
    if (submission.status !== "passed") {
      throw new BadRequestException("Only accepted solutions can be marked as an exemplar.");
    }
    const updated = await this.prisma.submission.update({
      where: { id: submissionId },
      data: { isExemplar: !submission.isExemplar },
      select: { isExemplar: true },
    });
    return { ok: true, isExemplar: updated.isExemplar };
  }
}
