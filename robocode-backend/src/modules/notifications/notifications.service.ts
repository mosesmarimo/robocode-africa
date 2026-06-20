import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import type { AuthUser } from "../../auth/auth-user.type";

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------------------------
  // Reads (port of the RSC page's direct Prisma queries)
  // ---------------------------------------------------------------------------

  /**
   * The current user's notifications (newest first) plus the unread count the
   * page header shows. Mirrors `notifications/page.tsx`.
   */
  async list(user: AuthUser) {
    const notifications = await this.prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    const unreadCount = notifications.filter((n) => !n.readAt).length;

    return { notifications, unreadCount };
  }

  // ---------------------------------------------------------------------------
  // Mutations (port of `lib/notifications/actions.ts`)
  // ---------------------------------------------------------------------------

  /** Mark all of the current user's unread notifications as read. */
  async markAllRead(user: AuthUser) {
    await this.prisma.notification.updateMany({
      where: { userId: user.id, readAt: null },
      data: { readAt: new Date() },
    });
    return { ok: true };
  }

  /** Mark a single notification (owned by the current user) as read. */
  async markRead(user: AuthUser, id: string) {
    await this.prisma.notification.updateMany({
      where: { id, userId: user.id, readAt: null },
      data: { readAt: new Date() },
    });
    return { ok: true };
  }
}
