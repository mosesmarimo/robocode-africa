import Link from "next/link";
import { ArrowRight, Cpu, Trophy, Award, CheckCircle2 } from "lucide-react";
import { getPageUser } from "@/lib/auth/current-user";
import { apiGet } from "@/lib/api/client";
import { ROLE_LABELS, type Role } from "@/lib/domain/roles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { StatCard } from "@/components/app/stat-card";
import { initials, formatRelative } from "@/lib/utils";

export const metadata = { title: "My Profile" };

interface UserBadgeItem {
  id: string;
  awardedAt: string;
  badge: { name: string; description: string };
}

interface ProjectItem {
  id: string;
  title: string;
  description: string | null;
  boardType: string;
  updatedAt: string;
}

interface ProfileData {
  user: {
    displayName: string;
    role: string;
    roboPoints: number;
  };
  schoolName: string | null;
  badges: UserBadgeItem[];
  projects: ProjectItem[];
  passedCount: number;
  progress: { level: number; into: number; span: number; pct: number };
}

export default async function ProfilePage() {
  await getPageUser();

  const { user, schoolName, badges: userBadges, projects, passedCount, progress } =
    await apiGet<ProfileData>("/account/profile");

  const { level, into, span, pct } = progress;

  return (
    <div className="space-y-6">
      {/* Hero banner */}
      <section className="relative overflow-hidden rounded-2xl bg-brand-gradient p-6 text-white sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-12 size-56 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-8 -left-8 size-40 rounded-full bg-white/8 blur-2xl" />
        <div className="relative z-10 flex flex-wrap items-end gap-6">
          <Avatar className="size-20 border-4 border-white/30 text-2xl">
            <AvatarFallback className="text-xl font-bold">{initials(user.displayName)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h1 className="font-display text-3xl font-bold sm:text-4xl">{user.displayName}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white/20 px-3 py-0.5 text-sm font-medium">
                {ROLE_LABELS[user.role as Role] ?? user.role}
              </span>
              {schoolName && (
                <span className="rounded-full bg-white/15 px-3 py-0.5 text-sm">{schoolName}</span>
              )}
            </div>
            <div className="mt-4 max-w-sm">
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="font-semibold">Level {level}</span>
                <span className="text-white/80">{into.toLocaleString()} / {span.toLocaleString()} XP</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/25">
                <div className="h-full rounded-full bg-white transition-all" style={{ width: `${pct}%` }} />
              </div>
            </div>
          </div>
          <Button variant="secondary" size="sm" asChild className="bg-white/20 text-white hover:bg-white/30 border-white/20 border">
            <Link href="/app/settings">Edit profile</Link>
          </Button>
        </div>
      </section>

      {/* Stats row */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="RoboPoints" value={user.roboPoints.toLocaleString()} icon="zap" tone="accent" />
        <StatCard label="Level" value={level} icon="sparkles" tone="primary" />
        <StatCard label="Projects" value={projects.length} icon="cpu" tone="secondary" />
        <StatCard label="Tasks passed" value={passedCount} icon="check-check" tone="success" />
      </section>

      {/* Badges */}
      <Card>
        <CardHeader className="flex-row items-center justify-between pb-2">
          <CardTitle className="flex items-center gap-2">
            <Award className="size-5 text-primary" /> Earned badges
          </CardTitle>
          <Badge variant="muted">{userBadges.length} total</Badge>
        </CardHeader>
        <CardContent>
          {userBadges.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <span className="grid size-14 place-items-center rounded-2xl bg-muted">
                <Trophy className="size-7 text-muted-foreground" />
              </span>
              <p className="font-medium text-muted-foreground">No badges yet</p>
              <p className="text-sm text-muted-foreground/70">Complete tasks and courses to earn your first badge.</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              {userBadges.map((ub) => (
                <div
                  key={ub.id}
                  title={`${ub.badge.name} — ${ub.badge.description}\nEarned ${formatRelative(new Date(ub.awardedAt))}`}
                  className="group flex flex-col items-center gap-1.5 rounded-xl border border-border bg-muted/40 px-4 py-3 text-center transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                >
                  <span className="grid size-10 place-items-center rounded-full bg-primary/12 text-primary">
                    <Award className="size-5" />
                  </span>
                  <span className="text-xs font-semibold leading-tight">{ub.badge.name}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent projects */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Cpu className="size-5 text-primary" /> Recent projects
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/app/projects">
              View all <ArrowRight className="size-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <span className="grid size-14 place-items-center rounded-2xl bg-muted">
                <Cpu className="size-7 text-muted-foreground" />
              </span>
              <p className="font-medium text-muted-foreground">No projects yet</p>
              <Button variant="gradient" size="sm" asChild>
                <Link href="/app/projects">Start building</Link>
              </Button>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((p) => (
                <Link
                  key={p.id}
                  href={`/studio/${p.id}`}
                  className="group rounded-xl border border-border p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium leading-snug group-hover:text-primary">{p.title}</p>
                    <Badge variant="muted" className="shrink-0">{p.boardType}</Badge>
                  </div>
                  {p.description && (
                    <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{p.description}</p>
                  )}
                  <p className="mt-3 text-xs text-muted-foreground/70">{formatRelative(new Date(p.updatedAt))}</p>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Progress toward next level */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="size-5 text-primary" /> Level progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold">Level {level}</span>
            <span className="text-muted-foreground">
              {into.toLocaleString()} / {span.toLocaleString()} XP to Level {level + 1}
            </span>
          </div>
          <Progress value={pct} className="h-3" />
          <p className="text-xs text-muted-foreground">
            {span - into} XP remaining until you reach Level {level + 1}. Keep completing tasks and lessons!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
