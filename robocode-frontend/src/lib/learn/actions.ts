"use server";

import { revalidatePath } from "next/cache";
import { apiPost } from "@/lib/api/client";
import type { GradeResult } from "@/lib/sim/grader";

export async function enroll(courseId: string) {
  await apiPost("/learn/enroll", { courseId });
  revalidatePath(`/app/learn`);
  return { ok: true };
}

export async function completeLesson(lessonId: string, courseId: string) {
  const result = await apiPost<{ ok: boolean; already?: boolean; percent?: number }>(
    "/learn/complete-lesson",
    { lessonId, courseId },
  );
  revalidatePath(`/app/learn`);
  return result;
}

export async function submitSolution(taskId: string, code: string): Promise<GradeResult> {
  const result = await apiPost<GradeResult>(`/challenges/${taskId}/submit`, { code });
  revalidatePath(`/app/challenges`);
  return result;
}
