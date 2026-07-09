import { Injectable } from "@nestjs/common";
import { customAlphabet } from "nanoid";
import { PrismaService } from "../../prisma/prisma.service";
import { PointsService } from "../../common/points.service";
import { NotifyService } from "../../common/notify.service";
import { POINTS, REFERRAL_DAILY_REWARD_CAP, RECRUITER_BADGES, FRONTEND_ORIGIN } from "../../domain/constants";
import type { AuthUser } from "../../auth/auth-user.type";
import type { ReferralLeaderboardScope, ReferralStats, ReferralLeaderboardRow } from "./dto";

// No-ambiguous-chars alphabet (no 0/O/1/I) so codes are easy to read/type aloud.
const CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const CODE_LENGTH = 8;
const MAX_CODE_ATTEMPTS = 5;
const generateCode = customAlphabet(CODE_ALPHABET, CODE_LENGTH);

function isUniqueConstraintError(e: unknown): boolean {
  return !!e && typeof e === "object" && (e as { code?: string }).code === "P2002";
}

function startOfTodayUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

@Injectable()
export class ReferralsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly points: PointsService,
    private readonly notify: NotifyService,
  ) {}

  /**
   * The share URL for a given code (`${FRONTEND_ORIGIN}/join?ref=CODE`).
   * FRONTEND_ORIGIN (not ROOT_DOMAIN) is used here because it carries a
   * scheme — ROOT_DOMAIN is a bare hostname (e.g. "robocode.africa") meant
   * for building tenant subdomains, not standalone absolute URLs.
   */
  private shareUrl(code: string): string {
    return `${FRONTEND_ORIGIN}/join?ref=${code}`;
  }

  /**
   * Return the user's stable referral code, generating one on first use.
   * Retries on a unique-constraint collision (astronomically unlikely at
   * 8 chars from a 32-char alphabet, but cheap to guard against).
   */
  async ensureCode(userId: string): Promise<string> {
    const existing = await this.prisma.user.findUnique({ where: { id: userId }, select: { referralCode: true } });
    if (existing?.referralCode) return existing.referralCode;

    for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
      const code = generateCode();
      try {
        const updated = await this.prisma.user.update({
          where: { id: userId },
          data: { referralCode: code },
          select: { referralCode: true },
        });
        return updated.referralCode as string;
      } catch (err) {
        if (isUniqueConstraintError(err)) continue; // code collision — try another
        throw err;
      }
    }
    throw new Error("Could not generate a unique referral code — please try again.");
  }

  /**
   * Called right after a new user is created with a captured `?ref=` code.
   * Resolves the code to a referrer and creates a `pending` Referral. Unknown
   * codes, self-referral, and duplicate referrals are all rejected silently
   * (the signup flow itself must never see an error) — self/dupe attempts are
   * recorded to the audit log for admin visibility.
   */
  async recordSignup(refereeId: string, code: string): Promise<void> {
    const referrer = await this.prisma.user.findFirst({ where: { referralCode: code } });
    if (!referrer) return; // unknown/absent code — normal signup, nothing to log

    if (referrer.id === refereeId) {
      await this.prisma.auditLog.create({
        data: { actorId: refereeId, action: "referral.self_rejected", targetType: "User", targetId: refereeId, meta: { code } },
      });
      return;
    }

    const existing = await this.prisma.referral.findUnique({ where: { refereeId } });
    if (existing) {
      await this.prisma.auditLog.create({
        data: { actorId: refereeId, action: "referral.duplicate_rejected", targetType: "Referral", targetId: existing.id, meta: { code } },
      });
      return;
    }

    try {
      await this.prisma.referral.create({
        data: { referrerId: referrer.id, refereeId, code, status: "pending" },
      });
    } catch (err) {
      // Lost a check-then-create race to a concurrent recordSignup for the
      // same referee — refereeId is @unique, so one Referral row now exists
      // either way. Nothing more to do.
      if (!isUniqueConstraintError(err)) throw err;
    }
  }

  /**
   * Called whenever a user transitions to `status: "active"` (signup
   * auto-approve, admin/school approval, guardian consent). Settles the
   * user's pending referral (if any): rewards both sides idempotently, flips
   * the Referral to `rewarded`, awards recruiter badges by threshold, and
   * notifies the referrer. A no-op if there's no pending referral, the
   * referee isn't actually active, or the referrer has hit their daily cap
   * (the referral stays pending and will be retried on the next call, e.g. a
   * subsequent activation elsewhere, or tomorrow).
   */
  async settleIfActive(refereeId: string): Promise<void> {
    const referral = await this.prisma.referral.findUnique({
      where: { refereeId },
      include: { referrer: true },
    });
    if (!referral || referral.status !== "pending") return;

    const referee = await this.prisma.user.findUnique({ where: { id: refereeId } });
    if (!referee || referee.status !== "active") return;

    const rewardedToday = await this.prisma.referral.count({
      where: { referrerId: referral.referrerId, status: "rewarded", rewardedAt: { gte: startOfTodayUtc() } },
    });
    if (rewardedToday >= REFERRAL_DAILY_REWARD_CAP) return; // stays pending — cap resets tomorrow

    await this.points.awardPoints({
      userId: referral.referrerId,
      delta: POINTS.REFERRAL_REFERRER,
      reason: "referral_referrer",
      refType: "referral",
      refId: referral.id,
      idemKey: `referral:${refereeId}`,
    });
    await this.points.awardPoints({
      userId: refereeId,
      delta: POINTS.REFERRAL_WELCOME,
      reason: "referral_welcome",
      refType: "referral",
      refId: referral.id,
      idemKey: `referral-welcome:${refereeId}`,
    });

    await this.prisma.referral.update({
      where: { id: referral.id },
      data: { status: "rewarded", rewardedAt: new Date() },
    });

    const rewardedCount = await this.prisma.referral.count({
      where: { referrerId: referral.referrerId, status: "rewarded" },
    });
    // Award every threshold reached so far (awardBadge no-ops if already
    // granted) — robust even if a count ever jumps past a threshold.
    for (const { threshold, code } of RECRUITER_BADGES) {
      if (rewardedCount >= threshold) await this.points.awardBadge(referral.referrerId, code);
    }

    await this.notify.notify({
      userId: referral.referrerId,
      type: "referral",
      title: "New referral!",
      body: `🎉 ${referee.displayName} joined with your invite — +${POINTS.REFERRAL_REFERRER} RoboPoints!`,
    });
  }

  /** GET /referrals/me — the caller's code, share link, and progress. */
  async stats(user: AuthUser): Promise<ReferralStats> {
    const code = await this.ensureCode(user.id);

    const [totalReferred, rewardedCount, pointsAgg] = await Promise.all([
      this.prisma.referral.count({ where: { referrerId: user.id } }),
      this.prisma.referral.count({ where: { referrerId: user.id, status: "rewarded" } }),
      this.prisma.roboPointLedger.aggregate({
        where: { userId: user.id, refType: "referral", reason: "referral_referrer" },
        _sum: { delta: true },
      }),
    ]);

    const nextBadgeAt = RECRUITER_BADGES.find((b) => b.threshold > rewardedCount)?.threshold ?? null;

    return {
      code,
      url: this.shareUrl(code),
      totalReferred,
      rewardedCount,
      pointsEarned: pointsAgg._sum.delta ?? 0,
      nextBadgeAt,
    };
  }

  /**
   * Top referrers by rewarded-referral count. `platform` spans every tenant;
   * `tenant` restricts to the caller's own tenant (requires `tenantId`).
   */
  async leaderboard(scope: ReferralLeaderboardScope, tenantId?: string): Promise<ReferralLeaderboardRow[]> {
    const grouped = await this.prisma.referral.groupBy({
      by: ["referrerId"],
      where: {
        status: "rewarded",
        ...(scope === "tenant" && tenantId ? { referrer: { tenantId } } : {}),
      },
      _count: { referrerId: true },
      orderBy: { _count: { referrerId: "desc" } },
      take: 20,
    });
    if (grouped.length === 0) return [];

    const users = await this.prisma.user.findMany({
      where: { id: { in: grouped.map((g) => g.referrerId) } },
      select: { id: true, displayName: true, avatarSeed: true },
    });
    const byId = new Map(users.map((u) => [u.id, u]));

    return grouped.map((g, i) => {
      const u = byId.get(g.referrerId);
      return {
        rank: i + 1,
        userId: g.referrerId,
        displayName: u?.displayName ?? "Unknown",
        avatarSeed: u?.avatarSeed ?? "robo",
        rewardedCount: g._count.referrerId,
      };
    });
  }
}
