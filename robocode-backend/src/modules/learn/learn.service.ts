import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { PointsService } from "../../common/points.service";
import { POINTS, TRACKS, type Track } from "../../domain/constants";
import type { AuthUser } from "../../auth/auth-user.type";
import type { EnrollInput, CompleteLessonInput } from "./dto";

@Injectable()
export class LearnService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly points: PointsService,
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

  /** Enroll the current user in a course. Mirrors the old `enroll` action. */
  async enroll(user: AuthUser, data: EnrollInput) {
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

    const existing = await this.prisma.lessonProgress.findUnique({
      where: { userId_lessonId: { userId: user.id, lessonId } },
    });
    if (existing?.status === "completed") return { ok: true, already: true };

    await this.prisma.lessonProgress.upsert({
      where: { userId_lessonId: { userId: user.id, lessonId } },
      create: { userId: user.id, lessonId, status: "completed", completedAt: new Date() },
      update: { status: "completed", completedAt: new Date() },
    });
    await this.points.awardPoints({
      userId: user.id,
      delta: POINTS.LESSON_COMPLETE,
      reason: "Completed a lesson",
      refType: "lesson",
      refId: lessonId,
      idemKey: `lesson-${user.id}-${lessonId}`,
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
    return { ok: true, percent };
  }
}
