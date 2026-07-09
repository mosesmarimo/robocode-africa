// Deterministic gate for the baker's output schema (npx tsx). Runs the baker in
// --mock mode for one course, then re-reads the written JSON and asserts every
// produced BakedDiagram is schema-valid.
//   npx tsx scripts/bake-schema-smoke.ts
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const OUT = resolve(__dirname, "../../robocode-backend/prisma/content/generated/baked-diagrams.json");
const PART_ID = /^[A-Za-z0-9_-]+$/;

// assert() THROWS (rather than process.exit()ing directly) so the try/catch below always
// gets a chance to restore the backup, even on failure.
function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(msg);
}

// Back up the committed store before the real baker (--mock --force) overwrites it with
// a single mock intro-robotics entry, and restore it afterwards — same pattern as
// prisma/seed-merge-smoke.ts — so this gate never leaves the real committed diagrams
// clobbered on disk.
const had = existsSync(OUT);
const backup = had ? readFileSync(OUT, "utf8") : null;
function restore() {
  if (backup !== null) writeFileSync(OUT, backup);
}

try {
  // Run the baker deterministically (no AI). --force so it writes even if entries exist.
  execFileSync("npx", ["tsx", "scripts/bake-diagrams.ts", "--mock", "--force", "--only", "intro-robotics"], {
    cwd: resolve(__dirname, ".."),
    stdio: "inherit",
  });

  const store = JSON.parse(readFileSync(OUT, "utf8")) as {
    version: number;
    entries: Record<string, { board: string; language: string; diagram: { board: string; parts: { id: string; type: string; x: number; y: number }[]; wires: { id: string; from: string; to: string }[] } }>;
  };

  assert(store.version === 1, "store.version must be 1");
  const keys = Object.keys(store.entries);
  assert(keys.length >= 1, "expected at least one mock entry for intro-robotics");

  for (const key of keys) {
    assert(/^[^:]+:[0-9a-f]{40}$/.test(key), `key not lessonSlug:sha1 → ${key}`);
    const { board, diagram } = store.entries[key];
    const head = diagram.parts[0];
    assert(head?.id === "mcu" && head.type === `__board__:${board}`, `${key}: parts[0] must be the mcu board`);
    for (const p of diagram.parts) {
      assert(PART_ID.test(p.id), `${key}: bad part id ${p.id}`);
      assert(typeof p.x === "number" && typeof p.y === "number", `${key}: part ${p.id} missing numeric x/y`);
    }
    const ids = new Set(diagram.parts.map((p) => p.id));
    for (const w of diagram.wires) {
      for (const ep of [w.from, w.to]) {
        const [pid, pin] = ep.split(":");
        assert(PART_ID.test(pid) && !!pin, `${key}: wire endpoint not partId:pin → ${ep}`);
        assert(ids.has(pid), `${key}: wire endpoint references missing part → ${ep}`);
      }
    }
  }

  console.log(`PASS (bake-schema-smoke) — ${keys.length} entr${keys.length === 1 ? "y" : "ies"} validated`);
  restore();
} catch (e) {
  restore();
  console.error("FAIL:", e instanceof Error ? e.message : e);
  process.exit(1);
}
