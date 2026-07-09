// URL helpers for opening a code snippet directly in the RoboCode Studio.
// Snippets are base64url-encoded into the studio URL; the studio page decodes
// them into an unsaved editor buffer (never executed server-side). A baked
// wiring diagram can ride alongside the code so the Studio hydrates the wiring.

export const STUDIO_CODE_MAX = 8000;
export const STUDIO_DIAGRAM_MAX = 16000; // max chars of the encoded `diagram` param
export const ROBOTICS_LANGS = ["arduino"] as const;
/** Boards the robotics Studio can open. Used to decide mode=robotics vs coding. */
export const ROBOTICS_BOARDS: ReadonlySet<string> = new Set(["arduino-uno", "esp32", "raspberry-pi-pico"]);

/** Persisted diagram shape (mirrors the backend `BakedDiagram`). */
export type BakedDiagram = {
  board: string;
  parts: { id: string; type: string; x: number; y: number; rotation?: number; props?: Record<string, string | number | boolean> }[];
  wires: { id: string; from: string; to: string; color?: string }[];
};

function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  const b64 = typeof btoa !== "undefined" ? btoa(bin) : Buffer.from(bin, "binary").toString("base64");
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): Uint8Array {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const bin = typeof atob !== "undefined" ? atob(b64) : Buffer.from(b64, "base64").toString("binary");
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function encodeStudioCode(code: string): string {
  return toBase64Url(new TextEncoder().encode(code));
}

export function decodeStudioCode(param: string): string | null {
  try {
    if (!/^[A-Za-z0-9\-_]+$/.test(param)) return null;
    const text = new TextDecoder().decode(fromBase64Url(param));
    if (text.length === 0 || text.length > STUDIO_CODE_MAX) return null;
    return text;
  } catch {
    return null;
  }
}

/** Encode a diagram to a base64url JSON payload for the studio URL. */
export function encodeStudioDiagram(d: BakedDiagram): string {
  return toBase64Url(new TextEncoder().encode(JSON.stringify(d)));
}

/**
 * Decode + validate a diagram param. Returns null (caller falls back to an empty
 * board) when the payload is malformed, oversize, or doesn't target `boardId`
 * (parts[0] must be the `mcu` board for `boardId`).
 */
export function decodeStudioDiagram(param: string, boardId: string): BakedDiagram | null {
  try {
    if (!/^[A-Za-z0-9\-_]+$/.test(param)) return null;
    if (param.length === 0 || param.length > STUDIO_DIAGRAM_MAX) return null;
    const json = new TextDecoder().decode(fromBase64Url(param));
    const d = JSON.parse(json) as BakedDiagram;
    if (!d || typeof d !== "object" || !Array.isArray(d.parts) || !Array.isArray(d.wires)) return null;
    if (d.board !== boardId) return null;
    const head = d.parts[0];
    if (!head || head.id !== "mcu" || head.type !== `__board__:${boardId}`) return null;
    for (const p of d.parts) {
      if (typeof p.id !== "string" || typeof p.type !== "string") return null;
      if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) return null;
    }
    for (const w of d.wires) {
      if (typeof w.from !== "string" || typeof w.to !== "string") return null;
    }
    return d;
  } catch {
    return null;
  }
}

/**
 * Build the /studio/new URL for a snippet.
 * - When `board` is a known robotics board, force mode=robotics on that board
 *   (so micropython on Pico opens robotics, not coding).
 * - Else fall back to the language heuristic (only `arduino` is robotics).
 * - When a `diagram` is supplied (robotics only), append &diagram=<encoded>,
 *   omitting it past STUDIO_DIAGRAM_MAX so the URL stays within browser limits.
 */
export function studioHref(language: string, code: string, board?: string, diagram?: BakedDiagram): string {
  const params = new URLSearchParams();
  const explicitRobotics = !!board && ROBOTICS_BOARDS.has(board);
  const isRobotics = explicitRobotics || (ROBOTICS_LANGS as readonly string[]).includes(language);
  params.set("mode", isRobotics ? "robotics" : "coding");
  params.set("lang", language);
  if (isRobotics) params.set("board", explicitRobotics ? board! : "arduino-uno");
  params.set("code", encodeStudioCode(code));
  if (isRobotics && diagram) {
    const enc = encodeStudioDiagram(diagram);
    if (enc.length <= STUDIO_DIAGRAM_MAX) {
      params.set("diagram", enc);
    } else if (process.env.NODE_ENV !== "production") {
      console.warn(`[studioHref] diagram param ${enc.length} > ${STUDIO_DIAGRAM_MAX}; omitting wiring.`);
    }
  }
  return `/studio/new?${params.toString()}`;
}
