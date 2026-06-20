"use server";

import { revalidatePath } from "next/cache";
import { apiPost, ApiError } from "@/lib/api/client";

// ---------------------------------------------------------------------------
// Approve a user approval request
// ---------------------------------------------------------------------------

export async function approveUser(userId: string) {
  try {
    await apiPost(`/admin/users/${userId}/approve`);
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message };
    throw e;
  }

  revalidatePath("/app/admin/approvals");
  revalidatePath("/app/admin/users");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Reject a user approval request
// ---------------------------------------------------------------------------

export async function rejectUser(userId: string, reason?: string) {
  try {
    await apiPost(`/admin/users/${userId}/reject`, { reason });
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message };
    throw e;
  }

  revalidatePath("/app/admin/approvals");
  revalidatePath("/app/admin/users");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Approve a tenant (school) — activates tenant + its pending school_admin users
// ---------------------------------------------------------------------------

export async function approveTenant(tenantId: string) {
  try {
    await apiPost(`/admin/tenants/${tenantId}/approve`);
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message };
    throw e;
  }

  revalidatePath("/app/admin/tenants");
  revalidatePath("/app/admin/approvals");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Suspend a user
// ---------------------------------------------------------------------------

export async function suspendUser(userId: string) {
  try {
    await apiPost(`/admin/users/${userId}/suspend`);
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message };
    throw e;
  }

  revalidatePath("/app/admin/users");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Reinstate a user
// ---------------------------------------------------------------------------

export async function reinstateUser(userId: string) {
  try {
    await apiPost(`/admin/users/${userId}/reinstate`);
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message };
    throw e;
  }

  revalidatePath("/app/admin/users");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Suspend a tenant
// ---------------------------------------------------------------------------

export async function suspendTenant(tenantId: string) {
  try {
    await apiPost(`/admin/tenants/${tenantId}/suspend`);
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message };
    throw e;
  }

  revalidatePath("/app/admin/tenants");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Reinstate a tenant
// ---------------------------------------------------------------------------

export async function reinstateTenant(tenantId: string) {
  try {
    await apiPost(`/admin/tenants/${tenantId}/reinstate`);
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message };
    throw e;
  }

  revalidatePath("/app/admin/tenants");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Resolve a moderation case
// ---------------------------------------------------------------------------

export async function resolveModeration(caseId: string, action: "resolved" | "dismissed") {
  try {
    await apiPost(`/admin/moderation/${caseId}/resolve`, { action });
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message };
    throw e;
  }

  revalidatePath("/app/admin/moderation");
  return { ok: true };
}
