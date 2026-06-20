import { Users, Zap, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatCard } from "@/components/app/stat-card";
import { CreateTeamDialog, JoinButton } from "@/components/teams/team-actions";
import { initials } from "@/lib/utils";
import { apiGet } from "@/lib/api/client";
import Link from "next/link";

export const metadata = { title: "Teams" };

interface TeamCaptain {
  id: string;
  displayName: string;
}

interface BrowseTeam {
  id: string;
  name: string;
  description: string | null;
  roboPoints: number;
  _count: { members: number };
  captain: TeamCaptain;
}

interface MyMembership {
  id: string;
  role: string;
  status: string;
  team: BrowseTeam;
}

interface TeamsResponse {
  myMemberships: MyMembership[];
  browseTeams: BrowseTeam[];
  totalPoints: number;
}

export default async function TeamsPage() {
  const { myMemberships, browseTeams, totalPoints } = await apiGet<TeamsResponse>("/teams");

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Teams</h1>
          <p className="mt-1 text-muted-foreground">
            Build with friends, compete together, and earn bonus RoboPoints.
          </p>
        </div>
        <CreateTeamDialog />
      </div>

      {/* Stats */}
      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard label="My teams" value={myMemberships.length} icon="users" tone="primary" />
        <StatCard label="Combined points" value={totalPoints.toLocaleString()} icon="zap" tone="accent" />
        <StatCard label="Teams in school" value={browseTeams.length + myMemberships.length} icon="layout-grid" tone="secondary" />
      </section>

      {/* My Teams */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Your teams
        </h2>
        {myMemberships.length === 0 ? (
          <Card className="flex flex-col items-center justify-center gap-3 p-12 text-center">
            <span className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Users className="size-7" />
            </span>
            <p className="font-medium">You&apos;re not in a team yet</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Create a team or join an existing one below to start collaborating and competing.
            </p>
            <CreateTeamDialog />
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {myMemberships.map((membership) => {
              const team = membership.team;
              const isCaptain = membership.role === "captain";
              return (
                <Link key={team.id} href={`/app/teams/${team.id}`}>
                  <Card className="group h-full p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-10">
                          <AvatarFallback>{initials(team.name)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate font-semibold group-hover:text-primary">{team.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {team._count.members} {team._count.members === 1 ? "member" : "members"}
                          </p>
                        </div>
                      </div>
                      {isCaptain && (
                        <Badge variant="accent" className="shrink-0">Captain</Badge>
                      )}
                    </div>
                    {team.description && (
                      <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{team.description}</p>
                    )}
                    <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-primary">
                      <Zap className="size-3.5" />
                      {team.roboPoints.toLocaleString()} pts
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Browse Teams */}
      {browseTeams.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Browse teams
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {browseTeams.map((team) => (
              <Card key={team.id} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="size-10">
                      <AvatarFallback>{initials(team.name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <Link
                        href={`/app/teams/${team.id}`}
                        className="truncate font-semibold hover:text-primary"
                      >
                        {team.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {team._count.members} {team._count.members === 1 ? "member" : "members"}
                        {" · "}
                        Cap. {team.captain.displayName.split(" ")[0]}
                      </p>
                    </div>
                  </div>
                  <JoinButton teamId={team.id} isMember={false} />
                </div>
                {team.description && (
                  <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{team.description}</p>
                )}
                <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-primary">
                  <Zap className="size-3.5" />
                  {team.roboPoints.toLocaleString()} pts
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {browseTeams.length === 0 && myMemberships.length > 0 && (
        <Card className="flex flex-col items-center justify-center gap-2 p-8 text-center">
          <Plus className="size-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No other teams in your school yet — invite a friend to start one!</p>
        </Card>
      )}
    </div>
  );
}
