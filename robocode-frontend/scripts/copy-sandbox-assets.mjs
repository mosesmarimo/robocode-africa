#!/usr/bin/env node
// Copies the self-hosted Python (Pyodide) and SQL (sql.js) WASM runtime
// assets from node_modules into public/sandbox/ so the browser code engines
// (src/lib/run/run-python.ts, run-sql.ts) can load them same-origin — no
// third-party CDN dependency, and it keeps working offline once cached.
// Wired to run before both `dev` and `build` (see package.json) so the
// copied files always match the pinned `pyodide` / `sql.js` versions in
// package.json. See public/sandbox/README.md for the full asset list.
//
// Paths are derived from this script's own location (not process.cwd()) so
// it works the same whether it's invoked via `pnpm build`, a CI job, or
// directly with `node scripts/copy-sandbox-assets.mjs` from any directory.
import { existsSync, mkdirSync, copyFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = join(SCRIPT_DIR, "..");
const NODE_MODULES = join(ROOT, "node_modules");
const SANDBOX_DIR = join(ROOT, "public", "sandbox");
const PYODIDE_DIR = join(SANDBOX_DIR, "pyodide");

function copy(srcDir, destDir, files) {
  mkdirSync(destDir, { recursive: true });
  for (const file of files) {
    const src = join(srcDir, file);
    if (!existsSync(src)) {
      throw new Error(
        `copy-sandbox-assets: missing expected source file "${src}". ` +
          `Did the pyodide/sql.js package version change its shipped file names?`,
      );
    }
    copyFileSync(src, join(destDir, file));
    console.log(`copy-sandbox-assets: ${file} -> ${destDir}`);
  }
}

// Pyodide: core interpreter runtime. pyodide.js is the classic
// (importScripts-able) UMD loader used by the Web Worker in run-python.ts;
// it dynamically fetches the other three files relative to `indexURL` at
// runtime. No extra package wheels are copied because the v1 Python engine
// only runs core-stdlib code (no numpy/pandas/etc.) — if that changes, add
// the relevant .whl file(s) here too, and re-check pyodide-lock.json for
// what else they depend on.
copy(join(NODE_MODULES, "pyodide"), PYODIDE_DIR, [
  "pyodide.js",
  "pyodide.asm.js",
  "pyodide.asm.wasm",
  "python_stdlib.zip",
  "pyodide-lock.json",
]);

// sql.js: both the JS glue and the wasm binary are self-hosted and loaded
// at runtime via a plain <script> tag (run-sql.ts), not a bundled `import`.
// sql-wasm.js has a Node-only code path (`require("fs")`/`require("path")`,
// dead at runtime in a browser) that trips up Next's bundler if it's
// statically imported — see the README for details.
copy(join(NODE_MODULES, "sql.js", "dist"), SANDBOX_DIR, ["sql-wasm.js", "sql-wasm.wasm"]);

console.log("copy-sandbox-assets: done.");
