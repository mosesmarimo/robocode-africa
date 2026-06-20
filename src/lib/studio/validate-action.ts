"use server";

import { requireActiveUser } from "@/lib/auth/current-user";
import { validateCircuit, type ValidateInput, type ValidateResult } from "@/lib/ai/deepseek";

export async function validateProject(input: ValidateInput): Promise<ValidateResult> {
  await requireActiveUser();
  return validateCircuit(input);
}
