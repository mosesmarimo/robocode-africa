import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { AdminService } from "./admin.service";
import { CurrentUser, RequireCapability } from "../../auth/decorators";
import type { AuthUser } from "../../auth/auth-user.type";
import { ZodPipe } from "../../common/zod.pipe";
import {
  rejectUserSchema,
  resolveModerationSchema,
  type RejectUserInput,
  type ResolveModerationInput,
} from "./dto";

@Controller("admin")
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  // =========================================================================
  // READS — one per admin page
  // =========================================================================

  /**
   * Approvals page. Original page allowed platform.manage OR moderation.manage.
   * moderation.manage is held by both super_admin and moderator, so it covers both.
   */
  @RequireCapability("moderation.manage")
  @Get("approvals")
  getApprovals() {
    return this.admin.getApprovals();
  }

  @RequireCapability("platform.manage")
  @Get("content")
  getContent() {
    return this.admin.getContent();
  }

  /** Moderation page — platform.manage OR moderation.manage (see note above). */
  @RequireCapability("moderation.manage")
  @Get("moderation")
  getModeration() {
    return this.admin.getModeration();
  }

  @RequireCapability("platform.manage")
  @Get("system")
  getSystem() {
    return this.admin.getSystem();
  }

  @RequireCapability("platform.manage")
  @Get("tenants")
  getTenants() {
    return this.admin.getTenants();
  }

  @RequireCapability("platform.manage")
  @Get("users")
  getUsers(
    @Query("q") q?: string,
    @Query("role") role?: string,
    @Query("status") status?: string,
  ) {
    return this.admin.getUsers({ q, role, status });
  }

  // =========================================================================
  // MUTATIONS — one per old action function
  // =========================================================================

  /** approveUser — platform.manage OR moderation.manage. */
  @RequireCapability("moderation.manage")
  @Post("users/:userId/approve")
  approveUser(@CurrentUser() user: AuthUser, @Param("userId") userId: string) {
    return this.admin.approveUser(user, userId);
  }

  /** rejectUser — platform.manage OR moderation.manage. */
  @RequireCapability("moderation.manage")
  @Post("users/:userId/reject")
  rejectUser(
    @CurrentUser() user: AuthUser,
    @Param("userId") userId: string,
    @Body(new ZodPipe(rejectUserSchema)) body: RejectUserInput,
  ) {
    return this.admin.rejectUser(user, userId, body.reason);
  }

  /** suspendUser — platform.manage. */
  @RequireCapability("platform.manage")
  @Post("users/:userId/suspend")
  suspendUser(@CurrentUser() user: AuthUser, @Param("userId") userId: string) {
    return this.admin.suspendUser(user, userId);
  }

  /** reinstateUser — platform.manage. */
  @RequireCapability("platform.manage")
  @Post("users/:userId/reinstate")
  reinstateUser(@CurrentUser() user: AuthUser, @Param("userId") userId: string) {
    return this.admin.reinstateUser(user, userId);
  }

  /** approveTenant — platform.manage. */
  @RequireCapability("platform.manage")
  @Post("tenants/:tenantId/approve")
  approveTenant(@CurrentUser() user: AuthUser, @Param("tenantId") tenantId: string) {
    return this.admin.approveTenant(user, tenantId);
  }

  /** suspendTenant — platform.manage. */
  @RequireCapability("platform.manage")
  @Post("tenants/:tenantId/suspend")
  suspendTenant(@CurrentUser() user: AuthUser, @Param("tenantId") tenantId: string) {
    return this.admin.suspendTenant(user, tenantId);
  }

  /** reinstateTenant — platform.manage. */
  @RequireCapability("platform.manage")
  @Post("tenants/:tenantId/reinstate")
  reinstateTenant(@CurrentUser() user: AuthUser, @Param("tenantId") tenantId: string) {
    return this.admin.reinstateTenant(user, tenantId);
  }

  /** resolveModeration — platform.manage OR moderation.manage. */
  @RequireCapability("moderation.manage")
  @Post("moderation/:caseId/resolve")
  resolveModeration(
    @CurrentUser() user: AuthUser,
    @Param("caseId") caseId: string,
    @Body(new ZodPipe(resolveModerationSchema)) body: ResolveModerationInput,
  ) {
    return this.admin.resolveModeration(user, caseId, body.action);
  }
}
