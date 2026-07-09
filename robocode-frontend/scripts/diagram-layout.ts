// Pure, deterministic layout for baked wiring diagrams.
//
// The AI returns part positions that overlap (it has no sense of element sizes),
// so we IGNORE them and lay the diagram out ourselves: the MCU board on the left,
// the components in a spaced column to its right (wrapping to a new column every
// COL_ROWS). The spacing is generous enough that no component overlaps the board
// or another component, and it leaves a clear vertical gap between the board and
// the components for the wires to run through unobstructed.
//
// Used by BOTH scripts/bake-diagrams.ts (new bakes) and scripts/relayout-diagrams.ts
// (re-positioning already-baked diagrams), so dev + prod stay identical.

const BOARD_X = 40;
const BOARD_Y = 220;
const COMP_X0 = 520; // left edge of the component area — clear of the widest board (~360w)
const COMP_Y0 = 60;
const COL_W = 340; // horizontal spacing between component columns (> widest component)
const ROW_H = 210; // vertical spacing between components in a column (> tallest component)
const COL_ROWS = 4; // components per column before wrapping to the next column

export type LayoutPart = {
  id: string;
  type: string;
  x: number;
  y: number;
  rotation?: number;
  props?: Record<string, string | number | boolean>;
};

/**
 * Reposition parts in place-free fashion (returns new objects): the board
 * (`mcu` / `__board__:*`) at the left, every other part in a spaced column to
 * the right. Order of the non-board parts is preserved.
 */
export function applyLayout<T extends LayoutPart>(parts: T[]): T[] {
  let ci = 0;
  return parts.map((p) => {
    if (p.id === "mcu" || String(p.type).startsWith("__board__")) {
      return { ...p, x: BOARD_X, y: BOARD_Y };
    }
    const col = Math.floor(ci / COL_ROWS);
    const row = ci % COL_ROWS;
    ci += 1;
    return { ...p, x: COMP_X0 + col * COL_W, y: COMP_Y0 + row * ROW_H };
  });
}
