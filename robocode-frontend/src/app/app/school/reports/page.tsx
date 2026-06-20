import { BarChart3, TrendingUp } from "lucide-react";
import { getPageUser } from "@/lib/auth/current-user";
import { apiGet } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { StatCard } from "@/components/app/stat-card";
import { initials } from "@/lib/utils";

export const metadata = { title: "School Reports" };

interface TopStudent {
  id: string;
  displayName: string;
  roboPoints: number;
  level: number;
}

interface ReportsData {
  activeStudents: number;
  projectsCreated: number;
  lessonsCompleted: number;
  totalSubmissions: number;
  passedSubmissions: number;
  passRate: number;
  topStudents: TopStudent[];
  byTrack: Record<string, number>;
  totalEnrollments: number;
}

export default async function ReportsPage() {
  const user = (await getPageUser());

  const {
    activeStudents,
    projectsCreated,
    lessonsCompleted,
    totalSubmissions,
    passedSubmissions,
    passRate,
    topStudents,
    byTrack,
    totalEnrollments,
  } = await apiGet<ReportsData>("/school/reports");

  const TRACK_COLOR: Record<string, string> = {
    robotics: "bg-primary",
    coding: "bg-secondary",
    ai: "bg-accent",
    other: "bg-muted-foreground",
  };

  const TRACK_LABEL: Record<string, string> = {
    robotics: "Robotics",
    coding: "Coding",
    ai: "AI",
    other: "Other",
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">School Reports</h1>
          <p className="text-muted-foreground">
            Analytics overview for {user.tenant?.name} — all time.
          </p>
        </div>
        <span className="grid size-12 place-items-center rounded-xl bg-primary/12 text-primary">
          <BarChart3 className="size-6" />
        </span>
      </div>

      {/* Key stats */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active students" value={activeStudents} icon="users" tone="primary" />
        <StatCard label="Projects created" value={projectsCreated} icon="cpu" tone="secondary" />
        <StatCard
          label="Lessons completed"
          value={lessonsCompleted}
          icon="check-check"
          tone="success"
        />
        <StatCard
          label="Challenge pass rate"
          value={`${passRate}%`}
          icon="target"
          tone="accent"
          hint={`${passedSubmissions} / ${totalSubmissions} submissions`}
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top students */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="size-5 text-primary" />
              Top students
            </CardTitle>
            <CardDescription>Ranked by RoboPoints earned — all time.</CardDescription>
          </CardHeader>
          <CardContent>
            {topStudents.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No active students yet.
              </p>
            ) : (
              <div className="space-y-3">
                {topStudents.map((s, i) => {
                  const maxPts = topStudents[0]?.roboPoints ?? 1;
                  const pct = maxPts > 0 ? Math.round((s.roboPoints / maxPts) * 100) : 0;
                  return (
                    <div key={s.id} className="flex items-center gap-3">
                      <span
                        className={`w-6 text-center text-sm font-bold ${
                          i === 0
                            ? "text-amber-500"
                            : i === 1
                            ? "text-slate-400"
                            : i === 2
                            ? "text-amber-700"
                            : "text-muted-foreground"
                        }`}
                      >
                        {i + 1}
                      </span>
                      <Avatar className="size-8">
                        <AvatarFallback>{initials(s.displayName)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-medium">{s.displayName}</span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <Badge variant="outline" className="text-xs">
                              Lv {s.level}
                            </Badge>
                            <span className="text-sm font-semibold text-primary">
                              {s.roboPoints.toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <Progress value={pct} className="mt-1.5 h-1" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Enrolment by track */}
        <Card>
          <CardHeader>
            <CardTitle>Enrolments by track</CardTitle>
            <CardDescription>
              How many enrolments across each learning track at your school.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {totalEnrollments === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No course enrolments yet.
              </p>
            ) : (
              <div className="space-y-4">
                {Object.entries(byTrack)
                  .sort((a, b) => b[1] - a[1])
                  .map(([track, count]) => {
                    const pct = Math.round((count / totalEnrollments) * 100);
                    return (
                      <div key={track}>
                        <div className="mb-1 flex items-center justify-between text-sm">
                          <span className="font-medium">{TRACK_LABEL[track] ?? track}</span>
                          <span className="text-muted-foreground">
                            {count} ({pct}%)
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                          <div
                            className={`h-full rounded-full transition-all ${TRACK_COLOR[track] ?? "bg-muted-foreground"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                <p className="pt-1 text-xs text-muted-foreground">
                  {totalEnrollments} total enrolment{totalEnrollments !== 1 ? "s" : ""}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity summary */}
      <Card>
        <CardHeader>
          <CardTitle>Activity summary</CardTitle>
          <CardDescription>Quick snapshot of key engagement metrics.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <MetricTile
              label="Avg points per active student"
              value={
                activeStudents > 0
                  ? Math.round(
                      topStudents.reduce((a, s) => a + s.roboPoints, 0) / activeStudents
                    ).toLocaleString()
                  : "—"
              }
            />
            <MetricTile
              label="Lessons per student"
              value={
                activeStudents > 0
                  ? (lessonsCompleted / activeStudents).toFixed(1)
                  : "—"
              }
            />
            <MetricTile
              label="Projects per student"
              value={
                activeStudents > 0
                  ? (projectsCreated / activeStudents).toFixed(1)
                  : "—"
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MetricTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-muted p-4 text-center">
      <p className="font-display text-2xl font-bold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
