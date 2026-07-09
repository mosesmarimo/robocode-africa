import Link from "next/link";
import { Trophy, Cpu, Code2 } from "lucide-react";
import { getPageUser } from "@/lib/auth/current-user";
import { apiGet } from "@/lib/api/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initials } from "@/lib/utils";

export const metadata = { title: "Top Projects" };

interface ScoreData {
  usefulness: number;
  innovation: number;
  originality: number;
  complexity: number;
  overall: number;
  summary: string;
}
interface RankedProject {
  id: string;
  title: string;
  description: string | null;
  kind: string;
  boardType: string;
  aiScore: number;
  aiScoreData: ScoreData | null;
  owner: { id: string; displayName: string; avatarSeed: string };
}

const MEDAL = ["text-amber-400", "text-zinc-400", "text-amber-700"];

export default async function TopProjectsPage() {
  await getPageUser();
  const { projects } = await apiGet<{ projects: RankedProject[] }>("/projects/top");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 font-display text-3xl font-bold">
          <Trophy className="size-7 text-amber-500" /> Top Projects
        </h1>
        <p className="mt-1 text-muted-foreground">
          The best student projects, ranked by AI on usefulness, innovation, originality and complexity.
        </p>
      </div>

      {projects.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 p-12 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary"><Trophy className="size-7" /></span>
          <p className="font-medium">No ranked projects yet</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Open a project in the Studio and hit <span className="font-semibold">Rank with AI</span> to get scored and appear here.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {projects.map((p, i) => (
            <Card key={p.id} className="flex flex-wrap items-center gap-4 p-4">
              <div className={`w-8 shrink-0 text-center font-display text-2xl font-bold ${MEDAL[i] ?? "text-muted-foreground"}`}>
                {i + 1}
              </div>
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-gradient text-white">
                {p.kind === "coding" ? <Code2 className="size-5" /> : <Cpu className="size-5" />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/studio/${p.id}`} className="truncate font-semibold hover:text-primary">{p.title}</Link>
                  <Badge variant={p.kind === "coding" ? "secondary" : "muted"}>{p.kind === "coding" ? "Coding" : "Robotics"}</Badge>
                </div>
                <Link href={`/app/u/${p.owner.id}`} className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary">
                  <Avatar className="size-5"><AvatarFallback className="text-[9px]">{initials(p.owner.displayName)}</AvatarFallback></Avatar>
                  {p.owner.displayName}
                </Link>
                {p.aiScoreData && (
                  <div className="mt-2 hidden flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground sm:flex">
                    <span>Useful {p.aiScoreData.usefulness}</span>
                    <span>Innovation {p.aiScoreData.innovation}</span>
                    <span>Originality {p.aiScoreData.originality}</span>
                    <span>Complexity {p.aiScoreData.complexity}</span>
                  </div>
                )}
              </div>
              <div className="shrink-0 text-right">
                <div className="font-display text-3xl font-bold text-primary">{p.aiScore}</div>
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">/ 100</div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
