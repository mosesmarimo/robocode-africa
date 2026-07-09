import { createHash } from "crypto";
import { notFound } from "next/navigation";
import { apiGet, apiGetOrNull, ApiError } from "@/lib/api/client";
import { getPageUser } from "@/lib/auth/current-user";
import { getBoard, type BoardId } from "@/lib/domain/boards";
import { emptyDiagram, type Diagram } from "@/lib/domain/diagram";
import { generateReadme } from "@/lib/studio/readme";
import { StudioClient } from "@/components/studio/studio-client";
import type { StudioFile } from "@/lib/studio/store";
import { decodeStudioCode, decodeStudioDiagram } from "@/lib/studio/open-in-studio";
import { sanitizeDiagram } from "@/lib/studio/sanitize-diagram";
import { CODE_LANG_MAP, type CodeLang } from "@/lib/studio/coding";

interface StudioTask {
  title: string;
  boardType: string | null;
  starterDiagram: unknown;
  starterCode: string | null;
  language?: string | null;
}

interface StudioCodeFile {
  filename: string;
  content: string;
  explanation?: string | null;
  explanationHash?: string | null;
}

interface StudioProject {
  id: string;
  title: string;
  kind?: string;
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
  // The main sketch matches the board's runtime: MicroPython boards (Pico) get
  // main.py, everything else sketch.ino — never inject a stray .ino next to a
  // project's existing main.py (or vice versa).
  const isMicroPython = getBoard(diagram.board).mcuTarget === "rp2040js";
  const isSketch = (n: string) => (isMicroPython ? n.endsWith(".py") : n.endsWith(".ino"));
  if (!files.some((f) => isSketch(f.name))) {
    files.unshift(
      isMicroPython
        ? { name: "main.py", language: "python", content: starterCode }
        : { name: "sketch.ino", language: "arduino", content: starterCode },
    );
  }
  if (!files.some((f) => f.name.toLowerCase() === "readme.md")) files.push({ name: "README.md", language: "markdown", content: generateReadme(title, diagram) });
  // sketch first, README last, others in between
  return files.sort((a, b) => {
    const rank = (n: string) => (isSketch(n) ? 0 : n.toLowerCase() === "readme.md" ? 2 : 1);
    return rank(a.name) - rank(b.name);
  });
}

export default async function StudioPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ task?: string; mode?: string; lang?: string; code?: string; board?: string; diagram?: string }>;
}) {
  const [{ projectId }, { task: taskSlug, mode, lang, code, board: boardParam, diagram: diagramParam }] = await Promise.all([params, searchParams]);

  if (projectId === "new") {
    const snippet = code ? decodeStudioCode(code) : null;
    if (snippet && mode === "coding") {
      await getPageUser();
      const codeLang = (CODE_LANG_MAP[lang as CodeLang] ? (lang as CodeLang) : "python");
      const meta = CODE_LANG_MAP[codeLang];
      const fileName = `main.${meta.ext}`;
      const diagram = emptyDiagram("arduino-uno");
      return (
        <StudioClient
          initial={{
            projectId: "new",
            title: `${meta.label} snippet`,
            kind: "coding",
            diagram,
            files: buildFiles([], "Snippet", diagram, ""),
            codingFiles: [{ name: fileName, content: snippet }],
          }}
        />
      );
    }
    if (snippet && mode !== "coding") {
      await getPageUser();
      const boardId = boardParam ?? "arduino-uno";
      // Hydrate a baked wiring diagram when one was passed and validates for this
      // board; otherwise open an empty board (today's behavior). decodeStudioDiagram
      // only checks shape (ids/types are strings, x/y finite) — sanitizeDiagram is
      // the actual security boundary: it drops unknown component types, regenerates
      // any part id that collides or contains ':' (which would otherwise smuggle a
      // bogus pin name past "partId:pinName" wire refs), and strips non-primitive
      // prop values. A URL is untrusted input, so this always runs before the
      // decoded payload becomes a real Diagram.
      const baked = diagramParam ? decodeStudioDiagram(diagramParam, boardId) : null;
      const sanitized = baked
        ? sanitizeDiagram(baked, { board: boardId as BoardId, mcu: undefined })
        : null;
      const diagram: Diagram = sanitized ?? emptyDiagram(boardId);
      return (
        <StudioClient
          initial={{
            projectId: "new",
            title: "Robotics snippet",
            kind: "robotics",
            diagram,
            files: buildFiles([], "Snippet", diagram, snippet),
          }}
        />
      );
    }
    let title = "Untitled Project";
    let boardId = "arduino-uno";
    let diagram = emptyDiagram("arduino-uno");
    let starter = getBoard("arduino-uno").starterCode;
    if (taskSlug) {
      // Auth check and challenge fetch are independent — run them together.
      const [, data] = await Promise.all([
        getPageUser(),
        apiGetOrNull<{ task: StudioTask }>(`/challenges/${taskSlug}`),
      ]);
      const task = data?.task;
      // A coding-language challenge opens the Coding Studio with its starter
      // code (matches studioHref routing: only arduino stays robotics;
      // micropython falls back to Python like the snippet path).
      if (task && task.language && task.language !== "arduino") {
        const codeLang = CODE_LANG_MAP[task.language as CodeLang] ? (task.language as CodeLang) : "python";
        const meta = CODE_LANG_MAP[codeLang];
        const codingDiagram = emptyDiagram("arduino-uno");
        return (
          <StudioClient
            initial={{
              projectId: "new",
              title: `Challenge: ${task.title}`,
              kind: "coding",
              diagram: codingDiagram,
              files: buildFiles([], "Challenge", codingDiagram, ""),
              codingFiles: [{ name: `main.${meta.ext}`, content: task.starterCode ?? "" }],
            }}
          />
        );
      }
      if (task) {
        title = `Challenge: ${task.title}`;
        boardId = task.boardType ?? "arduino-uno";
        diagram = (task.starterDiagram as unknown as Diagram) ?? emptyDiagram(boardId);
        starter = task.starterCode ?? getBoard(boardId).starterCode;
      }
    } else {
      await getPageUser();
    }
    const kind = mode === "coding" ? "coding" : "robotics";
    return (
      <StudioClient
        initial={{
          projectId: "new",
          title: kind === "coding" ? "Untitled Coding Project" : title,
          kind,
          diagram,
          files: buildFiles([], title, diagram, starter),
        }}
      />
    );
  }

  let project: StudioProject;
  try {
    // Auth check and project fetch are independent — run them together so a
    // cold request doesn't serialize two backend round-trips.
    const [, data] = await Promise.all([
      getPageUser(),
      apiGet<{ project: StudioProject }>(`/projects/${projectId}`),
    ]);
    project = data.project;
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }

  const board = getBoard(project.boardType);
  const diagram = (project.diagram as unknown as Diagram) ?? emptyDiagram(project.boardType);
  const raw = project.codeFiles.map((f) => ({ name: f.filename, language: langFor(f.filename), content: f.content }));

  const kind = project.kind === "coding" ? "coding" : "robotics";

  const codingExplanations: Record<string, { text: string; current: boolean }> = {};
  if (kind === "coding") {
    for (const f of project.codeFiles) {
      if (f.explanation) {
        const current = f.explanationHash === createHash("sha256").update(f.content).digest("hex");
        codingExplanations[f.filename] = { text: f.explanation, current };
      }
    }
  }

  return (
    <StudioClient
      initial={{
        projectId: project.id,
        title: project.title,
        kind,
        diagram,
        files: buildFiles(raw, project.title, diagram, board.starterCode),
        codingFiles: kind === "coding" ? project.codeFiles.map((f) => ({ name: f.filename, content: f.content })) : undefined,
        codingExplanations: kind === "coding" ? codingExplanations : undefined,
      }}
    />
  );
}
