import Link from "next/link";
import { Users, Key, ArrowRight, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/app/stat-card";
import { CreateClassDialog } from "@/components/teacher/teacher-buttons";
import { formatRelative } from "@/lib/utils";
import { apiGet } from "@/lib/api/client";

export const metadata = { title: "My Classes" };

interface ClassListItem {
  id: string;
  name: string;
  joinCode: string;
  createdAt: string;
  _count: { members: number; assignments: number };
}

interface ClassesResponse {
  classes: ClassListItem[];
  totalStudents: number;
  totalAssignments: number;
}

export default async function TeacherClassesPage() {
  const { classes, totalStudents, totalAssignments } = await apiGet<ClassesResponse>("/teacher/classes");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">My Classes</h1>
          <p className="text-muted-foreground">Manage your classes, rosters, and assignments.</p>
        </div>
        <CreateClassDialog />
      </div>

      {/* Stats */}
      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Classes" value={classes.length} icon="layout-list" tone="primary" />
        <StatCard label="Students enrolled" value={totalStudents} icon="users" tone="secondary" />
        <StatCard label="Assignments" value={totalAssignments} icon="clipboard-list" tone="accent" />
      </section>

      {/* Classes Grid */}
      {classes.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-4 p-12 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
            <BookOpen className="size-7" />
          </span>
          <div>
            <p className="font-semibold">No classes yet</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Create your first class to start adding students and assigning tasks.
            </p>
          </div>
          <CreateClassDialog />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((cls) => (
            <Link key={cls.id} href={`/app/teacher/classes/${cls.id}`}>
              <Card className="group h-full p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg">
                <div className="flex items-start justify-between gap-3">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-gradient text-white">
                    <BookOpen className="size-5" />
                  </span>
                  <Badge variant="outline" className="gap-1 font-mono text-xs">
                    <Key className="size-3" /> {cls.joinCode}
                  </Badge>
                </div>
                <p className="mt-3 font-semibold group-hover:text-primary">{cls.name}</p>
                <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="size-3.5" /> {cls._count.members} students
                  </span>
                  <span>{cls._count.assignments} assignments</span>
                </div>
                <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                  Created {formatRelative(cls.createdAt)}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">View roster</span>
                  <ArrowRight className="size-4 opacity-0 transition-opacity group-hover:opacity-100 text-primary" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Quick nav to assignments */}
      {classes.length > 0 && (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/app/teacher/assignments">
              View all assignments <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
