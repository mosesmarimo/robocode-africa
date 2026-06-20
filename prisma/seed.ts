import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { readFileSync } from "node:fs";

const prisma = new PrismaClient();
const PW = bcrypt.hashSync("password123", 10);

// ---- AI-generated project descriptions (DeepSeek, same key as the app) ----
let _dsKey: string | null | undefined;
function deepseekKey(): string | null {
  if (_dsKey !== undefined) return _dsKey;
  try {
    const env = readFileSync(".env", "utf8");
    const m = env.match(/^DEEPSEEK_API_KEY=(.*)$/m);
    _dsKey = m ? m[1].trim().replace(/^["']|["']$/g, "") : null;
  } catch {
    _dsKey = null;
  }
  return _dsKey || null;
}
/* eslint-disable @typescript-eslint/no-explicit-any */
async function aiDescribe(title: string, board: string, diagram: any, code: string, fallback: string): Promise<string> {
  const key = deepseekKey();
  if (!key) return fallback;
  try {
    const comps = (diagram.parts || [])
      .filter((p: any) => p.id !== "mcu" && !String(p.type).startsWith("__board__"))
      .map((p: any) => p.type);
    const conns = (diagram.wires || []).map((w: any) => `${w.from} -> ${w.to}`).join("\n");
    const res = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: process.env.DEEPSEEK_MODEL || "deepseek-v4-pro",
        stream: false,
        messages: [
          { role: "system", content: "You write ONE short, friendly sentence (max 22 words) for a kids' electronics project card subtitle, based on the circuit. No markdown, no quotes, no trailing period needed." },
          { role: "user", content: `Project: ${title}\nBoard: ${board}\nComponents: ${comps.join(", ")}\nConnections:\n${conns}\n\nCode:\n${code.slice(0, 1400)}` },
        ],
      }),
    });
    if (!res.ok) return fallback;
    const data: any = await res.json();
    const text: string | undefined = data?.choices?.[0]?.message?.content?.trim();
    return text ? text.replace(/^["']|["']$/g, "").slice(0, 200) : fallback;
  } catch {
    return fallback;
  }
}

type AnyJson = Record<string, unknown>;

// ---- tidy right-angle wire routing for the demo projects ----
const PIN_XY: Record<string, Record<string, [number, number]>> = {
  "__board__:arduino-uno": {
    "13": [125, 9], "12": [135, 9], "11": [144, 9], "10": [154, 9], "9": [163, 9], "8": [173, 9],
    "7": [189, 9], "6": [199, 9], "5": [208, 9], "4": [218, 9], "3": [227, 9], "2": [237, 9],
    "GND.1": [116, 9], "5V": [160, 192], "3.3V": [150, 192], "GND.2": [170, 192], "GND.3": [179, 192],
    "A0": [208, 192], "A1": [218, 192], "A2": [227, 192], "A3": [237, 192], "A4": [246, 192], "A5": [256, 192],
  },
  "__board__:esp32": {
    D13: [5, 140], D12: [5, 130], D14: [5, 120], D27: [5, 111], D26: [5, 101], D25: [5, 91],
    "GND.2": [5, 149], VIN: [5, 159], "3V3": [101, 159], "GND.1": [101, 149], D15: [101, 140],
    D2: [101, 130], D4: [101, 120], D5: [101, 91], D18: [101, 82], D19: [101, 72], D21: [101, 63], D22: [101, 34], D23: [101, 24],
  },
  led: { A: [25, 42], C: [15, 42] },
  resistor: { "1": [0, 6], "2": [59, 6] },
  ultrasonic: { VCC: [71, 95], TRIG: [81, 95], ECHO: [91, 95], GND: [101, 95] },
  buzzer: { "1": [27, 84], "2": [37, 84] },
  lcd1602: { GND: [4, 32], VCC: [4, 42], SDA: [4, 51], SCL: [4, 61] },
  neopixel: { VDD: [1, 4], DOUT: [1, 14], VSS: [21, 14], DIN: [21, 4] },
};
const SNAP8 = (v: number) => Math.round(v / 8) * 8;
function pinXY(d: AnyJson, ref: string): { x: number; y: number } | null {
  const [id, pin] = ref.split(":");
  const part = (d.parts as AnyJson[]).find((p) => p.id === id) as AnyJson | undefined;
  if (!part) return null;
  const c = PIN_XY[part.type as string]?.[pin];
  if (!c) return null;
  return { x: (part.x as number) + c[0], y: (part.y as number) + c[1] };
}
/** Adds right-angle (H-V-H) bend points to every wire, with the vertical run kept off the board. */
function routed(d: AnyJson): AnyJson {
  const mcu = (d.parts as AnyJson[]).find((p) => p.id === "mcu") as AnyJson | undefined;
  const boardRight = mcu ? (mcu.x as number) + (String(mcu.type).includes("esp32") ? 124 : 320) : 0;
  for (const w of d.wires as AnyJson[]) {
    const a = pinXY(d, w.from as string);
    const b = pinXY(d, w.to as string);
    if (!a || !b) continue;
    const involvesBoard = (w.from as string).startsWith("mcu:") || (w.to as string).startsWith("mcu:");
    let midX = (a.x + b.x) / 2;
    if (involvesBoard) midX = Math.max(midX, boardRight + 24);
    midX = SNAP8(midX);
    w.points = [{ x: midX, y: SNAP8(a.y) }, { x: midX, y: SNAP8(b.y) }];
  }
  return d;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
// ---- import Wokwi example projects (faithful diagrams from wokwi.com) ----
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
function fromWokwi(wk: any): any {
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

function blinkDiagram(): any {
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

function ultrasonicDiagram(): any {
  return routed({
    board: "arduino-uno",
    parts: [
      { id: "mcu", type: "__board__:arduino-uno", x: 48, y: 200, rotation: 0 },
      { id: "u1", type: "ultrasonic", x: 456, y: 72, rotation: 0 },
      { id: "buz1", type: "buzzer", x: 456, y: 360, rotation: 0 },
    ],
    wires: [
      { id: "w1", from: "mcu:5V", to: "u1:VCC", color: "#ef4444" },
      { id: "w2", from: "mcu:GND.1", to: "u1:GND", color: "#000000" },
      { id: "w3", from: "mcu:9", to: "u1:TRIG", color: "#2563ff" },
      { id: "w4", from: "mcu:10", to: "u1:ECHO", color: "#f59e0b" },
      { id: "w5", from: "mcu:8", to: "buz1:1", color: "#16a34a" },
      { id: "w6", from: "buz1:2", to: "mcu:GND.2", color: "#000000" },
    ],
  });
}

function lcdDiagram(): any {
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

function neoDiagram(): any {
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

function esp32Diagram(): any {
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

const BLINK_CODE = `void setup() {
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

const ULTRASONIC_CODE = `const int TRIG = 9, ECHO = 10, BUZZER = 8;
void setup() {
  pinMode(TRIG, OUTPUT); pinMode(ECHO, INPUT); pinMode(BUZZER, OUTPUT);
  Serial.begin(9600);
}
void loop() {
  digitalWrite(TRIG, LOW); delayMicroseconds(2);
  digitalWrite(TRIG, HIGH); delayMicroseconds(10); digitalWrite(TRIG, LOW);
  long d = pulseIn(ECHO, HIGH) * 0.034 / 2;
  Serial.print("Distance: "); Serial.println(d);
  if (d < 15) tone(BUZZER, 1000); else noTone(BUZZER);
  delay(200);
}`;

async function reset() {
  // Order respects FKs; cascades handle most children.
  const tables = [
    "auditLog", "moderationCase", "chatMessage", "announcement", "notification",
    "userBadge", "roboPointLedger", "badge", "score", "round", "competitionEntry",
    "competition", "teamMember", "team", "assignment", "classMember", "class",
    "submission", "lessonProgress", "enrollment", "task", "lesson", "course",
    "projectVersion", "simulationRun", "codeFile", "project", "boardDefinition",
    "approvalRequest", "consentRecord", "user", "domain", "subscription", "plan", "tenant",
  ] as const;
  await prisma.$executeRawUnsafe("PRAGMA foreign_keys = OFF;");
  for (const t of tables) {
    // @ts-expect-error dynamic delegate access
    await prisma[t].deleteMany({});
  }
  await prisma.$executeRawUnsafe("PRAGMA foreign_keys = ON;");
}

async function main() {
  await reset();

  const schoolPlan = await prisma.plan.create({
    data: { name: "School", seats: 300, priceCents: 9900, features: { competitions: true, whitelabel: true } },
  });
  await prisma.plan.create({ data: { name: "Free", seats: 30, priceCents: 0, features: {} } });

  // Tenants
  const platform = await prisma.tenant.create({
    data: {
      slug: "robocode",
      name: "RoboCode.Africa",
      isPlatform: true,
      status: "active",
      branding: { primary: "#2f6bff", secondary: "#12c8a0", accent: "#ffb020", tagline: "Learn Robotics, Coding & AI" },
      policies: { autoApprove: false },
    },
  });
  const springfield = await prisma.tenant.create({
    data: {
      slug: "springfield",
      name: "Springfield STEM Academy",
      status: "active",
      branding: { primary: "#7c3aed", secondary: "#06b6d4", accent: "#f59e0b", tagline: "Springfield STEM · innovate fearlessly" },
      policies: { autoApprove: false },
    },
  });
  await prisma.domain.create({
    data: { tenantId: springfield.id, hostname: "springfield.localhost:3000", type: "subdomain", verified: true, sslStatus: "active" },
  });
  await prisma.subscription.create({
    data: { tenantId: springfield.id, planId: schoolPlan.id, status: "active", seatsUsed: 6 },
  });

  // Helper to make users
  let pts = 0;
  async function makeUser(
    tenantId: string,
    email: string,
    displayName: string,
    role: string,
    status = "active",
    roboPoints = 0,
    isMinor = role === "student",
  ) {
    return prisma.user.create({
      data: {
        tenantId, email, displayName, role, status, isMinor,
        passwordHash: PW, avatarSeed: nanoid(8), roboPoints,
        level: 1 + Math.floor(roboPoints / 300),
        birthYear: isMinor ? 2013 : 1990,
      },
    });
  }

  // Platform staff + direct students
  const superAdmin = await makeUser(platform.id, "super@robocode.africa", "Amara Okonkwo", "super_admin", "active", 0, false);
  await makeUser(platform.id, "mod@robocode.africa", "Lebo Dlamini", "moderator", "active", 0, false);
  const ada = await makeUser(platform.id, "ada@robocode.africa", "Ada Mensah", "student", "active", 540);
  const pendingDirect = await makeUser(platform.id, "newbie@robocode.africa", "Kofi Asante", "student", "pending", 0);

  // School users
  const schoolAdmin = await makeUser(springfield.id, "admin@springfield.robocode.africa", "Grace Banda", "school_admin", "active", 0, false);
  const teacher = await makeUser(springfield.id, "curie@springfield.robocode.africa", "Marie Curie", "teacher", "active", 0, false);
  const tariro = await makeUser(springfield.id, "tariro@springfield.robocode.africa", "Tariro Moyo", "student", "active", 820);
  const kuda = await makeUser(springfield.id, "kuda@springfield.robocode.africa", "Kuda Nyathi", "student", "active", 610);
  const chipo = await makeUser(springfield.id, "chipo@springfield.robocode.africa", "Chipo Dube", "student", "active", 430);
  const farai = await makeUser(springfield.id, "farai@springfield.robocode.africa", "Farai Sibanda", "student", "active", 350);
  await makeUser(springfield.id, "blessing@springfield.robocode.africa", "Blessing Phiri", "student", "pending", 0);
  await makeUser(springfield.id, "tinashe@springfield.robocode.africa", "Tinashe Ncube", "student", "pending", 0);

  // Approval requests for pending users
  for (const u of [pendingDirect]) {
    await prisma.approvalRequest.create({ data: { userId: u.id, tenantId: platform.id, type: "student_direct" } });
    await prisma.notification.create({
      data: { userId: superAdmin.id, type: "approval", title: "New signup awaiting approval", body: `${u.displayName} requested a student account.` },
    });
  }
  for (const email of ["blessing@springfield.robocode.africa", "tinashe@springfield.robocode.africa"]) {
    const u = await prisma.user.findUnique({ where: { tenantId_email: { tenantId: springfield.id, email } } });
    if (u) {
      await prisma.approvalRequest.create({ data: { userId: u.id, tenantId: springfield.id, type: "student_school" } });
      await prisma.notification.create({
        data: { userId: schoolAdmin.id, type: "approval", title: "New student awaiting approval", body: `${u.displayName} requested to join Springfield STEM.` },
      });
    }
  }

  // Badges
  const badges = [
    { code: "first-steps", name: "First Steps", description: "Created your first project.", icon: "sparkles" },
    { code: "blink-master", name: "Blink Master", description: "Ran your first simulation.", icon: "lightbulb" },
    { code: "sensor-sleuth", name: "Sensor Sleuth", description: "Used a sensor in a project.", icon: "radar" },
    { code: "team-player", name: "Team Player", description: "Joined a team.", icon: "users" },
    { code: "top-of-class", name: "Top of the Class", description: "Reached #1 on a leaderboard.", icon: "crown" },
    { code: "ai-explorer", name: "AI Explorer", description: "Completed an AI lesson.", icon: "brain" },
    { code: "streak-7", name: "7-Day Streak", description: "Built 7 days in a row.", icon: "flame" },
    { code: "competitor", name: "Competitor", description: "Entered a competition.", icon: "trophy" },
  ];
  for (const b of badges) await prisma.badge.create({ data: b });
  async function award(userId: string, code: string) {
    const badge = await prisma.badge.findUnique({ where: { code } });
    if (badge) await prisma.userBadge.create({ data: { userId, badgeId: badge.id } });
  }
  await award(tariro.id, "first-steps");
  await award(tariro.id, "blink-master");
  await award(tariro.id, "sensor-sleuth");
  await award(tariro.id, "team-player");
  await award(kuda.id, "first-steps");
  await award(ada.id, "first-steps");
  await award(ada.id, "ai-explorer");

  // Courses + lessons + tasks
  async function course(data: AnyJson, lessons: AnyJson[], tasks: AnyJson[]) {
    const c = await prisma.course.create({ data: data as never });
    for (let i = 0; i < lessons.length; i++) {
      await prisma.lesson.create({ data: { ...(lessons[i] as object), courseId: c.id, order: i } as never });
    }
    for (const t of tasks) {
      await prisma.task.create({ data: { ...(t as object), courseId: c.id } as never });
    }
    return c;
  }

  const lessonBody = (md: string) => ({ blocks: [{ type: "markdown", text: md }] });

  const robotics = await course(
    { title: "Intro to Robotics", slug: "intro-robotics", track: "robotics", level: "primary", description: "Meet the Arduino, light an LED, and read your first sensor.", coverImage: "/covers/robotics.svg", order: 1 },
    [
      { title: "What is a microcontroller?", slug: "what-is-mcu", contentType: "markdown", body: lessonBody("# Meet the Arduino\nAn Arduino is a tiny computer you can program to control lights, motors and sensors."), estMinutes: 8 },
      { title: "Your first LED", slug: "first-led", contentType: "markdown", body: lessonBody("# Light it up\nConnect an LED through a resistor and blink it with code."), estMinutes: 12 },
      { title: "Reading a sensor", slug: "reading-sensor", contentType: "markdown", body: lessonBody("# Sensing the world\nUse an ultrasonic sensor to measure distance."), estMinutes: 15 },
    ],
    [
      { title: "Blink an LED", slug: "blink-led", description: "Make the on-board LED blink once per second.", track: "robotics", difficulty: "beginner", points: 50, boardType: "arduino-uno", starterCode: BLINK_CODE, starterDiagram: blinkDiagram(), checks: { rules: [{ type: "pin_toggles", pin: 13 }, { type: "serial_contains", value: "ready" }] } },
      { title: "Distance alarm", slug: "distance-alarm", description: "Sound the buzzer when an object is closer than 15 cm.", track: "robotics", difficulty: "intermediate", points: 100, boardType: "arduino-uno", starterCode: ULTRASONIC_CODE, starterDiagram: ultrasonicDiagram(), checks: { rules: [{ type: "serial_contains", value: "Distance" }] } },
    ],
  );

  await course(
    { title: "Coding with Arduino", slug: "coding-arduino", track: "coding", level: "high", description: "Variables, loops and functions — applied to real hardware.", coverImage: "/covers/coding.svg", order: 2 },
    [
      { title: "Variables & types", slug: "variables", contentType: "markdown", body: lessonBody("# Storing values\nVariables hold numbers, text and more."), estMinutes: 10 },
      { title: "Loops", slug: "loops", contentType: "markdown", body: lessonBody("# Repeating yourself\nUse for and while loops to repeat actions."), estMinutes: 12 },
    ],
    [
      { title: "Countdown timer", slug: "countdown", description: "Print a countdown from 10 to 0 on the serial monitor.", track: "coding", difficulty: "beginner", points: 50, boardType: "arduino-uno", checks: { rules: [{ type: "serial_contains", value: "0" }] } },
    ],
  );

  await course(
    { title: "AI Foundations", slug: "ai-foundations", track: "ai", level: "high", description: "How machines learn — patterns, data and smart sensors.", coverImage: "/covers/ai.svg", order: 3 },
    [
      { title: "What is AI?", slug: "what-is-ai", contentType: "markdown", body: lessonBody("# Teaching machines\nAI helps computers find patterns in data."), estMinutes: 10 },
      { title: "Smart thresholds", slug: "smart-thresholds", contentType: "markdown", body: lessonBody("# Decisions from data\nUse sensor data to make smart decisions."), estMinutes: 12 },
    ],
    [
      { title: "Gesture light", slug: "gesture-light", description: "Turn an LED on when a sensor detects something near.", track: "ai", difficulty: "intermediate", points: 100, boardType: "arduino-uno", checks: { rules: [{ type: "pin_toggles", pin: 13 }] } },
    ],
  );

  // Enrollments + progress
  for (const u of [tariro, kuda, chipo, farai, ada]) {
    await prisma.enrollment.create({ data: { userId: u.id, courseId: robotics.id, progress: { percent: 60 } } });
  }

  // Sample projects
  const proj1 = await prisma.project.create({
    data: { ownerId: tariro.id, tenantId: springfield.id, title: "My Blinking LED", description: await aiDescribe("My Blinking LED", "arduino-uno", blinkDiagram(), BLINK_CODE, "An Arduino UNO blinks an LED through a resistor — the perfect first circuit."), boardType: "arduino-uno", diagram: blinkDiagram(), visibility: "tenant" },
  });
  await prisma.codeFile.create({ data: { projectId: proj1.id, authorId: tariro.id, filename: "sketch.ino", language: "arduino", content: BLINK_CODE } });

  const proj2 = await prisma.project.create({
    data: { ownerId: tariro.id, tenantId: springfield.id, title: "Distance Alarm Robot", description: await aiDescribe("Distance Alarm Robot", "arduino-uno", ultrasonicDiagram(), ULTRASONIC_CODE, "An ultrasonic sensor measures distance and sounds the buzzer when something gets too close."), boardType: "arduino-uno", diagram: ultrasonicDiagram(), visibility: "tenant" },
  });
  await prisma.codeFile.create({ data: { projectId: proj2.id, authorId: tariro.id, filename: "sketch.ino", language: "arduino", content: ULTRASONIC_CODE } });

  // A public template
  const tmpl = await prisma.project.create({
    data: { ownerId: teacher.id, tenantId: springfield.id, title: "Starter: Blink", description: await aiDescribe("Starter: Blink", "arduino-uno", blinkDiagram(), BLINK_CODE, "The classic starting point — make an LED blink on and off with a few lines of code."), boardType: "arduino-uno", diagram: blinkDiagram(), visibility: "public", isTemplate: true },
  });
  await prisma.codeFile.create({ data: { projectId: tmpl.id, filename: "sketch.ino", language: "arduino", content: BLINK_CODE } });

  const lcdTmpl = await prisma.project.create({
    data: { ownerId: teacher.id, tenantId: springfield.id, title: "LCD Hello World", description: await aiDescribe("LCD Hello World", "arduino-uno", lcdDiagram(), LCD_CODE, "Display your own text messages on a 16x2 LCD screen wired over I2C."), boardType: "arduino-uno", diagram: lcdDiagram(), visibility: "public", isTemplate: true },
  });
  await prisma.codeFile.create({ data: { projectId: lcdTmpl.id, filename: "sketch.ino", language: "arduino", content: LCD_CODE } });

  const neoTmpl = await prisma.project.create({
    data: { ownerId: teacher.id, tenantId: springfield.id, title: "NeoPixel Rainbow", description: await aiDescribe("NeoPixel Rainbow", "arduino-uno", neoDiagram(), NEO_CODE, "Light up an addressable RGB NeoPixel and cycle it through a rainbow of colours."), boardType: "arduino-uno", diagram: neoDiagram(), visibility: "public", isTemplate: true },
  });
  await prisma.codeFile.create({ data: { projectId: neoTmpl.id, filename: "sketch.ino", language: "arduino", content: NEO_CODE } });

  const espTmpl = await prisma.project.create({
    data: { ownerId: teacher.id, tenantId: springfield.id, title: "ESP32 Blink", description: await aiDescribe("ESP32 Blink", "esp32", esp32Diagram(), ESP32_LED_CODE, "Blink an external LED on the Wi-Fi-capable ESP32 board using GPIO 2."), boardType: "esp32", diagram: esp32Diagram(), visibility: "public", isTemplate: true },
  });
  await prisma.codeFile.create({ data: { projectId: espTmpl.id, filename: "sketch.ino", language: "arduino", content: ESP32_LED_CODE } });

  // Example projects
  const wkClock = await prisma.project.create({
    data: { ownerId: teacher.id, tenantId: springfield.id, title: "Digital Alarm Clock", description: await aiDescribe("Digital Alarm Clock", "arduino-uno", fromWokwi(WK_CLOCK), CLOCK_CODE, "A 4-digit 7-segment clock with a DS1307 real-time clock module, three buttons (Hours, Minutes, Alarm) and a buzzer alarm."), boardType: "arduino-uno", diagram: fromWokwi(WK_CLOCK), visibility: "public", isTemplate: true },
  });
  await prisma.codeFile.create({ data: { projectId: wkClock.id, filename: "sketch.ino", language: "arduino", content: CLOCK_CODE } });

  const wkKeypad = await prisma.project.create({
    data: { ownerId: teacher.id, tenantId: springfield.id, title: "Keypad Door Lock", description: await aiDescribe("Keypad Door Lock", "arduino-uno", fromWokwi(WK_KEYPAD), KEYPAD_CODE, "A door lock that reads a code on a 4x4 keypad, shows status on a 16x2 LCD, and turns a servo to lock or unlock."), boardType: "arduino-uno", diagram: fromWokwi(WK_KEYPAD), visibility: "public", isTemplate: true },
  });
  await prisma.codeFile.create({ data: { projectId: wkKeypad.id, filename: "sketch.ino", language: "arduino", content: KEYPAD_CODE } });

  // Teams
  const teamA = await prisma.team.create({
    data: { tenantId: springfield.id, name: "Circuit Breakers", kind: "intra_school", captainId: tariro.id, roboPoints: 1430, avatarSeed: "circuit", description: "We make sparks fly." },
  });
  await prisma.teamMember.createMany({
    data: [
      { teamId: teamA.id, userId: tariro.id, role: "captain", status: "active" },
      { teamId: teamA.id, userId: kuda.id, role: "member", status: "active" },
      { teamId: teamA.id, userId: chipo.id, role: "member", status: "active" },
    ],
  });
  const teamB = await prisma.team.create({
    data: { tenantId: springfield.id, name: "Voltage", kind: "intra_school", captainId: farai.id, roboPoints: 350, avatarSeed: "voltage", description: "High energy builders." },
  });
  await prisma.teamMember.create({ data: { teamId: teamB.id, userId: farai.id, role: "captain", status: "active" } });
  await prisma.chatMessage.create({ data: { teamId: teamA.id, userId: tariro.id, body: "Great work on the distance alarm everyone!", status: "approved" } });

  // Competition
  const comp = await prisma.competition.create({
    data: {
      tenantId: springfield.id, title: "Spring Robotics Cup", slug: "spring-robotics-cup", type: "robotics", scope: "intra_school",
      status: "live", description: "Build the smartest obstacle-avoiding robot.",
      startsAt: new Date(Date.now() - 2 * 864e5), endsAt: new Date(Date.now() + 5 * 864e5),
      rules: { judging: "auto+rubric" },
    },
  });
  const round1 = await prisma.round.create({ data: { competitionId: comp.id, name: "Qualifier", order: 0 } });
  const e1 = await prisma.competitionEntry.create({ data: { competitionId: comp.id, teamId: teamA.id, totalScore: 280 } });
  const e2 = await prisma.competitionEntry.create({ data: { competitionId: comp.id, teamId: teamB.id, totalScore: 190 } });
  await prisma.score.create({ data: { competitionId: comp.id, roundId: round1.id, entryId: e1.id, points: 280 } });
  await prisma.score.create({ data: { competitionId: comp.id, roundId: round1.id, entryId: e2.id, points: 190 } });

  // Points ledger (mirrors roboPoints totals roughly) for leaderboard history
  const ledger = [
    { userId: tariro.id, delta: 100, reason: "Completed Distance alarm" },
    { userId: tariro.id, delta: 50, reason: "Completed Blink an LED" },
    { userId: kuda.id, delta: 100, reason: "Completed Distance alarm" },
    { userId: ada.id, delta: 100, reason: "Completed AI task" },
    { userId: chipo.id, delta: 50, reason: "Completed Blink an LED" },
  ];
  for (const l of ledger) await prisma.roboPointLedger.create({ data: { ...l, refType: "task" } });

  // Announcements
  await prisma.announcement.create({
    data: { tenantId: springfield.id, authorId: schoolAdmin.id, title: "Welcome to RoboCode!", body: "Start with Intro to Robotics and earn your first badge.", audience: "all" },
  });

  // eslint-disable-next-line no-console
  console.log("Seed complete.\n  Super admin: super@robocode.africa / password123\n  School admin: admin@springfield.robocode.africa / password123\n  Teacher: curie@springfield.robocode.africa / password123\n  Student: tariro@springfield.robocode.africa / password123");
  void pts;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
