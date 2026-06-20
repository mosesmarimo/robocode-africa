import { Controller, Get, Param, Post, Req } from "@nestjs/common";
import type { Request } from "express";
import { DashboardService } from "./dashboard.service";
import { CurrentUser, Public, RequireActive } from "../../auth/decorators";
import type { AuthUser } from "../../auth/auth-user.type";

@Controller()
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  /** Authenticated dashboard home data (mirrors app/page.tsx). */
  @Get("dashboard")
  @RequireActive()
  home(@CurrentUser() user: AuthUser) {
    return this.dashboard.home(user);
  }

  /** PUBLIC: resolve the active tenant from the request and return brand tokens. */
  @Get("branding")
  @Public()
  branding(@Req() req: Request) {
    return this.dashboard.branding(req);
  }

  /** Extra app-shell data the layout needs (unread notification count). */
  @Get("shell")
  @RequireActive()
  shell(@CurrentUser() user: AuthUser) {
    return this.dashboard.shell(user);
  }

  /** PUBLIC: confirm guardian consent by token (mirrors the inline `grantConsent` action). */
  @Post("consent/:token")
  @Public()
  confirmConsent(@Param("token") token: string) {
    return this.dashboard.confirmConsent(token);
  }
}
