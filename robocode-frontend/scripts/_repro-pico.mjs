// Temporary repro (Task 8): does the Pico (rp2040js) engine correctly forward pre-boot input
// state and apply it once MicroPython comes up? Pot on GP26 (default 512 -> mid-scale ~32768
// on read_u16()), button 1.l->GP14 / 2.r->3V3 (active-high, PULL_DOWN wiring per the lesson).
// Asserts BOTH that boot-buffering delivers the pot default and that netlist-based polarity
// detection reports the unpressed button as 0 (not the old pull-up "released=high" guess).
import { chromium } from "playwright";

const BASE = "http://localhost:3000";

const toB64Url = (s) => Buffer.from(s, "utf8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

const CODE = `from machine import ADC, Pin
import time
pot = ADC(Pin(26))
btn = Pin(14, Pin.IN, Pin.PULL_DOWN)
while True:
    print("pot=", pot.read_u16(), " btn=", btn.value())
    time.sleep(0.4)
`;

const DIAGRAM = {
  board: "raspberry-pi-pico",
  parts: [
    { id: "mcu", type: "__board__:raspberry-pi-pico", x: 360, y: 220, rotation: 0 },
    { id: "pot1", type: "potentiometer", x: 640, y: 260, rotation: 0 },
    { id: "btn1", type: "pushbutton", x: 640, y: 400, rotation: 0 },
  ],
  wires: [
    { id: "w1", from: "pot1:SIG", to: "mcu:GP26" },
    { id: "w2", from: "pot1:VCC", to: "mcu:3V3" },
    { id: "w3", from: "pot1:GND", to: "mcu:GND.1" },
    { id: "w4", from: "btn1:1.l", to: "mcu:GP14" },
    { id: "w5", from: "btn1:2.r", to: "mcu:3V3" },
  ],
};

const url = `${BASE}/studio/new?mode=robotics&lang=micropython&board=raspberry-pi-pico&code=${toB64Url(CODE)}&diagram=${toB64Url(JSON.stringify(DIAGRAM))}`;

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

const partCount = await page.evaluate(() => document.querySelectorAll("wokwi-potentiometer, wokwi-pushbutton").length);
console.log("hydrated part elements:", partCount);

let failed = false;

await page.screenshot({ path: "/tmp/repro-pico-before.png" });
await page.click('button:has-text("Run")');

// rp2040js needs several real seconds to boot the UF2 + MicroPython firmware before the
// worker posts "ready" and our own applyInput buffer flushes. Give this a generous timeout
// and poll for the first "pot=" serial line rather than a fixed sleep.
const bootDeadline = Date.now() + 25000;
let serialText = "";
while (Date.now() < bootDeadline) {
  serialText = await page.evaluate(() => {
    const nodes = [...document.querySelectorAll(".whitespace-pre-wrap.break-words")];
    return nodes.map((d) => d.textContent || "").join("\n");
  });
  if (/pot=/.test(serialText)) break;
  await page.waitForTimeout(500);
}
await page.screenshot({ path: "/tmp/repro-pico-running.png" });

const lines = serialText.split("\n").filter((l) => l.includes("pot="));
console.log("serial lines with pot=:", lines.length);
console.log("last line:", lines.length ? lines[lines.length - 1].trim() : "(none — boot never completed within 25s)");

if (!lines.length) {
  console.log("FAIL: no 'pot=' serial output observed within boot timeout");
  failed = true;
} else {
  const last = lines[lines.length - 1];
  const potMatch = last.match(/pot=\s*(\d+)/);
  const btnMatch = last.match(/btn=\s*(\d+)/);
  const pot = potMatch ? Number(potMatch[1]) : NaN;
  const btn = btnMatch ? Number(btnMatch[1]) : NaN;

  // Default potentiometer value is 512 (0..1023 scale) -> mid-scale on a 16-bit ADC read_u16()
  // is 512/1023*65535 ≈ 32768. Generous +/-2000 tolerance for ADC noise + scaling rounding.
  const potOk = Math.abs(pot - 32768) <= 2000;
  console.log(potOk ? `PASS: pot=${pot} (~32768 +/-2000)` : `FAIL: pot=${pot} expected ~32768 +/-2000`);
  if (!potOk) failed = true;

  // Button unpressed + active-high (2.r -> 3V3, PULL_DOWN) => btn.value() should read 0.
  const btnOk = btn === 0;
  console.log(btnOk ? `PASS: btn=${btn} (unpressed, active-high)` : `FAIL: btn=${btn} expected 0`);
  if (!btnOk) failed = true;
}

await browser.close();
console.log(failed ? "REPRO DONE (FAILURES)" : "REPRO DONE (ALL PASS)");
if (failed) process.exitCode = 1;
