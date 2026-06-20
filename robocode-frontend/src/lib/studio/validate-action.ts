"use server";

import { apiPost } from "@/lib/api/client";

export type ValidateInput = {
  title: string;
  board: string;
  components: string[];
  connections: { from: string; to: string }[];
  code: string;
  readme: string;
  /** PNG data URL of the circuit diagram */
  image?: string;
};

export type AiResult = {
  ok: boolean;
  configured: boolean;
  text: string;
};

export async function validateProject(input: ValidateInput): Promise<AiResult> {
  return apiPost<AiResult>("/ai/validate", input);
}

export async function describeProject(input: ValidateInput): Promise<AiResult> {
  return apiPost<AiResult>("/ai/describe", input);
}
