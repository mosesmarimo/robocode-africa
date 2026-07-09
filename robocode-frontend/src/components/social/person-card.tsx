"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/social/user-avatar";
import { FriendButton } from "@/components/social/friend-button";
import { FollowButton } from "@/components/social/follow-button";
import type { PersonResult } from "@/lib/social/types";

interface PersonCardProps {
  person: PersonResult;
  currentUserId: string;
}

export function PersonCard({ person, currentUserId }: PersonCardProps) {
  const isSelf = person.id === currentUserId || person.friendStatus === "self";

  return (
    <Card className="p-5">
      <div className="flex items-start gap-3">
        <UserAvatar user={person} size={44} />
        <div className="min-w-0 flex-1">
          <Link href={`/app/u/${person.id}`} className="truncate font-semibold hover:text-primary">
            {person.displayName}
          </Link>
          <p className="truncate text-xs text-muted-foreground">
            {person.schoolName ?? "RoboCode"} · Level {person.level}
          </p>
          {person.tagline && (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{person.tagline}</p>
          )}
        </div>
        <Badge variant="muted" className="shrink-0">Lv {person.level}</Badge>
      </div>

      {!isSelf && (
        <div className="mt-4 flex items-center gap-2">
          <FriendButton userId={person.id} status={person.friendStatus} requestId={person.requestId ?? undefined} />
          <FollowButton targetType="user" targetId={person.id} following={person.following} />
        </div>
      )}
    </Card>
  );
}
