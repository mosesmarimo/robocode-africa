import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { SchoolService } from "./school.service";
import { CurrentUser, RequireCapability } from "../../auth/decorators";
import type { AuthUser } from "../../auth/auth-user.type";
import { ZodPipe } from "../../common/zod.pipe";
import {
  addDomainSchema,
  brandingSchema,
  policiesSchema,
  rejectStudentSchema,
  type AddDomainInput,
  type BrandingInput,
  type PoliciesInput,
  type RejectStudentInput,
} from "./dto";

/**
 * Tenant (school) admin. Every route operates on the CURRENT user's tenant
 * (user.tenantId / user.tenant). The original pages/actions all required
 * tenant.* capabilities held by school_admin (and super_admin).
 */
@Controller("school")
export class SchoolController {
  constructor(private readonly school: SchoolService) {}

  // =========================================================================
  // READS — one per school page
  // =========================================================================

  /** /app/school/approvals — pending students + summary counts. */
  @RequireCapability("tenant.approve_students")
  @Get("approvals")
  getApprovals(@CurrentUser() user: AuthUser) {
    return this.school.getApprovals(user);
  }

  /** /app/school/branding — current branding tokens. */
  @RequireCapability("tenant.branding")
  @Get("branding")
  getBranding(@CurrentUser() user: AuthUser) {
    return this.school.getBranding(user);
  }

  /** /app/school/domain — subdomain + custom domain list. */
  @RequireCapability("tenant.manage")
  @Get("domain")
  getDomain(@CurrentUser() user: AuthUser) {
    return this.school.getDomain(user);
  }

  /** /app/school/members — students, teachers and per-status counts. */
  @RequireCapability("tenant.manage")
  @Get("members")
  getMembers(@CurrentUser() user: AuthUser) {
    return this.school.getMembers(user);
  }

  /** /app/school/reports — analytics overview. */
  @RequireCapability("reports.view")
  @Get("reports")
  getReports(@CurrentUser() user: AuthUser) {
    return this.school.getReports(user);
  }

  // =========================================================================
  // MUTATIONS — one per old action function
  // =========================================================================

  /** approveStudent. */
  @RequireCapability("tenant.approve_students")
  @Post("students/:userId/approve")
  approveStudent(@CurrentUser() user: AuthUser, @Param("userId") userId: string) {
    return this.school.approveStudent(user, userId);
  }

  /** rejectStudent (optional reason). */
  @RequireCapability("tenant.approve_students")
  @Post("students/:userId/reject")
  rejectStudent(
    @CurrentUser() user: AuthUser,
    @Param("userId") userId: string,
    @Body(new ZodPipe(rejectStudentSchema)) body: RejectStudentInput,
  ) {
    return this.school.rejectStudent(user, userId, body.reason);
  }

  /** suspendStudent. */
  @RequireCapability("tenant.manage")
  @Post("students/:userId/suspend")
  suspendStudent(@CurrentUser() user: AuthUser, @Param("userId") userId: string) {
    return this.school.suspendStudent(user, userId);
  }

  /** reinstateStudent. */
  @RequireCapability("tenant.manage")
  @Post("students/:userId/reinstate")
  reinstateStudent(@CurrentUser() user: AuthUser, @Param("userId") userId: string) {
    return this.school.reinstateStudent(user, userId);
  }

  /** updateBranding (service also re-checks tenant.branding, mirroring the old action). */
  @RequireCapability("tenant.branding")
  @Post("branding")
  updateBranding(
    @CurrentUser() user: AuthUser,
    @Body(new ZodPipe(brandingSchema)) body: BrandingInput,
  ) {
    return this.school.updateBranding(user, body);
  }

  /** setPolicies. */
  @RequireCapability("tenant.manage")
  @Post("policies")
  setPolicies(
    @CurrentUser() user: AuthUser,
    @Body(new ZodPipe(policiesSchema)) body: PoliciesInput,
  ) {
    return this.school.setPolicies(user, body);
  }

  /** addDomain — register a custom domain + generate TXT verification token. */
  @RequireCapability("tenant.manage")
  @Post("domains")
  addDomain(
    @CurrentUser() user: AuthUser,
    @Body(new ZodPipe(addDomainSchema)) body: AddDomainInput,
  ) {
    return this.school.addDomain(user, body.hostname);
  }

  /** verifyDomain — confirm ownership (TXT) and activate SSL. */
  @RequireCapability("tenant.manage")
  @Post("domains/:domainId/verify")
  verifyDomain(@CurrentUser() user: AuthUser, @Param("domainId") domainId: string) {
    return this.school.verifyDomain(user, domainId);
  }
}
