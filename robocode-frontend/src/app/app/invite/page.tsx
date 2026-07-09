import type { Metadata } from "next";
import Link from "next/link";
import { Gift, Trophy } from "lucide-react";
import { getPageUser } from "@/lib/auth/current-user";
import { getReferralStats, getReferralLeaderboard, type ReferralLeaderboardScope } from "@/lib/referrals/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/app/stat-card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/social/user-avatar";
import { cn } from "@/lib/utils";
import { InviteShareCard } from "./share-card";

export const metadata: Metadata = { title: "Invite friends" };

export default async function InvitePage({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string }>;
}) {
  const { scope: scopeParam } = await searchParams;
  const scope: ReferralLeaderboardScope = scopeParam === "tenant" ? "tenant" : "platform";

  const [user, stats, leaderboard] = await Promise.all([
    getPageUser(),
    getReferralStats(),
    getReferralLeaderboard(scope),
  ]);

  const progressPct = stats.nextBadgeAt
    ? Math.min(100, Math.round((stats.rewardedCount / stats.nextBadgeAt) * 100))
    : 100;

  return (
    <div className="space-y-6">
      {/* Hero + share card */}
      <section className="relative overflow-hidden rounded-2xl bg-brand-gradient p-6 text-white sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-10 size-48 rounded-full bg-white/10 blur-2xl" />
        <div className="relative z-10">
          <div className="mb-2 flex items-center gap-2">
            <Gift className="size-6 text-yellow-300" />
            <span className="text-sm font-medium uppercase tracking-wide text-white/80">Grow RoboCode</span>
          </div>
          <h1 className="font-display text-3xl font-bold sm:text-4xl">Invite friends, earn RoboPoints</h1>
          <p className="mt-1.5 max-w-lg text-white/85">
            Share your link — once a friend joins and their account is approved, you both earn RoboPoints.
          </p>
        </div>
        <div className="relative z-10 mt-6 rounded-xl bg-white/10 p-4 backdrop-blur-sm">
          <InviteShareCard url={stats.url} code={stats.code} />
        </div>
      </section>

      {/* Stats */}
      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Friends referred" value={stats.totalReferred} icon="user-plus" tone="primary" />
        <StatCard label="Rewarded signups" value={stats.rewardedCount} icon="users" tone="secondary" />
        <StatCard label="RoboPoints earned" value={stats.pointsEarned.toLocaleString()} icon="zap" tone="accent" />
      </section>

      {/* Progress to next recruiter badge */}
      {stats.nextBadgeAt != null && (
        <Card>
          <CardContent className="p-5">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium">Next recruiter badge</span>
              <span className="text-muted-foreground">
                {stats.rewardedCount}/{stats.nextBadgeAt} referrals
              </span>
            </div>
            <Progress value={progressPct} className="h-2" />
          </CardContent>
        </Card>
      )}

      {/* Leaderboard */}
      <Card>
        <CardHeader className="flex-row flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="size-5 text-primary" /> Top recruiters
          </CardTitle>
          <div className="flex gap-1 rounded-full border border-border bg-muted p-1 text-xs font-medium">
            <Link
              href="/app/invite?scope=platform"
              className={cn(
                "rounded-full px-3 py-1 transition-colors",
                scope === "platform" ? "bg-card shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              Platform
            </Link>
            <Link
              href="/app/invite?scope=tenant"
              className={cn(
                "rounded-full px-3 py-1 transition-colors",
                scope === "tenant" ? "bg-card shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              My school
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {leaderboard.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              No referrals yet — be the first to invite a friend!
            </p>
          ) : (
            <ul className="divide-y divide-border" role="list">
              {leaderboard.map((row) => {
                const isMe = row.userId === user.id;
                return (
                  <li
                    key={row.userId}
                    className={cn("flex items-center gap-3 px-5 py-3.5", isMe && "bg-primary/6")}
                  >
                    <span className="w-6 shrink-0 text-center text-sm font-semibold text-muted-foreground">
                      {row.rank}
                    </span>
                    <UserAvatar user={{ id: row.userId, displayName: row.displayName, avatarSeed: row.avatarSeed }} size={36} />
                    <span className={cn("min-w-0 flex-1 truncate text-sm font-medium", isMe && "text-primary")}>
                      {row.displayName}
                      {isMe && <span className="ml-1.5 text-xs font-normal text-primary/70">(you)</span>}
                    </span>
                    <Badge variant="muted">{row.rewardedCount} referred</Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
