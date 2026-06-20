import { z } from "zod";

// ---------------------------------------------------------------------------
// Classes
// ---------------------------------------------------------------------------

/** createClass — name is required (mirrors old FormData "name"). */
export const createClassSchema = z.object({
  name: z.string().trim().min(1, "Class name is required."),
});
export type CreateClassInput = z.infer<typeof createClassSchema>;

/** addStudentByEmail — student email (mirrors old FormData "email"). */
export const addStudentSchema = z.object({
  email: z.string().trim().min(1, "Email is required."),
});
export type AddStudentInput = z.infer<typeof addStudentSchema>;

// ---------------------------------------------------------------------------
// Assignments
// ---------------------------------------------------------------------------

/** createAssignment — class + title required, task/instructions/dueAt optional. */
export const createAssignmentSchema = z.object({
  classId: z.string().trim().min(1, "Class and title are required."),
  title: z.string().trim().min(1, "Class and title are required."),
  taskId: z.string().trim().optional(),
  instructions: z.string().trim().optional(),
  dueAt: z.string().trim().optional(),
});
export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;

// ---------------------------------------------------------------------------
// Grading
// ---------------------------------------------------------------------------

/** gradeSubmission — score 0–100, optional feedback. */
export const gradeSubmissionSchema = z.object({
  score: z.coerce.number().int().min(0, "Score must be 0–100.").max(100, "Score must be 0–100."),
  feedback: z.string().trim().optional(),
});
export type GradeSubmissionInput = z.infer<typeof gradeSubmissionSchema>;
