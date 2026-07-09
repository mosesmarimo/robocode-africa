import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { apiGet, ApiError } from "@/lib/api/client";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getBoard } from "@/lib/domain/boards";
import { emptyDiagram, type Diagram } from "@/lib/domain/diagram";
import { generateReadme } from "@/lib/studio/readme";
import { langForFile, type StudioFile } from "@/lib/studio/store";
import { ReadOnlyStudioClient } from "@/components/studio/readonly-studio-client";

interface SharedCodeFile {
  filename: string;
  language: string;
  content: string;
}

interface SharedProject {
  id: string;
  title: string;
  boardType: string;
  diagram: unknown;
  codeFiles: SharedCodeFile[];
}

/** Order files for display: sketch (.ino/.py) first, README last, the rest between. */
function buildFiles(raw: SharedCodeFile[], title: string, board: string, diagram: Diagram): StudioFile[] {
  const files: StudioFile[] = raw.map((f) => ({
    name: f.filename,
    language: f.language || langForFile(f.filename),
    content: f.content,
  }));
  if (!files.some((f) => f.name.endsWith(".ino") || f.name.endsWith(".py"))) {
    files.unshift({ name: "sketch.ino", language: "cpp", content: getBoard(board).starterCode });
  }
  if (!files.some((f) => f.name.toLowerCase() === "readme.md")) {
    files.push({ name: "README.md", language: "markdown", content: generateReadme(title, diagram) });
  }
  return files.sort((a, b) => {
    const rank = (n: string) => (n.endsWith(".ino") || n.endsWith(".py") ? 0 : n.toLowerCase() === "readme.md" ? 2 : 1);
    return rank(a.name) - rank(b.name);
  });
}

async function fetchShared(shareId: string): Promise<SharedProject> {
  try {
    const { project } = await apiGet<{ project: SharedProject }>(`/public/projects/${shareId}`);
    return project;
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ shareId: string }> }): Promise<Metadata> {
  const { shareId } = await params;
  try {
    const project = await fetchShared(shareId);
    return {
      title: `${project.title} · RoboCode`,
      description: `A shared RoboCode project for ${getBoard(project.boardType).name}. View the circuit, read the code, and run the simulation — no account needed.`,
    };
  } catch {
    return { title: "Shared project · RoboCode" };
  }
}

export default async function SharedProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ shareId: string }>;
  searchParams: Promise<{ ref?: string }>;
}) {
  const [{ shareId }, { ref }, viewer] = await Promise.all([params, searchParams, getCurrentUser()]);
  const project = await fetchShared(shareId);

  const diagram = (project.diagram as unknown as Diagram) ?? emptyDiagram(project.boardType);

  return (
    <ReadOnlyStudioClient
      initial={{
        title: project.title,
        board: project.boardType,
        diagram,
        files: buildFiles(project.codeFiles, project.title, project.boardType, diagram),
        sourceProjectId: project.id,
        authenticated: !!viewer,
        joinRef: ref ?? null,
      }}
    />
  );
}
