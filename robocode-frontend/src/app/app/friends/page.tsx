import { getPageUser } from "@/lib/auth/current-user";
import { apiGet } from "@/lib/api/client";
import { FriendsTabs } from "@/components/social/friends-tabs";
import type { FriendsList } from "@/lib/social/types";

export const metadata = { title: "Friends" };

export default async function FriendsPage() {
  const user = await getPageUser();
  const data = await apiGet<FriendsList>("/social/friends");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Friends</h1>
        <p className="mt-1 text-muted-foreground">
          Connect with builders across schools, manage requests, and find new people.
        </p>
      </div>
      <FriendsTabs data={data} currentUserId={user.id} />
    </div>
  );
}
