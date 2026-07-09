import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { PointsService } from "./points.service";
import { POINTS } from "../domain/constants";

/**
 * Shape persisted at `user.prefs.streak` (Json column — merged, never
 * clobbers other prefs keys). `embers` and `frozenUntil` are additive:
 * absent on old rows, defaulted to `embers=0` / no freeze when read.
 */
type StreakPrefs = { count: number; lastActiveDate: string; embers?: number; frozenUntil?: string };

/** Streak lengths that pay a one-time RoboPoints bonus (paid once ever per user+count via idemKey). */
const STREAK_MILESTONES = [3, 7, 30] as const;

/** Streak lengths that additionally grant a "freeze" (multi-day miss protection) as a milestone reward. */
const FREEZE_MILESTONES = [7, 30] as const;

/** Ember bank cap — forgiving-streak protection is meant to be occasional, not unlimited. */
const MAX_EMBERS = 3;

/** How many days a freeze protects the streak for once granted (today + N days). */
const FREEZE_DURATION_DAYS = 2;

/** Today's date as YYYY-MM-DD, UTC. */
function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Whole calendar days between `earlier` and `later` (both YYYY-MM-DD, UTC); NaN if unparseable. */
function dayGap(earlier: string, later: string): number {
  const t = Date.parse(`${later}T00:00:00.000Z`);
  const y = Date.parse(`${earlier}T00:00:00.000Z`);
  if (Number.isNaN(t) || Number.isNaN(y)) return NaN;
  return Math.round((t - y) / 86_400_000);
}

/** `date` (YYYY-MM-DD, UTC) shifted forward by `days`. */
function addDaysUtc(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

@Injectable()
export class StreakService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly points: PointsService,
  ) {}

  /**
   * Bump (or reset) a user's daily-active streak, stored in `User.prefs.streak`
   * (no migration needed — `prefs` is already a free-form Json column).
   *
   * Rules (all dates YYYY-MM-DD, UTC):
   * - Same calendar day as last touch → no-op.
   * - Exactly the day before ("yesterday") → count++. Every 3rd consecutive
   *   day (count % 3 === 0), bank 1 ember, capped at `MAX_EMBERS`.
   * - Exactly 2 days before ("missed yesterday, back today") AND the user
   *   has an ember → spend 1 ember, treat today as a continuation
   *   (count++), and report `emberSpent: true`. The streak survives a
   *   single missed day.
   * - Otherwise, if a freeze is active (`frozenUntil` set and `today` is on
   *   or before it) → the freeze absorbs the gap regardless of embers:
   *   count++, the freeze is consumed (cleared), and `frozen: true` is
   *   reported. Freezes are rare — granted as a milestone reward (see
   *   below), not earned day-to-day.
   * - Anything else (gap beyond any protection, or no ember available) →
   *   count resets to 1, as before. Embers already banked are NOT
   *   forfeited by a hard reset — they carry into the next streak.
   *
   * Milestone bonuses (3/7/30) still pay exactly once per user+count via
   * idemKey. Additionally, reaching 7 or 30 grants a freeze
   * (`frozenUntil` = today + `FREEZE_DURATION_DAYS`), on top of the
   * existing RoboPoints bonus.
   *
   * `today` is an optional override (YYYY-MM-DD, UTC) purely for tests — real
   * call sites always use the default (today's actual UTC date).
   *
   * Deliberately NOT called from PointsService.awardPoints (would recurse:
   * touch -> awardPoints -> touch -> ...). Call sites are limited to explicit
   * "user was active today" hooks — currently just auth.service's login. v1
   * scope note: awardPoints-triggered activity (saves, simulation runs, etc.)
   * does NOT bump the streak; only login does. Revisit if product wants a
   * broader definition of "active".
   */
  async touch(
    userId: string,
    today: string = todayUtc(),
  ): Promise<{ count: number; embers: number; emberSpent?: boolean; frozen?: boolean }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { prefs: true } });
    const prefs = (user?.prefs as Record<string, unknown> | null) ?? {};
    const existing = prefs.streak as StreakPrefs | undefined;
    const existingEmbers = existing?.embers ?? 0;

    if (existing?.lastActiveDate === today) {
      return { count: existing.count, embers: existingEmbers }; // already touched today — no-op
    }

    const gap = existing ? dayGap(existing.lastActiveDate, today) : NaN;

    let count: number;
    let embers = existingEmbers;
    let emberSpent = false;
    let frozen = false;
    let frozenUntil = existing?.frozenUntil;

    if (existing && gap === 1) {
      // Consecutive day — normal advance. Bank an ember every 3rd day, capped.
      count = existing.count + 1;
      if (count % 3 === 0 && embers < MAX_EMBERS) {
        embers += 1;
      }
    } else if (existing && gap === 2 && embers > 0) {
      // Missed exactly one day, but an ember absorbs it — streak continues.
      count = existing.count + 1;
      embers -= 1;
      emberSpent = true;
    } else if (frozenUntil && today <= frozenUntil) {
      // A previously-granted freeze absorbs a multi-day gap, regardless of embers.
      count = (existing?.count ?? 0) + 1;
      frozen = true;
      frozenUntil = undefined; // consumed
    } else {
      // Gap beyond any protection (or no ember available) — reset.
      count = 1;
      // Drop a stale/expired freeze so it doesn't linger forever unused.
      if (frozenUntil && today > frozenUntil) {
        frozenUntil = undefined;
      }
    }

    // Milestone freeze grant — in addition to the point bonus below.
    if ((FREEZE_MILESTONES as readonly number[]).includes(count)) {
      frozenUntil = addDaysUtc(today, FREEZE_DURATION_DAYS);
    }

    const nextStreak: StreakPrefs = {
      count,
      lastActiveDate: today,
      embers,
      ...(frozenUntil ? { frozenUntil } : {}),
    };

    // Merge into prefs — spread the existing object so unrelated prefs keys
    // (e.g. UI settings) survive the write.
    await this.prisma.user.update({
      where: { id: userId },
      data: { prefs: { ...prefs, streak: nextStreak } as Prisma.InputJsonValue },
    });

    if ((STREAK_MILESTONES as readonly number[]).includes(count)) {
      // idemKey is keyed on the count reached (not the date), so a milestone
      // pays exactly once per user ever, however many times the streak resets
      // and climbs back through it.
      await this.points.awardPoints({
        userId,
        delta: POINTS.DAILY_STREAK,
        reason: `${count}-day streak`,
        refType: "streak",
        refId: String(count),
        idemKey: `streak-milestone:${userId}:${count}`,
      });
    }

    return {
      count,
      embers,
      ...(emberSpent ? { emberSpent: true } : {}),
      ...(frozen ? { frozen: true } : {}),
    };
  }
}
