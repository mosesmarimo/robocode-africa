import { Trophy, Zap } from "lucide-react";
import { UserAvatar } from "@/components/social/user-avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LeaderboardMe, LeaderboardRow } from "@/lib/leaderboards/actions";

// Rank-1/2/3 medal treatment — mirrors src/app/app/leaderboard/leaderboard-tabs.tsx
// so the two leaderboard surfaces (points-based school/team/student board vs.
// this XP-based per-language/track board) read as one visual family.
const MEDAL_COLORS = [
  "bg-yellow-400/20 text-yellow-600 border border-yellow-400/40 font-bold",
  "bg-slate-300/30 text-slate-500 border border-slate-300/50 font-bold",
  "bg-orange-400/20 text-orange-600 border border-orange-300/50 font-bold",
] as const;

const MEDAL_RING = [
  "ring-2 ring-yellow-400/50",
  "ring-2 ring-slate-300/60",
  "ring-2 ring-orange-300/50",
] as const;

function RankChip({ rank }: { rank: number }) {
  if (rank <= 3) {
    const label = rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉";
    return (
      <span
        className={cn(
          "inline-flex size-8 shrink-0 items-center justify-center rounded-full text-sm",
          MEDAL_COLORS[rank - 1],
        )}
        aria-label={`Rank ${rank}`}
      >
        {label}
      </span>
    );
  }
  return (
    <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-muted-foreground">
      {rank}
    </span>
  );
}

/** Shared list body for a leaderboard board — a top-N ranked list plus the
 * caller's own rank (highlighted inline if they're in the top N, or pinned
 * below as a callout if they're not). Reused by the /app/leaderboards page
 * and the per-course "Top learners in <Language>" widget. */
export function LeaderboardList({
  title,
  rows,
  me,
  currentUserId,
  emptyLabel,
}: {
  title: string;
  rows: LeaderboardRow[];
  me: LeaderboardMe | null;
  currentUserId: string;
  emptyLabel: string;
}) {
  const meInRows = rows.some((r) => r.userId === currentUserId);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Trophy className="size-5 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-10 text-center">
            <span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Zap className="size-6" />
            </span>
            <p className="text-sm text-muted-foreground">{emptyLabel}</p>
          </div>
        ) : (
          <ul className="divide-y divide-border" role="list">
            {rows.map((row) => {
              const isMe = row.userId === currentUserId;
              const isTop3 = row.rank <= 3;
              return (
                <li
                  key={row.userId}
                  className={cn(
                    "flex items-center gap-3 px-5 py-3.5 transition-colors",
                    isMe && "bg-primary/6",
                    !isMe && "hover:bg-muted/50",
                  )}
                >
                  <RankChip rank={row.rank} />
                  <UserAvatar
                    user={{ id: row.userId, displayName: row.displayName, avatarSeed: row.avatarSeed }}
                    size={36}
                    className={cn(isTop3 && MEDAL_RING[row.rank - 1], isMe && "ring-2 ring-primary/60")}
                  />
                  <div className="min-w-0 flex-1">
                    <p className={cn("truncate font-medium", isMe && "text-primary")}>
                      {row.displayName}
                      {isMe && <span className="ml-1.5 text-xs font-normal text-primary/70">(you)</span>}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p
                      className={cn(
                        "font-bold tabular-nums",
                        isTop3 && row.rank === 1 && "text-yellow-600",
                        isTop3 && row.rank === 2 && "text-slate-500",
                        isTop3 && row.rank === 3 && "text-orange-600",
                        !isTop3 && "text-foreground",
                      )}
                    >
                      {row.xp.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">XP</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {me && !meInRows && (
          <div className="flex items-center gap-3 border-t border-border bg-primary/6 px-5 py-3.5">
            <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-primary">
              #{me.rank}
            </span>
            <p className="min-w-0 flex-1 truncate text-sm font-medium text-primary">Your rank</p>
            <p className="shrink-0 font-bold tabular-nums text-primary">{me.xp.toLocaleString()} XP</p>
          </div>
        )}
        {!me && rows.length > 0 && (
          <p className="border-t border-border px-5 py-3 text-xs text-muted-foreground">
            You&apos;re not ranked here yet — complete a tryit, exercise, or lesson to get on the board.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
