# AI Diagram-Baking Implementation Plan

> For agentic workers: REQUIRED SUB-SKILL superpowers:subagent-driven-development

**Goal:** Ship every Academy robotics code example with an AI-generated, board-correct wiring diagram that renders read-only in the lesson and opens in Studio with the code *and* wiring pre-hydrated on the right board.

**Architecture:** A bake-time `tsx` script reuses the existing `/ai/vibe` generator to produce a `Diagram` per robotics code block, writing a committed `baked-diagrams.json`. At seed time a pure merge stamps the correct board onto robotics code blocks and splices a new `diagram` content block (carrying the baked diagram) after each baked code block. The lesson renderer gains a read-only `DiagramPreview` that reuses the real `wokwi-part` element, and Open-in-Studio is generalized to thread board + an encoded diagram into the Studio `/new` flow.

**Tech Stack:** Next.js (frontend, App Router), NestJS + Prisma + Postgres (backend), `@wokwi/elements`, zustand (Studio store), `tsx` for scripts/seed, TypeScript everywhere, `pnpm` monorepo.

---

## Global Constraints

- Cross-repo: changes land in BOTH `robocode-frontend` and `robocode-backend`.
- Frontend branch is `feature/ai-diagram-baking` (already checked out; the spec is already committed there). A NEW backend branch `feature/ai-diagram-baking` is created in Task 1.
- Bake-time only: NO runtime/on-open AI. The lesson renders a persisted diagram; the AI is called exclusively by the offline bake script.
- Storage is a `diagram` block inside the lesson `body` JSON. NO Prisma migration (the `body` column already holds arbitrary blocks).
- Reuse `POST /ai/vibe` / `AiService.vibeCircuit` unchanged. NO new AI prompt or endpoint. The bake keeps ONLY `result.diagram` and NEVER rewrites the lesson code.
- `DiagramPreview` is read-only and reuses the real `wokwi-part` custom element (no Studio store subscription, no drag/edit).
- Board correctness everywhere: Uno / ESP32 / Pico must be threaded into the diagram block, the plain code block's Open-in-Studio, AND the Studio `/new` hydration.
- A SINGLE shared `BOARD_BY_COURSE_SLUG` module at `robocode-backend/prisma/content/board-map.ts`, imported by both the backend seed merge and the frontend bake script via a monorepo-relative path.
- The bake script is a frontend `tsx` (`robocode-frontend/scripts/bake-diagrams.ts`): it reads backend content via monorepo-relative import (`../../robocode-backend/prisma/content/*`) and calls a locally-running backend `POST /ai/vibe`.
- EXCLUDE Raspberry-Pi Linux/Python examples (`robo-raspberry-pi.ts`, the `python` blocks of `robo-pi-arduino.ts`) — the full Pi is not in Studio's `BOARDS`. They resolve to `null` board → no stamp, no diagram.
- Typecheck-only repos. Gates per task = `pnpm typecheck` (both repos), `npx tsx` smoke scripts, `pnpm build` (frontend), and named manual-browser checks. No unit-test framework is introduced.
- Every commit ends with these trailers:
  ```
  Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01PY3GY5o1gHzvrmVo9HmN6Y
  ```

### Shared types & signatures (must stay identical across all tasks)

```ts
// BakedDiagram — the persisted diagram shape (subset of frontend Diagram, positions filled).
// Declared in BOTH repos (structurally identical, like the existing Block unions).
type BakedDiagram = {
  board: string;
  parts: { id: string; type: string; x: number; y: number; rotation?: number; props?: Record<string, string | number | boolean> }[];
  wires: { id: string; from: string; to: string; color?: string }[];
};

// The `diagram` lesson block (added to both Block unions):
{ type: "diagram"; board: string; language: string; code: string; diagram: BakedDiagram; caption?: string }

// The `code` block gains: board?: string  (frontend LessonBlock + CodeBlock prop)

// open-in-studio.ts (frontend):
function studioHref(language: string, code: string, board?: string, diagram?: BakedDiagram): string
function encodeStudioDiagram(d: BakedDiagram): string          // base64url JSON
function decodeStudioDiagram(param: string, boardId: string): BakedDiagram | null
const ROBOTICS_BOARDS: ReadonlySet<string>                     // {"arduino-uno","esp32","raspberry-pi-pico"}
const STUDIO_DIAGRAM_MAX = 16000

// seed.ts (backend):
function mergeBakedDiagrams(lessonSlug: string, blocks: Block[]): Block[]

// board-map.ts (backend, imported by both):
const BOARD_BY_COURSE_SLUG: Record<string, string | null>
function boardForCourse(slug: string): string | null

// baked-diagrams.json key: `${lessonSlug}:${sha1(code)}`
```

### Reconciliation notes (current code vs. the spec/breakdown)

- The breakdown says `robo-sensors-1|2|3` are course slugs. They are NOT. `robo-sensors-{1,2,3}.ts` export *lesson arrays* composed into a single module `roboSensors` whose `meta.slug` is **`robo-sensors`**. The map is keyed by **course** slug, so the only sensors key is `robo-sensors`.
- `coding-arduino` (`meta.slug: "coding-arduino"`, `track: "coding"`) uses `code("arduino", …)` blocks but is a *coding* course, not robotics. The spec's Unit-B list does NOT include it. It therefore resolves to `null` (no diagram, no board stamp) — its arduino snippets keep today's behavior.
- `ai-foundations` mixes `code("arduino", …)` and `code("python", …)`; `robo-pi-arduino` mixes `code("arduino", …)` and `code("python", …)`. For these, the board is decided **per block by language** (arduino → arduino-uno, python → null).
- `code()` signature is `code(language, src, { filename?, openInStudio? })` and defaults `openInStudio: true`. The bake walks blocks where `openInStudio !== false`.
- `/ai/vibe` requires an **active** authenticated user (`@RequireActive()`); the guard accepts a `Bearer` token. The bake script logs in via `POST /auth/login` (seeded `password123`) and sends the returned `token` — no production auth is weakened.

---

## Task 1 — Shared `diagram` block type + board map (BOTH repos)

**Deliverable:** Both `Block`/`LessonBlock` unions carry a `diagram` member and a `board?` on `code`; a backend `diagram()` helper exists; the single `BOARD_BY_COURSE_SLUG` module exists. Both repos typecheck. (No renderer yet — Task 5.)

### 1.1 — Create the backend branch (backend)

```bash
cd /Users/marimo/Dev/robocode/robocode-backend
git checkout -b feature/ai-diagram-baking
git branch --show-current   # expect: feature/ai-diagram-baking
```

Confirm the frontend is already on its branch:

```bash
cd /Users/marimo/Dev/robocode/robocode-frontend
git branch --show-current   # expect: feature/ai-diagram-baking (already)
```

### 1.2 — Backend `types.ts`: add `BakedDiagram`, the `diagram` block, the `diagram()` helper

File: `robocode-backend/prisma/content/types.ts`

BEFORE (full file):

```ts
// Authoring helpers for rich lesson content. Blocks are plain JSON stored in
// Lesson.body and rendered by the frontend LessonBody component.

export type Block =
  | { type: "markdown"; text: string }
  | { type: "code"; language: string; code: string; filename?: string; openInStudio?: boolean }
  | { type: "mermaid"; chart: string; caption?: string }
  | { type: "svg"; svg: string; caption?: string }
  | { type: "callout"; variant?: "tip" | "info" | "warning"; text: string };

export const md = (text: string): Block => ({ type: "markdown", text });
export const code = (
  language: string,
  src: string,
  opts: { filename?: string; openInStudio?: boolean } = {},
): Block => ({ type: "code", language, code: src, openInStudio: true, ...opts });
export const mermaid = (chart: string, caption?: string): Block => ({ type: "mermaid", chart, caption });
export const svg = (svgStr: string, caption?: string): Block => ({ type: "svg", svg: svgStr, caption });
export const callout = (variant: "tip" | "info" | "warning", text: string): Block => ({ type: "callout", variant, text });

export const body = (...blocks: Block[]) => ({ blocks });

export interface LessonDef {
  title: string;
  slug: string;
  estMinutes: number;
  contentType?: string;
  body: { blocks: Block[] };
}
```

AFTER (full file — only the additions shown by context; keep `CourseModule` below unchanged):

```ts
// Authoring helpers for rich lesson content. Blocks are plain JSON stored in
// Lesson.body and rendered by the frontend LessonBody component.

/** Persisted diagram shape (a positioned subset of the frontend `Diagram`). */
export type BakedDiagram = {
  board: string; // BoardId: "arduino-uno" | "esp32" | "raspberry-pi-pico"
  parts: { id: string; type: string; x: number; y: number; rotation?: number; props?: Record<string, string | number | boolean> }[];
  wires: { id: string; from: string; to: string; color?: string }[];
};

export type Block =
  | { type: "markdown"; text: string }
  | { type: "code"; language: string; code: string; filename?: string; openInStudio?: boolean; board?: string }
  | { type: "mermaid"; chart: string; caption?: string }
  | { type: "svg"; svg: string; caption?: string }
  | { type: "callout"; variant?: "tip" | "info" | "warning"; text: string }
  | {
      type: "diagram";
      board: string; // BoardId the diagram targets
      language: string; // "arduino" | "micropython"
      code: string; // the exact code this diagram matches
      diagram: BakedDiagram;
      caption?: string;
    };

export const md = (text: string): Block => ({ type: "markdown", text });
export const code = (
  language: string,
  src: string,
  opts: { filename?: string; openInStudio?: boolean } = {},
): Block => ({ type: "code", language, code: src, openInStudio: true, ...opts });
export const mermaid = (chart: string, caption?: string): Block => ({ type: "mermaid", chart, caption });
export const svg = (svgStr: string, caption?: string): Block => ({ type: "svg", svg: svgStr, caption });
export const callout = (variant: "tip" | "info" | "warning", text: string): Block => ({ type: "callout", variant, text });
export const diagram = (
  board: string,
  language: string,
  src: string,
  d: BakedDiagram,
  caption?: string,
): Block => ({ type: "diagram", board, language, code: src, diagram: d, caption });

export const body = (...blocks: Block[]) => ({ blocks });

export interface LessonDef {
  title: string;
  slug: string;
  estMinutes: number;
  contentType?: string;
  body: { blocks: Block[] };
}
```

(Leave `CourseModule` exactly as-is.)

### 1.3 — Backend: the single shared `BOARD_BY_COURSE_SLUG` module

Create `robocode-backend/prisma/content/board-map.ts`:

```ts
// SINGLE SOURCE OF TRUTH for which Studio board a course's robotics code targets.
// Imported by the backend seed merge (seed.ts) AND the frontend bake script
// (robocode-frontend/scripts/bake-diagrams.ts) via a monorepo-relative path.
//
// `null` => the course's code is NOT a Studio-emulatable robotics example
// (Raspberry-Pi Linux/Python, or a pure coding course) => no board stamp, no diagram.
//
// Courses whose code is mixed-language (arduino + python in the same course) are
// listed as "by-language": resolve the board per code block via boardForBlock().

export type BoardSlug = "arduino-uno" | "esp32" | "raspberry-pi-pico";

export const BOARD_BY_COURSE_SLUG: Record<string, BoardSlug | null> = {
  "intro-robotics": "arduino-uno",
  "robo-sensors": "arduino-uno",
  "robo-esp32": "esp32",
  "robo-pico": "raspberry-pi-pico",
  // mixed-language courses: arduino blocks -> arduino-uno, python blocks -> null
  "robo-pi-arduino": null,
  "ai-foundations": null,
  // pure coding / Linux courses: never get a diagram
  "coding-arduino": null,
  "robo-raspberry-pi": null,
};

/** Courses where the board depends on the block's language rather than the course. */
const BY_LANGUAGE_COURSES = new Set(["robo-pi-arduino", "ai-foundations"]);

/** Board for a code block, accounting for mixed-language courses. */
export function boardForBlock(courseSlug: string, language: string): BoardSlug | null {
  if (BY_LANGUAGE_COURSES.has(courseSlug)) {
    return language === "arduino" ? "arduino-uno" : null;
  }
  return BOARD_BY_COURSE_SLUG[courseSlug] ?? null;
}
```

### 1.4 — Frontend `lesson-body.tsx`: add `board?` to `code`, add the `diagram` member

File: `robocode-frontend/src/components/learn/lesson-body.tsx`

BEFORE (lines 7–12, the `LessonBlock` union):

```ts
export type LessonBlock =
  | { type: "markdown"; text: string }
  | { type: "code"; language: string; code: string; filename?: string; openInStudio?: boolean }
  | { type: "mermaid"; chart: string; caption?: string }
  | { type: "svg"; svg: string; caption?: string }
  | { type: "callout"; variant?: "tip" | "info" | "warning"; text: string };
```

AFTER:

```ts
/** Persisted diagram shape mirrored from the backend `BakedDiagram`. */
export type BakedDiagram = {
  board: string;
  parts: { id: string; type: string; x: number; y: number; rotation?: number; props?: Record<string, string | number | boolean> }[];
  wires: { id: string; from: string; to: string; color?: string }[];
};

export type LessonBlock =
  | { type: "markdown"; text: string }
  | { type: "code"; language: string; code: string; filename?: string; openInStudio?: boolean; board?: string }
  | { type: "mermaid"; chart: string; caption?: string }
  | { type: "svg"; svg: string; caption?: string }
  | { type: "callout"; variant?: "tip" | "info" | "warning"; text: string }
  | { type: "diagram"; board: string; language: string; code: string; diagram: BakedDiagram; caption?: string };
```

Leave the `LessonBody` switch unchanged in this task (the `case "diagram"` is added in Task 5). The default branch returns `null`, so an unhandled `diagram` block renders nothing until Task 5 — acceptable, and only ever present after a bake+seed, which doesn't happen until Task 7.

### 1.5 — Gate (Task 1)

```bash
cd /Users/marimo/Dev/robocode/robocode-backend && pnpm typecheck
cd /Users/marimo/Dev/robocode/robocode-frontend && pnpm typecheck
```

Expected: both print no errors (exit 0). The backend `tsc --noEmit` must compile `board-map.ts` and the new `Block` member; the frontend must compile the widened `LessonBlock`.

### 1.6 — Commit (TWO commits — one per repo)

Backend:

```bash
cd /Users/marimo/Dev/robocode/robocode-backend
git add prisma/content/types.ts prisma/content/board-map.ts
git commit -m "$(cat <<'EOF'
Add diagram lesson block + shared BOARD_BY_COURSE_SLUG map

Extends the content Block union with a `diagram` member and a `board?` on
`code`, adds the `diagram()` helper, and introduces the single shared
board-per-course map consumed by both the seed merge and the bake script.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01PY3GY5o1gHzvrmVo9HmN6Y
EOF
)"
```

Frontend:

```bash
cd /Users/marimo/Dev/robocode/robocode-frontend
git add src/components/learn/lesson-body.tsx
git commit -m "$(cat <<'EOF'
Add diagram member + code.board to LessonBlock union

Mirrors the backend Block union: a `diagram` lesson block and an optional
`board` on `code`. Renderer case follows in a later commit.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01PY3GY5o1gHzvrmVo9HmN6Y
EOF
)"
```

---

## Task 2 — Encode/decode diagram + `studioHref` board/diagram + CodeBlock board (frontend)

**Deliverable:** `open-in-studio.ts` round-trips a diagram via base64url, exposes `ROBOTICS_BOARDS`/`STUDIO_DIAGRAM_MAX`, and `studioHref` accepts `board`/`diagram`; `CodeBlock` forwards `board`. A new smoke asserts round-trip + oversize omission.

### 2.1 — Rewrite `open-in-studio.ts`

File: `robocode-frontend/src/lib/studio/open-in-studio.ts`

BEFORE (full file):

```ts
// URL helpers for opening a code snippet directly in the RoboCode Studio.
// Snippets are base64url-encoded into the studio URL; the studio page decodes
// them into an unsaved editor buffer (never executed server-side).

export const STUDIO_CODE_MAX = 8000;
export const ROBOTICS_LANGS = ["arduino"] as const;

function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  const b64 = typeof btoa !== "undefined" ? btoa(bin) : Buffer.from(bin, "binary").toString("base64");
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): Uint8Array {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const bin = typeof atob !== "undefined" ? atob(b64) : Buffer.from(b64, "base64").toString("binary");
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function encodeStudioCode(code: string): string {
  return toBase64Url(new TextEncoder().encode(code));
}

export function decodeStudioCode(param: string): string | null {
  try {
    if (!/^[A-Za-z0-9\-_]+$/.test(param)) return null;
    const text = new TextDecoder().decode(fromBase64Url(param));
    if (text.length === 0 || text.length > STUDIO_CODE_MAX) return null;
    return text;
  } catch {
    return null;
  }
}

export function studioHref(language: string, code: string): string {
  const params = new URLSearchParams();
  const isRobotics = (ROBOTICS_LANGS as readonly string[]).includes(language);
  params.set("mode", isRobotics ? "robotics" : "coding");
  params.set("lang", language);
  if (isRobotics) params.set("board", "arduino-uno");
  params.set("code", encodeStudioCode(code));
  return `/studio/new?${params.toString()}`;
}
```

AFTER (full file):

```ts
// URL helpers for opening a code snippet directly in the RoboCode Studio.
// Snippets are base64url-encoded into the studio URL; the studio page decodes
// them into an unsaved editor buffer (never executed server-side). A baked
// wiring diagram can ride alongside the code so the Studio hydrates the wiring.

export const STUDIO_CODE_MAX = 8000;
export const STUDIO_DIAGRAM_MAX = 16000; // max chars of the encoded `diagram` param
export const ROBOTICS_LANGS = ["arduino"] as const;
/** Boards the robotics Studio can open. Used to decide mode=robotics vs coding. */
export const ROBOTICS_BOARDS: ReadonlySet<string> = new Set(["arduino-uno", "esp32", "raspberry-pi-pico"]);

/** Persisted diagram shape (mirrors the backend `BakedDiagram`). */
export type BakedDiagram = {
  board: string;
  parts: { id: string; type: string; x: number; y: number; rotation?: number; props?: Record<string, string | number | boolean> }[];
  wires: { id: string; from: string; to: string; color?: string }[];
};

function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  const b64 = typeof btoa !== "undefined" ? btoa(bin) : Buffer.from(bin, "binary").toString("base64");
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): Uint8Array {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const bin = typeof atob !== "undefined" ? atob(b64) : Buffer.from(b64, "base64").toString("binary");
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function encodeStudioCode(code: string): string {
  return toBase64Url(new TextEncoder().encode(code));
}

export function decodeStudioCode(param: string): string | null {
  try {
    if (!/^[A-Za-z0-9\-_]+$/.test(param)) return null;
    const text = new TextDecoder().decode(fromBase64Url(param));
    if (text.length === 0 || text.length > STUDIO_CODE_MAX) return null;
    return text;
  } catch {
    return null;
  }
}

/** Encode a diagram to a base64url JSON payload for the studio URL. */
export function encodeStudioDiagram(d: BakedDiagram): string {
  return toBase64Url(new TextEncoder().encode(JSON.stringify(d)));
}

/**
 * Decode + validate a diagram param. Returns null (caller falls back to an empty
 * board) when the payload is malformed, oversize, or doesn't target `boardId`
 * (parts[0] must be the `mcu` board for `boardId`).
 */
export function decodeStudioDiagram(param: string, boardId: string): BakedDiagram | null {
  try {
    if (!/^[A-Za-z0-9\-_]+$/.test(param)) return null;
    if (param.length === 0 || param.length > STUDIO_DIAGRAM_MAX) return null;
    const json = new TextDecoder().decode(fromBase64Url(param));
    const d = JSON.parse(json) as BakedDiagram;
    if (!d || typeof d !== "object" || !Array.isArray(d.parts) || !Array.isArray(d.wires)) return null;
    if (d.board !== boardId) return null;
    const head = d.parts[0];
    if (!head || head.id !== "mcu" || head.type !== `__board__:${boardId}`) return null;
    for (const p of d.parts) {
      if (typeof p.id !== "string" || typeof p.type !== "string") return null;
      if (typeof p.x !== "number" || typeof p.y !== "number") return null;
    }
    for (const w of d.wires) {
      if (typeof w.from !== "string" || typeof w.to !== "string") return null;
    }
    return d;
  } catch {
    return null;
  }
}

/**
 * Build the /studio/new URL for a snippet.
 * - When `board` is a known robotics board, force mode=robotics on that board
 *   (so micropython on Pico opens robotics, not coding).
 * - Else fall back to the language heuristic (only `arduino` is robotics).
 * - When a `diagram` is supplied (robotics only), append &diagram=<encoded>,
 *   omitting it past STUDIO_DIAGRAM_MAX so the URL stays within browser limits.
 */
export function studioHref(language: string, code: string, board?: string, diagram?: BakedDiagram): string {
  const params = new URLSearchParams();
  const explicitRobotics = !!board && ROBOTICS_BOARDS.has(board);
  const isRobotics = explicitRobotics || (ROBOTICS_LANGS as readonly string[]).includes(language);
  params.set("mode", isRobotics ? "robotics" : "coding");
  params.set("lang", language);
  if (isRobotics) params.set("board", explicitRobotics ? board! : "arduino-uno");
  params.set("code", encodeStudioCode(code));
  if (isRobotics && diagram) {
    const enc = encodeStudioDiagram(diagram);
    if (enc.length <= STUDIO_DIAGRAM_MAX) {
      params.set("diagram", enc);
    } else if (process.env.NODE_ENV !== "production") {
      console.warn(`[studioHref] diagram param ${enc.length} > ${STUDIO_DIAGRAM_MAX}; omitting wiring.`);
    }
  }
  return `/studio/new?${params.toString()}`;
}
```

### 2.2 — `code-block.tsx`: accept + forward `board`

File: `robocode-frontend/src/components/learn/code-block.tsx`

BEFORE (lines 14–27):

```tsx
export function CodeBlock({
  language, code, filename, openInStudio,
}: { language: string; code: string; filename?: string; openInStudio?: boolean }) {
  return (
    <figure className="my-5 overflow-hidden rounded-xl border border-border bg-[#282c34]">
      <figcaption className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-2">
        <span className="font-mono text-xs text-white/70">{filename ?? language}</span>
        {openInStudio && (
          <Button variant="gradient" size="sm" asChild>
            <Link href={studioHref(language, code)} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="size-3.5" /> Open in RoboCode Studio
            </Link>
          </Button>
        )}
      </figcaption>
```

AFTER:

```tsx
export function CodeBlock({
  language, code, filename, openInStudio, board,
}: { language: string; code: string; filename?: string; openInStudio?: boolean; board?: string }) {
  return (
    <figure className="my-5 overflow-hidden rounded-xl border border-border bg-[#282c34]">
      <figcaption className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-2">
        <span className="font-mono text-xs text-white/70">{filename ?? language}</span>
        {openInStudio && (
          <Button variant="gradient" size="sm" asChild>
            <Link href={studioHref(language, code, board)} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="size-3.5" /> Open in RoboCode Studio
            </Link>
          </Button>
        )}
      </figcaption>
```

(The `{...b}` spread in `LessonBody` already forwards `board` once it's stamped at seed time.)

### 2.3 — New smoke: `scripts/diagram-url-smoke.ts`

Create `robocode-frontend/scripts/diagram-url-smoke.ts`:

```ts
// Deterministic gate for the diagram URL codec (npx tsx).
//   npx tsx scripts/diagram-url-smoke.ts
// Asserts: decodeStudioDiagram(encodeStudioDiagram(d)) deep-equals d for a valid
// diagram; a wrong-board decode returns null; an oversize diagram is omitted from
// studioHref while a small one is included.
import {
  encodeStudioDiagram,
  decodeStudioDiagram,
  studioHref,
  STUDIO_DIAGRAM_MAX,
  type BakedDiagram,
} from "../src/lib/studio/open-in-studio";

function deepEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error("FAIL:", msg);
    process.exit(1);
  }
}

const d: BakedDiagram = {
  board: "esp32",
  parts: [
    { id: "mcu", type: "__board__:esp32", x: 360, y: 220, rotation: 0 },
    { id: "led-1", type: "led", x: 560, y: 120, props: { color: "red" } },
    { id: "resistor-1", type: "resistor", x: 500, y: 120, props: { value: "220" } },
  ],
  wires: [
    { id: "w1", from: "mcu:2", to: "resistor-1:1", color: "#16a34a" },
    { id: "w2", from: "resistor-1:2", to: "led-1:A", color: "#ef4444" },
    { id: "w3", from: "led-1:C", to: "mcu:GND.1", color: "#000000" },
  ],
};

// 1) round-trip on the matching board
const round = decodeStudioDiagram(encodeStudioDiagram(d), "esp32");
assert(round !== null, "round-trip decode returned null");
assert(deepEqual(round, d), "round-trip is not deep-equal");

// 2) wrong-board decode rejects
assert(decodeStudioDiagram(encodeStudioDiagram(d), "arduino-uno") === null, "wrong-board decode should be null");

// 3) studioHref includes a small diagram
const small = studioHref("micropython", "print('hi')", "esp32", d);
assert(small.includes("&diagram=") || small.includes("diagram="), "small diagram should be in the URL");
assert(small.includes("mode=robotics"), "esp32 board should force mode=robotics");
assert(small.includes("board=esp32"), "board param should be esp32");

// 4) studioHref omits an oversize diagram (graceful)
const huge: BakedDiagram = {
  board: "esp32",
  parts: [{ id: "mcu", type: "__board__:esp32", x: 0, y: 0 }],
  wires: Array.from({ length: 4000 }, (_, i) => ({ id: `w${i}`, from: "mcu:2", to: "mcu:GND.1", color: "#000000" })),
};
assert(encodeStudioDiagram(huge).length > STUDIO_DIAGRAM_MAX, "huge diagram should exceed the cap (test fixture sanity)");
const hugeUrl = studioHref("micropython", "print('hi')", "esp32", huge);
assert(!hugeUrl.includes("diagram="), "oversize diagram must be omitted from the URL");
assert(hugeUrl.includes("code="), "code must still be present when diagram is omitted");

console.log("PASS (diagram-url-smoke)");
```

### 2.4 — Gate (Task 2)

```bash
cd /Users/marimo/Dev/robocode/robocode-frontend
pnpm typecheck
npx tsx scripts/diagram-url-smoke.ts
```

Expected: typecheck clean; the smoke prints `PASS (diagram-url-smoke)` and exits 0.

### 2.5 — Commit (frontend)

```bash
cd /Users/marimo/Dev/robocode/robocode-frontend
git add src/lib/studio/open-in-studio.ts src/components/learn/code-block.tsx scripts/diagram-url-smoke.ts
git commit -m "$(cat <<'EOF'
Generalize studioHref with board + encoded diagram

Adds encode/decodeStudioDiagram (base64url JSON), ROBOTICS_BOARDS,
STUDIO_DIAGRAM_MAX, and a board/diagram-aware studioHref so non-Uno boards open
correctly and a baked diagram can ride in the URL (omitted past the cap).
CodeBlock now forwards `board`. Adds a deterministic URL-codec smoke.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01PY3GY5o1gHzvrmVo9HmN6Y
EOF
)"
```

---

## Task 3 — Studio `/new` diagram hydration (frontend)

**Deliverable:** The robotics `/new` branch decodes `?diagram=` and uses it as `initial.diagram` when valid for the board, else falls back to `emptyDiagram(boardId)` (today's behavior).

### 3.1 — Edit `src/app/studio/[projectId]/page.tsx`

File: `robocode-frontend/src/app/studio/[projectId]/page.tsx`

BEFORE (line 10, the import):

```ts
import { decodeStudioCode } from "@/lib/studio/open-in-studio";
```

AFTER:

```ts
import { decodeStudioCode, decodeStudioDiagram } from "@/lib/studio/open-in-studio";
```

BEFORE (line 61, the `searchParams` type):

```ts
  searchParams: Promise<{ task?: string; mode?: string; lang?: string; code?: string; board?: string }>;
```

AFTER:

```ts
  searchParams: Promise<{ task?: string; mode?: string; lang?: string; code?: string; board?: string; diagram?: string }>;
```

BEFORE (line 63, the destructure):

```ts
  const [{ projectId }, { task: taskSlug, mode, lang, code, board: boardParam }] = await Promise.all([params, searchParams]);
```

AFTER:

```ts
  const [{ projectId }, { task: taskSlug, mode, lang, code, board: boardParam, diagram: diagramParam }] = await Promise.all([params, searchParams]);
```

BEFORE (the robotics snippet branch, lines 86–101):

```tsx
    if (snippet && mode !== "coding") {
      await getPageUser();
      const boardId = boardParam ?? "arduino-uno";
      const diagram = emptyDiagram(boardId);
      return (
        <StudioClient
          initial={{
            projectId: "new",
            title: "Robotics snippet",
            kind: "robotics",
            diagram,
            files: buildFiles([], "Snippet", diagram, snippet),
          }}
        />
      );
    }
```

AFTER:

```tsx
    if (snippet && mode !== "coding") {
      await getPageUser();
      const boardId = boardParam ?? "arduino-uno";
      // Hydrate a baked wiring diagram when one was passed and validates for this
      // board; otherwise open an empty board (today's behavior).
      const baked = diagramParam ? decodeStudioDiagram(diagramParam, boardId) : null;
      const diagram = (baked as unknown as Diagram) ?? emptyDiagram(boardId);
      return (
        <StudioClient
          initial={{
            projectId: "new",
            title: "Robotics snippet",
            kind: "robotics",
            diagram,
            files: buildFiles([], "Snippet", diagram, snippet),
          }}
        />
      );
    }
```

Note: `BakedDiagram` is structurally a `Diagram` (board + parts + wires, positions present, `points` absent). The `as unknown as Diagram` cast is safe because `decodeStudioDiagram` has already validated `parts[0]` is the board for `boardId` and every part has numeric `x`/`y`. The Studio store's `load()` reads `d.diagram.parts`/`wires` directly, so no further shaping is needed.

### 3.2 — Gate (Task 3)

```bash
cd /Users/marimo/Dev/robocode/robocode-frontend
pnpm typecheck
```

Expected: clean (exit 0).

### 3.3 — Commit (frontend)

```bash
cd /Users/marimo/Dev/robocode/robocode-frontend
git add src/app/studio/\[projectId\]/page.tsx
git commit -m "$(cat <<'EOF'
Hydrate a passed-in diagram in Studio /new robotics flow

The robotics snippet branch now decodes ?diagram= via decodeStudioDiagram and
uses it as the initial diagram when valid for the board, else falls back to an
empty board. No change to the coding/task paths.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01PY3GY5o1gHzvrmVo9HmN6Y
EOF
)"
```

---

## Task 4 — Bake script (frontend)

**Deliverable:** `scripts/bake-diagrams.ts` walks backend robotics code blocks, infers board via the shared map, assembles vibe inputs exactly like `runVibe` (static fallbacks, no DOM), POSTs to a local `/ai/vibe`, post-processes `result.diagram` (positions, valid wires), and writes `robocode-backend/prisma/content/generated/baked-diagrams.json` keyed `lessonSlug:sha1(code)`. Supports `--force`, `--only <slug>`, and `--mock`. A schema smoke gates it deterministically.

### 4.1 — Decisions locked for this task (no open choices)

- **Auth path:** the script calls `POST {API}/auth/login` with `{ email, password }` and sends the returned `token` as `Authorization: Bearer <token>` on `/ai/vibe`. Default `email` is the seeded **platform super admin** `super@robocode.africa` (password `password123`) — a platform user with NO tenant, so it sidesteps per-tenant host resolution that a school-scoped login would need on localhost. Override via env `BAKE_EMAIL` / `BAKE_PASSWORD` / `API_BASE_URL` (default `http://localhost:4000`). (`loginSchema` validates `{ email, password }`; field is `email`, NOT `identifier`.) Production auth is untouched.
- **Board source:** `boardForBlock(courseSlug, language)` from the shared `board-map.ts` (Task 1.3). `null` → skip.
- **Layout algorithm:** any part the AI returns without numeric `x`/`y` is placed on a deterministic grid to the right of the board: `x = 480 + (i % 3) * 184`, `y = 80 + floor(i / 3) * 152` (mirrors `sanitizeDiagram` in `run-validation.ts`). The `mcu` board is pinned at `x: 360, y: 220` (matches `emptyDiagram`). This is the concrete layout — no "if a helper exists" branch.
- **Wire validation:** keep a wire only if both endpoints match `^[A-Za-z0-9_-]+:[A-Za-z0-9_-]+$` (note: real Wokwi pins like `GND.1` contain a dot — see 4.2 for the exact pin regex used) and reference a part that survived sanitisation. Drop `points`. Log dropped counts.
- **Catalog/pins:** from the frontend `COMPONENTS` / `getBoard().gpio+analog` / `COMPONENT_PINS`, exactly like `runVibe`'s static fallbacks (no `getPinInfo` — there is no DOM).

> Pin-name regex reconciliation: board ground/power pins are emitted by the Wokwi element as `GND.1`, `GND.2`, `5V`, `3V3`, etc. The breakdown's `^[A-Za-z0-9_-]+:[A-Za-z0-9_-]+$` would wrongly drop a `mcu:GND.1` wire. The bake script therefore validates endpoints with `^[A-Za-z0-9_-]+:[A-Za-z0-9_.+-]+$` (allows `.` and `+` in the pin segment) and the schema smoke (4.4) asserts the *part-id* segment matches `^[A-Za-z0-9_-]+$` and references an existing part. The persisted wires are thus catalog-valid and renderable.

### 4.2 — Create `scripts/bake-diagrams.ts`

Create `robocode-frontend/scripts/bake-diagrams.ts`:

```ts
// Offline diagram baker: for each robotics code example in the backend content,
// generate a matching wiring Diagram via the existing /ai/vibe generator and
// persist it (committed) to robocode-backend/prisma/content/generated/baked-diagrams.json.
//
//   # against a locally-running backend with AI credentials:
//   npx tsx scripts/bake-diagrams.ts                 # all robotics courses (skips unchanged)
//   npx tsx scripts/bake-diagrams.ts --force         # re-bake everything
//   npx tsx scripts/bake-diagrams.ts --only robo-esp32   # one course slug
//   # deterministic, no AI (for the gate / dry checks):
//   npx tsx scripts/bake-diagrams.ts --mock --only intro-robotics
//
// Reads backend content via monorepo-relative imports; uses the FRONTEND catalog
// (COMPONENTS / BOARDS / COMPONENT_PINS) to build the vibe inputs exactly like
// runVibe does — but with the static fallbacks (there is no DOM here).

import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";

import { COMPONENTS } from "../src/lib/domain/components";
import { getBoard } from "../src/lib/domain/boards";
import { COMPONENT_PINS } from "../src/lib/studio/pin-reference";
import { emptyDiagram } from "../src/lib/domain/diagram";

// Backend content (monorepo-relative). These are plain TS modules with no DB deps.
import { CONTENT_MODULES } from "../../robocode-backend/prisma/content/index";
import { boardForBlock } from "../../robocode-backend/prisma/content/board-map";
import type { CourseModule, Block } from "../../robocode-backend/prisma/content/types";

type BakedDiagram = {
  board: string;
  parts: { id: string; type: string; x: number; y: number; rotation?: number; props?: Record<string, string | number | boolean> }[];
  wires: { id: string; from: string; to: string; color?: string }[];
};
type Entry = { board: string; language: string; diagram: BakedDiagram };
type Store = { version: 1; entries: Record<string, Entry> };

const API = process.env.API_BASE_URL || "http://localhost:4000";
// Platform super admin (no tenant) — avoids per-tenant host resolution on localhost.
const BAKE_EMAIL = process.env.BAKE_EMAIL || "super@robocode.africa";
const BAKE_PASSWORD = process.env.BAKE_PASSWORD || "password123";

const OUT = resolve(__dirname, "../../robocode-backend/prisma/content/generated/baked-diagrams.json");

const args = process.argv.slice(2);
const FORCE = args.includes("--force");
const MOCK = args.includes("--mock");
const onlyIdx = args.indexOf("--only");
const ONLY = onlyIdx >= 0 ? args[onlyIdx + 1] : null;

const COMPONENT_IDS = new Set(COMPONENTS.map((c) => c.id));
const PART_REF = /^[A-Za-z0-9_-]+:[A-Za-z0-9_.+-]+$/;

function sha1(s: string): string {
  return createHash("sha1").update(s).digest("hex");
}

function loadStore(): Store {
  if (existsSync(OUT)) {
    try {
      const raw = JSON.parse(readFileSync(OUT, "utf8")) as Store;
      if (raw && raw.version === 1 && raw.entries) return raw;
    } catch {
      /* fall through to a fresh store */
    }
  }
  return { version: 1, entries: {} };
}

function saveStore(store: Store) {
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(store, null, 2) + "\n", "utf8");
}

// --- vibe input assembly (mirrors runVibe's static-fallback branch) ----------
function catalogForVibe() {
  return COMPONENTS.filter((c) => c.tag !== "rc-breadboard" && c.tag !== "rc-breadboard-mini").map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    pins: COMPONENT_PINS[c.id],
  }));
}

function vibePayload(title: string, language: string, board: string, code: string) {
  const b = getBoard(board);
  const boardPins = [...b.gpio, ...b.analog];
  return {
    instruction:
      "Generate ONLY the wiring diagram (parts + wires) that exactly matches this code. " +
      "Do NOT change the code. Add every component the code references and wire each to the " +
      "exact board pin the code uses. Use components from the provided catalog only.",
    title,
    board,
    code,
    readme: "",
    language,
    diagram: emptyDiagram(board), // just the mcu board part
    catalog: catalogForVibe(),
    boardPins,
    partPins: {} as Record<string, string[]>, // no existing parts on a blank canvas
  };
}

// --- post-processing: positions + valid parts/wires --------------------------
function sanitize(board: string, raw: BakedDiagram | undefined): BakedDiagram {
  const mcuSrc = raw?.parts?.find((p) => p.id === "mcu" || String(p.type).startsWith("__board__"));
  const mcu = {
    id: "mcu",
    type: `__board__:${board}`,
    x: typeof mcuSrc?.x === "number" ? mcuSrc.x : 360,
    y: typeof mcuSrc?.y === "number" ? mcuSrc.y : 220,
    rotation: typeof mcuSrc?.rotation === "number" ? mcuSrc.rotation : 0,
  };
  const parts: BakedDiagram["parts"] = [mcu];
  const usedIds = new Set(["mcu"]);
  let i = 0;
  for (const p of raw?.parts ?? []) {
    if (p.id === "mcu" || String(p.type).startsWith("__board__")) continue;
    const typeId = COMPONENT_IDS.has(p.type)
      ? p.type
      : COMPONENT_IDS.has(String(p.type).toLowerCase())
        ? String(p.type).toLowerCase()
        : null;
    if (!typeId) continue; // unknown component → drop
    const id = typeof p.id === "string" && p.id && !usedIds.has(p.id) ? p.id : `${typeId}-${i + 1}`;
    usedIds.add(id);
    parts.push({
      id,
      type: typeId,
      x: typeof p.x === "number" ? p.x : 480 + (i % 3) * 184,
      y: typeof p.y === "number" ? p.y : 80 + Math.floor(i / 3) * 152,
      rotation: typeof p.rotation === "number" ? p.rotation : 0,
      props: p.props,
    });
    i++;
  }
  const ids = new Set(parts.map((p) => p.id));
  const wires: BakedDiagram["wires"] = [];
  let dropped = 0;
  let w = 0;
  for (const wire of raw?.wires ?? []) {
    const from = String(wire?.from ?? "");
    const to = String(wire?.to ?? "");
    if (!PART_REF.test(from) || !PART_REF.test(to) || !ids.has(from.split(":")[0]) || !ids.has(to.split(":")[0])) {
      dropped++;
      continue;
    }
    wires.push({ id: typeof wire.id === "string" && wire.id ? wire.id : `w${++w}`, from, to, color: wire.color });
  }
  if (dropped) console.warn(`    dropped ${dropped} invalid wire(s)`);
  return { board, parts, wires };
}

// --- AI call (or mock) -------------------------------------------------------
async function login(): Promise<string> {
  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: BAKE_EMAIL, password: BAKE_PASSWORD }),
  });
  if (!res.ok) throw new Error(`login failed (HTTP ${res.status}) — is the backend running with seeded users?`);
  const data = (await res.json()) as { token?: string };
  if (!data.token) throw new Error("login returned no token");
  return data.token;
}

function mockDiagram(board: string): BakedDiagram {
  // A fixed tiny LED+resistor circuit — deterministic, no AI.
  return {
    board,
    parts: [
      { id: "mcu", type: `__board__:${board}`, x: 360, y: 220, rotation: 0 },
      { id: "resistor-1", type: "resistor", x: 480, y: 80, props: { value: "220" } },
      { id: "led-1", type: "led", x: 664, y: 80, props: { color: "red" } },
    ],
    wires: [
      { id: "w1", from: "mcu:13", to: "resistor-1:1", color: "#16a34a" },
      { id: "w2", from: "resistor-1:2", to: "led-1:A", color: "#ef4444" },
      { id: "w3", from: "led-1:C", to: "mcu:GND.1", color: "#000000" },
    ],
  };
}

async function generate(token: string | null, title: string, language: string, board: string, code: string): Promise<BakedDiagram | null> {
  if (MOCK) return sanitize(board, mockDiagram(board));
  const res = await fetch(`${API}/ai/vibe`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(vibePayload(title, language, board, code)),
  });
  if (!res.ok) {
    console.warn(`    /ai/vibe HTTP ${res.status} — skipping`);
    return null;
  }
  const data = (await res.json()) as { ok?: boolean; result?: { diagram?: BakedDiagram } };
  if (!data.ok || !data.result?.diagram) {
    console.warn("    vibe returned no diagram — skipping");
    return null;
  }
  return sanitize(board, data.result.diagram);
}

// --- walk content ------------------------------------------------------------
type Job = { courseSlug: string; lessonSlug: string; lessonTitle: string; language: string; board: string; code: string };

function collectJobs(): Job[] {
  const jobs: Job[] = [];
  const modules = CONTENT_MODULES as CourseModule[];
  for (const m of modules) {
    const courseSlug = m.meta.slug;
    if (ONLY && courseSlug !== ONLY) continue;
    for (const lesson of m.lessons) {
      for (const block of lesson.body.blocks as Block[]) {
        if (block.type !== "code") continue;
        if (block.openInStudio === false) continue;
        const board = boardForBlock(courseSlug, block.language);
        if (!board) continue; // python/Linux/coding → no diagram
        jobs.push({
          courseSlug,
          lessonSlug: lesson.slug,
          lessonTitle: lesson.title,
          language: block.language,
          board,
          code: block.code,
        });
      }
    }
  }
  return jobs;
}

async function main() {
  const store = loadStore();
  const jobs = collectJobs();
  console.log(`${MOCK ? "[mock] " : ""}${jobs.length} robotics code example(s) to consider${ONLY ? ` (course=${ONLY})` : ""}.`);

  let token: string | null = null;
  if (!MOCK && jobs.length) token = await login();

  let baked = 0;
  let skipped = 0;
  for (const job of jobs) {
    const key = `${job.lessonSlug}:${sha1(job.code)}`;
    if (!FORCE && store.entries[key]) {
      skipped++;
      continue;
    }
    console.log(`  baking ${job.lessonSlug} [${job.board}/${job.language}] …`);
    const diagram = await generate(token, job.lessonTitle, job.language, job.board, job.code);
    if (!diagram) continue;
    store.entries[key] = { board: job.board, language: job.language, diagram };
    baked++;
  }

  saveStore(store);
  console.log(`Done. baked=${baked} skipped(unchanged)=${skipped} total-entries=${Object.keys(store.entries).length}`);
  console.log(`Wrote ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

### 4.3 — Ensure the generated dir is committable

Create the directory with a tracked placeholder so the path exists before a real bake (Task 7 overwrites the JSON):

```bash
cd /Users/marimo/Dev/robocode/robocode-backend
mkdir -p prisma/content/generated
printf '{\n  "version": 1,\n  "entries": {}\n}\n' > prisma/content/generated/baked-diagrams.json
```

(The empty store is valid input for the seed merge in Task 6 — zero entries → lessons unchanged.)

### 4.4 — New schema smoke: `scripts/bake-schema-smoke.ts`

Create `robocode-frontend/scripts/bake-schema-smoke.ts`:

```ts
// Deterministic gate for the baker's output schema (npx tsx). Runs the baker in
// --mock mode for one course, then re-reads the written JSON and asserts every
// produced BakedDiagram is schema-valid.
//   npx tsx scripts/bake-schema-smoke.ts
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const OUT = resolve(__dirname, "../../robocode-backend/prisma/content/generated/baked-diagrams.json");
const PART_ID = /^[A-Za-z0-9_-]+$/;

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error("FAIL:", msg);
    process.exit(1);
  }
}

// Run the baker deterministically (no AI). --force so it writes even if entries exist.
execFileSync("npx", ["tsx", "scripts/bake-diagrams.ts", "--mock", "--force", "--only", "intro-robotics"], {
  cwd: resolve(__dirname, ".."),
  stdio: "inherit",
});

const store = JSON.parse(readFileSync(OUT, "utf8")) as {
  version: number;
  entries: Record<string, { board: string; language: string; diagram: { board: string; parts: { id: string; type: string; x: number; y: number }[]; wires: { id: string; from: string; to: string }[] } }>;
};

assert(store.version === 1, "store.version must be 1");
const keys = Object.keys(store.entries);
assert(keys.length >= 1, "expected at least one mock entry for intro-robotics");

for (const key of keys) {
  assert(/^[^:]+:[0-9a-f]{40}$/.test(key), `key not lessonSlug:sha1 → ${key}`);
  const { board, diagram } = store.entries[key];
  const head = diagram.parts[0];
  assert(head?.id === "mcu" && head.type === `__board__:${board}`, `${key}: parts[0] must be the mcu board`);
  for (const p of diagram.parts) {
    assert(PART_ID.test(p.id), `${key}: bad part id ${p.id}`);
    assert(typeof p.x === "number" && typeof p.y === "number", `${key}: part ${p.id} missing numeric x/y`);
  }
  const ids = new Set(diagram.parts.map((p) => p.id));
  for (const w of diagram.wires) {
    for (const ep of [w.from, w.to]) {
      const [pid, pin] = ep.split(":");
      assert(PART_ID.test(pid) && !!pin, `${key}: wire endpoint not partId:pin → ${ep}`);
      assert(ids.has(pid), `${key}: wire endpoint references missing part → ${ep}`);
    }
  }
}

console.log(`PASS (bake-schema-smoke) — ${keys.length} entr${keys.length === 1 ? "y" : "ies"} validated`);
```

### 4.5 — Gate (Task 4)

```bash
cd /Users/marimo/Dev/robocode/robocode-frontend
pnpm typecheck
npx tsx scripts/bake-schema-smoke.ts
```

Expected: typecheck clean. The smoke runs the baker in `--mock` mode (no backend, no AI), writes mock entries for `intro-robotics`, re-reads them, and prints `PASS (bake-schema-smoke) — N entries validated`.

> Note: the schema smoke *overwrites* `baked-diagrams.json` with mock data. Do NOT commit that mock JSON — the commit below stages only the scripts. Restore the empty store before committing so the repo's checked-in JSON stays empty until Task 7:
> ```bash
> cd /Users/marimo/Dev/robocode/robocode-backend
> git checkout -- prisma/content/generated/baked-diagrams.json
> ```

### 4.6 — Commit (TWO commits)

Backend (the empty generated store + dir):

```bash
cd /Users/marimo/Dev/robocode/robocode-backend
git add prisma/content/generated/baked-diagrams.json
git commit -m "$(cat <<'EOF'
Add empty baked-diagrams store (filled by the bake script)

Establishes prisma/content/generated/baked-diagrams.json with an empty entries
map. Valid input for the seed merge (zero entries -> lessons unchanged); the real
diagrams are baked and committed later.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01PY3GY5o1gHzvrmVo9HmN6Y
EOF
)"
```

Frontend (the scripts):

```bash
cd /Users/marimo/Dev/robocode/robocode-frontend
git add scripts/bake-diagrams.ts scripts/bake-schema-smoke.ts
git commit -m "$(cat <<'EOF'
Add AI diagram bake script + schema smoke

bake-diagrams.ts walks backend robotics code blocks, infers the board from the
shared map, assembles /ai/vibe inputs from the frontend catalog like runVibe,
keeps result.diagram, fills missing positions deterministically, drops invalid
wires, and writes baked-diagrams.json keyed lessonSlug:sha1(code). Supports
--force/--only/--mock. bake-schema-smoke.ts gates the output schema via --mock.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01PY3GY5o1gHzvrmVo9HmN6Y
EOF
)"
```

---

## Task 5 — `DiagramPreview` + `DiagramBlock` + render case (frontend)

**Deliverable:** A read-only `DiagramPreview` renders the baked diagram by reusing the `wokwi-part` element + an SVG wire layer; `DiagramBlock` wraps it with a caption and an Open-in-Studio button; `LessonBody` handles `case "diagram"`. Frontend typechecks and builds.

### 5.1 — Create `src/components/learn/diagram-preview.tsx`

This component reuses the real `WokwiPart` (which registers pins in the shared `pin-registry`) and resolves wire endpoints with the same math the Studio canvas uses (`partPinPos`), drawing on a post-mount frame and skipping unresolved pins.

Create `robocode-frontend/src/components/learn/diagram-preview.tsx`:

```tsx
"use client";

import Link from "next/link";
import * as React from "react";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WokwiPart } from "@/components/studio/wokwi-part";
import { Breadboard } from "@/components/studio/breadboard";
import { getBoard } from "@/lib/domain/boards";
import { COMPONENT_BY_ID } from "@/lib/domain/components";
import { getPartEl, getPinInfo } from "@/lib/studio/pin-registry";
import { studioHref, type BakedDiagram } from "@/lib/studio/open-in-studio";

type Pt = { x: number; y: number };

/** Canvas-space position of a pin, mirroring StudioCanvas.partPinPos. */
function partPinPos(part: BakedDiagram["parts"][number], pinName: string): Pt | null {
  const pins = getPinInfo(part.id);
  const pin = pins.find((p) => p.name === pinName);
  if (!pin) return null;
  const el = getPartEl(part.id);
  const w = el?.offsetWidth ?? 0;
  const h = el?.offsetHeight ?? 0;
  const rot = ((part.rotation ?? 0) * Math.PI) / 180;
  const cx = w / 2;
  const cy = h / 2;
  const dx = pin.x - cx;
  const dy = pin.y - cy;
  const rx = dx * Math.cos(rot) - dy * Math.sin(rot);
  const ry = dx * Math.sin(rot) + dy * Math.cos(rot);
  return { x: part.x + cx + rx, y: part.y + cy + ry };
}

function PartView({ part }: { part: BakedDiagram["parts"][number] }) {
  if (part.id === "mcu" || part.type.startsWith("__board__")) {
    const boardId = part.type.split(":")[1] ?? "arduino-uno";
    return <WokwiPart partId={part.id} tag={getBoard(boardId).wokwiTag} />;
  }
  const def = COMPONENT_BY_ID[part.type];
  if (!def) return null;
  if (def.tag.startsWith("rc-breadboard")) return <Breadboard partId={part.id} />;
  return <WokwiPart partId={part.id} tag={def.tag} props={part.props} />;
}

/**
 * Read-only render of a baked diagram. Parts are positioned by x/y; wires are an
 * SVG overlay drawn after the @wokwi/elements mount and report their pins. A
 * straight polyline per wire is enough for an illustrative lesson preview; the
 * editable bus-routed version lives in the Studio. Unresolved pins are skipped.
 */
export function DiagramPreview({ diagram }: { diagram: BakedDiagram }) {
  const { parts, wires } = diagram;
  const [, setTick] = React.useState(0);

  // Bounding box (parts measured after mount; fall back to a sensible size).
  const bounds = React.useMemo(() => {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const p of parts) {
      const el = getPartEl(p.id);
      const w = el?.offsetWidth ?? 160;
      const h = el?.offsetHeight ?? 100;
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x + w);
      maxY = Math.max(maxY, p.y + h);
    }
    if (!isFinite(minX)) return { minX: 0, minY: 0, w: 800, h: 480 };
    const pad = 48;
    return { minX: minX - pad, minY: minY - pad, w: maxX - minX + pad * 2, h: maxY - minY + pad * 2 };
  }, [parts]);

  // Redraw once parts have mounted + measured (pin coords only exist post-mount).
  React.useEffect(() => {
    const r = requestAnimationFrame(() => setTick((t) => t + 1));
    const t1 = setTimeout(() => setTick((t) => t + 1), 150);
    const t2 = setTimeout(() => setTick((t) => t + 1), 500);
    return () => {
      cancelAnimationFrame(r);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [parts]);

  const wirePos = (ref: string): Pt | null => {
    const [pid, pin] = ref.split(":");
    const part = parts.find((p) => p.id === pid);
    return part ? partPinPos(part, pin) : null;
  };

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-border bg-[#0d1426]">
      <div
        className="relative origin-top-left"
        style={{ width: bounds.w, height: bounds.h, transform: `translate(${-bounds.minX}px, ${-bounds.minY}px)` }}
      >
        {/* wires */}
        <svg className="pointer-events-none absolute left-0 top-0 overflow-visible" width={1} height={1}>
          {wires.map((w) => {
            const a = wirePos(w.from);
            const b = wirePos(w.to);
            if (!a || !b) return null; // skip until pins resolve
            const color = w.color ?? "#16a34a";
            return (
              <g key={w.id}>
                <path d={`M ${a.x} ${a.y} L ${b.x} ${b.y}`} stroke={color} strokeWidth={3} fill="none" strokeLinecap="round" />
                {[a, b].map((pt, i) => (
                  <circle key={i} cx={pt.x} cy={pt.y} r={4.5} fill={color} stroke="#fff" strokeWidth={1.4} />
                ))}
              </g>
            );
          })}
        </svg>

        {/* parts (non-interactive) */}
        {parts.map((part) => (
          <div
            key={part.id}
            className="pointer-events-none absolute select-none"
            style={{ left: part.x, top: part.y, transform: `rotate(${part.rotation ?? 0}deg)`, transformOrigin: "center" }}
          >
            <PartView part={part} />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Lesson `diagram` block: the preview + caption + an Open-in-Studio button. */
export function DiagramBlock({
  board,
  language,
  code,
  diagram,
  caption,
}: {
  board: string;
  language: string;
  code: string;
  diagram: BakedDiagram;
  caption?: string;
}) {
  return (
    <figure className="my-6 flex flex-col gap-2">
      <DiagramPreview diagram={diagram} />
      <figcaption className="flex items-center justify-between gap-2">
        <span className="text-sm text-muted-foreground">{caption ?? "Wiring diagram"}</span>
        <Button variant="gradient" size="sm" asChild>
          <Link href={studioHref(language, code, board, diagram)} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="size-3.5" /> Open in RoboCode Studio
          </Link>
        </Button>
      </figcaption>
    </figure>
  );
}
```

> Confirm `Breadboard` exists at `@/components/studio/breadboard` before relying on it. It is imported by `canvas.tsx` (`import { Breadboard } from "@/components/studio/breadboard";`), so the path is valid. Baked diagrams should not contain breadboards (the bake catalog excludes them), but `PartView` mirrors the canvas for completeness.

### 5.2 — `lesson-body.tsx`: import + `case "diagram"`

File: `robocode-frontend/src/components/learn/lesson-body.tsx`

BEFORE (lines 1–5, imports):

```ts
import { Markdown } from "./markdown";
import { CodeBlock } from "./code-block";
import { MermaidDiagram } from "./mermaid-diagram";
import { SvgFigure } from "./svg-figure";
import { Callout } from "./callout";
```

AFTER:

```ts
import { Markdown } from "./markdown";
import { CodeBlock } from "./code-block";
import { MermaidDiagram } from "./mermaid-diagram";
import { SvgFigure } from "./svg-figure";
import { Callout } from "./callout";
import { DiagramBlock } from "./diagram-preview";
```

BEFORE (the switch, lines 17–32):

```tsx
      {blocks.map((b, i) => {
        switch (b.type) {
          case "markdown":
            return <Markdown key={i} text={b.text} />;
          case "code":
            return <CodeBlock key={i} {...b} />;
          case "mermaid":
            return <MermaidDiagram key={i} {...b} />;
          case "svg":
            return <SvgFigure key={i} {...b} />;
          case "callout":
            return <Callout key={i} {...b} />;
          default:
            return null;
        }
      })}
```

AFTER:

```tsx
      {blocks.map((b, i) => {
        switch (b.type) {
          case "markdown":
            return <Markdown key={i} text={b.text} />;
          case "code":
            return <CodeBlock key={i} {...b} />;
          case "mermaid":
            return <MermaidDiagram key={i} {...b} />;
          case "svg":
            return <SvgFigure key={i} {...b} />;
          case "callout":
            return <Callout key={i} {...b} />;
          case "diagram":
            return <DiagramBlock key={i} {...b} />;
          default:
            return null;
        }
      })}
```

### 5.3 — Gate (Task 5)

```bash
cd /Users/marimo/Dev/robocode/robocode-frontend
pnpm typecheck
pnpm build
```

Expected: typecheck clean; `next build` completes with no type/route errors. (The Academy lesson route stays a server component; `DiagramBlock`/`DiagramPreview` are `"use client"`, like `CodeBlock`/`MermaidDiagram`, so the boundary is unchanged.)

**Manual browser check (note for the executor — full pass happens in Task 7):** after a real bake+seed, a baked lesson must show the parts and wires inside the dark canvas; resizing the window keeps the diagram inside its rounded frame. There is no manual data available until Task 7, so this gate is typecheck+build only.

### 5.4 — Commit (frontend)

```bash
cd /Users/marimo/Dev/robocode/robocode-frontend
git add src/components/learn/diagram-preview.tsx src/components/learn/lesson-body.tsx
git commit -m "$(cat <<'EOF'
Render baked wiring diagrams in lessons (DiagramPreview)

Adds a read-only DiagramPreview that reuses the real wokwi-part element and an
SVG wire layer (resolving partId:pin via the shared pin-registry, drawing on a
post-mount frame, skipping unresolved pins), and a DiagramBlock with caption +
Open-in-Studio. Wires the `diagram` case into LessonBody.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01PY3GY5o1gHzvrmVo9HmN6Y
EOF
)"
```

---

## Task 6 — Seed-time merge (backend)

**Deliverable:** A pure `mergeBakedDiagrams(lessonSlug, blocks)` stamps `board` on robotics `code` blocks and splices a `diagram` block after each code block with a `baked-diagrams.json` entry; applied inside the `course()` lesson loop. A new smoke proves insertion + stamping + no-op behaviors.

### 6.1 — Edit `prisma/seed.ts`: imports + helper + apply in `course()`

File: `robocode-backend/prisma/seed.ts`

BEFORE (line 5, the content import):

```ts
import { introRobotics, codingArduino, aiFoundations, LANG_MODULES, ROBOTICS_MODULES, AI_MODULES } from "./content";
```

AFTER (add the board map, the block helpers/types, and load the baked store):

```ts
import { introRobotics, codingArduino, aiFoundations, LANG_MODULES, ROBOTICS_MODULES, AI_MODULES } from "./content";
import { boardForBlock } from "./content/board-map";
import { diagram as diagramBlock, type Block, type BakedDiagram } from "./content/types";
```

BEFORE (lines 1–7, the existing imports — to confirm `createHash`/`readFileSync` availability):

```ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { readFileSync } from "node:fs";
import { introRobotics, codingArduino, aiFoundations, LANG_MODULES, ROBOTICS_MODULES, AI_MODULES } from "./content";
```

AFTER (add `createHash` + `resolve`; `readFileSync` already imported):

```ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { introRobotics, codingArduino, aiFoundations, LANG_MODULES, ROBOTICS_MODULES, AI_MODULES } from "./content";
import { boardForBlock } from "./content/board-map";
import { diagram as diagramBlock, type Block, type BakedDiagram } from "./content/types";
```

Now add the baked-store loader + `mergeBakedDiagrams` near the top of the file's logic, immediately after the `routed()` helper (which ends around line 62). BEFORE (line 60–62):

```ts
function routed(d: AnyJson): AnyJson {
  for (const w of d.wires as AnyJson[]) delete w.points;
  return d;
}
```

AFTER (append the new block right after `routed`):

```ts
function routed(d: AnyJson): AnyJson {
  for (const w of d.wires as AnyJson[]) delete w.points;
  return d;
}

// ---- baked AI wiring diagrams (committed JSON; see scripts/bake-diagrams.ts) ----
type BakedEntry = { board: string; language: string; diagram: BakedDiagram };
type BakedStore = { version: number; entries: Record<string, BakedEntry> };

let _bakedStore: BakedStore | undefined;
function bakedStore(): BakedStore {
  if (_bakedStore !== undefined) return _bakedStore;
  try {
    const raw = readFileSync(resolve(__dirname, "content/generated/baked-diagrams.json"), "utf8");
    const parsed = JSON.parse(raw) as BakedStore;
    _bakedStore = parsed && parsed.entries ? parsed : { version: 1, entries: {} };
  } catch {
    _bakedStore = { version: 1, entries: {} }; // missing/empty file → no-op merge
  }
  return _bakedStore;
}

function sha1(s: string): string {
  return createHash("sha1").update(s).digest("hex");
}

/**
 * Pure transform applied to each lesson's blocks at seed time:
 *  1. Stamp `board` on every robotics `code` block (board from the shared map;
 *     null → left untouched, e.g. python/Linux/coding).
 *  2. After a code block that has a baked-diagrams.json entry (keyed
 *     lessonSlug:sha1(code)), splice a `diagram` block built from that entry.
 * Everything else passes through unchanged. Idempotent and deterministic.
 */
export function mergeBakedDiagrams(courseSlug: string, lessonSlug: string, blocks: Block[]): Block[] {
  const entries = bakedStore().entries;
  const out: Block[] = [];
  for (const block of blocks) {
    if (block.type !== "code") {
      out.push(block);
      continue;
    }
    const board = block.openInStudio === false ? null : boardForBlock(courseSlug, block.language);
    const stamped: Block = board ? { ...block, board } : block;
    out.push(stamped);
    if (board) {
      const entry = entries[`${lessonSlug}:${sha1(block.code)}`];
      if (entry) {
        out.push(diagramBlock(entry.board, entry.language, block.code, entry.diagram));
      }
    }
  }
  return out;
}
```

Now apply it inside `course()`. BEFORE (lines 490–499):

```ts
  async function course(data: AnyJson, lessons: AnyJson[], tasks: AnyJson[]) {
    const c = await prisma.course.create({ data: data as never });
    for (let i = 0; i < lessons.length; i++) {
      await prisma.lesson.create({ data: { ...(lessons[i] as object), courseId: c.id, order: i } as never });
    }
    for (const t of tasks) {
      await prisma.task.create({ data: { ...(t as object), courseId: c.id } as never });
    }
    return c;
  }
```

AFTER (thread the course slug + merge each lesson's `body.blocks`):

```ts
  async function course(data: AnyJson, lessons: AnyJson[], tasks: AnyJson[]) {
    const c = await prisma.course.create({ data: data as never });
    const courseSlug = String((data as { slug?: string }).slug ?? "");
    for (let i = 0; i < lessons.length; i++) {
      const lesson = lessons[i] as { slug?: string; body?: { blocks?: Block[] } };
      const lessonSlug = String(lesson.slug ?? "");
      const blocks = lesson.body?.blocks ?? [];
      const mergedBody = { ...(lesson.body ?? { blocks: [] }), blocks: mergeBakedDiagrams(courseSlug, lessonSlug, blocks) };
      await prisma.lesson.create({ data: { ...(lesson as object), body: mergedBody, courseId: c.id, order: i } as never });
    }
    for (const t of tasks) {
      await prisma.task.create({ data: { ...(t as object), courseId: c.id } as never });
    }
    return c;
  }
```

> The breakdown's signature was `mergeBakedDiagrams(lessonSlug, blocks)`. The course slug is required to resolve the board (mixed-language courses depend on it), so the implemented signature is `mergeBakedDiagrams(courseSlug, lessonSlug, blocks)`. This is the intentional, concrete choice — the merge cannot stamp the right board from the lesson slug alone.

### 6.2 — New smoke: `prisma/seed-merge-smoke.ts`

Create `robocode-backend/prisma/seed-merge-smoke.ts`. It imports the pure `mergeBakedDiagrams` from `seed.ts`. To keep that import side-effect-free, the smoke must not trigger seeding — `seed.ts` runs its `main()` at import. Guard the smoke by NOT importing `seed.ts` directly; instead, re-implement the test against a *fixture* by importing the pieces the merge depends on. Concretely, the smoke imports the exported `mergeBakedDiagrams` but `seed.ts` self-executes, so we instead test the merge in isolation by replicating it is NOT allowed (no duplication). Therefore: make `seed.ts` only run `main()` when invoked directly.

First, guard `seed.ts`'s entrypoint. Find the `main().` / `main().catch` / bottom-of-file invocation:

```bash
cd /Users/marimo/Dev/robocode/robocode-backend
grep -nE "main\(\)|\.catch\(|\\\$disconnect" prisma/seed.ts | tail
```

BEFORE (the bottom-of-file invocation — typical shape; match the actual lines printed above):

```ts
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

AFTER (only auto-run when this file is the entrypoint, so importing it for a smoke is side-effect-free):

```ts
// Only seed when run directly (tsx prisma/seed.ts), not when imported by a smoke.
const isDirectRun = process.argv[1] ? resolve(process.argv[1]) === resolve(__filename) : false;
if (isDirectRun) {
  main()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
```

Now create `robocode-backend/prisma/seed-merge-smoke.ts`:

```ts
// Deterministic gate for mergeBakedDiagrams (npx tsx). Imports the real pure
// transform from seed.ts (which no longer self-runs on import) and asserts:
//  - a baked code block gets exactly one diagram block spliced after it + board stamped
//  - a code block with no entry is unchanged (board stamped, no diagram block)
//  - a python block in a by-language course is untouched (no board, no diagram)
//   npx tsx prisma/seed-merge-smoke.ts
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { code, type Block, type BakedDiagram } from "./content/types";

const STORE = resolve(__dirname, "content/generated/baked-diagrams.json");

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error("FAIL:", msg);
    process.exit(1);
  }
}
const sha1 = (s: string) => createHash("sha1").update(s).digest("hex");

// --- fixture: a known code block + a baked entry for it ----------------------
const ARDUINO_SRC = "void setup(){ pinMode(13, OUTPUT); }\nvoid loop(){ digitalWrite(13, HIGH); }";
const PY_SRC = "from machine import Pin\nled = Pin(25, Pin.OUT)";
const fixtureDiagram: BakedDiagram = {
  board: "arduino-uno",
  parts: [
    { id: "mcu", type: "__board__:arduino-uno", x: 360, y: 220, rotation: 0 },
    { id: "led-1", type: "led", x: 560, y: 120, props: { color: "red" } },
  ],
  wires: [{ id: "w1", from: "mcu:13", to: "led-1:A", color: "#16a34a" }],
};

// Write a fixture store (backing up + restoring the real one).
const had = existsSync(STORE);
const backup = had ? readFileSync(STORE, "utf8") : null;
mkdirSync(resolve(__dirname, "content/generated"), { recursive: true });
writeFileSync(
  STORE,
  JSON.stringify(
    {
      version: 1,
      entries: { [`lesson-x:${sha1(ARDUINO_SRC)}`]: { board: "arduino-uno", language: "arduino", diagram: fixtureDiagram } },
    },
    null,
    2,
  ),
);

function restore() {
  if (backup !== null) writeFileSync(STORE, backup);
}

(async () => {
  // Import AFTER the fixture store is on disk (seed.ts reads it lazily/cached).
  const { mergeBakedDiagrams } = await import("./seed");

  // Case A: intro-robotics (arduino-uno course), the baked block + an un-baked block.
  const unbaked = "void setup(){}\nvoid loop(){}";
  const blocksA: Block[] = [
    code("arduino", ARDUINO_SRC, { filename: "blink.ino" }),
    code("arduino", unbaked, { filename: "other.ino" }),
  ];
  const outA = mergeBakedDiagrams("intro-robotics", "lesson-x", blocksA);
  // expect: [code(stamped), diagram, code(stamped)]
  assert(outA.length === 3, `A: expected 3 blocks, got ${outA.length}`);
  assert(outA[0].type === "code" && (outA[0] as { board?: string }).board === "arduino-uno", "A: first code not stamped arduino-uno");
  assert(outA[1].type === "diagram", "A: a diagram block must follow the baked code block");
  assert((outA[1] as { code: string }).code === ARDUINO_SRC, "A: diagram block must carry the matching code");
  assert(outA[2].type === "code" && (outA[2] as { board?: string }).board === "arduino-uno", "A: second code not stamped");
  assert(!outA.some((b, i) => b.type === "diagram" && i !== 1), "A: only one diagram block expected");

  // Case B: a by-language course, a python block → untouched (no board, no diagram).
  const blocksB: Block[] = [code("python", PY_SRC, { filename: "blink.py" })];
  const outB = mergeBakedDiagrams("robo-pi-arduino", "lesson-y", blocksB);
  assert(outB.length === 1, `B: python block should not gain a diagram (got ${outB.length})`);
  assert(outB[0].type === "code" && (outB[0] as { board?: string }).board === undefined, "B: python block must not be stamped");

  restore();
  console.log("PASS (seed-merge-smoke)");
})().catch((e) => {
  restore();
  console.error(e);
  process.exit(1);
});
```

### 6.3 — Gate (Task 6)

```bash
cd /Users/marimo/Dev/robocode/robocode-backend
pnpm typecheck
npx tsx prisma/seed-merge-smoke.ts
```

Expected: typecheck clean; the smoke prints `PASS (seed-merge-smoke)` and exits 0. It writes a temporary fixture store and restores the real (empty) one on exit; confirm afterward:

```bash
git status --porcelain prisma/content/generated/baked-diagrams.json   # expect: no output (unchanged)
```

### 6.4 — Commit (backend)

```bash
cd /Users/marimo/Dev/robocode/robocode-backend
git add prisma/seed.ts prisma/seed-merge-smoke.ts
git commit -m "$(cat <<'EOF'
Splice baked diagrams + stamp boards at seed time

Adds a pure mergeBakedDiagrams(courseSlug, lessonSlug, blocks) that stamps the
correct board on robotics code blocks and inserts a diagram block (from the
committed baked-diagrams.json) after each baked code block, applied in course().
Guards seed.ts so it only self-runs when invoked directly (importable by the
smoke). Adds a deterministic seed-merge smoke.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01PY3GY5o1gHzvrmVo9HmN6Y
EOF
)"
```

---

## Task 7 — Run the real bake + commit JSON + final gates (backend + manual)

**Deliverable:** A real `baked-diagrams.json` (reviewed) committed to the backend, a clean local seed, and a manual browser spot-check confirming board-correct rendering + hydration. Final gates green.

> IMPORTANT — environment dependency: the real-AI bake requires a running backend with valid AI credentials (`DEEPSEEK_API_KEY`) and a seeded DB (for the bake login). If the execution environment lacks AI credentials or cannot run the backend, **this task's bake is a human step.** The code from Tasks 1–6 is complete and gated WITHOUT it: the `--mock` path (Task 4 schema smoke) covers the script end-to-end, and the seed merge no-ops on the empty store. In that case, perform 7.5 (final gates) and hand 7.1–7.4 to a human with credentials.

### 7.1 — Start the backend locally (terminal 1)

```bash
cd /Users/marimo/Dev/robocode/robocode-backend
# Ensure DEEPSEEK_API_KEY is set (.env). Seed so the bake login + lesson reads work:
pnpm db:reset          # prisma db push --force-reset && tsx prisma/seed.ts (empty store → no diagrams yet)
pnpm dev               # NestJS on http://localhost:4000
```

Verify the AI is configured and login works:

```bash
curl -s -X POST http://localhost:4000/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"super@robocode.africa","password":"password123"}' | head -c 200
# expect JSON containing "token":"..."
```

### 7.2 — Run the real bake (terminal 2)

```bash
cd /Users/marimo/Dev/robocode/robocode-frontend
# All robotics courses (intro-robotics, robo-sensors, robo-esp32, robo-pico, and the
# arduino blocks of robo-pi-arduino / ai-foundations). Skips unchanged on re-run.
npx tsx scripts/bake-diagrams.ts
# Optionally re-bake a single course while iterating:
#   npx tsx scripts/bake-diagrams.ts --only robo-esp32 --force
```

Expected console: a per-lesson "baking …" line, occasional "dropped N invalid wire(s)" / "skipping" warnings, and a final `Done. baked=… total-entries=…` plus the written path `…/robocode-backend/prisma/content/generated/baked-diagrams.json`.

### 7.3 — REVIEW the generated diagrams (human judgement)

```bash
cd /Users/marimo/Dev/robocode/robocode-backend
git --no-pager diff --stat prisma/content/generated/baked-diagrams.json
git --no-pager diff prisma/content/generated/baked-diagrams.json | head -200
```

For each entry sanity-check, in the JSON: `parts[0]` is `__board__:<expected board>` (ESP32 entries say `esp32`, Pico say `raspberry-pi-pico`, the rest `arduino-uno`); the components named match the code (e.g. an ultrasonic lesson has an `ultrasonic` part + power/GND/TRIG/ECHO wires); no obviously wrong pin (LED through a `resistor`). A wrong diagram is a content fix — edit the JSON by hand or re-bake that lesson — not a code change.

### 7.4 — Re-seed with diagrams + manual browser spot-check

```bash
cd /Users/marimo/Dev/robocode/robocode-backend
pnpm db:seed          # re-runs seed; mergeBakedDiagrams now splices the baked diagrams
```

```bash
cd /Users/marimo/Dev/robocode/robocode-frontend
pnpm dev              # Next.js
```

In the browser (signed in), verify:
1. **Intro-robotics** "What is a microcontroller?" / a lesson with a baked code block → a `DiagramPreview` renders with parts + wires inside the dark canvas, captioned, with an "Open in RoboCode Studio" button.
2. Clicking **Open in RoboCode Studio** opens `/studio/new?...&diagram=...` → the Studio shows the SAME wiring pre-loaded (the parts + wires from the lesson), on the **arduino-uno** board.
3. An **ESP32** lesson (`robo-esp32` → e.g. `esp32-blink`): the diagram renders, and Open-in-Studio opens on the **ESP32** board (not Uno) with the wiring.
4. A **Pico** lesson (`robo-pico` → e.g. `pico-blink`, micropython): Open-in-Studio opens on the **raspberry-pi-pico** board with the wiring (this proves `ROBOTICS_BOARDS` forces robotics mode for micropython).
5. A **plain arduino code block** with no baked diagram still opens Studio on the correct board (board-stamp path) — no diagram param, no crash.
6. A **python/Linux** lesson (`robo-raspberry-pi`) renders code only — no diagram block.

### 7.5 — Final gates (always run, even if 7.1–7.4 are deferred to a human)

```bash
cd /Users/marimo/Dev/robocode/robocode-backend && pnpm typecheck
cd /Users/marimo/Dev/robocode/robocode-frontend && pnpm typecheck && pnpm build
# Re-run the smokes to confirm nothing regressed:
cd /Users/marimo/Dev/robocode/robocode-frontend && npx tsx scripts/diagram-url-smoke.ts && npx tsx scripts/bake-schema-smoke.ts
cd /Users/marimo/Dev/robocode/robocode-backend && git checkout -- prisma/content/generated/baked-diagrams.json 2>/dev/null; npx tsx prisma/seed-merge-smoke.ts
```

> `bake-schema-smoke.ts` rewrites the JSON with mock data. If you ran the REAL bake (7.2) and intend to commit it, run the schema smoke BEFORE the real bake, or re-run the real bake after the smoke. The final committed JSON must be the reviewed REAL output, not mock data.

### 7.6 — Commit the real JSON (backend) — only if the real bake ran

```bash
cd /Users/marimo/Dev/robocode/robocode-backend
git add prisma/content/generated/baked-diagrams.json
git commit -m "$(cat <<'EOF'
Bake AI wiring diagrams for the robotics courses

Generated, reviewed wiring diagrams (intro-robotics, robo-sensors, robo-esp32,
robo-pico, and the arduino examples of robo-pi-arduino) keyed lessonSlug:sha1.
Seeding splices these as diagram blocks; lessons now render the wiring and
Open-in-Studio hydrates it on the correct board.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01PY3GY5o1gHzvrmVo9HmN6Y
EOF
)"
```

If the real bake is deferred to a human, do NOT commit mock JSON; leave the empty store committed (Task 4.6) and record in the PR that the real bake is pending.

---

## Done-when

- Both repos typecheck; frontend builds.
- `diagram-url-smoke.ts`, `bake-schema-smoke.ts`, `seed-merge-smoke.ts` all print PASS.
- After a real bake + seed: a baked lesson renders the `DiagramPreview`; Open-in-Studio hydrates the wiring on the correct board; ESP32/Pico examples open on ESP32/Pico (not Uno); python/Linux lessons render code-only.
- `baked-diagrams.json` is committed to the backend (reviewed), or its real bake is explicitly flagged as a pending human step with the empty store committed.
- Branches: frontend `feature/ai-diagram-baking`, backend `feature/ai-diagram-baking`; every commit carries the two trailers.
