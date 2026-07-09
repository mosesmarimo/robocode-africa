import Link from "next/link";
import { Trophy, Code2, Cpu } from "lucide-react";
import { getPageUser } from "@/lib/auth/current-user";
import {
  getLanguageLeaderboard,
  getTrackLeaderboard,
  isLeaderboardLanguage,
  languageLabel,
  LEADERBOARD_LANGUAGES,
  type LeaderboardScope,
  type LeaderboardTrack,
} from "@/lib/leaderboards/actions";
import { LeaderboardList } from "@/components/app/leaderboard-list";
import { LanguagePicker } from "./language-picker";
import { cn } from "@/lib/utils";

export const metadata = { title: "Leaderboards" };

const TRACK_TAB_COLORS: Record<LeaderboardTrack, string> = {
  coding: "from-[#16c79a] to-[#5fb73a]",
  robotics: "from-[#2563ff] to-[#16c79a]",
};

function buildHref(next: { track: LeaderboardTrack; language: string | null; scope: LeaderboardScope }): string {
  const params = new URLSearchParams({ track: next.track, scope: next.scope });
  if (next.language) params.set("language", next.language);
  return `/app/leaderboards?${params.toString()}`;
}

export default async function LeaderboardsPage({
  searchParams,
}: {
  searchParams: Promise<{ track?: string; language?: string; scope?: string }>;
}) {
  const [user, sp] = await Promise.all([getPageUser(), searchParams]);

  const track: LeaderboardTrack = sp.track === "robotics" ? "robotics" : "coding";
  const scope: LeaderboardScope = sp.scope === "week" ? "week" : "all";
  const languagesForTrack = LEADERBOARD_LANGUAGES.filter((l) => l.track === track);
  const selectedLanguage =
    sp.language && isLeaderboardLanguage(sp.language) && languagesForTrack.some((l) => l.id === sp.language)
      ? sp.language
      : null;

  const board = selectedLanguage
    ? await getLanguageLeaderboard(selectedLanguage, scope)
    : await getTrackLeaderboard(track, scope);

  const boardTitle = selectedLanguage
    ? `Top learners — ${languageLabel(selectedLanguage)}`
    : `Top learners — ${track === "coding" ? "Coding" : "Robotics"} (all languages)`;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="relative overflow-hidden rounded-2xl bg-brand-gradient p-6 text-white sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-12 size-56 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-8 left-1/3 size-40 rounded-full bg-white/8 blur-2xl" />
        <div className="relative z-10">
          <div className="mb-2 flex items-center gap-2">
            <Trophy className="size-6 text-yellow-300" />
            <span className="text-sm font-medium text-white/80 uppercase tracking-wide">XP Leaderboards</span>
          </div>
          <h1 className="font-display text-3xl font-bold sm:text-4xl">Leaderboards</h1>
          <p className="mt-1.5 max-w-md text-white/85">
            Ranked by XP earned from lessons, tryits, exercises, and challenges — by track or by language.
          </p>
        </div>
      </div>

      {/* Track tabs + language picker + scope toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2.5">
          {(["coding", "robotics"] as const).map((t) => {
            const active = t === track;
            return (
              <Link
                key={t}
                href={buildHref({ track: t, language: null, scope })}
                aria-current={active ? "page" : undefined}
                className={
                  active
                    ? `flex items-center gap-1.5 rounded-xl bg-gradient-to-r ${TRACK_TAB_COLORS[t]} px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/30 ring-2 ring-white/40 scale-[1.03] transition-all`
                    : "flex items-center gap-1.5 rounded-xl bg-muted px-5 py-2.5 text-sm font-semibold text-muted-foreground transition-all hover:bg-muted/70 hover:text-foreground"
                }
              >
                {t === "coding" ? <Code2 className="size-4" /> : <Cpu className="size-4" />}
                {t === "coding" ? "Coding" : "Robotics"}
              </Link>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <LanguagePicker track={track} scope={scope} value={selectedLanguage} languages={languagesForTrack} />
          <div className="flex overflow-hidden rounded-lg border border-border">
            {(["all", "week"] as const).map((s) => (
              <Link
                key={s}
                href={buildHref({ track, language: selectedLanguage, scope: s })}
                aria-current={scope === s ? "page" : undefined}
                className={cn(
                  "px-3.5 py-2 text-sm font-medium transition-colors",
                  scope === s ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted",
                )}
              >
                {s === "all" ? "All-time" : "This week"}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <LeaderboardList
        title={boardTitle}
        rows={board.rows}
        me={board.me}
        currentUserId={user.id}
        emptyLabel={
          scope === "week"
            ? "No XP earned in this scope this week yet — be the first!"
            : "No XP earned in this scope yet — be the first!"
        }
      />
    </div>
  );
}
