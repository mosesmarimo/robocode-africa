import { z } from "zod";
import { PUBLISH_DOMAINS } from "./constants";

/** `POST /projects/:id/publish` body. `domain` is checked against the
 * configured PUBLISH_DOMAINS list (can't use z.enum — it's env-driven, not a
 * literal tuple — so this is the enum-ish equivalent via refine). */
export const publishSchema = z.object({
  domain: z.string().refine((d) => PUBLISH_DOMAINS.includes(d), {
    message: `domain must be one of: ${PUBLISH_DOMAINS.join(", ")}`,
  }),
  subdomain: z.string().trim().toLowerCase().min(1).max(40),
});
export type PublishInput = z.infer<typeof publishSchema>;

/** Admin/mod takedown body (folded into the admin/moderation controller). */
export const takedownSchema = z.object({
  domain: z.string().min(1),
  subdomain: z.string().trim().toLowerCase().min(1).max(40),
  reason: z.string().trim().min(3).max(500),
});
export type TakedownInput = z.infer<typeof takedownSchema>;

export interface AvailabilityResult {
  available: boolean;
  reason?: string;
}

/** The public, PII-free render payload for a published project. */
export interface PublishedProjectPayload {
  title: string;
  kind: string;
  boardType: string;
  diagram: unknown;
  files: { name: string; content: string }[];
  ownerDisplayName: string;
  ownerReferralCode: string | null;
  updatedAt: Date;
}
