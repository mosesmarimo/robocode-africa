import Link from "next/link";
import { Plus, Cpu, Clock, LayoutTemplate } from "lucide-react";
import { getPageUser } from "@/lib/auth/current-user";
import { apiGet } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getBoard } from "@/lib/domain/boards";
import { formatRelative } from "@/lib/utils";

export const metadata = { title: "Projects" };

interface ProjectSummary {
  id: string;
  title: string;
  description: string | null;
  boardType: string;
  updatedAt: string;
}

interface ProjectsResponse {
  projects: ProjectSummary[];
  templates: ProjectSummary[];
}

export default async function ProjectsPage() {
  await getPageUser();
  const { projects, templates } = await apiGet<ProjectsResponse>("/projects");

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Your projects</h1>
          <p className="text-muted-foreground">Build, simulate and share your circuits in RoboCode Studio.</p>
        </div>
        <Button variant="gradient" size="lg" asChild>
          <Link href="/studio/new"><Plus className="size-4" /> New Project</Link>
        </Button>
      </div>

      {templates.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            <LayoutTemplate className="size-4" /> Starter templates
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((t) => (
              <Link key={t.id} href={`/studio/${t.id}`}>
                <Card className="group h-full p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg">
                  <Badge variant="secondary">{getBoard(t.boardType).shortName}</Badge>
                  <p className="mt-3 font-semibold group-hover:text-primary">{t.title}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{t.description}</p>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">All projects</h2>
        {projects.length === 0 ? (
          <Card className="flex flex-col items-center justify-center gap-3 p-12 text-center">
            <span className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary"><Cpu className="size-7" /></span>
            <p className="font-medium">No projects yet</p>
            <p className="max-w-sm text-sm text-muted-foreground">Start your first circuit — drag in an Arduino, wire up an LED, and bring it to life.</p>
            <Button variant="gradient" asChild className="mt-2"><Link href="/studio/new"><Plus className="size-4" /> Create project</Link></Button>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <Link key={p.id} href={`/studio/${p.id}`}>
                <Card className="group h-full p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="grid size-10 place-items-center rounded-xl bg-brand-gradient text-white"><Cpu className="size-5" /></span>
                    <Badge variant="muted">{getBoard(p.boardType).shortName}</Badge>
                  </div>
                  <p className="mt-3 font-semibold group-hover:text-primary">{p.title}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.description ?? "Untitled circuit"}</p>
                  <p className="mt-3 flex items-center gap-1 text-xs text-muted-foreground"><Clock className="size-3" /> {formatRelative(p.updatedAt)}</p>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
