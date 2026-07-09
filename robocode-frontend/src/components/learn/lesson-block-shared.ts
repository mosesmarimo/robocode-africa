// Shared bits for the tryit/exercise lesson-block renderers
// (tryit-block.tsx, exercise-block.tsx). Mirrors the backend's frozen
// language split (robocode-backend/src/domain/constants.ts:
// CODING_LANGUAGES / ROBOTICS_LANGUAGES) — the 10 coding languages run in the
// sandbox (browser or server tier); the 2 robotics languages never do, they
// open the Studio sim instead (see AGENTS/plan: "robotics -> Studio").
export const ROBOTICS_TRYIT_LANGS: ReadonlySet<string> = new Set(["arduino", "micropython"]);

/**
 * Default Studio board for a robotics language when the lesson block doesn't
 * carry its own `board` (the backend `tryit`/`exercise` Block shapes don't —
 * only the older `code`/`diagram` blocks do). `studioHref` only infers
 * robotics mode from the language itself for "arduino"; micropython needs an
 * explicit board to land in robotics mode on the Pico instead of falling back
 * to a plain "coding" Studio session.
 */
export const DEFAULT_ROBOTICS_BOARD: Record<string, string> = {
  arduino: "arduino-uno",
  micropython: "raspberry-pi-pico",
};
