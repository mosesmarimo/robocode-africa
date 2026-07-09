// Deterministic gate for the diagram URL codec (npx tsx).
//   npx tsx scripts/diagram-url-smoke.ts
// Asserts: decodeStudioDiagram(encodeStudioDiagram(d)) deep-equals d for a valid
// diagram; a wrong-board decode returns null; an oversize diagram is omitted from
// studioHref while a small one is included.
import {
  encodeStudioDiagram,
  decodeStudioDiagram,
  studioHref,
  STUDIO_DIAGRAM_MAX,
  type BakedDiagram,
} from "../src/lib/studio/open-in-studio";

function deepEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error("FAIL:", msg);
    process.exit(1);
  }
}

const d: BakedDiagram = {
  board: "esp32",
  parts: [
    { id: "mcu", type: "__board__:esp32", x: 360, y: 220, rotation: 0 },
    { id: "led-1", type: "led", x: 560, y: 120, props: { color: "red" } },
    { id: "resistor-1", type: "resistor", x: 500, y: 120, props: { value: "220" } },
  ],
  wires: [
    { id: "w1", from: "mcu:2", to: "resistor-1:1", color: "#16a34a" },
    { id: "w2", from: "resistor-1:2", to: "led-1:A", color: "#ef4444" },
    { id: "w3", from: "led-1:C", to: "mcu:GND.1", color: "#000000" },
  ],
};

// 1) round-trip on the matching board
const round = decodeStudioDiagram(encodeStudioDiagram(d), "esp32");
assert(round !== null, "round-trip decode returned null");
assert(deepEqual(round, d), "round-trip is not deep-equal");

// 2) wrong-board decode rejects
assert(decodeStudioDiagram(encodeStudioDiagram(d), "arduino-uno") === null, "wrong-board decode should be null");

// 3) studioHref includes a small diagram
const small = studioHref("micropython", "print('hi')", "esp32", d);
assert(small.includes("&diagram=") || small.includes("diagram="), "small diagram should be in the URL");
assert(small.includes("mode=robotics"), "esp32 board should force mode=robotics");
assert(small.includes("board=esp32"), "board param should be esp32");

// 4) studioHref omits an oversize diagram (graceful)
const huge: BakedDiagram = {
  board: "esp32",
  parts: [{ id: "mcu", type: "__board__:esp32", x: 0, y: 0 }],
  wires: Array.from({ length: 4000 }, (_, i) => ({ id: `w${i}`, from: "mcu:2", to: "mcu:GND.1", color: "#000000" })),
};
assert(encodeStudioDiagram(huge).length > STUDIO_DIAGRAM_MAX, "huge diagram should exceed the cap (test fixture sanity)");
const hugeUrl = studioHref("micropython", "print('hi')", "esp32", huge);
assert(!hugeUrl.includes("diagram="), "oversize diagram must be omitted from the URL");
assert(hugeUrl.includes("code="), "code must still be present when diagram is omitted");

console.log("PASS (diagram-url-smoke)");
