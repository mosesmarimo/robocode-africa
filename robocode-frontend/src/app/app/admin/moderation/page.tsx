import { notFound } from "next/navigation";
import { ShieldAlert, Clock, User } from "lucide-react";
import { getPageUser } from "@/lib/auth/current-user";
import { can } from "@/lib/domain/roles";
import { apiGet } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatCard } from "@/components/app/stat-card";
import { Separator } from "@/components/ui/separator";
import { initials, formatRelative } from "@/lib/utils";
import { ResolveModerationButton, DismissModerationButton } from "@/components/admin/admin-buttons";

export const metadata = { title: "Moderation — Admin" };

const statusVariant: Record<string, "warning" | "accent" | "success" | "muted"> = {
  open: "warning",
  reviewing: "accent",
  resolved: "success",
  dismissed: "muted",
};

interface ModerationCase {
  id: string;
  status: string;
  targetType: string;
  targetId: string;
  reason: string;
  notes: string | null;
  createdAt: string;
  reporter: { id: string; displayName: string } | null;
}

interface ModerationResponse {
  openCases: ModerationCase[];
  reviewingCases: ModerationCase[];
  resolvedCount: number;
  dismissedCount: number;
}

export default async function ModerationPage() {
  const user = (await getPageUser());
  if (!can(user.role, "platform.manage") && !can(user.role, "moderation.manage")) notFound();

  const { openCases, reviewingCases, resolvedCount, dismissedCount } =
    await apiGet<ModerationResponse>("/admin/moderation");

  const allActive = [...openCases, ...reviewingCases];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold">Moderation Queue</h1>
        <p className="text-muted-foreground">
          Review reported content and take action to keep the platform safe for students.
        </p>
      </div>

      {/* KPI strip */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Open cases" value={openCases.length} icon="shield-alert" tone="accent" />
        <StatCard label="Under review" value={reviewingCases.length} icon="eye" tone="primary" />
        <StatCard label="Resolved" value={resolvedCount} icon="check-circle" tone="success" />
        <StatCard label="Dismissed" value={dismissedCount} icon="x-circle" tone="secondary" />
      </div>

      {/* Active cases */}
      <Card>
        <CardHeader>
          <CardTitle>Active Cases</CardTitle>
          <CardDescription>
            {allActive.length} case{allActive.length !== 1 ? "s" : ""} requiring attention
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {allActive.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 p-12 text-center">
              <span className="grid size-14 place-items-center rounded-2xl bg-success/15 text-success">
                <ShieldAlert className="size-7" />
              </span>
              <p className="font-medium">No active moderation cases</p>
              <p className="text-sm text-muted-foreground">
                The platform is clean — all reports have been actioned.
              </p>
            </div>
          ) : (
            allActive.map((c, idx) => (
              <div key={c.id}>
                {idx > 0 && <Separator />}
                <div className="flex flex-wrap items-start justify-between gap-4 p-5">
                  {/* Case info */}
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-xl bg-destructive/12 text-destructive">
                      <ShieldAlert className="size-5" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={statusVariant[c.status] ?? "muted"} className="capitalize">
                          {c.status}
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                          {c.targetType}
                        </Badge>
                      </div>
                      <p className="mt-2 font-medium">{c.reason}</p>
                      {c.notes && (
                        <p className="mt-1 text-sm text-muted-foreground">{c.notes}</p>
                      )}
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        {c.reporter && (
                          <span className="flex items-center gap-1">
                            <User className="size-3" />
                            Reported by {c.reporter.displayName}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="size-3" />
                          {formatRelative(c.createdAt)}
                        </span>
                        <span className="font-mono text-xs text-muted-foreground/70">
                          Target: {c.targetId.slice(0, 8)}…
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 gap-2">
                    <ResolveModerationButton caseId={c.id} />
                    <DismissModerationButton caseId={c.id} />
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Recent reporter activity */}
      {allActive.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Reporters</CardTitle>
            <CardDescription>Users who filed reports in the active queue</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            {Array.from(
              new Map(
                allActive
                  .filter((c) => c.reporter)
                  .map((c) => [c.reporter!.id, c.reporter!]),
              ).values(),
            ).map((r) => (
              <div key={r.id} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
                <Avatar className="size-7">
                  <AvatarFallback className="text-xs">{initials(r.displayName)}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{r.displayName}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
