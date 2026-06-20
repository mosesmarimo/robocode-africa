import { Trophy, Users, School } from "lucide-react";
import { getPageUser } from "@/lib/auth/current-user";
import { apiGet } from "@/lib/api/client";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/app/stat-card";
import { LeaderboardTabs } from "./leaderboard-tabs";

export const metadata = { title: "Leaderboard" };

interface LeaderboardStudent {
  id: string;
  displayName: string;
  roboPoints: number;
  level: number;
  tenantId: string;
  computedLevel: number;
}

interface LeaderboardTeam {
  id: string;
  name: string;
  roboPoints: number;
  tenantId: string;
  kind: string;
  _count: { members: number };
}

interface LeaderboardSchool {
  tenantId: string;
  name: string;
  totalPoints: number;
  studentCount: number;
}

interface LeaderboardResponse {
  isPlatformStaff: boolean;
  students: LeaderboardStudent[];
  teams: LeaderboardTeam[];
  schools: LeaderboardSchool[];
  userStudentRank: number;
  userSchoolRank: number;
  totalStudents: number;
  currentUserId: string;
  currentTenantId: string;
}

export default async function LeaderboardPage() {
  const user = (await getPageUser());

  const {
    isPlatformStaff,
    students: studentsWithLevel,
    teams: topTeams,
    schools: topSchools,
    userStudentRank,
    userSchoolRank,
    totalStudents,
    currentUserId,
    currentTenantId,
  } = await apiGet<LeaderboardResponse>("/leaderboard");

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="relative overflow-hidden rounded-2xl bg-brand-gradient p-6 text-white sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-12 size-56 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-8 left-1/3 size-40 rounded-full bg-white/8 blur-2xl" />
        <div className="relative z-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Trophy className="size-6 text-yellow-300" />
              <span className="text-sm font-medium text-white/80 uppercase tracking-wide">
                {isPlatformStaff ? "Platform-wide" : "School"}
              </span>
            </div>
            <h1 className="font-display text-3xl font-bold sm:text-4xl">Leaderboard</h1>
            <p className="mt-1.5 max-w-md text-white/85">
              See how you stack up against your fellow coders and robotics engineers!
            </p>
          </div>
        </div>
      </div>

      {/* Stats strip */}
      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label={userStudentRank > 0 ? `Your rank (#${userStudentRank})` : "Your rank"}
          value={userStudentRank > 0 ? `#${userStudentRank}` : "—"}
          icon="trophy"
          tone="accent"
          hint={userStudentRank > 0 ? "Keep climbing!" : "Complete tasks to rank"}
        />
        <StatCard
          label="Your RoboPoints"
          value={user.roboPoints.toLocaleString()}
          icon="zap"
          tone="primary"
        />
        <StatCard
          label="Total students"
          value={totalStudents.toLocaleString()}
          icon="users"
          tone="secondary"
          hint={isPlatformStaff ? "Across platform" : "In your school"}
        />
      </section>

      {/* Empty state if no data at all */}
      {studentsWithLevel.length === 0 && topTeams.length === 0 && topSchools.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 p-12 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Trophy className="size-7" />
          </span>
          <p className="font-medium">No rankings yet</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Complete tasks and earn RoboPoints to appear on the leaderboard!
          </p>
        </Card>
      ) : (
        <LeaderboardTabs
          students={studentsWithLevel}
          teams={topTeams}
          schools={topSchools}
          currentUserId={currentUserId}
          currentTenantId={currentTenantId}
          userSchoolRank={userSchoolRank}
        />
      )}
    </div>
  );
}
