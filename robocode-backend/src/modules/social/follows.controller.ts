import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { FollowsService } from "./follows.service";
import { CurrentUser, RequireActive } from "../../auth/decorators";
import type { AuthUser } from "../../auth/auth-user.type";
import { ZodPipe } from "../../common/zod.pipe";
import { followSchema, type FollowInput } from "./dto";

@Controller("social/follows")
export class FollowsController {
  constructor(private readonly follows: FollowsService) {}

  /** Things the current user follows. */
  @Get("me")
  mine(@CurrentUser() user: AuthUser) {
    return this.follows.listMine(user);
  }

  /** Followers of a target (annotated with the viewer's relationship). */
  @Get(":targetType/:targetId/followers")
  followers(
    @CurrentUser() user: AuthUser,
    @Param("targetType") targetType: string,
    @Param("targetId") targetId: string,
  ) {
    return this.follows.followers(user, targetType, targetId);
  }

  /** "Followed by people you know" preview for a target header. */
  @Get(":targetType/:targetId/follow-preview")
  preview(
    @CurrentUser() user: AuthUser,
    @Param("targetType") targetType: string,
    @Param("targetId") targetId: string,
  ) {
    return this.follows.preview(user, targetType, targetId);
  }

  @RequireActive()
  @Post()
  follow(@CurrentUser() user: AuthUser, @Body(new ZodPipe(followSchema)) body: FollowInput) {
    return this.follows.follow(user, body.targetType, body.targetId);
  }

  @RequireActive()
  @Post("unfollow")
  unfollow(@CurrentUser() user: AuthUser, @Body(new ZodPipe(followSchema)) body: FollowInput) {
    return this.follows.unfollow(user, body.targetType, body.targetId);
  }
}
