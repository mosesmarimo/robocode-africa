// Shared project diagram schema (Wokwi diagram.json style). Used by the Studio and seed data.

export interface DiagramPart {
  id: string;
  /** component id from the catalogue, or a board tag for the MCU part */
  type: string;
  x: number;
  y: number;
  rotation?: number;
  props?: Record<string, string | number | boolean>;
}

export interface DiagramWire {
  id: string;
  /** "partId:pinName" */
  from: string;
  to: string;
  color?: string;
  /** intermediate bend points (canvas-space), in order from `from` to `to` */
  points?: { x: number; y: number }[];
}

export interface Diagram {
  board: string; // BoardId
  parts: DiagramPart[]; // parts[0] is always the board (id "mcu")
  wires: DiagramWire[];
}

export const WIRE_COLORS = ["#16a34a", "#ef4444", "#2563ff", "#f59e0b", "#a855f7", "#000000", "#64748b"];

export function emptyDiagram(board = "arduino-uno"): Diagram {
  return {
    board,
    parts: [{ id: "mcu", type: `__board__:${board}`, x: 360, y: 220, rotation: 0 }],
    wires: [],
  };
}

export function isBoardPart(part: DiagramPart) {
  return part.id === "mcu" || part.type.startsWith("__board__");
}
