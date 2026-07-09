# Spec — AI Diagram-Baking for Academy Lessons

**Goal:** Every Academy robotics code example ships with an AI-generated wiring diagram that matches the code, rendered read-only in the lesson with an "Open in RoboCode Studio" button that hydrates the code *and* the wiring on the correct board.

**Date:** 2026-06-23

**Cross-repo:** touches `robocode-frontend` (block type, renderer, bake script, Open-in-Studio, Studio hydration) and `robocode-backend` (block type, seed merge, baked-diagram JSON). The spec lives in the frontend repo by convention.

**Approved decisions (brainstorming):**
1. **Generation model — bake once, persist.** AI runs offline over the code examples; results are committed and seeded. No per-view AI cost/latency.
2. **Storage — a lesson content block.** A new `diagram` block in the existing lesson `body` JSON (no DB schema migration).
3. **Generation engine — reuse RoboVibe.** The bake script calls the existing `/ai/vibe` generator with a fixed "match this code" instruction and keeps only the diagram.
4. **Rendering — read-only `DiagramPreview`.** A focused, non-interactive renderer reusing the real `wokwi-part` element + a wire layer; decoupled from the Studio store.
5. **Board correctness — fixed everywhere.** The correct board (Uno/ESP32/Pico) is threaded into both the new diagram blocks and the existing plain code blocks' "Open in Studio".

---

## Background

The platform already has the adjacent pieces but not the feature:

- **RoboVibe** (`POST /ai/vibe` → `AiService.vibeCircuit`, `robocode-backend/src/modules/ai/ai.service.ts:328`) rewrites a whole project's `{diagram, files, readme}` from a typed instruction. It is user-initiated, in-Studio only. Its diagram output shape is defined by `VibeResult` (`robocode-backend/src/modules/ai/dto.ts:171`).
- **Open-in-Studio** exists on **code blocks** only: `CodeBlock` (`robocode-frontend/src/components/learn/code-block.tsx:14`) renders a button via `studioHref(language, code)` (`robocode-frontend/src/lib/studio/open-in-studio.ts:38`).
- **Studio new-open** (`robocode-frontend/src/app/studio/[projectId]/page.tsx:56`) decodes `?code=` and builds an **empty** diagram via `emptyDiagram(boardId)` (`robocode-frontend/src/lib/domain/diagram.ts:31`) — no wiring is ever pre-loaded.

**The pivotal gap — board is not modeled per example.** The content `Block` union (`robocode-backend/prisma/content/types.ts:1`) has **no `board` field**; `studioHref` hardcodes `board="arduino-uno"` for `language==="arduino"` and treats `micropython`/`python` as non-robotics (`open-in-studio.ts:40-43`). Consequently the ESP32 examples (`robo-esp32.ts`) and Pico examples (`robo-pico.ts`) today open in Studio on the **wrong board** (Uno) or with **no board**. A diagram cannot be generated or rendered without the correct board, so board-correctness is part of this feature.

The lesson body is rendered by `LessonBody` which switches on `block.type` (`robocode-frontend/src/components/learn/lesson-body.tsx:8`). The frontend `LessonBlock` union (same file, line 1) mirrors the backend `Block` union structurally but is declared separately.

---

## Goals / Non-Goals

**Goals**

- A new `diagram` lesson block carrying `{ board, language, code, diagram, caption? }`, added to both the backend `Block` union and the frontend `LessonBlock` union + renderer.
- An offline, idempotent **bake script** (frontend `tsx`) that generates a matching `Diagram` per robotics code example by reusing `/ai/vibe`, and writes a committed `baked-diagrams.json`.
- A **seed-time merge** that injects a `diagram` block after each baked `code` block and stamps the correct `board` onto robotics `code` blocks.
- A read-only **`DiagramPreview`** that renders the baked diagram in the lesson, plus an "Open in RoboCode Studio" button.
- **Board correctness**: the diagram block and plain code blocks open Studio on the correct board; the Studio `new` flow hydrates a passed-in diagram.

**Non-Goals**

- NO runtime/on-open AI diagram completion (bake-time only).
- NO DB schema migration (the `diagram` block lives in the existing `body` JSON column).
- NO new AI prompt/endpoint — the bake reuses `vibeCircuit`'s diagram generation; the bake step keeps only the diagram and never rewrites the lesson code.
- NO diagrams for Raspberry-Pi **Linux/Python** examples (`robo-raspberry-pi.ts`, the python blocks of `robo-pi-arduino.ts`) — the full Pi is not in Studio's `BOARDS` catalogue (consistent with the emulation scope: Studio emulates only Uno/ESP32/Pico).
- NO admin UI to trigger baking (it is a developer `tsx` command run manually).
- NO editing of the human-authored prose in content files beyond the seed-time block injection + board stamping.

---

## Architecture

Five well-bounded units (four new + one cross-cutting fix). Data flows: **bake script → committed JSON → seed merge → DB lesson body → `LessonBody` renderer → `DiagramPreview` + Open-in-Studio → Studio hydration.**

### Unit A — the `diagram` lesson block (the contract)

The shared artifact. Identical structure on both sides (declared separately, like the existing blocks).

**Backend** (`robocode-backend/prisma/content/types.ts`): extend the `Block` union and add a `diagram()` helper.

```ts
// added to the Block union:
| {
    type: "diagram";
    board: string;            // BoardId: "arduino-uno" | "esp32" | "raspberry-pi-pico"
    language: string;         // "arduino" | "micropython"
    code: string;             // the exact code this diagram matches
    diagram: BakedDiagram;    // { board, parts, wires } — see Unit C schema
    caption?: string;
  };

export const diagram = (
  board: string,
  language: string,
  src: string,
  d: BakedDiagram,
  caption?: string,
): Block => ({ type: "diagram", board, language, code: src, diagram: d, caption });
```

`BakedDiagram` is the persisted diagram shape (a structural subset of the frontend `Diagram`, with positions filled in — see Unit C).

**Frontend** (`robocode-frontend/src/components/learn/lesson-body.tsx`): add the mirror member to `LessonBlock` and a `case "diagram": return <DiagramBlock key={i} {...b} />;` to the `LessonBody` switch.

### Unit B — board model + `studioHref` generalization (cross-cutting fix)

The board is the missing dimension. Rather than hand-edit every content file, the board is **inferred once** from the course and stamped at seed time onto both `code` and `diagram` blocks.

- **`BOARD_BY_COURSE_SLUG`** (a small map, defined where the seed merge runs — see Unit D): `intro-robotics → "arduino-uno"`, `robo-sensors-1|2|3 → "arduino-uno"`, `robo-esp32 → "esp32"`, `robo-pico → "raspberry-pi-pico"`, `robo-pi-arduino → per-block by language (arduino→"arduino-uno", python→null)`, `ai-foundations → per-block by language`. Anything resolving to `null` (Linux/Pi python) gets **no** board stamp and **no** diagram.
- The frontend `LessonBlock` `code` member gains an optional `board?: string`; `CodeBlock` (`code-block.tsx`) passes it through.
- **`studioHref(language, code, board?, diagram?)`** (`open-in-studio.ts`) generalizes: when an explicit robotics `board` is given (Uno/ESP32/Pico), set `mode="robotics"` and `board=<that>` (so `micropython`+pico → robotics, not coding); when absent, fall back to the current language heuristic. A new exported `ROBOTICS_BOARDS` set decides "is this a robotics board". The optional `diagram` param is added in Unit E; this unit adds the `board` param and its callers in `CodeBlock`.

This single change fixes the existing "everything opens as Uno" bug for plain code blocks **and** gives the diagram block its board.

### Unit C — the bake script (offline, reuses RoboVibe)

A `tsx` script in the **frontend** repo (`robocode-frontend/scripts/bake-diagrams.ts`), because the `vibe` inputs `catalog` / `boardPins` / `partPins` are derived **only** from frontend data (`COMPONENTS` in `src/lib/domain/components.ts`, `BOARDS` in `src/lib/domain/boards.ts`, `COMPONENT_PINS` in `src/lib/studio/pin-reference.ts`) — see `runVibe` (`src/lib/studio/run-validation.ts:119`). The backend has no equivalent.

**Inputs per example:** `(lessonSlug, blockIndex, language, code, board)`. The script obtains the code examples by importing the backend content modules via monorepo-relative path (`../../robocode-backend/prisma/content/*`) and walking each `LessonDef.body.blocks` for `code` blocks with `openInStudio !== false`; the board comes from `BOARD_BY_COURSE_SLUG` (shared with Unit D via a small committed module both repos import, or duplicated with a single-source comment — implementation-time choice, see Risks).

**Generation:** for each example, build the `vibe` request:
- `instruction`: `"Generate ONLY the wiring diagram (parts + wires) that exactly matches this code. Do NOT change the code. Add every component the code references and wire each to the exact board pin the code uses. Use components from the provided catalog only."`
- `board`, `language`, `code` from the example; `readme: ""`; `title: <lesson title>`.
- `diagram`: `emptyDiagram(board)` (just the `mcu` board part).
- `catalog`, `boardPins`, `partPins`: assembled from the frontend `COMPONENTS` / `BOARDS` / `COMPONENT_PINS` exactly as `runVibe` does (no live DOM — use the static fallbacks: `boardPins = [...getBoard(board).gpio, ...getBoard(board).analog]`, `partPins` from `COMPONENT_PINS`, `catalog` from `COMPONENTS` minus breadboards).
- Calls the backend `/ai/vibe` over HTTP against a locally-running backend (the script reuses the proven generator without duplicating the prompt). Auth: use a configured bake token / the dev auth path (implementation-time; the endpoint takes `user?` optional).

**Post-processing:** keep only `result.diagram`. Ensure schema validity and **positions**: parts[0] must be the `mcu` board (`type: "__board__:<board>"`); any returned part missing `x`/`y` is laid out deterministically (a ring/grid around the `mcu`, reusing the Studio's vibe-apply positioning if a helper exists, else a local layout). Drop wire `points`. Validate every wire endpoint is `"partId:pinName"` and references a real part; drop invalid wires (and log).

**`BakedDiagram` schema (the persisted shape):**
```ts
type BakedDiagram = {
  board: string;
  parts: { id: string; type: string; x: number; y: number; rotation?: number; props?: Record<string, string|number|boolean> }[];
  wires: { id: string; from: string; to: string; color?: string }[];
};
```

**Output:** a committed `robocode-backend/prisma/content/generated/baked-diagrams.json`:
```jsonc
{
  "version": 1,
  "entries": {
    "<lessonSlug>:<sha1(code)>": { "board": "...", "language": "...", "diagram": { /* BakedDiagram */ } }
  }
}
```
Keyed by `lessonSlug + sha1(code)` so it survives block reordering and re-runs are idempotent (a re-bake overwrites by key). The script is re-runnable; an existing entry for an unchanged code hash can be skipped unless `--force`.

### Unit D — seed-time merge

`robocode-backend/prisma/seed.ts` already spreads `LessonDef.body` straight into `prisma.lesson.create` (`seed.ts:490-499`). Add a pure transform applied to each lesson's blocks **before** create:

`mergeBakedDiagrams(lessonSlug, blocks): Block[]` —
1. For each `code` block (in order), if it is a robotics example, stamp `block.board = BOARD_BY_COURSE_SLUG-resolved board` (Unit B), unless null.
2. If `baked-diagrams.json` has an entry for `"<lessonSlug>:<sha1(block.code)>"`, splice a `diagram` block (built via the `diagram()` helper from the entry) immediately **after** that code block.
3. Leave all other blocks untouched.

The authored content files are never edited; the merge is deterministic from the committed JSON. If no JSON entry exists for a code block (bake not run, or AI failed for it), the lesson simply renders the code block alone — graceful degradation.

### Unit E — lesson rendering + Studio hydration

**`DiagramPreview`** (`robocode-frontend/src/components/learn/diagram-preview.tsx`, new) — a read-only, non-interactive renderer:
- Renders the `mcu` board part and each component part as the real `wokwi-part` custom element (reusing `src/components/studio/wokwi-part.tsx`) positioned at its `x`/`y`.
- Renders wires as an SVG overlay: after the parts mount and register their pins (the `wokwi-part` / pin-registry path the Studio already uses), resolve each wire's `from`/`to` `"partId:pinName"` to pin coordinates and draw a polyline. No drag, no editing, no store subscription — it takes a `Diagram` prop and renders.
- Sized to fit the lesson column; non-interactive (pointer-events off on parts).

**`DiagramBlock`** (in `diagram-preview.tsx` or `lesson-body.tsx`) wraps `DiagramPreview` with the optional `caption` and an "Open in RoboCode Studio" button → `studioHref(language, code, board, diagram)`.

**`studioHref(language, code, board?, diagram?)`** (`open-in-studio.ts`): when `diagram` is provided, add a `&diagram=<encodeStudioDiagram(diagram)>` param (base64url of the JSON, same scheme as `encodeStudioCode`). Enforce a size cap (`STUDIO_DIAGRAM_MAX`, e.g. 16000 chars of encoded payload); if exceeded, omit the diagram param (the link still opens code on the right board, just without pre-wired parts) and log in dev.

**Studio `new`-open hydration** (`robocode-frontend/src/app/studio/[projectId]/page.tsx`): the robotics branch reads `?diagram=`; when present and decodable to a valid `Diagram` for `boardId`, use it as the `initial.diagram` instead of `emptyDiagram(boardId)`. When absent/invalid, fall back to `emptyDiagram(boardId)` (today's behavior). `decodeStudioDiagram` validates the shape and that `parts[0]` is the `mcu` board for `boardId`; on mismatch it falls back.

---

## Data flow

1. **Bake (offline, manual):** `tsx scripts/bake-diagrams.ts` reads backend content code blocks → infers board → calls `/ai/vibe` (local backend) with the frontend catalog/pins → keeps `result.diagram`, fills positions, validates → writes `baked-diagrams.json` (committed).
2. **Seed:** `seed.ts` → `mergeBakedDiagrams` stamps `board` on code blocks and splices `diagram` blocks from the JSON → `prisma.lesson.create({ body })`.
3. **Render:** `GET /courses/:slug/lessons/:slug` returns `body.blocks` → `LessonBody` switch → `CodeBlock` (now board-aware) + `DiagramBlock` → `DiagramPreview` draws the wiring.
4. **Open in Studio:** the button → `studioHref(language, code, board, diagram)` → `/studio/new?mode=robotics&lang=…&board=…&code=…&diagram=…` → the `new` branch decodes the diagram and hydrates Studio with the real wiring on the correct board.

---

## Error handling

- **AI failure / empty diagram for an example:** the bake script logs and writes no entry for that key → the lesson renders the code block alone. Never blocks the seed.
- **Unresolvable board (Pi/Linux python):** excluded by `BOARD_BY_COURSE_SLUG` returning null → no board stamp, no diagram block.
- **Invalid wire endpoints / unknown part type from the AI:** the bake script drops the offending wire/part (logs a count); the persisted diagram only contains catalog-valid parts and `partId:pin` wires.
- **Oversized Open-in-Studio URL:** `studioHref` omits the `diagram` param past `STUDIO_DIAGRAM_MAX`; the link still opens code+board (graceful).
- **Diagram param decode failure / board mismatch in Studio:** `decodeStudioDiagram` returns null → fall back to `emptyDiagram(boardId)` (today's behavior). No crash.
- **`DiagramPreview` wire resolution race (pins not yet measured):** draw wires after parts register pins (retry-on-frame like the Studio), and tolerate an unresolved pin by skipping that wire rather than throwing.

---

## Testing & verification

Both repos are typecheck-only (no unit framework); gates are `tsc` + `tsx` smoke scripts + a build + a manual browser check.

- **Typecheck** both repos clean.
- **Bake-script schema gate** (`tsx`): run the bake (or a mocked-vibe variant) for one Arduino example and assert the produced `BakedDiagram` is schema-valid — `parts[0]` is `__board__:<board>`, every part has numeric `x`/`y`, every wire endpoint matches `^[\w-]+:[\w-]+$` and references an existing part. (A mock-vibe mode lets this run without the AI for CI-style determinism.)
- **Seed-merge gate** (`tsx`): given a fixture lesson + a `baked-diagrams.json` entry, `mergeBakedDiagrams` inserts exactly one `diagram` block after the matching code block and stamps the board on the code block; a no-entry code block is unchanged.
- **Encode/decode round-trip** (`tsx`): `decodeStudioDiagram(encodeStudioDiagram(d)) deep-equals d` for a sample diagram; oversize → `studioHref` omits the param.
- **Manual browser spot-check:** seed locally, open a baked lesson — the `DiagramPreview` shows the parts + wiring; "Open in RoboCode Studio" lands in Studio on the correct board with the parts pre-wired (and an ESP32/Pico example opens on ESP32/Pico, not Uno).

---

## Risks & open questions

- **`DiagramPreview` wire routing (primary risk).** Wires need rendered pin coordinates; the Studio resolves these via the `wokwi-part` pin-registry after the elements mount. Reusing that read-only requires the parts to render and report pins before wires draw. Mitigation: draw wires on a post-mount frame, skip unresolved pins. If pin measurement proves too coupled to the Studio store, the fallback is to have the bake step also persist resolved pin coordinates — deferred unless needed.
- **AI diagram quality.** RoboVibe may miss a component or mis-wire a pin. Because diagrams are **baked and committed**, every generated diagram is reviewable in the PR diff (the JSON is human-readable) and editable before merge — this is a feature of bake-time generation. A wrong diagram is a content fix, not a code bug.
- **`BOARD_BY_COURSE_SLUG` single-source.** Used by both the bake script (frontend) and the seed merge (backend). Implementation-time choice: a tiny committed JSON/TS module imported by both via monorepo-relative path, or duplicated with a "keep in sync" comment. Prefer a single shared module.
- **`/ai/vibe` auth for the bake script.** The endpoint takes `user?` optional; the bake script needs a working call path (a dev token or a local unauthenticated route). Resolve at implementation; do not weaken production auth.
- **URL size.** A diagram of ~5 parts/8 wires encodes to a few KB; combined with code (≤8 KB) the URL stays within browser limits. `STUDIO_DIAGRAM_MAX` caps it with graceful omission.
- **Auto-layout fidelity.** Vibe parts may lack positions; the deterministic ring/grid layout is functional but not hand-tuned. Acceptable for v1 (the diagram is illustrative + editable in Studio).

---

## Out of scope

- Runtime/on-open AI diagram completion.
- Diagrams for Raspberry-Pi Linux/Python examples (no Studio board).
- An admin/CI trigger for baking (manual `tsx` command for v1).
- DB schema changes (diagram lives in the `body` JSON).
- Re-generating diagrams automatically when lesson code changes (re-run the bake manually).
- Hand-tuned part layout / a visual diagram editor in the lesson.
