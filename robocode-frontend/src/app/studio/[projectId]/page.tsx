import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getPageUser } from "@/lib/auth/current-user";
import { isStaff } from "@/lib/domain/roles";
import { getBoard } from "@/lib/domain/boards";
import { emptyDiagram, type Diagram } from "@/lib/domain/diagram";
import { generateReadme } from "@/lib/studio/readme";
import { StudioClient } from "@/components/studio/studio-client";
import type { StudioFile } from "@/lib/studio/store";

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
  const user = await getPageUser();

  if (projectId === "new") {
    let title = "Untitled Project";
    let boardId = "arduino-uno";
    let diagram = emptyDiagram("arduino-uno");
    let starter = getBoard("arduino-uno").starterCode;
    if (taskSlug) {
      const task = await prisma.task.findUnique({ where: { slug: taskSlug } });
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

  const project = await prisma.project.findUnique({ where: { id: projectId }, include: { codeFiles: true } });
  if (!project) notFound();

  const owner = project.ownerId === user.id;
  const staffSameTenant = isStaff(user.role) && project.tenantId === user.tenantId;
  const sharedInTenant = project.visibility !== "private" && project.tenantId === user.tenantId;
  const isPublic = project.visibility === "public";
  if (!(owner || staffSameTenant || sharedInTenant || isPublic)) notFound();

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
