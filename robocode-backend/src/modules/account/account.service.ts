import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { publicUser } from "../../auth/auth.service";
import { JwtService } from "../../auth/jwt.service";
import { hashPassword, verifyPassword } from "../../auth/password.util";
import { levelProgress } from "../../domain/constants";
import type { AuthUser } from "../../auth/auth-user.type";
import type { UpdateProfileInput, ChangePasswordInput } from "./dto";

@Injectable()
export class AccountService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  /**
   * Self-service password change. Verifies the current password, sets the new
   * one, clears any force-change/temp-password state, and bumps tokenVersion to
   * revoke every other session. A fresh token is returned so the current
   * session stays signed in.
   */
  async changePassword(user: AuthUser, data: ChangePasswordInput) {
    const current = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { passwordHash: true },
    });
    if (!current) throw new UnauthorizedException("UNAUTHENTICATED");
    if (!(await verifyPassword(data.currentPassword, current.passwordHash))) {
      throw new BadRequestException({
        message: "Your current password is incorrect.",
        fieldErrors: { currentPassword: "Your current password is incorrect." },
      });
    }

    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: await hashPassword(data.newPassword),
        mustChangePassword: false,
        tempPasswordExpiresAt: null,
        tokenVersion: { increment: 1 },
      },
      select: { tokenVersion: true },
    });

    // Re-issue a token at the new version so this session survives the bump.
    const token = await this.jwt.sign({
      uid: user.id,
      role: user.role,
      tid: user.tenantId,
      tv: updated.tokenVersion,
    });
    return { ok: true, token };
  }

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
        tagline: data.tagline === undefined ? undefined : data.tagline.trim() || null,
        bio: data.bio === undefined ? undefined : data.bio.trim() || null,
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
