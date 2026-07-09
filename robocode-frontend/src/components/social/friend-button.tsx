"use client";

import { useState, useTransition } from "react";
import { UserPlus, Check, X, UserCheck, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  sendFriendRequest,
  cancelFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  unfriend,
} from "@/lib/social/actions";
import type { FriendStatus } from "@/lib/social/types";

interface FriendButtonProps {
  userId: string;
  status: FriendStatus;
  requestId?: string;
  size?: "default" | "sm" | "lg";
}

export function FriendButton({ userId, status: initialStatus, requestId, size = "sm" }: FriendButtonProps) {
  const [status, setStatus] = useState<FriendStatus>(initialStatus);
  const [pending, startTransition] = useTransition();

  if (status === "self" || status === "blocked") return null;

  function act(
    fn: () => Promise<{ ok: true; data: unknown } | { ok: false; error: string }>,
    next: FriendStatus,
    success: string,
    prev: FriendStatus,
  ) {
    setStatus(next);
    startTransition(async () => {
      const r = await fn();
      if (!r.ok) {
        setStatus(prev);
        toast.error(r.error);
      } else {
        toast.success(success);
      }
    });
  }

  if (status === "none") {
    return (
      <Button
        variant="outline"
        size={size}
        disabled={pending}
        onClick={() => act(() => sendFriendRequest(userId), "outgoing", "Friend request sent", "none")}
      >
        <UserPlus className="size-3.5" /> Add friend
      </Button>
    );
  }

  if (status === "outgoing") {
    return (
      <Button
        variant="secondary"
        size={size}
        disabled={pending || !requestId}
        onClick={() =>
          requestId && act(() => cancelFriendRequest(requestId), "none", "Request cancelled", "outgoing")
        }
      >
        Requested
      </Button>
    );
  }

  if (status === "incoming") {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="gradient"
          size={size}
          disabled={pending || !requestId}
          onClick={() =>
            requestId && act(() => acceptFriendRequest(requestId), "friends", "You're now friends", "incoming")
          }
        >
          <Check className="size-3.5" /> Accept
        </Button>
        <Button
          variant="ghost"
          size={size}
          disabled={pending || !requestId}
          onClick={() =>
            requestId && act(() => declineFriendRequest(requestId), "none", "Request declined", "incoming")
          }
        >
          <X className="size-3.5" /> Decline
        </Button>
      </div>
    );
  }

  // friends
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" size={size} disabled={pending}>
          <UserCheck className="size-3.5" /> Friends <ChevronDown className="size-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onSelect={() => act(() => unfriend(userId), "none", "Removed friend", "friends")}
        >
          <X className="size-4" /> Unfriend
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
