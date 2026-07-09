import type { RunOutcome } from "./types";
import { runJs } from "./run-js";

/**
 * Transpiles `source` from TypeScript to JavaScript, then delegates to
 * runJs for actual execution in the locked worker. Transpile failures are
 * normal output (like a compile error a student needs to see), not sandbox
 * failures — they resolve with error:true rather than throwing.
 */
export async function runTs(source: string): Promise<RunOutcome> {
  let ts: typeof import("typescript");
  try {
    ts = await import("typescript");
  } catch {
    return {
      ok: false,
      configured: true,
      output: "",
      error: true,
      engine: "browser",
      text: "TypeScript transpiler unavailable.",
    };
  }

  let js: string;
  try {
    js = ts.transpileModule(source, {
      compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.None },
    }).outputText;
  } catch (err) {
    return {
      ok: true,
      configured: true,
      output: String(err),
      error: true,
      engine: "browser",
    };
  }

  return runJs(js);
}
