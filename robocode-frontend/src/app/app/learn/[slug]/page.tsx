import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CheckCircle2,
  Circle,
  Clock,
  ChevronRight,
  Target,
  BookOpen,
  ArrowLeft,
} from "lucide-react";
import { apiGet, ApiError, apiPost } from "@/lib/api/client";
import { TRACK_LABELS, LEVEL_LABELS } from "@/lib/domain/constants";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

export const metadata = { title: "Course" };

interface CourseLesson {
  id: string;
  slug: string;
  title: string;
  estMinutes: number;
}

interface CourseTask {
  id: string;
  slug: string;
  title: string;
  difficulty: string;
  points: number;
}

interface CourseDetail {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  track: string;
  level: string;
  tenantId: string | null;
  lessons: CourseLesson[];
  tasks: CourseTask[];
}

interface CourseResponse {
  course: CourseDetail;
  enrollment: { completedAt: string | null } | null;
  enrolledPercent: number | null;
  completedLessonIds: string[];
  stats: { totalLessons: number; completedLessons: number; totalMinutes: number };
  nextLesson: CourseLesson | null;
}

export default async function CoursePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let data: CourseResponse;
  try {
    data = await apiGet<CourseResponse>(`/learn/courses/${slug}`);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }

  const { course, enrollment, enrolledPercent, nextLesson } = data;

  const completedSet = new Set(data.completedLessonIds);

  const totalLessons = data.stats.totalLessons;
  const completedLessons = data.stats.completedLessons;
  const totalMinutes = data.stats.totalMinutes;

  return (
    <div className="space-y-6">
      {/* Back */}
      <div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/app/learn">
            <ArrowLeft className="size-4" /> Back to courses
          </Link>
        </Button>
      </div>

      {/* Header */}
      <section className="relative overflow-hidden rounded-2xl bg-brand-gradient p-6 text-white sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-10 size-48 rounded-full bg-white/10 blur-2xl" />
        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-white/30 text-white/90 bg-white/10">
              {TRACK_LABELS[course.track as keyof typeof TRACK_LABELS]}
            </Badge>
            <Badge variant="outline" className="border-white/30 text-white/90 bg-white/10">
              {LEVEL_LABELS[course.level as keyof typeof LEVEL_LABELS]}
            </Badge>
          </div>
          <h1 className="font-display mt-3 text-3xl font-bold sm:text-4xl">
            {course.title}
          </h1>
          {course.description && (
            <p className="mt-2 max-w-2xl text-white/85">{course.description}</p>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-6 text-sm text-white/80">
            <span className="flex items-center gap-1.5">
              <BookOpen className="size-4" />
              {totalLessons} {totalLessons === 1 ? "lesson" : "lessons"}
            </span>
            {totalMinutes > 0 && (
              <span className="flex items-center gap-1.5">
                <Clock className="size-4" />
                ~{totalMinutes} min
              </span>
            )}
            {course.tasks.length > 0 && (
              <span className="flex items-center gap-1.5">
                <Target className="size-4" />
                {course.tasks.length} {course.tasks.length === 1 ? "challenge" : "challenges"}
              </span>
            )}
          </div>

          {enrolledPercent !== null && (
            <div className="mt-5 max-w-sm">
              <div className="mb-1 flex justify-between text-sm">
                <span className="font-medium">Progress</span>
                <span className="text-white/80">{completedLessons}/{totalLessons} lessons</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/25">
                <div
                  className="h-full rounded-full bg-white transition-all"
                  style={{ width: `${enrolledPercent}%` }}
                />
              </div>
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-3">
            {enrolledPercent === null ? (
              <form
                action={async () => {
                  "use server";
                  await apiPost("/learn/enroll", { courseId: course.id });
                }}
              >
                <Button type="submit" variant="secondary" size="lg" className="bg-white text-primary hover:bg-white/90">
                  Enroll in course
                </Button>
              </form>
            ) : nextLesson ? (
              <Button variant="secondary" size="lg" className="bg-white text-primary hover:bg-white/90" asChild>
                <Link href={`/app/learn/${course.slug}/${nextLesson.slug}`}>
                  {completedLessons === 0 ? "Start learning" : "Continue"} <ChevronRight className="size-4" />
                </Link>
              </Button>
            ) : null}
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Lessons list */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="font-display text-xl font-bold">Lessons</h2>
          {course.lessons.length === 0 ? (
            <Card className="flex flex-col items-center gap-3 p-10 text-center">
              <BookOpen className="size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No lessons yet — check back soon.</p>
            </Card>
          ) : (
            <Card className="divide-y divide-border overflow-hidden p-0">
              {course.lessons.map((lesson, idx) => {
                const done = completedSet.has(lesson.id);
                const isAccessible = enrolledPercent !== null;

                const inner = (
                  <div className="flex items-center gap-4 p-4 sm:p-5">
                    <span className="shrink-0">
                      {done ? (
                        <CheckCircle2 className="size-5 text-success" />
                      ) : (
                        <Circle className="size-5 text-muted-foreground" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        <p
                          className={`truncate font-medium ${
                            done ? "text-muted-foreground line-through" : ""
                          }`}
                        >
                          {lesson.title}
                        </p>
                      </div>
                      {lesson.estMinutes > 0 && (
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="size-3" /> {lesson.estMinutes} min
                        </p>
                      )}
                    </div>
                    {isAccessible && (
                      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                    )}
                  </div>
                );

                return isAccessible ? (
                  <Link
                    key={lesson.id}
                    href={`/app/learn/${course.slug}/${lesson.slug}`}
                    className="block transition-colors hover:bg-muted/50"
                  >
                    {inner}
                  </Link>
                ) : (
                  <div key={lesson.id} className="opacity-60">
                    {inner}
                  </div>
                );
              })}
            </Card>
          )}
        </div>

        {/* Sidebar: tasks + summary */}
        <div className="space-y-4">
          {enrolledPercent !== null && (
            <Card className="p-5">
              <CardTitle className="text-base">Your progress</CardTitle>
              <div className="mt-3 space-y-3">
                <Progress value={enrolledPercent} className="h-2" />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Completed</span>
                  <span className="font-semibold">
                    {completedLessons} / {totalLessons}
                  </span>
                </div>
                {enrollment?.completedAt && (
                  <Badge variant="success" className="w-full justify-center">
                    Course complete!
                  </Badge>
                )}
              </div>
            </Card>
          )}

          {course.tasks.length > 0 && (
            <Card className="p-5">
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="size-4 text-primary" />
                Challenges
              </CardTitle>
              <Separator className="my-3" />
              <div className="space-y-2">
                {course.tasks.map((task) => (
                  <Link
                    key={task.id}
                    href={`/app/challenges/${task.slug}`}
                    className="group flex items-center justify-between rounded-lg border border-border p-3 transition-all hover:border-primary/40 hover:shadow-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium group-hover:text-primary">
                        {task.title}
                      </p>
                      <Badge
                        variant={
                          task.difficulty === "beginner"
                            ? "success"
                            : task.difficulty === "intermediate"
                              ? "warning"
                              : "destructive"
                        }
                        className="mt-1 capitalize"
                      >
                        {task.difficulty}
                      </Badge>
                    </div>
                    <span className="ml-2 shrink-0 text-xs font-semibold text-primary">
                      {task.points} pts
                    </span>
                  </Link>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
