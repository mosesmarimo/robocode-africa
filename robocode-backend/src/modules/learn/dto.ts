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
