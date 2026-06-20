import { notFound } from "next/navigation";
import { Users, Search } from "lucide-react";
import { getPageUser } from "@/lib/auth/current-user";
import { can, ROLE_LABELS, type Role } from "@/lib/domain/roles";
import { apiGet } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatCard } from "@/components/app/stat-card";
import { Separator } from "@/components/ui/separator";
import { initials, formatRelative } from "@/lib/utils";
import { SuspendUserButton, ReinstateUserButton } from "@/components/admin/admin-buttons";

export const metadata = { title: "Users — Admin" };

const statusVariant: Record<string, "success" | "warning" | "destructive" | "muted"> = {
  active: "success",
  pending: "warning",
  suspended: "destructive",
  rejected: "muted",
};

interface AdminUser {
  id: string;
  displayName: string;
  email: string;
  role: string;
  status: string;
  roboPoints: number;
  level: number;
  createdAt: string;
  lastLoginAt: string | null;
  tenant: { name: string; slug: string } | null;
}

interface UsersResponse {
  users: AdminUser[];
  totalUsers: number;
  activeUsers: number;
  pendingUsers: number;
  suspendedUsers: number;
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string; status?: string }>;
}) {
  const user = (await getPageUser());
  if (!can(user.role, "platform.manage")) notFound();

  const { q, role, status } = await searchParams;

  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (role) params.set("role", role);
  if (status) params.set("status", status);
  const qs = params.toString();

  const { users, totalUsers, activeUsers, pendingUsers, suspendedUsers } =
    await apiGet<UsersResponse>(`/admin/users${qs ? `?${qs}` : ""}`);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold">Users</h1>
        <p className="text-muted-foreground">
          Search, inspect, and manage all users across the platform.
        </p>
      </div>

      {/* KPI strip */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total users" value={totalUsers} icon="users" tone="primary" />
        <StatCard label="Active" value={activeUsers} icon="check-circle" tone="success" />
        <StatCard label="Pending" value={pendingUsers} icon="clock" tone="accent" />
        <StatCard label="Suspended" value={suspendedUsers} icon="shield-off" tone="secondary" />
      </div>

      {/* Search & filters */}
      <form method="GET" className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search by name or email…"
            className="flex h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3.5 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-ring"
          />
        </div>
        <select
          name="role"
          defaultValue={role ?? ""}
          className="h-10 rounded-lg border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">All roles</option>
          {(["school_admin", "teacher", "student", "parent", "moderator"] as Role[]).map((r) => (
            <option key={r} value={r}>{ROLE_LABELS[r]}</option>
          ))}
        </select>
        <select
          name="status"
          defaultValue={status ?? ""}
          className="h-10 rounded-lg border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="suspended">Suspended</option>
          <option value="rejected">Rejected</option>
        </select>
        <button
          type="submit"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Filter
        </button>
      </form>

      {/* User list */}
      <Card>
        <CardHeader>
          <CardTitle>Results</CardTitle>
          <CardDescription>
            Showing {users.length} user{users.length !== 1 ? "s" : ""}
            {totalUsers > 100 ? ` (showing first 100 of ${totalUsers})` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {users.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 p-12 text-center">
              <span className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
                <Users className="size-7" />
              </span>
              <p className="font-medium">No users found</p>
              <p className="text-sm text-muted-foreground">Try adjusting your search or filters.</p>
            </div>
          ) : (
            users.map((u, idx) => (
              <div key={u.id}>
                {idx > 0 && <Separator />}
                <div className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="size-10 shrink-0">
                      <AvatarFallback>{initials(u.displayName)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{u.displayName}</p>
                      <p className="text-sm text-muted-foreground truncate">{u.email}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <Badge variant="muted" className="capitalize">
                          {ROLE_LABELS[u.role as Role] ?? u.role}
                        </Badge>
                        <Badge variant={statusVariant[u.status] ?? "muted"} className="capitalize">
                          {u.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{u.tenant?.name ?? "—"}</span>
                        <span className="text-xs text-muted-foreground">
                          Lv {u.level} · {u.roboPoints} pts
                        </span>
                        {u.lastLoginAt && (
                          <span className="text-xs text-muted-foreground">
                            Last seen {formatRelative(u.lastLoginAt)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    {u.status === "active" && <SuspendUserButton userId={u.id} />}
                    {(u.status === "suspended" || u.status === "rejected") && (
                      <ReinstateUserButton userId={u.id} />
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
