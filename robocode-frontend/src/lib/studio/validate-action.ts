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

export type VibePart = { id: string; type: string; x?: number; y?: number; rotation?: number; props?: Record<string, string | number | boolean> };
export type VibeWire = { id?: string; from: string; to: string; color?: string };

export type VibeInput = {
  instruction: string;
  title: string;
  board: string;
  code: string;
  readme: string;
  language?: string;
  diagram: { board?: string; parts: VibePart[]; wires: VibeWire[] };
  catalog: { id: string; name: string; description?: string; pins?: string[] }[];
  boardPins: string[];
  partPins: Record<string, string[]>;
  image?: string;
};

export type VibeFile = { name: string; content: string };

export type VibeResult = AiResult & {
  result?: {
    summary?: string;
    code?: string;
    files?: VibeFile[];
    readme?: string;
    diagram?: { board?: string; parts: VibePart[]; wires: VibeWire[] };
  };
};

export async function vibeProject(input: VibeInput): Promise<VibeResult> {
  return apiPost<VibeResult>("/ai/vibe", input);
}
