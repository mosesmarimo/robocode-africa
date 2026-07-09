// Shared seed-time transform for baked AI wiring diagrams (committed JSON; see
// robocode-frontend/scripts/bake-diagrams.ts). Imported by BOTH seeders:
//   - prisma/seed.ts          (destructive dev seed)
//   - prisma/seed-content.ts  (non-destructive prod content seed)
// so the diagrams + board stamps land the same way in dev and on production.

import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { boardForBlock } from "./content/board-map";
import { diagram as diagramBlock, type Block, type BakedDiagram } from "./content/types";

type BakedEntry = { board: string; language: string; diagram: BakedDiagram };
type BakedStore = { version: number; entries: Record<string, BakedEntry> };

let _bakedStore: BakedStore | undefined;
function bakedStore(): BakedStore {
  if (_bakedStore !== undefined) return _bakedStore;
  try {
    const raw = readFileSync(resolve(__dirname, "content/generated/baked-diagrams.json"), "utf8");
    const parsed = JSON.parse(raw) as BakedStore;
    _bakedStore = parsed && parsed.entries ? parsed : { version: 1, entries: {} };
  } catch {
    _bakedStore = { version: 1, entries: {} }; // missing/empty file → no-op merge
  }
  return _bakedStore;
}

function sha1(s: string): string {
  return createHash("sha1").update(s).digest("hex");
}

/** Shared key format for the baked-diagrams store: `<lessonSlug>:<sha1(code)>`. Used by
 * the baker (robocode-frontend/scripts/bake-diagrams.ts) when writing entries and here
 * when reading them back at seed time, so the two never drift. */
export const bakedKey = (lessonSlug: string, code: string) => `${lessonSlug}:${sha1(code)}`;

/**
 * Pure transform applied to each lesson's blocks at seed time:
 *  1. Stamp `board` on every robotics `code` block (board from the shared map;
 *     null → left untouched, e.g. python/Linux/coding).
 *  2. After a code block that has a baked-diagrams.json entry (keyed
 *     lessonSlug:sha1(code)), splice a `diagram` block built from that entry.
 * Everything else passes through unchanged. Idempotent and deterministic.
 */
export function mergeBakedDiagrams(courseSlug: string, lessonSlug: string, blocks: Block[]): Block[] {
  const entries = bakedStore().entries;
  const out: Block[] = [];
  for (const block of blocks) {
    if (block.type !== "code") {
      out.push(block);
      continue;
    }
    const board = block.openInStudio === false ? null : boardForBlock(courseSlug, block.language);
    const stamped: Block = board ? { ...block, board } : block;
    out.push(stamped);
    if (board) {
      const entry = entries[bakedKey(lessonSlug, block.code)];
      if (entry) {
        out.push(diagramBlock(entry.board, entry.language, block.code, entry.diagram));
      }
    }
  }
  return out;
}
