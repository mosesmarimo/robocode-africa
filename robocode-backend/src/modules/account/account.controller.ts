import { Body, Controller, Get, Put } from "@nestjs/common";
import { AccountService } from "./account.service";
import { ZodPipe } from "../../common/zod.pipe";
import { RequireActive, CurrentUser } from "../../auth/decorators";
import type { AuthUser } from "../../auth/auth-user.type";
import { updateProfileSchema, type UpdateProfileInput } from "./dto";

@Controller("account")
export class AccountController {
  constructor(private readonly account: AccountService) {}

  /** Settings page data: editable profile fields + derived school name. */
  @RequireActive()
  @Get("settings")
  getSettings(@CurrentUser() user: AuthUser) {
    return this.account.getSettings(user);
  }

  /** Profile page data: current user + badges, recent projects, passed count, level progress. */
  @RequireActive()
  @Get("profile")
  getProfile(@CurrentUser() user: AuthUser) {
    return this.account.getProfile(user);
  }

  /** Update profile/settings (display name, language, avatar). Mirrors old updateProfile. */
  @RequireActive()
  @Put("profile")
  updateProfile(
    @CurrentUser() user: AuthUser,
    @Body(new ZodPipe(updateProfileSchema)) body: UpdateProfileInput,
  ) {
    return this.account.updateProfile(user, body);
  }
}
