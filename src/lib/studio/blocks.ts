// Block-based coding model for RoboCode.Africa — no external dependencies.
// Generates valid Arduino C++ sketches from a list of Block values.

export type PinMode = "OUTPUT" | "INPUT" | "INPUT_PULLUP";

// ── Discriminated union of block types ─────────────────────────────────────

export type Block =
  | { kind: "PIN_MODE"; pin: number; mode: PinMode }
  | { kind: "DIGITAL_WRITE"; pin: number; on: boolean }
  | { kind: "WAIT"; ms: number }
  | { kind: "REPEAT"; times: number; children: Block[] }
  | { kind: "FOREVER"; children: Block[] }
  | { kind: "IF_PRESSED"; pin: number; children: Block[] }
  | { kind: "SERIAL_PRINT"; text: string }
  | { kind: "TONE"; pin: number; freq: number }
  | { kind: "NO_TONE"; pin: number }
  | { kind: "SERVO_WRITE"; pin: number; angle: number };

// ── Default starter program (blink LED on pin 13) ──────────────────────────

export const DEFAULT_BLOCKS: Block[] = [
  { kind: "PIN_MODE", pin: 13, mode: "OUTPUT" },
  { kind: "SERIAL_PRINT", text: "RoboCode ready!" },
  {
    kind: "FOREVER",
    children: [
      { kind: "DIGITAL_WRITE", pin: 13, on: true },
      { kind: "WAIT", ms: 500 },
      { kind: "DIGITAL_WRITE", pin: 13, on: false },
      { kind: "WAIT", ms: 500 },
    ],
  },
];

// ── Code generation helpers ─────────────────────────────────────────────────

function ind(depth: number): string {
  return "  ".repeat(depth);
}

/**
 * Emit Arduino statements for a single block at a given indent depth.
 * FOREVER blocks are special — they must appear at the top level and are
 * rendered as the loop() body; this helper is never called for them directly
 * (they are unwrapped by generateCode).
 */
function emitBlock(block: Block, depth: number): string {
  const i = ind(depth);
  switch (block.kind) {
    case "PIN_MODE":
      return `${i}pinMode(${block.pin}, ${block.mode});`;

    case "DIGITAL_WRITE":
      return `${i}digitalWrite(${block.pin}, ${block.on ? "HIGH" : "LOW"});`;

    case "WAIT":
      return `${i}delay(${block.ms});`;

    case "REPEAT": {
      const body = block.children.map((c) => emitBlock(c, depth + 1)).join("\n");
      return `${i}for (int _i = 0; _i < ${block.times}; _i++) {\n${body}\n${i}}`;
    }

    case "FOREVER": {
      // Nested FOREVER (unusual but allowed): emit as while(true)
      const body = block.children.map((c) => emitBlock(c, depth + 1)).join("\n");
      return `${i}while (true) {\n${body}\n${i}}`;
    }

    case "IF_PRESSED": {
      // Pull-up button: LOW when pressed
      const body = block.children.map((c) => emitBlock(c, depth + 1)).join("\n");
      return `${i}if (digitalRead(${block.pin}) == LOW) {\n${body}\n${i}}`;
    }

    case "SERIAL_PRINT":
      return `${i}Serial.println("${block.text.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}");`;

    case "TONE":
      return `${i}tone(${block.pin}, ${block.freq});`;

    case "NO_TONE":
      return `${i}noTone(${block.pin});`;

    case "SERVO_WRITE":
      return `${i}myServo.write(${block.angle});`;

    default: {
      // exhaustive check
      const _never: never = block;
      void _never;
      return "";
    }
  }
}

// ── Main export ─────────────────────────────────────────────────────────────

/**
 * Generate a complete Arduino sketch from a list of top-level blocks.
 *
 * Strategy:
 *  - PIN_MODE  blocks → setup() body
 *  - FOREVER   blocks → loop() body (children unwrapped; only the first is used)
 *  - All other top-level blocks → setup() body (executed once, in order)
 *
 * If no FOREVER block is present, loop() is left empty.
 * If SERVO_WRITE appears anywhere, #include <Servo.h> + Servo myServo; is added.
 */
export function generateCode(blocks: Block[]): string {
  const needsServo = hasKind(blocks, "SERVO_WRITE");

  // Separate setup-side blocks from the forever loop block
  const setupBlocks: Block[] = [];
  let foreverBlock: Block & { kind: "FOREVER" } | null = null;

  for (const b of blocks) {
    if (b.kind === "FOREVER") {
      if (!foreverBlock) foreverBlock = b;
      // additional FOREVER blocks are ignored (you can only have one loop)
    } else {
      setupBlocks.push(b);
    }
  }

  // Auto-add Serial.begin if SERIAL_PRINT is used anywhere
  const needsSerial = hasKind(blocks, "SERIAL_PRINT");

  // Build setup body
  const setupLines: string[] = [];
  if (needsServo) setupLines.push("  myServo.attach(/* pin */9); // update pin if needed");
  if (needsSerial) setupLines.push("  Serial.begin(9600);");
  for (const b of setupBlocks) {
    setupLines.push(emitBlock(b, 1));
  }

  // Build loop body
  const loopLines: string[] = [];
  if (foreverBlock) {
    for (const c of foreverBlock.children) {
      loopLines.push(emitBlock(c, 1));
    }
  }

  // Assemble sketch
  const parts: string[] = [];

  if (needsServo) {
    parts.push("#include <Servo.h>");
    parts.push("Servo myServo;");
    parts.push("");
  }

  parts.push("void setup() {");
  if (setupLines.length > 0) {
    parts.push(...setupLines);
  }
  parts.push("}");
  parts.push("");
  parts.push("void loop() {");
  if (loopLines.length > 0) {
    parts.push(...loopLines);
  }
  parts.push("}");

  return parts.join("\n");
}

// ── Utilities ───────────────────────────────────────────────────────────────

/** Recursively check whether a block kind appears anywhere in a block tree. */
function hasKind(blocks: Block[], kind: Block["kind"]): boolean {
  for (const b of blocks) {
    if (b.kind === kind) return true;
    if ("children" in b && b.children.length > 0) {
      if (hasKind(b.children, kind)) return true;
    }
  }
  return false;
}

/** Human-readable label for a block kind, shown in the palette. */
export const BLOCK_LABELS: Record<Block["kind"], string> = {
  PIN_MODE: "Set Pin Mode",
  DIGITAL_WRITE: "Turn Pin On/Off",
  WAIT: "Wait",
  REPEAT: "Repeat",
  FOREVER: "Forever Loop",
  IF_PRESSED: "If Button Pressed",
  SERIAL_PRINT: "Print to Serial",
  TONE: "Play Tone",
  NO_TONE: "Stop Tone",
  SERVO_WRITE: "Move Servo",
};

/** Category for colour-coding blocks. */
export type BlockCategory = "control" | "output" | "input" | "sound" | "time";

export const BLOCK_CATEGORY: Record<Block["kind"], BlockCategory> = {
  PIN_MODE: "output",
  DIGITAL_WRITE: "output",
  WAIT: "time",
  REPEAT: "control",
  FOREVER: "control",
  IF_PRESSED: "input",
  SERIAL_PRINT: "output",
  TONE: "sound",
  NO_TONE: "sound",
  SERVO_WRITE: "output",
};

export const CATEGORY_COLORS: Record<BlockCategory, { bg: string; border: string; text: string }> = {
  control: { bg: "bg-violet-500/15", border: "border-violet-500/40", text: "text-violet-400" },
  output: { bg: "bg-amber-500/15", border: "border-amber-500/40", text: "text-amber-400" },
  input: { bg: "bg-sky-500/15", border: "border-sky-500/40", text: "text-sky-400" },
  sound: { bg: "bg-pink-500/15", border: "border-pink-500/40", text: "text-pink-400" },
  time: { bg: "bg-emerald-500/15", border: "border-emerald-500/40", text: "text-emerald-400" },
};

// Ordered palette shown to the user
export const PALETTE_BLOCKS: Block["kind"][] = [
  "FOREVER",
  "REPEAT",
  "IF_PRESSED",
  "PIN_MODE",
  "DIGITAL_WRITE",
  "WAIT",
  "SERIAL_PRINT",
  "TONE",
  "NO_TONE",
  "SERVO_WRITE",
];

/** Factory: create a default block instance for a given kind. */
export function makeBlock(kind: Block["kind"]): Block {
  switch (kind) {
    case "PIN_MODE":      return { kind, pin: 13, mode: "OUTPUT" };
    case "DIGITAL_WRITE": return { kind, pin: 13, on: true };
    case "WAIT":          return { kind, ms: 500 };
    case "REPEAT":        return { kind, times: 3, children: [] };
    case "FOREVER":       return { kind, children: [] };
    case "IF_PRESSED":    return { kind, pin: 2, children: [] };
    case "SERIAL_PRINT":  return { kind, text: "Hello!" };
    case "TONE":          return { kind, pin: 8, freq: 440 };
    case "NO_TONE":       return { kind, pin: 8 };
    case "SERVO_WRITE":   return { kind, pin: 9, angle: 90 };
  }
}
