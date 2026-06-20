"use server";

import { redirect } from "next/navigation";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/prisma";
import { getActiveTenant } from "@/lib/tenant";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, destroySession } from "@/lib/auth/session";
import { studentSignupSchema, schoolSignupSchema, loginSchema } from "@/lib/validation";
import { notify, sendEmail } from "@/lib/notify";

export type ActionState = { ok?: boolean; error?: string; fieldErrors?: Record<string, string> };

function zodToFieldErrors(error: import("zod").ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

async function notifyApprovers(tenantId: string, isPlatform: boolean, subject: string) {
  const roles = isPlatform ? ["super_admin", "moderator"] : ["school_admin"];
  const approvers = await prisma.user.findMany({
    where: { tenantId, role: { in: roles }, status: "active" },
    select: { id: true },
  });
  await Promise.all(
    approvers.map((a) =>
      notify({ userId: a.id, type: "approval", title: "New signup awaiting approval", body: subject }),
    ),
  );
}

export async function studentSignup(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = studentSignupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: zodToFieldErrors(parsed.error) };
  const data = parsed.data;

  const tenant = await getActiveTenant();
  if (!tenant) return { error: "Could not resolve the school. Please try again." };

  const existing = await prisma.user.findUnique({
    where: { tenantId_email: { tenantId: tenant.id, email: data.email } },
  });
  if (existing) return { fieldErrors: { email: "An account with this email already exists." } };

  const age = new Date().getFullYear() - data.birthYear;
  const isMinor = age < 18;
  const needsConsent = age < 13;

  const user = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: data.email,
      displayName: data.displayName,
      passwordHash: await hashPassword(data.password),
      role: "student",
      status: "pending",
      isMinor,
      birthYear: data.birthYear,
      guardianEmail: data.guardianEmail || null,
      avatarSeed: nanoid(8),
    },
  });

  await prisma.approvalRequest.create({
    data: {
      userId: user.id,
      tenantId: tenant.id,
      type: tenant.isPlatform ? "student_direct" : "student_school",
    },
  });

  if (needsConsent && data.guardianEmail) {
    const token = nanoid(24);
    await prisma.consentRecord.create({
      data: { userId: user.id, guardianEmail: data.guardianEmail, token },
    });
    await sendEmail(
      data.guardianEmail,
      "Approve your child's RoboCode.Africa account",
      `Please confirm consent: ${process.env.NEXT_PUBLIC_ROOT_DOMAIN}/consent/${token}`,
    );
  }

  await notifyApprovers(
    tenant.id,
    tenant.isPlatform,
    `${data.displayName} (${data.email}) requested a student account.`,
  );

  redirect("/pending");
}

export async function schoolSignup(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = schoolSignupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: zodToFieldErrors(parsed.error) };
  const data = parsed.data;

  const slugTaken = await prisma.tenant.findUnique({ where: { slug: data.slug } });
  if (slugTaken) return { fieldErrors: { slug: "That subdomain is taken." } };

  const tenant = await prisma.tenant.create({
    data: {
      slug: data.slug,
      name: data.schoolName,
      status: "pending",
      branding: { tagline: `${data.schoolName} · powered by RoboCode.Africa` },
      policies: { autoApprove: false },
    },
  });
  await prisma.domain.create({
    data: { tenantId: tenant.id, hostname: `${data.slug}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`, type: "subdomain", verified: true },
  });

  const admin = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: data.email,
      displayName: data.adminName,
      passwordHash: await hashPassword(data.password),
      role: "school_admin",
      status: "pending",
      isMinor: false,
      avatarSeed: nanoid(8),
    },
  });
  await prisma.approvalRequest.create({
    data: { userId: admin.id, tenantId: tenant.id, type: "teacher" },
  });

  const platform = await prisma.tenant.findFirst({ where: { isPlatform: true } });
  if (platform) {
    await notifyApprovers(platform.id, true, `New school "${data.schoolName}" registered and awaits approval.`);
  }

  redirect("/pending?school=1");
}

export async function login(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: zodToFieldErrors(parsed.error) };
  const { email, password } = parsed.data;

  const tenant = await getActiveTenant();
  // Allow login by email within the active tenant, falling back to any tenant (dev convenience).
  let user = tenant
    ? await prisma.user.findUnique({ where: { tenantId_email: { tenantId: tenant.id, email } } })
    : null;
  if (!user) user = await prisma.user.findFirst({ where: { email } });

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { error: "Incorrect email or password." };
  }
  if (user.status === "pending") return { error: "Your account is awaiting approval." };
  if (user.status === "suspended") return { error: "This account has been suspended." };
  if (user.status === "rejected") return { error: "This account request was declined." };

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await createSession({ uid: user.id, role: user.role, tid: user.tenantId });
  redirect("/app");
}

export async function logout() {
  await destroySession();
  redirect("/");
}
