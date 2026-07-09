"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { follow, unfollow } from "@/lib/social/actions";
import type { FollowTarget } from "@/lib/social/types";

interface FollowButtonProps {
  targetType: FollowTarget;
  targetId: string;
  following: boolean;
  size?: "default" | "sm" | "lg";
}

export function FollowButton({ targetType, targetId, following: initial, size = "sm" }: FollowButtonProps) {
  const [following, setFollowing] = useState(initial);
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next = !following;
    setFollowing(next);
    startTransition(async () => {
      const r = next ? await follow(targetType, targetId) : await unfollow(targetType, targetId);
      if (!r.ok) {
        setFollowing(!next);
        toast.error(r.error);
      } else {
        toast.success(next ? "Following" : "Unfollowed");
      }
    });
  }

  return (
    <Button variant={following ? "secondary" : "outline"} size={size} disabled={pending} onClick={toggle}>
      {following ? "Following" : "Follow"}
    </Button>
  );
}
