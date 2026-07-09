import { getPageUser } from "@/lib/auth/current-user";
import { apiGet } from "@/lib/api/client";
import { FeedList } from "@/components/social/feed-list";
import type { Feed } from "@/lib/social/types";

export const metadata = { title: "Feed" };

export default async function FeedPage() {
  const user = await getPageUser();
  const feed = await apiGet<Feed>("/social/feed");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Feed</h1>
        <p className="mt-1 text-muted-foreground">
          Updates from the people, projects, and groups you follow.
        </p>
      </div>
      <FeedList
        initial={feed}
        currentUser={{ id: user.id, displayName: user.displayName, avatarSeed: user.avatarSeed }}
      />
    </div>
  );
}
