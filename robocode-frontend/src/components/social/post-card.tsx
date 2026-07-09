"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Heart, MessageCircle, MoreHorizontal, Archive, Flag, Cpu } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { UserAvatar } from "@/components/social/user-avatar";
import { CommentThread } from "@/components/social/comment-thread";
import { ReportDialog } from "@/components/social/report-dialog";
import { formatRelative, cn } from "@/lib/utils";
import { toggleLike, archivePost } from "@/lib/social/actions";
import type { Post } from "@/lib/social/types";

interface PostCardProps {
  post: Post;
  showContext?: boolean;
  currentUser?: { id: string; displayName: string; avatarSeed?: string | null };
}

function contextHref(ctx: NonNullable<Post["context"]>): string {
  if (ctx.type === "group") return `/app/groups/${ctx.id}`;
  if (ctx.type === "project") return `/app/projects/${ctx.id}`;
  return `/app/u/${ctx.id}`;
}

export function PostCard({ post, showContext, currentUser }: PostCardProps) {
  const [liked, setLiked] = useState(post.likedByMe);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [commentCount] = useState(post.commentCount);
  const [showComments, setShowComments] = useState(false);
  const [archived, setArchived] = useState(false);
  const [, startTransition] = useTransition();

  if (archived) return null;

  function like() {
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikeCount((c) => c + (nextLiked ? 1 : -1));
    startTransition(async () => {
      const r = await toggleLike(post.id);
      if (!r.ok) {
        setLiked(!nextLiked);
        setLikeCount((c) => c + (nextLiked ? -1 : 1));
        toast.error(r.error);
      } else {
        setLiked(r.data.liked);
        setLikeCount(r.data.likeCount);
      }
    });
  }

  function archive() {
    if (!window.confirm("Archive this post? It will be hidden but kept on record.")) return;
    startTransition(async () => {
      const r = await archivePost(post.id);
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      setArchived(true);
      toast.success("Post archived");
    });
  }

  return (
    <Card className="p-5">
      <div className="flex items-start gap-3">
        <UserAvatar user={post.author} size={40} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Link href={`/app/u/${post.author.id}`} className="truncate font-semibold hover:text-primary">
              {post.author.displayName}
            </Link>
            {post.status === "blocked" && (
              <Badge variant="warning" className="shrink-0">Under review</Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {post.author.schoolName && <>{post.author.schoolName} · </>}
            {formatRelative(post.createdAt)}
            {showContext && post.context && (
              <>
                {" · in "}
                <Link href={contextHref(post.context)} className="hover:text-primary">
                  {post.context.name}
                </Link>
              </>
            )}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger aria-label="Post options" className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
            <MoreHorizontal className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {post.canArchive && (
              <DropdownMenuItem onSelect={archive}>
                <Archive className="size-4" /> Archive
              </DropdownMenuItem>
            )}
            <ReportDialog targetType="post" targetId={post.id}>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <Flag className="size-4" /> Report
              </DropdownMenuItem>
            </ReportDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {post.body && <p className="mt-3 whitespace-pre-wrap text-sm">{post.body}</p>}

      {post.attachments.length > 0 && (
        <div className="mt-3 space-y-2">
          {post.attachments.map((a) => (
            <Link
              key={a.projectId}
              href={`/app/projects/${a.projectId}`}
              className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:border-primary/40 hover:bg-muted/40"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                <Cpu className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{a.title ?? "Project"}</p>
                {a.board && <p className="text-xs text-muted-foreground">{a.board}</p>}
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center gap-1 border-t border-border pt-2.5">
        <button
          type="button"
          onClick={like}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors hover:bg-muted",
            liked ? "text-destructive" : "text-muted-foreground",
          )}
        >
          <Heart className={cn("size-4", liked && "fill-current")} /> {likeCount}
        </button>
        <button
          type="button"
          onClick={() => setShowComments((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
        >
          <MessageCircle className="size-4" /> {commentCount}
        </button>
      </div>

      {showComments && (
        <CommentThread
          postId={post.id}
          initial={post.recentComments}
          commentCount={commentCount}
          currentUser={currentUser}
        />
      )}
    </Card>
  );
}
