import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { resolveTxt } from "node:dns/promises";
import { nanoid } from "nanoid";
import { PrismaService } from "../../prisma/prisma.service";
import { NotifyService } from "../../common/notify.service";
import { can } from "../../domain/roles";
import { DEFAULT_BRAND } from "../../common/tenant.service";
import { ROOT_DOMAIN } from "../../domain/constants";
import { hashPassword, generateTempPassword, tempPasswordExpiry } from "../../auth/password.util";
import type { AuthUser } from "../../auth/auth-user.type";
import type { BrandingInput, PoliciesInput } from "./dto";
import { ReferralsService } from "../referrals/referrals.service";

@Injectable()
export class SchoolService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifier: NotifyService,
    private readonly referrals: ReferralsService,
  ) {}

  // ---------------------------------------------------------------------------
  // Internal guard helper (mirrors old getSchoolAdmin())
  // Routes already require tenant.manage via @RequireCapability; this also
  // re-checks and loads/validates the target user is in the actor's tenant.
  // ---------------------------------------------------------------------------
  private async getTenantTarget(actor: AuthUser, userId: string) {
    const target = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!target || target.tenantId !== actor.tenantId) throw new NotFoundException("NOT_FOUND");
    return target;
  }

  /**
   * COPPA gate: an under-13 student may not be activated until a granted
   * guardian ConsentRecord exists. Throws BadRequestException otherwise.
   */
  private async assertConsentForActivation(target: {
    id: string;
    birthYear: number | null;
  }) {
    if (target.birthYear == null) return; // age unknown (e.g. staff) — nothing to gate
    const age = new Date().getFullYear() - target.birthYear;
    if (age >= 13) return;
    const consent = await this.prisma.consentRecord.findUnique({ where: { userId: target.id } });
    if (consent?.status !== "granted") {
      throw new BadRequestException({
        message:
          "This student is under 13 and is awaiting verifiable guardian consent. They can be activated once the guardian has confirmed consent.",
      });
    }
  }

  // =========================================================================
  // READS — one method per school page
  // =========================================================================

  /** /app/school/approvals — pending students + summary counts. */
  async getApprovals(actor: AuthUser) {
    const [pendingUsers, totalStudents, approvedToday] = await Promise.all([
      this.prisma.user.findMany({
        where: { tenantId: actor.tenantId, status: "pending", role: "student" },
        orderBy: { createdAt: "asc" },
        include: { approvalRequest: true },
      }),
      this.prisma.user.count({
        where: { tenantId: actor.tenantId, role: "student", status: "active" },
      }),
      this.prisma.approvalRequest.count({
        where: {
          tenantId: actor.tenantId,
          status: "approved",
          decidedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
    ]);

    return { pendingUsers, totalStudents, approvedToday };
  }

  /** /app/school/branding — current tenant branding tokens (with defaults). */
  async getBranding(actor: AuthUser) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: actor.tenantId } });
    if (!tenant) throw new NotFoundException("NOT_FOUND");

    const branding = (tenant.branding ?? {}) as {
      primary?: string;
      secondary?: string;
      accent?: string;
      tagline?: string;
      logoUrl?: string;
    };

    // Fall back to the single shared DEFAULT_BRAND palette so /school/branding and
    // the public /branding endpoint agree on the default colours.
    const initial = {
      primary: branding.primary ?? DEFAULT_BRAND.primary,
      secondary: branding.secondary ?? DEFAULT_BRAND.secondary,
      accent: branding.accent ?? DEFAULT_BRAND.accent,
      tagline: branding.tagline ?? "",
      logoUrl: branding.logoUrl ?? "",
    };

    return { schoolName: tenant.name, initial };
  }

  /** /app/school/domain — subdomain + custom domain list. */
  async getDomain(actor: AuthUser) {
    const [tenant, domains] = await Promise.all([
      this.prisma.tenant.findUnique({ where: { id: actor.tenantId } }),
      this.prisma.domain.findMany({
        where: { tenantId: actor.tenantId },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    if (!tenant) throw new NotFoundException("NOT_FOUND");

    const subdomain = `${tenant.slug}.${ROOT_DOMAIN}`;
    const customDomain = domains.find((d) => d.type === "custom") ?? null;

    return { tenant: { id: tenant.id, slug: tenant.slug, name: tenant.name }, subdomain, domains, customDomain };
  }

  /** /app/school/members — students, teachers and per-status student counts. */
  async getMembers(actor: AuthUser) {
    const [students, teachers, counts] = await Promise.all([
      this.prisma.user.findMany({
        where: { tenantId: actor.tenantId, role: "student" },
        orderBy: [{ status: "asc" }, { displayName: "asc" }],
        // Bound the roster; per-status totals come from the groupBy below.
        take: 200,
      }),
      this.prisma.user.findMany({
        where: { tenantId: actor.tenantId, role: "teacher" },
        orderBy: { displayName: "asc" },
        take: 200,
      }),
      this.prisma.user.groupBy({
        by: ["status"],
        where: { tenantId: actor.tenantId, role: "student" },
        _count: { _all: true },
      }),
    ]);

    const countMap = Object.fromEntries(counts.map((c) => [c.status, c._count._all]));
    const activeCount = countMap["active"] ?? 0;
    const pendingCount = countMap["pending"] ?? 0;
    const suspendedCount = countMap["suspended"] ?? 0;

    return { students, teachers, activeCount, pendingCount, suspendedCount };
  }

  /** /app/school/reports — analytics overview for the school. */
  async getReports(actor: AuthUser) {
    const tenantId = actor.tenantId;

    const [
      activeStudents,
      projectsCreated,
      lessonsCompleted,
      totalSubmissions,
      passedSubmissions,
      topStudents,
      trackBreakdown,
    ] = await Promise.all([
      this.prisma.user.count({ where: { tenantId, role: "student", status: "active" } }),
      this.prisma.project.count({ where: { tenantId } }),
      this.prisma.lessonProgress.count({
        where: { status: "completed", user: { tenantId } },
      }),
      this.prisma.submission.count({ where: { user: { tenantId } } }),
      this.prisma.submission.count({ where: { user: { tenantId }, status: "passed" } }),
      this.prisma.user.findMany({
        where: { tenantId, role: "student", status: "active" },
        orderBy: { roboPoints: "desc" },
        take: 10,
        select: { id: true, displayName: true, roboPoints: true, level: true },
      }),
      this.prisma.enrollment.groupBy({
        by: ["courseId"],
        where: { user: { tenantId } },
        _count: { _all: true },
      }),
    ]);

    const passRate =
      totalSubmissions > 0 ? Math.round((passedSubmissions / totalSubmissions) * 100) : 0;

    // Get course info for track breakdown
    const courseIds = trackBreakdown.map((t) => t.courseId);
    const courses = await this.prisma.course.findMany({
      where: { id: { in: courseIds } },
      select: { id: true, track: true },
    });
    const courseTrackMap = Object.fromEntries(courses.map((c) => [c.id, c.track]));

    const byTrack: Record<string, number> = {};
    for (const row of trackBreakdown) {
      const track = courseTrackMap[row.courseId] ?? "other";
      byTrack[track] = (byTrack[track] ?? 0) + row._count._all;
    }
    const totalEnrollments = Object.values(byTrack).reduce((a, b) => a + b, 0);

    return {
      activeStudents,
      projectsCreated,
      lessonsCompleted,
      totalSubmissions,
      passedSubmissions,
      passRate,
      topStudents,
      byTrack,
      totalEnrollments,
    };
  }

  // =========================================================================
  // MUTATIONS — one method per old action function
  // =========================================================================

  /** Approve a pending student. */
  async approveStudent(actor: AuthUser, userId: string) {
    const target = await this.getTenantTarget(actor, userId);
    await this.assertConsentForActivation(target);

    await this.prisma.user.update({ where: { id: userId }, data: { status: "active" } });

    await this.referrals.settleIfActive(userId);

    await this.prisma.approvalRequest.upsert({
      where: { userId },
      create: {
        userId,
        tenantId: actor.tenantId,
        type: "student_school",
        status: "approved",
        decidedById: actor.id,
        decidedAt: new Date(),
      },
      update: {
        status: "approved",
        decidedById: actor.id,
        decidedAt: new Date(),
        reason: null,
      },
    });

    await this.notifier.notify({
      userId,
      type: "approval",
      title: "Your account has been approved!",
      body: "Welcome to RoboCode.Africa — you can now log in and start building.",
    });

    await this.prisma.auditLog.create({
      data: {
        tenantId: actor.tenantId,
        actorId: actor.id,
        action: "student.approve",
        targetType: "User",
        targetId: userId,
      },
    });

    return { ok: true };
  }

  /** Reject a pending student (optional reason). */
  async rejectStudent(actor: AuthUser, userId: string, reason?: string) {
    await this.getTenantTarget(actor, userId);

    await this.prisma.user.update({ where: { id: userId }, data: { status: "rejected" } });

    await this.prisma.approvalRequest.upsert({
      where: { userId },
      create: {
        userId,
        tenantId: actor.tenantId,
        type: "student_school",
        status: "rejected",
        decidedById: actor.id,
        decidedAt: new Date(),
        reason: reason ?? null,
      },
      update: {
        status: "rejected",
        decidedById: actor.id,
        decidedAt: new Date(),
        reason: reason ?? null,
      },
    });

    await this.notifier.notify({
      userId,
      type: "approval",
      title: "Your registration was not approved",
      body: reason
        ? `Reason: ${reason}. Please contact your school administrator for more information.`
        : "Please contact your school administrator for more information.",
    });

    await this.prisma.auditLog.create({
      data: {
        tenantId: actor.tenantId,
        actorId: actor.id,
        action: "student.reject",
        targetType: "User",
        targetId: userId,
        meta: { reason },
      },
    });

    return { ok: true };
  }

  /** Suspend a student. */
  /**
   * Reset a member's password (school admin). Same-tenant only, and limited to
   * students & teachers — a school admin can't reset another admin's or a
   * platform account's password. Returns a temp password when one is generated.
   */
  async resetMemberPassword(actor: AuthUser, userId: string, newPassword?: string) {
    const target = await this.getTenantTarget(actor, userId);
    if (target.role !== "student" && target.role !== "teacher") {
      throw new ForbiddenException({ message: "You can only reset passwords for students and teachers." });
    }

    const generated = !newPassword;
    const password = newPassword ?? generateTempPassword();
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: await hashPassword(password),
        // Force a change on next login and revoke every existing session.
        mustChangePassword: true,
        tempPasswordExpiresAt: tempPasswordExpiry(),
        tokenVersion: { increment: 1 },
      },
    });

    await this.notifier.notify({
      userId,
      type: "account",
      title: "Your password was reset",
      body: "Your school administrator reset your password. Use the new password you were given to sign in, then change it from Settings.",
    });
    await this.prisma.auditLog.create({
      data: {
        tenantId: actor.tenantId,
        actorId: actor.id,
        action: "user.password_reset",
        targetType: "User",
        targetId: userId,
      },
    });

    return { ok: true, ...(generated ? { temporaryPassword: password } : {}) };
  }

  async suspendStudent(actor: AuthUser, userId: string) {
    await this.getTenantTarget(actor, userId);

    await this.prisma.user.update({ where: { id: userId }, data: { status: "suspended" } });

    await this.notifier.notify({
      userId,
      type: "account",
      title: "Your account has been suspended",
      body: "Please contact your school administrator for more information.",
    });

    await this.prisma.auditLog.create({
      data: {
        tenantId: actor.tenantId,
        actorId: actor.id,
        action: "user.suspend",
        targetType: "User",
        targetId: userId,
      },
    });

    return { ok: true };
  }

  /** Reinstate a suspended student. */
  async reinstateStudent(actor: AuthUser, userId: string) {
    await this.getTenantTarget(actor, userId);

    await this.prisma.user.update({ where: { id: userId }, data: { status: "active" } });

    // Safety net: settles a referral that was still pending when this student
    // was suspended. A no-op if the referral already settled or never existed.
    await this.referrals.settleIfActive(userId);

    await this.notifier.notify({
      userId,
      type: "account",
      title: "Your account has been reinstated",
      body: "You can now log in and continue your RoboCode.Africa journey.",
    });

    await this.prisma.auditLog.create({
      data: {
        tenantId: actor.tenantId,
        actorId: actor.id,
        action: "user.reinstate",
        targetType: "User",
        targetId: userId,
      },
    });

    return { ok: true };
  }

  /** Update the school's branding tokens. Requires tenant.branding (re-checked here). */
  async updateBranding(actor: AuthUser, input: BrandingInput) {
    if (!can(actor.role, "tenant.branding")) throw new ForbiddenException("FORBIDDEN");

    const tenant = await this.prisma.tenant.findUnique({ where: { id: actor.tenantId } });
    if (!tenant) throw new NotFoundException("NOT_FOUND");

    const existing = (tenant.branding ?? {}) as Record<string, unknown>;
    const merged = {
      ...existing,
      primary: input.primary,
      secondary: input.secondary,
      accent: input.accent,
      tagline: input.tagline,
      ...(input.logoUrl !== undefined ? { logoUrl: input.logoUrl } : {}),
    };

    await this.prisma.tenant.update({
      where: { id: actor.tenantId },
      data: { branding: merged },
    });

    await this.prisma.auditLog.create({
      data: {
        tenantId: actor.tenantId,
        actorId: actor.id,
        action: "tenant.branding.update",
        targetType: "Tenant",
        targetId: actor.tenantId,
      },
    });

    return { ok: true };
  }

  /** Update the school's policy flags. */
  async setPolicies(actor: AuthUser, input: PoliciesInput) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: actor.tenantId } });
    if (!tenant) throw new NotFoundException("NOT_FOUND");

    const existing = (tenant.policies ?? {}) as Record<string, unknown>;
    const merged = { ...existing, autoApprove: input.autoApprove };

    await this.prisma.tenant.update({
      where: { id: actor.tenantId },
      data: { policies: merged },
    });

    await this.prisma.auditLog.create({
      data: {
        tenantId: actor.tenantId,
        actorId: actor.id,
        action: "tenant.policies.update",
        targetType: "Tenant",
        targetId: actor.tenantId,
        meta: { autoApprove: input.autoApprove },
      },
    });

    return { ok: true };
  }

  // ---------------------------------------------------------------------------
  // Custom domain management
  // The old domain page was read-only (it asked admins to email support); these
  // mutations expose the same "add a custom domain + verify ownership" flow the
  // page documents, so the new client can drive it over HTTP.
  // ---------------------------------------------------------------------------

  /** Add a custom domain to the school, generating a TXT verification token. */
  async addDomain(actor: AuthUser, hostname: string) {
    const normalized = hostname.trim().toLowerCase();

    const existing = await this.prisma.domain.findUnique({ where: { hostname: normalized } });
    if (existing) {
      // A hostname already claimed (and especially already verified) by another
      // tenant can never be re-registered — otherwise registration order alone
      // would let one school squat on another's hostname.
      throw new ForbiddenException("That domain is already registered.");
    }

    const txtToken = `robocode-verify=${nanoid(24)}`;

    const domain = await this.prisma.domain.create({
      data: {
        tenantId: actor.tenantId,
        hostname: normalized,
        type: "custom",
        verified: false,
        txtToken,
        sslStatus: "pending",
      },
    });

    await this.prisma.auditLog.create({
      data: {
        tenantId: actor.tenantId,
        actorId: actor.id,
        action: "tenant.domain.add",
        targetType: "Domain",
        targetId: domain.id,
        meta: { hostname: normalized },
      },
    });

    return { ok: true, domain };
  }

  /**
   * Verify a custom domain by actually performing a DNS TXT lookup for the
   * token we generated. Ownership can ONLY be proven by publishing the TXT
   * record — we never trust the client. Until the record matches, the domain
   * stays verified:false (so getActiveTenant will not resolve it).
   */
  async verifyDomain(actor: AuthUser, domainId: string) {
    const domain = await this.prisma.domain.findUnique({ where: { id: domainId } });
    if (!domain || domain.tenantId !== actor.tenantId) throw new NotFoundException("NOT_FOUND");
    if (!domain.txtToken) throw new BadRequestException("This domain has no verification token.");

    // Defence in depth: never let a hostname already verified by another tenant
    // be (re-)verified here.
    const conflict = await this.prisma.domain.findFirst({
      where: { hostname: domain.hostname, verified: true, NOT: { id: domain.id } },
    });
    if (conflict) {
      throw new ForbiddenException("This domain is already verified by another organisation.");
    }

    // Real DNS TXT lookup. resolveTxt returns string chunks per record, which we
    // join before comparing against the stored token.
    let records: string[][] = [];
    try {
      records = await resolveTxt(domain.hostname);
    } catch {
      // NXDOMAIN / no TXT / DNS error all mean "not yet verifiable".
      records = [];
    }
    const flattened = records.map((chunks) => chunks.join(""));
    const matched = flattened.some((value) => value.trim() === domain.txtToken);

    if (!matched) {
      throw new BadRequestException(
        `Could not find the verification TXT record on ${domain.hostname}. Add a TXT record with the value "${domain.txtToken}" and try again (DNS changes can take a few minutes).`,
      );
    }

    const updated = await this.prisma.domain.update({
      where: { id: domainId },
      data: { verified: true, sslStatus: "active" },
    });

    await this.prisma.auditLog.create({
      data: {
        tenantId: actor.tenantId,
        actorId: actor.id,
        action: "tenant.domain.verify",
        targetType: "Domain",
        targetId: domainId,
        meta: { hostname: domain.hostname },
      },
    });

    return { ok: true, domain: updated };
  }
}
