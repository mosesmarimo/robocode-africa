import { Body, Controller, Delete, Get, Param, Post } from "@nestjs/common";
import { FriendsService } from "./friends.service";
import { CurrentUser, RequireActive } from "../../auth/decorators";
import type { AuthUser } from "../../auth/auth-user.type";
import { ZodPipe } from "../../common/zod.pipe";
import { friendRequestSchema, type FriendRequestInput } from "./dto";

@Controller("social/friends")
export class FriendsController {
  constructor(private readonly friends: FriendsService) {}

  /** My friends + incoming/outgoing requests. */
  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.friends.list(user);
  }

  /** Send a friend request. */
  @RequireActive()
  @Post("requests")
  request(@CurrentUser() user: AuthUser, @Body(new ZodPipe(friendRequestSchema)) body: FriendRequestInput) {
    return this.friends.sendRequest(user, body.userId);
  }

  @RequireActive()
  @Post("requests/:id/accept")
  accept(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.friends.accept(user, id);
  }

  @RequireActive()
  @Post("requests/:id/decline")
  decline(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.friends.decline(user, id);
  }

  @RequireActive()
  @Post("requests/:id/cancel")
  cancel(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.friends.cancel(user, id);
  }

  /** Unfriend a user. */
  @RequireActive()
  @Delete(":userId")
  unfriend(@CurrentUser() user: AuthUser, @Param("userId") userId: string) {
    return this.friends.unfriend(user, userId);
  }

  /** Block a user. */
  @RequireActive()
  @Post(":userId/block")
  block(@CurrentUser() user: AuthUser, @Param("userId") userId: string) {
    return this.friends.block(user, userId);
  }
}
