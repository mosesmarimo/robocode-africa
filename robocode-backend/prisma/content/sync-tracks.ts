import type { PrismaClient } from "@prisma/client";
import { TRACK_DEFS } from "./tracks";

/**
 * Idempotent sync of the curated `LearningTrack` rows from `TRACK_DEFS` into
 * whatever database `prisma` points at. Called from both `seed-content.ts`
 * (the non-destructive publisher that runs on every prod deploy) and
 * `seed.ts` (the destructive dev seed) — so it must be safe to call
 * repeatedly against a database whose content library may be partial.
 *
 * Each item's `course`/`task` slug is resolved to an id; a slug that isn't
 * found (e.g. mid-rollout on prod, before that course/task has been synced)
 * is **skipped with a console.warn** — it must NEVER throw and abort the
 * wider seed/deploy. `LearningTrack` itself is upserted by slug. Items carry
 * no user data (certificates reference the TRACK, not its items), so on
 * every sync we delete and recreate a track's `LearningTrackItem` rows —
 * simpler than diffing, and always safe.
 */
export async function syncLearningTracks(prisma: PrismaClient): Promise<void> {
  let tracksSynced = 0;
  let itemsSkipped = 0;

  for (const def of TRACK_DEFS) {
    const resolved: Array<{ courseId?: string; taskId?: string }> = [];

    for (const item of def.items) {
      if (item.course) {
        const course = await prisma.course.findUnique({ where: { slug: item.course }, select: { id: true } });
        if (!course) {
          console.warn(`syncLearningTracks: track "${def.slug}" references missing course slug "${item.course}" — skipping item`);
          itemsSkipped++;
          continue;
        }
        resolved.push({ courseId: course.id });
      } else if (item.task) {
        const task = await prisma.task.findUnique({ where: { slug: item.task }, select: { id: true } });
        if (!task) {
          console.warn(`syncLearningTracks: track "${def.slug}" references missing task slug "${item.task}" — skipping item`);
          itemsSkipped++;
          continue;
        }
        resolved.push({ taskId: task.id });
      } else {
        console.warn(`syncLearningTracks: track "${def.slug}" has an item with neither course nor task set — skipping item`);
        itemsSkipped++;
      }
    }

    const track = await prisma.learningTrack.upsert({
      where: { slug: def.slug },
      update: {
        title: def.title,
        description: def.description,
        track: def.track,
        language: def.language ?? null,
        level: def.level,
        icon: def.icon,
        order: def.order,
        published: true,
      },
      create: {
        slug: def.slug,
        title: def.title,
        description: def.description,
        track: def.track,
        language: def.language ?? null,
        level: def.level,
        icon: def.icon,
        order: def.order,
        published: true,
      },
    });

    await prisma.learningTrackItem.deleteMany({ where: { trackId: track.id } });
    if (resolved.length) {
      await prisma.learningTrackItem.createMany({
        data: resolved.map((ref, i) => ({ trackId: track.id, order: i, ...ref })),
      });
    }

    tracksSynced++;
  }

  console.log(
    `Learning tracks synced: ${tracksSynced} tracks` +
      (itemsSkipped ? `, ${itemsSkipped} item(s) skipped — missing slug, see warnings above` : ", 0 items skipped"),
  );
}
