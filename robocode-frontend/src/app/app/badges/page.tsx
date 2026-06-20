import { Award, Lock } from "lucide-react";
import { getPageUser } from "@/lib/auth/current-user";
import { apiGet } from "@/lib/api/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/app/stat-card";
import { Icon } from "@/components/icon";
import { cn, formatRelative } from "@/lib/utils";

export const metadata = { title: "Badges" };

interface BadgeRecord {
  id: string;
  name: string;
  description: string;
  icon: string;
}

interface UserBadgeRecord {
  badgeId: string;
  awardedAt: string;
  badge: BadgeRecord;
}

interface BadgesResponse {
  allBadges: BadgeRecord[];
  earnedRecords: UserBadgeRecord[];
  earnedCount: number;
  totalCount: number;
}

export default async function BadgesPage() {
  await getPageUser();

  const { allBadges, earnedRecords, earnedCount, totalCount } =
    await apiGet<BadgesResponse>("/badges");

  const earnedMap = new Map(earnedRecords.map((ub) => [ub.badgeId, ub]));

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Badges</h1>
          <p className="text-muted-foreground">
            Earn badges by completing challenges, lessons, and reaching milestones.
          </p>
        </div>
        <Badge variant="secondary" className="text-sm px-4 py-1.5">
          {earnedCount} / {totalCount} earned
        </Badge>
      </div>

      {/* Stats strip */}
      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Badges earned"
          value={earnedCount}
          icon="award"
          tone="accent"
        />
        <StatCard
          label="Badges available"
          value={totalCount}
          icon="sparkles"
          tone="primary"
        />
        <StatCard
          label="Still to unlock"
          value={totalCount - earnedCount}
          icon="target"
          tone="secondary"
          hint={totalCount - earnedCount === 0 ? "You got them all!" : "Keep going!"}
        />
      </section>

      {/* Badge grid */}
      {allBadges.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 p-12 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Award className="size-7" />
          </span>
          <p className="font-medium">No badges yet</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Badges will appear here as you complete tasks and reach milestones. Check back soon!
          </p>
        </Card>
      ) : (
        <section>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {allBadges.map((badge) => {
              const earned = earnedMap.get(badge.id);
              const isEarned = !!earned;

              return (
                <Card
                  key={badge.id}
                  className={cn(
                    "relative flex flex-col items-center gap-3 p-6 text-center transition-all",
                    isEarned
                      ? "hover:-translate-y-0.5 hover:shadow-lg hover:border-primary/40"
                      : "opacity-70",
                  )}
                >
                  {/* Icon chip */}
                  <div
                    className={cn(
                      "relative grid size-16 shrink-0 place-items-center rounded-2xl",
                      isEarned
                        ? "bg-brand-gradient text-white shadow-md"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    <Icon name={badge.icon} className="size-8" />

                    {/* Lock overlay for unearned badges */}
                    {!isEarned && (
                      <span className="absolute -bottom-1.5 -right-1.5 grid size-6 place-items-center rounded-full border-2 border-background bg-muted-foreground/80 text-background">
                        <Lock className="size-3" />
                      </span>
                    )}

                    {/* Earned glow ring */}
                    {isEarned && (
                      <span className="pointer-events-none absolute inset-0 rounded-2xl ring-2 ring-primary/40 ring-offset-2 ring-offset-card" />
                    )}
                  </div>

                  {/* Name */}
                  <p
                    className={cn(
                      "font-display font-semibold leading-tight",
                      isEarned ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {badge.name}
                  </p>

                  {/* Description / hint */}
                  <p className="line-clamp-3 text-xs text-muted-foreground leading-relaxed">
                    {badge.description}
                  </p>

                  {/* Earned date chip OR "locked" hint */}
                  {isEarned ? (
                    <span className="mt-auto inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                      <Award className="size-3" />
                      Earned {formatRelative(earned.awardedAt)}
                    </span>
                  ) : (
                    <span className="mt-auto inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                      <Lock className="size-3" />
                      Locked
                    </span>
                  )}
                </Card>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
