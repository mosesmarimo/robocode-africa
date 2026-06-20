import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { nanoid } from "nanoid";
import { PrismaService } from "../../prisma/prisma.service";
import { NotifyService } from "../../common/notify.service";
import { PointsService } from "../../common/points.service";
import { can } from "../../domain/roles";
import type { AuthUser } from "../../auth/auth-user.type";
import type { CreateAssignmentInput, GradeSubmissionInput } from "./dto";

@Injectable()
export class TeacherService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifier: NotifyService,
    private readonly points: PointsService,
  ) {}

  // ---------------------------------------------------------------------------
  // Internal guard (mirrors old getTeacher()): routes already require
  // class.manage via @RequireCapability; this re-checks, matching the original.
  // ---------------------------------------------------------------------------
  private assertTeacher(actor: AuthUser) {
    if (!can(actor.role, "class.manage")) throw new ForbiddenException("FORBIDDEN");
  }

  /** Load a class owned by this teacher in this tenant, or null. */
  private getOwnedClass(actor: AuthUser, classId: string) {
    return this.prisma.class.findFirst({
      where: { id: classId, tenantId: actor.tenantId, teacherId: actor.id },
    });
  }

  // =========================================================================
  // READS — one method per teacher page
  // =========================================================================

  /** /app/teacher/classes — teacher's classes with member/assignment counts. */
  async getClasses(actor: AuthUser) {
    this.assertTeacher(actor);

    const classes = await this.prisma.class.findMany({
      where: { teacherId: actor.id, tenantId: actor.tenantId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { members: true, assignments: true } },
      },
    });

    const totalStudents = classes.reduce((sum, c) => sum + c._count.members, 0);
    const totalAssignments = classes.reduce((sum, c) => sum + c._count.assignments, 0);

    return { classes, totalStudents, totalAssignments };
  }

  /** /app/teacher/classes/[id] — class detail: roster + assignments + task picker. */
  async getClassDetail(actor: AuthUser, id: string) {
    this.assertTeacher(actor);

    const [cls, tasks] = await Promise.all([
      this.prisma.class.findFirst({
        where: { id, tenantId: actor.tenantId, teacherId: actor.id },
        include: {
          members: {
            include: { user: true },
            orderBy: { id: "asc" },
          },
          assignments: {
            include: { task: { select: { id: true, title: true, difficulty: true } } },
            orderBy: { createdAt: "desc" },
          },
        },
      }),
      this.prisma.task.findMany({
        orderBy: { title: "asc" },
        select: { id: true, title: true, difficulty: true },
      }),
    ]);

    if (!cls) throw new NotFoundException("NOT_FOUND");

    return { cls, tasks };
  }

  /** /app/teacher/assignments — all assignments across the teacher's classes. */
  async getAssignments(actor: AuthUser) {
    this.assertTeacher(actor);

    const [classes, assignments, tasks] = await Promise.all([
      this.prisma.class.findMany({
        where: { teacherId: actor.id, tenantId: actor.tenantId },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
      this.prisma.assignment.findMany({
        where: {
          class: { teacherId: actor.id, tenantId: actor.tenantId },
        },
        include: {
          class: { select: { id: true, name: true } },
          task: { select: { id: true, title: true, difficulty: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.task.findMany({
        orderBy: { title: "asc" },
        select: { id: true, title: true, difficulty: true },
      }),
    ]);

    const upcomingCount = assignments.filter((a) => a.dueAt && new Date(a.dueAt) > new Date()).length;
    const withTaskCount = assignments.filter((a) => a.taskId !== null).length;

    return { classes, assignments, tasks, upcomingCount, withTaskCount };
  }

  /** /app/teacher/grading — pending + recently graded submissions for tenant students. */
  async getGradingQueue(actor: AuthUser) {
    this.assertTeacher(actor);

    // Get all student IDs in this teacher's tenant
    const tenantStudents = await this.prisma.user.findMany({
      where: { tenantId: actor.tenantId, role: "student", status: "active" },
      select: { id: true },
    });
    const studentIds = tenantStudents.map((s) => s.id);

    // All submissions pending review (submitted or passed), scoped to tenant students
    const [pendingSubmissions, gradedSubmissions] = await Promise.all([
      this.prisma.submission.findMany({
        where: {
          userId: { in: studentIds },
          status: { in: ["submitted", "passed"] },
        },
        include: {
          user: { select: { id: true, displayName: true, email: true } },
          task: { select: { id: true, title: true, difficulty: true, points: true } },
        },
        orderBy: { createdAt: "asc" },
        take: 50,
      }),
      this.prisma.submission.findMany({
        where: {
          userId: { in: studentIds },
          status: "graded",
        },
        include: {
          user: { select: { id: true, displayName: true, email: true } },
          task: { select: { id: true, title: true, difficulty: true, points: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
    ]);

    return { pendingSubmissions, gradedSubmissions, studentCount: studentIds.length };
  }

  // =========================================================================
  // MUTATIONS — one method per old action function
  // =========================================================================

  /** createClass — generate a join code and create the class for this teacher. */
  async createClass(actor: AuthUser, name: string) {
    this.assertTeacher(actor);

    const joinCode = nanoid(6).toUpperCase();
    const cls = await this.prisma.class.create({
      data: {
        tenantId: actor.tenantId,
        teacherId: actor.id,
        name,
        joinCode,
      },
    });

    return { ok: true, class: cls };
  }

  /** addStudentByEmail — add an active tenant student to a class the teacher owns. */
  async addStudentByEmail(actor: AuthUser, classId: string, emailRaw: string) {
    this.assertTeacher(actor);

    const email = emailRaw.trim().toLowerCase();

    // Verify the class belongs to this teacher
    const cls = await this.getOwnedClass(actor, classId);
    if (!cls) throw new NotFoundException("Class not found.");

    // Find active student in same tenant
    const student = await this.prisma.user.findFirst({
      where: { email, tenantId: actor.tenantId, role: "student", status: "active" },
    });
    if (!student) {
      throw new BadRequestException({ message: "No active student found with that email in your school." });
    }

    // Check if already a member
    const existing = await this.prisma.classMember.findUnique({
      where: { classId_userId: { classId, userId: student.id } },
    });
    if (existing) {
      throw new BadRequestException({ message: "Student is already in this class." });
    }

    await this.prisma.classMember.create({
      data: { classId, userId: student.id, role: "student" },
    });

    await this.notifier.notify({
      userId: student.id,
      type: "class_added",
      title: `You've been added to ${cls.name}`,
      body: `Your teacher added you to the class "${cls.name}". Join code: ${cls.joinCode}`,
    });

    return { ok: true, studentName: student.displayName };
  }

  /** createAssignment — create an assignment on a class the teacher owns. */
  async createAssignment(actor: AuthUser, input: CreateAssignmentInput) {
    this.assertTeacher(actor);

    const taskId = input.taskId || undefined;
    const instructions = input.instructions || undefined;
    const dueAtRaw = input.dueAt;

    // Verify the class belongs to this teacher
    const cls = await this.getOwnedClass(actor, input.classId);
    if (!cls) throw new NotFoundException("Class not found.");

    const dueAt = dueAtRaw ? new Date(dueAtRaw) : undefined;

    const assignment = await this.prisma.assignment.create({
      data: {
        classId: input.classId,
        title: input.title,
        taskId: taskId || null,
        instructions: instructions || null,
        dueAt: dueAt || null,
      },
    });

    return { ok: true, assignment };
  }

  /** gradeSubmission — grade a tenant student's submission and award points. */
  async gradeSubmission(actor: AuthUser, submissionId: string, input: GradeSubmissionInput) {
    this.assertTeacher(actor);

    const score = input.score;
    const feedback = input.feedback || undefined;

    // Fetch the submission with task and user (ensure student is in teacher's tenant)
    const submission = await this.prisma.submission.findUnique({
      where: { id: submissionId },
      include: { user: true, task: true },
    });
    if (!submission) throw new NotFoundException("Submission not found.");
    if (submission.user.tenantId !== actor.tenantId) throw new ForbiddenException("Access denied.");

    await this.prisma.submission.update({
      where: { id: submissionId },
      data: { status: "graded", score, feedback: feedback || null, gradedById: actor.id },
    });

    // Award points based on task difficulty and score
    if (score >= 50) {
      const pointsMap: Record<string, number> = {
        beginner: 50,
        intermediate: 100,
        advanced: 200,
      };
      const delta = Math.round((score / 100) * (pointsMap[submission.task.difficulty] ?? 50));
      await this.points.awardPoints({
        userId: submission.userId,
        delta,
        reason: `Graded: ${submission.task.title} (${score}/100)`,
        refType: "submission",
        refId: submission.id,
        idemKey: `grade_${submission.id}`,
      });

      await this.notifier.notify({
        userId: submission.userId,
        type: "graded",
        title: `Your submission has been graded!`,
        body: `You scored ${score}/100 on "${submission.task.title}" and earned ${delta} RoboPoints.`,
      });
    }

    return { ok: true };
  }
}
