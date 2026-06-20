import { z } from "zod";

// ---------------------------------------------------------------------------
// Student approvals / membership
// ---------------------------------------------------------------------------

/** Reject a pending student (optional reason). */
export const rejectStudentSchema = z.object({
  reason: z.string().optional(),
});
export type RejectStudentInput = z.infer<typeof rejectStudentSchema>;

// ---------------------------------------------------------------------------
// Branding
// ---------------------------------------------------------------------------

/** Update the school's branding tokens (mirrors old BrandingInput). */
export const brandingSchema = z.object({
  primary: z.string(),
  secondary: z.string(),
  accent: z.string(),
  tagline: z.string(),
  logoUrl: z.string().optional(),
});
export type BrandingInput = z.infer<typeof brandingSchema>;

// ---------------------------------------------------------------------------
// Policies
// ---------------------------------------------------------------------------

/** Update the school's policy flags (mirrors old PoliciesInput). */
export const policiesSchema = z.object({
  autoApprove: z.boolean(),
});
export type PoliciesInput = z.infer<typeof policiesSchema>;

// ---------------------------------------------------------------------------
// Custom domain
// ---------------------------------------------------------------------------

/** Add a custom domain to the school (generates a TXT verification token). */
export const addDomainSchema = z.object({
  hostname: z.string().min(1),
});
export type AddDomainInput = z.infer<typeof addDomainSchema>;
