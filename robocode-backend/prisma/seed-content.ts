/**
 * Idempotent, NON-DESTRUCTIVE content seeder.
 *
 * Publishes the Content Library courses + lessons (the 3 rich demo courses and
 * the 12 language tutorials in `prisma/content/`) into whatever database
 * DATABASE_URL points at — WITHOUT deleting anything. Safe to run on production
 * and safe to re-run any time the authored content changes.
 *
 * Unlike `prisma/seed.ts` (the destructive dev seed that wipes every table),
 * this script only:
 *   - upserts each Course by its unique `slug`
 *   - updates an existing Lesson in place (matched by courseId + slug) or
 *     creates it if missing — so Lesson ids (and the LessonProgress that
 *     references them) are preserved; student progress is never lost.
 *
 * It does NOT touch users, projects, tasks/challenges, enrollments, or any
 * lesson that isn't part of the authored content.
 *
 * Run with:  pnpm db:seed-content   (uses the DATABASE_URL in the environment)
 */
import { Prisma, PrismaClient } from "@prisma/client";
import { CONTENT_MODULES } from "./content";
import { mergeBakedDiagrams } from "./baked-diagrams";
import { syncLearningTracks } from "./content/sync-tracks";

const prisma = new PrismaClient();

async function main() {
  let coursesUpserted = 0;
  let lessonsUpdated = 0;
  let lessonsCreated = 0;
  let tasksUpserted = 0;

  for (const m of CONTENT_MODULES) {
    const meta = m.meta;
    const course = await prisma.course.upsert({
      where: { slug: meta.slug },
      update: {
        title: meta.title,
        track: meta.track,
        level: meta.level,
        description: meta.description,
        coverImage: meta.coverImage,
        order: meta.order,
        language: meta.language ?? null,
        published: true,
      },
      create: {
        slug: meta.slug,
        title: meta.title,
        track: meta.track,
        level: meta.level,
        description: meta.description,
        coverImage: meta.coverImage,
        order: meta.order,
        language: meta.language ?? null,
        published: true,
        // tenantId omitted → null = global catalogue (visible to every tenant).
      },
    });
    coursesUpserted++;

    for (let i = 0; i < m.lessons.length; i++) {
      const l = m.lessons[i];
      // Splice baked AI wiring diagrams + stamp boards (same transform as seed.ts).
      const mergedBody = { ...l.body, blocks: mergeBakedDiagrams(meta.slug, l.slug, l.body.blocks) };
      const data = {
        title: l.title,
        contentType: l.contentType ?? "markdown",
        body: mergedBody as unknown as Prisma.InputJsonValue,
        estMinutes: l.estMinutes,
        order: i,
      };
      // No unique on (courseId, slug), so match by hand and update in place to
      // preserve the Lesson id (and its LessonProgress rows).
      const existing = await prisma.lesson.findFirst({
        where: { courseId: course.id, slug: l.slug },
        select: { id: true },
      });
      if (existing) {
        await prisma.lesson.update({ where: { id: existing.id }, data });
        lessonsUpdated++;
      } else {
        await prisma.lesson.create({ data: { courseId: course.id, slug: l.slug, ...data } });
        lessonsCreated++;
      }
    }

    // Challenges (Task.slug is @unique) — upsert by slug, linked to this course.
    for (const t of m.tasks ?? []) {
      const slug = typeof t.slug === "string" ? t.slug : "";
      if (!slug) continue;
      const data = { ...t, courseId: course.id } as unknown as Prisma.TaskUncheckedCreateInput;
      await prisma.task.upsert({
        where: { slug },
        update: data as unknown as Prisma.TaskUncheckedUpdateInput,
        create: data,
      });
      tasksUpserted++;
    }
  }

  console.log(
    `Content seed complete (non-destructive): ${coursesUpserted} courses upserted, ` +
      `${lessonsUpdated} lessons updated, ${lessonsCreated} lessons created, ` +
      `${tasksUpserted} challenges upserted.`,
  );

  // Curated Learning Tracks — run after courses/tasks above so every item
  // slug in prisma/content/tracks.ts resolves.
  await syncLearningTracks(prisma);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error("Content seed failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
