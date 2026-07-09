import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { LearnService } from "./learn.service";
import { ZodPipe } from "../../common/zod.pipe";
import { RequireActive, CurrentUser } from "../../auth/decorators";
import type { AuthUser } from "../../auth/auth-user.type";
import {
  enrollSchema,
  type EnrollInput,
  completeLessonSchema,
  type CompleteLessonInput,
  completeTaskSchema,
  type CompleteTaskInput,
} from "./dto";

@Controller("learn")
export class LearnController {
  constructor(private readonly learn: LearnService) {}

  // --- Reads ---------------------------------------------------------------

  /** Learn landing: published courses (grouped by track) + enrollments/progress. */
  @RequireActive()
  @Get("courses")
  listCourses(@CurrentUser() user: AuthUser) {
    return this.learn.listCourses(user);
  }

  /** Course detail by slug: lessons + tasks + the user's enrollment/progress. */
  @RequireActive()
  @Get("courses/:slug")
  getCourse(@CurrentUser() user: AuthUser, @Param("slug") slug: string) {
    return this.learn.getCourse(user, slug);
  }

  /** Lesson detail by course + lesson slug: content + nav + progress/enrollment. */
  @RequireActive()
  @Get("courses/:slug/lessons/:lessonSlug")
  getLesson(
    @CurrentUser() user: AuthUser,
    @Param("slug") slug: string,
    @Param("lessonSlug") lessonSlug: string,
  ) {
    return this.learn.getLesson(user, slug, lessonSlug);
  }

  // --- Mutations -----------------------------------------------------------

  /** Enroll the current user in a course. Mirrors the old `enroll` action. */
  @RequireActive()
  @Post("enroll")
  enroll(
    @CurrentUser() user: AuthUser,
    @Body(new ZodPipe(enrollSchema)) body: EnrollInput,
  ) {
    return this.learn.enroll(user, body);
  }

  /** Mark a lesson complete (awards points, recomputes course progress). */
  @RequireActive()
  @Post("complete-lesson")
  completeLesson(
    @CurrentUser() user: AuthUser,
    @Body(new ZodPipe(completeLessonSchema)) body: CompleteLessonInput,
  ) {
    return this.learn.completeLesson(user, body);
  }

  /**
   * Award XP for a try-it (first success) or exercise completion inside a
   * Content Library lesson block. Idempotent — repeat calls for the same
   * (type, refId, user) report `alreadyDone: true` and award 0. Throttled
   * tighter than the app-wide default (see LearnService.completeTask for the
   * refId-validation + daily-cap defenses against XP farming).
   */
  @RequireActive()
  @Throttle({ default: { ttl: 60_000, limit: 60 } })
  @Post("complete-task")
  completeTask(
    @CurrentUser() user: AuthUser,
    @Body(new ZodPipe(completeTaskSchema)) body: CompleteTaskInput,
  ) {
    return this.learn.completeTask(user, body);
  }
}
