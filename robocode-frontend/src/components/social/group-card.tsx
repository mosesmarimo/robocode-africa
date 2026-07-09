"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { UsersRound } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initials } from "@/lib/utils";
import { joinGroup } from "@/lib/social/actions";
import type { GroupSummary } from "@/lib/social/types";

interface GroupCardProps {
  group: GroupSummary;
  joined?: boolean;
}

export function GroupCard({ group, joined }: GroupCardProps) {
  const [pending, startTransition] = useTransition();
  const [requested, setRequested] = useState(group.myStatus === "pending");

  function join(e: React.MouseEvent) {
    e.preventDefault();
    startTransition(async () => {
      const r = await joinGroup(group.id);
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      setRequested(true);
      toast.success("Request sent");
    });
  }

  return (
    <Link href={`/app/groups/${group.id}`}>
      <Card className="group h-full p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar className="size-10">
              <AvatarFallback>{initials(group.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate font-semibold group-hover:text-primary">{group.name}</p>
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <UsersRound className="size-3" />
                {group.memberCount} {group.memberCount === 1 ? "member" : "members"}
              </p>
            </div>
          </div>
          {joined ? (
            requested ? (
              <Badge variant="warning" className="shrink-0">Pending</Badge>
            ) : (
              <Badge variant="muted" className="shrink-0">Joined</Badge>
            )
          ) : requested ? (
            <Badge variant="warning" className="shrink-0">Requested</Badge>
          ) : (
            <Button variant="outline" size="sm" onClick={join} disabled={pending} className="shrink-0">
              {pending ? "Joining…" : "Join"}
            </Button>
          )}
        </div>
        {group.description && (
          <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{group.description}</p>
        )}
      </Card>
    </Link>
  );
}
