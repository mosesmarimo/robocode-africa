import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { NotifyService } from "./notify.service";
import { levelForPoints } from "../domain/constants";

function isUniqueConstraintError(e: unknown): boolean {
  return !!e && typeof e === "object" && (e as { code?: string }).code === "P2002";
}

type AwardInput = {
  userId: string;
  delta: number;
  reason: string;
  refType?: string;
  refId?: string;
  idemKey?: string;
  teamId?: string;
  // Gamification/leaderboard tags (additive/optional — existing callers are
  // unaffected and simply leave these columns null).
  language?: string | null;
  track?: string | null;
};

@Injectable()
export class PointsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifier: NotifyService,
  ) {}

  /** Award RoboPoints idempotently; updates user totals, level, and team total. */
  async awardPoints(input: AwardInput) {
    if (input.idemKey) {
      const existing = await this.prisma.roboPointLedger.findUnique({ where: { idemKey: input.idemKey } });
      if (existing) return existing;
    }
    let ledger;
    try {
      ledger = await this.prisma.roboPointLedger.create({
        data: {
          userId: input.userId,
          teamId: input.teamId,
          delta: input.delta,
          reason: input.reason,
          refType: input.refType,
          refId: input.refId,
          idemKey: input.idemKey,
          language: input.language ?? undefined,
          track: input.track ?? undefined,
        },
      });
    } catch (err) {
      // Lost a check-then-create race to a concurrent awardPoints call with
      // the same idemKey (e.g. a double-clicked admin approval firing two
      // settleIfActive calls for the same referee). The winning call's
      // create() already applied the reward, so the User/Team increments
      // below must NOT run again for us — return the winner's ledger row and
      // treat this call as a no-op idempotency hit.
      if (input.idemKey && isUniqueConstraintError(err)) {
        const existing = await this.prisma.roboPointLedger.findUnique({ where: { idemKey: input.idemKey } });
        if (existing) return existing;
      }
      throw err;
    }

    // Atomic increment avoids lost updates from concurrent awards.
    const updated = await this.prisma.user.update({
      where: { id: input.userId },
      data: { roboPoints: { increment: input.delta } },
      select: { id: true, roboPoints: true, level: true },
    });
    const newLevel = levelForPoints(updated.roboPoints);
    if (newLevel > updated.level) {
      // Conditionally bump the level: only the single writer that actually moves
      // level past its previous value reports the level-up. updateMany with a
      // `level: { lt: newLevel }` predicate is atomic, so concurrent awards can't
      // both notify for the same level.
      const res = await this.prisma.user.updateMany({
        where: { id: updated.id, level: { lt: newLevel } },
        data: { level: newLevel },
      });
      if (res.count === 1) {
        await this.notifier.notify({
          userId: updated.id,
          type: "level_up",
          title: `Level ${newLevel} reached!`,
          body: `You earned enough RoboPoints to reach level ${newLevel}. Keep building!`,
        });
      }
    }

    if (input.teamId) {
      await this.prisma.team.update({
        where: { id: input.teamId },
        data: { roboPoints: { increment: input.delta } },
      });
    }

    return ledger;
  }

  async awardBadge(userId: string, code: string) {
    const badge = await this.prisma.badge.findUnique({ where: { code } });
    if (!badge) return null;
    const existing = await this.prisma.userBadge.findUnique({
      where: { userId_badgeId: { userId, badgeId: badge.id } },
    });
    if (existing) return existing;
    try {
      const awarded = await this.prisma.userBadge.create({ data: { userId, badgeId: badge.id } });
      await this.notifier.notify({
        userId,
        type: "badge",
        title: `Badge unlocked: ${badge.name}`,
        body: badge.description,
      });
      return awarded;
    } catch (err) {
      // Same check-then-create race as awardPoints above (e.g. two concurrent
      // settleIfActive calls both crossing a recruiter-badge threshold for the
      // same user): the loser's create() hits the userId_badgeId unique
      // constraint. The winner already awarded + notified — return its row.
      if (isUniqueConstraintError(err)) {
        const raced = await this.prisma.userBadge.findUnique({
          where: { userId_badgeId: { userId, badgeId: badge.id } },
        });
        if (raced) return raced;
      }
      throw err;
    }
  }
}
