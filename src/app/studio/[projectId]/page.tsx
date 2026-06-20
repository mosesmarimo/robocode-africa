import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, getPageUser } from "@/lib/auth/current-user";
import { isStaff } from "@/lib/domain/roles";
import { getBoard } from "@/lib/domain/boards";
import { emptyDiagram, type Diagram } from "@/lib/domain/diagram";
import { StudioClient } from "@/components/studio/studio-client";

export default async function StudioPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ task?: string }>;
}) {
  const [{ projectId }, { task: taskSlug }] = await Promise.all([params, searchParams]);
  const user = (await getPageUser());

  if (projectId === "new") {
    if (taskSlug) {
      const task = await prisma.task.findUnique({ where: { slug: taskSlug } });
      if (task) {
        const boardId = task.boardType ?? "arduino-uno";
        const board = getBoard(boardId);
        return (
          <StudioClient
            initial={{
              projectId: "new",
              title: `Challenge: ${task.title}`,
              diagram: task.starterDiagram
                ? (task.starterDiagram as unknown as import("@/lib/domain/diagram").Diagram)
                : emptyDiagram(boardId),
              code: task.starterCode ?? board.starterCode,
              language: board.defaultLanguage,
            }}
          />
        );
      }
    }

    const board = getBoard("arduino-uno");
    return (
      <StudioClient
        initial={{
          projectId: "new",
          title: "Untitled Project",
          diagram: emptyDiagram("arduino-uno"),
          code: board.starterCode,
          language: board.defaultLanguage,
        }}
      />
    );
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { codeFiles: true },
  });
  if (!project) notFound();

  const owner = project.ownerId === user.id;
  const staffSameTenant = isStaff(user.role) && project.tenantId === user.tenantId;
  const sharedInTenant = project.visibility !== "private" && project.tenantId === user.tenantId;
  const isPublic = project.visibility === "public";
  if (!(owner || staffSameTenant || sharedInTenant || isPublic)) notFound();

  const sketch = project.codeFiles.find((f) => f.filename === "sketch.ino") ?? project.codeFiles[0];
  const board = getBoard(project.boardType);

  return (
    <StudioClient
      initial={{
        projectId: project.id,
        title: project.title,
        diagram: (project.diagram as unknown as Diagram) ?? emptyDiagram(project.boardType),
        code: sketch?.content ?? board.starterCode,
        language: sketch?.language ?? board.defaultLanguage,
      }}
    />
  );
}
