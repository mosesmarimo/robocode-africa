import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { getCurrentUser, getPageUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/domain/roles";
import { levelProgress } from "@/lib/domain/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { StatCard } from "@/components/app/stat-card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Icon } from "@/components/icon";
import { initials } from "@/lib/utils";

export default async function DashboardPage() {
  const user = (await getPageUser());
  const firstName = user.displayName.split(" ")[0];

  if (user.role === "student") return <StudentDashboard user={user} firstName={firstName} />;
  return <StaffDashboard user={user} firstName={firstName} />;
}

async function StudentDashboard({
  user,
  firstName,
}: {
  user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;
  firstName: string;
}) {
  const [projects, badgeCount, enrollments, leaders] = await Promise.all([
    prisma.project.findMany({ where: { ownerId: user.id }, orderBy: { updatedAt: "desc" }, take: 4 }),
    prisma.userBadge.count({ where: { userId: user.id } }),
    prisma.enrollment.findMany({ where: { userId: user.id }, include: { course: true }, take: 3 }),
    prisma.user.findMany({
      where: { tenantId: user.tenantId, role: "student", status: "active" },
      orderBy: { roboPoints: "desc" },
      take: 5,
      select: { id: true, displayName: true, roboPoints: true },
    }),
  ]);
  const { level, into, span, pct } = levelProgress(user.roboPoints);
  const rank = leaders.findIndex((l) => l.id === user.id) + 1;

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl bg-brand-gradient p-6 text-white sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-10 size-48 rounded-full bg-white/10 blur-2xl" />
        <div className="relative z-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-white/80">Welcome back,</p>
            <h1 className="font-display text-3xl font-bold sm:text-4xl">{firstName} 👋</h1>
            <p className="mt-2 max-w-md text-white/85">Ready to build something amazing today? Pick up where you left off or start a fresh circuit.</p>
          </div>
          <Button variant="secondary" size="lg" asChild className="bg-white text-primary hover:bg-white/90">
            <Link href="/app/projects"><Plus className="size-4" /> New Project</Link>
          </Button>
        </div>
        <div className="relative z-10 mt-6 max-w-md">
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="font-medium">Level {level}</span>
            <span className="text-white/80">{into}/{span} XP</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/25">
            <div className="h-full rounded-full bg-white" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="RoboPoints" value={user.roboPoints.toLocaleString()} icon="zap" tone="accent" />
        <StatCard label="Level" value={level} icon="sparkles" tone="primary" />
        <StatCard label="Badges earned" value={badgeCount} icon="award" tone="secondary" />
        <StatCard label="Class rank" value={rank > 0 ? `#${rank}` : "—"} icon="trophy" tone="success" />
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Recent projects</CardTitle>
            <Button variant="ghost" size="sm" asChild><Link href="/app/projects">View all <ArrowRight className="size-4" /></Link></Button>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {projects.length === 0 && (
              <p className="text-sm text-muted-foreground">No projects yet — create your first one!</p>
            )}
            {projects.map((p) => (
              <Link
                key={p.id}
                href={`/studio/${p.id}`}
                className="group rounded-xl border border-border p-4 transition-all hover:border-primary/40 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <p className="font-medium group-hover:text-primary">{p.title}</p>
                  <Badge variant="muted">{p.boardType}</Badge>
                </div>
                <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{p.description ?? "Untitled circuit"}</p>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Leaderboard</CardTitle>
            <Button variant="ghost" size="sm" asChild><Link href="/app/leaderboard">Full <ArrowRight className="size-4" /></Link></Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {leaders.map((l, i) => (
              <div key={l.id} className="flex items-center gap-3">
                <span className="w-5 text-center text-sm font-bold text-muted-foreground">{i + 1}</span>
                <Avatar className="size-8"><AvatarFallback>{initials(l.displayName)}</AvatarFallback></Avatar>
                <span className="flex-1 truncate text-sm font-medium">{l.displayName}</span>
                <span className="text-sm font-semibold text-primary">{l.roboPoints}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Continue learning</CardTitle>
          <Button variant="ghost" size="sm" asChild><Link href="/app/learn">Browse courses <ArrowRight className="size-4" /></Link></Button>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          {enrollments.map((e) => {
            const percent = (e.progress as { percent?: number })?.percent ?? 0;
            return (
              <Link key={e.id} href="/app/learn" className="rounded-xl border border-border p-4 transition-all hover:shadow-md">
                <Badge variant="secondary" className="capitalize">{e.course.track}</Badge>
                <p className="mt-2 font-medium">{e.course.title}</p>
                <Progress value={percent} className="mt-3 h-1.5" />
                <p className="mt-1.5 text-xs text-muted-foreground">{percent}% complete</p>
              </Link>
            );
          })}
          {enrollments.length === 0 && <p className="text-sm text-muted-foreground">Enroll in a course to get started.</p>}
        </CardContent>
      </Card>
    </div>
  );
}

async function StaffDashboard({
  user,
  firstName,
}: {
  user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;
  firstName: string;
}) {
  const platform = user.role === "super_admin" || user.role === "moderator";
  const approvalWhere = platform ? { status: "pending" } : { tenantId: user.tenantId, status: "pending" };
  const memberWhere = platform ? {} : { tenantId: user.tenantId };

  const [pending, members, projects, competitions] = await Promise.all([
    prisma.approvalRequest.count({ where: approvalWhere }),
    prisma.user.count({ where: { ...memberWhere, role: "student" } }),
    prisma.project.count({ where: platform ? {} : { tenantId: user.tenantId } }),
    prisma.competition.count(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Welcome, {firstName}</h1>
          <p className="text-muted-foreground">Here&apos;s what&apos;s happening across {platform ? "the platform" : user.tenant?.name}.</p>
        </div>
        {can(user.role, "tenant.approve_students") || can(user.role, "platform.approve_direct") ? (
          <Button asChild><Link href={platform ? "/app/admin/approvals" : "/app/school/approvals"}>Review approvals</Link></Button>
        ) : null}
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Pending approvals" value={pending} icon="user-check" tone="accent" hint="Awaiting review" />
        <StatCard label="Students" value={members} icon="users" tone="primary" />
        <StatCard label="Projects" value={projects} icon="cpu" tone="secondary" />
        <StatCard label="Competitions" value={competitions} icon="trophy" tone="success" />
      </section>

      <Card>
        <CardHeader><CardTitle>Quick actions</CardTitle></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { label: "Review approvals", href: platform ? "/app/admin/approvals" : "/app/school/approvals", icon: "user-check" },
            { label: "Manage members", href: platform ? "/app/admin/users" : "/app/school/members", icon: "users" },
            { label: "Competitions", href: "/app/competitions", icon: "trophy" },
            { label: "Content library", href: "/app/learn", icon: "library" },
            ...(platform ? [{ label: "Schools", href: "/app/admin/tenants", icon: "building-2" }] : [{ label: "Branding", href: "/app/school/branding", icon: "palette" }]),
            { label: "Open Studio", href: "/app/projects", icon: "cpu" },
          ].map((a) => (
            <Button key={a.href} variant="outline" className="h-auto justify-start gap-3 p-4" asChild>
              <Link href={a.href}>
                <span className="grid size-9 place-items-center rounded-lg bg-primary/12 text-primary [&_svg]:size-5">
                  <Icon name={a.icon} />
                </span>
                {a.label}
              </Link>
            </Button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
