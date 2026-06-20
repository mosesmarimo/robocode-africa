"use server";

import { redirect } from "next/navigation";
import { apiPost, apiPut } from "@/lib/api/client";
import type { Diagram } from "@/lib/domain/diagram";

type FileInput = { name: string; language: string; content: string };

export async function saveProject(input: {
  projectId: string;
  title: string;
  board: string;
  diagram: Diagram;
  files: FileInput[];
}) {
  return apiPut<{ ok: boolean }>(`/projects/${input.projectId}`, input);
}

export async function createProject(input: { title: string; board: string; diagram: Diagram; files: FileInput[] }) {
  const result = await apiPost<{ ok: boolean; projectId: string; redirect: string }>("/projects", input);
  redirect(result.redirect);
}

export async function recordSimulationRun(projectId: string) {
  return apiPost<{ ok: boolean }>(`/projects/${projectId}/simulation-run`);
}
