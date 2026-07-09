"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initials, cn } from "@/lib/utils";
import { FollowersDialog } from "@/components/social/followers-dialog";
import type { FollowPreview as FollowPreviewType } from "@/lib/social/types";

interface FollowPreviewProps {
  targetType: "user" | "project" | "group";
  targetId: string;
  preview: FollowPreviewType;
  currentUserId?: string;
}

/** "Followed by Ada, Ben and 3 others you know · 240 followers" — opens the
 * full followers list (mutuals first) on click. */
export function FollowPreview({ targetType, targetId, preview, currentUserId }: FollowPreviewProps) {
  const { followerCount, friendFollowerCount, friendFollowers } = preview;

  const followerLabel = `${followerCount} ${followerCount === 1 ? "follower" : "followers"}`;

  // Build the "people you know" phrase from the preview avatars.
  let knownPhrase: string | null = null;
  if (friendFollowerCount > 0) {
    const names = friendFollowers.map((u) => u.displayName.split(" ")[0]);
    const shown = names.slice(0, 2);
    const extra = friendFollowerCount - shown.length;
    const list =
      extra > 0
        ? `${shown.join(", ")} and ${extra} other${extra === 1 ? "" : "s"}`
        : shown.length === 2
          ? `${shown[0]} and ${shown[1]}`
          : shown[0];
    knownPhrase = `Followed by ${list} you know`;
  }

  const trigger = (
    <button
      type="button"
      className="group flex w-full items-center gap-2 rounded-lg px-1 py-1 text-left transition-colors hover:bg-muted/60"
      aria-label="View followers"
    >
      {friendFollowers.length > 0 && (
        <div className="flex -space-x-2">
          {friendFollowers.slice(0, 4).map((u) => (
            <Avatar key={u.id} className="size-7 ring-2 ring-card">
              <AvatarFallback className="text-[10px] font-semibold">{initials(u.displayName)}</AvatarFallback>
            </Avatar>
          ))}
        </div>
      )}
      <span className={cn("min-w-0 text-sm", knownPhrase ? "text-foreground" : "text-muted-foreground")}>
        {knownPhrase ? (
          <>
            <span className="font-medium">{knownPhrase}</span>
            <span className="text-muted-foreground"> · {followerLabel}</span>
          </>
        ) : (
          <span className="group-hover:text-foreground">{followerLabel}</span>
        )}
      </span>
    </button>
  );

  return (
    <FollowersDialog targetType={targetType} targetId={targetId} currentUserId={currentUserId}>
      {trigger}
    </FollowersDialog>
  );
}
