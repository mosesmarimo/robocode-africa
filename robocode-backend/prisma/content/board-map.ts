// SINGLE SOURCE OF TRUTH for which Studio board a course's robotics code targets.
// Imported by the backend seed merge (seed.ts) AND the frontend bake script
// (robocode-frontend/scripts/bake-diagrams.ts) via a monorepo-relative path.
//
// `null` => the course's code is NOT a Studio-emulatable robotics example
// (Raspberry-Pi Linux/Python, or a pure coding course) => no board stamp, no diagram.
//
// Courses whose code is mixed-language (arduino + python in the same course) are
// listed as "by-language": resolve the board per code block via boardForBlock().

export type BoardSlug = "arduino-uno" | "esp32" | "raspberry-pi-pico";

export const BOARD_BY_COURSE_SLUG: Record<string, BoardSlug | null> = {
  "intro-robotics": "arduino-uno",
  "robo-sensors": "arduino-uno",
  "robo-esp32": "esp32",
  "robo-pico": "raspberry-pi-pico",
  // mixed-language courses: arduino blocks -> arduino-uno, python blocks -> null
  "robo-pi-arduino": null,
  "ai-foundations": null,
  // pure coding / Linux courses: never get a diagram
  "coding-arduino": null,
  "robo-raspberry-pi": null,
};

/** Courses where the board depends on the block's language rather than the course. */
const BY_LANGUAGE_COURSES = new Set(["robo-pi-arduino", "ai-foundations"]);

/** Board for a code block, accounting for mixed-language courses. */
export function boardForBlock(courseSlug: string, language: string): BoardSlug | null {
  if (BY_LANGUAGE_COURSES.has(courseSlug)) {
    return language === "arduino" ? "arduino-uno" : null;
  }
  return BOARD_BY_COURSE_SLUG[courseSlug] ?? null;
}
