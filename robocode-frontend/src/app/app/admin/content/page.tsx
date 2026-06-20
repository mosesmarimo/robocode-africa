import { notFound } from "next/navigation";
import { BookOpen, ListChecks, ArrowRight } from "lucide-react";
import { getPageUser } from "@/lib/auth/current-user";
import { can } from "@/lib/domain/roles";
import { apiGet } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/app/stat-card";
import { Separator } from "@/components/ui/separator";
import { TRACK_LABELS, LEVEL_LABELS, type Track, type Level } from "@/lib/domain/constants";

export const metadata = { title: "Content — Admin" };

const difficultyVariant: Record<string, "success" | "warning" | "destructive"> = {
  beginner: "success",
  intermediate: "warning",
  advanced: "destructive",
};

interface AdminCourse {
  id: string;
  title: string;
  track: string;
  level: string;
  published: boolean;
  _count: { lessons: number; enrollments: number };
}

interface AdminTask {
  id: string;
  title: string;
  track: string;
  difficulty: string;
  points: number;
  _count: { submissions: number };
}

interface ContentResponse {
  courses: AdminCourse[];
  tasks: AdminTask[];
  totalLessons: number;
  totalEnrollments: number;
  totalSubmissions: number;
}

export default async function ContentPage() {
  const user = (await getPageUser());
  if (!can(user.role, "platform.manage")) notFound();

  const { courses, tasks, totalLessons, totalEnrollments, totalSubmissions } =
    await apiGet<ContentResponse>("/admin/content");

  const publishedCourses = courses.filter((c) => c.published).length;
  const draftCourses = courses.length - publishedCourses;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold">Content Library</h1>
        <p className="text-muted-foreground">
          Overview of all courses, lessons, and tasks across the platform.
        </p>
      </div>

      {/* KPI strip */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Courses" value={courses.length} icon="library" tone="primary" />
        <StatCard label="Lessons" value={totalLessons} icon="book-open" tone="secondary" />
        <StatCard label="Challenges" value={tasks.length} icon="list-checks" tone="accent" />
        <StatCard label="Enrollments" value={totalEnrollments} icon="users" tone="success" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Courses */}
        <Card className="flex flex-col">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="size-5 text-primary" />
                Courses
              </CardTitle>
              <CardDescription>
                {publishedCourses} published · {draftCourses} draft
              </CardDescription>
            </div>
            <Badge variant="default">{courses.length} total</Badge>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            {courses.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 p-10 text-center">
                <span className="grid size-12 place-items-center rounded-xl bg-primary/10 text-primary">
                  <BookOpen className="size-6" />
                </span>
                <p className="text-sm text-muted-foreground">No courses created yet.</p>
              </div>
            ) : (
              courses.map((course, idx) => (
                <div key={course.id}>
                  {idx > 0 && <Separator />}
                  <div className="flex items-center justify-between gap-3 p-4 hover:bg-muted/40 transition-colors">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{course.title}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <Badge variant="secondary" className="capitalize">
                          {TRACK_LABELS[course.track as Track] ?? course.track}
                        </Badge>
                        <Badge variant="muted" className="capitalize">
                          {LEVEL_LABELS[course.level as Level] ?? course.level}
                        </Badge>
                        {course.published ? (
                          <Badge variant="success">Published</Badge>
                        ) : (
                          <Badge variant="outline">Draft</Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {course._count.lessons} lesson{course._count.lessons !== 1 ? "s" : ""}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {course._count.enrollments} enrolled
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Tasks / Challenges */}
        <Card className="flex flex-col">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ListChecks className="size-5 text-primary" />
                Challenges
              </CardTitle>
              <CardDescription>
                {totalSubmissions} total submissions
              </CardDescription>
            </div>
            <Badge variant="default">{tasks.length} total</Badge>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            {tasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 p-10 text-center">
                <span className="grid size-12 place-items-center rounded-xl bg-accent/18 text-accent-foreground">
                  <ListChecks className="size-6" />
                </span>
                <p className="text-sm text-muted-foreground">No challenges created yet.</p>
              </div>
            ) : (
              tasks.map((task, idx) => (
                <div key={task.id}>
                  {idx > 0 && <Separator />}
                  <div className="flex items-center justify-between gap-3 p-4 hover:bg-muted/40 transition-colors">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{task.title}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <Badge variant="secondary" className="capitalize">
                          {TRACK_LABELS[task.track as Track] ?? task.track}
                        </Badge>
                        <Badge
                          variant={difficultyVariant[task.difficulty] ?? "muted"}
                          className="capitalize"
                        >
                          {task.difficulty}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {task.points} pts
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {task._count.submissions} submission{task._count.submissions !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Track breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Track Breakdown</CardTitle>
          <CardDescription>Courses and tasks distributed across learning tracks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            {(["robotics", "coding", "ai"] as Track[]).map((track) => {
              const trackCourses = courses.filter((c) => c.track === track);
              const trackTasks = tasks.filter((t) => t.track === track);
              return (
                <div key={track} className="rounded-xl border border-border p-4">
                  <Badge variant="secondary" className="capitalize mb-3">
                    {TRACK_LABELS[track]}
                  </Badge>
                  <p className="text-2xl font-bold font-display">{trackCourses.length}</p>
                  <p className="text-sm text-muted-foreground">courses</p>
                  <p className="mt-2 text-lg font-semibold">{trackTasks.length}</p>
                  <p className="text-sm text-muted-foreground">challenges</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
