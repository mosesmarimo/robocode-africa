"use server";

import { requireActiveUser } from "@/lib/auth/current-user";
import { validateCircuit, describeCircuit, type ValidateInput, type AiResult } from "@/lib/ai/deepseek";

export async function validateProject(input: ValidateInput): Promise<AiResult> {
  await requireActiveUser();
  return validateCircuit(input);
}

export async function describeProject(input: ValidateInput): Promise<AiResult> {
  await requireActiveUser();
  return describeCircuit(input);
}
