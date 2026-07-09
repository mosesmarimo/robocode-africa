// One-off: make every baked-diagram wire resolve against the REAL rendered element pins
// (see scripts/element-pins.ts — @wokwi/elements pinInfo for arduino-uno/esp32, the
// first-party PiPicoBoard's pin list for the Pico) so the circuits are complete. The AI
// was given boards.ts GPIO names + COMPONENT_PINS, some of which don't match the
// rendered element pins, so many board-side wires silently didn't render. This maps
// them to the real names, fixes a couple of component-specific mismatches, excludes
// diagrams whose pins the rendered board can't represent, and validates that every
// remaining wire resolves AND every component is fully wired.
//   npx tsx scripts/repair-diagram-pins.ts
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { BOARD_PINS, COMP_PINS, fixBoardPin } from "./element-pins";

const OUT = resolve(__dirname, "../../robocode-backend/prisma/content/generated/baked-diagrams.json");

// Pins that MUST be wired for a complete circuit (optional pins like NC/DO/DOUT excluded).
// pushbutton: a 4-leg tactile switch's legs form two internally-bridged pairs (1.l~1.r,
// 2.l~2.r); wiring one pin from each pair (1.l + 2.r, as used below) is a complete circuit.
const REQUIRED: Record<string, string[]> = {
  resistor: ["1", "2"], led: ["A", "C"], buzzer: ["1", "2"], servo: ["GND", "V+", "PWM"],
  ultrasonic: ["VCC", "TRIG", "ECHO", "GND"], photoresistor: ["VCC", "GND", "AO"],
  pir: ["VCC", "OUT", "GND"], dht22: ["VCC", "SDA", "GND"], gas: ["VCC", "GND", "AOUT"],
  flame: ["VCC", "GND", "AOUT"], sound: ["VCC", "GND", "AOUT"], mpu6050: ["VCC", "GND", "SCL", "SDA"],
  "ir-receiver": ["GND", "VCC", "DAT"], "tilt-switch": ["GND", "VCC", "OUT"], potentiometer: ["GND", "SIG", "VCC"],
  pushbutton: ["1.l", "2.r"],
};

// Diagrams whose code uses GPIOs the rendered board cannot expose → exclude (lesson
// renders code-only). The two Pico lessons that used to live here now have a real,
// wireable board (Task 7's first-party rc-pi-pico element) and hand-authored entries
// (see scripts/add-pico-diagrams.ts), so nothing is excluded anymore.
const EXCLUDE = new Set<string>([]);

// Historic bug (see gpioOf below): a broken first loop made the real signal-pin lookup
// unreachable, so every previously-repaired tilt-switch's wire collapsed to the hardcoded
// "2" fallback, discarding whatever pin the AI actually chose. The committed sensor-tilt
// entry's mcu:2 is that corrupted fallback — NOT recoverable from the committed wire
// itself (gpioOf(), even fixed, just reads back the already-wrong "2"). Confirmed from
// the original raw bake (git history, commit 56f5dc2: "mcu:3 -> tilt-switch-1:1") that the
// AI actually wired pin 3, which also matches this lesson's own TILT_PIN = 3
// (prisma/content/robo-sensors-3.ts) — restore it explicitly.
const KNOWN_SIGNAL_OVERRIDE: Record<string, string> = { "sensor-tilt": "3" };

type Wire = { id: string; from: string; to: string; color?: string };
type Part = { id: string; type: string; x: number; y: number; rotation?: number; props?: unknown };
type Entry = { board: string; language: string; diagram: { board: string; parts: Part[]; wires: Wire[] } };
type Store = { version: number; entries: Record<string, Entry> };

const store = JSON.parse(readFileSync(OUT, "utf8")) as Store;
const typeOf = (parts: Part[], id: string) => parts.find((p) => p.id === id)?.type ?? null;

// 1) Exclude diagrams the board can't represent.
for (const key of Object.keys(store.entries)) {
  if (EXCLUDE.has(key.split(":")[0])) delete store.entries[key];
}

// helpers for per-diagram surgery
function gpioOf(wires: Wire[], partId: string): string | null {
  for (const w of wires) {
    const f = w.from.split(":"), t = w.to.split(":");
    if (f[0] === partId && t[0] === "mcu") return t[1];
    if (t[0] === partId && f[0] === "mcu") return f[1];
  }
  return null;
}

for (const [key, e] of Object.entries(store.entries)) {
  const slug = key.split(":")[0];
  const d = e.diagram;

  // 2) sensor-ir: drop the spurious extra photoresistor (lesson is the IR receiver).
  if (slug === "sensor-ir") {
    const remove = d.parts.filter((p) => p.type === "photoresistor").map((p) => p.id);
    if (remove.length) {
      d.parts = d.parts.filter((p) => !remove.includes(p.id));
      d.wires = d.wires.filter((w) => !remove.includes(w.from.split(":")[0]) && !remove.includes(w.to.split(":")[0]));
    }
  }

  // 3) tilt-switch: the element is a 3-pin module (GND/VCC/OUT); re-wire it properly.
  for (const tilt of d.parts.filter((p) => p.type === "tilt-switch")) {
    // the GPIO the AI used for the switch signal (or the known-correct override above)
    const sig = KNOWN_SIGNAL_OVERRIDE[slug] ?? gpioOf(d.wires, tilt.id) ?? "2";
    d.wires = d.wires.filter((w) => w.from.split(":")[0] !== tilt.id && w.to.split(":")[0] !== tilt.id);
    let n = d.wires.length;
    d.wires.push({ id: `tw${++n}`, from: `${tilt.id}:VCC`, to: "mcu:5V", color: "red" });
    d.wires.push({ id: `tw${++n}`, from: `${tilt.id}:GND`, to: "mcu:GND", color: "black" });
    d.wires.push({ id: `tw${++n}`, from: `${tilt.id}:OUT`, to: `mcu:${sig}`, color: "green" });
  }

  // 4) Rename every wire endpoint to the real element pin name.
  const fixed: Wire[] = [];
  for (const w of d.wires) {
    const ends = [w.from, w.to].map((ep) => {
      const [pid, pin] = ep.split(":");
      if (pid === "mcu") { const f = fixBoardPin(d.board, pin); return f ? `mcu:${f}` : null; }
      const t = typeOf(d.parts, pid);
      return t && (COMP_PINS[t] ?? []).includes(pin) ? ep : null;
    });
    if (ends[0] && ends[1]) fixed.push({ ...w, from: ends[0], to: ends[1] });
    else console.warn(`  ${slug}: STILL BROKEN ${w.from} -> ${w.to}`);
  }
  d.wires = fixed;
}

// 5) Validate: every wire resolves + every component's required pins wired.
let problems = 0;
for (const [key, e] of Object.entries(store.entries)) {
  const slug = key.split(":")[0];
  const d = e.diagram;
  const used: Record<string, Set<string>> = {};
  for (const w of d.wires) for (const ep of [w.from, w.to]) { const [pid, pin] = ep.split(":"); (used[pid] ??= new Set()).add(pin); }
  const boardReal = new Set(BOARD_PINS[d.board] ?? []);
  for (const w of d.wires) for (const ep of [w.from, w.to]) {
    const [pid, pin] = ep.split(":");
    const ok = pid === "mcu" ? boardReal.has(pin) : (COMP_PINS[typeOf(d.parts, pid) ?? ""] ?? []).includes(pin);
    if (!ok) { console.log(`✗ ${slug}: unresolved ${ep}`); problems++; }
  }
  for (const p of d.parts) {
    if (p.id === "mcu" || String(p.type).startsWith("__board__")) continue;
    const req = REQUIRED[p.type] ?? COMP_PINS[p.type] ?? [];
    const u = used[p.id] ?? new Set();
    const missing = req.filter((r) => !u.has(r));
    if (missing.length) { console.log(`✗ ${slug}: ${p.id} (${p.type}) UNWIRED ${missing.join(",")}`); problems++; }
  }
}

writeFileSync(OUT, JSON.stringify(store, null, 2) + "\n", "utf8");
const excludedNote = EXCLUDE.size ? ` (excluded ${[...EXCLUDE].join(", ")})` : "";
console.log(`\nEntries: ${Object.keys(store.entries).length}${excludedNote}.`);
console.log(problems === 0 ? "✓ ALL circuits complete: every wire resolves + every component fully wired." : `${problems} remaining problem(s).`);
