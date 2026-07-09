"use server";

// Post-pass track nudge — fired from challenge-submit.tsx once a challenge is
// marked as passed, mirroring the auth/cookie-forwarding pattern in
// src/lib/challenges/solutions-actions.ts. Never blocks or interrupts the
// pass celebration: any backend hiccup here just yields an empty nudge.

import { apiGet } from "@/lib/api/client";

/** One row per published track containing the just-passed task (used by the nudge). */
export interface TaskTrackProgress {
  slug: string;
  title: string;
  itemCount: number;
  doneCount: number;
}

/**
 * GET /tracks/for-task/:taskId — tracks containing this task, with derived
 * progress. Swallows ANY failure (backend error, network hiccup) into an
 * empty array — this is a nudge, not a critical read, and must never break
 * the pass celebration it's called from.
 */
export async function getTracksForTask(taskId: string): Promise<TaskTrackProgress[]> {
  try {
    const { tracks } = await apiGet<{ tracks: TaskTrackProgress[] }>(
      `/tracks/for-task/${encodeURIComponent(taskId)}`,
    );
    return tracks;
  } catch {
    return [];
  }
}
