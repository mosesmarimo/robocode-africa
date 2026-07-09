"use client";

import { useState, useTransition } from "react";
import { Newspaper } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PostCard } from "@/components/social/post-card";
import { loadFeed } from "@/lib/social/actions";
import type { Feed, Post } from "@/lib/social/types";

interface FeedListProps {
  initial: Feed;
  currentUser?: { id: string; displayName: string; avatarSeed?: string | null };
}

export function FeedList({ initial, currentUser }: FeedListProps) {
  const [posts, setPosts] = useState<Post[]>(initial.posts);
  const [cursor, setCursor] = useState<string | null>(initial.nextCursor);
  const [loading, startLoading] = useTransition();

  function loadMore() {
    startLoading(async () => {
      const r = await loadFeed(cursor ?? undefined);
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      setPosts((prev) => {
        const seen = new Set(prev.map((p) => p.id));
        return [...prev, ...r.data.posts.filter((p) => !seen.has(p.id))];
      });
      setCursor(r.data.nextCursor);
    });
  }

  if (posts.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center gap-3 p-12 text-center">
        <span className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Newspaper className="size-7" />
        </span>
        <p className="font-medium">Your feed is empty</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Follow people, projects, and groups to see their updates here.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((p) => (
        <PostCard key={p.id} post={p} showContext currentUser={currentUser} />
      ))}
      {cursor && (
        <div className="flex justify-center">
          <Button variant="outline" size="sm" onClick={loadMore} disabled={loading}>
            {loading ? "Loading…" : "Load more"}
          </Button>
        </div>
      )}
    </div>
  );
}
