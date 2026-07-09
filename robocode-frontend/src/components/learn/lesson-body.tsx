import type { BakedDiagram } from "@/lib/studio/open-in-studio";
import { Markdown } from "./markdown";
import { CodeBlock } from "./code-block";
import { MermaidDiagram } from "./mermaid-diagram";
import { SvgFigure } from "./svg-figure";
import { Callout } from "./callout";
import { DiagramBlock } from "./diagram-preview";
import { TryItBlock } from "./tryit-block";
import { ExerciseBlock } from "./exercise-block";

export type LessonBlock =
  | { type: "markdown"; text: string }
  | { type: "code"; language: string; code: string; filename?: string; openInStudio?: boolean; board?: string }
  | { type: "mermaid"; chart: string; caption?: string }
  | { type: "svg"; svg: string; caption?: string }
  | { type: "callout"; variant?: "tip" | "info" | "warning"; text: string }
  | { type: "diagram"; board: string; language: string; code: string; diagram: BakedDiagram; caption?: string }
  | { type: "tryit"; language: string; code: string; expectedOutput?: string; caption?: string }
  | { type: "exercise"; language: string; prompt: string; starter: string; solution: string; check?: string; caption?: string };

/**
 * `lessonId` (when given) seeds a stable `refId` for tryit/exercise
 * completion tracking (`${lessonId}#${index}`) — see
 * lib/learn/block-progress.ts. It's optional because not every LessonBody
 * caller has a lesson id (e.g. a future preview/editor context); blocks fall
 * back to a page-local index-only id, which is fine for the current no-op hook.
 */
export function LessonBody({ blocks, lessonId }: { blocks: LessonBlock[]; lessonId?: string }) {
  return (
    <div className="space-y-1">
      {blocks.map((b, i) => {
        const refId = `${lessonId ?? "lesson"}#${i}`;
        switch (b.type) {
          case "markdown":
            return <Markdown key={i} text={b.text} />;
          case "code":
            return <CodeBlock key={i} {...b} />;
          case "mermaid":
            return <MermaidDiagram key={i} {...b} />;
          case "svg":
            return <SvgFigure key={i} {...b} />;
          case "callout":
            return <Callout key={i} {...b} />;
          case "diagram":
            return <DiagramBlock key={i} {...b} />;
          case "tryit":
            return <TryItBlock key={i} {...b} refId={refId} />;
          case "exercise":
            return <ExerciseBlock key={i} {...b} refId={refId} />;
          default:
            return null;
        }
      })}
    </div>
  );
}
