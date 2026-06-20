import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { NotifyService } from "./notify.service";
import { levelForPoints } from "../domain/constants";

type AwardInput = {
  userId: string;
  delta: number;
  reason: string;
  refType?: string;
  refId?: string;
  idemKey?: string;
  teamId?: string;
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
    const ledger = await this.prisma.roboPointLedger.create({
      data: {
        userId: input.userId,
        teamId: input.teamId,
        delta: input.delta,
        reason: input.reason,
        refType: input.refType,
        refId: input.refId,
        idemKey: input.idemKey,
      },
    });

    const user = await this.prisma.user.findUnique({ where: { id: input.userId } });
    if (user) {
      const total = user.roboPoints + input.delta;
      const newLevel = levelForPoints(total);
      await this.prisma.user.update({
        where: { id: user.id },
        data: { roboPoints: total, level: newLevel },
      });
      if (newLevel > user.level) {
        await this.notifier.notify({
          userId: user.id,
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
    const awarded = await this.prisma.userBadge.create({ data: { userId, badgeId: badge.id } });
    await this.notifier.notify({
      userId,
      type: "badge",
      title: `Badge unlocked: ${badge.name}`,
      body: badge.description,
    });
    return awarded;
  }
}
