import "server-only";
import { apiPost, ApiError } from "@/lib/api/client";
import type { RunOutcome } from "./types";

// The server tier: runs a (multi-file) project in the backend's jailed Docker
// sandbox (`POST /run/execute`, see robocode-backend/src/modules/run). This
// module is only ever imported from `coding-actions.ts` (a "use server" file)
// — `apiPost` is itself `server-only` and reads the session cookie, so this
// can never run in a client component.

/**
 * Calls the server sandbox. On a real run (success or a genuine
 * compile/runtime error) the backend's own `RunOutcome` is returned as-is.
 * On HTTP 429 (per-user rate limit) this returns a friendly, non-fallback
 * outcome — the caller should show it, not fall back to AI. On any other
 * transport/config failure this returns `configured:false` so the caller
 * (`runProject`) falls back to the AI tier instead of showing a raw error.
 */
export async function runOnServer(
  lang: string,
  files: { name: string; content: string }[],
  entry?: string,
): Promise<RunOutcome> {
  try {
    return await apiPost<RunOutcome>("/run/execute", { language: lang, files, entry });
  } catch (e) {
    if (e instanceof ApiError && e.status === 429) {
      return {
        ok: false,
        configured: true,
        output: "",
        error: true,
        engine: "server",
        text: "You're running code too quickly — wait a few seconds.",
      };
    }
    if (e instanceof ApiError) {
      return { ok: false, configured: false, output: "", error: true, engine: "server", text: e.message };
    }
    throw e;
  }
}
