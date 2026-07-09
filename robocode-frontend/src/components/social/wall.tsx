"use client";

import { useState, useTransition } from "react";
import { Newspaper } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PostCard } from "@/components/social/post-card";
import { PostComposer, buildOptimisticPost } from "@/components/social/post-composer";
import { loadWall } from "@/lib/social/actions";
import type { Wall as WallType, Post } from "@/lib/social/types";

interface WallProps {
  targetType: "project" | "group" | "user";
  targetId: string;
  initial: WallType;
  currentUser?: { id: string; displayName: string; avatarSeed?: string | null };
}

export function Wall({ targetType, targetId, initial, currentUser }: WallProps) {
  const [posts, setPosts] = useState<Post[]>(initial.posts);
  const [cursor, setCursor] = useState<string | null>(initial.nextCursor);
  const [loading, startLoading] = useTransition();

  function loadMore() {
    startLoading(async () => {
      const r = await loadWall(targetType, targetId, cursor ?? undefined);
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

  function onPosted(postId: string, body: string, status: string) {
    const author = currentUser
      ? {
          id: currentUser.id,
          displayName: currentUser.displayName,
          avatarSeed: currentUser.avatarSeed ?? "",
          role: "",
          tagline: null,
          level: 0,
          roboPoints: 0,
          schoolName: null,
        }
      : posts[0]?.author;
    if (!author) return;
    setPosts((prev) => [
      buildOptimisticPost(postId, body, status, targetType, targetId, author),
      ...prev,
    ]);
  }

  return (
    <div className="space-y-4">
      {initial.canPost && (
        <Card className="p-5">
          <PostComposer targetType={targetType} targetId={targetId} onPosted={onPosted} />
        </Card>
      )}

      {posts.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 p-12 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Newspaper className="size-7" />
          </span>
          <p className="font-medium">No posts yet</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            {initial.canPost ? "Be the first to share an update here." : "Check back later for updates."}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {posts.map((p) => (
            <PostCard key={p.id} post={p} currentUser={currentUser} />
          ))}
        </div>
      )}

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
