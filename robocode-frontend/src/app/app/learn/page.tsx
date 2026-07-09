import Link from "next/link";
import { BookOpen, ArrowRight, Clock, Trophy } from "lucide-react";
import { apiGet } from "@/lib/api/client";
import { TRACK_LABELS, LEVEL_LABELS, type Track } from "@/lib/domain/constants";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export const metadata = { title: "Learn" };

interface CourseCard {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  track: string;
  level: string;
  _count: { lessons: number };
}

interface LearnCoursesResponse {
  courses: CourseCard[];
  enrollMap: Record<string, number>;
  grouped: Record<Track, CourseCard[]>;
  trackOrder: Track[];
  stats: { totalCourses: number; enrolledCount: number; completedCount: number };
}

export default async function LearnPage({
  searchParams,
}: {
  searchParams: Promise<{ track?: string }>;
}) {
  const [{ track: trackParam }, data] = await Promise.all([
    searchParams,
    apiGet<LearnCoursesResponse>("/learn/courses"),
  ]);

  const { courses } = data;

  const enrollMap = new Map<string, number>(Object.entries(data.enrollMap));

  // Group courses by track preserving track order
  const trackOrder = data.trackOrder;
  const grouped = new Map<Track, CourseCard[]>(
    trackOrder.map((t) => [t, data.grouped[t] ?? []]),
  );

  // Active tab from ?track=…, falling back to the first track with courses.
  const activeTrack: Track =
    (trackParam && trackOrder.includes(trackParam as Track) ? (trackParam as Track) : null) ??
    trackOrder.find((t) => (grouped.get(t)?.length ?? 0) > 0) ??
    trackOrder[0];
  const activeCourses = grouped.get(activeTrack) ?? [];

  const trackTabColors: Record<Track, string> = {
    robotics: "from-[#2563ff] to-[#16c79a]",
    coding: "from-[#16c79a] to-[#5fb73a]",
    ai: "from-[#7c3aed] to-[#ec4899]",
  };

  const totalCourses = data.stats.totalCourses;
  const enrolledCount = data.stats.enrolledCount;
  const completedCount = data.stats.completedCount;

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl bg-brand-gradient p-6 text-white sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-12 size-56 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-8 left-1/3 size-40 rounded-full bg-white/8 blur-2xl" />
        <div className="relative z-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-white/80">RoboCode Academy</p>
            <h1 className="font-display text-3xl font-bold sm:text-4xl">Learning Paths</h1>
            <p className="mt-2 max-w-lg text-white/85">
              Explore robotics, coding, and AI through interactive courses designed for young innovators.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <div className="rounded-xl bg-white/15 px-4 py-3 backdrop-blur-sm">
              <p className="text-2xl font-bold font-display">{totalCourses}</p>
              <p className="text-xs text-white/80">Courses</p>
            </div>
            <div className="rounded-xl bg-white/15 px-4 py-3 backdrop-blur-sm">
              <p className="text-2xl font-bold font-display">{enrolledCount}</p>
              <p className="text-xs text-white/80">Enrolled</p>
            </div>
            <div className="rounded-xl bg-white/15 px-4 py-3 backdrop-blur-sm">
              <p className="text-2xl font-bold font-display">{completedCount}</p>
              <p className="text-xs text-white/80">Completed</p>
            </div>
          </div>
        </div>
      </section>

      {/* Track tabs — Robotics / Coding / AI */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2.5">
          {trackOrder.map((t) => {
            const active = t === activeTrack;
            const count = grouped.get(t)?.length ?? 0;
            return (
              <Link
                key={t}
                href={`/app/learn?track=${t}`}
                aria-current={active ? "page" : undefined}
                className={
                  active
                    ? `rounded-xl bg-gradient-to-r ${trackTabColors[t]} px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/30 ring-2 ring-white/40 scale-[1.03] transition-all`
                    : "rounded-xl bg-muted px-5 py-2.5 text-sm font-semibold text-muted-foreground transition-all hover:bg-muted/70 hover:text-foreground"
                }
              >
                {TRACK_LABELS[t]}
                <span className={`ml-2 ${active ? "text-white/85" : "text-muted-foreground/70"}`}>{count}</span>
              </Link>
            );
          })}
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/app/leaderboards">
            <Trophy className="size-4" /> Leaderboards
          </Link>
        </Button>
      </div>

      {/* Active track's courses */}
      <section>
        {activeCourses.length === 0 ? (
          <Card className="flex flex-col items-center justify-center gap-3 p-12 text-center">
            <BookOpen className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No {TRACK_LABELS[activeTrack]} courses yet.</p>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activeCourses.map((course) => {
              const percent = enrollMap.get(course.id) ?? -1;
              const enrolled = percent >= 0;

              return (
                <Link key={course.id} href={`/app/learn/${course.slug}`}>
                  <Card className="group h-full p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg">
                    <div className="flex items-start justify-between gap-2">
                      <Badge variant={course.level === "primary" ? "default" : "secondary"}>
                        {LEVEL_LABELS[course.level as keyof typeof LEVEL_LABELS]}
                      </Badge>
                      {enrolled && (
                        <Badge variant={percent >= 100 ? "success" : "muted"}>
                          {percent >= 100 ? "Done" : `${percent}%`}
                        </Badge>
                      )}
                    </div>

                    <h3 className="mt-3 font-display font-bold leading-snug group-hover:text-primary">
                      {course.title}
                    </h3>

                    {course.description && (
                      <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
                        {course.description}
                      </p>
                    )}

                    <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" />
                        {course._count.lessons} {course._count.lessons === 1 ? "lesson" : "lessons"}
                      </span>
                    </div>

                    {enrolled && (
                      <div className="mt-3">
                        <Progress value={percent} className="h-1.5" />
                        <p className="mt-1 text-xs text-muted-foreground">{percent}% complete</p>
                      </div>
                    )}

                    {!enrolled && (
                      <div className="mt-4 flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                        Start course <ArrowRight className="size-3" />
                      </div>
                    )}
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {courses.length === 0 && (
        <Card className="flex flex-col items-center justify-center gap-4 p-16 text-center">
          <span className="grid size-16 place-items-center rounded-2xl bg-primary/10 text-primary">
            <BookOpen className="size-8" />
          </span>
          <div>
            <p className="font-display text-lg font-bold">No courses yet</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Courses will appear here as they are published. Check back soon!
            </p>
          </div>
          <Button variant="gradient" asChild>
            <Link href="/app">Back to Dashboard</Link>
          </Button>
        </Card>
      )}
    </div>
  );
}
