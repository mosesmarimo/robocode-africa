import { z } from "zod";

/**
 * A single editor file as sent by the Studio client.
 * Mirrors the old `FileInput = { name; language; content }`.
 */
export const fileInputSchema = z.object({
  name: z.string().min(1, "File name is required."),
  language: z.string().min(1, "Language is required."),
  content: z.string(),
});
export type FileInput = z.infer<typeof fileInputSchema>;

/**
 * The circuit diagram is stored as JSON (Prisma `Json` column). We don't import
 * the frontend's Diagram type — treat it loosely as an arbitrary JSON object.
 */
export const diagramSchema = z.record(z.string(), z.unknown());
export type Diagram = z.infer<typeof diagramSchema>;

/**
 * Body for creating a project. Mirrors the old `createProject` action input.
 */
export const createProjectSchema = z.object({
  title: z.string(),
  board: z.string().min(1, "Board is required."),
  diagram: diagramSchema,
  files: z.array(fileInputSchema),
});
export type CreateProjectInput = z.infer<typeof createProjectSchema>;

/**
 * Body for saving a project. Mirrors the old `saveProject` action input
 * (minus `projectId`, which comes from the route param).
 */
export const saveProjectSchema = z.object({
  title: z.string(),
  board: z.string().min(1, "Board is required."),
  diagram: diagramSchema,
  files: z.array(fileInputSchema),
});
export type SaveProjectInput = z.infer<typeof saveProjectSchema>;
