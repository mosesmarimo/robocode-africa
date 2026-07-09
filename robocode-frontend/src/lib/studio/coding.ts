// Coding Studio languages + multi-file helpers.

export type CodeLang =
  | "python"
  | "javascript"
  | "html"
  | "css"
  | "typescript"
  | "go"
  | "rust"
  | "cpp"
  | "csharp"
  | "sql";

export interface CodeFile {
  name: string;
  content: string;
}

export interface CodeLanguage {
  id: CodeLang;
  label: string;
  ext: string;
  /** true = render in an iframe (HTML/CSS); false = AI executes and returns stdout. */
  render: boolean;
  /** initial file set for a fresh project in this language (entry first). */
  starter: CodeFile[];
}

export const CODE_LANGUAGES: CodeLanguage[] = [
  { id: "python", label: "Python", ext: "py", render: false, starter: [{ name: "main.py", content: `print("Hello World!!!")\n` }] },
  { id: "javascript", label: "JavaScript", ext: "js", render: false, starter: [{ name: "main.js", content: `console.log("Hello World!!!");\n` }] },
  {
    id: "html",
    label: "HTML",
    ext: "html",
    render: true,
    starter: [
      { name: "index.html", content: `<!DOCTYPE html>\n<html>\n  <head>\n    <link rel="stylesheet" href="style.css" />\n  </head>\n  <body>\n    <h1>Hello World!!!</h1>\n    <p>Welcome to the RoboCode Coding Studio.</p>\n    <script src="script.js"></script>\n  </body>\n</html>\n` },
      { name: "style.css", content: `body { font-family: system-ui, sans-serif; margin: 2rem; }\nh1 { color: #11315c; }\n` },
      { name: "script.js", content: `console.log("Page loaded");\n` },
    ],
  },
  {
    id: "css",
    label: "CSS",
    ext: "css",
    render: true,
    starter: [
      { name: "index.html", content: `<!DOCTYPE html>\n<html>\n  <head><link rel="stylesheet" href="style.css" /></head>\n  <body>\n    <h1>Hello World!!!</h1>\n    <p>Style this page with CSS.</p>\n  </body>\n</html>\n` },
      { name: "style.css", content: `body {\n  font-family: system-ui, sans-serif;\n  background: #0d1426;\n  color: #5fb73a;\n  display: grid;\n  place-items: center;\n  height: 100vh;\n  margin: 0;\n}\nh1 { font-size: 3rem; }\n` },
    ],
  },
  { id: "typescript", label: "TypeScript", ext: "ts", render: false, starter: [{ name: "main.ts", content: `const greeting: string = "Hello World!!!";\nconsole.log(greeting);\n` }] },
  { id: "go", label: "Go", ext: "go", render: false, starter: [{ name: "main.go", content: `package main\n\nimport "fmt"\n\nfunc main() {\n\tfmt.Println("Hello World!!!")\n}\n` }] },
  { id: "rust", label: "Rust", ext: "rs", render: false, starter: [{ name: "main.rs", content: `fn main() {\n    println!("Hello World!!!");\n}\n` }] },
  { id: "cpp", label: "C/C++", ext: "cpp", render: false, starter: [{ name: "main.cpp", content: `#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello World!!!";\n    return 0;\n}\n` }] },
  { id: "csharp", label: "C#", ext: "cs", render: false, starter: [{ name: "Program.cs", content: `using System;\n\nclass Program {\n    static void Main() {\n        Console.WriteLine("Hello World!!!");\n    }\n}\n` }] },
  { id: "sql", label: "SQL", ext: "sql", render: false, starter: [{ name: "query.sql", content: `SELECT 'Hello World!!!' AS greeting;\n` }] },
];

export const CODE_LANG_MAP: Record<CodeLang, CodeLanguage> = Object.fromEntries(
  CODE_LANGUAGES.map((l) => [l.id, l]),
) as Record<CodeLang, CodeLanguage>;

export const DEFAULT_CODE_LANG: CodeLang = "cpp";

/** Monaco language id from a file name's extension. */
export function monacoForFile(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "py": return "python";
    case "html": case "htm": return "html";
    case "css": return "css";
    case "js": case "mjs": return "javascript";
    case "ts": return "typescript";
    case "tsx": return "typescript";
    case "go": return "go";
    case "rs": return "rust";
    case "c": case "h": case "cc": case "hpp": case "cpp": return "cpp";
    case "cs": return "csharp";
    case "sql": return "sql";
    case "json": return "json";
    case "md": return "markdown";
    default: return "plaintext";
  }
}

/** Infer the language id from a project's file set (by the entry/first file). */
export function langFromFiles(files: CodeFile[]): CodeLang {
  const byExt: Record<string, CodeLang> = {
    py: "python", js: "javascript", mjs: "javascript", html: "html", css: "css",
    ts: "typescript", go: "go", rs: "rust", cpp: "cpp", c: "cpp", h: "cpp", cs: "csharp", sql: "sql",
  };
  for (const f of files) {
    const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
    if (byExt[ext]) return byExt[ext];
  }
  return DEFAULT_CODE_LANG;
}

/** Build the HTML document to render for html/css projects, inlining linked css/js files. */
export function buildPreviewDoc(files: CodeFile[]): string {
  const html = files.find((f) => f.name.toLowerCase().endsWith(".html")) ?? files[0];
  let doc = html?.content ?? "";
  // Inline <link rel="stylesheet" href="x.css">
  doc = doc.replace(/<link[^>]*href=["']([^"']+\.css)["'][^>]*>/gi, (m, href) => {
    const f = files.find((x) => x.name === href || x.name.endsWith("/" + href));
    return f ? `<style>\n${f.content}\n</style>` : m;
  });
  // Inline <script src="x.js">
  doc = doc.replace(/<script[^>]*src=["']([^"']+\.js)["'][^>]*><\/script>/gi, (m, src) => {
    const f = files.find((x) => x.name === src || x.name.endsWith("/" + src));
    return f ? `<script>\n${f.content}\n</script>` : m;
  });
  return doc;
}
