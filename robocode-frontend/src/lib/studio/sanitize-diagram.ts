// Sanitises an untrusted diagram payload (an AI-returned RoboVibe edit, or a
// crafted `/studio/new?diagram=` URL param) into a Diagram that's safe to
// render: unknown component types are dropped, ids are de-duplicated AND
// stripped of any `:` (wire refs are "partId:pinName" — a colon inside a
// part id would let a crafted id smuggle a bogus pin name past the netlist),
// exactly one `mcu` head is enforced, and part `props` are restricted to
// primitive values (string/number/boolean) so a payload can't sneak an
// object/array/function into a prop that a WokwiPart later assigns straight
// onto a DOM element.

import { nanoid } from "nanoid";
import type { BoardId } from "@/lib/domain/boards";
import { COMPONENT_BY_ID } from "@/lib/domain/components";
import type { DiagramPart, DiagramWire } from "@/lib/domain/diagram";

const VALID_BOARDS = new Set<string>(["arduino-uno", "esp32", "raspberry-pi-pico"]);

export type SanitizePart = {
  id: string;
  type: string;
  x?: number;
  y?: number;
  rotation?: number;
  props?: Record<string, unknown>;
};
export type SanitizeWire = { id?: string; from: string; to: string; color?: string };

/** Keep only primitive prop values; drop anything else (objects, arrays, functions, ...). */
function sanitizeProps(
  raw: Record<string, unknown> | undefined,
): Record<string, string | number | boolean> | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  let out: Record<string, string | number | boolean> | undefined;
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
      (out ??= {})[k] = v;
    }
  }
  return out;
}

/** Sanitise a raw diagram so it's safe to render (valid types/ids, positioned, primitive props). */
export function sanitizeDiagram(
  raw: { board?: string; parts?: SanitizePart[]; wires?: SanitizeWire[] } | null | undefined,
  current: { board: BoardId; mcu: DiagramPart | undefined },
): { board: BoardId; parts: DiagramPart[]; wires: DiagramWire[] } | null {
  if (!raw || !Array.isArray(raw.parts)) return null;
  const board: BoardId = raw.board && VALID_BOARDS.has(raw.board) ? (raw.board as BoardId) : current.board;
  const mcuSrc = raw.parts.find((p) => p.id === "mcu" || String(p.type).startsWith("__board__"));
  const mcu: DiagramPart = {
    id: "mcu",
    type: `__board__:${board}`,
    x: typeof mcuSrc?.x === "number" ? mcuSrc.x : current.mcu?.x ?? 360,
    y: typeof mcuSrc?.y === "number" ? mcuSrc.y : current.mcu?.y ?? 220,
    rotation: mcuSrc?.rotation ?? current.mcu?.rotation ?? 0,
  };
  const parts: DiagramPart[] = [mcu];
  const usedIds = new Set(["mcu"]);
  let i = 0;
  for (const p of raw.parts) {
    if (p.id === "mcu" || String(p.type).startsWith("__board__")) continue;
    const type = COMPONENT_BY_ID[p.type] ? p.type : COMPONENT_BY_ID[String(p.type).toLowerCase()] ? String(p.type).toLowerCase() : null;
    if (!type) continue; // unknown component → drop
    const idOk = typeof p.id === "string" && p.id.length > 0 && !p.id.includes(":") && !usedIds.has(p.id);
    const id = idOk ? p.id : `${type}-${nanoid(5)}`;
    usedIds.add(id);
    const col = i % 3;
    const row = Math.floor(i / 3);
    parts.push({
      id,
      type,
      x: typeof p.x === "number" ? p.x : 480 + col * 184,
      y: typeof p.y === "number" ? p.y : 80 + row * 152,
      rotation: typeof p.rotation === "number" ? p.rotation : 0,
      props: sanitizeProps(p.props),
    });
    i++;
  }
  const ids = new Set(parts.map((p) => p.id));
  const wires: DiagramWire[] = [];
  for (const w of raw.wires ?? []) {
    if (!w?.from || !w?.to) continue;
    const a = String(w.from).split(":")[0];
    const b = String(w.to).split(":")[0];
    if (!ids.has(a) || !ids.has(b)) continue; // references a dropped/missing part
    wires.push({ id: w.id || `w-${nanoid(5)}`, from: w.from, to: w.to, color: w.color });
  }
  return { board, parts, wires };
}
