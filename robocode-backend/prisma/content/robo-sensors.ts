import { type CourseModule, md, mermaid, svg, callout, body } from "./types";
import { sensorsPart1 } from "./robo-sensors-1";
import { sensorsPart2 } from "./robo-sensors-2";
import { sensorsPart3 } from "./robo-sensors-3";

// A simple labelled "input → process → output" illustration for the intro.
const SVG_SENSE_PIPELINE = `<svg viewBox="0 0 600 170" role="img" aria-label="A sensor turns a real-world signal into a number the board can read" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="600" height="170" fill="#0d1426" rx="12"/>
  <rect x="24" y="55" width="150" height="60" rx="8" fill="#16315c" stroke="#2563ff"/>
  <text x="99" y="80" fill="#cfe0ff" font-size="13" text-anchor="middle" font-family="sans-serif">Real world</text>
  <text x="99" y="100" fill="#8fb3ff" font-size="11" text-anchor="middle" font-family="sans-serif">light, heat, motion…</text>
  <rect x="225" y="55" width="150" height="60" rx="8" fill="#14323a" stroke="#16c79a"/>
  <text x="300" y="80" fill="#bff3e4" font-size="13" text-anchor="middle" font-family="sans-serif">Sensor</text>
  <text x="300" y="100" fill="#7fd9c0" font-size="11" text-anchor="middle" font-family="sans-serif">measures it</text>
  <rect x="426" y="55" width="150" height="60" rx="8" fill="#3a2a14" stroke="#ffb020"/>
  <text x="501" y="80" fill="#ffe4ad" font-size="13" text-anchor="middle" font-family="sans-serif">Board</text>
  <text x="501" y="100" fill="#ffce80" font-size="11" text-anchor="middle" font-family="sans-serif">reads a number</text>
  <line x1="174" y1="85" x2="223" y2="85" stroke="#5fb73a" stroke-width="3" marker-end="url(#a)"/>
  <line x1="375" y1="85" x2="424" y2="85" stroke="#5fb73a" stroke-width="3" marker-end="url(#a)"/>
  <defs><marker id="a" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#5fb73a"/></marker></defs>
</svg>`;

/**
 * Sensors course: an intro on how sensors work, then a lesson per sensor for
 * every common Arduino Uno / ESP32 sensor (authored in robo-sensors-{1,2,3}).
 */
export const roboSensors: CourseModule = {
  meta: {
    title: "Sensors — Every Arduino & ESP32 Sensor",
    slug: "robo-sensors",
    track: "robotics",
    level: "high",
    description:
      "A lesson for every popular sensor — distance, motion, temperature, light, gas, motion, magnetism and more — with diagrams, wiring and sample code.",
    coverImage: "/covers/robotics.svg",
    order: 31,
  },
  lessons: [
    {
      title: "How Sensors Work",
      slug: "sensors-intro",
      estMinutes: 10,
      body: body(
        md(
          "# Sensors — your robot's senses\n\nA **sensor** turns something in the real world — light, heat, distance, motion, gas, sound — into an electrical signal your board can read as a **number**. Without sensors, a robot is blind. With them, it can react to the world.\n\nEvery sensor in this course follows the same idea: it senses something physical and gives your Arduino or ESP32 a value to act on.",
        ),
        svg(SVG_SENSE_PIPELINE, "Every sensor: real world → sensor → a number your board reads"),
        md(
          "## Two kinds of signal\n\n| Type | What you read | How you read it |\n| --- | --- | --- |\n| **Digital** | ON or OFF (HIGH/LOW) | `digitalRead(pin)` → `0` or `1` |\n| **Analog** | a range of values | `analogRead(pin)` → `0–1023` (Uno) or `0–4095` (ESP32) |\n\nSome smarter sensors talk over a **bus** instead — usually **I²C** (two shared wires, `SDA` + `SCL`) — and you read them with a small library.",
        ),
        mermaid(
          "flowchart LR\n  A[Sensor] -->|digital HIGH/LOW| B[digitalRead]\n  A -->|analog voltage| C[analogRead]\n  A -->|I2C / SPI| D[a library]\n  B --> E[Your code reacts]\n  C --> E\n  D --> E",
          "Three ways a sensor gives data to your board",
        ),
        callout(
          "tip",
          "**Wiring basics for almost every sensor:** connect **VCC** to 5V (or 3.3V on the ESP32), **GND** to GND, and the **signal** pin to a digital or analog pin. Always share a common ground between the sensor and the board.",
        ),
        callout(
          "warning",
          "The ESP32 runs at **3.3V** logic — never feed it 5V on a GPIO pin. Many sensors are happy at 3.3V; check the datasheet, and use a level shifter for 5V-only modules.",
        ),
        md(
          "## How this course works\n\nEach lesson covers one popular sensor: what it is, a picture of the module, exactly how to wire it, and a working sketch you can **Open in RoboCode Studio**. Browse them in any order — pick the sensor your project needs.",
        ),
      ),
    },
    ...sensorsPart1,
    ...sensorsPart2,
    ...sensorsPart3,
  ],
  tasks: [
    {
      title: "Challenge: Threshold alarm",
      slug: "challenge-sensors",
      description:
        "A sensor gives you a reading. Print 'too hot' to the Serial Monitor when the temperature reading is above 25.",
      track: "robotics",
      difficulty: "beginner",
      points: 50,
      boardType: "arduino-uno",
      starterCode:
        "void setup() {\n  Serial.begin(9600);\n  int temperature = 30; // pretend this came from a sensor\n  // Print the words: too hot   — only if temperature is above 25\n}\n\nvoid loop() {}\n",
      checks: { rules: [{ type: "serial_contains", value: "too hot" }] },
    },
  ],
};
