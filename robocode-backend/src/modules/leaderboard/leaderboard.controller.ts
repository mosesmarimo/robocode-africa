import { Controller, Get, Param, Query } from "@nestjs/common";
import { LeaderboardService } from "./leaderboard.service";
import { RequireActive, CurrentUser } from "../../auth/decorators";
import type { AuthUser } from "../../auth/auth-user.type";
import { parseScope, parseLanguageParam, parseTrackParam } from "./dto";

@Controller("leaderboards")
export class LeaderboardController {
  constructor(private readonly leaderboard: LeaderboardService) {}

  /** Top 50 by all-time or this-week XP tagged with `language`, plus the caller's own rank. */
  @RequireActive()
  @Get("language/:language")
  byLanguage(
    @CurrentUser() user: AuthUser,
    @Param("language") language: string,
    @Query("scope") scope?: string,
    @Query("tenant") tenant?: string,
  ) {
    const lang = parseLanguageParam(language);
    return this.leaderboard.byLanguage(user, lang, parseScope(scope), tenant);
  }

  /** Top 50 by all-time or this-week XP tagged with `track` (coding|robotics), plus the caller's own rank. */
  @RequireActive()
  @Get("track/:track")
  byTrack(
    @CurrentUser() user: AuthUser,
    @Param("track") track: string,
    @Query("scope") scope?: string,
    @Query("tenant") tenant?: string,
  ) {
    const trk = parseTrackParam(track);
    return this.leaderboard.byTrack(user, trk, parseScope(scope), tenant);
  }
}
