"use server";

// Post-solve solutions gallery — server actions for the two backend endpoints
// in robocode-backend/src/modules/competitions/{competitions.controller,competitions.service}.ts.
// Both endpoints are gated server-side on the caller having themselves PASSED
// the task ("no spoiling"), and the response is fully anonymized (no author
// id/displayName is ever attached) — nothing here should try to add one back.

import { apiGet, apiPost, ApiError } from "@/lib/api/client";

export interface ChallengeSolution {
  submissionId: string;
  // Mirrors Task.language (Prisma): null/"arduino" both mean the Arduino
  // robotics track — see robocode-backend/prisma/schema.prisma.
  language: string | null;
  code: string;
  likeCount: number;
  likedByMe: boolean;
  exemplar: boolean;
}

export type GetSolutionsResult =
  | { ok: true; solutions: ChallengeSolution[] }
  // `locked` distinguishes the expected "solve it first" 403 from a real
  // failure, so the gallery can show a quiet hint instead of an error toast.
  | { ok: false; error: string; locked: boolean };

/** GET /challenges/:taskId/solutions — up to 20 other students' anonymized
 *  accepted solutions. 403s (locked: true) unless the caller has passed it. */
export async function getSolutions(taskId: string): Promise<GetSolutionsResult> {
  try {
    const data = await apiGet<{ solutions: ChallengeSolution[] }>(`/challenges/${taskId}/solutions`);
    return { ok: true, solutions: data.solutions };
  } catch (e) {
    if (e instanceof ApiError) {
      return { ok: false, error: e.message, locked: e.status === 403 };
    }
    return { ok: false, error: "Couldn't load solutions. Please try again.", locked: false };
  }
}

export type LikeSolutionResult =
  | { ok: true; liked: boolean; likeCount: number }
  | { ok: false; error: string };

/** POST /challenges/solutions/:submissionId/like — toggle the caller's like. */
export async function likeSolution(submissionId: string): Promise<LikeSolutionResult> {
  try {
    const data = await apiPost<{ liked: boolean; likeCount: number }>(
      `/challenges/solutions/${submissionId}/like`,
    );
    return { ok: true, ...data };
  } catch (e) {
    if (e instanceof ApiError) return { ok: false, error: e.message };
    return { ok: false, error: "Couldn't update like. Please try again." };
  }
}
