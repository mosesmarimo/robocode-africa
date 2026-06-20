"use client";

import type { DiagramPart, DiagramWire } from "@/lib/domain/diagram";
import { getBoard } from "@/lib/domain/boards";
import { partLabel } from "@/lib/studio/readme";

function boxFor(p: DiagramPart): { w: number; h: number; board: boolean } {
  const board = p.id === "mcu" || p.type.startsWith("__board__");
  return board ? { w: 300, h: 210, board: true } : { w: 110, h: 66, board: false };
}

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Renders a clear, labelled schematic of the diagram and returns a PNG data URL. */
export async function diagramToPng(parts: DiagramPart[], wires: DiagramWire[], boardId: string): Promise<string | null> {
  if (typeof document === "undefined" || !parts.length) return null;
  const pad = 44;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of parts) {
    const b = boxFor(p);
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x + b.w);
    maxY = Math.max(maxY, p.y + b.h);
  }
  const ox = -minX + pad;
  const oy = -minY + pad;
  const W = Math.round(maxX - minX + pad * 2);
  const H = Math.round(maxY - minY + pad * 2 + 24);
  const center = (p: DiagramPart) => {
    const b = boxFor(p);
    return { x: p.x + ox + b.w / 2, y: p.y + oy + b.h / 2 };
  };
  const byId = new Map(parts.map((p) => [p.id, p]));

  const parts2: string[] = [];
  parts2.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="sans-serif">`);
  parts2.push(`<rect width="100%" height="100%" fill="#0d1426"/>`);
  parts2.push(`<text x="16" y="28" fill="#9fb0d0" font-size="15" font-weight="700">${esc(getBoard(boardId).name)} — circuit diagram</text>`);

  // wires (under the boxes), with pin labels at each end
  for (const w of wires) {
    const fp = byId.get(w.from.split(":")[0]);
    const tp = byId.get(w.to.split(":")[0]);
    if (!fp || !tp) continue;
    const a = center(fp);
    const b = center(tp);
    const col = w.color ?? "#64748b";
    parts2.push(`<line x1="${a.x}" y1="${a.y + 12}" x2="${b.x}" y2="${b.y + 12}" stroke="${col}" stroke-width="2.5" opacity="0.85"/>`);
    parts2.push(`<circle cx="${a.x}" cy="${a.y + 12}" r="3" fill="${col}"/><circle cx="${b.x}" cy="${b.y + 12}" r="3" fill="${col}"/>`);
    const fl = w.from.split(":")[1] ?? "";
    const tl = w.to.split(":")[1] ?? "";
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2 + 12;
    parts2.push(`<text x="${mx}" y="${my - 3}" fill="#cbd5e1" font-size="9" text-anchor="middle">${esc(fl)}→${esc(tl)}</text>`);
  }

  // component boxes
  for (const p of parts) {
    const b = boxFor(p);
    const x = p.x + ox;
    const y = p.y + oy;
    const fill = b.board ? "#13315c" : "#16213b";
    const stroke = b.board ? "#3b82f6" : "#334569";
    parts2.push(`<rect x="${x}" y="${y}" width="${b.w}" height="${b.h}" rx="10" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`);
    const label = b.board ? getBoard(boardId).name : partLabel(p.type);
    parts2.push(`<text x="${x + b.w / 2}" y="${y + b.h / 2 + 4}" fill="#e8edf9" font-size="13" font-weight="600" text-anchor="middle">${esc(label)}</text>`);
  }
  parts2.push(`</svg>`);
  const svg = parts2.join("");

  try {
    const url = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svg)));
    const img = new Image();
    await new Promise<void>((res, rej) => {
      img.onload = () => res();
      img.onerror = () => rej(new Error("svg load failed"));
      img.src = url;
    });
    const scale = 2;
    const canvas = document.createElement("canvas");
    canvas.width = W * scale;
    canvas.height = H * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.scale(scale, scale);
    ctx.drawImage(img, 0, 0);
    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
}
