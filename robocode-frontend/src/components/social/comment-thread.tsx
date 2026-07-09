"use client";

import { useState, useTransition } from "react";
import { Send, Archive } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { UserAvatar } from "@/components/social/user-avatar";
import { formatRelative } from "@/lib/utils";
import { loadComments, addComment, archiveComment } from "@/lib/social/actions";
import type { PostComment } from "@/lib/social/types";

interface CommentThreadProps {
  postId: string;
  initial: PostComment[];
  commentCount: number;
  canModerate?: boolean;
  currentUser?: { id: string; displayName: string; avatarSeed?: string | null };
}

export function CommentThread({ postId, initial, commentCount, currentUser }: CommentThreadProps) {
  const [comments, setComments] = useState<PostComment[]>(initial);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loadedAll, setLoadedAll] = useState(false);
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();
  const [loadingMore, startLoading] = useTransition();

  const remaining = commentCount - comments.length;

  function loadMore() {
    startLoading(async () => {
      const r = await loadComments(postId, cursor ?? undefined);
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      // Merge, de-duplicating by id.
      setComments((prev) => {
        const seen = new Set(prev.map((c) => c.id));
        return [...prev, ...r.data.comments.filter((c) => !seen.has(c.id))];
      });
      setCursor(r.data.nextCursor);
      if (!r.data.nextCursor) setLoadedAll(true);
    });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed) return;
    startTransition(async () => {
      const r = await addComment(postId, trimmed);
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      if (r.data.status === "blocked") {
        toast.warning("Your comment was held for review by our safety filter.");
      } else if (currentUser) {
        setComments((prev) => [
          ...prev,
          {
            id: r.data.commentId,
            body: trimmed,
            status: r.data.status,
            author: {
              id: currentUser.id,
              displayName: currentUser.displayName,
              avatarSeed: currentUser.avatarSeed ?? "",
              role: "",
              tagline: null,
              level: 0,
              roboPoints: 0,
              schoolName: null,
            },
            createdAt: new Date().toISOString(),
            canArchive: true,
          },
        ]);
      }
      setBody("");
    });
  }

  function archive(id: string) {
    if (!window.confirm("Archive this comment? It will be hidden but kept on record.")) return;
    startTransition(async () => {
      const r = await archiveComment(id);
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      setComments((prev) => prev.filter((c) => c.id !== id));
      toast.success("Comment archived");
    });
  }

  return (
    <div className="mt-3 space-y-3 border-t border-border pt-3">
      {comments.length === 0 && (
        <p className="text-sm text-muted-foreground">No comments yet. Be the first!</p>
      )}
      {comments.map((c) => (
        <div key={c.id} className="flex items-start gap-2.5">
          <UserAvatar user={c.author} size={28} />
          <div className="min-w-0 flex-1">
            <div className="rounded-lg bg-muted/50 px-3 py-2">
              <div className="flex items-center gap-2">
                <a href={`/app/u/${c.author.id}`} className="text-sm font-semibold hover:text-primary">
                  {c.author.displayName}
                </a>
                <span className="text-xs text-muted-foreground">{formatRelative(c.createdAt)}</span>
              </div>
              <p className="mt-0.5 whitespace-pre-wrap text-sm">{c.body}</p>
            </div>
            {c.canArchive && (
              <button
                type="button"
                className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive disabled:opacity-50"
                onClick={() => archive(c.id)}
                disabled={pending}
              >
                <Archive className="size-3" /> Archive
              </button>
            )}
          </div>
        </div>
      ))}

      {!loadedAll && remaining > 0 && (
        <Button variant="ghost" size="sm" onClick={loadMore} disabled={loadingMore}>
          {loadingMore ? "Loading…" : `Load more comments (${remaining})`}
        </Button>
      )}

      {currentUser && (
        <form onSubmit={submit} className="flex items-start gap-2.5 pt-1">
          <UserAvatar user={currentUser} size={28} />
          <div className="flex-1 space-y-2">
            <Textarea
              aria-label="Write a comment"
              placeholder="Write a comment…"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={1000}
              rows={2}
              disabled={pending}
              className="min-h-[44px]"
            />
            <div className="flex items-center justify-end gap-3">
              <span className="text-xs text-muted-foreground" aria-hidden>{body.length}/1000</span>
              <Button type="submit" variant="outline" size="sm" disabled={pending || body.trim().length === 0}>
                <Send className="size-3.5" /> Comment
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
