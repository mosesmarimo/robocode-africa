// Shared REAL element pin-name tables + normalizer, used by BOTH:
//   - scripts/bake-diagrams.ts        (feeds the AI real pin names; validates its output)
//   - scripts/repair-diagram-pins.ts  (renames already-baked wires to real pin names)
//
// "Real" means the exact pin name the RENDERED Studio element exposes:
//   - arduino-uno / esp32: @wokwi/elements' pinInfo.
//   - raspberry-pi-pico: the first-party PiPicoBoard element's pin list
//     (src/components/studio/pi-pico-board.tsx) — NOT @wokwi/elements, and NOT the
//     abstract GPIO numbers in src/lib/domain/boards.ts (those are simulation-facing
//     aliases, not the names a wire endpoint must match to render/resolve).

export const BOARD_PINS: Record<string, string[]> = {
  "arduino-uno": "A5.2 A4.2 AREF GND.1 13 12 11 10 9 8 7 6 5 4 3 2 1 0 IOREF RESET 3.3V 5V GND.2 GND.3 VIN A0 A1 A2 A3 A4 A5".split(" "),
  esp32: "VIN GND.2 D13 D12 D14 D27 D26 D25 D33 D32 D35 D34 VN VP EN 3V3 GND.1 D15 D2 D4 RX2 TX2 D5 D18 D19 D21 RX0 TX0 D22 D23".split(" "),
  // pi-pico-board.tsx LEFT_NAMES + RIGHT_NAMES (GP0-GP22, GP26-GP28) + the onboard-LED
  // GP25 pad: none of GP23/24/25 have a physical header pin on real hardware, but GP25
  // drives the built-in LED (Rp2040Engine reads it directly) and gets a wireable pad at
  // the LED graphic so lessons that wire an external LED to it render correctly. GP23/24
  // are genuinely internal — no pad, no header pin — so they're excluded here too;
  // otherwise this validation table would false-pass wires the rendered board can't
  // actually resolve.
  "raspberry-pi-pico": [
    ...Array.from({ length: 29 }, (_, n) => `GP${n}`).filter((n) => n !== "GP23" && n !== "GP24"),
    "GND.1", "GND.2", "GND.3", "GND.4", "GND.5", "GND.6", "GND.7",
    "VBUS", "VSYS", "3V3", "3V3_EN", "ADC_VREF", "RUN", "AGND",
  ],
};

// REAL component element pins (validated against; note tilt-switch differs from COMPONENT_PINS).
export const COMP_PINS: Record<string, string[]> = {
  resistor: ["1", "2"], led: ["A", "C"], buzzer: ["1", "2"], servo: ["GND", "V+", "PWM"],
  ultrasonic: ["VCC", "TRIG", "ECHO", "GND"], photoresistor: ["VCC", "GND", "DO", "AO"],
  pir: ["VCC", "OUT", "GND"], dht22: ["VCC", "SDA", "NC", "GND"],
  gas: ["AOUT", "DOUT", "GND", "VCC"], flame: ["VCC", "GND", "DOUT", "AOUT"],
  mpu6050: ["INT", "AD0", "XCL", "XDA", "SDA", "SCL", "GND", "VCC"],
  "ir-receiver": ["GND", "VCC", "DAT"], "tilt-switch": ["GND", "VCC", "OUT"],
  sound: ["AOUT", "GND", "VCC", "DOUT"], potentiometer: ["GND", "SIG", "VCC"],
  pushbutton: ["1.l", "2.l", "1.r", "2.r"],
};

// Legacy Nano-RP2040-Connect pin labels baked before Task 7 replaced the rendered Pico
// element with the first-party GP-numbered board. Maps a legacy label back to its numeric
// GPIO so it can be renamed to the real `GP{n}` pin (see fixBoardPin's pico branch below).
const PICO_LEGACY_TO_GPIO: Record<string, string> = {
  D2: "25", D3: "15", D4: "16", D5: "17", D6: "18", D7: "19", D8: "20", D9: "21",
  D10: "5", D11: "7", D12: "4", D13: "6",
  A0: "26", A1: "27", A2: "28", A4: "12", A5: "13", RX: "1",
};

const gpioToPico = (n: string) => `GP${n}`;

/**
 * Normalize a board-side pin name (from the AI, or a historic bake) into the real
 * element pin name for `board`, or null if it doesn't correspond to any real pin.
 */
export function fixBoardPin(board: string, pin: string): string | null {
  const real = new Set(BOARD_PINS[board] ?? []);
  if (real.has(pin)) return pin;
  if (/^GND/i.test(pin)) return "GND.1";
  if (pin === "3V3" || pin === "3.3V") return real.has("3.3V") ? "3.3V" : real.has("3V3") ? "3V3" : null;
  if (board === "arduino-uno") return pin === "VIN" ? "VIN" : pin === "5V" ? "5V" : null;
  if (board === "esp32") {
    if (pin === "5V") return "VIN";
    if (pin === "36") return "VP";
    if (pin === "39") return "VN";
    if (/^\d+$/.test(pin) && real.has("D" + pin)) return "D" + pin;
    return null;
  }
  if (board === "raspberry-pi-pico") {
    if (/^\d+$/.test(pin)) return gpioToPico(pin);
    const legacyGpio = PICO_LEGACY_TO_GPIO[pin];
    if (legacyGpio) return gpioToPico(legacyGpio);
    return null;
  }
  return null;
}
