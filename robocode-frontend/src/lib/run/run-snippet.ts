// Shared "run a single-file snippet" helper for the tryit/exercise lesson
// blocks (components/learn/tryit-block.tsx, exercise-block.tsx). Mirrors the
// tiering CodingStudio.run() uses (src/components/studio/coding-studio.tsx):
// try the browser sandbox first (Web Worker — Pyodide/sql.js/JS/TS), then
// fall back to the server action for the languages it owns (cpp/csharp/go/
// rust); html/css render an iframe preview instead of "running". This module
// is only ever imported from "use client" lesson-block components — like
// coding-studio.tsx, it imports `runProject` (a "use server" action) directly,
// which Next.js turns into a server-action reference at the client/server
// boundary. Never import this from a Server Component.
import type { RunOutcome } from "./types";
import { runInBrowser } from "./index";
import { runProject } from "@/lib/studio/coding-actions";
import { CODE_LANG_MAP, buildPreviewDoc, type CodeLang } from "@/lib/studio/coding";

export type SnippetRunResult =
  | { mode: "render"; doc: string }
  | { mode: "run"; result: RunOutcome };

/** Languages CodingStudio renders in an iframe instead of executing. */
const RENDER_LANGS = new Set(["html", "css"]);

/** Canonical single-file entry name for a coding language (matches CODE_LANG_MAP's starter). */
function filenameFor(language: string): string {
  return CODE_LANG_MAP[language as CodeLang]?.starter[0]?.name ?? `main.${language}`;
}

/**
 * Run (or render) a single code snippet for one of the 10 frozen coding
 * languages. Callers must not invoke this for arduino/micropython — robotics
 * tryit/exercise blocks route to the Studio sim instead (see ROBOTICS_TRYIT_LANGS
 * in components/learn/lesson-block-shared.ts).
 */
export async function runCodingSnippet(language: string, code: string): Promise<SnippetRunResult> {
  if (RENDER_LANGS.has(language)) {
    return { mode: "render", doc: buildPreviewDoc([{ name: "index.html", content: code }]) };
  }
  const entry = filenameFor(language);
  const files = [{ name: entry, content: code }];
  const browser = await runInBrowser(language, files, entry);
  const result = browser ?? (await runProject(language, files, entry));
  return { mode: "run", result };
}

/**
 * Best-effort pass/fail check for an exercise's free-text `check` hint
 * (authored like `stdout contains "Total: 42"` or, for python/js/ts, just the
 * bare expected substring like `"42"`). Not a real grader — `check` is
 * human-authored guidance text, not a machine grammar — but it's the same
 * heuristic in both directions: quoted fragments must all appear in the
 * output; with no quotes, the whole string is compared as a substring. SQL
 * exercises tend to describe result rows in prose ("Result should have 2
 * rows: Rex/Dog and Milo/Cat") and won't reliably auto-pass this heuristic —
 * that's fine, "Show Answer" always works as the fallback completion path.
 */
export function checkOutputContains(check: string, output: string): boolean {
  const quoted = [...check.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  if (quoted.length > 0) return quoted.every((q) => output.includes(q));
  return output.includes(check);
}
