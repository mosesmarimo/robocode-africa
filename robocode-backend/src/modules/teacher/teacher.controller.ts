import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { TeacherService } from "./teacher.service";
import { CurrentUser, RequireCapability } from "../../auth/decorators";
import type { AuthUser } from "../../auth/auth-user.type";
import { ZodPipe } from "../../common/zod.pipe";
import {
  addStudentSchema,
  createAssignmentSchema,
  createClassSchema,
  gradeSubmissionSchema,
  type AddStudentInput,
  type CreateAssignmentInput,
  type CreateClassInput,
  type GradeSubmissionInput,
} from "./dto";

/**
 * Teacher domain. Every route is scoped to the CURRENT user's tenant
 * (user.tenantId / user.id). The original pages/actions all required the
 * class.manage capability (held by teacher, school_admin and super_admin);
 * grading additionally maps to assignment.grade.
 */
@Controller("teacher")
export class TeacherController {
  constructor(private readonly teacher: TeacherService) {}

  // =========================================================================
  // READS — one per teacher page
  // =========================================================================

  /** /app/teacher/classes — teacher's classes with member/assignment counts. */
  @RequireCapability("class.manage")
  @Get("classes")
  getClasses(@CurrentUser() user: AuthUser) {
    return this.teacher.getClasses(user);
  }

  /** /app/teacher/classes/[id] — class detail: roster + assignments + task picker. */
  @RequireCapability("class.manage")
  @Get("classes/:id")
  getClassDetail(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.teacher.getClassDetail(user, id);
  }

  /** /app/teacher/assignments — all assignments across the teacher's classes. */
  @RequireCapability("class.manage")
  @Get("assignments")
  getAssignments(@CurrentUser() user: AuthUser) {
    return this.teacher.getAssignments(user);
  }

  /** /app/teacher/grading — pending + recently graded submissions. */
  @RequireCapability("assignment.grade")
  @Get("grading")
  getGradingQueue(@CurrentUser() user: AuthUser) {
    return this.teacher.getGradingQueue(user);
  }

  // =========================================================================
  // MUTATIONS — one per old action function
  // =========================================================================

  /** createClass. */
  @RequireCapability("class.manage")
  @Post("classes")
  createClass(
    @CurrentUser() user: AuthUser,
    @Body(new ZodPipe(createClassSchema)) body: CreateClassInput,
  ) {
    return this.teacher.createClass(user, body.name);
  }

  /** addStudentByEmail. */
  @RequireCapability("class.manage")
  @Post("classes/:classId/students")
  addStudent(
    @CurrentUser() user: AuthUser,
    @Param("classId") classId: string,
    @Body(new ZodPipe(addStudentSchema)) body: AddStudentInput,
  ) {
    return this.teacher.addStudentByEmail(user, classId, body.email);
  }

  /** createAssignment. */
  @RequireCapability("class.manage")
  @Post("assignments")
  createAssignment(
    @CurrentUser() user: AuthUser,
    @Body(new ZodPipe(createAssignmentSchema)) body: CreateAssignmentInput,
  ) {
    return this.teacher.createAssignment(user, body);
  }

  /** gradeSubmission. */
  @RequireCapability("assignment.grade")
  @Post("submissions/:submissionId/grade")
  gradeSubmission(
    @CurrentUser() user: AuthUser,
    @Param("submissionId") submissionId: string,
    @Body(new ZodPipe(gradeSubmissionSchema)) body: GradeSubmissionInput,
  ) {
    return this.teacher.gradeSubmission(user, submissionId, body);
  }
}
