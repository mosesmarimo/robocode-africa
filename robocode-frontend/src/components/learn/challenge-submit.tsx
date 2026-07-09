"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { CheckCircle2, XCircle, Zap, PlayCircle, Terminal } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { submitSolution } from "@/lib/learn/actions";
import { getTracksForTask, type TaskTrackProgress } from "@/lib/tracks/actions";
import { SolutionsGallery } from "@/components/challenges/solutions-gallery";

interface GradeResult {
  passed: boolean;
  score: number;
  results: { description: string; ok: boolean }[];
  serial: string[];
  error?: string;
}

interface Props {
  taskId: string;
  starterCode: string;
  alreadyPassed?: boolean;
  /** Task language — a coding language (not arduino/null) shows program "Output"
   *  instead of the Arduino "Serial output". */
  language?: string | null;
}

export function ChallengeSubmit({ taskId, starterCode, alreadyPassed = false, language }: Props) {
  const isCoding = !!language && language !== "arduino";
  const [code, setCode] = useState(starterCode);
  const [result, setResult] = useState<GradeResult | null>(null);
  const [pending, startTransition] = useTransition();
  const [celebrated, setCelebrated] = useState(alreadyPassed);
  const [trackProgress, setTrackProgress] = useState<TaskTrackProgress[]>([]);

  // Post-pass track nudge — fetched once the celebration state flips true
  // (either from a fresh pass just below, or from `alreadyPassed` on mount).
  useEffect(() => {
    if (!celebrated) return;
    let cancelled = false;
    (async () => {
      const tracks = await getTracksForTask(taskId);
      if (!cancelled) setTrackProgress(tracks);
    })();
    return () => {
      cancelled = true;
    };
  }, [celebrated, taskId]);

  function handleSubmit() {
    startTransition(async () => {
      try {
        const res = await submitSolution(taskId, code);
        setResult(res);
        if (res.passed) {
          setCelebrated(true);
          toast.success(`Challenge passed! +${res.score}% score`, {
            description: "RoboPoints awarded. Keep it up! 🚀",
            duration: 5000,
          });
        } else {
          toast.error("Not quite — check the results below and try again.");
        }
      } catch (err) {
        toast.error("Submission failed. Please try again.");
        console.error(err);
      }
    });
  }

  const hasPassed = result?.passed ?? false;
  const hasResult = result !== null;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Your solution</CardTitle>
              <CardDescription>Write your code below, then run the auto-grader.</CardDescription>
            </div>
            {celebrated && !hasResult && (
              <Badge variant="success" className="gap-1">
                <CheckCircle2 className="size-3" /> Already solved
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="min-h-[320px] font-mono text-sm leading-relaxed"
            spellCheck={false}
            aria-label="Solution code editor"
            disabled={pending}
          />
          <Button
            variant="gradient"
            size="lg"
            className="w-full gap-2"
            onClick={handleSubmit}
            disabled={pending || !code.trim()}
          >
            {pending ? (
              <>
                <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Running checks…
              </>
            ) : (
              <>
                <PlayCircle className="size-4" />
                Run checks &amp; submit
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results panel */}
      {hasResult && (
        <Card
          className={cn(
            "border-2 transition-colors",
            hasPassed ? "border-success/60 bg-success/5" : "border-destructive/40 bg-destructive/5",
          )}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                {hasPassed ? (
                  <CheckCircle2 className="size-5 text-success" />
                ) : (
                  <XCircle className="size-5 text-destructive" />
                )}
                {hasPassed ? "All checks passed!" : "Some checks failed"}
              </CardTitle>
              <div className="flex items-center gap-1.5">
                <Zap className="size-4 text-accent-foreground/70" />
                <span className="text-xl font-bold">{result.score}%</span>
              </div>
            </div>

            {hasPassed && (
              <div className="mt-2 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm font-medium text-success">
                Brilliant work! 🎉 Your solution passed all auto-checks and RoboPoints have been awarded.
              </div>
            )}

            {result.error && (
              <div className="mt-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 font-mono text-xs text-destructive">
                <span className="font-semibold">Runtime error: </span>{result.error}
              </div>
            )}
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Check results */}
            {result.results.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Check results
                </p>
                <div className="space-y-1.5">
                  {result.results.map((r, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex items-start gap-2.5 rounded-lg px-3 py-2 text-sm",
                        r.ok ? "bg-success/10 text-success" : "bg-muted text-muted-foreground",
                      )}
                    >
                      {r.ok ? (
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-label="Passed" />
                      ) : (
                        <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" aria-label="Failed" />
                      )}
                      <span className={cn("leading-snug", !r.ok && "text-foreground")}>{r.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Program output (stdout for coding, Serial for Arduino) */}
            {result.serial.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <Terminal className="size-3.5" /> {isCoding ? "Output" : "Serial output"}
                  </p>
                  <ScrollArea className="max-h-40 rounded-lg border border-border bg-black/80">
                    <div className="p-3">
                      {result.serial.map((line, i) => (
                        <p key={i} className="font-mono text-xs text-green-400 leading-relaxed">
                          {line}
                        </p>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Post-pass track nudge — nothing renders when this task isn't part
          of any published track. */}
      {celebrated && trackProgress.length > 0 && (
        <div className="space-y-2 rounded-xl border border-border bg-muted/40 p-4">
          {trackProgress.map((t) => {
            const complete = t.itemCount > 0 && t.doneCount === t.itemCount;
            return (
              <div key={t.slug} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-sm">
                <span className="font-medium">
                  {t.title}: {t.doneCount}/{t.itemCount}
                </span>
                {complete ? (
                  <Link href="/app/badges" className="font-medium text-primary hover:underline">
                    🎓 Track complete — view your certificate
                  </Link>
                ) : (
                  <Link href={`/app/tracks/${t.slug}`} className="text-primary hover:underline">
                    View track →
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Post-solve solutions gallery — only reachable once this task has
          been passed (the backend re-checks this gate on every request). */}
      {celebrated && <SolutionsGallery taskId={taskId} />}
    </div>
  );
}
