import { z } from "zod";

/** Reject a user approval request (optional reason). */
export const rejectUserSchema = z.object({
  reason: z.string().optional(),
});
export type RejectUserInput = z.infer<typeof rejectUserSchema>;

/** Resolve a moderation case as either resolved or dismissed. */
export const resolveModerationSchema = z.object({
  action: z.enum(["resolved", "dismissed"]),
});
export type ResolveModerationInput = z.infer<typeof resolveModerationSchema>;
