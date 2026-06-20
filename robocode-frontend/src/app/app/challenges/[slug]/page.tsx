import Link from "next/link";
import { notFound } from "next/navigation";
import { Zap, ExternalLink, ArrowLeft, CheckCircle2, Circle } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { TRACK_LABELS } from "@/lib/domain/constants";
import { ChallengeSubmit } from "@/components/learn/challenge-submit";
import { getBoard } from "@/lib/domain/boards";

const DIFFICULTY_VARIANT = {
  beginner: "success",
  intermediate: "warning",
  advanced: "destructive",
} as const;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const task = await prisma.task.findUnique({ where: { slug } });
  return { title: task ? task.title : "Challenge" };
}

export default async function ChallengePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const [user, task] = await Promise.all([
    getCurrentUser(),
    prisma.task.findUnique({ where: { slug } }),
  ]);

  if (!task) notFound();

  const me = user!;

  // Fetch all submissions for this user+task to show history
  const submissions = await prisma.submission.findMany({
    where: { userId: me.id, taskId: task.id },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { id: true, status: true, score: true, createdAt: true },
  });

  const bestSubmission = submissions.find((s) => s.status === "passed") ?? submissions[0] ?? null;
  const isPassed = bestSubmission?.status === "passed";

  const board = getBoard(task.boardType ?? "arduino-uno");

  return (
    <div className="space-y-6">
      {/* Back nav */}
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/app/challenges">
            <ArrowLeft className="size-4" /> Back to Challenges
          </Link>
        </Button>
      </div>

      {/* Hero */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={
                DIFFICULTY_VARIANT[task.difficulty as keyof typeof DIFFICULTY_VARIANT] ?? "outline"
              }
              className="capitalize"
            >
              {task.difficulty}
            </Badge>
            <Badge variant="secondary" className="capitalize">
              {TRACK_LABELS[task.track as keyof typeof TRACK_LABELS] ?? task.track}
            </Badge>
            <Badge variant="muted">{board.shortName}</Badge>
            {isPassed && (
              <Badge variant="success" className="gap-1">
                <CheckCircle2 className="size-3" /> Solved
              </Badge>
            )}
          </div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">{task.title}</h1>
          {task.description && (
            <p className="max-w-2xl text-muted-foreground">{task.description}</p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2.5">
            <Zap className="size-4 text-accent-foreground/80" />
            <span className="font-bold">{task.points}</span>
            <span className="text-sm text-muted-foreground">pts</span>
          </div>
          <Button variant="outline" asChild>
            <Link href={`/studio/new?task=${task.slug}`} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="size-4" /> Open in Studio
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left: description + submission history */}
        <div className="space-y-6 lg:col-span-2">
          {/* Task info card */}
          <Card>
            <CardHeader>
              <CardTitle>Task details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Track</span>
                <span className="font-medium capitalize">
                  {TRACK_LABELS[task.track as keyof typeof TRACK_LABELS] ?? task.track}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Difficulty</span>
                <span className="font-medium capitalize">{task.difficulty}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Board</span>
                <span className="font-medium">{board.name}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Points</span>
                <span className="flex items-center gap-1 font-bold text-accent-foreground">
                  <Zap className="size-3.5" /> {task.points}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Submission history */}
          {submissions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Your submissions</CardTitle>
                <CardDescription>Last {submissions.length} attempts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {submissions.map((s) => (
                  <div key={s.id} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                    <div className="flex items-center gap-2">
                      {s.status === "passed" ? (
                        <CheckCircle2 className="size-4 text-success" />
                      ) : (
                        <Circle className="size-4 text-muted-foreground" />
                      )}
                      <span className="text-sm capitalize font-medium">{s.status}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      {s.score != null && (
                        <span className="font-semibold text-foreground">{s.score}%</span>
                      )}
                      <span>{new Date(s.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: submit panel */}
        <div className="lg:col-span-3">
          <ChallengeSubmit
            taskId={task.id}
            starterCode={task.starterCode ?? board.starterCode}
            alreadyPassed={isPassed}
          />
        </div>
      </div>
    </div>
  );
}
