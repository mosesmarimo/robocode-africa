"use server";

import { revalidatePath } from "next/cache";
import { apiPost, ApiError } from "@/lib/api/client";

interface EnterCompetitionResult {
  ok: boolean;
  error?: string;
  entryId?: string;
  redirect?: string;
}

export async function enterCompetition(competitionId: string, teamId?: string) {
  let result: EnterCompetitionResult;
  try {
    result = await apiPost<EnterCompetitionResult>(`/competitions/${competitionId}/enter`, { teamId });
  } catch (e) {
    if (e instanceof ApiError) return { ok: false, error: e.message };
    throw e;
  }

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  revalidatePath("/app/competitions");
  if (result.redirect) {
    revalidatePath(result.redirect);
  }

  return { ok: true, entryId: result.entryId };
}
