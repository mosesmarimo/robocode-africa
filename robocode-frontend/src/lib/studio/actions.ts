"use server";

import { redirect } from "next/navigation";
import { apiPost, apiPut, ApiError } from "@/lib/api/client";
import type { Diagram } from "@/lib/domain/diagram";

export interface ProjectScore {
  usefulness: number;
  innovation: number;
  originality: number;
  complexity: number;
  overall: number;
  summary: string;
}

/** Rank a project with AI (4 dimensions) and award quality points. */
export async function scoreProject(projectId: string) {
  try {
    return await apiPost<{ ok: boolean; score?: ProjectScore; pointsAwarded?: number; error?: string }>(
      `/projects/${projectId}/score`,
    );
  } catch (e) {
    if (e instanceof ApiError) return { ok: false as const, error: e.message };
    throw e;
  }
}

type FileInput = { name: string; language: string; content: string };
type ProjectKind = "robotics" | "coding";

export async function saveProject(input: {
  projectId: string;
  title: string;
  board: string;
  diagram: Diagram;
  files: FileInput[];
  kind?: ProjectKind;
}) {
  return apiPut<{ ok: boolean }>(`/projects/${input.projectId}`, input);
}

export async function createProject(input: {
  title: string;
  board: string;
  diagram: Diagram;
  files: FileInput[];
  kind?: ProjectKind;
}) {
  const result = await apiPost<{ ok: boolean; projectId: string; redirect: string }>("/projects", input);
  redirect(result.redirect);
}

export async function recordSimulationRun(projectId: string) {
  return apiPost<{ ok: boolean }>(`/projects/${projectId}/simulation-run`);
}

/** Create/return a public read-only share link slug for a project. */
export async function shareProject(projectId: string) {
  return apiPost<{ ok: boolean; shareId: string }>(`/projects/${projectId}/share`);
}
