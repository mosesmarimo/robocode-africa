"use client";

import { useState, useTransition } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createPost } from "@/lib/social/actions";
import type { Post } from "@/lib/social/types";

interface PostComposerProps {
  targetType: "project" | "group" | "user";
  targetId: string;
  onPosted?: (postId: string, body: string, status: string) => void;
  placeholder?: string;
}

export function PostComposer({ targetType, targetId, onPosted, placeholder }: PostComposerProps) {
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed) return;
    startTransition(async () => {
      const r = await createPost({ targetType, targetId, body: trimmed });
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      if (r.data.status === "blocked") {
        toast.warning("Your post was held for review by our safety filter.");
      } else {
        toast.success("Posted!");
      }
      onPosted?.(r.data.postId, trimmed, r.data.status);
      setBody("");
    });
  }

  const defaultPlaceholder = targetType === "group" ? "Post to the group…" : "Share an update…";

  return (
    <form onSubmit={submit} className="space-y-2.5">
      <Textarea
        aria-label="Write a post"
        placeholder={placeholder ?? defaultPlaceholder}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={2000}
        rows={3}
        disabled={pending}
      />
      <div className="flex items-center justify-end gap-3">
        <span className="text-xs text-muted-foreground" aria-hidden>{body.length}/2000</span>
        <Button type="submit" variant="gradient" size="sm" disabled={pending || body.trim().length === 0}>
          <Send className="size-3.5" /> {pending ? "Posting…" : "Post"}
        </Button>
      </div>
    </form>
  );
}

/** Build a local optimistic Post for prepending after a successful compose. */
export function buildOptimisticPost(
  postId: string,
  body: string,
  status: string,
  targetType: "project" | "group" | "user",
  targetId: string,
  author: Post["author"],
): Post {
  return {
    id: postId,
    targetType,
    targetId,
    body,
    attachments: [],
    status,
    author,
    likeCount: 0,
    commentCount: 0,
    likedByMe: false,
    createdAt: new Date().toISOString(),
    recentComments: [],
    canArchive: true,
    context: null,
  };
}
