# Content Library Overhaul — Design

Date: 2026-06-21
Branch: refactor/frontend-backend-split

## Goal

Transform the RoboCode Content Library from thin placeholder data into real, detailed
courses with rich formatting, illustrations, and diagrams. Add an introductory tutorial
for **every supported language**, each showing example code with an **"Open in RoboCode
Studio"** button that loads the snippet directly into the Studio.

Plus a small follow-up: inside the Studio, the title should read **"RoboCode Studio"**
instead of "RoboCode.Africa".

## Decisions (confirmed with user)

- **Languages covered:** all 12 supported — `python`, `javascript`, `typescript`, `html`,
  `css`, `go`, `rust`, `cpp`, `csharp`, `sql` (coding studio) plus `arduino` and
  `micropython` (robotics studio).
- **Organisation:** one `Course` per language (coding track).
- **Open in Studio:** URL-encoded snippet — no DB writes, shareable links.
- **Visuals:** inline hand-authored SVG illustrations + Mermaid diagrams.
- **Code-explanation prose:** rendered as cleanly styled HTML/CSS (full markdown +
  polished `.prose-lesson` typography), not the current bare parser.

## Current state (from codebase investigation)

- `Course` → `Lesson` Prisma models. `Lesson.body` is `Json`, today shaped as
  `{ blocks: [{ type: "markdown", text }] }`. `Lesson.contentType` defaults to `"markdown"`.
  **No migration needed** — `body` is already free-form JSON.
- Lesson renderer: `robocode-frontend/src/app/app/learn/[slug]/[lessonSlug]/page.tsx`
  has an inline `renderBlock` that only handles `#`/`##`/`###` headings and paragraphs.
  No lists, code blocks, images, or diagrams.
- `react-markdown` + `remark-gfm` already installed; used in studio components, not in lessons.
- Supported coding languages: `robocode-frontend/src/lib/studio/coding.ts` (`CodeLang`,
  `langFromFiles`, `DEFAULT_CODE_LANG = "cpp"`) and backend
  `robocode-backend/src/modules/ai/dto.ts` (`CODE_LANGUAGES`).
- Studio route: `robocode-frontend/src/app/studio/[projectId]/page.tsx`. `searchParams`
  currently accepts `{ task?, mode? }`. `mode=coding` selects the coding studio; otherwise
  robotics. **No mechanism exists to inject a raw snippet** — this must be built.
- Seed: `robocode-backend/prisma/seed.ts` creates 3 demo courses (`intro-robotics`,
  `coding-arduino`, `ai-foundations`) via a `course(meta, lessons, tasks)` helper and a
  `lessonBody(md)` helper. Lesson bodies are one-liners.
- Studio title: currently shows "RoboCode.Africa" somewhere in the studio chrome (to be
  located precisely during implementation; likely the studio toolbar/header component).

## Architecture

### 1. Rich lesson block model

Extend the existing block system (authoring stays in JSON, no schema change). The renderer
maps `block.type` → component. Unknown types degrade to nothing (forward-compatible).

| `type`     | Shape                                                   | Renders as |
|------------|---------------------------------------------------------|------------|
| `markdown` | `{ text: string }`                                      | Full markdown via `react-markdown` + `remark-gfm`, wrapped in styled `.prose-lesson` HTML (headings, paragraphs, lists, tables, inline code, links, blockquotes) |
| `code`     | `{ language, filename?, code, openInStudio?: boolean }` | Syntax-highlighted code card; when `openInStudio`, shows an **"Open in RoboCode Studio"** button built from `studioHref(language, code)` |
| `mermaid`  | `{ chart: string, caption?: string }`                   | Mermaid diagram via a lazy-loaded client component |
| `svg`      | `{ svg: string, caption?: string }`                     | Inline hand-authored SVG illustration with optional caption |
| `callout`  | `{ variant: "tip"\|"info"\|"warning", text }`          | Styled callout box (text is markdown) |

**Frontend components** (new), under `robocode-frontend/src/components/learn/`:

- `lesson-body.tsx` — `LessonBody({ blocks })`: iterates blocks, dispatches by type.
  Replaces the inline `renderBlock` in the lesson page.
- `markdown.tsx` — `Markdown({ text })`: `react-markdown` + `remark-gfm` with a component
  map so output is clean semantic HTML; wrapped in `prose-lesson`.
- `code-block.tsx` — `CodeBlock({ language, filename?, code, openInStudio? })`: highlighted
  code + optional Open-in-Studio button.
- `mermaid-diagram.tsx` — client component, dynamically imports `mermaid`, renders on mount.
- `svg-figure.tsx` — renders trusted inline SVG (content is authored by us in seed, not
  user input) + caption.
- `callout.tsx` — variant-styled box.

**Prose styling:** a `.prose-lesson` block in `globals.css` (or Tailwind Typography `prose`
classes) giving headings, paragraph rhythm, list styling, inline-code chips, table borders,
blockquote styling, and link colors consistent with the brand. This is the "nicely formatted
HTML and CSS" requirement for code-explanation text.

**Dependencies added to frontend:** `mermaid`, and `react-syntax-highlighter` (with
`@types/react-syntax-highlighter`) for lesson code readability. (`react-markdown`,
`remark-gfm` already present.)

### 2. "Open in RoboCode Studio" mechanism

**Helper** `robocode-frontend/src/lib/studio/open-in-studio.ts`:

```
studioHref(language: string, code: string): string
```

- Coding languages → `/studio/new?mode=coding&lang=<lang>&code=<base64url>`
- `arduino` / `micropython` → `/studio/new?mode=robotics&board=arduino-uno&code=<base64url>`

`code` is base64url-encoded (URL-safe, no padding) to survive query encoding. A matching
`decodeStudioCode(param)` lives in the same module for the studio page to use.

**Studio page changes** (`studio/[projectId]/page.tsx`):

- Widen `searchParams` to `{ task?, mode?, lang?, code?, board? }`.
- When `projectId === "new"` and `code` is present:
  - `mode=coding`: build a single coding `StudioFile` named from `lang` (e.g. `main.py`)
    with the decoded content; pass to the coding studio (reuse `CodeLang`/extension mapping).
  - `mode=robotics`: build `sketch.ino` with decoded content on the requested `board`
    (default `arduino-uno`), empty diagram parts/wires.
- Guard: ignore malformed/oversized `code` params (cap length, try/catch decode → fall back
  to blank new project). No code execution happens server-side; the snippet is just editor text.

The button in lessons is the existing `Open in Studio` visual pattern (see
`app/challenges/[slug]/page.tsx`), opening in a new tab.

### 3. Twelve language tutorial courses

One `Course` per language, `track: "coding"` (arduino/micropython use `track: "robotics"`),
`level` chosen per language, `published: true`, ordered after the demo courses. Each course
has ~3–4 lessons following a consistent arc:

1. **Hello, <Language>** — what it is, where it runs, a runnable hello-world (`code` block
   with Open-in-Studio), one SVG/Mermaid visual.
2. **Variables & types** — core data, with worked examples.
3. **Control flow / structure** — conditionals + loops (or language-idiomatic equivalent).
4. **Put it together** — a small worked example tying concepts, Open-in-Studio.

Every tutorial includes at least one example `code` block with `openInStudio: true` and at
least one `svg` or `mermaid` visual.

**Content organisation:** to keep `seed.ts` readable, course content moves to
`robocode-backend/prisma/content/` — one TS module per course exporting `{ meta, lessons, tasks? }`
typed objects, plus an `index.ts` aggregating them. `seed.ts` imports and feeds them through
the existing `course()` helper. Shared SVG/Mermaid snippets can live in
`prisma/content/_assets.ts`.

### 4. Transform the 3 demo courses

`intro-robotics`, `coding-arduino`, `ai-foundations` get real lessons authored with the rich
blocks: proper explanations, circuit/flow diagrams (SVG + Mermaid), and worked code with
Open-in-Studio. They move into `prisma/content/` modules alongside the new ones. Their
existing tasks/challenges are preserved.

### 5. Studio title fix

Locate where the studio chrome renders "RoboCode.Africa" and change it to "RoboCode Studio".
(Branding elsewhere on the marketing site / app shell is unchanged — this is studio-only.)

### 6. Studio Code Explainer — nicely formatted HTML/CSS

The screenshot the user shared (from production at `robocode.africa/studio/...`) shows the
Code Explainer "Explanation" panel rendering **raw markdown** — literal backticks and `-`
bullets as plain text. Investigation shows the **current `refactor/frontend-backend-split`
branch already fixes this**: `coding-studio.tsx` renders the explanation via
`<Markdown remarkPlugins={[remarkGfm]}>` inside a styled `md-body` div, and the backend
explain prompt (`ai.service.ts`) already returns GitHub-flavoured Markdown. The production
site is the older pre-split monolith and simply hasn't been deployed from this branch yet.

The deliverable here is therefore **verify + polish + consistency**:

- Confirm the Explanation and Validation panels render markdown (not plain text).
- Polish `md-body` so the explainer's "inline-code line + explanation" walkthrough pattern
  reads cleanly: tighter list rhythm, clear inline-code chips, comfortable spacing — the same
  level of "nicely formatted HTML/CSS" as the new `.prose-lesson` lessons. The two styles stay
  separate classes (`md-body` for studio AI panels, `.prose-lesson` for lessons) but share the
  same visual quality bar.
- No backend prompt change is required (it already specifies GFM); only adjust if the rendered
  walkthrough items need the explanation on its own line — handled by a minor `md-body li`
  rule, not a prompt change.

## Data flow

1. Seed writes enriched `Lesson.body` block arrays into Postgres.
2. `GET /learn/courses/:slug/lessons/:lessonSlug` returns `lesson.body` unchanged (already
   passes JSON through).
3. `LessonBody` renders blocks → styled HTML, code cards, diagrams, illustrations.
4. Open-in-Studio button → `studioHref` URL → studio `new` page decodes `code` → loads
   editor with the snippet in the right mode/language.

## Build order (independently verifiable slices)

- **Slice A — plumbing:** block renderer + components + `.prose-lesson` CSS;
  `open-in-studio` helper; studio page decode support; studio title fix. Verify with one
  hand-crafted rich lesson.
- **Slice B — demo course rewrites:** move 3 demo courses into `prisma/content/`, author rich
  content. Verify by reseeding and viewing.
- **Slice C — 12 language courses:** author and seed. Verify counts in admin Content Library
  and spot-check several lessons + Open-in-Studio for a coding and a robotics language.

## Testing / verification

- Reseed DB (`prisma db seed`) succeeds; admin `/admin/content` shows 15 courses
  (3 demo + 12 language) with expected lesson counts.
- Lesson pages render markdown as styled HTML, code blocks, Mermaid diagrams, and SVG
  illustrations without console errors.
- Open-in-Studio: a Python lesson opens the coding studio prefilled with the snippet; an
  Arduino lesson opens the robotics studio with `sketch.ino` prefilled.
- Malformed/oversized `code` param falls back to a blank new project.
- Studio header shows "RoboCode Studio".
- Frontend builds/typechecks; no new lint errors in touched files.

### 7. Persisted, cache-invalidated code explanations

When the Code Explainer fetches an explanation from the AI, **persist it in the database** so
subsequent clicks reuse it instead of hitting the AI provider. Invalidate when the code
changes, and auto-display a current explanation when the Studio loads.

**Data model:** add three nullable columns to `CodeFile` (requires one migration):
`explanation String?`, `explanationHash String?` (sha256 hex of the explained content),
`explanationAt DateTime?`. One explanation per file; no new table needed.

**Backend (`/ai/explain-code`):** the request gains an optional `projectId`. The service:
1. Computes `hash = sha256(code)`.
2. If `projectId` + `filename` resolve to a `CodeFile` the user may read, and its stored
   `explanationHash === hash`, returns the stored `explanation` with `cached: true` — **no AI
   call**.
3. Otherwise calls the AI as today, then writes `explanation`/`explanationHash`/`explanationAt`
   onto the `CodeFile`, returning `cached: false`.

`ExplainCodeResult` gains `cached?: boolean`.

**Auto-display & invalidation (frontend):**
- `getProject` already returns full `codeFiles`, so the studio page computes per file
  `explanationCurrent = explanation != null && explanationHash === sha256(content)` and passes a
  `{ filename → { text, current } }` map into the Coding Studio.
- On load, if the active file has a `current` explanation, the Explanation panel shows it
  automatically (no click, no network).
- The Coding Studio keeps an in-memory `explained[file] = { text, content }`. Clicking Code
  Explainer with **unchanged** content reuses the in-memory text (no network); after an **edit**
  the content no longer matches, so the click re-fetches — the backend's hash check forces a
  fresh AI pull and re-persists. This is the "flag reset on edit" behaviour.
- Snippet/unsaved projects (`projectId === "new"`) skip persistence (pass no `projectId`).

Hashing uses sha256 hex of the UTF-8 content on both sides (Node `crypto` in the backend and in
the studio server component) so the comparison is consistent.

## Out of scope

- No admin authoring UI for rich blocks (content is seed-authored).
- No code execution from the Open-in-Studio path (editor text only).
- No changes to enrollment/points logic.
- The only schema change is the three `CodeFile` explanation columns in §7; the rest of the
  work needs no migration (`Lesson.body` is already `Json`).
- Validation results (Validate with AI) are NOT persisted — only Code Explainer (§7).

## Risks / notes

- `mermaid` is client-only and heavyweight → lazy-load via `next/dynamic` (no SSR) to avoid
  bundle/SSR issues. Heed `AGENTS.md`: this Next.js may differ from training data — read the
  relevant guide in `node_modules/next/dist/docs/` before using dynamic import / client
  boundaries.
- Inline SVG/markdown HTML is authored by us in seed (trusted), not user input, so raw-HTML
  rendering risk is contained. Do not enable raw-HTML passthrough for user-supplied content.
- Base64url snippet length capped to keep URLs sane; large examples stay modest.
