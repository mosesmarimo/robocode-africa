import Link from "next/link";
import { Plus, Cpu, Code2, LayoutTemplate } from "lucide-react";
import { getPageUser } from "@/lib/auth/current-user";
import { apiGet } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { langFromFiles, CODE_LANG_MAP } from "@/lib/studio/coding";
import { StarterTemplateTabs } from "@/components/app/starter-template-tabs";
import { CodingExampleTabs } from "@/components/app/coding-example-tabs";

export const metadata = { title: "Projects" };

interface ProjectSummary {
  id: string;
  title: string;
  description: string | null;
  kind?: string;
  boardType: string;
  updatedAt: string;
}

interface CodingTemplate {
  id: string;
  title: string;
  description: string | null;
  codeFiles: { filename: string }[];
}

interface ProjectsResponse {
  projects: ProjectSummary[];
  templates: ProjectSummary[];
  codingTemplates: CodingTemplate[];
}

function templateLang(t: CodingTemplate): { id: string; label: string } {
  const first = t.codeFiles[0]?.filename ?? "main.txt";
  const id = langFromFiles([{ name: first, content: "" }]);
  return { id, label: CODE_LANG_MAP[id]?.label ?? id };
}

export default async function ProjectsPage() {
  await getPageUser();
  const { templates, codingTemplates } = await apiGet<ProjectsResponse>("/projects");

  // Group coding examples by language for display.
  const codingByLang = new Map<string, { label: string; items: CodingTemplate[] }>();
  for (const t of codingTemplates ?? []) {
    const { label } = templateLang(t);
    if (!codingByLang.has(label)) codingByLang.set(label, { label, items: [] });
    codingByLang.get(label)!.items.push(t);
  }
  const codingGroups = [...codingByLang.values()].sort((a, b) => a.label.localeCompare(b.label));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Your projects</h1>
          <p className="text-muted-foreground">Build, simulate and share your circuits in RoboCode Studio.</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="gradient" size="lg"><Plus className="size-4" /> New Project</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem asChild>
              <Link href="/studio/new"><Cpu className="size-4" /> Robotics project</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/studio/new?mode=coding"><Code2 className="size-4" /> Coding project</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {templates.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            <LayoutTemplate className="size-4" /> Starter templates
          </h2>
          <StarterTemplateTabs templates={templates} />
        </section>
      )}

      {codingGroups.length > 0 && (
        <section>
          <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            <Code2 className="size-4" /> Coding examples
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">Open a ready-made project in the Coding Studio — run it, tweak it, and learn.</p>
          <CodingExampleTabs groups={codingGroups} />
        </section>
      )}
    </div>
  );
}
