import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { nanoid } from "nanoid";
import { PrismaService } from "../../prisma/prisma.service";
import { NotifyService } from "../../common/notify.service";
import { can } from "../../domain/roles";
import { ROOT_DOMAIN } from "../../domain/constants";
import type { AuthUser } from "../../auth/auth-user.type";
import type { BrandingInput, PoliciesInput } from "./dto";

@Injectable()
export class SchoolService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifier: NotifyService,
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

    const initial = {
      primary: branding.primary ?? "#6d28d9",
      secondary: branding.secondary ?? "#0ea5e9",
      accent: branding.accent ?? "#f59e0b",
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
      }),
      this.prisma.user.findMany({
        where: { tenantId: actor.tenantId, role: "teacher" },
        orderBy: { displayName: "asc" },
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
    await this.getTenantTarget(actor, userId);

    await this.prisma.user.update({ where: { id: userId }, data: { status: "active" } });

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

  /** Mark a custom domain as verified (TXT confirmed) and queue SSL. */
  async verifyDomain(actor: AuthUser, domainId: string) {
    const domain = await this.prisma.domain.findUnique({ where: { id: domainId } });
    if (!domain || domain.tenantId !== actor.tenantId) throw new NotFoundException("NOT_FOUND");

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
