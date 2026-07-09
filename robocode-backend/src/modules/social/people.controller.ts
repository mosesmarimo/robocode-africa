import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { PeopleService } from "./people.service";
import { FeedService } from "./feed.service";
import { CurrentUser, RequireActive } from "../../auth/decorators";
import type { AuthUser } from "../../auth/auth-user.type";
import { ZodPipe } from "../../common/zod.pipe";
import { reportSchema, type ReportInput } from "./dto";

@Controller("social")
export class PeopleController {
  constructor(
    private readonly people: PeopleService,
    private readonly feedService: FeedService,
  ) {}

  /** Aggregated home feed. */
  @Get("feed")
  feed(@CurrentUser() user: AuthUser, @Query("cursor") cursor?: string) {
    return this.feedService.feed(user, cursor);
  }

  /** Search people platform-wide. */
  @Get("people/search")
  search(@CurrentUser() user: AuthUser, @Query("q") q: string) {
    return this.people.search(user, q ?? "");
  }

  /** A user's public social profile. */
  @Get("users/:id")
  profile(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.people.profile(user, id);
  }

  /** Report content or a user. */
  @RequireActive()
  @Post("report")
  report(@CurrentUser() user: AuthUser, @Body(new ZodPipe(reportSchema)) body: ReportInput) {
    return this.people.report(user, body);
  }
}
