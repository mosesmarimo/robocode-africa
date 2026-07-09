import { Machine } from "./machine";
import { Interpreter, SimError, type SimYield } from "./interpreter";
import { UNO_PROFILE, ESP32_PROFILE, type BoardProfile } from "./board-profile";

// Server-safe auto-grader: runs the RVM headlessly and evaluates task checks.
// No DOM required — only the interpreter + machine.

export interface CheckRule {
  type:
    | "serial_contains"
    | "serial_matches"
    | "pin_toggles"
    | "pin_high"
    | "pin_low"
    | "analog_write"
    // Output-based rules for coding-language challenges (graded against program stdout).
    | "stdout_contains"
    | "stdout_equals"
    | "stdout_matches";
  value?: string;
  pin?: number;
  min?: number;
}

export interface GradeResult {
  passed: boolean;
  score: number; // 0..100
  results: { description: string; ok: boolean }[];
  serial: string[];
  error?: string;
}

// Wall-clock budget for a single grading run. The interpreter is synchronous and
// CPU-bound, so this bounds how long one submission can hold the event loop.
const WALL_CLOCK_BUDGET_MS = 1500;

// Board id -> sim profile + display name. Unknown boards (e.g. a future
// "raspberry-pi-pico") must NOT fall through to the Arduino parser — they
// return the graceful failure shape below instead of silently grading as UNO.
const PROFILE_BY_BOARD: Record<string, { profile: BoardProfile; name: string } | undefined> = {
  "arduino-uno": { profile: UNO_PROFILE, name: "Arduino UNO R3" },
  uno: { profile: UNO_PROFILE, name: "Arduino UNO R3" },
  esp32: { profile: ESP32_PROFILE, name: "ESP32 DevKit V1" },
};

export function gradeCode(
  code: string,
  checks: { rules?: CheckRule[] } | null | undefined,
  opts?: { analog?: Record<string, number>; digital?: Record<string, number>; maxWaits?: number; board?: string },
): GradeResult {
  const rules = checks?.rules ?? [];
  const entry = PROFILE_BY_BOARD[opts?.board ?? "arduino-uno"];
  if (!entry) {
    return {
      passed: false,
      score: 0,
      results: rules.map((r) => ({ description: describe(r), ok: false })),
      serial: [],
      error: "Auto-grading for this board isn't available yet — a teacher will review your submission.",
    };
  }
  const { profile, name } = entry;
  const serial: string[] = [];
  const m = new Machine(profile);
  m.onSerial = (l) => serial.push(l);
  for (const [k, v] of Object.entries(opts?.analog ?? {})) m.analogSources[k] = () => v;
  for (const [k, v] of Object.entries(opts?.digital ?? {})) m.digitalSources[k] = () => v;

  // track toggles + max pwm per pin
  const last: Record<string, number> = {};
  const toggles: Record<string, number> = {};
  const maxPwm: Record<string, number> = {};
  const sample = () => {
    for (const pin of Object.keys(m.digital)) {
      const v = m.digital[pin] ?? 0;
      if (last[pin] !== undefined && last[pin] !== v) toggles[pin] = (toggles[pin] ?? 0) + 1;
      last[pin] = v;
      maxPwm[pin] = Math.max(maxPwm[pin] ?? 0, m.pwm[pin] ?? 0);
    }
  };

  let error: string | undefined;
  try {
    const interp = new Interpreter(code, m, profile, name);
    const gen = interp.run();
    const maxWaits = opts?.maxWaits ?? 40;
    let waits = 0;
    let res = gen.next();
    let ticksSinceWait = 0;
    // Wall-clock budget: a tight, delay-free loop is CPU-bound and synchronous,
    // so it would otherwise hold the event loop for the whole iteration budget.
    // Bound the actual run to a few hundred ms regardless of iteration count.
    const deadline = Date.now() + WALL_CLOCK_BUDGET_MS;
    for (let i = 0; i < 5_000_000 && !res.done; i++) {
      // Check the wall clock periodically (cheap — every 4096 iterations).
      if ((i & 4095) === 0 && Date.now() > deadline) {
        sample();
        throw new SimError("Program ran too long (time limit exceeded).");
      }
      const y = res.value as SimYield;
      if (y.kind === "wait") {
        sample();
        ticksSinceWait = 0;
        if (++waits >= maxWaits) break;
      } else {
        // Sample periodically so delay-free loops (busy toggles, no delay())
        // still register pin transitions and PWM, not just on wait yields.
        if ((++ticksSinceWait & 1023) === 0) {
          sample();
          // A delay-free loop never yields 'wait'; bound the run by counting
          // these periodic samples toward the same budget.
          if (++waits >= maxWaits) break;
        }
      }
      res = gen.next();
    }
    sample();
  } catch (e) {
    error = e instanceof SimError ? e.message : String(e);
  }

  const results = rules.map((r) => ({ description: describe(r), ok: evaluate(r, { serial, toggles, maxPwm, m }) }));
  const passedCount = results.filter((r) => r.ok).length;
  const passed = !error && results.length > 0 && passedCount === results.length;
  const score = results.length ? Math.round((passedCount / results.length) * 100) : passed ? 100 : 0;
  return { passed, score, results, serial, error };
}

function pinKey(pin?: number) {
  return String(pin ?? 13);
}

function evaluate(
  r: CheckRule,
  ctx: { serial: string[]; toggles: Record<string, number>; maxPwm: Record<string, number>; m: Machine },
): boolean {
  switch (r.type) {
    case "serial_contains":
      return ctx.serial.some((l) => l.toLowerCase().includes((r.value ?? "").toLowerCase()));
    case "serial_matches":
      try { const re = new RegExp(r.value ?? ""); return ctx.serial.some((l) => re.test(l)); } catch { return false; }
    case "pin_toggles":
      return (ctx.toggles[pinKey(r.pin)] ?? 0) >= (r.min ?? 2);
    case "pin_high":
      return (ctx.maxPwm[pinKey(r.pin)] ?? 0) > 0;
    case "pin_low":
      return (ctx.maxPwm[pinKey(r.pin)] ?? 0) === 0;
    case "analog_write":
      return (ctx.maxPwm[pinKey(r.pin)] ?? 0) >= (r.min ?? 1);
    default:
      return false;
  }
}

function describe(r: CheckRule): string {
  switch (r.type) {
    case "serial_contains": return `Serial output contains "${r.value}"`;
    case "serial_matches": return `Serial output matches /${r.value}/`;
    case "pin_toggles": return `Pin ${r.pin ?? 13} blinks (toggles ≥ ${r.min ?? 2})`;
    case "pin_high": return `Pin ${r.pin ?? 13} is driven HIGH`;
    case "pin_low": return `Pin ${r.pin ?? 13} stays LOW`;
    case "analog_write": return `Pin ${r.pin ?? 13} uses PWM`;
    default: return describeOutput(r);
  }
}

// ---- Coding-language grading: evaluate task checks against program stdout ----
// Used for non-Arduino challenges, where the submitted code is executed by the
// AI run-code runtime and the captured stdout is checked here.

export function gradeOutput(
  output: string,
  checks: { rules?: CheckRule[] } | null | undefined,
  runError?: string,
): GradeResult {
  const rules = checks?.rules ?? [];
  const out = output ?? "";
  const lines = out.split(/\r?\n/);
  // A failed run fails every rule (and surfaces the error).
  const results = rules.map((r) => ({
    description: describeOutput(r),
    ok: runError ? false : evaluateOutput(r, out),
  }));
  const passedCount = results.filter((r) => r.ok).length;
  const passed = !runError && results.length > 0 && passedCount === results.length;
  const score = results.length ? Math.round((passedCount / results.length) * 100) : 0;
  return { passed, score, results, serial: lines, error: runError };
}

function evaluateOutput(r: CheckRule, out: string): boolean {
  switch (r.type) {
    case "stdout_contains":
      return out.toLowerCase().includes((r.value ?? "").toLowerCase());
    case "stdout_equals":
      return out.trim() === (r.value ?? "").trim();
    case "stdout_matches":
      try { return new RegExp(r.value ?? "").test(out); } catch { return false; }
    default:
      return false;
  }
}

function describeOutput(r: CheckRule): string {
  switch (r.type) {
    case "stdout_contains": return `Output contains "${r.value}"`;
    case "stdout_equals": return `Output equals "${r.value}"`;
    case "stdout_matches": return `Output matches /${r.value}/`;
    default: return r.type;
  }
}
