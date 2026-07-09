// Temporary repro: does the first-party rc-pi-pico board render (real GP pin labels) and
// does its ledBuiltIn property toggle while the default MicroPython starter runs (blinks
// Pin(25), the onboard LED, every 0.5s)?
import { chromium } from "playwright";

const BASE = "http://localhost:3000";

const toB64Url = (s) => Buffer.from(s, "utf8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

// studio/new only honors `board=` when a `code` snippet param is also present (see
// src/app/studio/[projectId]/page.tsx, the "snippet && mode !== 'coding'" branch) — a bare
// board=raspberry-pi-pico with no code falls back to arduino-uno. Pass the board's own
// starter (blinks Pin(25), prints "RoboCode Pico ready!") as the snippet.
const CODE = `# RoboCode.Africa — Raspberry Pi Pico (MicroPython)
from machine import Pin
import time

led = Pin(25, Pin.OUT)   # on-board LED
print("RoboCode Pico ready!")

while True:
    led.toggle()
    time.sleep(0.5)
`;

const url = `${BASE}/studio/new?mode=robotics&lang=micropython&board=raspberry-pi-pico&code=${toB64Url(CODE)}`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 950 } });
page.on("console", (m) => { if (m.type() === "error") console.log("PAGE ERROR:", m.text().slice(0, 300)); });

await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await page.fill("#email", "ada@robocode.africa");
await page.fill("#password", "password123");
await page.click('button:has-text("Sign in")');
await page.waitForURL("**/app", { timeout: 20000 });

await page.goto(url, { waitUntil: "networkidle" });
await page.waitForTimeout(2000);

let failed = false;

// Step 1: the rc-pi-pico element mounted with pinInfo (real GP-numbered pads), not the old
// wokwi-nano-rp2040-connect Nano element.
const mounted = await page.evaluate(() => {
  const el = document.querySelector('[data-rc-part="pico"]');
  const pins = el?.pinInfo?.map((p) => p.name) ?? [];
  return { found: !!el, pinCount: pins.length, hasGp0: pins.includes("GP0"), hasGp28: pins.includes("GP28"), hasNano: !!document.querySelector("wokwi-nano-rp2040-connect") };
});
console.log("mounted:", JSON.stringify(mounted));
if (!mounted.found || mounted.pinCount !== 40 || !mounted.hasGp0 || !mounted.hasGp28 || mounted.hasNano) failed = true;
console.log(failed ? "FAIL: pico element/pins not as expected" : "PASS: rc-pi-pico mounted with 40 GP-labelled pins, no Nano element");

await page.screenshot({ path: "/tmp/pico-board.png" });
console.log("screenshot saved: /tmp/pico-board.png");

// Step 2: run the default starter (blinks Pin(25) == GP25, the onboard LED, every 0.5s)
// and confirm ledBuiltIn toggles. rp2040js needs several real seconds of wall-clock time
// to simulate MicroPython's boot; give it room before sampling.
await page.click('button:has-text("Run")');
await page.waitForTimeout(8000);

// Informational only, not a hard gate: on a script with an infinite loop (never returns
// to the REPL), the emulated USB-CDC serial line in Rp2040Engine/rp2040-boot.ts does not
// reliably flush the pre-loop print() in our observation — confirmed via a standalone
// bootChip() test (no browser) where GP25 toggles fine but zero serial lines ever arrive
// for a looping script, vs. the terminating rp2040-smoke.ts fixture which prints fine.
// That's a pre-existing rp2040 sim-engine characteristic (out of scope for Task 7, which
// only swaps the board's visual element), not something introduced by rc-pi-pico.
const readyOk = await page.evaluate(() =>
  [...document.querySelectorAll(".whitespace-pre-wrap.break-words")].some((d) => (d.textContent || "").includes("RoboCode Pico ready!")),
);
console.log(readyOk ? "INFO: serial shows 'RoboCode Pico ready!'" : "INFO: serial print not observed (known rp2040 sim limitation on infinite-loop scripts, not a Task 7 regression)");

await page.screenshot({ path: "/tmp/pico-board-running.png" });

// rp2040js is a cycle-accurate emulator: wall-clock time to simulate the code's 0.5s
// sleep varies with host load, so two fixed 700ms-apart samples can land on the same
// value by chance. Poll repeatedly over a longer window and pass as soon as any two
// consecutive samples differ (still proves ledBuiltIn is live and toggling).
const samples = [];
let toggled = false;
for (let i = 0; i < 16 && !toggled; i++) {
  samples.push(await page.evaluate(() => document.querySelector('[data-rc-part="pico"]')?.ledBuiltIn));
  if (samples.length > 1 && samples[samples.length - 1] !== samples[samples.length - 2]) toggled = true;
  else await page.waitForTimeout(700);
}
console.log("ledBuiltIn samples (700ms apart):", JSON.stringify(samples));
console.log(toggled ? "PASS: ledBuiltIn toggled" : "FAIL: ledBuiltIn did not toggle");
if (!toggled) failed = true;

await browser.close();
console.log(failed ? "REPRO DONE (FAILURES)" : "REPRO DONE (ALL PASS)");
if (failed) process.exitCode = 1;
