import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { GamificationService } from "../../common/gamification.service";
import { TracksService } from "../tracks/tracks.service";
import {
  ALL_LANGUAGES,
  TRACKS,
  trackForLanguage,
  INTERACTIVE_TASK_DAILY_CAP,
  type Track,
  type GamificationTaskType,
} from "../../domain/constants";
import type { AuthUser } from "../../auth/auth-user.type";
import type { EnrollInput, CompleteLessonInput, CompleteTaskInput } from "./dto";

/** Start of the current UTC day (for daily-cap windows). Mirrors the same helper in referrals.service.ts. */
function startOfTodayUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

@Injectable()
export class LearnService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gamification: GamificationService,
    private readonly tracks: TracksService,
  ) {}

  // ---------------------------------------------------------------------------
  // Reads (port of the RSC pages' direct Prisma queries)
  // ---------------------------------------------------------------------------

  /**
   * Learn landing page data: published courses visible to the user (global or
   * their tenant), grouped by track, plus the user's enrollments/progress and
   * the summary counters the hero shows. Mirrors `learn/page.tsx`.
   */
  async listCourses(user: AuthUser) {
    const [courses, enrollments] = await Promise.all([
      this.prisma.course.findMany({
        where: {
          published: true,
          OR: [{ tenantId: null }, { tenantId: user.tenantId }],
        },
        orderBy: { order: "asc" },
        include: { _count: { select: { lessons: true } } },
      }),
      this.prisma.enrollment.findMany({
        where: { userId: user.id },
        select: { courseId: true, progress: true },
      }),
    ]);

    // Per-course progress percent (keyed by courseId), as the page builds.
    const enrollMap: Record<string, number> = {};
    for (const e of enrollments) {
      enrollMap[e.courseId] = (e.progress as { percent?: number })?.percent ?? 0;
    }

    // Group courses by track preserving track order.
    const trackOrder: Track[] = [...TRACKS];
    const grouped: Record<Track, typeof courses> = {} as Record<Track, typeof courses>;
    for (const t of trackOrder) grouped[t] = [];
    for (const c of courses) {
      const t = c.track as Track;
      if (grouped[t]) grouped[t].push(c);
    }

    const totalCourses = courses.length;
    const enrolledCount = enrollments.length;
    const completedCount = enrollments.filter(
      (e) => ((e.progress as { percent?: number })?.percent ?? 0) >= 100,
    ).length;

    return {
      courses,
      enrollMap,
      grouped,
      trackOrder,
      stats: { totalCourses, enrolledCount, completedCount },
    };
  }

  /**
   * Course detail page data: a published course (lessons + tasks) the user may
   * see, plus their enrollment, completed-lesson set, and the derived counters /
   * "continue" CTA target. Mirrors `learn/[slug]/page.tsx`.
   */
  async getCourse(user: AuthUser, slug: string) {
    const course = await this.prisma.course.findUnique({
      where: { slug },
      include: {
        lessons: { orderBy: { order: "asc" } },
        tasks: true,
      },
    });

    if (!course || !course.published) throw new NotFoundException("NOT_FOUND");

    // Scope check: non-staff users only see global or their tenant's courses.
    const isStaffUser = user.role === "super_admin" || user.role === "moderator";
    if (!isStaffUser && course.tenantId !== null && course.tenantId !== user.tenantId) {
      throw new NotFoundException("NOT_FOUND");
    }

    const [enrollment, lessonProgresses] = await Promise.all([
      this.prisma.enrollment.findUnique({
        where: { userId_courseId: { userId: user.id, courseId: course.id } },
      }),
      this.prisma.lessonProgress.findMany({
        where: {
          userId: user.id,
          lessonId: { in: course.lessons.map((l) => l.id) },
        },
        select: { lessonId: true, status: true },
      }),
    ]);

    const completedLessonIds = lessonProgresses
      .filter((lp) => lp.status === "completed")
      .map((lp) => lp.lessonId);
    const completedSet = new Set(completedLessonIds);

    const enrolledPercent = enrollment
      ? ((enrollment.progress as { percent?: number })?.percent ?? 0)
      : null;

    const totalLessons = course.lessons.length;
    const completedLessons = completedSet.size;
    const totalMinutes = course.lessons.reduce(
      (sum, l) => sum + (l.estMinutes ?? 0),
      0,
    );

    // First incomplete lesson for the "continue" CTA.
    const nextLesson =
      course.lessons.find((l) => !completedSet.has(l.id)) ?? course.lessons[0] ?? null;

    return {
      course,
      enrollment,
      enrolledPercent,
      completedLessonIds,
      stats: { totalLessons, completedLessons, totalMinutes },
      nextLesson,
    };
  }

  /**
   * Lesson detail page data: the course (lessons in order), the target lesson
   * with its body content, prev/next lesson navigation, and the user's
   * enrollment + completion status. Mirrors `learn/[slug]/[lessonSlug]/page.tsx`.
   */
  async getLesson(user: AuthUser, slug: string, lessonSlug: string) {
    // Load course + lessons in order.
    const course = await this.prisma.course.findUnique({
      where: { slug },
      include: {
        lessons: { orderBy: { order: "asc" } },
      },
    });

    if (!course || !course.published) throw new NotFoundException("NOT_FOUND");

    // Scope check.
    const isStaffUser = user.role === "super_admin" || user.role === "moderator";
    if (!isStaffUser && course.tenantId !== null && course.tenantId !== user.tenantId) {
      throw new NotFoundException("NOT_FOUND");
    }

    const lessonIdx = course.lessons.findIndex((l) => l.slug === lessonSlug);
    if (lessonIdx === -1) throw new NotFoundException("NOT_FOUND");

    const lesson = course.lessons[lessonIdx];
    const prevLesson = lessonIdx > 0 ? course.lessons[lessonIdx - 1] : null;
    const nextLesson =
      lessonIdx < course.lessons.length - 1 ? course.lessons[lessonIdx + 1] : null;

    // Check enrollment + completion status.
    const [enrollment, lessonProgress] = await Promise.all([
      this.prisma.enrollment.findUnique({
        where: { userId_courseId: { userId: user.id, courseId: course.id } },
        select: { id: true },
      }),
      this.prisma.lessonProgress.findUnique({
        where: { userId_lessonId: { userId: user.id, lessonId: lesson.id } },
        select: { status: true },
      }),
    ]);

    const isEnrolled = enrollment !== null;
    const isCompleted = lessonProgress?.status === "completed";

    return {
      course,
      lesson,
      lessonIndex: lessonIdx,
      prevLesson,
      nextLesson,
      isEnrolled,
      isCompleted,
    };
  }

  // ---------------------------------------------------------------------------
  // Mutations (port of `lib/learn/actions.ts` + inline "use server" actions)
  // ---------------------------------------------------------------------------

  /**
   * Scope guard shared by every mutation path: a course is actionable only if
   * it's published and either global (tenantId null) or owned by the user's
   * tenant — unless the user is platform staff. Throws NotFoundException
   * otherwise (so arbitrary ids can't be enrolled in / completed for points
   * farming or cross-tenant progress).
   */
  private assertCourseAccessible(user: AuthUser, course: { published: boolean; tenantId: string | null }): void {
    const isStaffUser = user.role === "super_admin" || user.role === "moderator";
    if (!course.published || (!isStaffUser && course.tenantId !== null && course.tenantId !== user.tenantId)) {
      throw new NotFoundException("NOT_FOUND");
    }
  }

  /** Load a course the user is allowed to act on (see assertCourseAccessible). */
  private async loadScopedCourse(user: AuthUser, courseId: string) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException("NOT_FOUND");
    this.assertCourseAccessible(user, course);
    return course;
  }

  /** Enroll the current user in a course. Mirrors the old `enroll` action. */
  async enroll(user: AuthUser, data: EnrollInput) {
    // Scope guard: only published global/own-tenant courses (or staff) may be enrolled.
    await this.loadScopedCourse(user, data.courseId);

    await this.prisma.enrollment.upsert({
      where: { userId_courseId: { userId: user.id, courseId: data.courseId } },
      create: { userId: user.id, courseId: data.courseId, progress: { percent: 0 } },
      update: {},
    });
    return { ok: true };
  }

  /**
   * Mark a lesson complete, award lesson-completion points (idempotent), and
   * recompute the course progress percent. Mirrors the old `completeLesson`.
   */
  async completeLesson(user: AuthUser, data: CompleteLessonInput) {
    const { lessonId, courseId } = data;

    // Scope guard: the course must be visible to the user (published, global or
    // own-tenant, or staff). Reject before doing anything else.
    const course = await this.loadScopedCourse(user, courseId);

    // Verify the lesson actually belongs to the given course — otherwise a user
    // could pair an in-scope courseId with any lessonId to farm LESSON_COMPLETE
    // points or corrupt progress for unrelated lessons.
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { courseId: true },
    });
    if (!lesson || lesson.courseId !== courseId) throw new NotFoundException("NOT_FOUND");

    const existing = await this.prisma.lessonProgress.findUnique({
      where: { userId_lessonId: { userId: user.id, lessonId } },
    });
    if (existing?.status === "completed") return { ok: true, already: true };

    await this.prisma.lessonProgress.upsert({
      where: { userId_lessonId: { userId: user.id, lessonId } },
      create: { userId: user.id, lessonId, status: "completed", completedAt: new Date() },
      update: { status: "completed", completedAt: new Date() },
    });
    // Lessons don't carry their own `language` — they inherit it from their
    // course. `Course.language` is set only for courses unambiguously tied to
    // one of the frozen 12 (the `lang-<language>` tutorial courses; see
    // scripts/backfill-course-task-tags.ts), so most courses still complete
    // with `language` null. Track mirrors the challenge path in
    // competitions.service.ts: prefer the language-derived track (matches
    // Course.language's actual track whenever we set it), falling back to
    // the course's own `track` field when language is unset. A course track
    // of "ai" doesn't map to either gamification track, so it's left
    // untagged rather than mis-tagged.
    const track =
      trackForLanguage(course.language) ??
      (course.track === "coding" || course.track === "robotics" ? course.track : undefined);
    // The 12 W3Schools-style language tutorial courses (prisma/content/tutorials-*.ts)
    // are seeded with a `tutorial-<language>` slug (see prisma/content/index.ts
    // TUTORIAL_MODULES / tutorials.smoke.ts) — their lessons pay the lower
    // "tutorial-lesson" XP tier instead of the standard "lesson" tier.
    const taskType: GamificationTaskType = course.slug.startsWith("tutorial-") ? "tutorial-lesson" : "lesson";
    await this.gamification.completeTask({
      userId: user.id,
      type: taskType,
      refId: lessonId,
      language: course.language,
      track,
    });

    // update course progress percent
    const [total, done] = await Promise.all([
      this.prisma.lesson.count({ where: { courseId } }),
      this.prisma.lessonProgress.count({
        where: { userId: user.id, status: "completed", lesson: { courseId } },
      }),
    ]);
    const percent = total ? Math.round((done / total) * 100) : 0;
    await this.prisma.enrollment.upsert({
      where: { userId_courseId: { userId: user.id, courseId } },
      create: { userId: user.id, courseId, progress: { percent } },
      update: { progress: { percent }, completedAt: percent >= 100 ? new Date() : null },
    });

    // Course-complete XP, paid once per course per user (idempotent on
    // `task:course-complete:<courseId>:<userId>` — safe to re-run every time
    // percent recomputes to 100, e.g. a lesson re-completed after content edits).
    if (percent >= 100) {
      await this.gamification.completeTask({
        userId: user.id,
        type: "course-complete",
        refId: courseId,
        language: course.language,
        track,
      });
      await this.tracks.onCourseCompleted(user.id, courseId);
    }

    return { ok: true, percent };
  }

  /**
   * Validate that `refId` names a REAL `tryit`/`exercise` block the caller can
   * access, closing the XP-farming hole where any string refId + language
   * combo could mint unlimited XP. Both the frontend (`LessonBody` in
   * robocode-frontend/src/components/learn/lesson-body.tsx) and mobile
   * (`lib/widgets/rich_content.dart`) construct refId as
   * `${lessonId}#${blockIndex}` (fallback `lesson#${index}` when no lesson id
   * is available, which never resolves here and is rejected) — the block's
   * position in `Lesson.body.blocks`, 0-indexed. Lesson content blocks have no
   * stable id (see prisma/content/types.ts `Block`), so the index IS the only
   * identity available; reordering authored content shifts refIds, which is
   * an accepted content-authoring constraint, not a security concern.
   *
   * Returns the block's own `language` (tryit/exercise blocks always carry
   * one) on success. Throws BadRequestException/NotFoundException — and
   * awards nothing — when refId doesn't parse, the lesson doesn't exist or
   * isn't in an accessible course, the index is out of range, the block at
   * that index isn't a `type`-matching tryit/exercise block, or its language
   * doesn't match the request's.
   */
  private async resolveInteractiveBlockRef(user: AuthUser, data: CompleteTaskInput): Promise<string> {
    const hashIdx = data.refId.indexOf("#");
    if (hashIdx <= 0) throw new BadRequestException("INVALID_REF_ID");
    const lessonId = data.refId.slice(0, hashIdx);
    const indexPart = data.refId.slice(hashIdx + 1);
    if (!/^\d+$/.test(indexPart)) throw new BadRequestException("INVALID_REF_ID");
    const index = Number(indexPart);

    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { course: true },
    });
    if (!lesson) throw new NotFoundException("NOT_FOUND");
    // Same accessibility rule as every other mutation path — published,
    // global or own-tenant (or staff) — so a lesson in a draft/foreign-tenant
    // course can't be used to farm XP either.
    this.assertCourseAccessible(user, lesson.course);

    const blocks = (lesson.body as { blocks?: Array<Record<string, unknown>> } | null)?.blocks;
    const block = blocks?.[index];
    if (!block || block.type !== data.type) throw new NotFoundException("NOT_FOUND");

    const blockLanguage = typeof block.language === "string" ? block.language : undefined;
    if (!blockLanguage || blockLanguage !== data.language) {
      throw new BadRequestException("LANGUAGE_MISMATCH");
    }
    return blockLanguage;
  }

  /**
   * Award XP for a `tryit` (first successful run) or `exercise` completion
   * inside a Content Library lesson block. `refId` must resolve to a real
   * tryit/exercise block in an accessible lesson (resolveInteractiveBlockRef)
   * — otherwise this throws and awards nothing. On top of that, a per-user
   * daily cap (INTERACTIVE_TASK_DAILY_CAP) backstops abuse even if a bug ever
   * slipped past the refId check: once a user has banked that many genuinely
   * new tryit/exercise awards today (UTC), further first-time completions
   * no-op (`alreadyDone`-shaped response, 0 XP) rather than erroring, so the
   * calling UI doesn't need special-case handling. Repeat calls for a refId
   * already paid today don't count against the cap and still resolve via
   * GamificationService.completeTask's own idempotency
   * (`task:<type>:<refId>:<userId>`).
   */
  async completeTask(user: AuthUser, data: CompleteTaskInput) {
    const blockLanguage = await this.resolveInteractiveBlockRef(user, data);
    // blockLanguage is validated above to equal data.language, so it's already
    // one of the frozen 12 whenever the client sends a recognized value; this
    // mirrors the same ALL_LANGUAGES guard the other completeTask paths use.
    const language = (ALL_LANGUAGES as readonly string[]).includes(blockLanguage) ? blockLanguage : undefined;

    const idemKey = `task:${data.type}:${data.refId}:${user.id}`;
    const existing = await this.prisma.roboPointLedger.findUnique({
      where: { idemKey },
      select: { id: true },
    });
    if (!existing) {
      const awardedToday = await this.prisma.roboPointLedger.count({
        where: {
          userId: user.id,
          refType: { in: ["tryit", "exercise"] },
          createdAt: { gte: startOfTodayUtc() },
        },
      });
      if (awardedToday >= INTERACTIVE_TASK_DAILY_CAP) {
        return { awarded: 0, alreadyDone: true };
      }
    }

    return this.gamification.completeTask({
      userId: user.id,
      type: data.type,
      refId: data.refId,
      language,
    });
  }
}
