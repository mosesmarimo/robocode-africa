"use server";

import { revalidatePath } from "next/cache";
import { apiPost, ApiError } from "@/lib/api/client";

// ── Create Class ─────────────────────────────────────────────────────────────
export async function createClass(formData: FormData) {
  const name = (formData.get("name") as string | null)?.trim();
  if (!name) return { error: "Class name is required." };

  try {
    await apiPost("/teacher/classes", { name });
  } catch (e) {
    if (e instanceof ApiError) return e.fieldErrors ? { fieldErrors: e.fieldErrors } : { error: e.message };
    throw e;
  }

  revalidatePath("/app/teacher/classes");
  return { ok: true };
}

// ── Add Student by Email ──────────────────────────────────────────────────────
export async function addStudentByEmail(classId: string, formData: FormData) {
  const email = (formData.get("email") as string | null)?.trim().toLowerCase();
  if (!email) return { error: "Email is required." };

  let res: { ok: boolean; studentName?: string };
  try {
    res = await apiPost(`/teacher/classes/${classId}/students`, { email });
  } catch (e) {
    if (e instanceof ApiError) return e.fieldErrors ? { fieldErrors: e.fieldErrors } : { error: e.message };
    throw e;
  }

  revalidatePath(`/app/teacher/classes/${classId}`);
  return { ok: true, studentName: res.studentName };
}

// ── Create Assignment ─────────────────────────────────────────────────────────
export async function createAssignment(formData: FormData) {
  const classId = (formData.get("classId") as string | null)?.trim();
  const title = (formData.get("title") as string | null)?.trim();
  const taskId = (formData.get("taskId") as string | null)?.trim() || undefined;
  const instructions = (formData.get("instructions") as string | null)?.trim() || undefined;
  const dueAt = (formData.get("dueAt") as string | null)?.trim() || undefined;

  if (!classId || !title) return { error: "Class and title are required." };

  try {
    await apiPost("/teacher/assignments", { classId, title, taskId, instructions, dueAt });
  } catch (e) {
    if (e instanceof ApiError) return e.fieldErrors ? { fieldErrors: e.fieldErrors } : { error: e.message };
    throw e;
  }

  revalidatePath("/app/teacher/assignments");
  revalidatePath(`/app/teacher/classes/${classId}`);
  return { ok: true };
}

// ── Grade Submission ──────────────────────────────────────────────────────────
export async function gradeSubmission(formData: FormData) {
  const submissionId = (formData.get("submissionId") as string | null)?.trim();
  const scoreRaw = formData.get("score") as string | null;
  const feedback = (formData.get("feedback") as string | null)?.trim() || undefined;

  if (!submissionId || scoreRaw === null || scoreRaw === "") {
    return { error: "Submission ID and score are required." };
  }

  const score = parseInt(scoreRaw, 10);
  if (isNaN(score) || score < 0 || score > 100) return { error: "Score must be 0–100." };

  try {
    await apiPost(`/teacher/submissions/${submissionId}/grade`, { score, feedback });
  } catch (e) {
    if (e instanceof ApiError) return e.fieldErrors ? { fieldErrors: e.fieldErrors } : { error: e.message };
    throw e;
  }

  revalidatePath("/app/teacher/grading");
  return { ok: true };
}
