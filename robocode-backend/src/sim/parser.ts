import { tokenize, preprocess, type Token } from "./lexer";

/* eslint-disable @typescript-eslint/no-explicit-any */
export type Node = any;

export class ParseError extends Error {
  line: number;
  constructor(msg: string, line: number) {
    super(msg);
    this.line = line;
  }
}

const TYPE_KEYWORDS = new Set([
  "void", "int", "long", "short", "char", "byte", "bool", "boolean", "float", "double", "word",
  "unsigned", "signed", "const", "static", "volatile", "String",
  "uint8_t", "int8_t", "uint16_t", "int16_t", "uint32_t", "int32_t", "size_t",
]);
const CLASS_TYPES = new Set([
  "Servo", "LiquidCrystal", "LiquidCrystal_I2C", "Adafruit_SSD1306", "Stepper", "SoftwareSerial",
  "Adafruit_NeoPixel",
]);

const ASSIGN_OPS = new Set(["=", "+=", "-=", "*=", "/=", "%=", "&=", "|=", "^=", "<<=", ">>="]);

export function parse(code: string): Node {
  const toks = tokenize(preprocess(code).source);
  let p = 0;

  const peek = (o = 0) => toks[p + o];
  const at = (v: string) => peek().value === v && peek().kind === "punct";
  const atId = (v: string) => peek().kind === "id" && peek().value === v;
  const next = () => toks[p++];
  const eat = (v: string) => {
    if (!at(v)) throw new ParseError(`Expected '${v}' but found '${peek().value || "end of file"}'`, peek().line);
    return next();
  };
  const isType = (t: Token) => t.kind === "id" && (TYPE_KEYWORDS.has(t.value) || CLASS_TYPES.has(t.value));

  function looksLikeDecl(): boolean {
    const t = peek();
    if (t.kind !== "id") return false;
    if (TYPE_KEYWORDS.has(t.value) || CLASS_TYPES.has(t.value)) return true;
    // pattern: IDENT IDENT  (user type + name)
    return peek(1).kind === "id";
  }

  function parseTypeTokens(): string {
    const parts: string[] = [];
    while (isType(peek())) parts.push(next().value);
    // could be a user/class type single token
    if (parts.length === 0 && peek().kind === "id") parts.push(next().value);
    // pointer/ref markers
    while (at("*") || at("&")) next();
    return parts.join(" ");
  }

  function parseProgram(): Node {
    const body: Node[] = [];
    while (peek().kind !== "eof") {
      body.push(parseTopLevel());
    }
    return { type: "Program", body };
  }

  function afterMatchingParenIsBrace(): boolean {
    // assumes peek() is "("; scan to matching ")" and check if a "{" follows (=> function)
    let depth = 0;
    for (let q = p; q < toks.length; q++) {
      const v = toks[q];
      if (v.kind !== "punct") continue;
      if (v.value === "(") depth++;
      else if (v.value === ")") {
        depth--;
        if (depth === 0) return toks[q + 1]?.kind === "punct" && toks[q + 1]?.value === "{";
      }
    }
    return false;
  }

  function parseTopLevel(): Node {
    // function or global var
    const start = p;
    parseTypeTokens();
    const name = next();
    if (name.kind !== "id") throw new ParseError(`Expected a name after type`, name.line);
    if (at("(") && afterMatchingParenIsBrace()) {
      const params = parseParams();
      const bodyBlock = parseBlock();
      return { type: "FuncDecl", name: name.value, params, body: bodyBlock };
    }
    // variable declaration (incl. constructor-style: Type name(args);)
    p = start;
    return parseVarDecl();
  }

  function parseParams(): { name: string }[] {
    eat("(");
    const params: { name: string }[] = [];
    if (!at(")")) {
      do {
        parseTypeTokens();
        const id = peek().kind === "id" ? next().value : "_";
        // arrays in params
        while (at("[")) { next(); while (!at("]")) next(); eat("]"); }
        params.push({ name: id });
      } while (at(",") && next());
    }
    eat(")");
    return params;
  }

  function parseVarDecl(): Node {
    const declType = parseTypeTokens();
    const decls: any[] = [];
    do {
      const id = next();
      if (id.kind !== "id") throw new ParseError("Expected variable name", id.line);
      const d: any = { name: id.value };
      if (at("[")) {
        next();
        d.isArray = true;
        if (!at("]")) d.arraySize = parseExpr();
        eat("]");
      }
      if (at("(")) {
        // constructor args: Servo s(9);
        d.ctorArgs = parseArgs();
      } else if (at("=")) {
        next();
        d.init = at("{") ? parseArrayLiteral() : parseAssign();
      }
      decls.push(d);
    } while (at(",") && next());
    eat(";");
    return { type: "VarDecl", declType, decls };
  }

  function parseArrayLiteral(): Node {
    eat("{");
    const elements: Node[] = [];
    if (!at("}")) {
      do {
        if (at("}")) break;
        elements.push(at("{") ? parseArrayLiteral() : parseAssign());
      } while (at(",") && next());
    }
    eat("}");
    return { type: "ArrayLit", elements };
  }

  function parseBlock(): Node {
    eat("{");
    const body: Node[] = [];
    while (!at("}") && peek().kind !== "eof") body.push(parseStmt());
    eat("}");
    return { type: "Block", body };
  }

  function parseStmt(): Node {
    if (at("{")) return parseBlock();
    if (at(";")) { next(); return { type: "Empty" }; }
    if (atId("if")) return parseIf();
    if (atId("for")) return parseFor();
    if (atId("while")) return parseWhile();
    if (atId("do")) return parseDoWhile();
    if (atId("return")) {
      next();
      const arg = at(";") ? undefined : parseExpr();
      eat(";");
      return { type: "Return", arg };
    }
    if (atId("break")) { next(); eat(";"); return { type: "Break" }; }
    if (atId("continue")) { next(); eat(";"); return { type: "Continue" }; }
    if (looksLikeDecl()) return parseVarDecl();
    const expr = parseExpr();
    eat(";");
    return { type: "ExprStmt", expr };
  }

  function parseIf(): Node {
    next(); eat("(");
    const cond = parseExpr();
    eat(")");
    const then = parseStmt();
    let alt;
    if (atId("else")) { next(); alt = parseStmt(); }
    return { type: "If", cond, then, else: alt };
  }
  function parseFor(): Node {
    next(); eat("(");
    let init;
    if (at(";")) next();
    else if (looksLikeDecl()) init = parseVarDecl();
    else { init = { type: "ExprStmt", expr: parseExpr() }; eat(";"); }
    const cond = at(";") ? undefined : parseExpr();
    eat(";");
    const update = at(")") ? undefined : parseExpr();
    eat(")");
    const body = parseStmt();
    return { type: "For", init, cond, update, body };
  }
  function parseWhile(): Node {
    next(); eat("(");
    const cond = parseExpr();
    eat(")");
    return { type: "While", cond, body: parseStmt() };
  }
  function parseDoWhile(): Node {
    next();
    const body = parseStmt();
    if (!atId("while")) throw new ParseError("Expected 'while' after 'do'", peek().line);
    next(); eat("(");
    const cond = parseExpr();
    eat(")"); eat(";");
    return { type: "DoWhile", body, cond };
  }

  // ---- expressions ----
  function parseExpr(): Node {
    return parseAssign();
  }
  function parseAssign(): Node {
    const left = parseTernary();
    if (peek().kind === "punct" && ASSIGN_OPS.has(peek().value)) {
      const op = next().value;
      const value = parseAssign();
      return { type: "Assign", op, target: left, value };
    }
    return left;
  }
  function parseTernary(): Node {
    const cond = parseBinary(0);
    if (at("?")) {
      next();
      const then = parseAssign();
      eat(":");
      const alt = parseAssign();
      return { type: "Ternary", cond, then, else: alt };
    }
    return cond;
  }

  const BINOPS: Record<string, number> = {
    "||": 1, "&&": 2, "|": 3, "^": 4, "&": 5,
    "==": 6, "!=": 6, "<": 7, ">": 7, "<=": 7, ">=": 7,
    "<<": 8, ">>": 8, "+": 9, "-": 9, "*": 10, "/": 10, "%": 10,
  };
  function parseBinary(minBp: number): Node {
    let left = parseUnary();
    for (;;) {
      const t = peek();
      if (t.kind !== "punct") break;
      const bp = BINOPS[t.value];
      if (bp === undefined || bp < minBp) break;
      next();
      const right = parseBinary(bp + 1);
      const kind = t.value === "&&" || t.value === "||" ? "Logical" : "Binary";
      left = { type: kind, op: t.value, left, right };
    }
    return left;
  }
  function parseUnary(): Node {
    const t = peek();
    if (t.kind === "punct" && ["!", "~", "-", "+"].includes(t.value)) {
      next();
      return { type: "Unary", op: t.value, arg: parseUnary() };
    }
    if (t.kind === "punct" && (t.value === "++" || t.value === "--")) {
      next();
      return { type: "Update", op: t.value, arg: parseUnary(), prefix: true };
    }
    // cast: (type) expr
    if (at("(") && isType(peek(1))) {
      const save = p;
      next();
      parseTypeTokens();
      if (at(")")) { next(); return { type: "Cast", arg: parseUnary() }; }
      p = save;
    }
    return parsePostfix();
  }
  function parsePostfix(): Node {
    let node = parsePrimary();
    for (;;) {
      if (at("(")) {
        node = { type: "Call", callee: node, args: parseArgs() };
      } else if (at("[")) {
        next();
        const index = parseExpr();
        eat("]");
        node = { type: "Index", obj: node, index };
      } else if (at(".") || at("->")) {
        next();
        const prop = next();
        node = { type: "Member", obj: node, prop: prop.value };
      } else if (at("++") || at("--")) {
        const op = next().value;
        node = { type: "Update", op, arg: node, prefix: false };
      } else break;
    }
    return node;
  }
  function parseArgs(): Node[] {
    eat("(");
    const args: Node[] = [];
    if (!at(")")) {
      do {
        args.push(parseAssign());
      } while (at(",") && next());
    }
    eat(")");
    return args;
  }
  function parsePrimary(): Node {
    const t = peek();
    if (at("(")) { next(); const e = parseExpr(); eat(")"); return e; }
    if (t.kind === "num") { next(); return { type: "Num", value: parseNum(t.value) }; }
    if (t.kind === "str") { next(); return { type: "Str", value: t.value }; }
    if (t.kind === "char") { next(); return { type: "Char", value: t.value }; }
    if (t.kind === "id") {
      next();
      if (t.value === "true") return { type: "Bool", value: true };
      if (t.value === "false") return { type: "Bool", value: false };
      return { type: "Ident", name: t.value };
    }
    throw new ParseError(`Unexpected '${t.value || "end of file"}'`, t.line);
  }

  return parseProgram();
}

function parseNum(s: string): number {
  if (/^0x/i.test(s)) return parseInt(s, 16);
  return parseFloat(s.replace(/[uUlLfF]+$/, ""));
}
