import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { publicUser } from "../../auth/auth.service";
import { levelProgress } from "../../domain/constants";
import type { AuthUser } from "../../auth/auth-user.type";
import type { UpdateProfileInput } from "./dto";

@Injectable()
export class AccountService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Update the current user's profile/settings (display name, language, avatar).
   * Mirrors the old `updateProfile` server action. Validation of displayName
   * length / locale enum is handled by the ZodPipe; here we apply the same
   * "keep existing avatarSeed when blank" rule as the original.
   */
  async updateProfile(user: AuthUser, data: UpdateProfileInput) {
    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        displayName: data.displayName.trim(),
        locale: data.locale,
        avatarSeed: data.avatarSeed.trim() || user.avatarSeed,
      },
      include: { tenant: true },
    });

    return { ok: true, user: publicUser(updated as AuthUser) };
  }

  /**
   * Settings page data: the current user's editable profile fields plus the
   * derived school name (null for the platform tenant).
   */
  getSettings(user: AuthUser) {
    const schoolName = user.tenant?.isPlatform ? null : (user.tenant?.name ?? null);
    return {
      user: publicUser(user),
      schoolName,
    };
  }

  /**
   * Profile page data: the current user plus aggregates the profile page shows —
   * earned badges, recent projects, count of passed tasks, and level progress.
   */
  async getProfile(user: AuthUser) {
    const [userBadges, projects, passedCount] = await Promise.all([
      this.prisma.userBadge.findMany({
        where: { userId: user.id },
        include: { badge: true },
        orderBy: { awardedAt: "desc" },
      }),
      this.prisma.project.findMany({
        where: { ownerId: user.id },
        orderBy: { updatedAt: "desc" },
        take: 6,
      }),
      this.prisma.submission.count({
        where: { userId: user.id, status: "passed" },
      }),
    ]);

    const progress = levelProgress(user.roboPoints);
    const schoolName = user.tenant?.name ?? null;

    return {
      user: publicUser(user),
      schoolName,
      badges: userBadges,
      projects,
      passedCount,
      progress,
    };
  }
}
