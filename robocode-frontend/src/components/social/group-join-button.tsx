"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { joinGroup, leaveGroup } from "@/lib/social/actions";

interface GroupJoinButtonProps {
  groupId: string;
  /** Member status: null | "pending" | "active" | "left" etc. */
  status: string | null;
  isOwner: boolean;
}

export function GroupJoinButton({ groupId, status: initial, isOwner }: GroupJoinButtonProps) {
  const router = useRouter();
  const [status, setStatus] = useState(initial);
  const [pending, startTransition] = useTransition();

  if (isOwner) return null;

  function join() {
    startTransition(async () => {
      const r = await joinGroup(groupId);
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      setStatus("pending");
      toast.success("Request sent");
      router.refresh();
    });
  }

  function leave() {
    startTransition(async () => {
      const r = await leaveGroup(groupId);
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      setStatus(null);
      toast.success("You left the group");
      router.refresh();
    });
  }

  if (status === "pending") {
    return (
      <Button variant="secondary" size="sm" onClick={leave} disabled={pending}>
        Requested · Cancel
      </Button>
    );
  }

  if (status === "active") {
    return (
      <Button variant="secondary" size="sm" onClick={leave} disabled={pending}>
        Leave group
      </Button>
    );
  }

  return (
    <Button variant="gradient" size="sm" onClick={join} disabled={pending}>
      {pending ? "Joining…" : "Join group"}
    </Button>
  );
}
