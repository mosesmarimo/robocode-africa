import Link from "next/link";
import { Zap, CheckCircle2, Circle, Swords } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TRACK_LABELS } from "@/lib/domain/constants";
import { cn } from "@/lib/utils";

export const metadata = { title: "Challenges" };

const DIFFICULTY_VARIANT = {
  beginner: "success",
  intermediate: "warning",
  advanced: "destructive",
} as const;

const TRACK_ALL = "all";

export default async function ChallengesPage({
  searchParams,
}: {
  searchParams: Promise<{ track?: string }>;
}) {
  const [user, { track: trackParam }] = await Promise.all([
    getCurrentUser(),
    searchParams,
  ]);
  const me = user!;

  const tasks = await prisma.task.findMany({
    orderBy: [{ track: "asc" }, { difficulty: "asc" }],
  });

  // Fetch best submission per task for this user
  const submissions = await prisma.submission.findMany({
    where: { userId: me.id, taskId: { in: tasks.map((t) => t.id) } },
    select: { taskId: true, status: true },
    orderBy: { createdAt: "desc" },
  });

  // Map taskId → best status (passed wins over failed)
  const bestStatus = new Map<string, string>();
  for (const s of submissions) {
    const cur = bestStatus.get(s.taskId);
    if (!cur || s.status === "passed") bestStatus.set(s.taskId, s.status);
  }

  const tabs = [
    { value: TRACK_ALL, label: "All" },
    { value: "robotics", label: TRACK_LABELS.robotics },
    { value: "coding", label: TRACK_LABELS.coding },
    { value: "ai", label: TRACK_LABELS.ai },
  ];

  const activeTab = tabs.find((t) => t.value === trackParam)?.value ?? TRACK_ALL;

  function filterTasks(tab: string) {
    if (tab === TRACK_ALL) return tasks;
    return tasks.filter((t) => t.track === tab);
  }

  const passedCount = tasks.filter((t) => bestStatus.get(t.id) === "passed").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Challenges</h1>
          <p className="text-muted-foreground">
            Solve coding &amp; robotics tasks, earn RoboPoints, and climb the leaderboard.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5">
          <CheckCircle2 className="size-4 text-success" />
          <span className="text-sm font-medium">
            <span className="text-success font-bold">{passedCount}</span>
            <span className="text-muted-foreground"> / {tasks.length} solved</span>
          </span>
        </div>
      </div>

      {tasks.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 p-12 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Swords className="size-7" />
          </span>
          <p className="font-medium">No challenges yet</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Check back soon — new challenges are added regularly!
          </p>
        </Card>
      ) : (
        <Tabs defaultValue={activeTab}>
          <TabsList className="mb-4">
            {tabs.map((t) => (
              <TabsTrigger key={t.value} value={t.value} asChild>
                <Link href={t.value === TRACK_ALL ? "/app/challenges" : `/app/challenges?track=${t.value}`}>
                  {t.label}
                </Link>
              </TabsTrigger>
            ))}
          </TabsList>

          {tabs.map((tab) => {
            const filtered = filterTasks(tab.value);
            return (
              <TabsContent key={tab.value} value={tab.value}>
                {filtered.length === 0 ? (
                  <Card className="flex flex-col items-center justify-center gap-3 p-10 text-center">
                    <span className="grid size-12 place-items-center rounded-2xl bg-muted text-muted-foreground">
                      <Swords className="size-6" />
                    </span>
                    <p className="text-sm text-muted-foreground">No {tab.label} challenges yet.</p>
                  </Card>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filtered.map((task) => {
                      const status = bestStatus.get(task.id);
                      const isPassed = status === "passed";
                      const isTried = !!status;
                      return (
                        <Link key={task.id} href={`/app/challenges/${task.slug}`}>
                          <Card
                            className={cn(
                              "group h-full p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg",
                              isPassed && "border-success/40",
                            )}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex flex-wrap gap-1.5">
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
                              </div>
                              {isPassed ? (
                                <CheckCircle2 className="size-5 shrink-0 text-success" aria-label="Solved" />
                              ) : isTried ? (
                                <Circle className="size-5 shrink-0 text-muted-foreground" aria-label="Attempted" />
                              ) : null}
                            </div>

                            <p className="mt-3 font-semibold leading-snug group-hover:text-primary">{task.title}</p>
                            {task.description && (
                              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{task.description}</p>
                            )}

                            <div className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-accent-foreground">
                              <Zap className="size-4 text-accent-foreground/80" />
                              {task.points} pts
                            </div>
                          </Card>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      )}
    </div>
  );
}
