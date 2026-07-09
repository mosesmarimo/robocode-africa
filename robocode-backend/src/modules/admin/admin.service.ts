import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { NotifyService } from "../../common/notify.service";
import { hashPassword, generateTempPassword, tempPasswordExpiry } from "../../auth/password.util";
import type { AuthUser } from "../../auth/auth-user.type";
import { ReferralsService } from "../referrals/referrals.service";
import { PublishService } from "../publish/publish.service";

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifier: NotifyService,
    private readonly referrals: ReferralsService,
    private readonly publish: PublishService,
  ) {}

  // =========================================================================
  // READS — one method per admin page
  // =========================================================================

  /** /app/admin/approvals — pending user requests + pending school applications. */
  async getApprovals() {
    const [pendingRequests, pendingTenants] = await Promise.all([
      this.prisma.approvalRequest.findMany({
        where: { status: "pending" },
        include: {
          user: { select: { id: true, displayName: true, email: true, role: true, createdAt: true } },
          tenant: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { createdAt: "asc" },
      }),
      this.prisma.tenant.findMany({
        where: { status: "pending", isPlatform: false },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    return { pendingRequests, pendingTenants };
  }

  /** /app/admin/content — courses, tasks and platform content counts. */
  async getContent() {
    const [courses, tasks, totalLessons, totalEnrollments, totalSubmissions] = await Promise.all([
      this.prisma.course.findMany({
        orderBy: [{ track: "asc" }, { order: "asc" }],
        take: 200,
        include: {
          _count: { select: { lessons: true, enrollments: true } },
        },
      }),
      // Exclude the heavy Json columns (checks/rubric/starterDiagram) and
      // starterCode from the list view; load those on a task-detail endpoint.
      this.prisma.task.findMany({
        orderBy: { track: "asc" },
        take: 200,
        select: {
          id: true,
          title: true,
          track: true,
          difficulty: true,
          points: true,
          _count: { select: { submissions: true } },
        },
      }),
      this.prisma.lesson.count(),
      this.prisma.enrollment.count(),
      this.prisma.submission.count(),
    ]);

    return { courses, tasks, totalLessons, totalEnrollments, totalSubmissions };
  }

  /** /app/admin/moderation — open + reviewing cases and resolved/dismissed counts. */
  async getModeration() {
    const [openCases, reviewingCases, resolvedCount, dismissedCount] = await Promise.all([
      this.prisma.moderationCase.findMany({
        where: { status: "open" },
        orderBy: { createdAt: "asc" },
        include: {
          reporter: { select: { id: true, displayName: true } },
        },
      }),
      this.prisma.moderationCase.findMany({
        where: { status: "reviewing" },
        orderBy: { createdAt: "asc" },
        include: {
          reporter: { select: { id: true, displayName: true } },
        },
      }),
      this.prisma.moderationCase.count({ where: { status: "resolved" } }),
      this.prisma.moderationCase.count({ where: { status: "dismissed" } }),
    ]);

    return { openCases, reviewingCases, resolvedCount, dismissedCount };
  }

  /** /app/admin/system — platform-wide KPIs, recent audit log and newest users. */
  async getSystem() {
    const [
      totalSchools,
      activeSchools,
      totalStudents,
      totalTeachers,
      totalProjects,
      totalSimulations,
      totalCompetitions,
      pendingApprovals,
      openModCases,
      recentAuditLogs,
      recentUsers,
    ] = await Promise.all([
      this.prisma.tenant.count({ where: { isPlatform: false } }),
      this.prisma.tenant.count({ where: { isPlatform: false, status: "active" } }),
      this.prisma.user.count({ where: { role: "student", status: "active" } }),
      this.prisma.user.count({ where: { role: "teacher", status: "active" } }),
      this.prisma.project.count(),
      this.prisma.simulationRun.count(),
      this.prisma.competition.count(),
      this.prisma.approvalRequest.count({ where: { status: "pending" } }),
      this.prisma.moderationCase.count({ where: { status: "open" } }),
      this.prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 15,
        select: {
          id: true,
          action: true,
          targetType: true,
          targetId: true,
          createdAt: true,
          actor: { select: { displayName: true, role: true } },
        },
      }),
      this.prisma.user.findMany({
        where: { role: { notIn: ["super_admin", "moderator"] } },
        orderBy: { createdAt: "desc" },
        take: 6,
        include: {
          tenant: { select: { name: true } },
        },
      }),
    ]);

    return {
      totalSchools,
      activeSchools,
      totalStudents,
      totalTeachers,
      totalProjects,
      totalSimulations,
      totalCompetitions,
      pendingApprovals,
      openModCases,
      recentAuditLogs,
      recentUsers,
    };
  }

  /** /app/admin/tenants — all non-platform schools with member counts & subscription. */
  async getTenants() {
    return this.prisma.tenant.findMany({
      where: { isPlatform: false },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { users: true } },
        subscription: { include: { plan: { select: { name: true } } } },
      },
    });
  }

  /** /app/admin/users — filtered user list (q/role/status) + status KPI counts. */
  async getUsers(filters: { q?: string; role?: string; status?: string }) {
    const { q } = filters;

    // Validate the enum-like filters: an unrecognised role/status is ignored
    // rather than silently producing an empty result set.
    const VALID_ROLES = ["super_admin", "moderator", "school_admin", "teacher", "student", "parent"];
    const VALID_STATUSES = ["pending", "active", "suspended", "rejected"];
    const role = filters.role && VALID_ROLES.includes(filters.role) ? filters.role : undefined;
    const status = filters.status && VALID_STATUSES.includes(filters.status) ? filters.status : undefined;

    // When a specific role filter is applied, use it; otherwise exclude platform staff.
    const roleFilter = role ? role : { notIn: ["super_admin", "moderator"] };

    const where = {
      role: roleFilter,
      ...(q
        ? {
            OR: [{ displayName: { contains: q } }, { email: { contains: q } }],
          }
        : {}),
      ...(status ? { status } : {}),
    };

    const [users, totalUsers, activeUsers, pendingUsers, suspendedUsers] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 100,
        select: {
          id: true,
          displayName: true,
          email: true,
          role: true,
          status: true,
          roboPoints: true,
          level: true,
          createdAt: true,
          lastLoginAt: true,
          tenant: { select: { name: true, slug: true } },
        },
      }),
      this.prisma.user.count({ where: { role: { notIn: ["super_admin", "moderator"] } } }),
      this.prisma.user.count({ where: { role: { notIn: ["super_admin", "moderator"] }, status: "active" } }),
      this.prisma.user.count({ where: { role: { notIn: ["super_admin", "moderator"] }, status: "pending" } }),
      this.prisma.user.count({ where: { role: { notIn: ["super_admin", "moderator"] }, status: "suspended" } }),
    ]);

    return { users, totalUsers, activeUsers, pendingUsers, suspendedUsers };
  }

  // =========================================================================
  // MUTATIONS — one method per old action function
  // =========================================================================

  /**
   * COPPA gate: an under-13 student may not be activated until a granted
   * guardian ConsentRecord exists.
   */
  private async assertConsentForActivation(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { birthYear: true },
    });
    if (!user || user.birthYear == null) return; // age unknown — nothing to gate
    const age = new Date().getFullYear() - user.birthYear;
    if (age >= 13) return;
    const consent = await this.prisma.consentRecord.findUnique({ where: { userId } });
    if (consent?.status !== "granted") {
      throw new BadRequestException({
        message:
          "This student is under 13 and is awaiting verifiable guardian consent. They can be activated once the guardian has confirmed consent.",
      });
    }
  }

  /** Approve a user approval request. */
  async approveUser(actor: AuthUser, userId: string) {
    const approval = await this.prisma.approvalRequest.findUnique({ where: { userId } });
    if (!approval) throw new NotFoundException("No approval request found");

    await this.assertConsentForActivation(userId);

    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: userId }, data: { status: "active" } }),
      this.prisma.approvalRequest.update({
        where: { userId },
        data: { status: "approved", decidedById: actor.id, decidedAt: new Date() },
      }),
      this.prisma.auditLog.create({
        data: {
          actorId: actor.id,
          action: "user.approve",
          targetType: "User",
          targetId: userId,
          meta: { approvalId: approval.id },
        },
      }),
    ]);

    await this.referrals.settleIfActive(userId);

    await this.notifier.notify({
      userId,
      type: "approval",
      title: "Your account has been approved!",
      body: "Welcome to RoboCode.Africa — your account is now active. Start building!",
    });

    return { ok: true };
  }

  /** Reject a user approval request. */
  async rejectUser(actor: AuthUser, userId: string, reason?: string) {
    const approval = await this.prisma.approvalRequest.findUnique({ where: { userId } });
    if (!approval) throw new NotFoundException("No approval request found");

    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: userId }, data: { status: "rejected" } }),
      this.prisma.approvalRequest.update({
        where: { userId },
        data: {
          status: "rejected",
          decidedById: actor.id,
          decidedAt: new Date(),
          reason: reason ?? null,
        },
      }),
      this.prisma.auditLog.create({
        data: {
          actorId: actor.id,
          action: "user.reject",
          targetType: "User",
          targetId: userId,
          meta: { reason: reason ?? null },
        },
      }),
    ]);

    await this.notifier.notify({
      userId,
      type: "approval_rejected",
      title: "Account application not approved",
      body: reason
        ? `Your account was not approved. Reason: ${reason}`
        : "Your account application was not approved. Please contact your school administrator.",
    });

    return { ok: true };
  }

  /** Approve a tenant (school) — activates tenant + its pending school_admin users. */
  async approveTenant(actor: AuthUser, tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException("Tenant not found");

    // Find all pending school_admin users for this tenant
    const pendingAdmins = await this.prisma.user.findMany({
      where: { tenantId, role: "school_admin", status: "pending" },
      select: { id: true },
    });

    const adminIds = pendingAdmins.map((u) => u.id);

    await this.prisma.$transaction([
      this.prisma.tenant.update({ where: { id: tenantId }, data: { status: "active" } }),
      // Activate all pending school admins
      this.prisma.user.updateMany({
        where: { id: { in: adminIds } },
        data: { status: "active" },
      }),
      // Approve their approval requests
      this.prisma.approvalRequest.updateMany({
        where: { userId: { in: adminIds }, status: "pending" },
        data: { status: "approved", decidedById: actor.id, decidedAt: new Date() },
      }),
      this.prisma.auditLog.create({
        data: {
          tenantId,
          actorId: actor.id,
          action: "tenant.approve",
          targetType: "Tenant",
          targetId: tenantId,
          meta: { activatedAdmins: adminIds },
        },
      }),
    ]);

    // Settle a pending referral for each newly activated school admin (rare,
    // but a school_admin can themselves have signed up via a referral link).
    await Promise.all(adminIds.map((uid) => this.referrals.settleIfActive(uid)));

    // Notify each activated school admin
    await Promise.all(
      adminIds.map((uid) =>
        this.notifier.notify({
          userId: uid,
          type: "tenant_approved",
          title: `${tenant.name} has been approved!`,
          body: "Your school is now live on RoboCode.Africa. Log in to set up your classes.",
        }),
      ),
    );

    return { ok: true };
  }

  /** Suspend a user. */
  async suspendUser(actor: AuthUser, userId: string) {
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: userId }, data: { status: "suspended" } }),
      this.prisma.auditLog.create({
        data: {
          actorId: actor.id,
          action: "user.suspend",
          targetType: "User",
          targetId: userId,
        },
      }),
    ]);

    await this.notifier.notify({
      userId,
      type: "account_suspended",
      title: "Your account has been suspended",
      body: "Your account access has been suspended. Contact support if you believe this is in error.",
    });

    return { ok: true };
  }

  /** Reinstate a user. */
  /**
   * Reset any user's password (platform admin). If `newPassword` is omitted a
   * temporary password is generated and returned once. The password itself is
   * never put in the notification — the admin relays it out-of-band.
   */
  async resetPassword(actor: AuthUser, userId: string, newPassword?: string) {
    const target = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!target) throw new NotFoundException("NOT_FOUND");

    const generated = !newPassword;
    const password = newPassword ?? generateTempPassword();
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: {
          passwordHash: await hashPassword(password),
          // Force a change on next login and revoke every existing session.
          mustChangePassword: true,
          tempPasswordExpiresAt: tempPasswordExpiry(),
          tokenVersion: { increment: 1 },
        },
      }),
      this.prisma.auditLog.create({
        data: { actorId: actor.id, action: "user.password_reset", targetType: "User", targetId: userId },
      }),
    ]);

    await this.notifier.notify({
      userId,
      type: "account",
      title: "Your password was reset",
      body: "An administrator reset your password. Use the new password you were given to sign in, then change it from Settings.",
    });

    return { ok: true, ...(generated ? { temporaryPassword: password } : {}) };
  }

  async reinstateUser(actor: AuthUser, userId: string) {
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: userId }, data: { status: "active" } }),
      this.prisma.auditLog.create({
        data: {
          actorId: actor.id,
          action: "user.reinstate",
          targetType: "User",
          targetId: userId,
        },
      }),
    ]);

    // Safety net: settles a referral that was still pending when this user
    // was suspended (e.g. the daily cap was hit before suspension). A no-op
    // in the common case where the referral already settled or never existed.
    await this.referrals.settleIfActive(userId);

    await this.notifier.notify({
      userId,
      type: "account_reinstated",
      title: "Your account has been reinstated",
      body: "Welcome back! Your account access has been restored.",
    });

    return { ok: true };
  }

  /** Suspend a tenant. */
  async suspendTenant(actor: AuthUser, tenantId: string) {
    await this.prisma.$transaction([
      this.prisma.tenant.update({ where: { id: tenantId }, data: { status: "suspended" } }),
      this.prisma.auditLog.create({
        data: {
          tenantId,
          actorId: actor.id,
          action: "tenant.suspend",
          targetType: "Tenant",
          targetId: tenantId,
        },
      }),
    ]);

    return { ok: true };
  }

  /** Reinstate a tenant. */
  async reinstateTenant(actor: AuthUser, tenantId: string) {
    await this.prisma.$transaction([
      this.prisma.tenant.update({ where: { id: tenantId }, data: { status: "active" } }),
      this.prisma.auditLog.create({
        data: {
          tenantId,
          actorId: actor.id,
          action: "tenant.reinstate",
          targetType: "Tenant",
          targetId: tenantId,
        },
      }),
    ]);

    return { ok: true };
  }

  /** Resolve (or dismiss) a moderation case. */
  async resolveModeration(actor: AuthUser, caseId: string, action: "resolved" | "dismissed") {
    if (action !== "resolved" && action !== "dismissed") {
      throw new BadRequestException("action must be 'resolved' or 'dismissed'");
    }

    await this.prisma.$transaction([
      this.prisma.moderationCase.update({
        where: { id: caseId },
        data: {
          status: action,
          resolvedById: actor.id,
        },
      }),
      this.prisma.auditLog.create({
        data: {
          actorId: actor.id,
          action: `moderation.${action}`,
          targetType: "ModerationCase",
          targetId: caseId,
        },
      }),
    ]);

    return { ok: true };
  }

  /**
   * Takedown a published project (admin/mod) — unpublishes it (clears
   * subdomain/publishDomain/publishedAt, reverts visibility to private) and
   * opens a resolved ModerationCase recording who/why, for audit.
   */
  async takedownPublish(actor: AuthUser, domain: string, subdomain: string, reason: string) {
    return this.publish.takedown(domain, subdomain, actor, reason);
  }
}
