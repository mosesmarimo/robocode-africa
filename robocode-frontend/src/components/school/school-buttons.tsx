"use client";

import { useTransition } from "react";
import { Check, X, Ban, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { approveStudent, rejectStudent, suspendStudent, reinstateStudent } from "@/lib/school/actions";

// ---------------------------------------------------------------------------
// Approve / Reject pair (approvals page)
// ---------------------------------------------------------------------------

export function ApproveRejectButtons({ userId, name }: { userId: string; name: string }) {
  const [pending, startTransition] = useTransition();

  function handleApprove() {
    startTransition(async () => {
      try {
        await approveStudent(userId);
        toast.success(`${name} approved and notified.`);
      } catch {
        toast.error("Failed to approve student. Please try again.");
      }
    });
  }

  function handleReject() {
    startTransition(async () => {
      try {
        await rejectStudent(userId);
        toast.success(`${name}'s request has been rejected.`);
      } catch {
        toast.error("Failed to reject student. Please try again.");
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="gradient"
        onClick={handleApprove}
        disabled={pending}
        aria-label={`Approve ${name}`}
      >
        <Check className="size-3.5" />
        Approve
      </Button>
      <Button
        size="sm"
        variant="destructive"
        onClick={handleReject}
        disabled={pending}
        aria-label={`Reject ${name}`}
      >
        <X className="size-3.5" />
        Reject
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Suspend / Reinstate toggle (members page)
// ---------------------------------------------------------------------------

export function SuspendReinstateButton({
  userId,
  name,
  status,
}: {
  userId: string;
  name: string;
  status: string;
}) {
  const [pending, startTransition] = useTransition();
  const isSuspended = status === "suspended";

  function handleToggle() {
    startTransition(async () => {
      try {
        if (isSuspended) {
          await reinstateStudent(userId);
          toast.success(`${name} has been reinstated.`);
        } else {
          await suspendStudent(userId);
          toast.warning(`${name} has been suspended.`);
        }
      } catch {
        toast.error("Action failed. Please try again.");
      }
    });
  }

  return (
    <Button
      size="sm"
      variant={isSuspended ? "outline" : "destructive"}
      onClick={handleToggle}
      disabled={pending}
      aria-label={isSuspended ? `Reinstate ${name}` : `Suspend ${name}`}
    >
      {isSuspended ? (
        <>
          <RotateCcw className="size-3.5" />
          Reinstate
        </>
      ) : (
        <>
          <Ban className="size-3.5" />
          Suspend
        </>
      )}
    </Button>
  );
}
