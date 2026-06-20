import { Users, GraduationCap, UserCheck } from "lucide-react";
import { getPageUser } from "@/lib/auth/current-user";
import { ROLE_LABELS } from "@/lib/domain/roles";
import { apiGet } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { StatCard } from "@/components/app/stat-card";
import { SuspendReinstateButton } from "@/components/school/school-buttons";
import { initials, formatRelative } from "@/lib/utils";

export const metadata = { title: "School Members" };

const STATUS_BADGE: Record<string, "success" | "warning" | "destructive" | "muted"> = {
  active: "success",
  pending: "warning",
  suspended: "destructive",
  rejected: "muted",
};

interface Member {
  id: string;
  displayName: string;
  email: string;
  role: string;
  status: string;
  roboPoints: number;
  level: number;
  createdAt: string;
}

interface MembersData {
  students: Member[];
  teachers: Member[];
  activeCount: number;
  pendingCount: number;
  suspendedCount: number;
}

export default async function MembersPage() {
  const user = (await getPageUser());

  const { students, teachers, activeCount, pendingCount, suspendedCount } =
    await apiGet<MembersData>("/school/members");

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="font-display text-3xl font-bold">School Members</h1>
        <p className="text-muted-foreground">
          Manage all teachers and students enrolled at {user.tenant?.name}.
        </p>
      </div>

      {/* Summary stats */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active students" value={activeCount} icon="users" tone="primary" />
        <StatCard
          label="Pending approval"
          value={pendingCount}
          icon="user-check"
          tone="accent"
          hint={pendingCount > 0 ? "Needs review" : undefined}
        />
        <StatCard label="Suspended" value={suspendedCount} icon="shield" tone="secondary" />
        <StatCard label="Teachers" value={teachers.length} icon="graduation-cap" tone="success" />
      </section>

      {/* Tabs: Students | Teachers */}
      <Tabs defaultValue="students">
        <TabsList>
          <TabsTrigger value="students">
            <Users className="size-4" />
            Students ({students.length})
          </TabsTrigger>
          <TabsTrigger value="teachers">
            <GraduationCap className="size-4" />
            Teachers ({teachers.length})
          </TabsTrigger>
        </TabsList>

        {/* ── Students ── */}
        <TabsContent value="students" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>All students</CardTitle>
              <CardDescription>
                You can suspend a student to temporarily revoke their access, then reinstate them at
                any time.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {students.length === 0 ? (
                <EmptyState
                  icon={<Users className="size-7" />}
                  message="No students yet"
                  sub="Students will appear here once they register and are approved."
                />
              ) : (
                <div className="divide-y divide-border">
                  {students.map((s) => (
                    <MemberRow
                      key={s.id}
                      id={s.id}
                      name={s.displayName}
                      email={s.email}
                      roleLabel={ROLE_LABELS[s.role as keyof typeof ROLE_LABELS] ?? s.role}
                      status={s.status}
                      points={s.roboPoints}
                      level={s.level}
                      joinedAt={s.createdAt}
                      showActions={s.status === "active" || s.status === "suspended"}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Teachers ── */}
        <TabsContent value="teachers" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Teaching staff</CardTitle>
              <CardDescription>
                Teachers have access to class management, assignment grading and student progress
                reports.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {teachers.length === 0 ? (
                <EmptyState
                  icon={<GraduationCap className="size-7" />}
                  message="No teachers yet"
                  sub="Invite teachers through the school admin panel to get started."
                />
              ) : (
                <div className="divide-y divide-border">
                  {teachers.map((t) => (
                    <MemberRow
                      key={t.id}
                      id={t.id}
                      name={t.displayName}
                      email={t.email}
                      roleLabel={ROLE_LABELS[t.role as keyof typeof ROLE_LABELS] ?? t.role}
                      status={t.status}
                      points={t.roboPoints}
                      level={t.level}
                      joinedAt={t.createdAt}
                      showActions={false}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function MemberRow({
  id,
  name,
  email,
  roleLabel,
  status,
  points,
  level,
  joinedAt,
  showActions,
}: {
  id: string;
  name: string;
  email: string;
  roleLabel: string;
  status: string;
  points: number;
  level: number;
  joinedAt: string;
  showActions: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
      <div className="flex items-center gap-3">
        <Avatar className="size-10">
          <AvatarFallback>{initials(name)}</AvatarFallback>
        </Avatar>
        <div>
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="font-medium">{name}</p>
            <Badge variant={STATUS_BADGE[status] ?? "muted"} className="text-xs capitalize">
              {status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{email}</p>
          <p className="text-xs text-muted-foreground">
            {roleLabel} · Lv {level} · {points.toLocaleString()} pts · Joined {formatRelative(joinedAt)}
          </p>
        </div>
      </div>
      {showActions && (
        <SuspendReinstateButton userId={id} name={name} status={status} />
      )}
    </div>
  );
}

function EmptyState({
  icon,
  message,
  sub,
}: {
  icon: React.ReactNode;
  message: string;
  sub: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <span className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
        {icon}
      </span>
      <p className="font-medium">{message}</p>
      <p className="max-w-sm text-sm text-muted-foreground">{sub}</p>
    </div>
  );
}
