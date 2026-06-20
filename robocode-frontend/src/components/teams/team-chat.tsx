"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { Send, ShieldAlert, Clock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, initials, formatRelative } from "@/lib/utils";
import { postMessage } from "@/lib/teams/actions";

// ---------------------------------------------------------------------------
// Types mirroring what the page passes in
// ---------------------------------------------------------------------------

export type ChatMessageItem = {
  id: string;
  body: string;
  status: string; // "approved" | "blocked" | "pending"
  createdAt: Date;
  userId: string;
  user: {
    id: string;
    displayName: string;
  };
};

interface TeamChatProps {
  teamId: string;
  currentUserId: string;
  isStaff: boolean;
  initialMessages: ChatMessageItem[];
}

// ---------------------------------------------------------------------------
// TeamChat
// ---------------------------------------------------------------------------

export function TeamChat({ teamId, currentUserId, isStaff, initialMessages }: TeamChatProps) {
  const [messages, setMessages] = useState<ChatMessageItem[]>(initialMessages);
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed) return;

    // Optimistic: add as "pending"
    const optimistic: ChatMessageItem = {
      id: `opt-${Date.now()}`,
      body: trimmed,
      status: "pending",
      createdAt: new Date(),
      userId: currentUserId,
      user: { id: currentUserId, displayName: "You" },
    };
    setMessages((prev) => [...prev, optimistic]);
    setBody("");

    startTransition(async () => {
      const result = await postMessage(teamId, trimmed);
      if ("error" in result) {
        // Roll back optimistic message
        setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
        toast.error(result.error);
      } else {
        // Replace optimistic with real status
        setMessages((prev) =>
          prev.map((m) =>
            m.id === optimistic.id
              ? { ...m, id: result.messageId!, status: result.status! }
              : m,
          ),
        );
        if (result.status === "blocked") {
          toast.warning("Your message was held for review — it may contain unsafe content.");
        }
      }
    });
  }

  // Filter for display: show approved for everyone; show own blocked/pending to the sender; staff sees all
  const visible = messages.filter((m) => {
    if (m.status === "approved") return true;
    if (m.userId === currentUserId) return true; // own messages always visible (with label)
    if (isStaff) return true;
    return false;
  });

  return (
    <div className="flex flex-col gap-3">
      {/* Safety notice */}
      <div className="flex items-center gap-2 rounded-lg bg-primary/8 px-3 py-2 text-xs text-primary">
        <ShieldAlert className="size-3.5 shrink-0" />
        <span>Messages are moderated to keep everyone safe.</span>
      </div>

      {/* Message list */}
      <ScrollArea className="h-72 rounded-xl border border-border bg-background px-3 py-3">
        {visible.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No messages yet — say hello to your team!
          </p>
        )}
        <div className="space-y-3">
          {visible.map((msg) => {
            const isOwn = msg.userId === currentUserId;
            const isBlocked = msg.status === "blocked";
            const isPending = msg.status === "pending";

            return (
              <div key={msg.id} className={cn("flex gap-2.5", isOwn && "flex-row-reverse")}>
                <Avatar className="size-7 shrink-0">
                  <AvatarFallback className="text-[10px]">
                    {isOwn && isPending ? "…" : initials(msg.user.displayName)}
                  </AvatarFallback>
                </Avatar>
                <div className={cn("max-w-[75%] space-y-0.5", isOwn && "items-end flex flex-col")}>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-muted-foreground">
                      {isOwn ? "You" : msg.user.displayName}
                    </span>
                    <span className="text-[10px] text-muted-foreground/60">
                      {formatRelative(msg.createdAt)}
                    </span>
                    {isBlocked && (
                      <Badge variant="destructive" className="py-0 px-1.5 text-[10px]">
                        under review
                      </Badge>
                    )}
                    {isPending && (
                      <Clock className="size-3 text-muted-foreground/50" />
                    )}
                  </div>
                  <div
                    className={cn(
                      "rounded-2xl px-3.5 py-2 text-sm",
                      isOwn
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground",
                      isBlocked && !isOwn && !isStaff && "italic text-muted-foreground bg-muted/50",
                    )}
                  >
                    {isBlocked && !isOwn && !isStaff ? (
                      <span className="flex items-center gap-1.5 text-xs">
                        <ShieldAlert className="size-3" />
                        Message pending moderation review.
                      </span>
                    ) : (
                      msg.body
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div ref={bottomRef} />
      </ScrollArea>

      {/* Input */}
      <form onSubmit={handleSend} className="flex items-center gap-2">
        <input
          type="text"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Send a message to your team…"
          maxLength={500}
          disabled={pending}
          className="flex h-10 flex-1 rounded-lg border border-input bg-background px-3.5 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50"
        />
        <Button
          type="submit"
          variant="gradient"
          size="icon"
          disabled={pending || !body.trim()}
          aria-label="Send message"
        >
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  );
}
