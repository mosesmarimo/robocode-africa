"use server";

import { revalidatePath } from "next/cache";
import { apiPost, ApiError } from "@/lib/api/client";

// ---------------------------------------------------------------------------
// createTeam
// ---------------------------------------------------------------------------

export async function createTeam(name: string, description: string) {
  let result: { teamId: string };
  try {
    result = await apiPost<{ teamId: string }>("/teams", { name, description });
  } catch (e) {
    if (e instanceof ApiError) {
      return e.fieldErrors ? { fieldErrors: e.fieldErrors } : { error: e.message };
    }
    throw e;
  }

  revalidatePath("/app/teams");
  return { teamId: result.teamId };
}

// ---------------------------------------------------------------------------
// joinTeam
// ---------------------------------------------------------------------------

export async function joinTeam(teamId: string) {
  try {
    await apiPost(`/teams/${teamId}/join`);
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
  let result: { messageId: string; status: string };
  try {
    result = await apiPost<{ messageId: string; status: string }>(
      `/teams/${teamId}/messages`,
      { body },
    );
  } catch (e) {
    if (e instanceof ApiError) {
      return e.fieldErrors ? { fieldErrors: e.fieldErrors } : { error: e.message };
    }
    throw e;
  }

  revalidatePath(`/app/teams/${teamId}`);
  return { messageId: result.messageId, status: result.status };
}
