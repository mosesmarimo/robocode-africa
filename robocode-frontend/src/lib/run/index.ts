import type { RunOutcome } from "./types";
import { runJs } from "./run-js";
import { runTs } from "./run-ts";
import { runPython } from "./run-python";
import { runSql } from "./run-sql";

export type { RunOutcome } from "./types";
export { OUTPUT_CAP, BROWSER_WALL_MS, capOutput } from "./types";

/**
 * Runs `files` in-browser for languages that have a real browser-sandboxed
 * engine. Returns null for any language this tier doesn't (yet) cover, so
 * callers can fall back to the server or AI tiers.
 */
export async function runInBrowser(
  lang: string,
  files: { name: string; content: string }[],
  entry?: string,
): Promise<RunOutcome | null> {
  const src = (files.find((f) => f.name === entry) ?? files[0])?.content ?? "";
  switch (lang) {
    case "javascript":
      return runJs(src);
    case "typescript":
      return runTs(src);
    case "python":
      return runPython(src);
    case "sql":
      return runSql(src);
    default:
      return null;
  }
}
