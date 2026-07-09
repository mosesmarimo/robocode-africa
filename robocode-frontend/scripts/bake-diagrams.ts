// Offline diagram baker: for each robotics code example in the backend content,
// generate a matching wiring Diagram via the existing /ai/vibe generator and
// persist it (committed) to robocode-backend/prisma/content/generated/baked-diagrams.json.
//
//   # against a locally-running backend with AI credentials:
//   npx tsx scripts/bake-diagrams.ts                 # all robotics courses (skips unchanged)
//   npx tsx scripts/bake-diagrams.ts --force         # re-bake everything
//   npx tsx scripts/bake-diagrams.ts --only robo-esp32   # one course slug
//   # deterministic, no AI (for the gate / dry checks):
//   npx tsx scripts/bake-diagrams.ts --mock --only intro-robotics
//
// Reads backend content via monorepo-relative imports; uses the FRONTEND catalog
// (COMPONENTS / BOARDS / COMPONENT_PINS) to build the vibe inputs exactly like
// runVibe does — but with the static fallbacks (there is no DOM here).

import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";

import { COMPONENTS } from "../src/lib/domain/components";
import { COMPONENT_PINS } from "../src/lib/studio/pin-reference";
import { emptyDiagram } from "../src/lib/domain/diagram";
import type { BakedDiagram } from "../src/lib/studio/open-in-studio";
import { applyLayout } from "./diagram-layout";
import { BOARD_PINS, fixBoardPin } from "./element-pins";

// Backend content (monorepo-relative). These are plain TS modules with no DB deps.
import { CONTENT_MODULES } from "../../robocode-backend/prisma/content/index";
import { boardForBlock } from "../../robocode-backend/prisma/content/board-map";
import type { CourseModule, Block } from "../../robocode-backend/prisma/content/types";
import { bakedKey } from "../../robocode-backend/prisma/baked-diagrams";

type Entry = { board: string; language: string; diagram: BakedDiagram };
type Store = { version: 1; entries: Record<string, Entry> };

const API = process.env.API_BASE_URL || "http://localhost:4000";
// Platform super admin (no tenant) — avoids per-tenant host resolution on localhost.
const BAKE_EMAIL = process.env.BAKE_EMAIL || "super@robocode.africa";
const BAKE_PASSWORD = process.env.BAKE_PASSWORD || "password123";

const OUT = resolve(__dirname, "../../robocode-backend/prisma/content/generated/baked-diagrams.json");

const args = process.argv.slice(2);
const FORCE = args.includes("--force");
const MOCK = args.includes("--mock");
const onlyIdx = args.indexOf("--only");
const ONLY = onlyIdx >= 0 ? args[onlyIdx + 1] : null;

const COMPONENT_IDS = new Set(COMPONENTS.map((c) => c.id));
const PART_REF = /^[A-Za-z0-9_-]+:[A-Za-z0-9_.+-]+$/;

// Lessons whose target sensor has NO equivalent in the component catalogue
// (COMPONENTS). The AI substitutes a similar-but-wrong in-catalogue part (e.g. an
// mpu6050 for a BMP280, a dht22 for a DS18B20), which passes sanitize() because the
// substituted id is valid — but the figure shows the wrong chip and misleads. Skip
// these so the lesson renders code-only until the real component is added to the
// catalogue (then remove its slug here and re-bake).
const EXCLUDE_LESSONS = new Set<string>([
  "sensor-lm35",
  "sensor-ds18b20",
  "sensor-soil",
  "sensor-rain",
  "sensor-bmp280",
  "sensor-magnetic",
  "sensor-touch",
  "sensor-bh1750",
  // These two now have real, hand-authored diagrams (scripts/add-pico-diagrams.ts,
  // wired against Task 7's first-party rc-pi-pico board element) committed directly to
  // baked-diagrams.json. Keep them excluded from the AI pipeline so a future --force
  // re-bake can't silently clobber the verified hand-authored circuit with a
  // hallucinated one; remove from here once the AI is trusted to redo them faithfully.
  "pico-button-adc",
  "pico-pwm-servo",
]);

function loadStore(): Store {
  if (existsSync(OUT)) {
    try {
      const raw = JSON.parse(readFileSync(OUT, "utf8")) as Store;
      if (raw && raw.version === 1 && raw.entries) return raw;
    } catch {
      /* fall through to a fresh store */
    }
  }
  return { version: 1, entries: {} };
}

function saveStore(store: Store) {
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(store, null, 2) + "\n", "utf8");
}

// --- vibe input assembly (mirrors runVibe's static-fallback branch) ----------
function catalogForVibe() {
  return COMPONENTS.filter((c) => c.tag !== "rc-breadboard" && c.tag !== "rc-breadboard-mini").map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    pins: COMPONENT_PINS[c.id],
  }));
}

function vibePayload(title: string, language: string, board: string, code: string) {
  // Feed the AI the REAL rendered element pin names (scripts/element-pins.ts), not the
  // abstract simulation-facing GPIO labels in src/lib/domain/boards.ts — those don't
  // always match what a wire endpoint must be named to actually resolve/render.
  const boardPins = BOARD_PINS[board] ?? [];
  return {
    instruction:
      "Generate ONLY the wiring diagram (parts + wires) that exactly matches this code. " +
      "Do NOT change the code. Add every component the code references and wire each to the " +
      "exact board pin the code uses. Use components from the provided catalog only.",
    title,
    board,
    code,
    readme: "",
    language,
    diagram: emptyDiagram(board), // just the mcu board part
    catalog: catalogForVibe(),
    boardPins,
    partPins: {} as Record<string, string[]>, // no existing parts on a blank canvas
  };
}

// --- post-processing: positions + valid parts/wires --------------------------
// Returns null if the diagram must be dropped entirely (see the mcu-pin validation below) —
// callers treat that exactly like "no diagram" (lesson renders code-only).
function sanitize(board: string, raw: BakedDiagram | undefined): BakedDiagram | null {
  const mcuSrc = raw?.parts?.find((p) => p.id === "mcu" || String(p.type).startsWith("__board__"));
  const mcu = {
    id: "mcu",
    type: `__board__:${board}`,
    x: 0, // final position set by applyLayout()
    y: 0,
    rotation: typeof mcuSrc?.rotation === "number" ? mcuSrc.rotation : 0,
  };
  const parts: BakedDiagram["parts"] = [mcu];
  const usedIds = new Set(["mcu"]);
  let i = 0;
  for (const p of raw?.parts ?? []) {
    if (p.id === "mcu" || String(p.type).startsWith("__board__")) continue;
    const typeId = COMPONENT_IDS.has(p.type)
      ? p.type
      : COMPONENT_IDS.has(String(p.type).toLowerCase())
        ? String(p.type).toLowerCase()
        : null;
    if (!typeId) continue; // unknown component → drop
    const id = typeof p.id === "string" && p.id && !usedIds.has(p.id) ? p.id : `${typeId}-${i + 1}`;
    usedIds.add(id);
    parts.push({
      id,
      type: typeId,
      x: 0, // final position set by applyLayout()
      y: 0,
      rotation: typeof p.rotation === "number" ? p.rotation : 0,
      props: p.props,
    });
    i++;
  }
  const ids = new Set(parts.map((p) => p.id));
  const wires: BakedDiagram["wires"] = [];
  let dropped = 0;
  let w = 0;
  for (const wire of raw?.wires ?? []) {
    let from = String(wire?.from ?? "");
    let to = String(wire?.to ?? "");
    if (!PART_REF.test(from) || !PART_REF.test(to) || !ids.has(from.split(":")[0]) || !ids.has(to.split(":")[0])) {
      dropped++;
      continue;
    }
    // Validate every mcu-side pin against the board's REAL element pin names — the AI is
    // instructed to use these (see vibePayload), but a hallucinated or legacy pin name
    // would otherwise silently produce a wire that never renders/resolves. A diagram
    // with even one such pin is worse than no diagram (misleading), so drop the whole
    // thing rather than the single wire.
    const [fromPart, fromPin] = from.split(":");
    const [toPart, toPin] = to.split(":");
    if (fromPart === "mcu") {
      const real = fixBoardPin(board, fromPin);
      if (!real) {
        console.warn(`    dropped diagram — unresolved board pin mcu:${fromPin} (not a real ${board} pin)`);
        return null;
      }
      from = `mcu:${real}`;
    }
    if (toPart === "mcu") {
      const real = fixBoardPin(board, toPin);
      if (!real) {
        console.warn(`    dropped diagram — unresolved board pin mcu:${toPin} (not a real ${board} pin)`);
        return null;
      }
      to = `mcu:${real}`;
    }
    wires.push({ id: typeof wire.id === "string" && wire.id ? wire.id : `w${++w}`, from, to, color: wire.color });
  }
  if (dropped) console.warn(`    dropped ${dropped} invalid wire(s)`);
  // Ignore the AI's overlapping positions; lay out board-left + components in a
  // spaced column so nothing overlaps and the wiring stays unobstructed.
  return { board, parts: applyLayout(parts), wires };
}

// --- AI call (or mock) -------------------------------------------------------
async function login(): Promise<string> {
  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: BAKE_EMAIL, password: BAKE_PASSWORD }),
  });
  if (!res.ok) throw new Error(`login failed (HTTP ${res.status}) — is the backend running with seeded users?`);
  const data = (await res.json()) as { token?: string };
  if (!data.token) throw new Error("login returned no token");
  return data.token;
}

function mockDiagram(board: string): BakedDiagram {
  // A fixed tiny LED+resistor circuit — deterministic, no AI.
  return {
    board,
    parts: [
      { id: "mcu", type: `__board__:${board}`, x: 360, y: 220, rotation: 0 },
      { id: "resistor-1", type: "resistor", x: 480, y: 80, props: { value: "220" } },
      { id: "led-1", type: "led", x: 664, y: 80, props: { color: "red" } },
    ],
    wires: [
      { id: "w1", from: "mcu:13", to: "resistor-1:1", color: "#16a34a" },
      { id: "w2", from: "resistor-1:2", to: "led-1:A", color: "#ef4444" },
      { id: "w3", from: "led-1:C", to: "mcu:GND.1", color: "#000000" },
    ],
  };
}

async function generate(token: string | null, title: string, language: string, board: string, code: string): Promise<BakedDiagram | null> {
  if (MOCK) return sanitize(board, mockDiagram(board));
  const res = await fetch(`${API}/ai/vibe`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(vibePayload(title, language, board, code)),
  });
  if (!res.ok) {
    console.warn(`    /ai/vibe HTTP ${res.status} — skipping`);
    return null;
  }
  const data = (await res.json()) as { ok?: boolean; result?: { diagram?: BakedDiagram } };
  if (!data.ok || !data.result?.diagram) {
    console.warn("    vibe returned no diagram — skipping");
    return null;
  }
  return sanitize(board, data.result.diagram);
}

// --- walk content ------------------------------------------------------------
type Job = { courseSlug: string; lessonSlug: string; lessonTitle: string; language: string; board: string; code: string };

function collectJobs(): Job[] {
  const jobs: Job[] = [];
  const modules = CONTENT_MODULES as CourseModule[];
  for (const m of modules) {
    const courseSlug = m.meta.slug;
    if (ONLY && courseSlug !== ONLY) continue;
    for (const lesson of m.lessons) {
      if (EXCLUDE_LESSONS.has(lesson.slug)) continue; // catalogue lacks the sensor → code-only
      for (const block of lesson.body.blocks as Block[]) {
        if (block.type !== "code") continue;
        if (block.openInStudio === false) continue;
        const board = boardForBlock(courseSlug, block.language);
        if (!board) continue; // python/Linux/coding → no diagram
        jobs.push({
          courseSlug,
          lessonSlug: lesson.slug,
          lessonTitle: lesson.title,
          language: block.language,
          board,
          code: block.code,
        });
      }
    }
  }
  return jobs;
}

async function main() {
  const store = loadStore();
  const jobs = collectJobs();
  console.log(`${MOCK ? "[mock] " : ""}${jobs.length} robotics code example(s) to consider${ONLY ? ` (course=${ONLY})` : ""}.`);

  let token: string | null = null;
  if (!MOCK && jobs.length) token = await login();

  let baked = 0;
  let skipped = 0;
  for (const job of jobs) {
    const key = bakedKey(job.lessonSlug, job.code);
    if (!FORCE && store.entries[key]) {
      skipped++;
      continue;
    }
    console.log(`  baking ${job.lessonSlug} [${job.board}/${job.language}] …`);
    const diagram = await generate(token, job.lessonTitle, job.language, job.board, job.code);
    if (!diagram) continue;
    if (diagram.parts.length <= 1) {
      // No renderable components (e.g. a WiFi-only sketch, or every returned part
      // was an unknown catalog type and got dropped). A lone board is not a useful
      // lesson figure — skip so the lesson renders code-only, and clear any stale
      // entry for this key (a previously-good bake that is now empty).
      console.warn(`    no renderable components — skipping ${job.lessonSlug} (code-only)`);
      delete store.entries[key];
      continue;
    }
    store.entries[key] = { board: job.board, language: job.language, diagram };
    baked++;
  }

  saveStore(store);
  console.log(`Done. baked=${baked} skipped(unchanged)=${skipped} total-entries=${Object.keys(store.entries).length}`);
  console.log(`Wrote ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
