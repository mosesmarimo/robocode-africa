import { z } from "zod";

/**
 * The 8 languages the jailed server-side runner supports. This is a subset of
 * the Coding Studio's `CODE_LANGUAGES` (see modules/ai/dto.ts) — `html` and
 * `css` render client-side only and never reach this module.
 */
export const RUN_LANGUAGES = ["cpp", "python", "javascript", "typescript", "sql", "go", "rust", "csharp"] as const;
export type RunLanguage = (typeof RUN_LANGUAGES)[number];

// Safe charset for filenames sent into the sandbox: no `/`, so no path can
// escape the tar's single flat directory. `..` is excluded explicitly too —
// belt-and-braces against a tar implementation that might resolve a bare
// ".." entry name relative to a parent directory. The name must also *start*
// with an alphanumeric/underscore character — a leading `-` (or `.`) is
// rejected so a name like `-fsyntax-only` can never be mistaken for a CLI
// flag by the toolchain invoked in `sandbox/run.sh` (defense in depth on top
// of run.sh's own `./$entry` prefixing).
const SAFE_NAME_RE = /^[A-Za-z0-9_][A-Za-z0-9_.-]*$/;
const safeName = (max: number) =>
  z
    .string()
    .min(1)
    .max(max)
    .regex(SAFE_NAME_RE, "must start with a letter, number, or '_', and contain only letters, numbers, '.', '_', '-'")
    .refine((n) => n !== "." && n !== ".." && !n.includes(".."), "invalid path");

const runFileSchema = z.object({
  name: safeName(64),
  content: z.string().max(64_000),
});

export const runExecuteSchema = z
  .object({
    language: z.enum(RUN_LANGUAGES),
    files: z.array(runFileSchema).min(1).max(10),
    entry: safeName(64).optional(),
  })
  // `entry`, when provided, must name one of the uploaded files — otherwise
  // it's an arbitrary attacker-controlled string handed straight to the
  // in-container toolchain as an argument.
  .refine((v) => !v.entry || v.files.some((f) => f.name === v.entry), {
    message: "entry must match one of the provided file names",
    path: ["entry"],
  });
export type RunExecuteInput = z.infer<typeof runExecuteSchema>;

/** Canonical result shape returned by the server runner (mirrors the frontend's client/AI-run outcome so callers can branch on `engine`). */
export interface RunOutcome {
  ok: boolean;
  configured: boolean;
  output: string;
  error: boolean; // true when the program failed to compile/run/timed out/OOMed
  engine: "server";
  durationMs: number;
  text?: string; // set on transport/config failures (e.g. docker unavailable)
}
