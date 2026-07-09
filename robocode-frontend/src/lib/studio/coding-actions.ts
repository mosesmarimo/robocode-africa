"use server";

// Architecture note: this file is a "use server" boundary, so everything in
// it runs on the Node server — it can never touch a Web Worker or wasm
// runtime. The Coding Studio's execution is tiered across three engines:
//   1. browser (`runInBrowser`, src/lib/run) — Pyodide/sql.js/JS/TS, run in
//      a Web Worker. MUST be invoked client-side, before this file is ever
//      reached, because Workers don't exist on the server.
//   2. server (`runOnServer`, ./run-server via `runProject` below) — the
//      backend's jailed Docker sandbox, for languages the browser tier
//      doesn't cover (cpp/csharp/go/rust).
//   3. ai (`runCodeAction` below) — the AI "pretend to run" fallback, used
//      when a language has no browser engine and the server sandbox isn't
//      configured/reachable.
// `runProject` is the single entry point the client calls for tiers 2+3; the
// client attempts tier 1 itself first (see coding-studio.tsx).
import { apiPost, ApiError } from "@/lib/api/client";
import { runOnServer } from "@/lib/run/run-server";
import type { RunOutcome } from "@/lib/run/types";

export interface GenerateCodeResult {
  ok: boolean;
  configured: boolean;
  files?: { name: string; content: string }[];
  text?: string;
}
export interface ExplainCodeResult {
  ok: boolean;
  configured: boolean;
  explanation?: string;
  text?: string;
  cached?: boolean;
}
export interface ValidateCodeResult {
  ok: boolean;
  configured: boolean;
  result?: string;
  text?: string;
}

/** Run a (multi-file) project via the AI runtime — stdout or a syntax/compile error. Always badged `engine:"ai"` so the Studio can show that the result is AI-simulated. */
export async function runCodeAction(
  language: string,
  files: { name: string; content: string }[],
  entry?: string,
): Promise<RunOutcome> {
  try {
    const r = await apiPost<{ ok: boolean; configured: boolean; output: string; error: boolean; text?: string }>(
      "/ai/run-code",
      { language, files, entry },
    );
    return { ...r, engine: "ai" };
  } catch (e) {
    if (e instanceof ApiError) return { ok: false, configured: true, output: "", error: true, engine: "ai", text: e.message };
    throw e;
  }
}

// Languages the backend's jailed Docker sandbox executes for real (see
// robocode-backend/src/modules/run/dto.ts RUN_LANGUAGES). The browser tier's
// own language list lives in src/lib/run/index.ts's `runInBrowser` switch —
// there's no need to duplicate it here since the client always tries that
// tier itself before calling this action (see coding-studio.tsx).
const SERVER_LANGS = new Set(["cpp", "csharp", "go", "rust"]);

/**
 * The server action the Coding Studio calls for the server + AI tiers (the
 * browser tier — Pyodide/sql.js/JS/TS in a Web Worker — is attempted
 * client-side first and never reaches this file; see the module comment
 * above). `SERVER_LANGS` get a real jailed run: a genuine success or
 * compile/runtime error (or a rate-limit message) comes back as-is. Only
 * when the server sandbox itself is unavailable (`configured:false` —
 * Docker missing, transport failure) does this fall back to the AI tier.
 * Every other language (no browser or server engine) goes straight to AI.
 */
export async function runProject(
  lang: string,
  files: { name: string; content: string }[],
  entry?: string,
): Promise<RunOutcome> {
  if (SERVER_LANGS.has(lang)) {
    const r = await runOnServer(lang, files, entry);
    if (r.configured) return r; // real result: success, compile error, or rate-limit message
    return runCodeAction(lang, files, entry); // server unavailable -> AI (badged)
  }
  return runCodeAction(lang, files, entry); // no browser/server engine -> AI (badged)
}

/** RoboVibe — generate a single file or small project from a brief. */
export async function generateCodeAction(language: string, instruction: string): Promise<GenerateCodeResult> {
  try {
    return await apiPost<GenerateCodeResult>("/ai/generate-code", { language, instruction });
  } catch (e) {
    if (e instanceof ApiError) return { ok: false, configured: true, text: e.message };
    throw e;
  }
}

/** Code Explainer — line-by-line explanation of a file. */
export async function explainCodeAction(language: string, code: string, filename?: string, projectId?: string): Promise<ExplainCodeResult> {
  try {
    return await apiPost<ExplainCodeResult>("/ai/explain-code", { language, code, filename, projectId });
  } catch (e) {
    if (e instanceof ApiError) return { ok: false, configured: true, text: e.message };
    throw e;
  }
}

/** Validate with AI — review a file before running. */
export async function validateCodeAction(language: string, code: string, filename?: string): Promise<ValidateCodeResult> {
  try {
    return await apiPost<ValidateCodeResult>("/ai/validate-code", { language, code, filename });
  } catch (e) {
    if (e instanceof ApiError) return { ok: false, configured: true, text: e.message };
    throw e;
  }
}
