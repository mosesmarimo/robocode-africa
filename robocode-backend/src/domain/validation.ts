import { z } from "zod";

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

const currentYear = new Date().getFullYear();

export const studentSignupSchema = z
  .object({
    displayName: z.string().min(2, "Tell us your name"),
    email: z.string().email("Enter a valid email"),
    password: z.string().min(6, "Use at least 6 characters"),
    birthYear: z.coerce
      .number()
      .int()
      .min(currentYear - 100, "Check the year")
      .max(currentYear, "Check the year"),
    guardianEmail: z.string().email("Enter a valid guardian email").optional().or(z.literal("")),
  })
  .refine(
    (d) => {
      const age = currentYear - d.birthYear;
      return age >= 13 || !!d.guardianEmail;
    },
    { message: "A parent/guardian email is required for under-13s", path: ["guardianEmail"] },
  );

export const schoolSignupSchema = z.object({
  schoolName: z.string().min(2, "Enter the school name"),
  slug: z
    .string()
    .min(3, "At least 3 characters")
    .transform((s) => slugify(s)),
  adminName: z.string().min(2, "Enter your name"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Use at least 6 characters"),
});

export type StudentSignupInput = z.infer<typeof studentSignupSchema>;
export type SchoolSignupInput = z.infer<typeof schoolSignupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
