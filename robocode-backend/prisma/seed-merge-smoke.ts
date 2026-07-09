// Deterministic gate for mergeBakedDiagrams (npx tsx). Imports the real pure
// transform from ./baked-diagrams (the module seed.ts and seed-content.ts both
// call) and asserts:
//  - a baked code block gets exactly one diagram block spliced after it + board stamped
//  - a code block with no entry is unchanged (board stamped, no diagram block)
//  - a python block in a by-language course is untouched (no board, no diagram)
//   npx tsx prisma/seed-merge-smoke.ts
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { code, type Block, type BakedDiagram } from "./content/types";

const STORE = resolve(__dirname, "content/generated/baked-diagrams.json");

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error("FAIL:", msg);
    process.exit(1);
  }
}
const sha1 = (s: string) => createHash("sha1").update(s).digest("hex");

// --- fixture: a known code block + a baked entry for it ----------------------
const ARDUINO_SRC = "void setup(){ pinMode(13, OUTPUT); }\nvoid loop(){ digitalWrite(13, HIGH); }";
const PY_SRC = "from machine import Pin\nled = Pin(25, Pin.OUT)";
const fixtureDiagram: BakedDiagram = {
  board: "arduino-uno",
  parts: [
    { id: "mcu", type: "__board__:arduino-uno", x: 360, y: 220, rotation: 0 },
    { id: "led-1", type: "led", x: 560, y: 120, props: { color: "red" } },
  ],
  wires: [{ id: "w1", from: "mcu:13", to: "led-1:A", color: "#16a34a" }],
};

// Write a fixture store (backing up + restoring the real one).
const had = existsSync(STORE);
const backup = had ? readFileSync(STORE, "utf8") : null;
mkdirSync(resolve(__dirname, "content/generated"), { recursive: true });
writeFileSync(
  STORE,
  JSON.stringify(
    {
      version: 1,
      entries: { [`lesson-x:${sha1(ARDUINO_SRC)}`]: { board: "arduino-uno", language: "arduino", diagram: fixtureDiagram } },
    },
    null,
    2,
  ),
);

function restore() {
  if (backup !== null) writeFileSync(STORE, backup);
}

(async () => {
  // Import AFTER the fixture store is on disk (baked-diagrams reads it lazily/cached).
  const { mergeBakedDiagrams } = await import("./baked-diagrams");

  // Case A: intro-robotics (arduino-uno course), the baked block + an un-baked block.
  const unbaked = "void setup(){}\nvoid loop(){}";
  const blocksA: Block[] = [
    code("arduino", ARDUINO_SRC, { filename: "blink.ino" }),
    code("arduino", unbaked, { filename: "other.ino" }),
  ];
  const outA = mergeBakedDiagrams("intro-robotics", "lesson-x", blocksA);
  // expect: [code(stamped), diagram, code(stamped)]
  assert(outA.length === 3, `A: expected 3 blocks, got ${outA.length}`);
  assert(outA[0].type === "code" && (outA[0] as { board?: string }).board === "arduino-uno", "A: first code not stamped arduino-uno");
  assert(outA[1].type === "diagram", "A: a diagram block must follow the baked code block");
  assert((outA[1] as { code: string }).code === ARDUINO_SRC, "A: diagram block must carry the matching code");
  assert(outA[2].type === "code" && (outA[2] as { board?: string }).board === "arduino-uno", "A: second code not stamped");
  assert(!outA.some((b, i) => b.type === "diagram" && i !== 1), "A: only one diagram block expected");

  // Case B: a by-language course, a python block → untouched (no board, no diagram).
  const blocksB: Block[] = [code("python", PY_SRC, { filename: "blink.py" })];
  const outB = mergeBakedDiagrams("robo-pi-arduino", "lesson-y", blocksB);
  assert(outB.length === 1, `B: python block should not gain a diagram (got ${outB.length})`);
  assert(outB[0].type === "code" && (outB[0] as { board?: string }).board === undefined, "B: python block must not be stamped");

  restore();
  console.log("PASS (seed-merge-smoke)");
})().catch((e) => {
  restore();
  console.error(e);
  process.exit(1);
});
