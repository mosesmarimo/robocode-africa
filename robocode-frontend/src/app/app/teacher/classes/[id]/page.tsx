import { notFound } from "next/navigation";
import Link from "next/link";
import { Users, ClipboardList, Key, CalendarDays, ArrowLeft } from "lucide-react";
import { getCurrentUser, getPageUser } from "@/lib/auth/current-user";
import { can } from "@/lib/domain/roles";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { AddStudentDialog, CreateAssignmentDialog } from "@/components/teacher/teacher-buttons";
import { initials, formatRelative } from "@/lib/utils";

export const metadata = { title: "Class Detail" };

export default async function ClassDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = (await getPageUser());
  if (!can(user.role, "class.manage")) notFound();

  const [cls, tasks] = await Promise.all([
    prisma.class.findFirst({
      where: { id, tenantId: user.tenantId, teacherId: user.id },
      include: {
        members: {
          include: { user: true },
          orderBy: { id: "asc" },
        },
        assignments: {
          include: { task: { select: { id: true, title: true, difficulty: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
    }),
    prisma.task.findMany({
      orderBy: { title: "asc" },
      select: { id: true, title: true, difficulty: true },
    }),
  ]);

  if (!cls) notFound();

  const difficultyVariant: Record<string, "success" | "warning" | "destructive"> = {
    beginner: "success",
    intermediate: "warning",
    advanced: "destructive",
  };

  return (
    <div className="space-y-6">
      {/* Back + header */}
      <div className="flex flex-wrap items-start gap-4">
        <Button variant="ghost" size="icon-sm" asChild aria-label="Back to classes">
          <Link href="/app/teacher/classes">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="font-display text-2xl font-bold">{cls.name}</h1>
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Key className="size-3.5" />
            Join code:{" "}
            <span className="font-mono font-semibold tracking-widest text-foreground">{cls.joinCode}</span>
          </p>
        </div>
        <AddStudentDialog classId={cls.id} />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Roster */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="size-5 text-primary" />
                Roster
                <Badge variant="secondary">{cls.members.length}</Badge>
              </CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="p-0">
              {cls.members.length === 0 ? (
                <div className="flex flex-col items-center gap-2 p-8 text-center">
                  <Users className="size-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">No students yet. Add one above or share the join code.</p>
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {cls.members.map((m) => (
                    <li key={m.id} className="flex items-center gap-3 px-5 py-3">
                      <Avatar className="size-9">
                        <AvatarFallback>{initials(m.user.displayName)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-sm">{m.user.displayName}</p>
                        <p className="truncate text-xs text-muted-foreground">{m.user.email}</p>
                      </div>
                      <Badge variant="muted" className="capitalize text-xs">{m.role}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Assignments */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold flex items-center gap-2">
              <ClipboardList className="size-5 text-primary" />
              Assignments
            </h2>
            <CreateAssignmentDialog
              classes={[{ id: cls.id, name: cls.name }]}
              tasks={tasks}
              defaultClassId={cls.id}
            />
          </div>

          {cls.assignments.length === 0 ? (
            <Card className="flex flex-col items-center gap-3 p-10 text-center">
              <ClipboardList className="size-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No assignments yet. Create the first one!</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {cls.assignments.map((a) => (
                <Card key={a.id} className="p-4 transition-all hover:-translate-y-0.5 hover:shadow-md">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{a.title}</p>
                      {a.task && (
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          Task:{" "}
                          <span className="font-medium text-foreground">{a.task.title}</span>{" "}
                          <Badge variant={difficultyVariant[a.task.difficulty] ?? "outline"} className="text-xs capitalize ml-1">
                            {a.task.difficulty}
                          </Badge>
                        </p>
                      )}
                      {a.instructions && (
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{a.instructions}</p>
                      )}
                    </div>
                    {a.dueAt && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                        <CalendarDays className="size-3.5" />
                        {new Date(a.dueAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Created {formatRelative(a.createdAt)}
                  </p>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
