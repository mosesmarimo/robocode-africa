// Deterministic, firmware-free gate for the pure Ws2812Decoder (npx tsx).
// Builds a synthetic (nanos, isHigh) edge stream by hand — no rp2040js, no
// emulator timing — so it isolates the decoder's pulse-width/GRB->RGB logic.
//   npx tsx scripts/neopixel-decoder-smoke.ts
import { Ws2812Decoder } from "../src/lib/sim/neopixel-decoder";

// WS2812 wire order is GRB, MSB-first. Build the 24 wire bits for one pixel
// from display RGB by laying out G then R then B, each MSB-first.
function grbBits(r: number, g: number, b: number): number[] {
  const byteBits = (v: number) =>
    Array.from({ length: 8 }, (_, i) => (v >> (7 - i)) & 1);
  return [...byteBits(g), ...byteBits(r), ...byteBits(b)];
}

// Timings (ns): T0H=400 (bit 0), T1H=800 (bit 1), full bit period ~1250.
const T0H = 400;
const T1H = 800;
const PERIOD = 1250;

const dec = new Ws2812Decoder({ partId: "p0" });

let t = 0;
const emitBit = (bit: number) => {
  // rising edge
  dec.edge(t, true);
  // falling edge after the HIGH pulse
  t += bit ? T1H : T0H;
  dec.edge(t, false);
  // remainder of the bit period stays LOW
  t += PERIOD - (bit ? T1H : T0H);
};

const bits = [
  ...grbBits(255, 0, 0), // pixel0 = red
  ...grbBits(0, 255, 0), // pixel1 = green
];
for (const bit of bits) emitBit(bit);

// LATCH: a long LOW gap, then a trailing rising edge to finalize the frame.
t += 60000; // >= RESET_LOW_NS (50000)
dec.edge(t, true);

const snap = dec.snapshot();
const expected = [255, 0, 0, 0, 255, 0];
const got = snap.pixels;
const ok =
  got.length === expected.length &&
  expected.every((v, i) => v === got[i]) &&
  dec.frameCount >= 1;

console.log("frameCount:", dec.frameCount, "dirty:", dec.dirty);
console.log("pixels:", JSON.stringify(got));
if (!ok) {
  console.error("FAIL: expected", JSON.stringify(expected), "got", JSON.stringify(got));
  process.exit(1);
}
console.log("PASS (neopixel-decoder)");
