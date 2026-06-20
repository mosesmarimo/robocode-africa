import { notFound } from "next/navigation";
import { Building2, Users, Clock } from "lucide-react";
import { getPageUser } from "@/lib/auth/current-user";
import { can } from "@/lib/domain/roles";
import { apiGet } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/app/stat-card";
import { Separator } from "@/components/ui/separator";
import { formatRelative } from "@/lib/utils";
import {
  ApproveTenantButton,
  SuspendTenantButton,
  ReinstateTenantButton,
} from "@/components/admin/admin-buttons";

export const metadata = { title: "Schools — Admin" };

const statusVariant: Record<string, "success" | "warning" | "destructive" | "muted"> = {
  active: "success",
  pending: "warning",
  suspended: "destructive",
};

interface AdminTenant {
  id: string;
  name: string;
  slug: string;
  status: string;
  createdAt: string;
  _count: { users: number };
  subscription: { plan: { name: string } | null } | null;
}

export default async function TenantsPage() {
  const user = (await getPageUser());
  if (!can(user.role, "platform.manage")) notFound();

  const tenants = await apiGet<AdminTenant[]>("/admin/tenants");

  const total = tenants.length;
  const active = tenants.filter((t) => t.status === "active").length;
  const pending = tenants.filter((t) => t.status === "pending").length;
  const suspended = tenants.filter((t) => t.status === "suspended").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold">Schools</h1>
        <p className="text-muted-foreground">
          Manage all school tenants on the platform — approve, suspend, or reinstate.
        </p>
      </div>

      {/* KPI strip */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total schools" value={total} icon="building-2" tone="primary" />
        <StatCard label="Active" value={active} icon="check-circle" tone="success" />
        <StatCard label="Pending approval" value={pending} icon="clock" tone="accent" />
        <StatCard label="Suspended" value={suspended} icon="shield-off" tone="secondary" />
      </div>

      {/* Tenant list */}
      <Card>
        <CardHeader>
          <CardTitle>All Schools</CardTitle>
          <CardDescription>{total} school{total !== 1 ? "s" : ""} registered on the platform</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {tenants.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 p-12 text-center">
              <span className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
                <Building2 className="size-7" />
              </span>
              <p className="font-medium">No schools yet</p>
              <p className="text-sm text-muted-foreground">Schools will appear here once they register.</p>
            </div>
          ) : (
            tenants.map((tenant, idx) => (
              <div key={tenant.id}>
                {idx > 0 && <Separator />}
                <div className="flex flex-wrap items-center justify-between gap-4 p-5">
                  {/* Info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary">
                      <Building2 className="size-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{tenant.name}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {tenant.slug}.robocode.africa
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <Badge variant={statusVariant[tenant.status] ?? "muted"} className="capitalize">
                          {tenant.status}
                        </Badge>
                        {tenant.subscription?.plan?.name && (
                          <Badge variant="outline">{tenant.subscription.plan.name}</Badge>
                        )}
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Users className="size-3" />
                          {tenant._count.users} member{tenant._count.users !== 1 ? "s" : ""}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="size-3" />
                          {formatRelative(tenant.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 flex-wrap gap-2">
                    {tenant.status === "pending" && <ApproveTenantButton tenantId={tenant.id} />}
                    {tenant.status === "active" && <SuspendTenantButton tenantId={tenant.id} />}
                    {tenant.status === "suspended" && <ReinstateTenantButton tenantId={tenant.id} />}
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
