// Shared, idempotent-seed-friendly definitions for the "starter template" robotics
// projects (isTemplate: true, kind: "robotics" — the default `kind`). Each board
// (arduino-uno / esp32 / raspberry-pi-pico) ships at least 5 templates.
//
// Consumed by:
//   - prisma/seed-robotics-templates.ts  (idempotent prod/dev seeder — `pnpm db:seed-robotics`)
//   - prisma/seed.ts                     (destructive dev seed — reuses these definitions
//                                          instead of duplicating diagram/code content)
//
// Diagram JSON shape matches every other hand-authored diagram in this repo:
//   { board?, parts: [{ id, type, x, y, rotation?, props? }], wires: [{ id, from, to, color }] }
// Wire endpoint pin vocabulary is board- and part-specific and was verified against:
//   - robocode-frontend/node_modules/@wokwi/elements (esp32-devkit-v1, led, resistor,
//     pushbutton, potentiometer, photoresistor-sensor, neopixel, ssd1306 element pinInfo)
//   - robocode-frontend/src/components/studio/pi-pico-board.tsx (first-party Pico pin labels:
//     GP0-GP22, GP25-GP28, GND.1-GND.7, 3V3, VBUS, VSYS, ADC_VREF, AGND, RUN, 3V3_EN)
//   - robocode-frontend/src/lib/sim/board-profile.ts (ESP32 GPIO/analog/touch/dac pin sets)
// so every part in every template below is wired to a real, simulate-able pin.

/* eslint-disable @typescript-eslint/no-explicit-any */
type AnyJson = Record<string, unknown>;

export interface RoboticsTemplateFile {
  name: string;
  language: string;
  content: string;
}

export interface RoboticsTemplate {
  title: string;
  description: string;
  boardType: "arduino-uno" | "esp32" | "raspberry-pi-pico";
  diagram: AnyJson;
  files: RoboticsTemplateFile[];
}

// Demo wires use the Studio's automatic orthogonal "bus" routing (no baked bend
// points), so every wire connects cleanly to the real component pins and the
// connected pins are colour-matched to their wire. Mirrors seed.ts's `routed()`.
function routed(d: AnyJson): AnyJson {
  for (const w of d.wires as AnyJson[]) delete w.points;
  return d;
}

// =============================================================================
// Arduino UNO — 5 templates (all 6 pre-existing pieces of content moved here
// VERBATIM from prisma/seed.ts; titles/diagrams/code are byte-for-byte unchanged
// except "ESP32 Blink" which is filed under the ESP32 section below).
// =============================================================================

export function blinkDiagram(): AnyJson {
  return routed({
    board: "arduino-uno",
    parts: [
      { id: "mcu", type: "__board__:arduino-uno", x: 48, y: 160, rotation: 0 },
      { id: "r1", type: "resistor", x: 456, y: 128, rotation: 0, props: { value: "220" } },
      { id: "led1", type: "led", x: 616, y: 104, rotation: 0, props: { color: "red" } },
    ],
    wires: [
      { id: "w1", from: "mcu:13", to: "r1:1", color: "#16a34a" },
      { id: "w2", from: "r1:2", to: "led1:A", color: "#ef4444" },
      { id: "w3", from: "led1:C", to: "mcu:GND.1", color: "#000000" },
    ],
  });
}

export const BLINK_CODE = `void setup() {
  pinMode(13, OUTPUT);
  Serial.begin(9600);
  Serial.println("Blink ready");
}
void loop() {
  digitalWrite(13, HIGH);
  delay(400);
  digitalWrite(13, LOW);
  delay(400);
}`;

function lcdDiagram(): AnyJson {
  return routed({
    board: "arduino-uno",
    parts: [
      { id: "mcu", type: "__board__:arduino-uno", x: 48, y: 224, rotation: 0 },
      { id: "lcd1", type: "lcd1602", x: 456, y: 72, rotation: 0, props: { pins: "i2c" } },
    ],
    wires: [
      { id: "w1", from: "mcu:5V", to: "lcd1:VCC", color: "#ef4444" },
      { id: "w2", from: "mcu:GND.1", to: "lcd1:GND", color: "#000000" },
      { id: "w3", from: "mcu:A4", to: "lcd1:SDA", color: "#2563ff" },
      { id: "w4", from: "mcu:A5", to: "lcd1:SCL", color: "#f59e0b" },
    ],
  });
}

const LCD_CODE = `#include <Wire.h>
#include <LiquidCrystal_I2C.h>

LiquidCrystal_I2C lcd(0x27, 16, 2);

void setup() {
  lcd.init();
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print("RoboCode.Africa");
  lcd.setCursor(0, 1);
  lcd.print("Hello, world!");
}

void loop() {}`;

function neoDiagram(): AnyJson {
  return routed({
    board: "arduino-uno",
    parts: [
      { id: "mcu", type: "__board__:arduino-uno", x: 48, y: 208, rotation: 0 },
      { id: "np1", type: "neopixel", x: 536, y: 96, rotation: 0 },
    ],
    wires: [
      { id: "w1", from: "mcu:5V", to: "np1:VDD", color: "#ef4444" },
      { id: "w2", from: "mcu:GND.1", to: "np1:VSS", color: "#000000" },
      { id: "w3", from: "mcu:6", to: "np1:DIN", color: "#16a34a" },
    ],
  });
}

const NEO_CODE = `#include <Adafruit_NeoPixel.h>

Adafruit_NeoPixel pixel(1, 6, NEO_GRB + NEO_KHZ800);

void setup() {
  pixel.begin();
}

void loop() {
  pixel.setPixelColor(0, pixel.Color(255, 0, 0));
  pixel.show();
  delay(400);
  pixel.setPixelColor(0, pixel.Color(0, 255, 0));
  pixel.show();
  delay(400);
  pixel.setPixelColor(0, pixel.Color(0, 0, 255));
  pixel.show();
  delay(400);
}`;

// ---- Wokwi-imported example projects (Digital Alarm Clock / Keypad Door Lock) ----

const WK_TAG: Record<string, string> = {
  "wokwi-arduino-uno": "__board__:arduino-uno",
  "wokwi-esp32-devkit-v1": "__board__:esp32",
  "wokwi-7segment": "7segment", "wokwi-buzzer": "buzzer", "wokwi-pushbutton": "pushbutton",
  "wokwi-ds1307": "ds1307", "wokwi-membrane-keypad": "keypad", "wokwi-servo": "servo",
  "wokwi-lcd1602": "lcd1602", "wokwi-resistor": "resistor", "wokwi-led": "led",
};
const WK_COLOR: Record<string, string> = {
  black: "#1f2937", red: "#ef4444", green: "#16a34a", blue: "#2563ff", gold: "#f59e0b",
  orange: "#f97316", purple: "#a855f7", gray: "#64748b", grey: "#64748b", cyan: "#06b6d4",
  brown: "#92400e", pink: "#ec4899", white: "#e5e7eb", yellow: "#eab308",
};

function fromWokwi(wk: any): AnyJson {
  const board = wk.parts.find((p: any) => String(p.type).includes("arduino") || String(p.type).includes("esp32"));
  const oldBoardId = board?.id;
  const boardCatalog = WK_TAG[board?.type] ?? "__board__:arduino-uno";
  const boardId = boardCatalog.split(":")[1];
  const parts: any[] = [];
  for (const p of wk.parts) {
    if (p.id === oldBoardId) { parts.push({ id: "mcu", type: boardCatalog, x: p.left ?? 0, y: p.top ?? 0, rotation: p.rotate ?? 0 }); continue; }
    const cat = WK_TAG[p.type];
    if (!cat) continue;
    parts.push({ id: p.id, type: cat, x: p.left ?? 0, y: p.top ?? 0, rotation: p.rotate ?? 0, props: p.attrs ?? undefined });
  }
  const ids = new Set(parts.map((p) => p.id));
  const remap = (ref: string) => (ref.startsWith(oldBoardId + ":") ? "mcu:" + ref.slice(oldBoardId.length + 1) : ref);
  const wires: any[] = [];
  let i = 0;
  for (const c of wk.connections) {
    const from = remap(c[0]);
    const to = remap(c[1]);
    if (!ids.has(from.split(":")[0]) || !ids.has(to.split(":")[0])) continue;
    wires.push({ id: "w" + i++, from, to, color: WK_COLOR[c[2]] ?? "#64748b" });
  }
  return { board: boardId, parts, wires };
}

const WK_CLOCK = {
  parts: [
    { type: "wokwi-7segment", id: "7segment", top: -29, left: 330, rotate: 0, attrs: { commonPin: "anode", digits: "4", colon: "1" } },
    { type: "wokwi-buzzer", id: "buzzer1", top: 190, left: 466, rotate: 90, attrs: {} },
    { type: "wokwi-pushbutton", id: "pushbutton1", top: 110, left: 300, attrs: { label: "Hours", color: "green" } },
    { type: "wokwi-pushbutton", id: "pushbutton2", top: 110, left: 380, attrs: { label: "Minutes", color: "green" } },
    { type: "wokwi-pushbutton", id: "pushbutton3", top: 110, left: 460, attrs: { label: "Alarm" } },
    { type: "wokwi-ds1307", id: "ds1307", top: 235, left: 283, attrs: {} },
    { type: "wokwi-arduino-uno", id: "arduino", top: 0, left: 0, attrs: {} },
  ],
  connections: [
    ["7segment:DIG1", "arduino:2", "gold", []], ["7segment:DIG2", "arduino:3", "green", []],
    ["7segment:DIG3", "arduino:4", "orange", []], ["7segment:DIG4", "arduino:5", "purple", []],
    ["7segment:A", "arduino:6", "gray", []], ["7segment:B", "arduino:7", "purple", []],
    ["7segment:C", "arduino:8", "blue", []], ["7segment:D", "arduino:9", "cyan", []],
    ["7segment:E", "arduino:10", "green", []], ["7segment:F", "arduino:11", "brown", []],
    ["7segment:G", "arduino:12", "orange", []], ["7segment:CLN", "arduino:13", "cyan", []],
    ["7segment:COM", "arduino:5V", "red", []], ["buzzer1:1", "arduino:GND.2", "black", []],
    ["buzzer1:2", "arduino:A3", "orange", []], ["pushbutton1:1.l", "arduino:A0", "green", []],
    ["pushbutton1:2.l", "arduino:GND.2", "black", []], ["pushbutton2:1.l", "arduino:A1", "gray", []],
    ["pushbutton2:2.l", "arduino:GND.2", "black", []], ["pushbutton3:1.l", "arduino:A2", "purple", []],
    ["pushbutton3:2.l", "arduino:GND.2", "black", []], ["ds1307:GND", "arduino:GND.2", "black", []],
    ["ds1307:5V", "arduino:5V", "red", []], ["ds1307:SDA", "arduino:A4", "blue", []],
    ["ds1307:SCL", "arduino:A5", "gold", []],
  ],
};

const WK_KEYPAD = {
  parts: [
    { id: "uno", type: "wokwi-arduino-uno", top: 200, left: 20 },
    { id: "keypad", type: "wokwi-membrane-keypad", left: 360, top: 140 },
    { id: "servo", type: "wokwi-servo", left: 400, top: 20, attrs: { hornColor: "black" } },
    { id: "lcd", type: "wokwi-lcd1602", top: 8, left: 20 },
    { id: "r1", type: "wokwi-resistor", top: 140, left: 220, attrs: { value: "220" } },
  ],
  connections: [
    ["uno:GND.1", "lcd:VSS", "black", []], ["uno:GND.1", "lcd:K", "black", []], ["uno:GND.1", "lcd:RW", "black", []],
    ["uno:5V", "lcd:VDD", "red", []], ["uno:5V", "r1:2", "red", []], ["r1:1", "lcd:A", "pink", []],
    ["uno:12", "lcd:RS", "blue", []], ["uno:11", "lcd:E", "purple", []], ["uno:10", "lcd:D4", "green", []],
    ["uno:9", "lcd:D5", "brown", []], ["uno:8", "lcd:D6", "gold", []], ["uno:7", "lcd:D7", "gray", []],
    ["uno:6", "servo:PWM", "orange", []], ["uno:5V", "servo:V+", "red", []], ["uno:GND.1", "servo:GND", "black", []],
    ["uno:A3", "keypad:C1", "brown", []], ["uno:A2", "keypad:C2", "gray", []], ["uno:A1", "keypad:C3", "orange", []],
    ["uno:A0", "keypad:C4", "pink", []], ["uno:5", "keypad:R1", "blue", []], ["uno:4", "keypad:R2", "green", []],
    ["uno:3", "keypad:R3", "purple", []], ["uno:2", "keypad:R4", "gold", []],
  ],
};

const CLOCK_CODE = `// RoboCode.Africa — 7-segment digital clock
// Demo sketch: press a button to sound the buzzer.
int buttons[] = {A0, A1, A2};
int notes[] = {262, 330, 392};
const int BUZZER = A3;

void setup() {
  for (int i = 0; i < 3; i++) pinMode(buttons[i], INPUT_PULLUP);
  pinMode(BUZZER, OUTPUT);
  Serial.begin(9600);
  Serial.println("Clock ready — press Hours / Minutes / Alarm");
}

void loop() {
  bool pressed = false;
  for (int i = 0; i < 3; i++) {
    if (digitalRead(buttons[i]) == LOW) {
      tone(BUZZER, notes[i]);
      Serial.print("Button ");
      Serial.println(i + 1);
      pressed = true;
    }
  }
  if (!pressed) noTone(BUZZER);
  delay(60);
}`;

const KEYPAD_CODE = `// RoboCode.Africa — keypad + servo door lock
// Demo sketch: LCD status + servo "lock/unlock".
#include <LiquidCrystal.h>
#include <Servo.h>

LiquidCrystal lcd(12, 11, 10, 9, 8, 7);
Servo lock;
bool open = false;

void setup() {
  lcd.begin(16, 2);
  lock.attach(6);
  lcd.print("RoboCode Lock");
  lock.write(0);
}

void loop() {
  open = !open;
  lcd.setCursor(0, 1);
  if (open) { lcd.print("Status: OPEN  "); lock.write(90); }
  else      { lcd.print("Status: LOCKED"); lock.write(0); }
  delay(1500);
}`;

// =============================================================================
// ESP32 — 5 templates ("ESP32 Blink" is pre-existing, moved verbatim; the other
// 4 are new. All use component ids from robocode-frontend/src/lib/domain/components.ts
// and ESP32 wire-pin labels (D<n>, VP, VN, 3V3, GND.1/GND.2) confirmed against the
// wokwi-esp32-devkit-v1 element's own pinInfo. Touch pins were deliberately AVOIDED:
// the interpreter's touchRead() always returns a constant (m.touch[pin] ?? 70) — no
// component/UI path ever writes m.touch, so a "touch lamp" template would never
// react to anything in the simulator.
// =============================================================================

function esp32Diagram(): AnyJson {
  return routed({
    board: "esp32",
    parts: [
      { id: "mcu", type: "__board__:esp32", x: 48, y: 120, rotation: 0 },
      { id: "r1", type: "resistor", x: 440, y: 96, rotation: 0, props: { value: "220" } },
      { id: "led1", type: "led", x: 600, y: 72, rotation: 0, props: { color: "green" } },
    ],
    wires: [
      { id: "w1", from: "mcu:D2", to: "r1:1", color: "#16a34a" },
      { id: "w2", from: "r1:2", to: "led1:A", color: "#ef4444" },
      { id: "w3", from: "led1:C", to: "mcu:GND.1", color: "#000000" },
    ],
  });
}

const ESP32_LED_CODE = `// ESP32 — blink an external LED on GPIO 2
void setup() {
  pinMode(2, OUTPUT);
  Serial.begin(115200);
  Serial.println("ESP32 ready!");
}

void loop() {
  digitalWrite(2, HIGH);
  delay(400);
  digitalWrite(2, LOW);
  delay(400);
}`;

function esp32TrafficLightDiagram(): AnyJson {
  return routed({
    board: "esp32",
    parts: [
      { id: "mcu", type: "__board__:esp32", x: 260, y: 200, rotation: 0 },
      { id: "r1", type: "resistor", x: 520, y: 40, rotation: 0, props: { value: "220" } },
      { id: "led-red", type: "led", x: 680, y: 20, rotation: 0, props: { color: "red" } },
      { id: "r2", type: "resistor", x: 520, y: 160, rotation: 0, props: { value: "220" } },
      { id: "led-yellow", type: "led", x: 680, y: 140, rotation: 0, props: { color: "yellow" } },
      { id: "r3", type: "resistor", x: 520, y: 280, rotation: 0, props: { value: "220" } },
      { id: "led-green", type: "led", x: 680, y: 260, rotation: 0, props: { color: "green" } },
    ],
    wires: [
      { id: "w1", from: "mcu:D18", to: "r1:1", color: "#ef4444" },
      { id: "w2", from: "r1:2", to: "led-red:A", color: "#ef4444" },
      { id: "w3", from: "led-red:C", to: "mcu:GND.1", color: "#000000" },
      { id: "w4", from: "mcu:D19", to: "r2:1", color: "#f59e0b" },
      { id: "w5", from: "r2:2", to: "led-yellow:A", color: "#f59e0b" },
      { id: "w6", from: "led-yellow:C", to: "mcu:GND.1", color: "#000000" },
      { id: "w7", from: "mcu:D21", to: "r3:1", color: "#16a34a" },
      { id: "w8", from: "r3:2", to: "led-green:A", color: "#16a34a" },
      { id: "w9", from: "led-green:C", to: "mcu:GND.2", color: "#000000" },
    ],
  });
}

const ESP32_TRAFFIC_LIGHT_CODE = `// ESP32 — traffic light on three LEDs
const int RED = 18, YELLOW = 19, GREEN = 21;

void setup() {
  pinMode(RED, OUTPUT);
  pinMode(YELLOW, OUTPUT);
  pinMode(GREEN, OUTPUT);
  Serial.begin(115200);
  Serial.println("Traffic light ready!");
}

void loop() {
  digitalWrite(GREEN, HIGH);
  delay(3000);
  digitalWrite(GREEN, LOW);
  digitalWrite(YELLOW, HIGH);
  delay(1000);
  digitalWrite(YELLOW, LOW);

  digitalWrite(RED, HIGH);
  delay(3000);
  digitalWrite(RED, LOW);
  digitalWrite(YELLOW, HIGH);
  delay(1000);
  digitalWrite(YELLOW, LOW);
}`;

function esp32ButtonLedDiagram(): AnyJson {
  return routed({
    board: "esp32",
    parts: [
      { id: "mcu", type: "__board__:esp32", x: 260, y: 200, rotation: 0 },
      { id: "btn1", type: "pushbutton", x: 520, y: 80, rotation: 0, props: { color: "blue" } },
      { id: "r1", type: "resistor", x: 520, y: 280, rotation: 0, props: { value: "220" } },
      { id: "led1", type: "led", x: 680, y: 260, rotation: 0, props: { color: "blue" } },
    ],
    wires: [
      { id: "w1", from: "btn1:1.l", to: "mcu:D4", color: "#16a34a" },
      { id: "w2", from: "btn1:2.l", to: "mcu:GND.1", color: "#000000" },
      { id: "w3", from: "mcu:D5", to: "r1:1", color: "#2563ff" },
      { id: "w4", from: "r1:2", to: "led1:A", color: "#2563ff" },
      { id: "w5", from: "led1:C", to: "mcu:GND.2", color: "#000000" },
    ],
  });
}

const ESP32_BUTTON_LED_CODE = `// ESP32 — press a button to switch an LED on and off
const int BUTTON_PIN = 4;
const int LED_PIN = 5;

void setup() {
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  pinMode(LED_PIN, OUTPUT);
  Serial.begin(115200);
  Serial.println("Button + LED ready!");
}

void loop() {
  bool pressed = digitalRead(BUTTON_PIN) == LOW;
  digitalWrite(LED_PIN, pressed ? HIGH : LOW);
}`;

function esp32DimmerDiagram(): AnyJson {
  return routed({
    board: "esp32",
    parts: [
      { id: "mcu", type: "__board__:esp32", x: 260, y: 200, rotation: 0 },
      { id: "pot1", type: "potentiometer", x: 520, y: 80, rotation: 0 },
      { id: "r1", type: "resistor", x: 520, y: 280, rotation: 0, props: { value: "220" } },
      { id: "led1", type: "led", x: 680, y: 260, rotation: 0, props: { color: "yellow" } },
    ],
    wires: [
      { id: "w1", from: "mcu:3V3", to: "pot1:VCC", color: "#ef4444" },
      { id: "w2", from: "mcu:GND.1", to: "pot1:GND", color: "#000000" },
      { id: "w3", from: "pot1:SIG", to: "mcu:D34", color: "#f59e0b" },
      { id: "w4", from: "mcu:D25", to: "r1:1", color: "#2563ff" },
      { id: "w5", from: "r1:2", to: "led1:A", color: "#2563ff" },
      { id: "w6", from: "led1:C", to: "mcu:GND.2", color: "#000000" },
    ],
  });
}

const ESP32_DIMMER_CODE = `// ESP32 — dim an LED with a potentiometer (ADC -> LEDC PWM)
const int POT_PIN = 34;
const int LED_PIN = 25;
const int LEDC_CHANNEL = 0;

void setup() {
  Serial.begin(115200);
  ledcSetup(LEDC_CHANNEL, 5000, 8);   // 5 kHz, 8-bit resolution (0-255)
  ledcAttachPin(LED_PIN, LEDC_CHANNEL);
  Serial.println("Dimmer ready!");
}

void loop() {
  int raw = analogRead(POT_PIN);            // 0-4095 (12-bit ADC)
  int duty = map(raw, 0, 4095, 0, 255);
  ledcWrite(LEDC_CHANNEL, duty);
  delay(20);
}`;

function esp32NightLightDiagram(): AnyJson {
  return routed({
    board: "esp32",
    parts: [
      { id: "mcu", type: "__board__:esp32", x: 260, y: 200, rotation: 0 },
      { id: "ldr1", type: "photoresistor", x: 520, y: 80, rotation: 0 },
      { id: "r1", type: "resistor", x: 520, y: 280, rotation: 0, props: { value: "220" } },
      { id: "led1", type: "led", x: 680, y: 260, rotation: 0, props: { color: "yellow" } },
    ],
    wires: [
      { id: "w1", from: "mcu:3V3", to: "ldr1:VCC", color: "#ef4444" },
      { id: "w2", from: "mcu:GND.1", to: "ldr1:GND", color: "#000000" },
      { id: "w3", from: "ldr1:AO", to: "mcu:D35", color: "#f59e0b" },
      { id: "w4", from: "mcu:D26", to: "r1:1", color: "#2563ff" },
      { id: "w5", from: "r1:2", to: "led1:A", color: "#2563ff" },
      { id: "w6", from: "led1:C", to: "mcu:GND.2", color: "#000000" },
    ],
  });
}

const ESP32_NIGHT_LIGHT_CODE = `// ESP32 — turn on a light automatically when the room gets dark
const int LDR_PIN = 35;
const int LED_PIN = 26;

void setup() {
  pinMode(LED_PIN, OUTPUT);
  Serial.begin(115200);
  Serial.println("Night light ready!");
}

void loop() {
  int light = analogRead(LDR_PIN);   // lower reading = darker room
  digitalWrite(LED_PIN, light < 2000 ? HIGH : LOW);
  delay(200);
}`;

// =============================================================================
// Raspberry Pi Pico — 5 new templates (board had none). MicroPython, run for
// real by rp2040js against the stock RPI_PICO v1.24.1 UF2 (no `ssd1306` module
// frozen in that firmware, but `framebuf` and `neopixel` ARE — confirmed by
// robocode-frontend/scripts/rp2040-smoke.ts's oled/neopixel gates). Pin choices:
//   - Digital I/O: any GP0-GP22 works for plain Pin.OUT/Pin.IN.
//   - ADC: MUST be GP26/27/28 (rp2040-engine.ts's adcChannelFor only maps 26-29).
//   - Hardware I2C0 SDA: MUST be one of GP0/4/8/12/16/20 (busForSdaGpio) — GP4/GP5
//     matches the smoke test's proven `I2C(0, scl=Pin(5), sda=Pin(4))` exactly.
//   - NeoPixel DIN: resolved by pin NAME "DIN" (not "first free pin"), any GPIO.
// language "micropython" (NOT "python") — matches ROBOTICS_LANGUAGES in
// src/domain/constants.ts and robocode-frontend's studioHref()/code-block.tsx,
// which both key robotics-vs-coding Studio routing and Monaco's language id off
// the literal string "micropython".
// =============================================================================

function picoBlinkDiagram(): AnyJson {
  return routed({
    board: "raspberry-pi-pico",
    parts: [
      { id: "mcu", type: "__board__:raspberry-pi-pico", x: 260, y: 200, rotation: 0 },
      { id: "r1", type: "resistor", x: 520, y: 80, rotation: 0, props: { value: "330" } },
      { id: "led1", type: "led", x: 680, y: 60, rotation: 0, props: { color: "red" } },
    ],
    wires: [
      { id: "w1", from: "mcu:GP15", to: "r1:1", color: "#16a34a" },
      { id: "w2", from: "r1:2", to: "led1:A", color: "#16a34a" },
      { id: "w3", from: "led1:C", to: "mcu:GND.4", color: "#000000" },
    ],
  });
}

const PICO_BLINK_CODE = `# RoboCode.Africa — Raspberry Pi Pico
# Blink an external LED wired through a resistor on GP15.
from machine import Pin
import time

led = Pin(15, Pin.OUT)

print("Pico ready!")

while True:
    led.toggle()
    time.sleep(0.5)
`;

function picoTrafficLightDiagram(): AnyJson {
  return routed({
    board: "raspberry-pi-pico",
    parts: [
      { id: "mcu", type: "__board__:raspberry-pi-pico", x: 260, y: 200, rotation: 0 },
      { id: "r1", type: "resistor", x: 520, y: 40, rotation: 0, props: { value: "330" } },
      { id: "led-red", type: "led", x: 680, y: 20, rotation: 0, props: { color: "red" } },
      { id: "r2", type: "resistor", x: 520, y: 160, rotation: 0, props: { value: "330" } },
      { id: "led-yellow", type: "led", x: 680, y: 140, rotation: 0, props: { color: "yellow" } },
      { id: "r3", type: "resistor", x: 520, y: 280, rotation: 0, props: { value: "330" } },
      { id: "led-green", type: "led", x: 680, y: 260, rotation: 0, props: { color: "green" } },
    ],
    wires: [
      { id: "w1", from: "mcu:GP13", to: "r1:1", color: "#ef4444" },
      { id: "w2", from: "r1:2", to: "led-red:A", color: "#ef4444" },
      { id: "w3", from: "led-red:C", to: "mcu:GND.4", color: "#000000" },
      { id: "w4", from: "mcu:GP14", to: "r2:1", color: "#f59e0b" },
      { id: "w5", from: "r2:2", to: "led-yellow:A", color: "#f59e0b" },
      { id: "w6", from: "led-yellow:C", to: "mcu:GND.4", color: "#000000" },
      { id: "w7", from: "mcu:GP15", to: "r3:1", color: "#16a34a" },
      { id: "w8", from: "r3:2", to: "led-green:A", color: "#16a34a" },
      { id: "w9", from: "led-green:C", to: "mcu:GND.4", color: "#000000" },
    ],
  });
}

const PICO_TRAFFIC_LIGHT_CODE = `# RoboCode.Africa — Raspberry Pi Pico
# Traffic light on three LEDs wired to GP13 (red), GP14 (yellow), GP15 (green).
from machine import Pin
import time

red = Pin(13, Pin.OUT)
yellow = Pin(14, Pin.OUT)
green = Pin(15, Pin.OUT)

print("Traffic light ready!")

while True:
    green.value(1)
    time.sleep(3)
    green.value(0)
    yellow.value(1)
    time.sleep(1)
    yellow.value(0)

    red.value(1)
    time.sleep(3)
    red.value(0)
    yellow.value(1)
    time.sleep(1)
    yellow.value(0)
`;

function picoButtonLedDiagram(): AnyJson {
  return routed({
    board: "raspberry-pi-pico",
    parts: [
      { id: "mcu", type: "__board__:raspberry-pi-pico", x: 260, y: 200, rotation: 0 },
      { id: "btn1", type: "pushbutton", x: 520, y: 80, rotation: 0, props: { color: "blue" } },
      { id: "r1", type: "resistor", x: 520, y: 280, rotation: 0, props: { value: "330" } },
      { id: "led1", type: "led", x: 680, y: 260, rotation: 0, props: { color: "blue" } },
    ],
    wires: [
      { id: "w1", from: "btn1:1.l", to: "mcu:GP14", color: "#16a34a" },
      { id: "w2", from: "btn1:2.l", to: "mcu:3V3", color: "#ef4444" },
      { id: "w3", from: "mcu:GP16", to: "r1:1", color: "#2563ff" },
      { id: "w4", from: "r1:2", to: "led1:A", color: "#2563ff" },
      { id: "w5", from: "led1:C", to: "mcu:GND.7", color: "#000000" },
    ],
  });
}

const PICO_BUTTON_LED_CODE = `# RoboCode.Africa — Raspberry Pi Pico
# Press the button (GP14, pulled down) to light the LED (GP16).
from machine import Pin
import time

button = Pin(14, Pin.IN, Pin.PULL_DOWN)
led = Pin(16, Pin.OUT)

print("Button + LED ready!")

while True:
    led.value(button.value())
    time.sleep_ms(20)
`;

function picoOledDiagram(): AnyJson {
  return routed({
    board: "raspberry-pi-pico",
    parts: [
      { id: "mcu", type: "__board__:raspberry-pi-pico", x: 260, y: 200, rotation: 0 },
      { id: "oled1", type: "ssd1306", x: 560, y: 150, rotation: 0 },
    ],
    wires: [
      { id: "w1", from: "mcu:GP4", to: "oled1:DATA", color: "#2563ff" },
      { id: "w2", from: "mcu:GP5", to: "oled1:CLK", color: "#f59e0b" },
      { id: "w3", from: "mcu:3V3", to: "oled1:VIN", color: "#ef4444" },
      { id: "w4", from: "mcu:GND.2", to: "oled1:GND", color: "#000000" },
    ],
  });
}

// The bare RPI_PICO MicroPython UF2 does not freeze the `ssd1306` library (confirmed
// by robocode-frontend/scripts/rp2040-smoke.ts), so we inline the standard
// framebuf-based SSD1306 driver verbatim from micropython-lib — the exact class the
// smoke test proved produces real, decodable I2C traffic on GP4 (SDA) / GP5 (SCL).
const PICO_OLED_CODE = `# RoboCode.Africa — Raspberry Pi Pico + SSD1306 OLED (I2C)
# This board's MicroPython build does not freeze the "ssd1306" driver, so we
# include the standard framebuf-based driver here (normally \`import ssd1306\`).
from machine import Pin, I2C
import framebuf

SET_CONTRAST = 0x81
SET_ENTIRE_ON = 0xA4
SET_NORM_INV = 0xA6
SET_DISP = 0xAE
SET_MEM_ADDR = 0x20
SET_COL_ADDR = 0x21
SET_PAGE_ADDR = 0x22
SET_DISP_START_LINE = 0x40
SET_SEG_REMAP = 0xA0
SET_MUX_RATIO = 0xA8
SET_COM_OUT_DIR = 0xC0
SET_DISP_OFFSET = 0xD3
SET_COM_PIN_CFG = 0xDA
SET_DISP_CLK_DIV = 0xD5
SET_PRECHARGE = 0xD9
SET_VCOM_DESEL = 0xDB
SET_CHARGE_PUMP = 0x8D


class SSD1306(framebuf.FrameBuffer):
    def __init__(self, width, height, external_vcc):
        self.width = width
        self.height = height
        self.external_vcc = external_vcc
        self.pages = self.height // 8
        self.buffer = bytearray(self.pages * self.width)
        super().__init__(self.buffer, self.width, self.height, framebuf.MONO_VLSB)
        self.init_display()

    def init_display(self):
        for cmd in (
            SET_DISP,
            SET_MEM_ADDR, 0x00,
            SET_DISP_START_LINE,
            SET_SEG_REMAP | 0x01,
            SET_MUX_RATIO, self.height - 1,
            SET_COM_OUT_DIR | 0x08,
            SET_DISP_OFFSET, 0x00,
            SET_COM_PIN_CFG, 0x02 if self.width > 2 * self.height else 0x12,
            SET_DISP_CLK_DIV, 0x80,
            SET_PRECHARGE, 0x22 if self.external_vcc else 0xF1,
            SET_VCOM_DESEL, 0x30,
            SET_CONTRAST, 0xFF,
            SET_ENTIRE_ON,
            SET_NORM_INV,
            SET_CHARGE_PUMP, 0x10 if self.external_vcc else 0x14,
            SET_DISP | 0x01,
        ):
            self.write_cmd(cmd)
        self.fill(0)
        self.show()

    def show(self):
        x0 = 0
        x1 = self.width - 1
        if self.width == 64:
            x0 += 32
            x1 += 32
        self.write_cmd(SET_COL_ADDR)
        self.write_cmd(x0)
        self.write_cmd(x1)
        self.write_cmd(SET_PAGE_ADDR)
        self.write_cmd(0)
        self.write_cmd(self.pages - 1)
        self.write_data(self.buffer)


class SSD1306_I2C(SSD1306):
    def __init__(self, width, height, i2c, addr=0x3C, external_vcc=False):
        self.i2c = i2c
        self.addr = addr
        self.temp = bytearray(2)
        self.write_list = [b"\\x40", None]
        super().__init__(width, height, external_vcc)

    def write_cmd(self, cmd):
        self.temp[0] = 0x80
        self.temp[1] = cmd
        self.i2c.writeto(self.addr, self.temp)

    def write_data(self, buf):
        self.write_list[1] = buf
        self.i2c.writevto(self.addr, self.write_list)


i2c = I2C(0, scl=Pin(5), sda=Pin(4))
oled = SSD1306_I2C(128, 64, i2c)

oled.fill(0)
oled.text("RoboCode", 0, 0)
oled.text("Hello!", 0, 16)
oled.show()

print("OLED ready!")
`;

function picoNeopixelDiagram(): AnyJson {
  return routed({
    board: "raspberry-pi-pico",
    parts: [
      { id: "mcu", type: "__board__:raspberry-pi-pico", x: 260, y: 200, rotation: 0 },
      { id: "np1", type: "neopixel", x: 560, y: 150, rotation: 0 },
    ],
    wires: [
      { id: "w1", from: "mcu:GP16", to: "np1:DIN", color: "#16a34a" },
      { id: "w2", from: "mcu:VBUS", to: "np1:VDD", color: "#ef4444" },
      { id: "w3", from: "mcu:GND.7", to: "np1:VSS", color: "#000000" },
    ],
  });
}

const PICO_NEOPIXEL_CODE = `# RoboCode.Africa — Raspberry Pi Pico
# Cycle a single WS2812 NeoPixel through a smooth rainbow, wired to GP16.
import neopixel
from machine import Pin
import time

np = neopixel.NeoPixel(Pin(16), 1)


def wheel(pos):
    """0-255 -> an (r, g, b) tuple around the colour wheel."""
    if pos < 85:
        return (pos * 3, 255 - pos * 3, 0)
    elif pos < 170:
        pos -= 85
        return (255 - pos * 3, 0, pos * 3)
    else:
        pos -= 170
        return (0, pos * 3, 255 - pos * 3)


print("NeoPixel rainbow ready!")

j = 0
while True:
    np[0] = wheel(j % 256)
    np.write()
    time.sleep_ms(20)
    j = (j + 1) % 256
`;

// =============================================================================
// The full 15-template set.
// =============================================================================

export const ROBOTICS_TEMPLATES: RoboticsTemplate[] = [
  // ---- Arduino UNO (5) ----
  {
    title: "Starter: Blink",
    description: "The classic starting point — make an LED blink on and off with a few lines of code.",
    boardType: "arduino-uno",
    diagram: blinkDiagram(),
    files: [{ name: "sketch.ino", language: "arduino", content: BLINK_CODE }],
  },
  {
    title: "LCD Hello World",
    description: "Display your own text messages on a 16x2 LCD screen wired over I2C.",
    boardType: "arduino-uno",
    diagram: lcdDiagram(),
    files: [{ name: "sketch.ino", language: "arduino", content: LCD_CODE }],
  },
  {
    title: "NeoPixel Rainbow",
    description: "Light up an addressable RGB NeoPixel and cycle it through a rainbow of colours.",
    boardType: "arduino-uno",
    diagram: neoDiagram(),
    files: [{ name: "sketch.ino", language: "arduino", content: NEO_CODE }],
  },
  {
    title: "Digital Alarm Clock",
    description: "A 4-digit 7-segment clock with a DS1307 real-time clock module, three buttons (Hours, Minutes, Alarm) and a buzzer alarm.",
    boardType: "arduino-uno",
    diagram: fromWokwi(WK_CLOCK),
    files: [{ name: "sketch.ino", language: "arduino", content: CLOCK_CODE }],
  },
  {
    title: "Keypad Door Lock",
    description: "A door lock that reads a code on a 4x4 keypad, shows status on a 16x2 LCD, and turns a servo to lock or unlock.",
    boardType: "arduino-uno",
    diagram: fromWokwi(WK_KEYPAD),
    files: [{ name: "sketch.ino", language: "arduino", content: KEYPAD_CODE }],
  },

  // ---- ESP32 (5) ----
  {
    title: "ESP32 Blink",
    description: "Blink an external LED on the Wi-Fi-capable ESP32 board using GPIO 2.",
    boardType: "esp32",
    diagram: esp32Diagram(),
    files: [{ name: "sketch.ino", language: "arduino", content: ESP32_LED_CODE }],
  },
  {
    title: "ESP32 Traffic Light",
    description: "Cycle three LEDs like a real traffic light — green, yellow, then red — on the ESP32.",
    boardType: "esp32",
    diagram: esp32TrafficLightDiagram(),
    files: [{ name: "sketch.ino", language: "arduino", content: ESP32_TRAFFIC_LIGHT_CODE }],
  },
  {
    title: "ESP32 Button & LED",
    description: "Press a push button to switch an LED on and off on the ESP32.",
    boardType: "esp32",
    diagram: esp32ButtonLedDiagram(),
    files: [{ name: "sketch.ino", language: "arduino", content: ESP32_BUTTON_LED_CODE }],
  },
  {
    title: "ESP32 Potentiometer Dimmer",
    description: "Turn a potentiometer to smoothly dim an LED using the ESP32's ADC and LEDC PWM.",
    boardType: "esp32",
    diagram: esp32DimmerDiagram(),
    files: [{ name: "sketch.ino", language: "arduino", content: ESP32_DIMMER_CODE }],
  },
  {
    title: "ESP32 Night Light",
    description: "A light sensor automatically switches an LED on when the room gets dark.",
    boardType: "esp32",
    diagram: esp32NightLightDiagram(),
    files: [{ name: "sketch.ino", language: "arduino", content: ESP32_NIGHT_LIGHT_CODE }],
  },

  // ---- Raspberry Pi Pico (5) ----
  {
    title: "Pico Blink",
    description: "Blink an external LED wired to GP15 using MicroPython on the Raspberry Pi Pico.",
    boardType: "raspberry-pi-pico",
    diagram: picoBlinkDiagram(),
    files: [{ name: "main.py", language: "micropython", content: PICO_BLINK_CODE }],
  },
  {
    title: "Pico Traffic Light",
    description: "Cycle three LEDs like a real traffic light on the Raspberry Pi Pico's GP13, GP14 and GP15.",
    boardType: "raspberry-pi-pico",
    diagram: picoTrafficLightDiagram(),
    files: [{ name: "main.py", language: "micropython", content: PICO_TRAFFIC_LIGHT_CODE }],
  },
  {
    title: "Pico Button & LED",
    description: "Press a button to switch an LED on and off using the Pico's digital input.",
    boardType: "raspberry-pi-pico",
    diagram: picoButtonLedDiagram(),
    files: [{ name: "main.py", language: "micropython", content: PICO_BUTTON_LED_CODE }],
  },
  {
    title: "Pico OLED Hello World",
    description: "Show your own text on a 128x64 SSD1306 OLED screen wired over I2C.",
    boardType: "raspberry-pi-pico",
    diagram: picoOledDiagram(),
    files: [{ name: "main.py", language: "micropython", content: PICO_OLED_CODE }],
  },
  {
    title: "Pico NeoPixel Rainbow",
    description: "Cycle a WS2812 NeoPixel through a smooth rainbow of colours on the Pico.",
    boardType: "raspberry-pi-pico",
    diagram: picoNeopixelDiagram(),
    files: [{ name: "main.py", language: "micropython", content: PICO_NEOPIXEL_CODE }],
  },
];
