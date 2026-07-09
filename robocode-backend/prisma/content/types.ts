// Authoring helpers for rich lesson content. Blocks are plain JSON stored in
// Lesson.body and rendered by the frontend LessonBody component.

/** Persisted diagram shape (a positioned subset of the frontend `Diagram`). */
export type BakedDiagram = {
  board: string; // BoardId: "arduino-uno" | "esp32" | "raspberry-pi-pico"
  parts: { id: string; type: string; x: number; y: number; rotation?: number; props?: Record<string, string | number | boolean> }[];
  wires: { id: string; from: string; to: string; color?: string }[];
};

export type Block =
  | { type: "markdown"; text: string }
  | { type: "code"; language: string; code: string; filename?: string; openInStudio?: boolean; board?: string }
  | { type: "mermaid"; chart: string; caption?: string }
  | { type: "svg"; svg: string; caption?: string }
  | { type: "callout"; variant?: "tip" | "info" | "warning"; text: string }
  | {
      type: "diagram";
      board: string; // BoardId the diagram targets
      language: string; // "arduino" | "micropython"
      code: string; // the exact code this diagram matches
      diagram: BakedDiagram;
      caption?: string;
    }
  | { type: "tryit"; language: string; code: string; expectedOutput?: string; caption?: string }
  | { type: "exercise"; language: string; prompt: string; starter: string; solution: string; check?: string; caption?: string };

export const md = (text: string): Block => ({ type: "markdown", text });
export const code = (
  language: string,
  src: string,
  opts: { filename?: string; openInStudio?: boolean } = {},
): Block => ({ type: "code", language, code: src, openInStudio: true, ...opts });
export const mermaid = (chart: string, caption?: string): Block => ({ type: "mermaid", chart, caption });
export const svg = (svgStr: string, caption?: string): Block => ({ type: "svg", svg: svgStr, caption });
export const callout = (variant: "tip" | "info" | "warning", text: string): Block => ({ type: "callout", variant, text });
export const diagram = (
  board: string,
  language: string,
  src: string,
  d: BakedDiagram,
  caption?: string,
): Block => ({ type: "diagram", board, language, code: src, diagram: d, caption });

/** An editable + runnable example (coding langs run in the browser/server sandbox, robotics via the Studio). */
export const tryit = (
  language: string,
  code: string,
  opts: { expectedOutput?: string; caption?: string } = {},
): Block => ({ type: "tryit", language, code, ...opts });

/** An editable exercise with a Show-Answer solution + optional auto-check. */
export const exercise = (
  language: string,
  prompt: string,
  starter: string,
  solution: string,
  opts: { check?: string; caption?: string } = {},
): Block => ({ type: "exercise", language, prompt, starter, solution, ...opts });

export const body = (...blocks: Block[]) => ({ blocks });

export interface LessonDef {
  title: string;
  slug: string;
  estMinutes: number;
  contentType?: string;
  body: { blocks: Block[] };
}

export interface CourseModule {
  meta: {
    title: string;
    slug: string;
    track: string;
    level: string;
    description: string;
    coverImage: string;
    order: number;
    // One of the frozen 12 languages (see domain/constants.ts ALL_LANGUAGES),
    // e.g. "python" for a W3Schools-style tutorial course. Optional — most
    // courses are multi-language or topic-survey content. Maps to
    // Course.language in the content seed (prisma/seed-content.ts).
    language?: string;
  };
  lessons: LessonDef[];
  tasks?: Record<string, unknown>[];
}
