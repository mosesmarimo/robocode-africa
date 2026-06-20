import { notFound } from "next/navigation";
import { apiGet, apiGetOrNull, ApiError } from "@/lib/api/client";
import { getPageUser } from "@/lib/auth/current-user";
import { getBoard } from "@/lib/domain/boards";
import { emptyDiagram, type Diagram } from "@/lib/domain/diagram";
import { generateReadme } from "@/lib/studio/readme";
import { StudioClient } from "@/components/studio/studio-client";
import type { StudioFile } from "@/lib/studio/store";

interface StudioTask {
  title: string;
  boardType: string | null;
  starterDiagram: unknown;
  starterCode: string | null;
}

interface StudioCodeFile {
  filename: string;
  content: string;
}

interface StudioProject {
  id: string;
  title: string;
  boardType: string;
  diagram: unknown;
  codeFiles: StudioCodeFile[];
}

function langFor(name: string): string {
  if (name.endsWith(".ino")) return "arduino";
  if (name.endsWith(".h") || name.endsWith(".cpp") || name.endsWith(".c")) return "cpp";
  if (name.endsWith(".md")) return "markdown";
  if (name.endsWith(".json")) return "json";
  return "text";
}

function buildFiles(raw: { name: string; language: string; content: string }[], title: string, diagram: Diagram, starterCode: string): StudioFile[] {
  const files = [...raw];
  if (!files.some((f) => f.name.endsWith(".ino"))) files.unshift({ name: "sketch.ino", language: "arduino", content: starterCode });
  if (!files.some((f) => f.name.toLowerCase() === "readme.md")) files.push({ name: "README.md", language: "markdown", content: generateReadme(title, diagram) });
  // sketch first, README last, others in between
  return files.sort((a, b) => {
    const rank = (n: string) => (n.endsWith(".ino") ? 0 : n.toLowerCase() === "readme.md" ? 2 : 1);
    return rank(a.name) - rank(b.name);
  });
}

export default async function StudioPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ task?: string }>;
}) {
  const [{ projectId }, { task: taskSlug }] = await Promise.all([params, searchParams]);
  await getPageUser();

  if (projectId === "new") {
    let title = "Untitled Project";
    let boardId = "arduino-uno";
    let diagram = emptyDiagram("arduino-uno");
    let starter = getBoard("arduino-uno").starterCode;
    if (taskSlug) {
      const data = await apiGetOrNull<{ task: StudioTask }>(`/challenges/${taskSlug}`);
      const task = data?.task;
      if (task) {
        title = `Challenge: ${task.title}`;
        boardId = task.boardType ?? "arduino-uno";
        diagram = (task.starterDiagram as unknown as Diagram) ?? emptyDiagram(boardId);
        starter = task.starterCode ?? getBoard(boardId).starterCode;
      }
    }
    return (
      <StudioClient
        initial={{ projectId: "new", title, diagram, files: buildFiles([], title, diagram, starter) }}
      />
    );
  }

  let project: StudioProject;
  try {
    const data = await apiGet<{ project: StudioProject }>(`/projects/${projectId}`);
    project = data.project;
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }

  const board = getBoard(project.boardType);
  const diagram = (project.diagram as unknown as Diagram) ?? emptyDiagram(project.boardType);
  const raw = project.codeFiles.map((f) => ({ name: f.filename, language: langFor(f.filename), content: f.content }));

  return (
    <StudioClient
      initial={{
        projectId: project.id,
        title: project.title,
        diagram,
        files: buildFiles(raw, project.title, diagram, board.starterCode),
      }}
    />
  );
}
