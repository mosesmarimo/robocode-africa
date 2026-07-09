"use client";

import { useStudio } from "@/lib/studio/store";
import { getBoard } from "@/lib/domain/boards";
import { COMPONENTS } from "@/lib/domain/components";
import { COMPONENT_PINS } from "@/lib/studio/pin-reference";
import { getPinInfo } from "@/lib/studio/pin-registry";
import { partLabel } from "@/lib/studio/readme";
import { diagramToPng } from "@/lib/studio/diagram-image";
import { validateProject, describeProject, vibeProject } from "@/lib/studio/validate-action";
import { sanitizeDiagram } from "@/lib/studio/sanitize-diagram";

/** Runs AI validation (the configured model) on the current project; result lands in the shared store. */
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

/** AI-generates a project description (README.md) from the current diagram. */
export async function runDescribe(): Promise<{ ok: boolean; message?: string }> {
  const st = useStudio.getState();
  const components = st.parts.filter((p) => p.id !== "mcu" && !p.type.startsWith("__board__"));
  try {
    const image = (await diagramToPng(st.parts, st.wires, st.board)) ?? undefined;
    const r = await describeProject({
      title: st.title,
      board: getBoard(st.board).name,
      components: components.map((p) => partLabel(p.type)),
      connections: st.wires.map((w) => ({ from: w.from, to: w.to })),
      code: st.sketchContent(),
      readme: st.readmeContent(),
      image,
    });
    if (r.text && (r.ok || r.configured)) {
      if (st.files.some((f) => f.name.toLowerCase() === "readme.md")) useStudio.getState().setFileContent("README.md", r.text);
      else useStudio.getState().setAiResult(r.text);
    }
    return { ok: r.ok, message: r.ok ? undefined : r.text };
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }
}

/**
 * RoboVibe: describe a change (or, on a blank canvas, what to build) and let the AI
 * rewrite the diagram, code and README to match. Applies the edit to the Studio store.
 */
export async function runVibe(instruction: string): Promise<{ ok: boolean; message: string }> {
  const trimmed = instruction.trim();
  if (!trimmed) return { ok: false, message: "Describe the change you'd like to make." };
  const st = useStudio.getState();
  const board = st.board;
  const componentParts = st.parts.filter((p) => p.id !== "mcu" && !p.type.startsWith("__board__"));

  // Pins of the board + each existing part, read live from the rendered elements.
  const boardPinsLive = getPinInfo("mcu").map((pin) => pin.name);
  const boardPins = boardPinsLive.length
    ? boardPinsLive
    : [...getBoard(board).gpio, ...getBoard(board).analog];
  const partPins: Record<string, string[]> = {};
  for (const p of componentParts) {
    const pins = getPinInfo(p.id).map((pin) => pin.name);
    if (pins.length) partPins[p.id] = pins;
    else if (COMPONENT_PINS[p.type]) partPins[p.id] = COMPONENT_PINS[p.type];
  }

  const catalog = COMPONENTS.filter((c) => c.tag !== "rc-breadboard" && c.tag !== "rc-breadboard-mini").map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    pins: COMPONENT_PINS[c.id],
  }));

  // Slim current diagram (drop bend points — routing is automatic).
  const diagram = {
    board,
    parts: st.parts.map((p) => ({ id: p.id, type: p.type, x: p.x, y: p.y, rotation: p.rotation, props: p.props })),
    wires: st.wires.map((w) => ({ id: w.id, from: w.from, to: w.to, color: w.color })),
  };

  try {
    const image = (await diagramToPng(st.parts, st.wires, board)) ?? undefined;
    const r = await vibeProject({
      instruction: trimmed,
      title: st.title,
      board: getBoard(board).name,
      code: st.sketchContent(),
      readme: st.readmeContent(),
      language: getBoard(board).defaultLanguage,
      diagram,
      catalog,
      boardPins,
      partPins,
      image,
    });
    if (!r.ok || !r.result) return { ok: false, message: r.text || "RoboVibe couldn't apply that change." };

    const clean = sanitizeDiagram(r.result.diagram, { board, mcu: st.parts.find((p) => p.id === "mcu") });
    useStudio.getState().applyVibe({
      parts: clean?.parts,
      wires: clean?.wires,
      board: clean?.board,
      files: r.result.files,
      code: r.result.code,
      readme: r.result.readme,
    });
    // Double-check the freshly-generated project with AI (validity check).
    void runValidation();
    return { ok: true, message: r.result.summary || r.text || "Applied your changes." };
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }
}
