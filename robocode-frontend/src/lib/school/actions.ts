"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { can } from "@/lib/domain/roles";
import { notify } from "@/lib/notify";

// ---------------------------------------------------------------------------
// Internal guard helper
// ---------------------------------------------------------------------------
async function getSchoolAdmin() {
  const user = (await getCurrentUser())!;
  if (!can(user.role, "tenant.manage")) {
    throw new Error("FORBIDDEN");
  }
  return user;
}

// ---------------------------------------------------------------------------
// Student approvals
// ---------------------------------------------------------------------------

export async function approveStudent(userId: string) {
  const actor = await getSchoolAdmin();

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target || target.tenantId !== actor.tenantId) throw new Error("NOT_FOUND");

  await prisma.user.update({ where: { id: userId }, data: { status: "active" } });

  await prisma.approvalRequest.upsert({
    where: { userId },
    create: {
      userId,
      tenantId: actor.tenantId,
      type: "student_school",
      status: "approved",
      decidedById: actor.id,
      decidedAt: new Date(),
    },
    update: {
      status: "approved",
      decidedById: actor.id,
      decidedAt: new Date(),
      reason: null,
    },
  });

  await notify({
    userId,
    type: "approval",
    title: "Your account has been approved!",
    body: "Welcome to RoboCode.Africa — you can now log in and start building.",
  });

  await prisma.auditLog.create({
    data: {
      tenantId: actor.tenantId,
      actorId: actor.id,
      action: "student.approve",
      targetType: "User",
      targetId: userId,
    },
  });

  revalidatePath("/app/school/approvals");
  revalidatePath("/app/school/members");
}

export async function rejectStudent(userId: string, reason?: string) {
  const actor = await getSchoolAdmin();

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target || target.tenantId !== actor.tenantId) throw new Error("NOT_FOUND");

  await prisma.user.update({ where: { id: userId }, data: { status: "rejected" } });

  await prisma.approvalRequest.upsert({
    where: { userId },
    create: {
      userId,
      tenantId: actor.tenantId,
      type: "student_school",
      status: "rejected",
      decidedById: actor.id,
      decidedAt: new Date(),
      reason: reason ?? null,
    },
    update: {
      status: "rejected",
      decidedById: actor.id,
      decidedAt: new Date(),
      reason: reason ?? null,
    },
  });

  await notify({
    userId,
    type: "approval",
    title: "Your registration was not approved",
    body: reason
      ? `Reason: ${reason}. Please contact your school administrator for more information.`
      : "Please contact your school administrator for more information.",
  });

  await prisma.auditLog.create({
    data: {
      tenantId: actor.tenantId,
      actorId: actor.id,
      action: "student.reject",
      targetType: "User",
      targetId: userId,
      meta: { reason },
    },
  });

  revalidatePath("/app/school/approvals");
  revalidatePath("/app/school/members");
}

// ---------------------------------------------------------------------------
// Member management
// ---------------------------------------------------------------------------

export async function suspendStudent(userId: string) {
  const actor = await getSchoolAdmin();

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target || target.tenantId !== actor.tenantId) throw new Error("NOT_FOUND");

  await prisma.user.update({ where: { id: userId }, data: { status: "suspended" } });

  await notify({
    userId,
    type: "account",
    title: "Your account has been suspended",
    body: "Please contact your school administrator for more information.",
  });

  await prisma.auditLog.create({
    data: {
      tenantId: actor.tenantId,
      actorId: actor.id,
      action: "user.suspend",
      targetType: "User",
      targetId: userId,
    },
  });

  revalidatePath("/app/school/members");
}

export async function reinstateStudent(userId: string) {
  const actor = await getSchoolAdmin();

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target || target.tenantId !== actor.tenantId) throw new Error("NOT_FOUND");

  await prisma.user.update({ where: { id: userId }, data: { status: "active" } });

  await notify({
    userId,
    type: "account",
    title: "Your account has been reinstated",
    body: "You can now log in and continue your RoboCode.Africa journey.",
  });

  await prisma.auditLog.create({
    data: {
      tenantId: actor.tenantId,
      actorId: actor.id,
      action: "user.reinstate",
      targetType: "User",
      targetId: userId,
    },
  });

  revalidatePath("/app/school/members");
}

// ---------------------------------------------------------------------------
// Branding
// ---------------------------------------------------------------------------

type BrandingInput = {
  primary: string;
  secondary: string;
  accent: string;
  tagline: string;
  logoUrl?: string;
};

export async function updateBranding(input: BrandingInput) {
  const actor = await getSchoolAdmin();
  if (!can(actor.role, "tenant.branding")) throw new Error("FORBIDDEN");

  const tenant = await prisma.tenant.findUnique({ where: { id: actor.tenantId } });
  if (!tenant) throw new Error("NOT_FOUND");

  const existing = (tenant.branding ?? {}) as Record<string, unknown>;
  const merged = {
    ...existing,
    primary: input.primary,
    secondary: input.secondary,
    accent: input.accent,
    tagline: input.tagline,
    ...(input.logoUrl !== undefined ? { logoUrl: input.logoUrl } : {}),
  };

  await prisma.tenant.update({
    where: { id: actor.tenantId },
    data: { branding: merged },
  });

  await prisma.auditLog.create({
    data: {
      tenantId: actor.tenantId,
      actorId: actor.id,
      action: "tenant.branding.update",
      targetType: "Tenant",
      targetId: actor.tenantId,
    },
  });

  revalidatePath("/app/school/branding");
  revalidatePath("/app");
}

// ---------------------------------------------------------------------------
// Policies
// ---------------------------------------------------------------------------

type PoliciesInput = {
  autoApprove: boolean;
};

export async function setPolicies(input: PoliciesInput) {
  const actor = await getSchoolAdmin();

  const tenant = await prisma.tenant.findUnique({ where: { id: actor.tenantId } });
  if (!tenant) throw new Error("NOT_FOUND");

  const existing = (tenant.policies ?? {}) as Record<string, unknown>;
  const merged = { ...existing, autoApprove: input.autoApprove };

  await prisma.tenant.update({
    where: { id: actor.tenantId },
    data: { policies: merged },
  });

  await prisma.auditLog.create({
    data: {
      tenantId: actor.tenantId,
      actorId: actor.id,
      action: "tenant.policies.update",
      targetType: "Tenant",
      targetId: actor.tenantId,
      meta: { autoApprove: input.autoApprove },
    },
  });

  revalidatePath("/app/school/approvals");
  revalidatePath("/app/school/members");
}
