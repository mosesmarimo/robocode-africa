import "server-only";
import { prisma } from "@/lib/prisma";
import { levelForPoints } from "@/lib/domain/constants";
import { notify } from "@/lib/notify";

type AwardInput = {
  userId: string;
  delta: number;
  reason: string;
  refType?: string;
  refId?: string;
  idemKey?: string;
  teamId?: string;
};

/** Award RoboPoints idempotently; updates user totals, level, and team total. */
export async function awardPoints(input: AwardInput) {
  if (input.idemKey) {
    const existing = await prisma.roboPointLedger.findUnique({ where: { idemKey: input.idemKey } });
    if (existing) return existing;
  }
  const ledger = await prisma.roboPointLedger.create({
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

  const user = await prisma.user.findUnique({ where: { id: input.userId } });
  if (user) {
    const total = user.roboPoints + input.delta;
    const newLevel = levelForPoints(total);
    await prisma.user.update({
      where: { id: user.id },
      data: { roboPoints: total, level: newLevel },
    });
    if (newLevel > user.level) {
      await notify({
        userId: user.id,
        type: "level_up",
        title: `Level ${newLevel} reached!`,
        body: `You earned enough RoboPoints to reach level ${newLevel}. Keep building!`,
      });
    }
  }

  if (input.teamId) {
    await prisma.team.update({
      where: { id: input.teamId },
      data: { roboPoints: { increment: input.delta } },
    });
  }

  return ledger;
}

export async function awardBadge(userId: string, code: string) {
  const badge = await prisma.badge.findUnique({ where: { code } });
  if (!badge) return null;
  const existing = await prisma.userBadge.findUnique({
    where: { userId_badgeId: { userId, badgeId: badge.id } },
  });
  if (existing) return existing;
  const awarded = await prisma.userBadge.create({ data: { userId, badgeId: badge.id } });
  await notify({
    userId,
    type: "badge",
    title: `Badge unlocked: ${badge.name}`,
    body: badge.description,
  });
  return awarded;
}
