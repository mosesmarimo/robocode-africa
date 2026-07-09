import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { PointsService } from "./points.service";
import { StreakService } from "./streak.service";
import {
  GAMIFICATION_XP,
  LANGUAGE_BADGE_THRESHOLDS,
  trackForLanguage,
  type GamificationTaskType,
} from "../domain/constants";

export type CompleteTaskInput = {
  userId: string;
  type: GamificationTaskType;
  refId: string;
  language?: string | null;
  track?: string | null;
  /** Required for type "challenge" (XP varies by difficulty — see `challengeXp`). Overrides the flat per-type XP table for any type when given. */
  xpOverride?: number;
};

export type CompleteTaskResult = { awarded: number; alreadyDone: boolean };

/**
 * Single funnel every completion path (lesson, tutorial-lesson, tryit,
 * exercise, challenge, course-complete) routes through: awards XP (tagged
 * with language/track for the leaderboard groupBy), bumps the daily streak,
 * and checks badge thresholds — all idempotent per `idemKey =
 * task:<type>:<refId>:<userId>`, so calling it twice for the same
 * user+type+refId never double-pays.
 */
@Injectable()
export class GamificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly points: PointsService,
    private readonly streak: StreakService,
  ) {}

  async completeTask(input: CompleteTaskInput): Promise<CompleteTaskResult> {
    const idemKey = `task:${input.type}:${input.refId}:${input.userId}`;

    // Determine idempotency BEFORE awarding — awardPoints itself is
    // P2002-safe (safe under a race), but we still need to know here whether
    // this call is a genuine first-time completion so we don't re-run the
    // streak/badge side effects (harmless either way since those are
    // themselves idempotent, but wasteful and noisy on repeat calls).
    const existing = await this.prisma.roboPointLedger.findUnique({
      where: { idemKey },
      select: { id: true },
    });
    const alreadyDone = !!existing;

    const xp = input.xpOverride ?? (input.type === "challenge" ? undefined : GAMIFICATION_XP[input.type]);
    if (xp === undefined) {
      throw new Error(`GamificationService.completeTask: xpOverride is required for type "${input.type}"`);
    }

    const track = input.track ?? trackForLanguage(input.language) ?? undefined;

    await this.points.awardPoints({
      userId: input.userId,
      delta: xp,
      reason: `task:${input.type}`,
      refType: input.type,
      refId: input.refId,
      idemKey,
      language: input.language ?? undefined,
      track,
    });

    if (!alreadyDone) {
      await this.streak.touch(input.userId);
      await this.checkBadges(input.userId, input.type, input.language ?? undefined);
    }

    return { awarded: alreadyDone ? 0 : xp, alreadyDone };
  }

  /**
   * Badge checks run only on a genuinely new award (see completeTask above).
   * Generic: `first_run` (first-ever tryit), `ten_exercises` (10th exercise
   * completion). Per-language: `<language>_novice/adept/master` once the
   * user's all-time XP tagged with that language crosses each threshold.
   */
  private async checkBadges(userId: string, type: GamificationTaskType, language?: string) {
    if (type === "tryit") {
      const tryitCount = await this.prisma.roboPointLedger.count({
        where: { userId, refType: "tryit" },
      });
      if (tryitCount === 1) await this.points.awardBadge(userId, "first_run");
    }

    if (type === "exercise") {
      const exerciseCount = await this.prisma.roboPointLedger.count({
        where: { userId, refType: "exercise" },
      });
      if (exerciseCount === 10) await this.points.awardBadge(userId, "ten_exercises");
    }

    if (language) {
      const agg = await this.prisma.roboPointLedger.aggregate({
        where: { userId, language },
        _sum: { delta: true },
      });
      const total = agg._sum.delta ?? 0;
      for (const { threshold, suffix } of LANGUAGE_BADGE_THRESHOLDS) {
        if (total >= threshold) await this.points.awardBadge(userId, `${language}_${suffix}`);
      }
    }
  }
}
