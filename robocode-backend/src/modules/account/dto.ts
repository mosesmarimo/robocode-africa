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
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
