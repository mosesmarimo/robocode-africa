import { notFound } from "next/navigation";
import Link from "next/link";
import { Crown, Cpu, ArrowLeft, UserMinus, Zap, Users } from "lucide-react";
import { getCurrentUser, getPageUser } from "@/lib/auth/current-user";
import { isStaff } from "@/lib/domain/roles";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { StatCard } from "@/components/app/stat-card";
import { TeamChat } from "@/components/teams/team-chat";
import { getBoard } from "@/lib/domain/boards";
import { initials, formatRelative } from "@/lib/utils";
import { leaveTeam } from "@/lib/teams/actions";

export const metadata = { title: "Team" };

export default async function TeamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = (await getPageUser());
  const staffUser = isStaff(user.role);
  const isPlatformStaff =
    user.role === "super_admin" || user.role === "moderator";

  const team = await prisma.team.findUnique({
    where: { id },
    include: {
      captain: {
        select: { id: true, displayName: true, roboPoints: true },
      },
      members: {
        where: { status: "active" },
        include: {
          user: {
            select: { id: true, displayName: true, role: true, roboPoints: true },
          },
        },
        orderBy: [{ role: "asc" }, { id: "asc" }],
      },
    },
  });

  if (!team) notFound();

  // Visibility: only members or staff in same tenant (or platform staff) can view
  const myMembership = team.members.find((m) => m.userId === user.id);
  const sameSchoolStaff = staffUser && team.tenantId === user.tenantId;
  const canView = !!myMembership || sameSchoolStaff || isPlatformStaff;

  if (!canView) notFound();

  // Shared team projects
  const projects = await prisma.project.findMany({
    where: { teamId: team.id },
    orderBy: { updatedAt: "desc" },
    take: 8,
  });

  // Chat messages (approved for non-staff, all for staff)
  const chatMessages = await prisma.chatMessage.findMany({
    where: {
      teamId: team.id,
      ...(staffUser ? {} : { OR: [{ status: "approved" }, { userId: user.id }] }),
    },
    include: {
      user: { select: { id: true, displayName: true } },
    },
    orderBy: { createdAt: "asc" },
    take: 100,
  });

  const isMember = !!myMembership;
  const isCaptain = myMembership?.role === "captain";

  return (
    <div className="space-y-6">
      {/* Back link */}
      <div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/app/teams">
            <ArrowLeft className="size-4" /> All teams
          </Link>
        </Button>
      </div>

      {/* Team header */}
      <section className="relative overflow-hidden rounded-2xl bg-brand-gradient p-6 text-white sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-10 size-48 rounded-full bg-white/10 blur-2xl" />
        <div className="relative z-10 flex flex-wrap items-start gap-5">
          <Avatar className="size-16 text-2xl">
            <AvatarFallback className="text-xl font-bold">{initials(team.name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-bold sm:text-3xl">{team.name}</h1>
              <Badge variant="outline" className="border-white/40 text-white/90 text-xs">
                {team.kind === "school_rep" ? "School Rep" : "Intra-School"}
              </Badge>
            </div>
            {team.description && (
              <p className="mt-1.5 max-w-xl text-white/85 text-sm">{team.description}</p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-white/80">
              <span className="flex items-center gap-1.5">
                <Users className="size-3.5" />
                {team.members.length} {team.members.length === 1 ? "member" : "members"}
              </span>
              <span className="flex items-center gap-1.5">
                <Zap className="size-3.5" />
                {team.roboPoints.toLocaleString()} pts
              </span>
            </div>
          </div>
          {isMember && !isCaptain && (
            <form
              action={async () => {
                "use server";
                await leaveTeam(id);
              }}
            >
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                className="border border-white/30 text-white hover:bg-white/10 hover:text-white"
              >
                <UserMinus className="size-4" /> Leave team
              </Button>
            </form>
          )}
        </div>
      </section>

      {/* Stats row */}
      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Members" value={team.members.length} icon="users" tone="primary" />
        <StatCard label="Team RoboPoints" value={team.roboPoints.toLocaleString()} icon="zap" tone="accent" />
        <StatCard label="Shared projects" value={projects.length} icon="cpu" tone="secondary" />
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Members list */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle>Members</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {team.members.map((member) => (
              <div key={member.id} className="flex items-center gap-3">
                <Avatar className="size-9">
                  <AvatarFallback className="text-xs">{initials(member.user.displayName)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{member.user.displayName}</p>
                  <p className="text-xs text-muted-foreground">
                    {member.user.roboPoints.toLocaleString()} pts
                  </p>
                </div>
                {member.role === "captain" && (
                  <Crown className="size-4 shrink-0 text-yellow-500" aria-label="Captain" />
                )}
              </div>
            ))}
            {team.members.length === 0 && (
              <p className="text-sm text-muted-foreground">No active members.</p>
            )}
          </CardContent>
        </Card>

        {/* Projects + Chat */}
        <div className="space-y-6 lg:col-span-2">
          {/* Team Projects */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Shared projects</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {projects.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-8 text-center">
                  <span className="grid size-12 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Cpu className="size-6" />
                  </span>
                  <p className="text-sm text-muted-foreground">No team projects yet.</p>
                  {isMember && (
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/studio/new">Create a project</Link>
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {projects.map((p) => (
                    <Link key={p.id} href={`/studio/${p.id}`}>
                      <div className="group rounded-xl border border-border p-4 transition-all hover:border-primary/40 hover:shadow-md">
                        <div className="flex items-center justify-between">
                          <p className="truncate text-sm font-medium group-hover:text-primary">
                            {p.title}
                          </p>
                          <Badge variant="muted" className="ml-2 shrink-0">
                            {getBoard(p.boardType).shortName}
                          </Badge>
                        </div>
                        {p.description && (
                          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                            {p.description}
                          </p>
                        )}
                        <p className="mt-2 text-xs text-muted-foreground">
                          Updated {formatRelative(p.updatedAt)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Team Chat */}
          {(isMember || sameSchoolStaff || isPlatformStaff) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Team chat</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <Separator className="mb-4" />
                <TeamChat
                  teamId={team.id}
                  currentUserId={user.id}
                  isStaff={sameSchoolStaff || isPlatformStaff}
                  initialMessages={chatMessages.map((m) => ({
                    id: m.id,
                    body: m.body,
                    status: m.status,
                    createdAt: m.createdAt,
                    userId: m.userId,
                    user: { id: m.user.id, displayName: m.user.displayName },
                  }))}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
