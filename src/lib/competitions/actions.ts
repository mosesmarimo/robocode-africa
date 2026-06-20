"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { awardPoints, awardBadge } from "@/lib/points";

export async function enterCompetition(competitionId: string, teamId?: string) {
  const user = (await getCurrentUser())!;

  // Verify competition exists and is open for entries
  const competition = await prisma.competition.findUnique({
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

  const existing = await prisma.competitionEntry.findFirst({ where: existingWhere });
  if (existing) {
    return { ok: false, error: "You have already entered this competition." };
  }

  // Create the entry
  const entry = await prisma.competitionEntry.create({
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
    awardBadge(user.id, "competitor"),
    awardPoints({
      userId: user.id,
      delta: 75,
      reason: "Joined a competition",
      refType: "competition",
      refId: competitionId,
      idemKey,
      teamId: teamId ?? undefined,
    }),
  ]);

  revalidatePath("/app/competitions");
  revalidatePath(`/app/competitions/${competition.slug}`);

  return { ok: true, entryId: entry.id };
}
