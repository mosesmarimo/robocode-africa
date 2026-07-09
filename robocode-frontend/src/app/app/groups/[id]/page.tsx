import { Lock, UsersRound } from "lucide-react";
import { getPageUser } from "@/lib/auth/current-user";
import { apiGet } from "@/lib/api/client";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initials } from "@/lib/utils";
import { FollowButton } from "@/components/social/follow-button";
import { FollowPreview } from "@/components/social/follow-preview";
import { GroupJoinButton } from "@/components/social/group-join-button";
import { GroupProfileEdit } from "@/components/social/group-profile-edit";
import { GroupMembers } from "@/components/social/group-members";
import { Wall } from "@/components/social/wall";
import type { GroupDetail, Wall as WallType } from "@/lib/social/types";

export const metadata = { title: "Group" };

export default async function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getPageUser();
  const detail = await apiGet<GroupDetail>(`/social/groups/${id}`);
  const wall = detail.me.canViewWall
    ? await apiGet<WallType>(`/social/posts/wall/group/${id}`)
    : null;

  const { group, me } = detail;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardContent className="flex flex-wrap items-start gap-5 p-6">
          <Avatar className="size-20 text-2xl">
            <AvatarFallback className="text-xl font-bold">{initials(group.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-2xl font-bold sm:text-3xl">{group.name}</h1>
            {group.description && (
              <p className="mt-1 text-muted-foreground">{group.description}</p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <UsersRound className="size-4" /> {detail.activeMemberCount} members
              </span>
              {group.visibility === "private" && (
                <span className="flex items-center gap-1.5">
                  <Lock className="size-4" /> Private
                </span>
              )}
            </div>
            <div className="mt-2 max-w-md">
              <FollowPreview targetType="group" targetId={id} preview={detail.followPreview} currentUserId={user.id} />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <GroupJoinButton groupId={id} status={me.status} isOwner={group.ownerId === user.id} />
            <FollowButton targetType="group" targetId={id} following={me.following} />
            {me.isAdmin && (
              <GroupProfileEdit
                groupId={id}
                name={group.name}
                description={group.description}
                avatarSeed={group.avatarSeed}
                visibility={group.visibility}
              />
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {me.canViewWall && wall ? (
            <Wall
              targetType="group"
              targetId={id}
              initial={wall}
              currentUser={{ id: user.id, displayName: user.displayName, avatarSeed: user.avatarSeed }}
            />
          ) : (
            <Card className="flex flex-col items-center justify-center gap-3 p-12 text-center">
              <span className="grid size-14 place-items-center rounded-2xl bg-muted">
                <Lock className="size-7 text-muted-foreground" />
              </span>
              <p className="font-medium">Join this group to see updates</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Group walls are visible to members. Request to join above.
              </p>
            </Card>
          )}
        </div>

        <div>
          <GroupMembers
            groupId={id}
            members={detail.members}
            isAdmin={me.isAdmin}
            ownerId={group.ownerId}
            currentUserId={user.id}
          />
        </div>
      </div>
    </div>
  );
}
