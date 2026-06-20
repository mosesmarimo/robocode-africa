"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { can } from "@/lib/domain/roles";
import { notify } from "@/lib/notify";

// ---------------------------------------------------------------------------
// Guards
// ---------------------------------------------------------------------------

async function requirePlatformManage() {
  const user = (await getCurrentUser())!;
  if (!can(user.role, "platform.manage")) throw new Error("FORBIDDEN");
  return user;
}

async function requireModerationOrPlatform() {
  const user = (await getCurrentUser())!;
  if (!can(user.role, "platform.manage") && !can(user.role, "moderation.manage")) {
    throw new Error("FORBIDDEN");
  }
  return user;
}

// ---------------------------------------------------------------------------
// Approve a user approval request
// ---------------------------------------------------------------------------

export async function approveUser(userId: string) {
  const actor = await requireModerationOrPlatform();

  const approval = await prisma.approvalRequest.findUnique({ where: { userId } });
  if (!approval) throw new Error("No approval request found");

  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { status: "active" } }),
    prisma.approvalRequest.update({
      where: { userId },
      data: { status: "approved", decidedById: actor.id, decidedAt: new Date() },
    }),
    prisma.auditLog.create({
      data: {
        actorId: actor.id,
        action: "user.approve",
        targetType: "User",
        targetId: userId,
        meta: { approvalId: approval.id },
      },
    }),
  ]);

  await notify({
    userId,
    type: "approval",
    title: "Your account has been approved!",
    body: "Welcome to RoboCode.Africa — your account is now active. Start building!",
  });

  revalidatePath("/app/admin/approvals");
  revalidatePath("/app/admin/users");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Reject a user approval request
// ---------------------------------------------------------------------------

export async function rejectUser(userId: string, reason?: string) {
  const actor = await requireModerationOrPlatform();

  const approval = await prisma.approvalRequest.findUnique({ where: { userId } });
  if (!approval) throw new Error("No approval request found");

  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { status: "rejected" } }),
    prisma.approvalRequest.update({
      where: { userId },
      data: {
        status: "rejected",
        decidedById: actor.id,
        decidedAt: new Date(),
        reason: reason ?? null,
      },
    }),
    prisma.auditLog.create({
      data: {
        actorId: actor.id,
        action: "user.reject",
        targetType: "User",
        targetId: userId,
        meta: { reason: reason ?? null },
      },
    }),
  ]);

  await notify({
    userId,
    type: "approval_rejected",
    title: "Account application not approved",
    body: reason
      ? `Your account was not approved. Reason: ${reason}`
      : "Your account application was not approved. Please contact your school administrator.",
  });

  revalidatePath("/app/admin/approvals");
  revalidatePath("/app/admin/users");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Approve a tenant (school) — activates tenant + its pending school_admin users
// ---------------------------------------------------------------------------

export async function approveTenant(tenantId: string) {
  const actor = await requirePlatformManage();

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) throw new Error("Tenant not found");

  // Find all pending school_admin users for this tenant
  const pendingAdmins = await prisma.user.findMany({
    where: { tenantId, role: "school_admin", status: "pending" },
    select: { id: true },
  });

  const adminIds = pendingAdmins.map((u) => u.id);

  await prisma.$transaction([
    prisma.tenant.update({ where: { id: tenantId }, data: { status: "active" } }),
    // Activate all pending school admins
    prisma.user.updateMany({
      where: { id: { in: adminIds } },
      data: { status: "active" },
    }),
    // Approve their approval requests
    prisma.approvalRequest.updateMany({
      where: { userId: { in: adminIds }, status: "pending" },
      data: { status: "approved", decidedById: actor.id, decidedAt: new Date() },
    }),
    prisma.auditLog.create({
      data: {
        tenantId,
        actorId: actor.id,
        action: "tenant.approve",
        targetType: "Tenant",
        targetId: tenantId,
        meta: { activatedAdmins: adminIds },
      },
    }),
  ]);

  // Notify each activated school admin
  await Promise.all(
    adminIds.map((uid) =>
      notify({
        userId: uid,
        type: "tenant_approved",
        title: `${tenant.name} has been approved!`,
        body: "Your school is now live on RoboCode.Africa. Log in to set up your classes.",
      }),
    ),
  );

  revalidatePath("/app/admin/tenants");
  revalidatePath("/app/admin/approvals");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Suspend a user
// ---------------------------------------------------------------------------

export async function suspendUser(userId: string) {
  const actor = await requirePlatformManage();

  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { status: "suspended" } }),
    prisma.auditLog.create({
      data: {
        actorId: actor.id,
        action: "user.suspend",
        targetType: "User",
        targetId: userId,
      },
    }),
  ]);

  await notify({
    userId,
    type: "account_suspended",
    title: "Your account has been suspended",
    body: "Your account access has been suspended. Contact support if you believe this is in error.",
  });

  revalidatePath("/app/admin/users");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Reinstate a user
// ---------------------------------------------------------------------------

export async function reinstateUser(userId: string) {
  const actor = await requirePlatformManage();

  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { status: "active" } }),
    prisma.auditLog.create({
      data: {
        actorId: actor.id,
        action: "user.reinstate",
        targetType: "User",
        targetId: userId,
      },
    }),
  ]);

  await notify({
    userId,
    type: "account_reinstated",
    title: "Your account has been reinstated",
    body: "Welcome back! Your account access has been restored.",
  });

  revalidatePath("/app/admin/users");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Suspend a tenant
// ---------------------------------------------------------------------------

export async function suspendTenant(tenantId: string) {
  const actor = await requirePlatformManage();

  await prisma.$transaction([
    prisma.tenant.update({ where: { id: tenantId }, data: { status: "suspended" } }),
    prisma.auditLog.create({
      data: {
        tenantId,
        actorId: actor.id,
        action: "tenant.suspend",
        targetType: "Tenant",
        targetId: tenantId,
      },
    }),
  ]);

  revalidatePath("/app/admin/tenants");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Reinstate a tenant
// ---------------------------------------------------------------------------

export async function reinstateTenant(tenantId: string) {
  const actor = await requirePlatformManage();

  await prisma.$transaction([
    prisma.tenant.update({ where: { id: tenantId }, data: { status: "active" } }),
    prisma.auditLog.create({
      data: {
        tenantId,
        actorId: actor.id,
        action: "tenant.reinstate",
        targetType: "Tenant",
        targetId: tenantId,
      },
    }),
  ]);

  revalidatePath("/app/admin/tenants");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Resolve a moderation case
// ---------------------------------------------------------------------------

export async function resolveModeration(caseId: string, action: "resolved" | "dismissed") {
  const actor = await requireModerationOrPlatform();

  await prisma.$transaction([
    prisma.moderationCase.update({
      where: { id: caseId },
      data: {
        status: action,
        resolvedById: actor.id,
      },
    }),
    prisma.auditLog.create({
      data: {
        actorId: actor.id,
        action: `moderation.${action}`,
        targetType: "ModerationCase",
        targetId: caseId,
      },
    }),
  ]);

  revalidatePath("/app/admin/moderation");
  return { ok: true };
}
