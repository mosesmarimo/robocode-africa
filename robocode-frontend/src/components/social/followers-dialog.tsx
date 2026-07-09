"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Loader2, Users } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { UserAvatar } from "@/components/social/user-avatar";
import { FriendButton } from "@/components/social/friend-button";
import { FollowButton } from "@/components/social/follow-button";
import { followersOf } from "@/lib/social/actions";
import type { FollowerEntry } from "@/lib/social/types";

interface FollowersDialogProps {
  targetType: "user" | "project" | "group";
  targetId: string;
  /** Optional: hide friend/follow buttons (e.g. when this list is your own profile). */
  currentUserId?: string;
  children: React.ReactNode; // the trigger
}

function Row({ f, currentUserId }: { f: FollowerEntry; currentUserId?: string }) {
  const isSelf = f.id === currentUserId || f.friendStatus === "self";
  return (
    <div className="flex items-center gap-3 py-2">
      <UserAvatar user={f} size={40} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Link href={`/app/u/${f.id}`} className="truncate text-sm font-semibold hover:text-primary">
            {f.displayName}
          </Link>
          {f.isFriend && <Badge variant="secondary" className="shrink-0 text-[10px]">Friend</Badge>}
        </div>
        <p className="truncate text-xs text-muted-foreground">{f.schoolName ?? "RoboCode"} · Level {f.level}</p>
      </div>
      {!isSelf && (
        <div className="flex shrink-0 items-center gap-1.5">
          <FriendButton userId={f.id} status={f.friendStatus} />
          <FollowButton targetType="user" targetId={f.id} following={f.following} />
        </div>
      )}
    </div>
  );
}

export function FollowersDialog({ targetType, targetId, currentUserId, children }: FollowersDialogProps) {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [followers, setFollowers] = useState<FollowerEntry[]>([]);
  const [friendCount, setFriendCount] = useState(0);
  const [pending, startTransition] = useTransition();

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (next && !loaded) {
      startTransition(async () => {
        const r = await followersOf(targetType, targetId);
        if (!r.ok) {
          toast.error(r.error);
          return;
        }
        setFollowers(r.data.followers);
        setFriendCount(r.data.friendCount);
        setLoaded(true);
      });
    }
  }

  const friends = followers.filter((f) => f.isFriend);
  const others = followers.filter((f) => !f.isFriend);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Followers</DialogTitle>
          <DialogDescription>
            {friendCount > 0 ? `${friendCount} of them ${friendCount === 1 ? "is" : "are"} your friend.` : "People who follow this."}
          </DialogDescription>
        </DialogHeader>

        {pending && !loaded ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : followers.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
            <Users className="size-7" />
            <p className="text-sm">No followers yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {friends.length > 0 && (
              <div className="pb-1">
                <p className="pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">People you know</p>
                {friends.map((f) => (
                  <Row key={f.id} f={f} currentUserId={currentUserId} />
                ))}
              </div>
            )}
            {others.length > 0 && (
              <div className="pt-1">
                {friends.length > 0 && (
                  <p className="pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Everyone else</p>
                )}
                {others.map((f) => (
                  <Row key={f.id} f={f} currentUserId={currentUserId} />
                ))}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
