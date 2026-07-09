// Sim board profiles, duplicated between the frontend and backend (neither
// app imports the other) so both simulate the same hardware identically.
// The esp_random LCG constants live here so both repos seed identically.

export interface BoardProfile {
  pins: string[];
  analogPins: string[];
  inputOnlyPins: string[];
  adcBits: number;
  pwmMax: number;
  touchPins: string[];
  dacPins: string[];
  uarts: Array<{ tx: string; rx: string }>;
  ledBuiltin: string;
}

export const UNO_PROFILE: BoardProfile = {
  pins: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13"],
  analogPins: ["A0", "A1", "A2", "A3", "A4", "A5"],
  inputOnlyPins: [],
  adcBits: 10,
  pwmMax: 255,
  touchPins: [],
  dacPins: [],
  uarts: [{ tx: "1", rx: "0" }],
  ledBuiltin: "13",
};

export const ESP32_PROFILE: BoardProfile = {
  pins: ["2", "4", "5", "12", "13", "14", "15", "18", "19", "21", "22", "23", "25", "26", "27", "32", "33", "1", "3", "16", "17"],
  analogPins: ["32", "33", "34", "35", "36", "39"],
  inputOnlyPins: ["34", "35", "36", "39"],
  adcBits: 12,
  pwmMax: 255,
  touchPins: ["4", "0", "2", "15", "13", "12", "14", "27", "33", "32"],
  dacPins: ["25", "26"],
  uarts: [{ tx: "1", rx: "3" }, { tx: "10", rx: "9" }, { tx: "17", rx: "16" }],
  ledBuiltin: "2",
};

// esp_random LCG constants (shared by front + back for grading parity).
export const ESP_RAND_SEED = 0x2545f491;
export const ESP_RAND_MUL = 1664525;
export const ESP_RAND_INC = 1013904223;
