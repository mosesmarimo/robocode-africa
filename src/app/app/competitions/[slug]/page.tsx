import { notFound } from "next/navigation";
import {
  CalendarDays,
  Globe,
  School,
  Building2,
  Trophy,
  Clock,
  ListChecks,
  Users,
} from "lucide-react";
import { getCurrentUser, getPageUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { EnterButton } from "@/components/competitions/enter-button";
import { TRACK_LABELS } from "@/lib/domain/constants";
import { initials } from "@/lib/utils";

export const metadata = { title: "Competition" };

const SCOPE_LABEL: Record<string, string> = {
  intra_school: "Intra-school",
  inter_school: "Inter-school",
  global: "Global",
};

const SCOPE_ICON: Record<string, React.ElementType> = {
  intra_school: School,
  inter_school: Building2,
  global: Globe,
};

function formatDate(d: Date | null): string {
  if (!d) return "TBC";
  return d.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });
}

export default async function CompetitionDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = (await getPageUser());
  const isPlatformStaff = user.role === "super_admin" || user.role === "moderator";

  const competition = await prisma.competition.findUnique({
    where: { slug },
    include: {
      rounds: { orderBy: { order: "asc" } },
      entries: {
        orderBy: { totalScore: "desc" },
        include: {
          team: { select: { id: true, name: true, avatarSeed: true } },
        },
      },
    },
  });

  if (!competition) notFound();

  // Scope guard: non-platform-staff can only see global or their school's competitions
  if (!isPlatformStaff) {
    if (competition.tenantId !== null && competition.tenantId !== user.tenantId) {
      notFound();
    }
  }

  // Check if the current user already has their own entry
  const hasEntered = competition.entries.some((e) => e.userId === user.id);
  const canEnter =
    !hasEntered && (competition.status === "live" || competition.status === "upcoming");

  const trackLabel =
    TRACK_LABELS[competition.type as keyof typeof TRACK_LABELS] ?? competition.type;
  const scopeLabel = SCOPE_LABEL[competition.scope] ?? competition.scope;
  const ScopeIcon = SCOPE_ICON[competition.scope] ?? Globe;

  return (
    <div className="space-y-6">
      {/* Hero card */}
      <Card className="overflow-hidden">
        <div className="relative bg-brand-gradient p-6 text-white sm:p-8">
          <div className="pointer-events-none absolute -right-8 -top-8 size-40 rounded-full bg-white/10 blur-2xl" />
          <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* Status + track */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {competition.status === "live" && (
                  <Badge variant="success" className="gap-1 border-white/30 bg-white/20 text-white">
                    <span className="relative flex size-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                      <span className="relative inline-flex size-1.5 rounded-full bg-current" />
                    </span>
                    Live
                  </Badge>
                )}
                {competition.status === "upcoming" && (
                  <Badge className="bg-white/20 text-white border-white/30">Upcoming</Badge>
                )}
                {competition.status === "judging" && (
                  <Badge className="bg-white/20 text-white border-white/30">Judging</Badge>
                )}
                {competition.status === "closed" && (
                  <Badge className="bg-white/20 text-white border-white/30">Closed</Badge>
                )}
                <Badge className="bg-white/20 text-white border-white/30 capitalize">
                  {trackLabel}
                </Badge>
              </div>

              <h1 className="font-display text-2xl font-bold sm:text-3xl">{competition.title}</h1>

              {competition.description && (
                <p className="mt-2 max-w-2xl text-white/85">{competition.description}</p>
              )}

              {/* Meta */}
              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-white/80">
                <span className="flex items-center gap-1.5">
                  <ScopeIcon className="size-4" />
                  {scopeLabel}
                </span>
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="size-4" />
                  {formatDate(competition.startsAt)} – {formatDate(competition.endsAt)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="size-4" />
                  {competition.entries.length}{" "}
                  {competition.entries.length === 1 ? "entry" : "entries"}
                </span>
              </div>
            </div>

            {/* Enter button */}
            {canEnter && (
              <div className="shrink-0">
                <EnterButton competitionId={competition.id} />
              </div>
            )}
            {hasEntered && (
              <Badge className="shrink-0 bg-white/20 text-white border-white/30 px-3 py-1.5 text-sm">
                ✓ Entered
              </Badge>
            )}
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: rounds + rules */}
        <div className="space-y-6 lg:col-span-1">
          {/* Rounds */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ListChecks className="size-4 text-primary" />
                Rounds
              </CardTitle>
            </CardHeader>
            <CardContent>
              {competition.rounds.length === 0 ? (
                <p className="text-sm text-muted-foreground">Rounds will be announced soon.</p>
              ) : (
                <ol className="space-y-4">
                  {competition.rounds.map((round, idx) => (
                    <li key={round.id} className="flex items-start gap-3">
                      <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-primary/12 text-xs font-bold text-primary">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="font-medium leading-snug">{round.name}</p>
                        {(round.startsAt || round.endsAt) && (
                          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="size-3" />
                            {formatDate(round.startsAt)} – {formatDate(round.endsAt)}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>

          {/* Rules */}
          {competition.rules && Object.keys(competition.rules as object).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ListChecks className="size-4 text-primary" />
                  Rules
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none text-foreground">
                {Array.isArray((competition.rules as { items?: string[] }).items)
                  ? (
                      <ul className="space-y-1 text-sm">
                        {((competition.rules as { items: string[] }).items).map((rule, i) => (
                          <li key={i} className="text-muted-foreground">
                            {rule}
                          </li>
                        ))}
                      </ul>
                    )
                  : (
                      <p className="text-sm text-muted-foreground">
                        {JSON.stringify(competition.rules)}
                      </p>
                    )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: standings */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="size-4 text-primary" />
              Standings
            </CardTitle>
          </CardHeader>
          <CardContent>
            {competition.entries.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <Trophy className="size-6" />
                </span>
                <p className="font-medium">No entries yet</p>
                <p className="text-sm text-muted-foreground">
                  Be the first to enter and claim the top spot!
                </p>
              </div>
            ) : (
              <>
                {/* Table header */}
                <div className="mb-2 grid grid-cols-[2rem_1fr_6rem] gap-3 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <span>#</span>
                  <span>Entrant</span>
                  <span className="text-right">Score</span>
                </div>
                <Separator className="mb-3" />
                <ul className="space-y-2">
                  {competition.entries.map((entry, idx) => {
                    const name = entry.team?.name ?? "Solo entrant";
                    const isMe = entry.userId === user.id;
                    const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : null;

                    return (
                      <li
                        key={entry.id}
                        className={`grid grid-cols-[2rem_1fr_6rem] items-center gap-3 rounded-xl px-2 py-2.5 transition-colors ${
                          isMe
                            ? "bg-primary/8 ring-1 ring-primary/20"
                            : "hover:bg-muted/60"
                        }`}
                      >
                        {/* Rank */}
                        <span className="text-center text-sm font-bold text-muted-foreground">
                          {medal ?? idx + 1}
                        </span>

                        {/* Entrant */}
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Avatar className="size-8 shrink-0">
                            <AvatarFallback>{initials(name)}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{name}</p>
                            {isMe && (
                              <p className="text-xs text-primary font-medium">You</p>
                            )}
                          </div>
                        </div>

                        {/* Score */}
                        <span className="text-right text-sm font-semibold text-foreground">
                          {entry.totalScore.toLocaleString()}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
