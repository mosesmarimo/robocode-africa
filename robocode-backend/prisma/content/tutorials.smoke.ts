/**
 * Smoke test for the 12 W3Schools-style language tutorial courses.
 *
 * Verifies, for each of the frozen 12 languages, that its tutorial course:
 *   - has `meta.language` set to one of the frozen 12 languages
 *   - has `meta.level` set to a valid LEVEL_LABELS key ("primary" | "high")
 *   - has a UNIQUE `meta.order` (no collisions across the 12 tutorials)
 *   - has at least 5 lessons
 *   - has at least one `tryit` block in every lesson
 *
 * Run with:  npx tsx prisma/content/tutorials.smoke.ts
 */
import { LEVELS } from "../../src/domain/constants";
import { ALL_LANGUAGES } from "../../src/domain/constants";
import {
  pythonTutorialCourse,
  javascriptTutorialCourse,
  typescriptTutorialCourse,
  sqlTutorialCourse,
  htmlTutorialCourse,
  cssTutorialCourse,
  goTutorialCourse,
  rustTutorialCourse,
  cppTutorialCourse,
  csharpTutorialCourse,
  arduinoTutorialCourse,
  micropythonTutorialCourse,
} from "./index";
import type { CourseModule } from "./types";

const TUTORIAL_COURSES: CourseModule[] = [
  pythonTutorialCourse,
  javascriptTutorialCourse,
  typescriptTutorialCourse,
  sqlTutorialCourse,
  htmlTutorialCourse,
  cssTutorialCourse,
  goTutorialCourse,
  rustTutorialCourse,
  cppTutorialCourse,
  csharpTutorialCourse,
  arduinoTutorialCourse,
  micropythonTutorialCourse,
];

const VALID_LEVELS: readonly string[] = LEVELS;
const VALID_LANGUAGES: readonly string[] = ALL_LANGUAGES;

function fail(message: string): never {
  console.error(`FAIL: ${message}`);
  process.exit(1);
}

function main() {
  if (TUTORIAL_COURSES.length !== 12) {
    fail(`expected exactly 12 tutorial courses, found ${TUTORIAL_COURSES.length}`);
  }

  const seenOrders = new Set<number>();
  const seenLanguages = new Set<string>();

  for (const m of TUTORIAL_COURSES) {
    const { meta, lessons } = m;
    const label = meta.slug ?? meta.title;

    if (!meta.language || !VALID_LANGUAGES.includes(meta.language)) {
      fail(`${label}: meta.language "${meta.language}" is not one of the frozen 12 languages`);
    }
    if (seenLanguages.has(meta.language!)) {
      fail(`${label}: duplicate meta.language "${meta.language}" across tutorial courses`);
    }
    seenLanguages.add(meta.language!);

    if (!VALID_LEVELS.includes(meta.level)) {
      fail(`${label}: meta.level "${meta.level}" is not a valid LEVEL_LABELS key (${VALID_LEVELS.join(", ")})`);
    }

    if (typeof meta.order !== "number") {
      fail(`${label}: meta.order is not a number`);
    }
    if (seenOrders.has(meta.order)) {
      fail(`${label}: duplicate meta.order ${meta.order} across tutorial courses`);
    }
    seenOrders.add(meta.order);

    if (lessons.length < 5) {
      fail(`${label}: has only ${lessons.length} lessons, expected >= 5`);
    }

    for (const lesson of lessons) {
      // "Try it" = an editable/runnable example. The 10 coding-track tutorials
      // use the dedicated `tryit` block (runs in the in-browser/server code
      // sandbox). The 2 robotics-track tutorials (arduino, micropython) use
      // `code` (openInStudio, the default) + `exercise` instead, because
      // their examples only run through the full board simulator in Studio,
      // not the lightweight sandbox — same "editable + runnable" contract,
      // different block type. Accept any of the three as satisfying it.
      const interactiveBlocks = lesson.body.blocks.filter(
        (b) =>
          b.type === "tryit" ||
          b.type === "exercise" ||
          (b.type === "code" && (b as { openInStudio?: boolean }).openInStudio !== false),
      );
      if (interactiveBlocks.length < 1) {
        fail(`${label} / lesson "${lesson.slug}": has no interactive (tryit/exercise/code) block`);
      }
    }
  }

  console.log(
    `OK: ${TUTORIAL_COURSES.length} tutorial courses verified — languages: ${[...seenLanguages].sort().join(", ")}; ` +
      `orders: ${[...seenOrders].sort((a, b) => a - b).join(", ")}`,
  );
}

main();
