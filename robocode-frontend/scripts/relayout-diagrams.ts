// One-off: re-position already-baked diagrams with the shared applyLayout (board
// on the left, components in a spaced column) WITHOUT re-calling the AI — this
// preserves the verified wiring and fixes only the overlapping positions.
//   npx tsx scripts/relayout-diagrams.ts
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { applyLayout, type LayoutPart } from "./diagram-layout";

const OUT = resolve(__dirname, "../../robocode-backend/prisma/content/generated/baked-diagrams.json");

type Entry = { board: string; language: string; diagram: { board: string; parts: LayoutPart[]; wires: unknown[] } };
type Store = { version: number; entries: Record<string, Entry> };

const store = JSON.parse(readFileSync(OUT, "utf8")) as Store;
let n = 0;
for (const e of Object.values(store.entries)) {
  e.diagram.parts = applyLayout(e.diagram.parts);
  n += 1;
}
writeFileSync(OUT, JSON.stringify(store, null, 2) + "\n", "utf8");
console.log(`re-laid-out ${n} diagram(s) -> ${OUT}`);
