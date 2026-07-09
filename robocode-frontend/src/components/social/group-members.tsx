"use client";

import { useState, useTransition } from "react";
import { Check, X, ShieldPlus, ShieldMinus, UserMinus } from "lucide-react";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/social/user-avatar";
import {
  approveMember,
  declineMember,
  removeMember,
  setMemberRole,
} from "@/lib/social/actions";
import type { GroupMemberCard } from "@/lib/social/types";

interface GroupMembersProps {
  groupId: string;
  members: GroupMemberCard[];
  isAdmin: boolean;
  ownerId: string;
  currentUserId: string;
}

export function GroupMembers({ groupId, members: initial, isAdmin, ownerId }: GroupMembersProps) {
  const [members, setMembers] = useState<GroupMemberCard[]>(initial);
  const [pending, startTransition] = useTransition();

  const pendingMembers = members.filter((m) => m.status === "pending");
  const activeMembers = members.filter((m) => m.status !== "pending");

  function run(
    fn: () => Promise<{ ok: true; data: unknown } | { ok: false; error: string }>,
    onOk: () => void,
    success: string,
  ) {
    startTransition(async () => {
      const r = await fn();
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      onOk();
      toast.success(success);
    });
  }

  function roleBadge(role: string, isOwner: boolean) {
    if (isOwner) return <Badge variant="accent">Owner</Badge>;
    if (role === "admin") return <Badge variant="secondary">Admin</Badge>;
    return <Badge variant="muted">Member</Badge>;
  }

  return (
    <div className="space-y-4">
      {isAdmin && pendingMembers.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Pending requests ({pendingMembers.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingMembers.map((m) => (
              <div key={m.id} className="flex items-center gap-3">
                <UserAvatar user={m} size={36} />
                <div className="min-w-0 flex-1">
                  <a href={`/app/u/${m.id}`} className="truncate font-medium hover:text-primary">
                    {m.displayName}
                  </a>
                  <p className="text-xs text-muted-foreground">{m.schoolName ?? "RoboCode"}</p>
                </div>
                <Button
                  variant="gradient"
                  size="sm"
                  disabled={pending}
                  onClick={() =>
                    run(
                      () => approveMember(groupId, m.id),
                      () =>
                        setMembers((prev) =>
                          prev.map((x) => (x.id === m.id ? { ...x, status: "active" } : x)),
                        ),
                      "Member approved",
                    )
                  }
                >
                  <Check className="size-3.5" /> Approve
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={pending}
                  onClick={() =>
                    run(
                      () => declineMember(groupId, m.id),
                      () => setMembers((prev) => prev.filter((x) => x.id !== m.id)),
                      "Request declined",
                    )
                  }
                >
                  <X className="size-3.5" /> Decline
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Members ({activeMembers.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {activeMembers.map((m) => {
            const isOwner = m.id === ownerId;
            return (
              <div key={m.id} className="flex items-center gap-3">
                <UserAvatar user={m} size={36} />
                <div className="min-w-0 flex-1">
                  <a href={`/app/u/${m.id}`} className="truncate font-medium hover:text-primary">
                    {m.displayName}
                  </a>
                  <p className="text-xs text-muted-foreground">{m.schoolName ?? "RoboCode"}</p>
                </div>
                {roleBadge(m.role, isOwner)}
                {isAdmin && !isOwner && (
                  <div className="flex items-center gap-1">
                    {m.role === "admin" ? (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        title="Demote to member"
                        disabled={pending}
                        onClick={() =>
                          run(
                            () => setMemberRole(groupId, m.id, "member"),
                            () =>
                              setMembers((prev) =>
                                prev.map((x) => (x.id === m.id ? { ...x, role: "member" } : x)),
                              ),
                            "Demoted to member",
                          )
                        }
                      >
                        <ShieldMinus className="size-4" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        title="Promote to admin"
                        disabled={pending}
                        onClick={() =>
                          run(
                            () => setMemberRole(groupId, m.id, "admin"),
                            () =>
                              setMembers((prev) =>
                                prev.map((x) => (x.id === m.id ? { ...x, role: "admin" } : x)),
                              ),
                            "Promoted to admin",
                          )
                        }
                      >
                        <ShieldPlus className="size-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      title="Remove from group"
                      className="text-destructive"
                      disabled={pending}
                      onClick={() =>
                        run(
                          () => removeMember(groupId, m.id),
                          () => setMembers((prev) => prev.filter((x) => x.id !== m.id)),
                          "Member removed",
                        )
                      }
                    >
                      <UserMinus className="size-4" />
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
