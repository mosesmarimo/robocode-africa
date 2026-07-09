import { z } from "zod";

/**
 * Body for enrolling the current user in a course.
 * Mirrors the old `enroll(courseId)` server action argument.
 */
export const enrollSchema = z.object({
  courseId: z.string().min(1, "courseId is required."),
});
export type EnrollInput = z.infer<typeof enrollSchema>;

/**
 * Body for marking a lesson complete.
 * Mirrors the old `completeLesson(lessonId, courseId)` server action arguments.
 */
export const completeLessonSchema = z.object({
  lessonId: z.string().min(1, "lessonId is required."),
  courseId: z.string().min(1, "courseId is required."),
});
export type CompleteLessonInput = z.infer<typeof completeLessonSchema>;

/**
 * Body for awarding XP on a `tryit`/`exercise` lesson-block completion (the
 * frontend's Content Library rich blocks — see GamificationService.completeTask).
 * `language`, if given, is validated against the frozen 12 in LearnService
 * (not here) — an unrecognized value is silently ignored (treated as no
 * language) rather than rejected, since the caller shouldn't fail an XP award
 * just because of an unexpected/older language tag.
 */
export const completeTaskSchema = z.object({
  type: z.enum(["tryit", "exercise"]),
  refId: z.string().min(1, "refId is required.").max(200, "refId is too long."),
  language: z.string().min(1).max(20).optional(),
});
export type CompleteTaskInput = z.infer<typeof completeTaskSchema>;
