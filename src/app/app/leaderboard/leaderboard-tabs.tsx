"use client";

import { Users, Trophy, School } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn, initials } from "@/lib/utils";

// ── Medal helpers ───────────────────────────────────────────────────────────
const MEDAL_COLORS = [
  // gold
  "bg-yellow-400/20 text-yellow-600 border border-yellow-400/40 font-bold",
  // silver
  "bg-slate-300/30 text-slate-500 border border-slate-300/50 font-bold",
  // bronze
  "bg-orange-400/20 text-orange-600 border border-orange-300/50 font-bold",
] as const;

const MEDAL_RING = [
  "ring-2 ring-yellow-400/50",
  "ring-2 ring-slate-300/60",
  "ring-2 ring-orange-300/50",
] as const;

function MedalRank({ rank }: { rank: number }) {
  const idx = rank - 1;
  const label = rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉";
  return (
    <span
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center rounded-full text-sm",
        MEDAL_COLORS[idx],
      )}
      aria-label={`Rank ${rank}`}
    >
      {label}
    </span>
  );
}

function PlainRank({ rank }: { rank: number }) {
  return (
    <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-muted-foreground">
      {rank}
    </span>
  );
}

// ── Types ───────────────────────────────────────────────────────────────────
interface StudentEntry {
  id: string;
  displayName: string;
  roboPoints: number;
  level: number;
  tenantId: string;
  computedLevel: number;
}

interface TeamEntry {
  id: string;
  name: string;
  roboPoints: number;
  tenantId: string;
  kind: string;
  _count: { members: number };
}

interface SchoolEntry {
  tenantId: string;
  name: string;
  totalPoints: number;
  studentCount: number;
}

interface Props {
  students: StudentEntry[];
  teams: TeamEntry[];
  schools: SchoolEntry[];
  currentUserId: string;
  currentTenantId: string;
  userSchoolRank: number;
}

// ── Students tab ────────────────────────────────────────────────────────────
function StudentsLeaderboard({
  students,
  currentUserId,
}: {
  students: StudentEntry[];
  currentUserId: string;
}) {
  if (students.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center gap-3 p-12 text-center">
        <span className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Users className="size-7" />
        </span>
        <p className="font-medium">No students yet</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Students who complete tasks and earn RoboPoints will appear here.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Users className="size-5 text-primary" />
          Top Students
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y divide-border" role="list">
          {students.map((student, i) => {
            const rank = i + 1;
            const isMe = student.id === currentUserId;
            const isTop3 = rank <= 3;
            return (
              <li
                key={student.id}
                className={cn(
                  "flex items-center gap-3 px-5 py-3.5 transition-colors",
                  isMe && "bg-primary/6",
                  !isMe && "hover:bg-muted/50",
                )}
              >
                {/* Rank */}
                <div className="shrink-0">
                  {isTop3 ? <MedalRank rank={rank} /> : <PlainRank rank={rank} />}
                </div>

                {/* Avatar */}
                <Avatar
                  className={cn(
                    "size-9 shrink-0",
                    isTop3 && MEDAL_RING[rank - 1],
                    isMe && "ring-2 ring-primary/60",
                  )}
                >
                  <AvatarFallback>{initials(student.displayName)}</AvatarFallback>
                </Avatar>

                {/* Name + level */}
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "truncate font-medium",
                      isMe && "text-primary",
                    )}
                  >
                    {student.displayName}
                    {isMe && (
                      <span className="ml-1.5 text-xs font-normal text-primary/70">(you)</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">Level {student.computedLevel}</p>
                </div>

                {/* Points */}
                <div className="shrink-0 text-right">
                  <p
                    className={cn(
                      "font-bold tabular-nums",
                      isTop3 && rank === 1 && "text-yellow-600",
                      isTop3 && rank === 2 && "text-slate-500",
                      isTop3 && rank === 3 && "text-orange-600",
                      !isTop3 && "text-foreground",
                    )}
                  >
                    {student.roboPoints.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">pts</p>
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}

// ── Teams tab ───────────────────────────────────────────────────────────────
function TeamsLeaderboard({
  teams,
  currentTenantId,
}: {
  teams: TeamEntry[];
  currentTenantId: string;
}) {
  if (teams.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center gap-3 p-12 text-center">
        <span className="grid size-14 place-items-center rounded-2xl bg-secondary/15 text-secondary">
          <Trophy className="size-7" />
        </span>
        <p className="font-medium">No teams yet</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Create or join a team and start earning points together!
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Trophy className="size-5 text-primary" />
          Top Teams
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y divide-border" role="list">
          {teams.map((team, i) => {
            const rank = i + 1;
            const isTop3 = rank <= 3;
            const isMySchool = team.tenantId === currentTenantId;
            return (
              <li
                key={team.id}
                className={cn(
                  "flex items-center gap-3 px-5 py-3.5 transition-colors",
                  isMySchool && "bg-secondary/5",
                  !isMySchool && "hover:bg-muted/50",
                )}
              >
                {/* Rank */}
                <div className="shrink-0">
                  {isTop3 ? <MedalRank rank={rank} /> : <PlainRank rank={rank} />}
                </div>

                {/* Team avatar (initials) */}
                <Avatar
                  className={cn(
                    "size-9 shrink-0",
                    isTop3 && MEDAL_RING[rank - 1],
                  )}
                >
                  <AvatarFallback>{initials(team.name)}</AvatarFallback>
                </Avatar>

                {/* Name + member count */}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{team.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {team._count.members} member{team._count.members !== 1 ? "s" : ""}
                    {" · "}
                    <span className="capitalize">{team.kind.replace(/_/g, " ")}</span>
                  </p>
                </div>

                {/* Points + badge for same-school */}
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <p
                    className={cn(
                      "font-bold tabular-nums",
                      isTop3 && rank === 1 && "text-yellow-600",
                      isTop3 && rank === 2 && "text-slate-500",
                      isTop3 && rank === 3 && "text-orange-600",
                      !isTop3 && "text-foreground",
                    )}
                  >
                    {team.roboPoints.toLocaleString()}
                  </p>
                  {isMySchool && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      your school
                    </Badge>
                  )}
                  {!isMySchool && <p className="text-xs text-muted-foreground">pts</p>}
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}

// ── Schools tab ─────────────────────────────────────────────────────────────
function SchoolsLeaderboard({
  schools,
  currentTenantId,
}: {
  schools: SchoolEntry[];
  currentTenantId: string;
}) {
  if (schools.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center gap-3 p-12 text-center">
        <span className="grid size-14 place-items-center rounded-2xl bg-accent/18 text-accent-foreground">
          <School className="size-7" />
        </span>
        <p className="font-medium">No school data yet</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Schools will appear here as students earn RoboPoints.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <School className="size-5 text-primary" />
          Top Schools
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y divide-border" role="list">
          {schools.map((school, i) => {
            const rank = i + 1;
            const isTop3 = rank <= 3;
            const isMySchool = school.tenantId === currentTenantId;
            return (
              <li
                key={school.tenantId}
                className={cn(
                  "flex items-center gap-3 px-5 py-3.5 transition-colors",
                  isMySchool && "bg-accent/6",
                  !isMySchool && "hover:bg-muted/50",
                )}
              >
                {/* Rank */}
                <div className="shrink-0">
                  {isTop3 ? <MedalRank rank={rank} /> : <PlainRank rank={rank} />}
                </div>

                {/* School icon chip */}
                <span
                  className={cn(
                    "grid size-9 shrink-0 place-items-center rounded-xl text-sm font-bold",
                    isTop3 && rank === 1 && "bg-yellow-400/20 text-yellow-600",
                    isTop3 && rank === 2 && "bg-slate-200 text-slate-500",
                    isTop3 && rank === 3 && "bg-orange-200/70 text-orange-600",
                    !isTop3 && "bg-muted text-muted-foreground",
                    isMySchool && "ring-2 ring-accent/50",
                  )}
                  aria-hidden
                >
                  <School className="size-4" />
                </span>

                {/* Name + student count */}
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "truncate font-medium",
                      isMySchool && "text-primary",
                    )}
                  >
                    {school.name}
                    {isMySchool && (
                      <span className="ml-1.5 text-xs font-normal text-primary/70">(your school)</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {school.studentCount.toLocaleString()} student{school.studentCount !== 1 ? "s" : ""}
                  </p>
                </div>

                {/* Total points */}
                <div className="shrink-0 text-right">
                  <p
                    className={cn(
                      "font-bold tabular-nums",
                      isTop3 && rank === 1 && "text-yellow-600",
                      isTop3 && rank === 2 && "text-slate-500",
                      isTop3 && rank === 3 && "text-orange-600",
                      !isTop3 && "text-foreground",
                    )}
                  >
                    {school.totalPoints.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">total pts</p>
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}

// ── Root export ─────────────────────────────────────────────────────────────
export function LeaderboardTabs({
  students,
  teams,
  schools,
  currentUserId,
  currentTenantId,
  userSchoolRank,
}: Props) {
  return (
    <Tabs defaultValue="students">
      <TabsList>
        <TabsTrigger value="students" className="gap-1.5">
          <Users className="size-4" />
          Students
          {students.length > 0 && (
            <Badge variant="muted" className="ml-0.5 px-1.5 py-0 text-[10px]">
              {students.length}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="teams" className="gap-1.5">
          <Trophy className="size-4" />
          Teams
          {teams.length > 0 && (
            <Badge variant="muted" className="ml-0.5 px-1.5 py-0 text-[10px]">
              {teams.length}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="schools" className="gap-1.5">
          <School className="size-4" />
          Schools
          {userSchoolRank > 0 && userSchoolRank <= 10 && (
            <Badge variant="accent" className="ml-0.5 px-1.5 py-0 text-[10px]">
              #{userSchoolRank}
            </Badge>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="students">
        <StudentsLeaderboard students={students} currentUserId={currentUserId} />
      </TabsContent>

      <TabsContent value="teams">
        <TeamsLeaderboard teams={teams} currentTenantId={currentTenantId} />
      </TabsContent>

      <TabsContent value="schools">
        <SchoolsLeaderboard schools={schools} currentTenantId={currentTenantId} />
      </TabsContent>
    </Tabs>
  );
}
