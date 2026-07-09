"use client";

import Link from "next/link";
import { UsersRound } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/social/user-avatar";
import { FriendButton } from "@/components/social/friend-button";
import { PeopleSearch } from "@/components/social/people-search";
import type { FriendsList } from "@/lib/social/types";

interface FriendsTabsProps {
  data: FriendsList;
  currentUserId: string;
}

function EmptyState({ label }: { label: string }) {
  return (
    <Card className="flex flex-col items-center justify-center gap-3 p-12 text-center">
      <span className="grid size-14 place-items-center rounded-2xl bg-muted">
        <UsersRound className="size-7 text-muted-foreground" />
      </span>
      <p className="font-medium text-muted-foreground">{label}</p>
    </Card>
  );
}

export function FriendsTabs({ data, currentUserId }: FriendsTabsProps) {
  const requestCount = data.incoming.length + data.outgoing.length;

  return (
    <Tabs defaultValue="friends">
      <TabsList>
        <TabsTrigger value="friends">
          Friends <Badge variant="muted">{data.friends.length}</Badge>
        </TabsTrigger>
        <TabsTrigger value="requests">
          Requests <Badge variant="muted">{requestCount}</Badge>
        </TabsTrigger>
        <TabsTrigger value="find">Find people</TabsTrigger>
      </TabsList>

      <TabsContent value="friends">
        {data.friends.length === 0 ? (
          <EmptyState label="No friends yet — find people to connect with." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.friends.map((f) => (
              <Card key={f.id} className="p-5">
                <div className="flex items-start gap-3">
                  <UserAvatar user={f} size={44} />
                  <div className="min-w-0 flex-1">
                    <Link href={`/app/u/${f.id}`} className="truncate font-semibold hover:text-primary">
                      {f.displayName}
                    </Link>
                    <p className="truncate text-xs text-muted-foreground">
                      {f.schoolName ?? "RoboCode"} · Level {f.level}
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <FriendButton userId={f.id} status="friends" />
                </div>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="requests">
        <div className="space-y-6">
          <section>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Incoming ({data.incoming.length})
            </h3>
            {data.incoming.length === 0 ? (
              <EmptyState label="No incoming requests." />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {data.incoming.map((req) => (
                  <Card key={req.id} className="p-5">
                    <div className="flex items-start gap-3">
                      <UserAvatar user={req.user} size={44} />
                      <div className="min-w-0 flex-1">
                        <Link href={`/app/u/${req.user.id}`} className="truncate font-semibold hover:text-primary">
                          {req.user.displayName}
                        </Link>
                        <p className="truncate text-xs text-muted-foreground">
                          {req.user.schoolName ?? "RoboCode"}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <FriendButton userId={req.user.id} status="incoming" requestId={req.id} />
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </section>

          <section>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Sent ({data.outgoing.length})
            </h3>
            {data.outgoing.length === 0 ? (
              <EmptyState label="No pending sent requests." />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {data.outgoing.map((req) => (
                  <Card key={req.id} className="p-5">
                    <div className="flex items-start gap-3">
                      <UserAvatar user={req.user} size={44} />
                      <div className="min-w-0 flex-1">
                        <Link href={`/app/u/${req.user.id}`} className="truncate font-semibold hover:text-primary">
                          {req.user.displayName}
                        </Link>
                        <p className="truncate text-xs text-muted-foreground">
                          {req.user.schoolName ?? "RoboCode"}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <FriendButton userId={req.user.id} status="outgoing" requestId={req.id} />
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </div>
      </TabsContent>

      <TabsContent value="find">
        <PeopleSearch currentUserId={currentUserId} />
      </TabsContent>
    </Tabs>
  );
}
