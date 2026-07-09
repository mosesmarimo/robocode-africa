"use client";

// Narrows the active track board (Coding/Robotics) down to one of its
// languages — a client component only because Radix Select needs one; it
// navigates via router.push rather than calling any data-fetching action
// itself, so it never imports the "server-only" src/lib/leaderboards/actions.ts
// (that boundary hazard is the whole reason this is its own tiny file).
import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { LeaderboardLanguage, LeaderboardScope, LeaderboardTrack } from "@/lib/leaderboards/actions";

const ALL_VALUE = "__all__";

export function LanguagePicker({
  track,
  scope,
  value,
  languages,
}: {
  track: LeaderboardTrack;
  scope: LeaderboardScope;
  value: string | null;
  languages: LeaderboardLanguage[];
}) {
  const router = useRouter();

  function go(next: string) {
    const params = new URLSearchParams({ track, scope });
    if (next !== ALL_VALUE) params.set("language", next);
    router.push(`/app/leaderboards?${params.toString()}`);
  }

  return (
    <Select value={value ?? ALL_VALUE} onValueChange={go}>
      <SelectTrigger className="w-[170px]" aria-label="Filter by language">
        <SelectValue placeholder="All languages" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL_VALUE}>All {track === "coding" ? "Coding" : "Robotics"}</SelectItem>
        {languages.map((l) => (
          <SelectItem key={l.id} value={l.id}>
            {l.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
