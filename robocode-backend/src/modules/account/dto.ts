import { z } from "zod";

// Locales supported by the app (mirrors old updateProfile validLocales).
export const VALID_LOCALES = ["en", "sn", "nd", "sw", "zu", "fr", "pt"] as const;

/**
 * Body for updating the current user's profile/settings.
 * Mirrors the old `updateProfile` server action arguments.
 */
export const updateProfileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, "Display name cannot be empty.")
    .max(64, "Display name must be 64 characters or fewer."),
  locale: z.enum(VALID_LOCALES, { message: "Invalid language selection." }),
  // Optional: when blank we keep the existing avatarSeed (handled in the service).
  avatarSeed: z.string().optional().default(""),
  // Social profile fields (optional). tagline = one-line headline; bio = "about me".
  tagline: z.string().trim().max(120, "Tagline must be 120 characters or fewer.").optional(),
  bio: z.string().trim().max(1000, "Bio must be 1000 characters or fewer.").optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

/** Body for the self-service password change. */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Enter your current password."),
  newPassword: z
    .string()
    .min(8, "Use at least 8 characters.")
    .max(128, "Password is too long."),
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
