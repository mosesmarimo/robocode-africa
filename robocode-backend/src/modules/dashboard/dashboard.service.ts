import { Injectable, NotFoundException } from "@nestjs/common";
import type { Request } from "express";
import { PrismaService } from "../../prisma/prisma.service";
import { TenantService, brandFromTenant } from "../../common/tenant.service";
import { can } from "../../domain/roles";
import { levelProgress } from "../../domain/constants";
import type { AuthUser } from "../../auth/auth-user.type";

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenants: TenantService,
  ) {}

  // --- Dashboard home ------------------------------------------------------

  /** Authenticated dashboard home data (mirrors app/page.tsx). */
  async home(user: AuthUser) {
    const firstName = user.displayName.split(" ")[0];
    if (user.role === "student") {
      return this.studentHome(user, firstName);
    }
    return this.staffHome(user, firstName);
  }

  /** Student dashboard data — recent projects, badges, enrollments, leaderboard. */
  private async studentHome(user: AuthUser, firstName: string) {
    const [projects, badgeCount, enrollments, leaders] = await Promise.all([
      this.prisma.project.findMany({ where: { ownerId: user.id }, orderBy: { updatedAt: "desc" }, take: 4 }),
      this.prisma.userBadge.count({ where: { userId: user.id } }),
      this.prisma.enrollment.findMany({ where: { userId: user.id }, include: { course: true }, take: 3 }),
      this.prisma.user.findMany({
        where: { tenantId: user.tenantId, role: "student", status: "active" },
        orderBy: { roboPoints: "desc" },
        take: 5,
        select: { id: true, displayName: true, roboPoints: true },
      }),
    ]);
    const { level, into, span, pct } = levelProgress(user.roboPoints);
    const rank = leaders.findIndex((l) => l.id === user.id) + 1;

    return {
      kind: "student" as const,
      firstName,
      progress: { level, into, span, pct },
      stats: {
        roboPoints: user.roboPoints,
        level,
        badges: badgeCount,
        rank: rank > 0 ? rank : null,
      },
      projects,
      leaders,
      enrollments,
    };
  }

  /** Staff dashboard data — pending approvals, members, projects, competitions. */
  private async staffHome(user: AuthUser, firstName: string) {
    const platform = user.role === "super_admin" || user.role === "moderator";
    const approvalWhere = platform ? { status: "pending" } : { tenantId: user.tenantId, status: "pending" };
    const memberWhere = platform ? {} : { tenantId: user.tenantId };

    const [pending, members, projects, competitions] = await Promise.all([
      this.prisma.approvalRequest.count({ where: approvalWhere }),
      this.prisma.user.count({ where: { ...memberWhere, role: "student" } }),
      this.prisma.project.count({ where: platform ? {} : { tenantId: user.tenantId } }),
      this.prisma.competition.count(),
    ]);

    const canApprove = can(user.role, "tenant.approve_students") || can(user.role, "platform.approve_direct");

    return {
      kind: "staff" as const,
      firstName,
      platform,
      tenantName: user.tenant?.name ?? null,
      canApprove,
      stats: { pending, members, projects, competitions },
    };
  }

  // --- Branding (public) ---------------------------------------------------

  /** Resolve the active tenant from the request and return brand tokens + summary. */
  async branding(req: Request) {
    const tenant = await this.tenants.fromRequest(req);
    const brand = brandFromTenant(tenant?.branding);
    return {
      brand,
      tenant: tenant
        ? { name: tenant.name, slug: tenant.slug, isPlatform: tenant.isPlatform }
        : null,
    };
  }

  // --- App shell -----------------------------------------------------------

  /** Extra app-shell data the layout needs beyond /auth/me + /branding (unread count). */
  async shell(user: AuthUser) {
    const unread = await this.prisma.notification.count({ where: { userId: user.id, readAt: null } });
    return { unread };
  }

  // --- Consent (public) ----------------------------------------------------

  /** Confirm guardian consent by token (mirrors the inline `grantConsent` action). */
  async confirmConsent(token: string) {
    const consent = await this.prisma.consentRecord.findUnique({ where: { token }, include: { user: true } });
    if (!consent) throw new NotFoundException("NOT_FOUND");

    if (consent.status !== "granted") {
      await this.prisma.consentRecord.update({
        where: { token },
        data: { status: "granted", grantedAt: new Date() },
      });
    }

    return { ok: true, status: "granted", studentName: consent.user.displayName };
  }
}
