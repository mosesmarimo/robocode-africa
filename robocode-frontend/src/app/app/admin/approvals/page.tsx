import { notFound } from "next/navigation";
import { UserCheck, Building2, Clock, User } from "lucide-react";
import { getPageUser } from "@/lib/auth/current-user";
import { can } from "@/lib/domain/roles";
import { apiGet } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { initials, formatRelative } from "@/lib/utils";
import {
  ApproveUserButton,
  RejectUserButton,
  ApproveTenantButton,
} from "@/components/admin/admin-buttons";

export const metadata = { title: "Approvals — Admin" };

interface PendingRequest {
  id: string;
  type: string;
  createdAt: string;
  user: { id: string; displayName: string; email: string; role: string; createdAt: string };
  tenant: { id: string; name: string; slug: string };
}

interface PendingTenant {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
}

interface ApprovalsResponse {
  pendingRequests: PendingRequest[];
  pendingTenants: PendingTenant[];
}

export default async function ApprovalsPage() {
  const user = (await getPageUser());
  if (!can(user.role, "platform.manage") && !can(user.role, "moderation.manage")) notFound();

  const { pendingRequests, pendingTenants } = await apiGet<ApprovalsResponse>("/admin/approvals");

  const typeLabel: Record<string, string> = {
    student_direct: "Student (direct)",
    student_school: "Student (school)",
    teacher: "Teacher",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold">Pending Approvals</h1>
        <p className="text-muted-foreground">
          Review and action user registration requests and new school applications.
        </p>
      </div>

      {/* Stats strip */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="flex items-center gap-4 p-5">
          <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-accent/18 text-accent-foreground">
            <UserCheck className="size-6" />
          </span>
          <div>
            <p className="text-2xl font-bold font-display">{pendingRequests.length}</p>
            <p className="text-sm text-muted-foreground">User requests</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-5">
          <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-secondary/15 text-secondary">
            <Building2 className="size-6" />
          </span>
          <div>
            <p className="text-2xl font-bold font-display">{pendingTenants.length}</p>
            <p className="text-sm text-muted-foreground">School applications</p>
          </div>
        </Card>
      </div>

      {/* Pending school applications */}
      {can(user.role, "platform.manage") && (
        <section>
          <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-bold">
            <Building2 className="size-5 text-primary" />
            School Applications
          </h2>
          {pendingTenants.length === 0 ? (
            <Card className="flex flex-col items-center justify-center gap-3 p-10 text-center">
              <span className="grid size-14 place-items-center rounded-2xl bg-success/15 text-success">
                <Building2 className="size-7" />
              </span>
              <p className="font-medium">No pending school applications</p>
              <p className="text-sm text-muted-foreground">All school applications have been reviewed.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {pendingTenants.map((tenant) => (
                <Card key={tenant.id} className="p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="grid size-11 place-items-center rounded-xl bg-primary/12 text-primary">
                        <Building2 className="size-5" />
                      </span>
                      <div>
                        <p className="font-semibold">{tenant.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {tenant.slug}.robocode.africa
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="warning">Pending</Badge>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="size-3" />
                        {formatRelative(tenant.createdAt)}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <ApproveTenantButton tenantId={tenant.id} />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>
      )}

      {can(user.role, "platform.manage") && pendingTenants.length > 0 && (
        <Separator />
      )}

      {/* Pending user requests */}
      <section>
        <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-bold">
          <UserCheck className="size-5 text-primary" />
          User Approval Requests
        </h2>
        {pendingRequests.length === 0 ? (
          <Card className="flex flex-col items-center justify-center gap-3 p-10 text-center">
            <span className="grid size-14 place-items-center rounded-2xl bg-success/15 text-success">
              <UserCheck className="size-7" />
            </span>
            <p className="font-medium">No pending user requests</p>
            <p className="text-sm text-muted-foreground">All registration requests have been reviewed.</p>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Pending registrations</CardTitle>
              <CardDescription>
                {pendingRequests.length} request{pendingRequests.length !== 1 ? "s" : ""} awaiting review
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-1 p-0">
              {pendingRequests.map((req, idx) => (
                <div key={req.id}>
                  {idx > 0 && <Separator />}
                  <div className="flex flex-wrap items-center justify-between gap-3 p-5">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-10">
                        <AvatarFallback>{initials(req.user.displayName)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{req.user.displayName}</p>
                        <p className="text-sm text-muted-foreground">{req.user.email}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          <Badge variant="muted" className="capitalize">
                            {typeLabel[req.type] ?? req.type}
                          </Badge>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <User className="size-3" />
                            {req.tenant.name}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="size-3" />
                            {formatRelative(req.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <ApproveUserButton userId={req.user.id} />
                      <RejectUserButton userId={req.user.id} />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
