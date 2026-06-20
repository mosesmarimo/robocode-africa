import { parse, ParseError, type Node } from "./parser";
import { preprocess } from "./lexer";
import type { Machine } from "./machine";

/* eslint-disable @typescript-eslint/no-explicit-any */

export type SimYield = { kind: "wait"; ms: number } | { kind: "tick" };

class Scope {
  vars = new Map<string, any>();
  constructor(public parent?: Scope) {}
  get(name: string): any {
    let s: Scope | undefined = this;
    while (s) {
      if (s.vars.has(name)) return s.vars.get(name);
      s = s.parent;
    }
    return undefined;
  }
  has(name: string): boolean {
    let s: Scope | undefined = this;
    while (s) {
      if (s.vars.has(name)) return true;
      s = s.parent;
    }
    return false;
  }
  set(name: string, value: any) {
    let s: Scope | undefined = this;
    while (s) {
      if (s.vars.has(name)) return s.vars.set(name, value);
      s = s.parent;
    }
    this.vars.set(name, value);
  }
  define(name: string, value: any) {
    this.vars.set(name, value);
  }
}

class ReturnSignal { constructor(public value: any) {} }
class BreakSignal {}
class ContinueSignal {}

export class SimError extends Error {
  line?: number;
  constructor(msg: string, line?: number) {
    super(msg);
    this.line = line;
  }
}

const ANALOG = ["A0", "A1", "A2", "A3", "A4", "A5", "A6", "A7"];

export class Interpreter {
  private ast: Node;
  private functions = new Map<string, Node>();
  private globals = new Scope();
  private steps = 0;

  constructor(code: string, private machine: Machine) {
    let defines: Record<string, string> = {};
    try {
      defines = preprocess(code).defines;
      this.ast = parse(code);
    } catch (e) {
      if (e instanceof ParseError) throw new SimError(`Syntax error: ${e.message}`, e.line);
      throw e;
    }
    this.installConstants(defines);
    this.prepare();
  }

  private installConstants(defines: Record<string, string>) {
    const g = this.globals;
    const c: Record<string, any> = {
      HIGH: 1, LOW: 0, INPUT: 0, OUTPUT: 1, INPUT_PULLUP: 2, PULLUP: 2,
      true: true, false: false, LED_BUILTIN: 13, PI: Math.PI, TWO_PI: Math.PI * 2, HALF_PI: Math.PI / 2,
      DEC: 10, HEX: 16, OCT: 8, BIN: 2, EULER: Math.E,
      CHANGE: 1, FALLING: 2, RISING: 3,
    };
    ANALOG.forEach((a) => (c[a] = a));
    for (const [k, v] of Object.entries(c)) g.define(k, v);
    // Serial + objects
    g.define("Serial", this.makeSerial());
    g.define("Serial1", this.makeSerial());
    // #defines
    for (const [k, val] of Object.entries(defines)) {
      const num = Number(val);
      g.define(k, Number.isNaN(num) ? val.replace(/^"|"$/g, "") : num);
    }
  }

  private prepare() {
    for (const node of this.ast.body) {
      if (node.type === "FuncDecl") this.functions.set(node.name, node);
      else if (node.type === "VarDecl") this.drain(this.execVarDecl(node, this.globals));
    }
  }

  /** run global initializers synchronously (no delays expected at global scope) */
  private drain(gen: Generator<SimYield, any>) {
    let r = gen.next();
    while (!r.done) r = gen.next();
    return r.value;
  }

  hasFunction(name: string) {
    return this.functions.has(name);
  }

  *run(): Generator<SimYield, void> {
    if (this.functions.has("setup")) yield* this.callUser("setup", []);
    for (;;) {
      if (this.functions.has("loop")) yield* this.callUser("loop", []);
      this.machine.advance(1);
      yield { kind: "tick" };
    }
  }

  // -------------------- statements --------------------
  private *execStmt(node: Node, env: Scope): Generator<SimYield, void> {
    if (++this.steps > 20_000_000) throw new SimError("Program ran too long (possible infinite loop without delay).");
    switch (node.type) {
      case "Block": {
        const inner = new Scope(env);
        for (const s of node.body) yield* this.execStmt(s, inner);
        return;
      }
      case "VarDecl":
        yield* this.execVarDecl(node, env);
        return;
      case "ExprStmt":
        yield* this.evalExpr(node.expr, env);
        return;
      case "If": {
        if (truthy(yield* this.evalExpr(node.cond, env))) yield* this.execStmt(node.then, env);
        else if (node.else) yield* this.execStmt(node.else, env);
        return;
      }
      case "While": {
        while (truthy(yield* this.evalExpr(node.cond, env))) {
          try { yield* this.execStmt(node.body, env); } catch (e) { if (e instanceof BreakSignal) break; if (e instanceof ContinueSignal) {} else throw e; }
          yield { kind: "tick" };
        }
        return;
      }
      case "DoWhile": {
        do {
          try { yield* this.execStmt(node.body, env); } catch (e) { if (e instanceof BreakSignal) break; if (e instanceof ContinueSignal) {} else throw e; }
          yield { kind: "tick" };
        } while (truthy(yield* this.evalExpr(node.cond, env)));
        return;
      }
      case "For": {
        const loopEnv = new Scope(env);
        if (node.init) yield* this.execStmt(node.init, loopEnv);
        while (node.cond ? truthy(yield* this.evalExpr(node.cond, loopEnv)) : true) {
          try { yield* this.execStmt(node.body, loopEnv); } catch (e) { if (e instanceof BreakSignal) break; if (e instanceof ContinueSignal) {} else throw e; }
          if (node.update) yield* this.evalExpr(node.update, loopEnv);
          yield { kind: "tick" };
        }
        return;
      }
      case "Return":
        throw new ReturnSignal(node.arg ? yield* this.evalExpr(node.arg, env) : undefined);
      case "Break":
        throw new BreakSignal();
      case "Continue":
        throw new ContinueSignal();
      case "Empty":
        return;
      default:
        return;
    }
  }

  private *execVarDecl(node: Node, env: Scope): Generator<SimYield, void> {
    const isObjType = /Servo|LiquidCrystal|SSD1306|Stepper|NeoPixel/.test(node.declType);
    for (const d of node.decls) {
      if (isObjType) {
        const args: any[] = [];
        for (const a of d.ctorArgs ?? []) args.push(yield* this.evalExpr(a, env));
        env.define(d.name, this.makeObject(node.declType, args));
        continue;
      }
      if (d.isArray) {
        let arr: any[] = [];
        if (d.init?.type === "ArrayLit") {
          for (const el of d.init.elements) arr.push(yield* this.evalExpr(el, env));
        } else if (d.arraySize) {
          const size = yield* this.evalExpr(d.arraySize, env);
          arr = new Array(Number(size) || 0).fill(0);
        }
        env.define(d.name, arr);
        continue;
      }
      const val = d.init ? yield* this.evalExpr(d.init, env) : 0;
      env.define(d.name, val);
    }
  }

  // -------------------- expressions --------------------
  private *evalExpr(node: Node, env: Scope): Generator<SimYield, any> {
    switch (node.type) {
      case "Num": return node.value;
      case "Str": return node.value;
      case "Char": return node.value.charCodeAt(0);
      case "Bool": return node.value;
      case "Ident": {
        if (!env.has(node.name)) return 0;
        return env.get(node.name);
      }
      case "ArrayLit": {
        const arr: any[] = [];
        for (const el of node.elements) arr.push(yield* this.evalExpr(el, env));
        return arr;
      }
      case "Cast": return yield* this.evalExpr(node.arg, env);
      case "Assign": return yield* this.evalAssign(node, env);
      case "Binary": {
        const l = yield* this.evalExpr(node.left, env);
        const r = yield* this.evalExpr(node.right, env);
        return binop(node.op, l, r);
      }
      case "Logical": {
        const l = yield* this.evalExpr(node.left, env);
        if (node.op === "&&") return truthy(l) ? truthy(yield* this.evalExpr(node.right, env)) : false;
        return truthy(l) ? true : truthy(yield* this.evalExpr(node.right, env));
      }
      case "Unary": {
        const v = yield* this.evalExpr(node.arg, env);
        if (node.op === "!") return !truthy(v);
        if (node.op === "-") return -v;
        if (node.op === "+") return +v;
        if (node.op === "~") return ~v;
        return v;
      }
      case "Update": return yield* this.evalUpdate(node, env);
      case "Ternary":
        return truthy(yield* this.evalExpr(node.cond, env))
          ? yield* this.evalExpr(node.then, env)
          : yield* this.evalExpr(node.else, env);
      case "Index": {
        const obj = yield* this.evalExpr(node.obj, env);
        const idx = yield* this.evalExpr(node.index, env);
        return Array.isArray(obj) || typeof obj === "string" ? obj[idx] ?? 0 : 0;
      }
      case "Member": {
        const obj = yield* this.evalExpr(node.obj, env);
        if (typeof obj === "string" && node.prop === "length") return obj.length;
        return obj?.[node.prop] ?? 0;
      }
      case "Call": return yield* this.evalCall(node, env);
      default: return 0;
    }
  }

  private *evalAssign(node: Node, env: Scope): Generator<SimYield, any> {
    const value = yield* this.evalExpr(node.value, env);
    const t = node.target;
    const apply = (cur: any) => (node.op === "=" ? value : binop(node.op.slice(0, -1), cur, value));
    if (t.type === "Ident") {
      const nv = apply(env.has(t.name) ? env.get(t.name) : 0);
      env.set(t.name, nv);
      return nv;
    }
    if (t.type === "Index") {
      const obj = yield* this.evalExpr(t.obj, env);
      const idx = yield* this.evalExpr(t.index, env);
      const nv = apply(obj?.[idx] ?? 0);
      if (obj) obj[idx] = nv;
      return nv;
    }
    return value;
  }

  private *evalUpdate(node: Node, env: Scope): Generator<SimYield, any> {
    const t = node.arg;
    const delta = node.op === "++" ? 1 : -1;
    if (t.type === "Ident") {
      const cur = env.has(t.name) ? env.get(t.name) : 0;
      env.set(t.name, cur + delta);
      return node.prefix ? cur + delta : cur;
    }
    if (t.type === "Index") {
      const obj = yield* this.evalExpr(t.obj, env);
      const idx = yield* this.evalExpr(t.index, env);
      const cur = obj?.[idx] ?? 0;
      if (obj) obj[idx] = cur + delta;
      return node.prefix ? cur + delta : cur;
    }
    return 0;
  }

  private *evalCall(node: Node, env: Scope): Generator<SimYield, any> {
    const args: any[] = [];
    // member method call
    if (node.callee.type === "Member") {
      const obj = yield* this.evalExpr(node.callee.obj, env);
      for (const a of node.args) args.push(yield* this.evalExpr(a, env));
      const m = node.callee.prop;
      if (obj && typeof obj[m] === "function") return obj[m](...args);
      if (typeof obj === "string") return stringMethod(obj, m, args);
      return 0;
    }
    const name = node.callee.type === "Ident" ? node.callee.name : "";
    // yielding builtins
    if (name === "delay") {
      const ms = Number(yield* this.evalExpr(node.args[0], env)) || 0;
      this.machine.advance(ms);
      yield { kind: "wait", ms };
      return 0;
    }
    for (const a of node.args) args.push(yield* this.evalExpr(a, env));
    if (name === "delayMicroseconds") { this.machine.advance((Number(args[0]) || 0) / 1000); return 0; }
    if (name === "yield") { yield { kind: "tick" }; return 0; }
    if (this.functions.has(name)) return yield* this.callUser(name, args);
    const b = this.builtin(name);
    if (b) return b(args);
    return 0;
  }

  private *callUser(name: string, args: any[]): Generator<SimYield, any> {
    const fn = this.functions.get(name)!;
    const scope = new Scope(this.globals);
    fn.params.forEach((p: any, i: number) => scope.define(p.name, args[i]));
    try {
      yield* this.execStmt(fn.body, scope);
    } catch (e) {
      if (e instanceof ReturnSignal) return e.value;
      throw e;
    }
    return 0;
  }

  // -------------------- builtins & objects --------------------
  private pinLabel(v: any): string {
    if (typeof v === "string") return v;
    return String(Math.trunc(Number(v)));
  }

  private builtin(name: string): ((args: any[]) => any) | null {
    const m = this.machine;
    const pl = (v: any) => this.pinLabel(v);
    const map: Record<string, (a: any[]) => any> = {
      pinMode: (a) => { m.pinMode(pl(a[0]), a[1] === 2 ? "input_pullup" : a[1] === 1 ? "output" : "input"); return 0; },
      digitalWrite: (a) => { m.digitalWrite(pl(a[0]), a[1]); return 0; },
      digitalRead: (a) => m.digitalRead(pl(a[0])),
      analogRead: (a) => m.analogRead(pl(a[0])),
      analogWrite: (a) => { m.analogWrite(pl(a[0]), a[1]); return 0; },
      tone: (a) => { m.tone(pl(a[0]), a[1]); return 0; },
      noTone: (a) => { m.noTone(pl(a[0])); return 0; },
      pulseIn: (a) => m.pulseIn(pl(a[0])),
      millis: () => m.millis(),
      micros: () => m.micros(),
      map: (a) => Math.round(((a[0] - a[1]) * (a[4] - a[3])) / (a[2] - a[1] || 1) + a[3]),
      constrain: (a) => Math.max(a[1], Math.min(a[2], a[0])),
      min: (a) => Math.min(a[0], a[1]),
      max: (a) => Math.max(a[0], a[1]),
      abs: (a) => Math.abs(a[0]),
      sqrt: (a) => Math.sqrt(a[0]),
      sq: (a) => a[0] * a[0],
      pow: (a) => Math.pow(a[0], a[1]),
      sin: (a) => Math.sin(a[0]), cos: (a) => Math.cos(a[0]), tan: (a) => Math.tan(a[0]),
      floor: (a) => Math.floor(a[0]), ceil: (a) => Math.ceil(a[0]), round: (a) => Math.round(a[0]),
      random: (a) => (a.length >= 2 ? Math.floor(a[0] + Math.random() * (a[1] - a[0])) : Math.floor(Math.random() * (a[0] ?? 2147483647))),
      randomSeed: () => 0,
      bitRead: (a) => (Number(a[0]) >> Number(a[1])) & 1,
      bitWrite: () => 0,
      bitSet: (a) => Number(a[0]) | (1 << Number(a[1])),
      constrainf: (a) => Math.max(a[1], Math.min(a[2], a[0])),
      analogReadResolution: () => 0,
      attachInterrupt: () => 0, detachInterrupt: () => 0, interrupts: () => 0, noInterrupts: () => 0,
    };
    return map[name] ?? null;
  }

  private makeSerial() {
    const m = this.machine;
    const fmt = (x: any, radix?: number) => {
      if (typeof x === "string") return x;
      if (typeof x === "boolean") return x ? "1" : "0";
      if (typeof radix === "number" && Number.isFinite(radix)) return Math.trunc(x).toString(radix).toUpperCase();
      if (typeof x === "number") return Number.isInteger(x) ? String(x) : x.toFixed(2);
      return String(x);
    };
    return {
      begin: () => 0,
      end: () => 0,
      print: (x: any, r?: number) => { m.serialPrint(fmt(x, r)); return 0; },
      println: (x: any = "", r?: number) => { m.serialPrintln(fmt(x, r)); return 0; },
      write: (x: any) => { m.serialPrint(typeof x === "number" ? String.fromCharCode(x) : String(x)); return 0; },
      available: () => 0,
      read: () => -1,
      flush: () => 0,
    };
  }

  private makeObject(declType: string, args: any[]) {
    const m = this.machine;
    const pl = (v: any) => this.pinLabel(v);
    if (declType.includes("Servo")) {
      const self: any = {
        pin: args[0] !== undefined ? pl(args[0]) : "9",
        angle: 0,
        attach: (p: any) => { self.pin = pl(p); return 0; },
        write: (a: any) => { self.angle = Number(a) || 0; m.servoWrite(self.pin, self.angle); return 0; },
        writeMicroseconds: (us: any) => { self.angle = Math.round(((us - 1000) / 1000) * 180); m.servoWrite(self.pin, self.angle); return 0; },
        read: () => self.angle,
        attached: () => 1,
        detach: () => 0,
      };
      return self;
    }
    if (declType.includes("LiquidCrystal") || declType.includes("SSD1306")) {
      const cols = declType.includes("LiquidCrystal_I2C") ? Number(args[1]) || 16 : 16;
      const rows = declType.includes("LiquidCrystal_I2C") ? Number(args[2]) || 2 : 2;
      const self: any = {
        cols, rows, cx: 0, cy: 0, lines: ["", ""],
        begin: () => 0, init: () => 0, backlight: () => 0, noBacklight: () => 0, clear: () => { self.lines = ["", ""]; self.cx = 0; self.cy = 0; return 0; },
        home: () => { self.cx = 0; self.cy = 0; return 0; },
        setCursor: (c: any, r: any) => { self.cx = Number(c) || 0; self.cy = Number(r) || 0; return 0; },
        display: () => 0, clearDisplay: () => { self.lines = ["", ""]; return 0; }, setTextSize: () => 0, setTextColor: () => 0,
        print: (x: any) => { const s = String(x); const ln = self.lines[self.cy] ?? ""; self.lines[self.cy] = (ln.slice(0, self.cx) + s).slice(0, self.cols); self.cx += s.length; return 0; },
        println: (x: any = "") => { self.print(String(x)); self.cy = Math.min(self.rows - 1, self.cy + 1); self.cx = 0; return 0; },
        write: (x: any) => self.print(typeof x === "number" ? String.fromCharCode(x) : x),
      };
      this.machine.displays.push(self);
      return self;
    }
    if (declType.includes("NeoPixel")) {
      const n = Number(args[0]) || 1;
      const self: any = {
        pixels: Array.from({ length: n }, () => ({ r: 0, g: 0, b: 0 })),
        brightness: 255,
        begin: () => 0,
        show: () => 0,
        clear: () => { self.pixels.forEach((p: any) => { p.r = 0; p.g = 0; p.b = 0; }); return 0; },
        numPixels: () => n,
        setBrightness: (b: any) => { self.brightness = Number(b) || 255; return 0; },
        Color: (r: any, g: any, b: any) => ((Number(r) & 255) << 16) | ((Number(g) & 255) << 8) | (Number(b) & 255),
        setPixelColor: (...a: any[]) => {
          const i = Number(a[0]) || 0;
          if (!self.pixels[i]) return 0;
          if (a.length >= 4) { self.pixels[i] = { r: Number(a[1]) & 255, g: Number(a[2]) & 255, b: Number(a[3]) & 255 }; }
          else { const c = Number(a[1]) || 0; self.pixels[i] = { r: (c >> 16) & 255, g: (c >> 8) & 255, b: c & 255 }; }
          return 0;
        },
        getPixelColor: (i: any) => { const p = self.pixels[Number(i)] || { r: 0, g: 0, b: 0 }; return (p.r << 16) | (p.g << 8) | p.b; },
      };
      this.machine.neopixels.push(self);
      return self;
    }
    return { begin: () => 0, write: () => 0, read: () => 0, step: () => 0, setSpeed: () => 0 };
  }
}

function truthy(v: any): boolean {
  if (typeof v === "number") return v !== 0;
  return !!v;
}

function binop(op: string, l: any, r: any): any {
  switch (op) {
    case "+": return typeof l === "string" || typeof r === "string" ? `${l}${r}` : l + r;
    case "-": return l - r;
    case "*": return l * r;
    case "/": return r === 0 ? 0 : (Number.isInteger(l) && Number.isInteger(r) ? Math.trunc(l / r) : l / r);
    case "%": return r === 0 ? 0 : l % r;
    case "==": return l == r;
    case "!=": return l != r;
    case "<": return l < r;
    case ">": return l > r;
    case "<=": return l <= r;
    case ">=": return l >= r;
    case "&": return l & r;
    case "|": return l | r;
    case "^": return l ^ r;
    case "<<": return l << r;
    case ">>": return l >> r;
    default: return 0;
  }
}

function stringMethod(s: string, m: string, args: any[]): any {
  switch (m) {
    case "length": return s.length;
    case "charAt": return s.charAt(args[0]);
    case "substring": return s.substring(args[0], args[1]);
    case "indexOf": return s.indexOf(args[0]);
    case "toInt": return parseInt(s, 10) || 0;
    case "toFloat": return parseFloat(s) || 0;
    case "toUpperCase": return s.toUpperCase();
    case "toLowerCase": return s.toLowerCase();
    case "equals": return s === args[0];
    case "trim": return s.trim();
    default: return 0;
  }
}
