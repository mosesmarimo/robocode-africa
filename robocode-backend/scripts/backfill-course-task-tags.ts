/**
 * One-time (idempotent) backfill: tags existing Course/Task rows with
 * `language`/`track` so lesson-complete and challenge-pass XP lands on the
 * right per-language and per-track leaderboards (`src/modules/leaderboard`).
 * Part of the tutorials-gamification-leaderboards plan, Phase B0.
 *
 * Safety: ONLY UPDATEs the `language`/`track` tag columns already on
 * Course/Task — never inserts, deletes, or touches any other column, and
 * never runs `db:seed`/`db:reset`. Idempotent: re-derives the same value on
 * every run and skips any row that's already tagged (see
 * `if (course.language) continue` / `if (task.track) continue` below), so
 * running this twice is a no-op the second time.
 *
 * Course.language: set only when a course is unambiguously tied to one of
 * the frozen 12 languages (`src/domain/constants.ts` ALL_LANGUAGES) — today
 * that's exactly the `lang-<language>` tutorial courses (see
 * prisma/content/lang-*.ts), whose slug directly names the language. Every
 * other course is left with `language: null` rather than guessed at:
 * multi-topic surveys ("Sensors", "ESP32", "Raspberry Pi" — several mix
 * Arduino + MicroPython + Python across their lessons), the "ai"-track
 * courses (ai isn't a gamification track), and the legacy "Coding with
 * Arduino" course (its `track` is deliberately "coding" even though its
 * lessons are all Arduino code — tagging `language: arduino` would silently
 * contradict that pedagogical choice, since Arduino's track is "robotics").
 * The `course.track !== track` guard below is exactly what catches and
 * skips that last case.
 *
 * Task.track: every Task already carries a non-null `track` in this DB (the
 * column is `NOT NULL DEFAULT 'coding'`), so in the current dev DB this is a
 * defensive no-op. Kept anyway so a future row that bypasses the Prisma
 * default (raw SQL, or an empty-string track) still gets a sane value:
 * `trackForLanguage(task.language)` when the task has a frozen-12 language,
 * else "robotics" when it's graded by the board simulator (no `language` —
 * `boardType` only matters in that branch, see `src/sim/grader.ts`'s
 * `PROFILE_BY_BOARD`). Task.language itself is never touched — it's already
 * authoritative wherever it's set (see `prisma/content/lang-*.ts`).
 *
 * Run: cd robocode-backend && npx tsx scripts/backfill-course-task-tags.ts
 */
import { PrismaClient } from "@prisma/client";
import { ALL_LANGUAGES, trackForLanguage, type GamificationLanguage } from "../src/domain/constants";

const prisma = new PrismaClient();

/** `lang-<language>` -> language, for the frozen 12 only (null otherwise). */
function languageFromCourseSlug(slug: string): GamificationLanguage | null {
  const m = /^lang-(.+)$/.exec(slug);
  if (!m) return null;
  const candidate = m[1];
  return (ALL_LANGUAGES as readonly string[]).includes(candidate) ? (candidate as GamificationLanguage) : null;
}

async function backfillCourses(): Promise<{ scanned: number; tagged: number; skippedAmbiguous: string[] }> {
  const courses = await prisma.course.findMany({
    select: { id: true, slug: true, track: true, language: true },
  });
  let tagged = 0;
  const skippedAmbiguous: string[] = [];
  for (const course of courses) {
    if (course.language) continue; // already tagged — never overwrite

    const language = languageFromCourseSlug(course.slug);
    if (!language) continue; // multi-topic / survey course — leave null (ambiguous)

    const track = trackForLanguage(language);
    // Never contradict the course's own (pedagogical, user-facing on the
    // /learn page) `track` field — if the language's track disagrees,
    // treat the course as ambiguous and skip rather than silently
    // recategorizing it (e.g. "Coding with Arduino", track="coding").
    if (course.track !== track) {
      skippedAmbiguous.push(`${course.slug} (track=${course.track}, language ${language}'s track=${track})`);
      continue;
    }

    await prisma.course.update({ where: { id: course.id }, data: { language } });
    tagged++;
  }
  return { scanned: courses.length, tagged, skippedAmbiguous };
}

/** "robotics" when a task has no `language` (board-graded — see src/sim/grader.ts PROFILE_BY_BOARD), else the frozen-12 track for its language. Null if neither applies. */
function inferTaskTrack(task: { language: string | null; boardType: string }): string | null {
  return trackForLanguage(task.language) ?? (task.boardType ? "robotics" : null);
}

async function backfillTasks(): Promise<{ scanned: number; tagged: number }> {
  const tasks = await prisma.task.findMany({
    select: { id: true, track: true, language: true, boardType: true },
  });
  let tagged = 0;
  for (const task of tasks) {
    if (task.track) continue; // already tagged — schema default means this is normally every row; defensive only
    const track = inferTaskTrack(task);
    if (!track) continue;
    await prisma.task.update({ where: { id: task.id }, data: { track } });
    tagged++;
  }
  return { scanned: tasks.length, tagged };
}

async function main() {
  const courses = await backfillCourses();
  const tasks = await backfillTasks();

  console.log(`Courses: scanned ${courses.scanned}, tagged ${courses.tagged}`);
  if (courses.skippedAmbiguous.length) {
    console.log(`  skipped as ambiguous (single-language content but track mismatch): ${courses.skippedAmbiguous.length}`);
    for (const line of courses.skippedAmbiguous) console.log(`    - ${line}`);
  }
  console.log(`Tasks:   scanned ${tasks.scanned}, tagged ${tasks.tagged}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
