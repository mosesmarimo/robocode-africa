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

/**
 * Reset a user's password. Omit `password` to have the server generate a
 * temporary one (returned once so the admin can hand it over).
 */
export const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, "Use at least 8 characters.")
    .max(72, "Password is too long (max 72 characters).")
    .optional(),
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
