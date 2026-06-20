"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/auth/current-user";
import { isStaff } from "@/lib/domain/roles";
import { awardPoints, awardBadge } from "@/lib/points";
import type { Diagram } from "@/lib/domain/diagram";

async function canEdit(projectOwnerId: string, projectTenantId: string) {
  const user = await requireActiveUser();
  if (user.id === projectOwnerId) return user;
  if (isStaff(user.role) && user.tenantId === projectTenantId) return user;
  throw new Error("FORBIDDEN");
}

export async function saveProject(input: {
  projectId: string;
  title: string;
  board: string;
  diagram: Diagram;
  code: string;
}) {
  const project = await prisma.project.findUnique({ where: { id: input.projectId } });
  if (!project) throw new Error("NOT_FOUND");
  await canEdit(project.ownerId, project.tenantId);

  await prisma.project.update({
    where: { id: project.id },
    data: {
      title: input.title,
      boardType: input.board,
      diagram: input.diagram as object,
    },
  });

  const existing = await prisma.codeFile.findFirst({ where: { projectId: project.id, filename: "sketch.ino" } });
  if (existing) {
    await prisma.codeFile.update({ where: { id: existing.id }, data: { content: input.code } });
  } else {
    await prisma.codeFile.create({
      data: { projectId: project.id, filename: "sketch.ino", language: "arduino", content: input.code },
    });
  }
  return { ok: true };
}

export async function createProject(input: { title: string; board: string; diagram: Diagram; code: string }) {
  const user = await requireActiveUser();
  const project = await prisma.project.create({
    data: {
      ownerId: user.id,
      tenantId: user.tenantId,
      title: input.title || "Untitled Project",
      boardType: input.board,
      diagram: input.diagram as object,
      visibility: "private",
    },
  });
  await prisma.codeFile.create({
    data: { projectId: project.id, filename: "sketch.ino", language: "arduino", content: input.code },
  });
  await awardPoints({ userId: user.id, delta: 10, reason: "Created a project", refType: "project", refId: project.id, idemKey: `proj-create-${project.id}` });
  await awardBadge(user.id, "first-steps");
  redirect(`/studio/${project.id}`);
}

export async function recordSimulationRun(projectId: string) {
  const user = await requireActiveUser();
  await prisma.simulationRun.create({ data: { projectId, status: "ok" } });
  await awardPoints({ userId: user.id, delta: 30, reason: "First simulation", refType: "project", refId: projectId, idemKey: `first-sim-${user.id}` });
  await awardBadge(user.id, "blink-master");
  return { ok: true };
}
