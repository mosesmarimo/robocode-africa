import { notFound } from "next/navigation";
import Link from "next/link";
import { Activity, ArrowRight, ServerCrash, CheckCircle2 } from "lucide-react";
import { getCurrentUser, getPageUser } from "@/lib/auth/current-user";
import { can } from "@/lib/domain/roles";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatCard } from "@/components/app/stat-card";
import { Separator } from "@/components/ui/separator";
import { initials, formatRelative } from "@/lib/utils";
import { ROLE_LABELS, type Role } from "@/lib/domain/roles";

export const metadata = { title: "System — Admin" };

export default async function SystemPage() {
  const user = (await getPageUser());
  if (!can(user.role, "platform.manage")) notFound();

  const [
    totalSchools,
    activeSchools,
    totalStudents,
    totalTeachers,
    totalProjects,
    totalSimulations,
    totalCompetitions,
    pendingApprovals,
    openModCases,
    recentAuditLogs,
    recentUsers,
  ] = await Promise.all([
    prisma.tenant.count({ where: { isPlatform: false } }),
    prisma.tenant.count({ where: { isPlatform: false, status: "active" } }),
    prisma.user.count({ where: { role: "student", status: "active" } }),
    prisma.user.count({ where: { role: "teacher", status: "active" } }),
    prisma.project.count(),
    prisma.simulationRun.count(),
    prisma.competition.count(),
    prisma.approvalRequest.count({ where: { status: "pending" } }),
    prisma.moderationCase.count({ where: { status: "open" } }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 15,
      select: {
        id: true,
        action: true,
        targetType: true,
        targetId: true,
        createdAt: true,
        actor: { select: { displayName: true, role: true } },
      },
    }),
    prisma.user.findMany({
      where: { role: { notIn: ["super_admin", "moderator"] } },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        tenant: { select: { name: true } },
      },
    }),
  ]);

  const platformHealthy = openModCases === 0 && pendingApprovals < 20;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">System Dashboard</h1>
          <p className="text-muted-foreground">
            Platform-wide key performance indicators and activity log.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border px-4 py-1.5">
          {platformHealthy ? (
            <CheckCircle2 className="size-4 text-success" />
          ) : (
            <ServerCrash className="size-4 text-destructive" />
          )}
          <span className="text-sm font-medium">
            {platformHealthy ? "Platform healthy" : "Needs attention"}
          </span>
        </div>
      </div>

      {/* Primary KPIs */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Platform overview
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total schools" value={totalSchools} icon="building-2" tone="primary" hint={`${activeSchools} active`} />
          <StatCard label="Active students" value={totalStudents} icon="users" tone="secondary" />
          <StatCard label="Projects created" value={totalProjects} icon="cpu" tone="accent" />
          <StatCard label="Simulations run" value={totalSimulations} icon="play-circle" tone="success" />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Activity & moderation
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Active teachers" value={totalTeachers} icon="graduation-cap" tone="primary" />
          <StatCard label="Competitions" value={totalCompetitions} icon="trophy" tone="accent" />
          <StatCard label="Pending approvals" value={pendingApprovals} icon="user-check" tone={pendingApprovals > 10 ? "accent" : "success"} />
          <StatCard label="Open mod cases" value={openModCases} icon="shield-alert" tone={openModCases > 0 ? "accent" : "success"} />
        </div>
      </section>

      {/* Action links for quick navigation */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { label: "Review approvals", href: "/app/admin/approvals", badge: pendingApprovals > 0 ? String(pendingApprovals) : null, icon: "user-check" },
          { label: "Moderation queue", href: "/app/admin/moderation", badge: openModCases > 0 ? String(openModCases) : null, icon: "shield-alert" },
          { label: "Manage schools", href: "/app/admin/tenants", badge: null, icon: "building-2" },
          { label: "All users", href: "/app/admin/users", badge: null, icon: "users" },
          { label: "Content library", href: "/app/admin/content", badge: null, icon: "library" },
        ].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="group flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
          >
            <div className="flex items-center gap-3">
              <Activity className="size-5 text-primary" />
              <span className="font-medium group-hover:text-primary">{link.label}</span>
            </div>
            <div className="flex items-center gap-2">
              {link.badge && (
                <Badge variant="destructive">{link.badge}</Badge>
              )}
              <ArrowRight className="size-4 text-muted-foreground" />
            </div>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent audit log */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="size-5 text-primary" />
              Audit Log
            </CardTitle>
            <CardDescription>Recent platform-level actions</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {recentAuditLogs.length === 0 ? (
              <p className="p-5 text-sm text-muted-foreground">No audit events yet.</p>
            ) : (
              recentAuditLogs.map((log, idx) => (
                <div key={log.id}>
                  {idx > 0 && <Separator />}
                  <div className="flex items-start gap-3 p-4">
                    <div className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-muted">
                      <Activity className="size-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-mono text-xs font-medium text-foreground">
                        {log.action}
                      </p>
                      {log.targetType && (
                        <p className="text-xs text-muted-foreground">
                          {log.targetType} · {log.targetId?.slice(0, 8)}…
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        by {log.actor?.displayName ?? "System"} · {formatRelative(log.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Newest users */}
        <Card>
          <CardHeader>
            <CardTitle>New Users</CardTitle>
            <CardDescription>Most recently registered accounts</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {recentUsers.length === 0 ? (
              <p className="p-5 text-sm text-muted-foreground">No users yet.</p>
            ) : (
              recentUsers.map((u, idx) => (
                <div key={u.id}>
                  {idx > 0 && <Separator />}
                  <div className="flex items-center gap-3 p-4">
                    <Avatar className="size-9 shrink-0">
                      <AvatarFallback>{initials(u.displayName)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{u.displayName}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {u.tenant?.name ?? "—"} · {ROLE_LABELS[u.role as Role] ?? u.role}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <Badge
                        variant={
                          u.status === "active"
                            ? "success"
                            : u.status === "pending"
                              ? "warning"
                              : "destructive"
                        }
                        className="capitalize"
                      >
                        {u.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatRelative(u.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
