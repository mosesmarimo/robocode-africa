import { notFound } from "next/navigation";
import { Star, CheckCircle, Clock } from "lucide-react";
import { getCurrentUser, getPageUser } from "@/lib/auth/current-user";
import { can } from "@/lib/domain/roles";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatCard } from "@/components/app/stat-card";
import { GradeDialog } from "@/components/teacher/teacher-buttons";
import { initials, formatRelative } from "@/lib/utils";

export const metadata = { title: "Grading" };

export default async function TeacherGradingPage() {
  const user = (await getPageUser());
  if (!can(user.role, "class.manage")) notFound();

  // Get all student IDs in this teacher's tenant
  const tenantStudents = await prisma.user.findMany({
    where: { tenantId: user.tenantId, role: "student", status: "active" },
    select: { id: true },
  });
  const studentIds = tenantStudents.map((s) => s.id);

  // All submissions pending review (submitted or passed), scoped to tenant students
  const [pendingSubmissions, gradedSubmissions] = await Promise.all([
    prisma.submission.findMany({
      where: {
        userId: { in: studentIds },
        status: { in: ["submitted", "passed"] },
      },
      include: {
        user: { select: { id: true, displayName: true, email: true } },
        task: { select: { id: true, title: true, difficulty: true, points: true } },
      },
      orderBy: { createdAt: "asc" },
      take: 50,
    }),
    prisma.submission.findMany({
      where: {
        userId: { in: studentIds },
        status: "graded",
      },
      include: {
        user: { select: { id: true, displayName: true, email: true } },
        task: { select: { id: true, title: true, difficulty: true, points: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  const difficultyVariant: Record<string, "success" | "warning" | "destructive"> = {
    beginner: "success",
    intermediate: "warning",
    advanced: "destructive",
  };

  const statusVariant: Record<string, "warning" | "success" | "secondary"> = {
    submitted: "warning",
    passed: "success",
    graded: "secondary",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold">Grading</h1>
        <p className="text-muted-foreground">Review and grade student submissions from your school.</p>
      </div>

      {/* Stats */}
      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Awaiting review" value={pendingSubmissions.length} icon="hourglass" tone="accent" hint="submitted or auto-passed" />
        <StatCard label="Recently graded" value={gradedSubmissions.length} icon="check-circle" tone="success" />
        <StatCard label="Students in school" value={studentIds.length} icon="users" tone="primary" />
      </section>

      {/* Pending */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          <Clock className="size-4" /> Awaiting Grading ({pendingSubmissions.length})
        </h2>

        {pendingSubmissions.length === 0 ? (
          <Card className="flex flex-col items-center justify-center gap-3 p-10 text-center">
            <span className="grid size-12 place-items-center rounded-2xl bg-success/10 text-success">
              <CheckCircle className="size-6" />
            </span>
            <p className="font-semibold">All caught up!</p>
            <p className="text-sm text-muted-foreground">No submissions awaiting review right now.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {pendingSubmissions.map((sub) => (
              <Card key={sub.id} className="p-4 transition-all hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex items-center gap-4">
                  <Avatar className="size-10 shrink-0">
                    <AvatarFallback>{initials(sub.user.displayName)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{sub.user.displayName}</span>
                      <Badge variant={statusVariant[sub.status] ?? "outline"} className="capitalize text-xs">
                        {sub.status}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">{sub.task.title}</span>
                      {" · "}
                      <Badge variant={difficultyVariant[sub.task.difficulty] ?? "outline"} className="text-xs capitalize">
                        {sub.task.difficulty}
                      </Badge>
                      {" · "}
                      {sub.task.points} pts max
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Submitted {formatRelative(sub.createdAt)}
                    </p>
                  </div>
                  <GradeDialog
                    submissionId={sub.id}
                    studentName={sub.user.displayName}
                    taskTitle={sub.task.title}
                    existingScore={sub.score}
                    existingFeedback={sub.feedback}
                  />
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Recently Graded */}
      {gradedSubmissions.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            <Star className="size-4" /> Recently Graded
          </h2>
          <div className="space-y-3">
            {gradedSubmissions.map((sub) => (
              <Card key={sub.id} className="p-4 opacity-80">
                <div className="flex items-center gap-4">
                  <Avatar className="size-10 shrink-0">
                    <AvatarFallback>{initials(sub.user.displayName)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{sub.user.displayName}</span>
                      <Badge variant="success" className="text-xs">graded</Badge>
                      {sub.score !== null && sub.score !== undefined && (
                        <Badge variant="secondary" className="font-mono text-xs">
                          {sub.score}/100
                        </Badge>
                      )}
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">{sub.task.title}</span>
                    </p>
                    {sub.feedback && (
                      <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">&ldquo;{sub.feedback}&rdquo;</p>
                    )}
                    <p className="mt-0.5 text-xs text-muted-foreground">{formatRelative(sub.createdAt)}</p>
                  </div>
                  <GradeDialog
                    submissionId={sub.id}
                    studentName={sub.user.displayName}
                    taskTitle={sub.task.title}
                    existingScore={sub.score}
                    existingFeedback={sub.feedback}
                  />
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
