import Link from "next/link";
import { ClipboardList, CalendarDays, BookOpen, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/app/stat-card";
import { CreateAssignmentDialog } from "@/components/teacher/teacher-buttons";
import { formatRelative } from "@/lib/utils";
import { apiGet } from "@/lib/api/client";

export const metadata = { title: "Assignments" };

interface ClassOption {
  id: string;
  name: string;
}

interface TaskOption {
  id: string;
  title: string;
  difficulty: string;
}

interface AssignmentItem {
  id: string;
  title: string;
  classId: string;
  instructions: string | null;
  taskId: string | null;
  dueAt: string | null;
  createdAt: string;
  class: ClassOption;
  task: TaskOption | null;
}

interface AssignmentsResponse {
  classes: ClassOption[];
  assignments: AssignmentItem[];
  tasks: TaskOption[];
  upcomingCount: number;
  withTaskCount: number;
}

export default async function TeacherAssignmentsPage() {
  const { classes, assignments, tasks, upcomingCount, withTaskCount } =
    await apiGet<AssignmentsResponse>("/teacher/assignments");

  const difficultyVariant: Record<string, "success" | "warning" | "destructive"> = {
    beginner: "success",
    intermediate: "warning",
    advanced: "destructive",
  };

  // Group by class for display
  const byClass = classes.map((cls) => ({
    cls,
    items: assignments.filter((a) => a.classId === cls.id),
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Assignments</h1>
          <p className="text-muted-foreground">Track assignments across all your classes.</p>
        </div>
        <CreateAssignmentDialog classes={classes} tasks={tasks} />
      </div>

      {/* Stats */}
      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total assignments" value={assignments.length} icon="clipboard-list" tone="primary" />
        <StatCard label="Upcoming (due)" value={upcomingCount} icon="calendar-days" tone="accent" />
        <StatCard label="With graded task" value={withTaskCount} icon="check-circle" tone="success" />
      </section>

      {/* Content */}
      {assignments.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-4 p-12 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
            <ClipboardList className="size-7" />
          </span>
          <div>
            <p className="font-semibold">No assignments yet</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Create an assignment to give your students tasks and challenges.
            </p>
          </div>
          {classes.length > 0 ? (
            <CreateAssignmentDialog classes={classes} tasks={tasks} />
          ) : (
            <Button variant="gradient" asChild>
              <Link href="/app/teacher/classes">Create a class first</Link>
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-8">
          {byClass
            .filter((g) => g.items.length > 0)
            .map(({ cls, items }) => (
              <section key={cls.id}>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    <BookOpen className="size-4" /> {cls.name}
                    <Badge variant="secondary">{items.length}</Badge>
                  </h2>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/app/teacher/classes/${cls.id}`}>
                      View class <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                </div>

                <div className="space-y-3">
                  {items.map((a) => (
                    <Card key={a.id} className="p-4 transition-all hover:-translate-y-0.5 hover:shadow-md">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold">{a.title}</p>
                          {a.task && (
                            <p className="mt-0.5 text-sm text-muted-foreground">
                              Task:{" "}
                              <span className="font-medium text-foreground">{a.task.title}</span>{" "}
                              <Badge
                                variant={difficultyVariant[a.task.difficulty] ?? "outline"}
                                className="ml-1 text-xs capitalize"
                              >
                                {a.task.difficulty}
                              </Badge>
                            </p>
                          )}
                          {a.instructions && (
                            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{a.instructions}</p>
                          )}
                        </div>
                        {a.dueAt && (
                          <div className="flex shrink-0 items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs text-muted-foreground">
                            <CalendarDays className="size-3.5" />
                            Due {new Date(a.dueAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">Created {formatRelative(a.createdAt)}</p>
                    </Card>
                  ))}
                </div>
              </section>
            ))}
        </div>
      )}
    </div>
  );
}
