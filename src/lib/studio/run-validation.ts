"use client";

import { useStudio } from "@/lib/studio/store";
import { getBoard } from "@/lib/domain/boards";
import { partLabel } from "@/lib/studio/readme";
import { diagramToPng } from "@/lib/studio/diagram-image";
import { validateProject } from "@/lib/studio/validate-action";

/** Runs DeepSeek validation on the current project; result lands in the shared store. */
export async function runValidation() {
  const st = useStudio.getState();
  if (st.aiValidating) return;
  st.setAiValidating(true);
  st.setAiResult(null);
  try {
    const components = st.parts.filter((p) => p.id !== "mcu" && !p.type.startsWith("__board__"));
    const image = (await diagramToPng(st.parts, st.wires, st.board)) ?? undefined;
    const r = await validateProject({
      title: st.title,
      board: getBoard(st.board).name,
      components: components.map((p) => partLabel(p.type)),
      connections: st.wires.map((w) => ({ from: w.from, to: w.to })),
      code: st.sketchContent(),
      readme: st.readmeContent(),
      image,
    });
    useStudio.getState().setAiResult(r.text);
  } catch (e) {
    useStudio.getState().setAiResult(`Validation failed: ${(e as Error).message}`);
  } finally {
    useStudio.getState().setAiValidating(false);
  }
}
