import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, Play, GraduationCap, BookOpen, Target } from "lucide-react";
import { getTrack } from "@/lib/tracks/api";
import { LEVEL_LABELS } from "@/lib/domain/constants";
import { languageLabel } from "@/lib/leaderboards/actions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const DIFFICULTY_VARIANT = {
  beginner: "success",
  intermediate: "warning",
  advanced: "destructive",
} as const;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const track = await getTrack(slug);
  return { title: track ? track.title : "Track" };
}

export default async function TrackDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const track = await getTrack(slug);
  if (!track) notFound();

  const { progress } = track;
  const isComplete = progress.total > 0 && progress.done === progress.total;

  return (
    <div className="space-y-6">
      {/* Back nav */}
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/app/tracks">
            <ArrowLeft className="size-4" /> Back to Tracks
          </Link>
        </Button>
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl bg-brand-gradient p-6 text-white sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-10 size-48 rounded-full bg-white/10 blur-2xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-white/15 text-3xl backdrop-blur-sm">
              {track.icon ?? "🗺️"}
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="border-white/30 bg-white/10 text-white/90 capitalize">
                  {track.level}
                </Badge>
                {track.language && (
                  <Badge variant="outline" className="border-white/30 bg-white/10 text-white/90">
                    {languageLabel(track.language)}
                  </Badge>
                )}
              </div>
              <h1 className="font-display text-2xl font-bold sm:text-3xl">{track.title}</h1>
            </div>
          </div>

          {track.description && <p className="mt-3 max-w-2xl text-white/85">{track.description}</p>}

          <div className="mt-5 max-w-sm">
            <div className="mb-1 flex justify-between text-sm">
              <span className="font-medium">Progress</span>
              <span className="text-white/80">
                {progress.done}/{progress.total} steps &middot; {progress.percent}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/25">
              <div
                className="h-full rounded-full bg-white transition-all"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Certificate banner */}
      {isComplete && track.certificate && (
        <Card className="flex flex-wrap items-center justify-between gap-4 border-primary/30 bg-primary/5 p-5">
          <div className="flex items-center gap-3">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand-gradient text-2xl text-white shadow-md">
              🎓
            </span>
            <div>
              <p className="font-display font-bold">Track complete!</p>
              <p className="text-sm text-muted-foreground">
                You finished every step of {track.title}. Your certificate is ready.
              </p>
            </div>
          </div>
          <Button variant="gradient" asChild>
            <Link href={`/cert/${track.certificate.code}`}>
              <GraduationCap className="size-4" /> View certificate
            </Link>
          </Button>
        </Card>
      )}

      {/* Roadmap checklist */}
      <div className="space-y-3">
        <h2 className="font-display text-xl font-bold">Roadmap</h2>
        {track.items.length === 0 ? (
          <Card className="flex flex-col items-center gap-3 p-10 text-center">
            <BookOpen className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">This track has no steps yet — check back soon.</p>
          </Card>
        ) : (
          <Card className="divide-y divide-border overflow-hidden p-0">
            {track.items.map((item, idx) => {
              const href =
                item.type === "course" ? `/app/learn/${item.slug}` : `/app/challenges/${item.slug}`;

              const statusChip = item.done ? (
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
                  <Check className="size-4" />
                </span>
              ) : item.current ? (
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-gradient text-white shadow-md ring-2 ring-primary/30 ring-offset-2 ring-offset-card">
                  <Play className="size-4 fill-current" />
                </span>
              ) : (
                <span className="grid size-9 shrink-0 place-items-center rounded-full border border-border text-sm font-semibold text-muted-foreground">
                  {idx + 1}
                </span>
              );

              return (
                <Link
                  key={`${item.type}-${item.slug}`}
                  href={href}
                  className={cn(
                    "flex items-center gap-4 p-4 transition-colors hover:bg-muted/50 sm:p-5",
                    item.current && "bg-primary/5",
                  )}
                >
                  {statusChip}

                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "truncate font-medium",
                        item.done ? "text-muted-foreground line-through" : "text-foreground",
                      )}
                    >
                      {item.title}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <Badge variant="muted" className="gap-1">
                        {item.type === "course" ? (
                          <BookOpen className="size-3" />
                        ) : (
                          <Target className="size-3" />
                        )}
                        {item.type === "course" ? "Course" : "Challenge"}
                      </Badge>
                      {item.type === "course" && item.level && (
                        <Badge variant="secondary" className="capitalize">
                          {LEVEL_LABELS[item.level as keyof typeof LEVEL_LABELS] ?? item.level}
                        </Badge>
                      )}
                      {item.type === "challenge" && item.difficulty && (
                        <Badge
                          variant={
                            DIFFICULTY_VARIANT[item.difficulty as keyof typeof DIFFICULTY_VARIANT] ??
                            "outline"
                          }
                          className="capitalize"
                        >
                          {item.difficulty}
                        </Badge>
                      )}
                      {item.language && <Badge variant="outline">{languageLabel(item.language)}</Badge>}
                    </div>
                  </div>
                </Link>
              );
            })}
          </Card>
        )}
      </div>
    </div>
  );
}
