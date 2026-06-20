import { notFound } from "next/navigation";
import { UserCheck, Clock, Users } from "lucide-react";
import { getCurrentUser, getPageUser } from "@/lib/auth/current-user";
import { can } from "@/lib/domain/roles";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatCard } from "@/components/app/stat-card";
import { ApproveRejectButtons } from "@/components/school/school-buttons";
import { initials, formatRelative } from "@/lib/utils";

export const metadata = { title: "Student Approvals" };

export default async function ApprovalsPage() {
  const user = (await getPageUser());
  if (!can(user.role, "tenant.manage")) notFound();

  const [pendingUsers, totalStudents, approvedToday] = await Promise.all([
    prisma.user.findMany({
      where: { tenantId: user.tenantId, status: "pending", role: "student" },
      orderBy: { createdAt: "asc" },
      include: { approvalRequest: true },
    }),
    prisma.user.count({ where: { tenantId: user.tenantId, role: "student", status: "active" } }),
    prisma.approvalRequest.count({
      where: {
        tenantId: user.tenantId,
        status: "approved",
        decidedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="font-display text-3xl font-bold">Student Approvals</h1>
        <p className="text-muted-foreground">
          Review and approve student registration requests for {user.tenant?.name}.
        </p>
      </div>

      {/* Summary stats */}
      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Awaiting approval"
          value={pendingUsers.length}
          icon="user-check"
          tone="accent"
          hint="Pending review"
        />
        <StatCard label="Active students" value={totalStudents} icon="users" tone="primary" />
        <StatCard label="Approved today" value={approvedToday} icon="check-check" tone="success" />
      </section>

      {/* Pending list */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="size-5 text-amber-500" />
            Pending requests
          </CardTitle>
          <CardDescription>
            These students have registered and are waiting for your approval before they can access
            the platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <span className="grid size-14 place-items-center rounded-2xl bg-success/12 text-success">
                <UserCheck className="size-7" />
              </span>
              <p className="font-medium">All caught up!</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                There are no pending registration requests right now. New ones will appear here
                automatically.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {pendingUsers.map((u) => (
                <div
                  key={u.id}
                  className="flex flex-wrap items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="size-10">
                      <AvatarFallback>{initials(u.displayName)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{u.displayName}</p>
                      <p className="text-sm text-muted-foreground">{u.email}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        {u.isMinor && (
                          <Badge variant="warning" className="text-xs">
                            Minor
                          </Badge>
                        )}
                        {u.guardianEmail && (
                          <Badge variant="outline" className="text-xs">
                            Guardian: {u.guardianEmail}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          Registered {formatRelative(u.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <ApproveRejectButtons userId={u.id} name={u.displayName} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info callout */}
      {pendingUsers.length > 0 && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/20">
          <CardContent className="flex items-start gap-3 pt-5">
            <Users className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Approved students are immediately notified by email and can log in right away. Rejected
              requests also notify the student. You can manage approved students from the{" "}
              <span className="font-medium">Members</span> page.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
