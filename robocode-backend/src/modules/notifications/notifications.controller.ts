import { Controller, Get, Param, Post } from "@nestjs/common";
import { NotificationsService } from "./notifications.service";
import { CurrentUser } from "../../auth/decorators";
import type { AuthUser } from "../../auth/auth-user.type";

@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  // --- Reads ---------------------------------------------------------------

  /** The current user's notifications (newest first) + unread count. */
  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.notifications.list(user);
  }

  // --- Mutations -----------------------------------------------------------

  /** Mark all unread notifications read. Mirrors the old `markAllRead` action. */
  @Post("read-all")
  markAllRead(@CurrentUser() user: AuthUser) {
    return this.notifications.markAllRead(user);
  }

  /** Mark a single notification read. Mirrors the old `markRead(id)` action. */
  @Post(":id/read")
  markRead(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.notifications.markRead(user, id);
  }
}
