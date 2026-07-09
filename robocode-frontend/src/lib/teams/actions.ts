"use server";

import { revalidatePath } from "next/cache";
import { apiPost, ApiError } from "@/lib/api/client";

// ---------------------------------------------------------------------------
// createTeam
// ---------------------------------------------------------------------------

export async function createTeam(name: string, description: string) {
  let result: { teamId?: string; error?: string };
  try {
    result = await apiPost<{ teamId?: string; error?: string }>("/teams", { name, description });
  } catch (e) {
    if (e instanceof ApiError) {
      return e.fieldErrors ? { fieldErrors: e.fieldErrors } : { error: e.message };
    }
    throw e;
  }

  // The backend returns {error} with HTTP 200 for soft rejections (e.g. name
  // too short) instead of throwing — surface those and never navigate to an
  // undefined team id.
  if (result?.error || !result.teamId) {
    return { error: result?.error ?? "Could not create team." };
  }

  revalidatePath("/app/teams");
  return { teamId: result.teamId };
}

// ---------------------------------------------------------------------------
// joinTeam
// ---------------------------------------------------------------------------

export async function joinTeam(teamId: string) {
  let result: { ok?: boolean; error?: string };
  try {
    result = await apiPost<{ ok?: boolean; error?: string }>(`/teams/${teamId}/join`);
  } catch (e) {
    if (e instanceof ApiError) {
      return e.fieldErrors ? { fieldErrors: e.fieldErrors } : { error: e.message };
    }
    throw e;
  }

  // The backend returns {error} with HTTP 200 for soft rejections (team full,
  // already a member, not found) instead of throwing — surface those.
  if (result?.error) return { error: result.error };

  revalidatePath("/app/teams");
  revalidatePath(`/app/teams/${teamId}`);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// leaveTeam
// ---------------------------------------------------------------------------

export async function leaveTeam(teamId: string) {
  try {
    await apiPost(`/teams/${teamId}/leave`);
  } catch (e) {
    if (e instanceof ApiError) {
      return e.fieldErrors ? { fieldErrors: e.fieldErrors } : { error: e.message };
    }
    throw e;
  }

  revalidatePath("/app/teams");
  revalidatePath(`/app/teams/${teamId}`);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// postMessage
// ---------------------------------------------------------------------------

export async function postMessage(teamId: string, body: string) {
  let result: { messageId?: string; status?: string; error?: string };
  try {
    result = await apiPost<{ messageId?: string; status?: string; error?: string }>(
      `/teams/${teamId}/messages`,
      { body },
    );
  } catch (e) {
    if (e instanceof ApiError) {
      return e.fieldErrors ? { fieldErrors: e.fieldErrors } : { error: e.message };
    }
    throw e;
  }

  // The backend returns {error} with HTTP 200 for validation/membership
  // failures instead of throwing — surface those so the optimistic message is
  // rolled back rather than stamped with undefined id/status.
  if (result?.error || !result.messageId) {
    return { error: result?.error ?? "Couldn't send message." };
  }

  revalidatePath(`/app/teams/${teamId}`);
  return { messageId: result.messageId, status: result.status ?? "approved" };
}
