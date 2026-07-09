// Board catalogue for RoboCode Studio. Visuals use @wokwi/elements; pin coordinates are read
// from each element's runtime `pinInfo`. Simulation binds to the right MCU core.

import { BoardProfile, UNO_PROFILE, ESP32_PROFILE } from "@/lib/sim/board-profile";

export type BoardId = "arduino-uno" | "esp32" | "raspberry-pi-pico";
export type McuTarget = "avr8js" | "esp32" | "rp2040js";

export type { BoardProfile };
export { UNO_PROFILE, ESP32_PROFILE };

export interface BoardDef {
  id: BoardId;
  name: string;
  shortName: string;
  mcu: string;
  mcuTarget: McuTarget;
  wokwiTag: string;
  languages: string[];
  blurb: string;
  /** Digital pins usable as logical I/O labels for the simple wiring helper. */
  gpio: string[];
  analog: string[];
  defaultLanguage: "arduino" | "micropython";
  starterCode: string;
  accent: string;
  /** Sim engine profile (present only for InterpreterEngine-routed boards: Uno/ESP32). */
  profile?: BoardProfile;
  /** Element pin label -> GPIO label used by the sim Machine (e.g. ESP32 "VP" -> "36"). */
  pinAliases?: Record<string, string>;
  /** Board element property that renders the on-board LED (uno: led13, esp32: led1, pico: ledBuiltIn). */
  builtinLedProp?: string;
}

const UNO_STARTER = `// RoboCode.Africa — Arduino UNO
// Blink the on-board LED on pin 13.
void setup() {
  pinMode(13, OUTPUT);
  Serial.begin(9600);
  Serial.println("RoboCode UNO ready!");
}

void loop() {
  digitalWrite(13, HIGH);
  delay(500);
  digitalWrite(13, LOW);
  delay(500);
}
`;

const ESP32_STARTER = `// RoboCode.Africa — ESP32
// Blink an LED on GPIO 2.
void setup() {
  pinMode(2, OUTPUT);
  Serial.begin(115200);
  Serial.println("RoboCode ESP32 ready!");
}

void loop() {
  digitalWrite(2, HIGH);
  delay(500);
  digitalWrite(2, LOW);
  delay(500);
}
`;

const PICO_STARTER = `# RoboCode.Africa — Raspberry Pi Pico (MicroPython)
from machine import Pin
import time

led = Pin(25, Pin.OUT)   # on-board LED
print("RoboCode Pico ready!")

while True:
    led.toggle()
    time.sleep(0.5)
`;

export const BOARDS: Record<BoardId, BoardDef> = {
  "arduino-uno": {
    id: "arduino-uno",
    name: "Arduino UNO R3",
    shortName: "UNO",
    mcu: "ATmega328P",
    mcuTarget: "avr8js",
    wokwiTag: "wokwi-arduino-uno",
    languages: ["arduino"],
    blurb: "The classic 8-bit learning board. Cycle-accurate simulation via avr8js.",
    gpio: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13"],
    analog: ["A0", "A1", "A2", "A3", "A4", "A5"],
    defaultLanguage: "arduino",
    starterCode: UNO_STARTER,
    accent: "#00979d",
    profile: UNO_PROFILE,
    builtinLedProp: "led13",
  },
  esp32: {
    id: "esp32",
    name: "ESP32 DevKit V1",
    shortName: "ESP32",
    mcu: "ESP-WROOM-32",
    mcuTarget: "esp32",
    wokwiTag: "wokwi-esp32-devkit-v1",
    languages: ["arduino", "micropython"],
    blurb: "Dual-core Wi-Fi + BLE board. Great for connected robotics projects.",
    gpio: ["2", "4", "5", "12", "13", "14", "15", "18", "19", "21", "22", "23", "25", "26", "27", "32", "33"],
    analog: ["32", "33", "34", "35", "36", "39"],
    defaultLanguage: "arduino",
    starterCode: ESP32_STARTER,
    accent: "#e7352c",
    profile: ESP32_PROFILE,
    builtinLedProp: "led1",
    pinAliases: { VP: "36", VN: "39", TX0: "1", RX0: "3", TX2: "17", RX2: "16" },
  },
  "raspberry-pi-pico": {
    id: "raspberry-pi-pico",
    name: "Raspberry Pi Pico (RP2040)",
    shortName: "Pico",
    mcu: "RP2040",
    mcuTarget: "rp2040js",
    // First-party Pico board element (src/components/studio/pi-pico-board.tsx) with real
    // GP-numbered pin labels; runs real RP2040 firmware via rp2040js.
    wokwiTag: "rc-pi-pico",
    languages: ["micropython", "arduino"],
    blurb: "Dual-core ARM Cortex-M0+ board. Runs real RP2040 firmware via rp2040js.",
    gpio: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "15", "16", "17", "18", "19", "20", "25"],
    analog: ["26", "27", "28"],
    defaultLanguage: "micropython",
    starterCode: PICO_STARTER,
    accent: "#c51a4a",
    builtinLedProp: "ledBuiltIn",
    // Legacy Nano D/A labels, kept so pre-existing saved diagrams still simulate after
    // Task 7 switches the board element to the first-party Pico with its own GP-numbered pinout.
    pinAliases: {
      D2: "25", D3: "15", D4: "16", D5: "17", D6: "18", D7: "19", D8: "20", D9: "21",
      D10: "5", D11: "7", D12: "4", D13: "6",
      A0: "26", A1: "27", A2: "28", A3: "29", A4: "12", A5: "13", RX: "1",
    },
  },
};

export const BOARD_LIST = Object.values(BOARDS);

export function getBoard(id: string): BoardDef {
  return BOARDS[(id as BoardId)] ?? BOARDS["arduino-uno"];
}
