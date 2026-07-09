import Link from "next/link";
import { Route } from "lucide-react";
import { getTracks } from "@/lib/tracks/api";
import { TRACKS, TRACK_LABELS, type Track } from "@/lib/domain/constants";
import { languageLabel } from "@/lib/leaderboards/actions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export const metadata = { title: "Tracks" };

export default async function TracksPage() {
  const tracks = await getTracks();

  const grouped = new Map<Track, typeof tracks>(TRACKS.map((t) => [t, []]));
  for (const track of tracks) {
    const key = (TRACKS as readonly string[]).includes(track.track) ? (track.track as Track) : null;
    if (key) grouped.get(key)!.push(track);
  }

  const completedCount = tracks.filter((t) => t.certificate).length;

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Learning Tracks</h1>
          <p className="text-muted-foreground">
            Follow a curated path of courses and challenges from start to certificate.
          </p>
        </div>
        {tracks.length > 0 && (
          <Badge variant="secondary" className="text-sm px-4 py-1.5">
            {completedCount} / {tracks.length} completed
          </Badge>
        )}
      </div>

      {tracks.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 p-12 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Route className="size-7" />
          </span>
          <p className="font-medium">No tracks yet</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Curated learning tracks will appear here as they are published. Check back soon!
          </p>
        </Card>
      ) : (
        TRACKS.map((t) => {
          const trackList = grouped.get(t) ?? [];
          if (trackList.length === 0) return null;

          return (
            <section key={t} className="space-y-4">
              <h2 className="font-display text-xl font-bold">{TRACK_LABELS[t]}</h2>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {trackList.map((track) => {
                  const percent =
                    track.itemCount > 0 ? Math.round((track.doneCount / track.itemCount) * 100) : 0;
                  const earned = !!track.certificate;

                  return (
                    <Card
                      key={track.slug}
                      className="flex flex-col gap-3 p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-muted text-2xl">
                          {track.icon ?? <Route className="size-5 text-muted-foreground" />}
                        </span>
                        <Badge variant="outline" className="capitalize">
                          {track.level}
                        </Badge>
                      </div>

                      <div>
                        <h3 className="font-display font-bold leading-snug">{track.title}</h3>
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                          {track.description}
                        </p>
                      </div>

                      {track.language && (
                        <Badge variant="secondary" className="w-fit">
                          {languageLabel(track.language)}
                        </Badge>
                      )}

                      <div className="mt-1">
                        <Progress value={percent} className="h-1.5" />
                        <p className="mt-1 text-xs text-muted-foreground">
                          {track.doneCount}/{track.itemCount} complete
                        </p>
                      </div>

                      <div className="mt-auto pt-1">
                        {earned ? (
                          <div className="flex items-center justify-between gap-2">
                            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                              🎓 Certificate earned
                            </span>
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/cert/${track.certificate!.code}`}>View certificate</Link>
                            </Button>
                          </div>
                        ) : (
                          <Button variant="gradient" size="sm" className="w-full" asChild>
                            <Link href={`/app/tracks/${track.slug}`}>
                              {track.doneCount === 0 ? "Start track" : "Continue"}
                            </Link>
                          </Button>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}
