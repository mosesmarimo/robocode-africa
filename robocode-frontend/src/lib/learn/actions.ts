"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/auth/current-user";
import { awardPoints, awardBadge } from "@/lib/points";
import { gradeCode, type GradeResult } from "@/lib/sim/grader";
import { POINTS } from "@/lib/domain/constants";

export async function enroll(courseId: string) {
  const user = await requireActiveUser();
  await prisma.enrollment.upsert({
    where: { userId_courseId: { userId: user.id, courseId } },
    create: { userId: user.id, courseId, progress: { percent: 0 } },
    update: {},
  });
  revalidatePath(`/app/learn`);
  return { ok: true };
}

export async function completeLesson(lessonId: string, courseId: string) {
  const user = await requireActiveUser();
  const existing = await prisma.lessonProgress.findUnique({
    where: { userId_lessonId: { userId: user.id, lessonId } },
  });
  if (existing?.status === "completed") return { ok: true, already: true };

  await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId: user.id, lessonId } },
    create: { userId: user.id, lessonId, status: "completed", completedAt: new Date() },
    update: { status: "completed", completedAt: new Date() },
  });
  await awardPoints({
    userId: user.id,
    delta: POINTS.LESSON_COMPLETE,
    reason: "Completed a lesson",
    refType: "lesson",
    refId: lessonId,
    idemKey: `lesson-${user.id}-${lessonId}`,
  });

  // update course progress percent
  const [total, done] = await Promise.all([
    prisma.lesson.count({ where: { courseId } }),
    prisma.lessonProgress.count({
      where: { userId: user.id, status: "completed", lesson: { courseId } },
    }),
  ]);
  const percent = total ? Math.round((done / total) * 100) : 0;
  await prisma.enrollment.upsert({
    where: { userId_courseId: { userId: user.id, courseId } },
    create: { userId: user.id, courseId, progress: { percent } },
    update: { progress: { percent }, completedAt: percent >= 100 ? new Date() : null },
  });
  revalidatePath(`/app/learn`);
  return { ok: true, percent };
}

export async function submitSolution(taskId: string, code: string): Promise<GradeResult> {
  const user = await requireActiveUser();
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) throw new Error("Task not found");

  const result = gradeCode(code, task.checks as { rules?: never[] } | null);

  await prisma.submission.create({
    data: {
      taskId,
      userId: user.id,
      code,
      status: result.passed ? "passed" : "failed",
      score: result.score,
      autoResult: result as unknown as object,
    },
  });

  if (result.passed) {
    await awardPoints({
      userId: user.id,
      delta: task.points,
      reason: `Completed challenge: ${task.title}`,
      refType: "task",
      refId: taskId,
      idemKey: `task-${user.id}-${taskId}`,
    });
    if (task.track === "ai") await awardBadge(user.id, "ai-explorer");
  }
  revalidatePath(`/app/challenges`);
  return result;
}
