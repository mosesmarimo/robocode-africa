"use server";

import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { can } from "@/lib/domain/roles";
import { awardPoints } from "@/lib/points";
import { notify } from "@/lib/notify";

async function getTeacher() {
  const user = (await getCurrentUser())!;
  if (!can(user.role, "class.manage")) throw new Error("FORBIDDEN");
  return user;
}

// ── Create Class ─────────────────────────────────────────────────────────────
export async function createClass(formData: FormData) {
  const user = await getTeacher();
  const name = (formData.get("name") as string | null)?.trim();
  if (!name) return { error: "Class name is required." };

  const joinCode = nanoid(6).toUpperCase();
  await prisma.class.create({
    data: {
      tenantId: user.tenantId,
      teacherId: user.id,
      name,
      joinCode,
    },
  });

  revalidatePath("/app/teacher/classes");
  return { ok: true };
}

// ── Add Student by Email ──────────────────────────────────────────────────────
export async function addStudentByEmail(classId: string, formData: FormData) {
  const user = await getTeacher();
  const email = (formData.get("email") as string | null)?.trim().toLowerCase();
  if (!email) return { error: "Email is required." };

  // Verify the class belongs to this teacher
  const cls = await prisma.class.findFirst({
    where: { id: classId, tenantId: user.tenantId, teacherId: user.id },
  });
  if (!cls) return { error: "Class not found." };

  // Find active student in same tenant
  const student = await prisma.user.findFirst({
    where: { email, tenantId: user.tenantId, role: "student", status: "active" },
  });
  if (!student) return { error: "No active student found with that email in your school." };

  // Check if already a member
  const existing = await prisma.classMember.findUnique({
    where: { classId_userId: { classId, userId: student.id } },
  });
  if (existing) return { error: "Student is already in this class." };

  await prisma.classMember.create({
    data: { classId, userId: student.id, role: "student" },
  });

  await notify({
    userId: student.id,
    type: "class_added",
    title: `You've been added to ${cls.name}`,
    body: `Your teacher added you to the class "${cls.name}". Join code: ${cls.joinCode}`,
  });

  revalidatePath(`/app/teacher/classes/${classId}`);
  return { ok: true, studentName: student.displayName };
}

// ── Create Assignment ─────────────────────────────────────────────────────────
export async function createAssignment(formData: FormData) {
  const user = await getTeacher();
  const classId = (formData.get("classId") as string | null)?.trim();
  const title = (formData.get("title") as string | null)?.trim();
  const taskId = (formData.get("taskId") as string | null)?.trim() || undefined;
  const instructions = (formData.get("instructions") as string | null)?.trim() || undefined;
  const dueAtRaw = (formData.get("dueAt") as string | null)?.trim();

  if (!classId || !title) return { error: "Class and title are required." };

  // Verify the class belongs to this teacher
  const cls = await prisma.class.findFirst({
    where: { id: classId, tenantId: user.tenantId, teacherId: user.id },
  });
  if (!cls) return { error: "Class not found." };

  const dueAt = dueAtRaw ? new Date(dueAtRaw) : undefined;

  await prisma.assignment.create({
    data: {
      classId,
      title,
      taskId: taskId || null,
      instructions: instructions || null,
      dueAt: dueAt || null,
    },
  });

  revalidatePath("/app/teacher/assignments");
  revalidatePath(`/app/teacher/classes/${classId}`);
  return { ok: true };
}

// ── Grade Submission ──────────────────────────────────────────────────────────
export async function gradeSubmission(formData: FormData) {
  const user = await getTeacher();
  const submissionId = (formData.get("submissionId") as string | null)?.trim();
  const scoreRaw = formData.get("score") as string | null;
  const feedback = (formData.get("feedback") as string | null)?.trim() || undefined;

  if (!submissionId || scoreRaw === null || scoreRaw === "") {
    return { error: "Submission ID and score are required." };
  }

  const score = parseInt(scoreRaw, 10);
  if (isNaN(score) || score < 0 || score > 100) return { error: "Score must be 0–100." };

  // Fetch the submission with task and user (ensure student is in teacher's tenant)
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: { user: true, task: true },
  });
  if (!submission) return { error: "Submission not found." };
  if (submission.user.tenantId !== user.tenantId) return { error: "Access denied." };

  await prisma.submission.update({
    where: { id: submissionId },
    data: { status: "graded", score, feedback: feedback || null, gradedById: user.id },
  });

  // Award points based on task difficulty and score
  if (score >= 50) {
    const pointsMap: Record<string, number> = {
      beginner: 50,
      intermediate: 100,
      advanced: 200,
    };
    const delta = Math.round((score / 100) * (pointsMap[submission.task.difficulty] ?? 50));
    await awardPoints({
      userId: submission.userId,
      delta,
      reason: `Graded: ${submission.task.title} (${score}/100)`,
      refType: "submission",
      refId: submission.id,
      idemKey: `grade_${submission.id}`,
    });

    await notify({
      userId: submission.userId,
      type: "graded",
      title: `Your submission has been graded!`,
      body: `You scored ${score}/100 on "${submission.task.title}" and earned ${delta} RoboPoints.`,
    });
  }

  revalidatePath("/app/teacher/grading");
  return { ok: true };
}
