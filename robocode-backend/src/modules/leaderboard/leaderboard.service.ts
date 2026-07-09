import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import type { AuthUser } from "../../auth/auth-user.type";
import type { LeaderboardScope, LeaderboardResult, LeaderboardRow } from "./dto";

const TOP_N = 50;

/**
 * Monday 00:00 UTC of the current ISO week — the "this week" scope boundary.
 * UTC-based to match the rest of the gamification layer (e.g. StreakService's
 * UTC calendar-day boundary), so a user's weekly window doesn't drift with
 * their local timezone.
 */
function startOfWeekUtc(now: Date = new Date()): Date {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const day = d.getUTCDay(); // 0=Sun..6=Sat
  const diffToMonday = (day + 6) % 7; // Monday itself -> 0, Sunday -> 6
  d.setUTCDate(d.getUTCDate() - diffToMonday);
  return d;
}

@Injectable()
export class LeaderboardService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Shared ranking logic for both endpoints: sum ledger deltas per user under
   * `tagWhere` (a `{ language }` or `{ track }` filter), narrowed by scope and
   * an optional tenant filter, then rank desc. Fetches the full grouped set
   * (not just top-N) so the caller's own rank can be computed exactly even
   * when they fall outside the top 50 — acceptable at this scale (one row per
   * user who has ever earned XP in this language/track); revisit with a raw
   * HAVING-count query if a language/track ever has enough distinct earners
   * for this to matter.
   */
  private async rank(
    tagWhere: Pick<Prisma.RoboPointLedgerWhereInput, "language" | "track">,
    scope: LeaderboardScope,
    tenant: string | undefined,
    me: AuthUser,
  ): Promise<LeaderboardResult> {
    const where: Prisma.RoboPointLedgerWhereInput = {
      ...tagWhere,
      ...(scope === "week" ? { createdAt: { gte: startOfWeekUtc() } } : {}),
      ...(tenant ? { user: { tenantId: tenant } } : {}),
    };

    const grouped = await this.prisma.roboPointLedger.groupBy({
      by: ["userId"],
      where,
      _sum: { delta: true },
    });

    const sorted = grouped
      .map((g) => ({ userId: g.userId, xp: g._sum.delta ?? 0 }))
      .filter((r) => r.xp > 0)
      .sort((a, b) => b.xp - a.xp);

    const top = sorted.slice(0, TOP_N);
    const users = top.length
      ? await this.prisma.user.findMany({
          where: { id: { in: top.map((r) => r.userId) } },
          select: { id: true, displayName: true, avatarSeed: true },
        })
      : [];
    const byId = new Map(users.map((u) => [u.id, u]));

    const rows: LeaderboardRow[] = top.map((r, i) => {
      const u = byId.get(r.userId);
      return {
        rank: i + 1,
        userId: r.userId,
        displayName: u?.displayName ?? "Unknown",
        avatarSeed: u?.avatarSeed ?? "robo",
        xp: r.xp,
      };
    });

    // Caller's rank within the FULL sorted set (not just the top-N slice) —
    // null if they have no XP tagged for this language/track/scope at all.
    const myIndex = sorted.findIndex((r) => r.userId === me.id);
    const meResult = myIndex === -1 ? null : { rank: myIndex + 1, xp: sorted[myIndex].xp };

    return { rows, me: meResult };
  }

  async byLanguage(user: AuthUser, language: string, scope: LeaderboardScope, tenant?: string) {
    return this.rank({ language }, scope, tenant, user);
  }

  async byTrack(user: AuthUser, track: string, scope: LeaderboardScope, tenant?: string) {
    return this.rank({ track }, scope, tenant, user);
  }
}
