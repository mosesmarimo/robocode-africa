import { randomBytes } from "crypto";
import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { GamificationService } from "../../common/gamification.service";
import { NotifyService } from "../../common/notify.service";

// no I/L/O/0/1 look-alikes
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function generateCertCode(): string {
  const bytes = randomBytes(10);
  let out = "";
  for (let i = 0; i < 10; i++) out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  return `RC-${out.slice(0, 5)}-${out.slice(5)}`;
}

/** PII-safe display name for the PUBLIC verify payload: "Ada Lovelace" -> "Ada L." */
function holderName(name: string | null | undefined): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "RoboCode Learner";
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}

// Same P2002 check as common/points.service.ts (that helper isn't exported —
// replicated here rather than importing a private symbol).
function isUniqueConstraintError(e: unknown): boolean {
  return !!e && typeof e === "object" && (e as { code?: string }).code === "P2002";
}

type TrackItemRef = { courseId: string | null; taskId: string | null };

/**
 * Learning tracks (curated course+challenge paths) and the certificates
 * issued on completion. Progress is always DERIVED (never stored) from
 * Submission/Enrollment/RoboPointLedger — see done-detection helpers below —
 * so a track's completion state is always consistent with the underlying
 * course/challenge data, including passes/completions that predate this
 * module (or even gamification itself).
 */
@Injectable()
export class TracksService {
  private readonly logger = new Logger(TracksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gamification: GamificationService,
    private readonly notifier: NotifyService,
  ) {}

  // ---------------------------------------------------------------------------
  // Done-detection (belt + braces — covers passes/completions that predate
  // gamification, e.g. seeded historical data).
  // ---------------------------------------------------------------------------

  /** Task item done ⇔ a passed Submission exists for (userId, taskId). */
  private async doneTaskIds(userId: string, taskIds: string[]): Promise<Set<string>> {
    if (!taskIds.length) return new Set();
    const rows = await this.prisma.submission.findMany({
      where: { userId, taskId: { in: taskIds }, status: "passed" },
      distinct: ["taskId"],
      select: { taskId: true },
    });
    return new Set(rows.map((r) => r.taskId));
  }

  /** Course item done ⇔ Enrollment.completedAt set OR a course-complete ledger row exists. */
  private async doneCourseIds(userId: string, courseIds: string[]): Promise<Set<string>> {
    if (!courseIds.length) return new Set();
    const [enrollments, ledgerRows] = await Promise.all([
      this.prisma.enrollment.findMany({
        where: { userId, courseId: { in: courseIds }, completedAt: { not: null } },
        select: { courseId: true },
      }),
      // Ledger row created by GamificationService.completeTask for type
      // "course-complete" — its idemKey is `task:course-complete:<courseId>:<userId>`,
      // equivalently identified here via refType+refId+userId.
      this.prisma.roboPointLedger.findMany({
        where: { userId, refType: "course-complete", refId: { in: courseIds } },
        select: { refId: true },
      }),
    ]);
    const set = new Set(enrollments.map((e) => e.courseId));
    for (const row of ledgerRows) if (row.refId) set.add(row.refId);
    return set;
  }

  private itemDone(item: TrackItemRef, doneTasks: Set<string>, doneCourses: Set<string>): boolean {
    if (item.taskId) return doneTasks.has(item.taskId);
    if (item.courseId) return doneCourses.has(item.courseId);
    return false;
  }

  // ---------------------------------------------------------------------------
  // Reads
  // ---------------------------------------------------------------------------

  /** GET /tracks — published tracks with derived progress + certificate (if earned). */
  async listTracks(userId: string) {
    const tracks = await this.prisma.learningTrack.findMany({
      where: { published: true },
      orderBy: [{ order: "asc" }, { title: "asc" }],
      include: { items: { select: { courseId: true, taskId: true } } },
    });

    const allTaskIds = [
      ...new Set(tracks.flatMap((t) => t.items.map((i) => i.taskId).filter((x): x is string => !!x))),
    ];
    const allCourseIds = [
      ...new Set(tracks.flatMap((t) => t.items.map((i) => i.courseId).filter((x): x is string => !!x))),
    ];
    const [doneTasks, doneCourses] = await Promise.all([
      this.doneTaskIds(userId, allTaskIds),
      this.doneCourseIds(userId, allCourseIds),
    ]);

    const completeTrackIds: string[] = [];
    const rows = tracks.map((t) => {
      const itemCount = t.items.length;
      const doneCount = t.items.filter((i) => this.itemDone(i, doneTasks, doneCourses)).length;
      if (itemCount > 0 && doneCount === itemCount) completeTrackIds.push(t.id);
      return { t, itemCount, doneCount };
    });

    // Lazy backfill: make sure every 100%-complete track has its XP/cert/notify
    // applied (idempotent — safe to call on every list load). Failure-isolated
    // per track: a transient write failure on one track must not 500 this read
    // or block the other tracks' backfill — it just retries on the next load.
    for (const trackId of completeTrackIds) {
      try {
        await this.ensureTrackCompletion(userId, trackId);
      } catch (e) {
        this.logger.warn(`backfill failed track=${trackId}: ${e}`);
      }
    }

    const certs = completeTrackIds.length
      ? await this.prisma.certificate.findMany({
          where: { userId, kind: "track", trackId: { in: completeTrackIds } },
          select: { trackId: true, code: true, issuedAt: true },
        })
      : [];
    const certByTrack = new Map(certs.map((c) => [c.trackId as string, c]));

    return {
      tracks: rows.map(({ t, itemCount, doneCount }) => {
        const cert = certByTrack.get(t.id);
        return {
          slug: t.slug,
          title: t.title,
          description: t.description,
          track: t.track,
          language: t.language,
          level: t.level,
          icon: t.icon,
          itemCount,
          doneCount,
          certificate: cert ? { code: cert.code, issuedAt: cert.issuedAt.toISOString() } : null,
        };
      }),
    };
  }

  /** GET /tracks/for-task/:taskId — the post-pass nudge: published tracks containing this task. */
  async getTracksForTask(userId: string, taskId: string) {
    const tracks = await this.prisma.learningTrack.findMany({
      where: { published: true, items: { some: { taskId } } },
      orderBy: [{ order: "asc" }, { title: "asc" }],
      include: { items: { select: { courseId: true, taskId: true } } },
    });
    if (!tracks.length) return { tracks: [] };

    const allTaskIds = [
      ...new Set(tracks.flatMap((t) => t.items.map((i) => i.taskId).filter((x): x is string => !!x))),
    ];
    const allCourseIds = [
      ...new Set(tracks.flatMap((t) => t.items.map((i) => i.courseId).filter((x): x is string => !!x))),
    ];
    const [doneTasks, doneCourses] = await Promise.all([
      this.doneTaskIds(userId, allTaskIds),
      this.doneCourseIds(userId, allCourseIds),
    ]);

    return {
      tracks: tracks.map((t) => ({
        slug: t.slug,
        title: t.title,
        itemCount: t.items.length,
        doneCount: t.items.filter((i) => this.itemDone(i, doneTasks, doneCourses)).length,
      })),
    };
  }

  /** GET /tracks/:slug — a single track's items with per-item done/current state. 404 unknown/unpublished. */
  async getTrack(userId: string, slug: string) {
    const track = await this.prisma.learningTrack.findUnique({
      where: { slug },
      include: {
        items: {
          orderBy: { order: "asc" },
          include: {
            course: { select: { slug: true, title: true, language: true, level: true } },
            task: { select: { slug: true, title: true, language: true, difficulty: true } },
          },
        },
      },
    });
    if (!track || !track.published) throw new NotFoundException("Track not found");

    const taskIds = track.items.map((i) => i.taskId).filter((x): x is string => !!x);
    const courseIds = track.items.map((i) => i.courseId).filter((x): x is string => !!x);
    const [doneTasks, doneCourses] = await Promise.all([
      this.doneTaskIds(userId, taskIds),
      this.doneCourseIds(userId, courseIds),
    ]);

    let foundCurrent = false;
    const items = track.items
      .map((i) => {
        const done = this.itemDone(i, doneTasks, doneCourses);
        const current = !done && !foundCurrent;
        if (current) foundCurrent = true;

        if (i.taskId && i.task) {
          return {
            type: "challenge" as const,
            slug: i.task.slug,
            title: i.task.title,
            language: i.task.language,
            difficulty: i.task.difficulty,
            done,
            current,
          };
        }
        if (i.courseId && i.course) {
          return {
            type: "course" as const,
            slug: i.course.slug,
            title: i.course.title,
            language: i.course.language,
            level: i.course.level,
            done,
            current,
          };
        }
        return null;
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    const total = items.length;
    const done = items.filter((i) => i.done).length;
    const percent = total ? Math.round((done / total) * 100) : 0;

    // Lazy backfill, failure-isolated like listTracks above: a cert/notify
    // write failure must not 500 the track detail read — it just retries on
    // the next load.
    if (total > 0 && done === total) {
      try {
        await this.ensureTrackCompletion(userId, track.id);
      } catch (e) {
        this.logger.warn(`backfill failed track=${track.id}: ${e}`);
      }
    }

    const cert = await this.prisma.certificate.findFirst({
      where: { userId, kind: "track", trackId: track.id },
      select: { code: true, issuedAt: true },
    });

    return {
      slug: track.slug,
      title: track.title,
      description: track.description,
      track: track.track,
      language: track.language,
      level: track.level,
      icon: track.icon,
      progress: { done, total, percent },
      certificate: cert ? { code: cert.code, issuedAt: cert.issuedAt.toISOString() } : null,
      items,
    };
  }

  /** GET /certificates — the current user's earned certificates. */
  async myCertificates(userId: string) {
    const certs = await this.prisma.certificate.findMany({
      where: { userId },
      include: { track: { select: { slug: true } } },
      orderBy: { issuedAt: "desc" },
    });
    return {
      certificates: certs.map((c) => ({
        code: c.code,
        title: c.title,
        kind: c.kind,
        trackSlug: c.track?.slug ?? null,
        issuedAt: c.issuedAt.toISOString(),
      })),
    };
  }

  /** GET /certificates/verify/:code — PUBLIC, PII-safe verification. 404 unknown. */
  async verifyCertificate(code: string) {
    const cert = await this.prisma.certificate.findUnique({
      where: { code },
      include: { user: { select: { displayName: true } }, track: { select: { slug: true } } },
    });
    if (!cert) throw new NotFoundException("Certificate not found");

    return {
      valid: true as const,
      code: cert.code,
      title: cert.title,
      holder: holderName(cert.user.displayName),
      trackSlug: cert.track?.slug ?? null,
      issuedAt: cert.issuedAt.toISOString(),
    };
  }

  // ---------------------------------------------------------------------------
  // Completion — idempotent award + issuance, and non-fatal hooks
  // ---------------------------------------------------------------------------

  /**
   * Idempotent: recomputes done state for `trackId`; unless every item is
   * done (and the track has at least one item), no-ops. Otherwise awards
   * track-complete XP (itself idempotent via completeTask's idemKey) + issues
   * the certificate + notifies the user — exactly once, ever, per user+track.
   */
  async ensureTrackCompletion(userId: string, trackId: string): Promise<void> {
    const track = await this.prisma.learningTrack.findUnique({
      where: { id: trackId },
      include: { items: { select: { courseId: true, taskId: true } } },
    });
    if (!track) return;

    const taskIds = track.items.map((i) => i.taskId).filter((x): x is string => !!x);
    const courseIds = track.items.map((i) => i.courseId).filter((x): x is string => !!x);
    const [doneTasks, doneCourses] = await Promise.all([
      this.doneTaskIds(userId, taskIds),
      this.doneCourseIds(userId, courseIds),
    ]);
    const total = track.items.length;
    const done = track.items.filter((i) => this.itemDone(i, doneTasks, doneCourses)).length;
    if (total === 0 || done < total) return;

    await this.gamification.completeTask({
      userId,
      type: "track-complete",
      refId: trackId,
      language: track.language,
      track: track.track === "coding" || track.track === "robotics" ? track.track : undefined,
    });

    const existing = await this.prisma.certificate.findFirst({ where: { userId, kind: "track", trackId } });
    if (existing) return;
    try {
      await this.prisma.certificate.create({
        data: { code: generateCertCode(), userId, kind: "track", trackId, title: track.title },
      });
    } catch (err) {
      if (!isUniqueConstraintError(err)) throw err;
      return; // raced — another concurrent call already issued it
    }
    await this.notifier.notify({
      userId,
      type: "certificate",
      title: `🎓 Certificate earned: ${track.title}`,
      body: `You completed every step of ${track.title}. View and share your certificate from your Badges page.`,
    });
  }

  /**
   * Hook — called from CompetitionsService.submitSolution on a pass. Must
   * never throw into the caller's flow: a bug here must not fail a submission.
   */
  async onChallengePassed(userId: string, taskId: string): Promise<void> {
    try {
      const tracks = await this.prisma.learningTrack.findMany({
        where: { published: true, items: { some: { taskId } } },
        select: { id: true },
      });
      for (const t of tracks) await this.ensureTrackCompletion(userId, t.id);
    } catch (e) {
      this.logger.warn(`onChallengePassed hook failed for user=${userId} task=${taskId}: ${e}`);
    }
  }

  /**
   * Hook — called from LearnService.completeLesson on course completion. Must
   * never throw into the caller's flow: a bug here must not fail a lesson
   * completion.
   */
  async onCourseCompleted(userId: string, courseId: string): Promise<void> {
    try {
      const tracks = await this.prisma.learningTrack.findMany({
        where: { published: true, items: { some: { courseId } } },
        select: { id: true },
      });
      for (const t of tracks) await this.ensureTrackCompletion(userId, t.id);
    } catch (e) {
      this.logger.warn(`onCourseCompleted hook failed for user=${userId} course=${courseId}: ${e}`);
    }
  }
}
