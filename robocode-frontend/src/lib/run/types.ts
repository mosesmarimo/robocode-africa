// Canonical outcome shape for every execution tier (browser sandbox, server
// sandbox, or AI "pretend to run"). Keeping this identical across tiers lets
// the Studio render run output without caring which engine produced it.
export interface RunOutcome {
  ok: boolean;
  configured: boolean;
  output: string;
  error: boolean;
  engine: "browser" | "server" | "ai";
  text?: string;
  durationMs?: number;
}

// Hard cap on captured stdout/stderr so a runaway console.log loop can't
// balloon memory or blow up the UI.
export const OUTPUT_CAP = 64000;

// Wall-clock budget for browser-sandboxed programs (Web Worker execution).
export const BROWSER_WALL_MS = 5000;

export function capOutput(s: string): string {
  if (s.length > OUTPUT_CAP) return s.slice(0, OUTPUT_CAP) + "\n…(output truncated)";
  return s;
}
