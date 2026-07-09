"use server";

// Completion hook for the `tryit`/`exercise` lesson blocks (see
// components/learn/tryit-block.tsx and exercise-block.tsx). Marked "use
// server" (rather than plain `import "server-only"`) because both renderers
// are "use client" components that call this directly — "use server" is what
// makes that safe (Next swaps the client-side reference for a fetch stub at
// build time), the same pattern src/lib/learn/actions.ts already uses for
// completeLesson/submitSolution.
//
// Wired against POST /learn/complete-task { type, refId, language } ->
// { awarded, alreadyDone } (robocode-backend src/modules/learn/learn.controller.ts).
// That route landed in parallel with this task; if it's ever missing (404) or
// the backend is briefly down, this swallows the error and returns null so
// the tryit/exercise UI degrades gracefully — no XP toast fires, but the
// run/check/reveal action the user actually asked for still completes.
import { apiPost, ApiError } from "@/lib/api/client";

export type BlockCompletionInput = {
  type: "tryit" | "exercise";
  language: string;
  /** Stable id for the block within its lesson (e.g. `${lessonId}#${index}`). */
  refId: string;
};

export type BlockCompletionResult = { awarded: number; alreadyDone: boolean };

export async function recordBlockCompletion(input: BlockCompletionInput): Promise<BlockCompletionResult | null> {
  try {
    return await apiPost<BlockCompletionResult>("/learn/complete-task", {
      type: input.type,
      refId: input.refId,
      language: input.language,
    });
  } catch (e) {
    if (e instanceof ApiError) return null; // 404 (not deployed yet), 401, validation, etc. — non-fatal
    if (process.env.NODE_ENV !== "production") {
      console.debug("[learn] recordBlockCompletion failed (non-fatal):", e);
    }
    return null;
  }
}
