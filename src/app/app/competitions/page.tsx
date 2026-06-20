import Link from "next/link";
import { Trophy, CalendarDays, Users, Globe, School, Building2 } from "lucide-react";
import { getCurrentUser, getPageUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/app/stat-card";
import { TRACK_LABELS } from "@/lib/domain/constants";

export const metadata = { title: "Competitions" };

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

function formatDateRange(startsAt: Date | null, endsAt: Date | null): string {
  if (!startsAt && !endsAt) return "Dates TBC";
  const fmt = (d: Date) =>
    d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  if (startsAt && endsAt) return `${fmt(startsAt)} – ${fmt(endsAt)}`;
  if (startsAt) return `Starts ${fmt(startsAt)}`;
  if (endsAt) return `Ends ${fmt(endsAt)}`;
  return "";
}

export default async function CompetitionsPage() {
  const user = (await getPageUser());
  const isPlatformStaff = user.role === "super_admin" || user.role === "moderator";

  // Platform staff see all; others see global (tenantId null) + their school's
  const competitions = await prisma.competition.findMany({
    where: isPlatformStaff
      ? {}
      : { OR: [{ tenantId: null }, { tenantId: user.tenantId }] },
    include: {
      _count: { select: { entries: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Group by status: live → upcoming → judging → closed
  const STATUS_ORDER = ["live", "upcoming", "judging", "closed"];
  const grouped: Record<string, typeof competitions> = {};
  for (const s of STATUS_ORDER) grouped[s] = [];
  for (const c of competitions) {
    const bucket = STATUS_ORDER.includes(c.status) ? c.status : "closed";
    grouped[bucket].push(c);
  }

  const liveCount = grouped["live"].length;
  const upcomingCount = grouped["upcoming"].length;
  const totalEntrants = competitions.reduce((sum, c) => sum + c._count.entries, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold">Competitions</h1>
        <p className="text-muted-foreground">
          Challenge yourself, represent your school, and win RoboPoints.
        </p>
      </div>

      {/* Stats row */}
      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Live now" value={liveCount} icon="trophy" tone="success" />
        <StatCard label="Upcoming" value={upcomingCount} icon="calendar-days" tone="accent" />
        <StatCard label="Total entrants" value={totalEntrants} icon="users" tone="primary" />
      </section>

      {/* Sections per status */}
      {competitions.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 p-12 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Trophy className="size-7" />
          </span>
          <p className="font-medium">No competitions yet</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Check back soon — exciting robotics, coding and AI competitions are on the way!
          </p>
        </Card>
      ) : (
        <>
          {(["live", "upcoming", "judging", "closed"] as const).map((status) => {
            const items = grouped[status];
            if (items.length === 0) return null;

            const sectionLabel =
              status === "live"
                ? "Live now"
                : status === "upcoming"
                  ? "Upcoming"
                  : status === "judging"
                    ? "Judging in progress"
                    : "Closed";

            return (
              <section key={status}>
                <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {status === "live" && (
                    <span className="relative flex size-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                      <span className="relative inline-flex size-2 rounded-full bg-success" />
                    </span>
                  )}
                  {sectionLabel}
                </h2>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((comp) => {
                    const trackLabel =
                      TRACK_LABELS[comp.type as keyof typeof TRACK_LABELS] ?? comp.type;
                    const scopeLabel = SCOPE_LABEL[comp.scope] ?? comp.scope;
                    const ScopeIcon = SCOPE_ICON[comp.scope] ?? Globe;
                    const dateRange = formatDateRange(comp.startsAt, comp.endsAt);

                    return (
                      <Link key={comp.id} href={`/app/competitions/${comp.slug}`}>
                        <Card className="group h-full p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg">
                          {/* Status + Type badges */}
                          <div className="flex flex-wrap items-center gap-2">
                            {status === "live" && (
                              <Badge variant="success" className="gap-1">
                                <span className="relative flex size-1.5">
                                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                                  <span className="relative inline-flex size-1.5 rounded-full bg-current" />
                                </span>
                                Live
                              </Badge>
                            )}
                            {status === "upcoming" && <Badge variant="accent">Upcoming</Badge>}
                            {status === "judging" && <Badge variant="warning">Judging</Badge>}
                            {status === "closed" && <Badge variant="muted">Closed</Badge>}
                            <Badge variant="secondary" className="capitalize">
                              {trackLabel}
                            </Badge>
                          </div>

                          {/* Title */}
                          <p className="mt-3 font-display font-semibold leading-snug group-hover:text-primary">
                            {comp.title}
                          </p>

                          {/* Description */}
                          {comp.description && (
                            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                              {comp.description}
                            </p>
                          )}

                          {/* Meta row */}
                          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <ScopeIcon className="size-3.5" />
                              {scopeLabel}
                            </span>
                            <span className="flex items-center gap-1">
                              <CalendarDays className="size-3.5" />
                              {dateRange}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="size-3.5" />
                              {comp._count.entries}{" "}
                              {comp._count.entries === 1 ? "entry" : "entries"}
                            </span>
                          </div>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </>
      )}
    </div>
  );
}
