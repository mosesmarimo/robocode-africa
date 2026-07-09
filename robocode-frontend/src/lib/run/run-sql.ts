import type { Database, SqlJsStatic, SqlValue } from "sql.js";
import { type RunOutcome, capOutput } from "./types";

// sql.js's JS glue (sql-wasm.js) has a Node-only fallback code path
// (`require("fs")` / `require("path")`, dead at runtime in a browser, used
// only when sql.js runs under Node) that trips up Next's bundler if the
// package is `import`ed normally — it tries to statically resolve those
// requires for the client bundle and fails ("Module not found: Can't
// resolve 'fs'"). So, like the Pyodide worker's `importScripts`, sql.js is
// self-hosted and loaded at runtime via a plain <script> tag instead of a
// static import; only its *types* are imported above (erased at compile
// time, never bundled). It's read off `window` through a local cast rather
// than a `declare global` augmentation because @types/sql.js already
// ambiently declares a UMD-global `initSqlJs` (unconditionally defined,
// for the "always loaded via <script>" world) — augmenting Window's type
// for the same name would merge with that and make TS believe it's always
// present, defeating the not-loaded-yet check below.
type InitSqlJsFn = (config?: { locateFile?: (file: string) => string }) => Promise<SqlJsStatic>;

function getInitSqlJs(): InitSqlJsFn | undefined {
  return (window as unknown as { initSqlJs?: InitSqlJsFn }).initSqlJs;
}

let scriptPromise: Promise<void> | null = null;

function loadSqlJsScript(): Promise<void> {
  if (!scriptPromise) {
    scriptPromise = new Promise<void>((resolve, reject) => {
      if (getInitSqlJs()) {
        resolve();
        return;
      }
      const script = document.createElement("script");
      script.src = "/sandbox/sql-wasm.js";
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load the SQL runtime."));
      document.head.appendChild(script);
    });
  }
  return scriptPromise;
}

// sql.js is synchronous WebAssembly SQLite running on the main thread — no
// worker is needed (it's fast enough not to need one, and a synchronous
// wasm call can't be interrupted by a worker.terminate() anyway once it's
// running). That means a single pathological statement (e.g. an unbounded
// `WITH RECURSIVE` CTE) genuinely can hang the tab; there is no timer that
// can save us from that once SQLite is mid-query. What we *can* guard
// cheaply is a runaway program shape — hundreds of statements pasted into
// one run — so we cap the statement count as a sanity check rather than
// pretending we have real wall-clock protection here.
const MAX_STATEMENTS = 200;

// Lazily initialized once per tab and cached — reinitializing the wasm
// module on every run would be wasteful since sql.js has no per-run state
// to reset (each run gets its own fresh in-memory Database instead).
let sqlPromise: Promise<SqlJsStatic> | null = null;

function getSql(): Promise<SqlJsStatic> {
  if (!sqlPromise) {
    sqlPromise = loadSqlJsScript().then(() => {
      const initSqlJs = getInitSqlJs();
      if (!initSqlJs) throw new Error("SQL runtime failed to initialize.");
      return initSqlJs({ locateFile: () => "/sandbox/sql-wasm.wasm" });
    });
  }
  return sqlPromise;
}

function cellText(v: SqlValue): string {
  if (v === null || v === undefined) return "NULL";
  if (v instanceof Uint8Array) return `<blob ${v.length}b>`;
  return String(v);
}

/** Renders one statement's result set as an aligned, padded text table. */
function formatResultTable(columns: string[], rows: SqlValue[][]): string {
  const cells = rows.map((row) => row.map(cellText));
  const widths = columns.map((col, i) =>
    Math.max(col.length, ...cells.map((row) => row[i]?.length ?? 0), 1),
  );
  const renderRow = (vals: string[]) => vals.map((v, i) => v.padEnd(widths[i])).join(" | ");
  const rule = widths.map((w) => "-".repeat(w)).join("-+-");
  const lines = [renderRow(columns), rule, ...cells.map(renderRow)];
  if (rows.length === 0) lines.push("(0 rows)");
  return lines.join("\n");
}

/**
 * Executes `source` as one or more SQL statements against a fresh in-memory
 * SQLite database (sql.js / self-hosted wasm). Every run gets its own
 * `new SQL.Database()` so there's no state leak between runs; the database
 * is always closed in a finally block so a mid-run error can't leak wasm
 * memory. Each row-returning statement's result set is rendered as an
 * aligned text table; SQL errors are captured as output with error:true
 * rather than thrown.
 */
export async function runSql(source: string): Promise<RunOutcome> {
  const start = Date.now();

  let SQL: SqlJsStatic;
  try {
    SQL = await getSql();
  } catch {
    sqlPromise = null; // allow a retry on the next run instead of caching a permanent failure
    return {
      ok: false,
      configured: true,
      output: "",
      error: true,
      engine: "browser",
      text: "SQL runtime unavailable.",
    };
  }

  const db: Database = new SQL.Database();
  const tables: string[] = [];
  let errorOut: string | null = null;

  try {
    let count = 0;
    for (const stmt of db.iterateStatements(source)) {
      count++;
      if (count > MAX_STATEMENTS) {
        stmt.free();
        throw new Error(
          `Refusing to run more than ${MAX_STATEMENTS} statements in one program (safety guard).`,
        );
      }
      const columns = stmt.getColumnNames();
      const rows: SqlValue[][] = [];
      try {
        while (stmt.step()) rows.push(stmt.get());
      } finally {
        stmt.free();
      }
      if (columns.length > 0) tables.push(formatResultTable(columns, rows));
    }
  } catch (err) {
    errorOut = err instanceof Error ? err.message : String(err);
  } finally {
    db.close();
  }

  const output = errorOut ?? (tables.length > 0 ? tables.join("\n\n") : "(no rows returned)");

  return {
    ok: true,
    configured: true,
    output: capOutput(output),
    error: errorOut !== null,
    engine: "browser",
    durationMs: Date.now() - start,
  };
}
