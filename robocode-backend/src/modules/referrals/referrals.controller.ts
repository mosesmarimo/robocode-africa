import { Controller, Get, Query } from "@nestjs/common";
import { ReferralsService } from "./referrals.service";
import { CurrentUser } from "../../auth/decorators";
import type { AuthUser } from "../../auth/auth-user.type";
import { parseLeaderboardScope } from "./dto";

@Controller("referrals")
export class ReferralsController {
  constructor(private readonly referrals: ReferralsService) {}

  /** The current user's referral code, share link, and progress. */
  @Get("me")
  me(@CurrentUser() user: AuthUser) {
    return this.referrals.stats(user);
  }

  /** Top referrers, platform-wide by default or scoped to the caller's own tenant. */
  @Get("leaderboard")
  leaderboard(@CurrentUser() user: AuthUser, @Query("scope") scope?: string) {
    return this.referrals.leaderboard(parseLeaderboardScope(scope), user.tenantId);
  }
}
