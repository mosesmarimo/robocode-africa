"use client";

import { useState, useTransition } from "react";
import { Trophy, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { scoreProject, type ProjectScore } from "@/lib/studio/actions";

const DIMS: { key: keyof ProjectScore; label: string }[] = [
  { key: "usefulness", label: "Usefulness" },
  { key: "innovation", label: "Innovation" },
  { key: "originality", label: "Originality" },
  { key: "complexity", label: "Complexity" },
];

export function RankButton({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const [score, setScore] = useState<ProjectScore | null>(null);
  const [points, setPoints] = useState<number | null>(null);
  const [pending, start] = useTransition();

  function rank() {
    if (projectId === "new") {
      toast.error("Save your project first, then rank it.");
      return;
    }
    setOpen(true);
    setScore(null);
    start(async () => {
      const r = await scoreProject(projectId);
      if (!r.ok || !r.score) {
        toast.error(r.error ?? "Couldn't rank this project.");
        setOpen(false);
        return;
      }
      setScore(r.score);
      setPoints(r.pointsAwarded ?? null);
    });
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={rank} disabled={pending} title="Rank this project with AI">
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Trophy className="size-4" />}
        <span className="hidden sm:inline">Rank with AI</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Trophy className="size-5 text-amber-500" /> AI Project Rank</DialogTitle>
            <DialogDescription>How your project scores on usefulness, innovation, originality and complexity.</DialogDescription>
          </DialogHeader>

          {!score ? (
            <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" /> Ranking your project…
            </div>
          ) : (
            <div className="space-y-4 pt-1">
              <div className="flex items-center gap-4 rounded-xl bg-brand-gradient p-4 text-white">
                <div className="text-4xl font-bold">{score.overall}</div>
                <div className="text-sm">
                  <p className="font-semibold">Overall score / 100</p>
                  {points != null && <p className="text-white/85">+{points} RoboPoints earned</p>}
                </div>
              </div>
              <div className="space-y-2.5">
                {DIMS.map((d) => (
                  <div key={d.key}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="font-medium">{d.label}</span>
                      <span className="text-muted-foreground">{score[d.key] as number}</span>
                    </div>
                    <Progress value={score[d.key] as number} />
                  </div>
                ))}
              </div>
              <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">{score.summary}</p>
            </div>
          )}

          <DialogFooter>
            <DialogClose asChild><Button variant="default">Done</Button></DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
