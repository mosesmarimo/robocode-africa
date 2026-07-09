// Temporary repro: does the ESP32 wiring simulation drive components in Studio?
// LED on D26 (digitalWrite 26) + pot on VP (analogRead 36) + button on D18 (digitalRead 18).
import { chromium } from "playwright";

const BASE = "http://localhost:3000";

const toB64Url = (s) => Buffer.from(s, "utf8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

const CODE = `void setup() {
  pinMode(26, OUTPUT);
  pinMode(18, INPUT_PULLUP);
  Serial.begin(115200);
}
void loop() {
  digitalWrite(26, HIGH);
  Serial.print("pot=");
  Serial.print(analogRead(36));
  Serial.print(" btn=");
  Serial.println(digitalRead(18));
  delay(400);
}`;

const DIAGRAM = {
  board: "esp32",
  parts: [
    { id: "mcu", type: "__board__:esp32", x: 360, y: 220, rotation: 0 },
    { id: "led1", type: "led", x: 640, y: 80, rotation: 0 },
    { id: "r1", type: "resistor", x: 640, y: 170, rotation: 0 },
    { id: "pot1", type: "potentiometer", x: 640, y: 260, rotation: 0 },
    { id: "btn1", type: "pushbutton", x: 640, y: 400, rotation: 0 },
  ],
  wires: [
    { id: "w1", from: "led1:A", to: "r1:1" },
    { id: "w2", from: "r1:2", to: "mcu:D26" },
    { id: "w3", from: "led1:C", to: "mcu:GND.1" },
    { id: "w4", from: "pot1:SIG", to: "mcu:VP" },
    { id: "w5", from: "pot1:VCC", to: "mcu:3V3" },
    { id: "w6", from: "pot1:GND", to: "mcu:GND.1" },
    { id: "w7", from: "btn1:1.l", to: "mcu:D18" },
    { id: "w8", from: "btn1:2.l", to: "mcu:GND.1" },
  ],
};

const url = `${BASE}/studio/new?mode=robotics&lang=arduino&board=esp32&code=${toB64Url(CODE)}&diagram=${toB64Url(JSON.stringify(DIAGRAM))}`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 950 } });
page.on("console", (m) => { if (m.type() === "error") console.log("PAGE ERROR:", m.text().slice(0, 300)); });

await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await page.fill("#email", "ada@robocode.africa");
await page.fill("#password", "password123");
await page.click('button:has-text("Sign in")');
await page.waitForURL("**/app", { timeout: 20000 });

await page.goto(url, { waitUntil: "networkidle" });
await page.waitForTimeout(4000);

// verify the diagram hydrated
const partCount = await page.evaluate(() => document.querySelectorAll("wokwi-led, wokwi-resistor, wokwi-potentiometer, wokwi-pushbutton").length);
console.log("hydrated part elements:", partCount);

await page.screenshot({ path: "/tmp/repro-esp32-before.png" });
await page.click('button:has-text("Run")');
await page.waitForTimeout(2500);
await page.screenshot({ path: "/tmp/repro-esp32-running.png" });

for (let i = 0; i < 4; i++) {
  const state = await page.evaluate(() => {
    const led = document.querySelector("wokwi-led");
    return { ledValue: led?.value, ledBrightness: led?.brightness };
  });
  console.log(`sample ${i}:`, JSON.stringify(state));
  await page.waitForTimeout(300);
}

const serial = await page.evaluate(() => {
  const pre = [...document.querySelectorAll("pre, div")].map((d) => d.textContent || "").filter((t) => t.includes("pot="));
  return pre.length ? pre[pre.length - 1].slice(-300) : "(no pot= lines found)";
});
console.log("serial tail:", serial.replace(/\s+/g, " "));

let failed = false;
const potMatch = serial.match(/pot=(\d+)/);
const pot = potMatch ? Number(potMatch[1]) : NaN;
const potOk = Math.abs(pot - 2047) <= 30;
console.log(potOk ? `PASS: pot=${pot} (~2047 +/-30)` : `FAIL: pot=${pot} expected ~2047 +/-30`);
if (!potOk) failed = true;

// Step 4: ESP32 board's built-in LED property is "led1" (board.builtinLedProp), driven by
// GPIO 2 (profile.ledBuiltin). Run the shipped ESP32 starter (blinks GPIO 2) on a bare board
// with no wiring and confirm led1 toggles over a ~5s window (samples 600ms apart).
const ESP32_STARTER = `void setup() {
  pinMode(2, OUTPUT);
  Serial.begin(115200);
}
void loop() {
  digitalWrite(2, HIGH);
  delay(500);
  digitalWrite(2, LOW);
  delay(500);
}`;
const BLINK_DIAGRAM = { board: "esp32", parts: [{ id: "mcu", type: "__board__:esp32", x: 360, y: 220, rotation: 0 }], wires: [] };
const blinkUrl = `${BASE}/studio/new?mode=robotics&lang=arduino&board=esp32&code=${toB64Url(ESP32_STARTER)}&diagram=${toB64Url(JSON.stringify(BLINK_DIAGRAM))}`;

await page.goto(blinkUrl, { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
await page.click('button:has-text("Run")');

const led1Samples = [];
for (let i = 0; i < 8; i++) {
  led1Samples.push(await page.evaluate(() => document.querySelector("wokwi-esp32-devkit-v1")?.led1));
  await page.waitForTimeout(600);
}
console.log("led1 samples (600ms apart):", JSON.stringify(led1Samples));
const led1Toggled = led1Samples.some((v, i) => i > 0 && v !== led1Samples[i - 1]);
console.log(led1Toggled ? "PASS: esp32 led1 toggled" : "FAIL: esp32 led1 never toggled");
if (!led1Toggled) failed = true;

await browser.close();
console.log(failed ? "REPRO DONE (FAILURES)" : "REPRO DONE (ALL PASS)");
if (failed) process.exitCode = 1;
