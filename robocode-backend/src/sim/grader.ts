import { Machine } from "./machine";
import { Interpreter, SimError, type SimYield } from "./interpreter";

// Server-safe auto-grader: runs the RVM headlessly and evaluates task checks.
// No DOM required — only the interpreter + machine.

export interface CheckRule {
  type: "serial_contains" | "serial_matches" | "pin_toggles" | "pin_high" | "pin_low" | "analog_write";
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

export function gradeCode(
  code: string,
  checks: { rules?: CheckRule[] } | null | undefined,
  opts?: { analog?: Record<string, number>; digital?: Record<string, number>; maxWaits?: number },
): GradeResult {
  const rules = checks?.rules ?? [];
  const serial: string[] = [];
  const m = new Machine();
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
    const interp = new Interpreter(code, m);
    const gen = interp.run();
    const maxWaits = opts?.maxWaits ?? 40;
    let waits = 0;
    let res = gen.next();
    for (let i = 0; i < 5_000_000 && !res.done; i++) {
      const y = res.value as SimYield;
      if (y.kind === "wait") {
        sample();
        if (++waits >= maxWaits) break;
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
    default: return r.type;
  }
}
