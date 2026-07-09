// One-off: hand-author the two Pico lesson diagrams that were excluded from the AI
// pipeline because their code uses GPIOs the old rendered Nano-RP2040-Connect board
// element couldn't expose (GP0, GP14, ...). Task 7 replaced that element with a
// first-party GP-numbered Pico board (src/components/studio/pi-pico-board.tsx), so both
// lessons now have a real board to wire against — but re-baking via the live AI isn't
// worth the risk of a hallucinated circuit, so these are hand-authored directly against
// the real element's pin names (scripts/element-pins.ts).
//
//   npx tsx scripts/add-pico-diagrams.ts
//   npx tsx scripts/repair-diagram-pins.ts   # fold these into the validation pass
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { bakedKey } from "../../robocode-backend/prisma/baked-diagrams";
import { BUTTON_ADC_CODE, PWM_SERVO_CODE } from "../../robocode-backend/prisma/content/robo-pico";

const OUT = resolve(__dirname, "../../robocode-backend/prisma/content/generated/baked-diagrams.json");

type Wire = { id: string; from: string; to: string; color?: string };
type Part = { id: string; type: string; x: number; y: number; rotation?: number; props?: Record<string, never> };
type Entry = { board: string; language: string; diagram: { board: string; parts: Part[]; wires: Wire[] } };
type Store = { version: number; entries: Record<string, Entry> };

// Repair script's positioning convention: board at the left, components in a column to
// the right, evenly spaced so no wire crosses another part.
const BOARD_X = 120;
const BOARD_Y = 40;
const COMP_X = 450;
const COMP_Y0 = 40;
const COMP_DY = 150;

const mcu = (): Part => ({ id: "mcu", type: "__board__:raspberry-pi-pico", x: BOARD_X, y: BOARD_Y, rotation: 0 });
const part = (id: string, type: string, col: number): Part => ({ id, type, x: COMP_X, y: COMP_Y0 + col * COMP_DY, rotation: 0, props: {} });
const wire = (id: string, from: string, to: string, color: string): Wire => ({ id, from, to, color });

// pico-button-adc: tactile button (pull-down: press connects GP14 to 3V3) + a
// potentiometer wiper on GP26 (ADC0). See prisma/content/robo-pico.ts BUTTON_ADC_CODE.
const buttonAdc: Entry = {
  board: "raspberry-pi-pico",
  language: "micropython",
  diagram: {
    board: "raspberry-pi-pico",
    parts: [mcu(), part("btn-1", "pushbutton", 0), part("pot-1", "potentiometer", 1)],
    wires: [
      wire("w1", "btn-1:1.l", "mcu:GP14", "green"),
      wire("w2", "btn-1:2.r", "mcu:3V3", "red"),
      wire("w3", "pot-1:SIG", "mcu:GP26", "orange"),
      wire("w4", "pot-1:VCC", "mcu:3V3", "red"),
      wire("w5", "pot-1:GND", "mcu:GND.1", "black"),
    ],
  },
};

// pico-pwm-servo: fading LED on GP15, buzzer on GP16, hobby servo on GP0 powered from
// VBUS (not 3V3 — see the lesson's own warning about servo current draw). See
// prisma/content/robo-pico.ts PWM_SERVO_CODE.
const pwmServo: Entry = {
  board: "raspberry-pi-pico",
  language: "micropython",
  diagram: {
    board: "raspberry-pi-pico",
    parts: [
      mcu(),
      part("led-1", "led", 0),
      part("r-1", "resistor", 1),
      part("bz-1", "buzzer", 2),
      part("servo-1", "servo", 3),
    ],
    wires: [
      wire("w1", "led-1:A", "r-1:1", "green"),
      wire("w2", "r-1:2", "mcu:GP15", "green"),
      wire("w3", "led-1:C", "mcu:GND.3", "black"),
      wire("w4", "bz-1:1", "mcu:GP16", "orange"),
      wire("w5", "bz-1:2", "mcu:GND.3", "black"),
      wire("w6", "servo-1:PWM", "mcu:GP0", "yellow"),
      wire("w7", "servo-1:V+", "mcu:VBUS", "red"),
      wire("w8", "servo-1:GND", "mcu:GND.1", "black"),
    ],
  },
};

const store = JSON.parse(readFileSync(OUT, "utf8")) as Store;
store.entries[bakedKey("pico-button-adc", BUTTON_ADC_CODE)] = buttonAdc;
store.entries[bakedKey("pico-pwm-servo", PWM_SERVO_CODE)] = pwmServo;
writeFileSync(OUT, JSON.stringify(store, null, 2) + "\n", "utf8");
console.log(`Inserted pico-button-adc + pico-pwm-servo. total-entries=${Object.keys(store.entries).length}`);
