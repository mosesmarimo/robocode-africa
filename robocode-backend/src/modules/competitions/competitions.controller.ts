import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { CompetitionsService } from "./competitions.service";
import { CurrentUser, RequireActive } from "../../auth/decorators";
import type { AuthUser } from "../../auth/auth-user.type";
import { ZodPipe } from "../../common/zod.pipe";
import { enterCompetitionSchema, type EnterCompetitionInput, submitSolutionSchema, type SubmitSolutionInput } from "./dto";

@Controller("competitions")
export class CompetitionsController {
  constructor(private readonly competitions: CompetitionsService) {}

  // =========================================================================
  // READS — one per competitions page
  // =========================================================================

  /** /app/competitions — list visible competitions grouped by status + stats. */
  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.competitions.listCompetitions(user);
  }

  /** /app/competitions/[slug] — single competition with rounds + standings. */
  @Get(":slug")
  getOne(@CurrentUser() user: AuthUser, @Param("slug") slug: string) {
    return this.competitions.getCompetition(user, slug);
  }

  // =========================================================================
  // MUTATIONS — one per old action function
  // =========================================================================

  /** enterCompetition — register the current user (or their team) for a competition. */
  @RequireActive()
  @Post(":id/enter")
  enter(
    @CurrentUser() user: AuthUser,
    @Param("id") competitionId: string,
    @Body(new ZodPipe(enterCompetitionSchema)) body: EnterCompetitionInput,
  ) {
    return this.competitions.enterCompetition(user, competitionId, body.teamId);
  }
}

@Controller("challenges")
export class ChallengesController {
  constructor(private readonly competitions: CompetitionsService) {}

  /** /app/challenges — all tasks + the current user's best status per task. */
  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.competitions.listChallenges(user);
  }

  /** /app/challenges/[slug] — a task + the current user's submission history. */
  @Get(":slug")
  getOne(@CurrentUser() user: AuthUser, @Param("slug") slug: string) {
    return this.competitions.getChallenge(user, slug);
  }

  /** submitSolution — auto-grade & record a challenge submission (taskId in path). */
  @RequireActive()
  @Post(":id/submit")
  submit(
    @CurrentUser() user: AuthUser,
    @Param("id") taskId: string,
    @Body(new ZodPipe(submitSolutionSchema)) body: SubmitSolutionInput,
  ) {
    return this.competitions.submitSolution(user, taskId, body.code);
  }
}

@Controller("badges")
export class BadgesController {
  constructor(private readonly competitions: CompetitionsService) {}

  /** /app/badges — all badges + which ones the current user has earned. */
  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.competitions.listBadges(user);
  }
}

@Controller("leaderboard")
export class LeaderboardController {
  constructor(private readonly competitions: CompetitionsService) {}

  /** /app/leaderboard — top students/teams/schools (tenant-scoped) + user ranks. */
  @Get()
  get(@CurrentUser() user: AuthUser) {
    return this.competitions.getLeaderboard(user);
  }
}
