"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { CheckCircle, XCircle, ShieldOff, ShieldCheck, Building2, MessageSquareOff, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  approveUser,
  rejectUser,
  approveTenant,
  suspendUser,
  reinstateUser,
  suspendTenant,
  reinstateTenant,
  resolveModeration,
} from "@/lib/admin/actions";

// ---------------------------------------------------------------------------
// Approve user button
// ---------------------------------------------------------------------------

export function ApproveUserButton({ userId }: { userId: string }) {
  const [pending, start] = useTransition();

  function handle() {
    start(async () => {
      const res = await approveUser(userId).catch((e: Error) => ({ ok: false, error: e.message }));
      if ("error" in res) {
        toast.error("Could not approve: " + res.error);
      } else {
        toast.success("User approved and notified.");
      }
    });
  }

  return (
    <Button size="sm" variant="default" onClick={handle} disabled={pending} aria-label="Approve user">
      <CheckCircle className="size-4" />
      {pending ? "Approving…" : "Approve"}
    </Button>
  );
}

// ---------------------------------------------------------------------------
// Reject user button (with reason dialog)
// ---------------------------------------------------------------------------

export function RejectUserButton({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, start] = useTransition();

  function handle() {
    start(async () => {
      const res = await rejectUser(userId, reason.trim() || undefined).catch((e: Error) => ({
        ok: false,
        error: e.message,
      }));
      if ("error" in res) {
        toast.error("Could not reject: " + res.error);
      } else {
        toast.success("User rejected.");
        setOpen(false);
        setReason("");
      }
    });
  }

  return (
    <>
      <Button
        size="sm"
        variant="destructive"
        onClick={() => setOpen(true)}
        aria-label="Reject user"
      >
        <XCircle className="size-4" />
        Reject
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject application</DialogTitle>
            <DialogDescription>
              The user will be notified with the reason you provide. This action sets their status to
              &ldquo;rejected&rdquo;.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reject-reason">Reason (optional)</Label>
            <Textarea
              id="reject-reason"
              placeholder="e.g. Missing guardian consent, duplicate account…"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={pending}>
                Cancel
              </Button>
            </DialogClose>
            <Button variant="destructive" onClick={handle} disabled={pending}>
              {pending ? "Rejecting…" : "Confirm Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ---------------------------------------------------------------------------
// Approve tenant button
// ---------------------------------------------------------------------------

export function ApproveTenantButton({ tenantId }: { tenantId: string }) {
  const [pending, start] = useTransition();

  function handle() {
    start(async () => {
      const res = await approveTenant(tenantId).catch((e: Error) => ({ ok: false, error: e.message }));
      if ("error" in res) {
        toast.error("Could not approve school: " + res.error);
      } else {
        toast.success("School approved — admins notified.");
      }
    });
  }

  return (
    <Button size="sm" variant="default" onClick={handle} disabled={pending} aria-label="Approve school">
      <Building2 className="size-4" />
      {pending ? "Approving…" : "Approve School"}
    </Button>
  );
}

// ---------------------------------------------------------------------------
// Suspend user
// ---------------------------------------------------------------------------

export function SuspendUserButton({ userId }: { userId: string }) {
  const [pending, start] = useTransition();

  function handle() {
    start(async () => {
      const res = await suspendUser(userId).catch((e: Error) => ({ ok: false, error: e.message }));
      if ("error" in res) {
        toast.error("Could not suspend: " + res.error);
      } else {
        toast.success("User suspended.");
      }
    });
  }

  return (
    <Button size="sm" variant="destructive" onClick={handle} disabled={pending} aria-label="Suspend user">
      <ShieldOff className="size-4" />
      {pending ? "Suspending…" : "Suspend"}
    </Button>
  );
}

// ---------------------------------------------------------------------------
// Reinstate user
// ---------------------------------------------------------------------------

export function ReinstateUserButton({ userId }: { userId: string }) {
  const [pending, start] = useTransition();

  function handle() {
    start(async () => {
      const res = await reinstateUser(userId).catch((e: Error) => ({ ok: false, error: e.message }));
      if ("error" in res) {
        toast.error("Could not reinstate: " + res.error);
      } else {
        toast.success("User reinstated.");
      }
    });
  }

  return (
    <Button size="sm" variant="outline" onClick={handle} disabled={pending} aria-label="Reinstate user">
      <ShieldCheck className="size-4" />
      {pending ? "Reinstating…" : "Reinstate"}
    </Button>
  );
}

// ---------------------------------------------------------------------------
// Suspend tenant
// ---------------------------------------------------------------------------

export function SuspendTenantButton({ tenantId }: { tenantId: string }) {
  const [pending, start] = useTransition();

  function handle() {
    start(async () => {
      const res = await suspendTenant(tenantId).catch((e: Error) => ({ ok: false, error: e.message }));
      if ("error" in res) {
        toast.error("Could not suspend school: " + res.error);
      } else {
        toast.success("School suspended.");
      }
    });
  }

  return (
    <Button size="sm" variant="destructive" onClick={handle} disabled={pending} aria-label="Suspend school">
      <ShieldOff className="size-4" />
      {pending ? "Suspending…" : "Suspend"}
    </Button>
  );
}

// ---------------------------------------------------------------------------
// Reinstate tenant
// ---------------------------------------------------------------------------

export function ReinstateTenantButton({ tenantId }: { tenantId: string }) {
  const [pending, start] = useTransition();

  function handle() {
    start(async () => {
      const res = await reinstateTenant(tenantId).catch((e: Error) => ({ ok: false, error: e.message }));
      if ("error" in res) {
        toast.error("Could not reinstate school: " + res.error);
      } else {
        toast.success("School reinstated.");
      }
    });
  }

  return (
    <Button size="sm" variant="outline" onClick={handle} disabled={pending} aria-label="Reinstate school">
      <ShieldCheck className="size-4" />
      {pending ? "Reinstating…" : "Reinstate"}
    </Button>
  );
}

// ---------------------------------------------------------------------------
// Resolve moderation case
// ---------------------------------------------------------------------------

export function ResolveModerationButton({ caseId }: { caseId: string }) {
  const [pending, start] = useTransition();

  function handle() {
    start(async () => {
      const res = await resolveModeration(caseId, "resolved").catch((e: Error) => ({
        ok: false,
        error: e.message,
      }));
      if ("error" in res) {
        toast.error("Could not resolve case: " + res.error);
      } else {
        toast.success("Case marked as resolved.");
      }
    });
  }

  return (
    <Button size="sm" variant="default" onClick={handle} disabled={pending} aria-label="Resolve case">
      <Check className="size-4" />
      {pending ? "Resolving…" : "Resolve"}
    </Button>
  );
}

// ---------------------------------------------------------------------------
// Dismiss moderation case
// ---------------------------------------------------------------------------

export function DismissModerationButton({ caseId }: { caseId: string }) {
  const [pending, start] = useTransition();

  function handle() {
    start(async () => {
      const res = await resolveModeration(caseId, "dismissed").catch((e: Error) => ({
        ok: false,
        error: e.message,
      }));
      if ("error" in res) {
        toast.error("Could not dismiss case: " + res.error);
      } else {
        toast.success("Case dismissed.");
      }
    });
  }

  return (
    <Button size="sm" variant="outline" onClick={handle} disabled={pending} aria-label="Dismiss case">
      <MessageSquareOff className="size-4" />
      {pending ? "Dismissing…" : "Dismiss"}
    </Button>
  );
}
