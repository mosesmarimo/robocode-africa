"use client";

// Post-solve solutions gallery — see docs/superpowers/specs/2026-07-04-competitor-iterations.md
// (Iteration 3). Shown only after the caller has themselves passed the task
// (the entry point in challenge-submit.tsx only renders this once `celebrated`
// is true); the backend re-checks that gate on every read/write regardless.
// Anonymized: the backend response never carries an author id/displayName, so
// nothing here should try to reconstruct or display one.

import { useState, useTransition, type ReactNode } from "react";
import { Heart, Loader2, Lock, Sparkles, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { CodeBlock } from "@/components/learn/code-block";
import { cn } from "@/lib/utils";
import { getSolutions, likeSolution, type ChallengeSolution } from "@/lib/challenges/solutions-actions";

interface Props {
  taskId: string;
  /** Custom trigger. Defaults to a "See how others solved it" outline button. */
  children?: ReactNode;
}

type Status = "idle" | "loading" | "loaded" | "locked" | "error";

export function SolutionsGallery({ taskId, children }: Props) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [solutions, setSolutions] = useState<ChallengeSolution[]>([]);
  const [pending, startTransition] = useTransition();

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next && status === "idle") {
      setStatus("loading");
      startTransition(async () => {
        const r = await getSolutions(taskId);
        if (!r.ok) {
          setStatus(r.locked ? "locked" : "error");
          setMessage(r.error);
          return;
        }
        setSolutions(r.solutions);
        setStatus("loaded");
      });
    }
  }

  function toggleLike(submissionId: string) {
    // Optimistic flip, reconciled (or reverted) once the server responds.
    setSolutions((prev) =>
      prev.map((s) =>
        s.submissionId === submissionId
          ? { ...s, likedByMe: !s.likedByMe, likeCount: s.likeCount + (s.likedByMe ? -1 : 1) }
          : s,
      ),
    );
    startTransition(async () => {
      const r = await likeSolution(submissionId);
      if (!r.ok) {
        setSolutions((prev) =>
          prev.map((s) =>
            s.submissionId === submissionId
              ? { ...s, likedByMe: !s.likedByMe, likeCount: s.likeCount + (s.likedByMe ? -1 : 1) }
              : s,
          ),
        );
        toast.error(r.error);
        return;
      }
      const { liked, likeCount } = r;
      setSolutions((prev) =>
        prev.map((s) => (s.submissionId === submissionId ? { ...s, likedByMe: liked, likeCount } : s)),
      );
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children ?? (
          <Button variant="outline" className="w-full gap-2">
            <Users className="size-4" /> See how others solved it
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="size-5" /> Other students&apos; solutions
          </DialogTitle>
          <DialogDescription>
            Anonymized, read-only solutions from students who&apos;ve also passed this challenge. Give the ones
            you like a heart.
          </DialogDescription>
        </DialogHeader>

        {status === "loading" && (
          <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
            <Loader2 className="size-5 animate-spin" /> Loading solutions…
          </div>
        )}

        {status === "locked" && (
          <div className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
            <Lock className="size-6" />
            <p className="max-w-xs text-sm">{message ?? "Solve this challenge first to unlock other solutions."}</p>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
            <p className="text-sm">{message}</p>
          </div>
        )}

        {status === "loaded" && solutions.length === 0 && (
          <div className="py-10 text-center text-sm text-muted-foreground">
            No other solutions yet — check back soon.
          </div>
        )}

        {status === "loaded" && solutions.length > 0 && (
          <ScrollArea className="max-h-[60vh] pr-2">
            <div className="space-y-5">
              {solutions.map((s) => (
                <SolutionCard key={s.submissionId} solution={s} onToggleLike={toggleLike} disabled={pending} />
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}

function SolutionCard({
  solution,
  onToggleLike,
  disabled,
}: {
  solution: ChallengeSolution;
  onToggleLike: (submissionId: string) => void;
  disabled?: boolean;
}) {
  // null/"arduino" both mean the Arduino robotics track (see Task.language).
  const language = solution.language ?? "arduino";
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Badge variant="secondary" className="capitalize">
            {language}
          </Badge>
          {solution.exemplar && (
            <Badge variant="accent" className="gap-1">
              <Sparkles className="size-3" /> Exemplar
            </Badge>
          )}
        </div>
        <button
          type="button"
          onClick={() => onToggleLike(solution.submissionId)}
          disabled={disabled}
          aria-pressed={solution.likedByMe}
          aria-label={solution.likedByMe ? "Unlike this solution" : "Like this solution"}
          className={cn(
            "flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs font-medium transition-colors hover:bg-muted disabled:opacity-60",
            solution.likedByMe && "border-destructive/40 bg-destructive/10 text-destructive",
          )}
        >
          <Heart className={cn("size-3.5", solution.likedByMe && "fill-current")} />
          {solution.likeCount}
        </button>
      </div>
      <CodeBlock language={language} code={solution.code} />
    </div>
  );
}
