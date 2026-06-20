export type TokKind = "num" | "str" | "char" | "id" | "punct" | "eof";
export interface Token {
  kind: TokKind;
  value: string;
  pos: number;
  line: number;
}

export interface Preprocessed {
  source: string;
  defines: Record<string, string>;
}

// Strip comments, capture simple #define macros, drop other preprocessor lines.
export function preprocess(input: string): Preprocessed {
  const defines: Record<string, string> = {};
  // remove block comments
  let src = input.replace(/\/\*[\s\S]*?\*\//g, " ");
  const lines = src.split("\n").map((line) => {
    // strip line comments (naive; fine for educational code)
    const ci = line.indexOf("//");
    let l = ci >= 0 ? line.slice(0, ci) : line;
    const t = l.trim();
    if (t.startsWith("#")) {
      const m = t.match(/^#define\s+([A-Za-z_]\w*)\s+(.+)$/);
      if (m) defines[m[1]] = m[2].trim();
      return ""; // drop all preprocessor lines from token stream
    }
    return l;
  });
  src = lines.join("\n");
  return { source: src, defines };
}

const MULTI = [
  "<<=", ">>=", "...", "->", "::",
  "++", "--", "+=", "-=", "*=", "/=", "%=", "==", "!=", "<=", ">=", "&&", "||",
  "<<", ">>", "&=", "|=", "^=",
];

export function tokenize(source: string): Token[] {
  const toks: Token[] = [];
  let i = 0;
  let line = 1;
  const n = source.length;
  const isIdStart = (c: string) => /[A-Za-z_]/.test(c);
  const isId = (c: string) => /[A-Za-z0-9_]/.test(c);
  const isDigit = (c: string) => /[0-9]/.test(c);

  while (i < n) {
    const c = source[i];
    if (c === "\n") { line++; i++; continue; }
    if (/\s/.test(c)) { i++; continue; }

    // number (int, float, hex)
    if (isDigit(c) || (c === "." && isDigit(source[i + 1]))) {
      let j = i;
      if (c === "0" && (source[i + 1] === "x" || source[i + 1] === "X")) {
        j += 2;
        while (j < n && /[0-9a-fA-F]/.test(source[j])) j++;
      } else {
        while (j < n && /[0-9.]/.test(source[j])) j++;
        // exponent / suffixes
        while (j < n && /[eEfFlLuU]/.test(source[j]) && /[0-9.eEfFlLuU+-]/.test(source[j])) {
          if ((source[j] === "e" || source[j] === "E") && (source[j + 1] === "+" || source[j + 1] === "-")) j++;
          j++;
        }
      }
      toks.push({ kind: "num", value: source.slice(i, j), pos: i, line });
      i = j;
      continue;
    }

    // identifier / keyword
    if (isIdStart(c)) {
      let j = i + 1;
      while (j < n && isId(source[j])) j++;
      toks.push({ kind: "id", value: source.slice(i, j), pos: i, line });
      i = j;
      continue;
    }

    // string
    if (c === '"') {
      let j = i + 1;
      let val = "";
      while (j < n && source[j] !== '"') {
        if (source[j] === "\\") { val += unescape(source[j + 1]); j += 2; }
        else { val += source[j]; j++; }
      }
      toks.push({ kind: "str", value: val, pos: i, line });
      i = j + 1;
      continue;
    }

    // char literal
    if (c === "'") {
      let j = i + 1;
      let val = "";
      if (source[j] === "\\") { val = unescape(source[j + 1]); j += 2; }
      else { val = source[j]; j++; }
      toks.push({ kind: "char", value: val, pos: i, line });
      i = j + 1; // skip closing '
      continue;
    }

    // multi-char operators
    const three = source.slice(i, i + 3);
    const two = source.slice(i, i + 2);
    const m3 = MULTI.find((m) => m.length === 3 && m === three);
    const m2 = MULTI.find((m) => m.length === 2 && m === two);
    if (m3) { toks.push({ kind: "punct", value: m3, pos: i, line }); i += 3; continue; }
    if (m2) { toks.push({ kind: "punct", value: m2, pos: i, line }); i += 2; continue; }

    toks.push({ kind: "punct", value: c, pos: i, line });
    i++;
  }
  toks.push({ kind: "eof", value: "", pos: i, line });
  return toks;
}

function unescape(c: string): string {
  switch (c) {
    case "n": return "\n";
    case "t": return "\t";
    case "r": return "\r";
    case "0": return "\0";
    case "\\": return "\\";
    case "'": return "'";
    case '"': return '"';
    default: return c ?? "";
  }
}
