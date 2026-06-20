import Link from "next/link";
import { BookOpen, ArrowRight, Clock, Layers } from "lucide-react";
import { getCurrentUser, getPageUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";
import { TRACK_LABELS, LEVEL_LABELS, type Track } from "@/lib/domain/constants";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export const metadata = { title: "Learn" };

export default async function LearnPage() {
  const user = (await getPageUser());

  const [courses, enrollments] = await Promise.all([
    prisma.course.findMany({
      where: {
        published: true,
        OR: [{ tenantId: null }, { tenantId: user.tenantId }],
      },
      orderBy: { order: "asc" },
      include: { _count: { select: { lessons: true } } },
    }),
    prisma.enrollment.findMany({
      where: { userId: user.id },
      select: { courseId: true, progress: true },
    }),
  ]);

  const enrollMap = new Map(
    enrollments.map((e) => [
      e.courseId,
      (e.progress as { percent?: number })?.percent ?? 0,
    ]),
  );

  // Group courses by track preserving track order
  const trackOrder: Track[] = ["robotics", "coding", "ai"];
  const grouped = new Map<Track, typeof courses>(
    trackOrder.map((t) => [t, []]),
  );
  for (const c of courses) {
    const t = c.track as Track;
    if (grouped.has(t)) grouped.get(t)!.push(c);
  }

  const totalCourses = courses.length;
  const enrolledCount = enrollments.length;
  const completedCount = enrollments.filter(
    (e) => ((e.progress as { percent?: number })?.percent ?? 0) >= 100,
  ).length;

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

      {/* Courses by track */}
      {trackOrder.map((track) => {
        const trackCourses = grouped.get(track) ?? [];
        if (trackCourses.length === 0) return null;

        const trackIcons: Record<Track, React.ReactNode> = {
          robotics: <Layers className="size-4" />,
          coding: <BookOpen className="size-4" />,
          ai: <span className="text-xs font-bold">AI</span>,
        };

        const trackColors: Record<Track, string> = {
          robotics: "bg-primary/12 text-primary",
          coding: "bg-secondary/15 text-secondary",
          ai: "bg-accent/18 text-accent-foreground",
        };

        return (
          <section key={track}>
            <div className="mb-4 flex items-center gap-2">
              <span
                className={`grid size-7 place-items-center rounded-lg text-xs ${trackColors[track]}`}
              >
                {trackIcons[track]}
              </span>
              <h2 className="font-display text-xl font-bold">{TRACK_LABELS[track]}</h2>
              <span className="text-sm text-muted-foreground">
                ({trackCourses.length} {trackCourses.length === 1 ? "course" : "courses"})
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {trackCourses.map((course) => {
                const percent = enrollMap.get(course.id) ?? -1;
                const enrolled = percent >= 0;

                return (
                  <Link key={course.id} href={`/app/learn/${course.slug}`}>
                    <Card className="group h-full p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg">
                      <div className="flex items-start justify-between gap-2">
                        <Badge
                          variant={
                            course.level === "primary" ? "default" : "secondary"
                          }
                        >
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
          </section>
        );
      })}

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
