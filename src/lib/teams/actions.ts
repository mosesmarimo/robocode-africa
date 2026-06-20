"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { awardBadge } from "@/lib/points";

// ---------------------------------------------------------------------------
// Safety filter
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

// ---------------------------------------------------------------------------
// createTeam
// ---------------------------------------------------------------------------

export async function createTeam(name: string, description: string) {
  const user = (await getCurrentUser())!;

  const trimmedName = name.trim();
  if (!trimmedName || trimmedName.length < 2) {
    return { error: "Team name must be at least 2 characters." };
  }

  const team = await prisma.team.create({
    data: {
      tenantId: user.tenantId,
      name: trimmedName,
      description: description.trim() || null,
      captainId: user.id,
      avatarSeed: trimmedName.toLowerCase().replace(/\s+/g, "-"),
    },
  });

  await prisma.teamMember.create({
    data: {
      teamId: team.id,
      userId: user.id,
      role: "captain",
      status: "active",
    },
  });

  await awardBadge(user.id, "team-player");

  revalidatePath("/app/teams");
  return { teamId: team.id };
}

// ---------------------------------------------------------------------------
// joinTeam
// ---------------------------------------------------------------------------

const MAX_TEAM_SIZE = 8;

export async function joinTeam(teamId: string) {
  const user = (await getCurrentUser())!;

  const team = await prisma.team.findUnique({
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

  await prisma.teamMember.create({
    data: {
      teamId: team.id,
      userId: user.id,
      role: "member",
      status: "active",
    },
  });

  await awardBadge(user.id, "team-player");

  revalidatePath("/app/teams");
  revalidatePath(`/app/teams/${teamId}`);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// leaveTeam
// ---------------------------------------------------------------------------

export async function leaveTeam(teamId: string) {
  const user = (await getCurrentUser())!;

  const membership = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId: user.id } },
    include: { team: true },
  });

  if (!membership) {
    return { error: "You are not a member of this team." };
  }

  if (membership.role === "captain") {
    // Promote oldest other member to captain, or delete team if empty
    const others = await prisma.teamMember.findMany({
      where: { teamId, userId: { not: user.id }, status: "active" },
      orderBy: { id: "asc" },
    });
    if (others.length > 0) {
      // Promote the first member to captain
      await prisma.teamMember.update({
        where: { id: others[0].id },
        data: { role: "captain" },
      });
      await prisma.team.update({
        where: { id: teamId },
        data: { captainId: others[0].userId },
      });
    } else {
      // No other members — delete the team
      await prisma.team.delete({ where: { id: teamId } });
      revalidatePath("/app/teams");
      return { ok: true, dissolved: true };
    }
  }

  await prisma.teamMember.delete({
    where: { teamId_userId: { teamId, userId: user.id } },
  });

  revalidatePath("/app/teams");
  revalidatePath(`/app/teams/${teamId}`);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// postMessage
// ---------------------------------------------------------------------------

export async function postMessage(teamId: string, body: string) {
  const user = (await getCurrentUser())!;

  const trimmed = body.trim();
  if (!trimmed) return { error: "Message cannot be empty." };
  if (trimmed.length > 500) return { error: "Message too long (max 500 characters)." };

  // Only active team members may post
  const membership = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId: user.id } },
  });
  if (!membership || membership.status !== "active") {
    return { error: "You must be a team member to post messages." };
  }

  const safety = filterMessage(trimmed);
  const status = safety === "clean" ? "approved" : "blocked";

  const message = await prisma.chatMessage.create({
    data: {
      teamId,
      userId: user.id,
      body: trimmed,
      status,
    },
  });

  if (status === "blocked") {
    // Open a moderation case
    await prisma.moderationCase.create({
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

  revalidatePath(`/app/teams/${teamId}`);
  return { messageId: message.id, status };
}
