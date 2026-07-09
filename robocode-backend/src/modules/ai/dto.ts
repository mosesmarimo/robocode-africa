import { z } from "zod";

/** ValidateInput — ported from the old `src/lib/ai/deepseek.ts`. */
export const validateInputSchema = z.object({
  title: z.string(),
  board: z.string(),
  components: z.array(z.string()),
  connections: z.array(z.object({ from: z.string(), to: z.string() })),
  code: z.string(),
  readme: z.string(),
  /** PNG data URL of the circuit diagram */
  image: z.string().optional(),
});

export type ValidateInput = z.infer<typeof validateInputSchema>;

export interface AiResult {
  ok: boolean;
  configured: boolean;
  text: string;
}

/** RoboVibe — describe a change in natural language; AI rewrites diagram + code + README. */
const diagramPartSchema = z.object({
  id: z.string(),
  type: z.string(),
  x: z.number().optional(),
  y: z.number().optional(),
  rotation: z.number().optional(),
  props: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
});
const diagramWireSchema = z.object({
  id: z.string().optional(),
  from: z.string(),
  to: z.string(),
  color: z.string().optional(),
});

export const vibeInputSchema = z.object({
  instruction: z.string().min(1),
  title: z.string(),
  board: z.string(),
  code: z.string(),
  readme: z.string(),
  language: z.string().optional(), // "arduino" | "micropython"
  diagram: z.object({
    board: z.string().optional(),
    parts: z.array(diagramPartSchema),
    wires: z.array(diagramWireSchema),
  }),
  /** Components the AI may add: id — name — description — pins. */
  catalog: z.array(
    z.object({ id: z.string(), name: z.string(), description: z.string().optional(), pins: z.array(z.string()).optional() }),
  ),
  /** Pin names of the board (id "mcu"). */
  boardPins: z.array(z.string()),
  /** Exact pin names of each existing part, keyed by part id. */
  partPins: z.record(z.string(), z.array(z.string())),
  image: z.string().optional(),
});

export type VibeInput = z.infer<typeof vibeInputSchema>;

/** Update the effective AI config (school or personal). */
export const aiConfigUpdateSchema = z.object({
  provider: z.string().max(40).optional(),
  baseUrl: z.string().url().max(2048).optional().or(z.literal("")),
  model: z.string().max(120).optional(),
  apiKey: z.string().max(400).optional(),
  clearKey: z.boolean().optional(),
});

export type AiConfigUpdate = z.infer<typeof aiConfigUpdateSchema>;

/** Languages the Coding Studio supports. */
export const CODE_LANGUAGES = [
  "python",
  "javascript",
  "html",
  "css",
  "typescript",
  "go",
  "rust",
  "cpp",
  "csharp",
  "sql",
] as const;

/** A source file in the Coding Studio. */
export const codeFileSchema = z.object({ name: z.string().trim().min(1).max(120), content: z.string().max(20000) });
export type CodeFileInput = z.infer<typeof codeFileSchema>;

/** Run a (possibly multi-file) program in the Coding Studio — AI acts as the runtime. */
export const runCodeSchema = z.object({
  language: z.enum(CODE_LANGUAGES),
  files: z.array(codeFileSchema).min(1).max(20),
  entry: z.string().max(120).optional(), // the entry-point file name
});
export type RunCodeInput = z.infer<typeof runCodeSchema>;

export interface RunCodeResult {
  ok: boolean;
  configured: boolean;
  output: string;
  error: boolean; // true when the program failed to compile/run
  text?: string; // set on transport/config failures
}

/** RoboVibe for code — generate a single file or a small multi-file project. */
export const generateCodeSchema = z.object({
  language: z.enum(CODE_LANGUAGES),
  instruction: z.string().trim().min(1).max(2000),
});
export type GenerateCodeInput = z.infer<typeof generateCodeSchema>;

export interface GenerateCodeResult {
  ok: boolean;
  configured: boolean;
  files?: { name: string; content: string }[];
  text?: string;
}

/** Code Explainer — AI explains the code (line by line). */
export const explainCodeSchema = z.object({
  language: z.enum(CODE_LANGUAGES),
  code: z.string().min(1).max(20000),
  filename: z.string().max(120).optional(),
  projectId: z.string().max(40).optional(),
});
export type ExplainCodeInput = z.infer<typeof explainCodeSchema>;

export interface ExplainCodeResult {
  ok: boolean;
  configured: boolean;
  explanation?: string;
  text?: string;
  cached?: boolean;
}

/** AI project ranking — score a project on four dimensions (0–100 each). */
export interface ProjectScore {
  usefulness: number;
  innovation: number;
  originality: number;
  complexity: number;
  overall: number;
  summary: string;
}
export interface ScoreProjectResult {
  ok: boolean;
  configured: boolean;
  score?: ProjectScore;
  text?: string;
}

/** Validate with AI — review code for errors/issues before running. */
export const validateCodeSchema = z.object({
  language: z.enum(CODE_LANGUAGES),
  code: z.string().min(1).max(20000),
  filename: z.string().max(120).optional(),
});
export type ValidateCodeInput = z.infer<typeof validateCodeSchema>;

export interface ValidateCodeResult {
  ok: boolean;
  configured: boolean;
  result?: string; // markdown review
  text?: string;
}

export interface VibeResult extends AiResult {
  /** Structured edit to apply, when the model returns valid JSON. */
  result?: {
    summary?: string;
    code?: string; // legacy single-file fallback
    files?: { name: string; content: string }[];
    readme?: string;
    diagram?: {
      board?: string;
      parts: { id: string; type: string; x?: number; y?: number; rotation?: number; props?: Record<string, string | number | boolean> }[];
      wires: { id?: string; from: string; to: string; color?: string }[];
    };
  };
}
