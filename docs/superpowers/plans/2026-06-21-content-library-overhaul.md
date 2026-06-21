# Content Library Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the 3 placeholder demo courses into real, richly-formatted courses and add an introductory tutorial for all 12 supported languages, each with example code and an "Open in RoboCode Studio" button.

**Architecture:** Lesson `body` stays JSON but gains typed blocks (`markdown`, `code`, `mermaid`, `svg`, `callout`) rendered by a new `LessonBody` component tree. A URL-encoding helper lets any snippet open in the Studio via `/studio/new?...&code=<base64url>`, decoded server-side in the studio page. Course content moves from inline `seed.ts` literals into `prisma/content/*` modules.

**Tech Stack:** NestJS + Prisma + Postgres (backend), Next.js App Router + Tailwind + shadcn/ui (frontend), `react-markdown` + `remark-gfm` (installed), new: `mermaid`, `react-syntax-highlighter`.

## Global Constraints

### Repo & workflow conventions (post-investigation — these OVERRIDE any per-task command that conflicts)

- **Three independent git repos.** `robocode-frontend`, `robocode-backend`, `robocode-mobile` are each their OWN git repo (own `package.json` + `pnpm-lock.yaml`), currently on `main`. The root `/Users/marimo/Dev/robocode` is a stale monorepo wrapper — **do NOT commit package code to the root repo.**
- **Commit inside the package repo, on the feature branch `feature/content-library`** (created in both `robocode-frontend` and `robocode-backend` before Task 1). Every `git add`/`git commit` in a task runs with the package repo as cwd — i.e. prefix with `git -C robocode-frontend …` or `git -C robocode-backend …`, and only stage the exact files the task changed (never `git add -A`).
- **Run package tooling inside the package repo.** Frontend: `cd robocode-frontend && pnpm <cmd>` (e.g. `pnpm add mermaid`, `pnpm typecheck`, `pnpm lint`). Backend: `cd robocode-backend && pnpm <cmd>` (`pnpm typecheck`, `pnpm lint`, `pnpm db:seed`). Do NOT use root `--filter`.
- **No test framework exists** in either repo (frontend: only Playwright; backend: none). Do NOT add vitest/jest. Where a task says "write a failing test", instead verify with: (a) `pnpm typecheck` (= `tsc --noEmit`), (b) `pnpm lint`, and (c) a targeted runtime sanity check via `node -e "…"` / `tsx -e "…"` for pure functions. The task reviewer is the correctness gate.

### Project rules & data

- Heed each repo's `AGENTS.md`: this Next.js (v16.2.9) may differ from training data — read the relevant guide in `robocode-frontend/node_modules/next/dist/docs/` before using dynamic import / client-component patterns.
- **Reuse the existing `.md-body` CSS class** (defined in `robocode-frontend/src/app/globals.css`) for lesson prose. Do NOT introduce a new `.prose-lesson` class — `md-body` is already the polished markdown treatment used by the Code Explainer. Lesson markdown blocks, callouts, and the explainer all share `md-body`.
- The ONLY schema change is the three `CodeFile` explanation columns in Task 6C. Backend uses **`prisma db push` with a hand-authored migration file** matching the existing `prisma/migrations/YYYYMMDDHHMMSS_name/migration.sql` convention (9 already exist) — NOT `prisma migrate dev`. All course/lesson work needs no schema change — `Lesson.body` is already `Json`.
- `explainCodeSchema` already uses `language: z.enum(CODE_LANGUAGES)` and `code: z.string().min(1).max(20000)`; only ADD `projectId` — keep the enum. `ExplainCodeResult` is declared in `robocode-backend/src/modules/ai/dto.ts` (not the service).
- Explanation caching hashes content with **sha256 hex of the UTF-8 string** on both the backend (`node:crypto`) and the studio server component, so comparisons are consistent.
- Backend seed command: `pnpm db:seed` (= `tsx prisma/seed.ts`); full reset: `pnpm db:reset`. Frontend has no `.prose-lesson`; lesson page still uses the inline `renderBlock` (to be replaced).
- Supported coding languages (canonical ids): `python`, `javascript`, `typescript`, `html`, `css`, `go`, `rust`, `cpp`, `csharp`, `sql`. Robotics languages: `arduino`, `micropython`.
- Studio loads a snippet only into the editor — **never executes server-side**. Decode is wrapped in try/catch with a length cap; malformed → blank new project.
- Inline SVG / raw markdown HTML is rendered ONLY for seed-authored (trusted) content. Do not enable raw-HTML passthrough for user-supplied content.
- Frontend package manager is pnpm (monorepo). Backend seed runs via the backend's existing seed script.
- Commit after every task.

---

## File Structure

**Frontend (new):**
- `robocode-frontend/src/lib/studio/open-in-studio.ts` — encode/decode snippet URLs.
- `robocode-frontend/src/components/learn/markdown.tsx` — styled markdown renderer.
- `robocode-frontend/src/components/learn/code-block.tsx` — code card + Open-in-Studio button.
- `robocode-frontend/src/components/learn/mermaid-diagram.tsx` — client mermaid renderer.
- `robocode-frontend/src/components/learn/svg-figure.tsx` — inline SVG illustration.
- `robocode-frontend/src/components/learn/callout.tsx` — tip/info/warning box.
- `robocode-frontend/src/components/learn/lesson-body.tsx` — block dispatcher.
- `robocode-frontend/src/lib/studio/open-in-studio.test.ts` — helper unit tests.

**Frontend (modified):**
- `robocode-frontend/src/app/app/learn/[slug]/[lessonSlug]/page.tsx` — use `LessonBody`.
- `robocode-frontend/src/app/studio/[projectId]/page.tsx` — decode `code`/`lang`/`board`.
- `robocode-frontend/src/components/studio/studio-header.tsx` — title "RoboCode Studio".
- `robocode-frontend/src/app/globals.css` — `.prose-lesson` styles.
- `robocode-frontend/package.json` — new deps.

**Backend (new):**
- `robocode-backend/prisma/content/types.ts` — `CourseModule` types + block helpers.
- `robocode-backend/prisma/content/_assets.ts` — shared SVG/mermaid snippets.
- `robocode-backend/prisma/content/intro-robotics.ts`
- `robocode-backend/prisma/content/coding-arduino.ts`
- `robocode-backend/prisma/content/ai-foundations.ts`
- `robocode-backend/prisma/content/lang-*.ts` — 12 language courses.
- `robocode-backend/prisma/content/index.ts` — aggregates demo + language modules.

**Backend (modified):**
- `robocode-backend/prisma/seed.ts` — consume content modules.

---

## SLICE A — Plumbing

### Task 1: Add frontend dependencies (mermaid + syntax highlighter)

**Files:**
- Modify: `robocode-frontend/package.json`, `robocode-frontend/pnpm-lock.yaml`

No CSS in this task — lessons reuse the existing `.md-body` class (see Global Constraints). The `md-body` polish for the explainer's walkthrough lives in Task 6B.

- [ ] **Step 1: Install deps inside the frontend repo**

```bash
cd robocode-frontend
pnpm add mermaid react-syntax-highlighter
pnpm add -D @types/react-syntax-highlighter
```
Expected: `robocode-frontend/package.json` + `robocode-frontend/pnpm-lock.yaml` updated, no errors.

- [ ] **Step 2: Verify it still typechecks**

```bash
cd robocode-frontend && pnpm typecheck
```
Expected: PASS (no new errors).

- [ ] **Step 3: Commit (in the frontend repo, on feature/content-library)**
```bash
git -C robocode-frontend add package.json pnpm-lock.yaml
git -C robocode-frontend commit -m "feat(learn): add mermaid + react-syntax-highlighter deps"
```

---

### Task 2: Open-in-Studio URL helper

No test framework in this repo — verify with typecheck + a `node`/`tsx` round-trip sanity check.

**Files:**
- Create: `robocode-frontend/src/lib/studio/open-in-studio.ts`

**Interfaces:**
- Produces:
  - `encodeStudioCode(code: string): string` — base64url, no padding.
  - `decodeStudioCode(param: string): string | null` — null on malformed/oversized.
  - `studioHref(language: string, code: string): string` — full relative URL.
  - `STUDIO_CODE_MAX = 8000` — max decoded length.
  - `ROBOTICS_LANGS = ["arduino", "micropython"]`.

- [ ] **Step 1: Write the implementation**

```ts
// URL helpers for opening a code snippet directly in the RoboCode Studio.
// Snippets are base64url-encoded into the studio URL; the studio page decodes
// them into an unsaved editor buffer (never executed server-side).

export const STUDIO_CODE_MAX = 8000;
export const ROBOTICS_LANGS = ["arduino", "micropython"] as const;

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

- [ ] **Step 2: Typecheck + runtime sanity check**

```bash
cd robocode-frontend && pnpm typecheck
npx tsx -e "import('./src/lib/studio/open-in-studio.ts').then(m=>{const c='print(\"Héllo 🌍\")';const r=m.decodeStudioCode(m.encodeStudioCode(c));console.assert(r===c,'roundtrip');console.assert(m.decodeStudioCode('!!!')===null,'malformed');console.assert(m.decodeStudioCode(m.encodeStudioCode('x'.repeat(9000)))===null,'oversize');const h=m.studioHref('python','print(1)');console.assert(h.includes('mode=coding')&&h.includes('lang=python')&&h.includes('code='),'coding href');const a=m.studioHref('arduino','void setup(){}');console.assert(a.includes('mode=robotics')&&a.includes('board=arduino-uno'),'robotics href');console.log('open-in-studio sanity OK')})"
```
Expected: typecheck PASS; the node check prints `open-in-studio sanity OK` with no assertion failures. (If `tsx` isn't resolvable, run the equivalent check against the compiled output or skip — typecheck + the Task reviewer are the gate.)

- [ ] **Step 3: Commit (frontend repo)**
```bash
git -C robocode-frontend add src/lib/studio/open-in-studio.ts
git -C robocode-frontend commit -m "feat(studio): add open-in-studio URL encode/decode helper"
```

---

### Task 3: Lesson rich-block components

**Files:**
- Create: `robocode-frontend/src/components/learn/markdown.tsx`
- Create: `robocode-frontend/src/components/learn/code-block.tsx`
- Create: `robocode-frontend/src/components/learn/mermaid-diagram.tsx`
- Create: `robocode-frontend/src/components/learn/svg-figure.tsx`
- Create: `robocode-frontend/src/components/learn/callout.tsx`
- Create: `robocode-frontend/src/components/learn/lesson-body.tsx`

**Interfaces:**
- Produces (block type shapes consumed by Task 4 and by seed content):
  - `markdown` → `{ type: "markdown"; text: string }`
  - `code` → `{ type: "code"; language: string; code: string; filename?: string; openInStudio?: boolean }`
  - `mermaid` → `{ type: "mermaid"; chart: string; caption?: string }`
  - `svg` → `{ type: "svg"; svg: string; caption?: string }`
  - `callout` → `{ type: "callout"; variant?: "tip" | "info" | "warning"; text: string }`
  - `export type LessonBlock = ...union...`
  - `export function LessonBody({ blocks }: { blocks: LessonBlock[] })`

- [ ] **Step 1: Markdown renderer**

Create `markdown.tsx` (reuses the existing `.md-body` class — see Global Constraints):
```tsx
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/** Renders trusted lesson markdown as styled HTML using the shared `.md-body`
 *  typography. Standalone runnable examples use the dedicated `code` block type. */
export function Markdown({ text }: { text: string }) {
  return (
    <div className="md-body">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
    </div>
  );
}
```

- [ ] **Step 2: Code block with Open-in-Studio button**

Create `code-block.tsx`:
```tsx
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Button } from "@/components/ui/button";
import { studioHref } from "@/lib/studio/open-in-studio";

const PRISM_LANG: Record<string, string> = {
  python: "python", javascript: "javascript", typescript: "typescript",
  html: "markup", css: "css", go: "go", rust: "rust", cpp: "cpp",
  csharp: "csharp", sql: "sql", arduino: "cpp", micropython: "python",
};

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
      <SyntaxHighlighter
        language={PRISM_LANG[language] ?? "text"}
        style={oneDark}
        customStyle={{ margin: 0, background: "transparent", fontSize: "0.85rem" }}
      >
        {code.replace(/\n$/, "")}
      </SyntaxHighlighter>
    </figure>
  );
}
```

- [ ] **Step 3: Mermaid diagram (client component)**

Create `mermaid-diagram.tsx`:
```tsx
"use client";
import * as React from "react";

/** Lazy mermaid render. mermaid is browser-only and heavy, so it is imported on
 *  the client at mount time. */
export function MermaidDiagram({ chart, caption }: { chart: string; caption?: string }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [svg, setSvg] = React.useState<string>("");

  React.useEffect(() => {
    let active = true;
    (async () => {
      const mermaid = (await import("mermaid")).default;
      mermaid.initialize({ startOnLoad: false, theme: "neutral", securityLevel: "strict" });
      try {
        const id = "m" + Math.abs(hash(chart)).toString(36);
        const { svg } = await mermaid.render(id, chart);
        if (active) setSvg(svg);
      } catch {
        if (active) setSvg("");
      }
    })();
    return () => { active = false; };
  }, [chart]);

  return (
    <figure className="my-6 flex flex-col items-center gap-2">
      <div
        ref={ref}
        className="w-full overflow-x-auto rounded-xl border border-border bg-card p-4 [&_svg]:mx-auto"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      {caption && <figcaption className="text-center text-sm text-muted-foreground">{caption}</figcaption>}
    </figure>
  );
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h;
}
```

- [ ] **Step 4: SVG figure**

Create `svg-figure.tsx`:
```tsx
/** Renders a trusted, seed-authored inline SVG illustration. */
export function SvgFigure({ svg, caption }: { svg: string; caption?: string }) {
  return (
    <figure className="my-6 flex flex-col items-center gap-2">
      <div
        className="w-full max-w-xl overflow-x-auto rounded-xl border border-border bg-card p-4 [&_svg]:mx-auto [&_svg]:h-auto [&_svg]:max-w-full"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      {caption && <figcaption className="text-center text-sm text-muted-foreground">{caption}</figcaption>}
    </figure>
  );
}
```

- [ ] **Step 5: Callout**

Create `callout.tsx`:
```tsx
import { Info, Lightbulb, TriangleAlert } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const VARIANTS = {
  tip: { icon: Lightbulb, cls: "border-primary/30 bg-primary/5" },
  info: { icon: Info, cls: "border-sky-500/30 bg-sky-500/5" },
  warning: { icon: TriangleAlert, cls: "border-amber-500/30 bg-amber-500/5" },
} as const;

export function Callout({ variant = "tip", text }: { variant?: keyof typeof VARIANTS; text: string }) {
  const { icon: Icon, cls } = VARIANTS[variant];
  return (
    <div className={`my-5 flex gap-3 rounded-xl border p-4 ${cls}`}>
      <Icon className="mt-0.5 size-5 shrink-0 text-foreground/70" />
      <div className="md-body text-sm">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: LessonBody dispatcher**

Create `lesson-body.tsx`:
```tsx
import { Markdown } from "./markdown";
import { CodeBlock } from "./code-block";
import { MermaidDiagram } from "./mermaid-diagram";
import { SvgFigure } from "./svg-figure";
import { Callout } from "./callout";

export type LessonBlock =
  | { type: "markdown"; text: string }
  | { type: "code"; language: string; code: string; filename?: string; openInStudio?: boolean }
  | { type: "mermaid"; chart: string; caption?: string }
  | { type: "svg"; svg: string; caption?: string }
  | { type: "callout"; variant?: "tip" | "info" | "warning"; text: string }
  | { type: string; [k: string]: unknown };

export function LessonBody({ blocks }: { blocks: LessonBlock[] }) {
  return (
    <div className="space-y-1">
      {blocks.map((b, i) => {
        switch (b.type) {
          case "markdown":
            return <Markdown key={i} text={String((b as { text?: string }).text ?? "")} />;
          case "code":
            return <CodeBlock key={i} {...(b as { language: string; code: string; filename?: string; openInStudio?: boolean })} />;
          case "mermaid":
            return <MermaidDiagram key={i} {...(b as { chart: string; caption?: string })} />;
          case "svg":
            return <SvgFigure key={i} {...(b as { svg: string; caption?: string })} />;
          case "callout":
            return <Callout key={i} {...(b as { variant?: "tip" | "info" | "warning"; text: string })} />;
          default:
            return null;
        }
      })}
    </div>
  );
}
```

- [ ] **Step 7: Verify typecheck**

Run: `pnpm --filter robocode-frontend exec tsc --noEmit`
Expected: PASS. (If `react-syntax-highlighter` style import path errors, confirm it resolves to `react-syntax-highlighter/dist/esm/styles/prism`; that is the correct ESM path.)

- [ ] **Step 8: Commit**
```bash
git add robocode-frontend/src/components/learn/
git commit -m "feat(learn): rich lesson block components (markdown, code, mermaid, svg, callout)"
```

---

### Task 4: Wire LessonBody into the lesson page

**Files:**
- Modify: `robocode-frontend/src/app/app/learn/[slug]/[lessonSlug]/page.tsx`

**Interfaces:**
- Consumes: `LessonBody`, `LessonBlock` from `@/components/learn/lesson-body`.

- [ ] **Step 1: Replace the inline renderer and body type**

In `page.tsx`:
1. Delete the `renderBlock` function (lines ~19-73).
2. Add import near the other `@/components/learn` import:
```tsx
import { LessonBody, type LessonBlock } from "@/components/learn/lesson-body";
```
3. Change the `BodyBlock` type (line ~75) to:
```tsx
type BodyBlock = LessonBlock;
```
4. Replace the body-rendering JSX (the `<Card className="p-6 sm:p-8">` block, lines ~190-208) with:
```tsx
            <Card className="p-6 sm:p-8">
              <LessonBody blocks={blocks} />
            </Card>
```
Leave the empty-state branch (`blocks.length === 0`) unchanged.

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter robocode-frontend exec tsc --noEmit`
Expected: PASS. The legacy seed shape `{ type: "markdown", text }` still satisfies `LessonBlock`.

- [ ] **Step 3: Commit**
```bash
git add robocode-frontend/src/app/app/learn/[slug]/[lessonSlug]/page.tsx
git commit -m "feat(learn): render lessons with rich LessonBody blocks"
```

---

### Task 5: Studio decodes snippet from the URL

**Files:**
- Modify: `robocode-frontend/src/app/studio/[projectId]/page.tsx`

**Interfaces:**
- Consumes: `decodeStudioCode` from `@/lib/studio/open-in-studio`; `CODE_LANG_MAP`, `type CodeLang` from `@/lib/studio/coding`.

- [ ] **Step 1: Add imports**

At the top of `page.tsx`:
```tsx
import { decodeStudioCode } from "@/lib/studio/open-in-studio";
import { CODE_LANG_MAP, type CodeLang } from "@/lib/studio/coding";
```

- [ ] **Step 2: Widen searchParams**

Change the `searchParams` type (line ~55) to:
```tsx
  searchParams: Promise<{ task?: string; mode?: string; lang?: string; code?: string; board?: string }>;
```
And the destructure (line ~57) to:
```tsx
  const [{ projectId }, { task: taskSlug, mode, lang, code, board }] = await Promise.all([params, searchParams]);
```

- [ ] **Step 3: Handle the snippet in the `projectId === "new"` branch**

Immediately inside `if (projectId === "new") {`, before the existing `let title = ...`, insert a snippet short-circuit:
```tsx
    const snippet = code ? decodeStudioCode(code) : null;
    if (snippet && mode === "coding") {
      await getPageUser();
      const codeLang = (CODE_LANG_MAP[lang as CodeLang] ? (lang as CodeLang) : "python");
      const meta = CODE_LANG_MAP[codeLang];
      const fileName = `main.${meta.ext}`;
      const diagram = emptyDiagram("arduino-uno");
      return (
        <StudioClient
          initial={{
            projectId: "new",
            title: `${meta.label} snippet`,
            kind: "coding",
            diagram,
            files: buildFiles([], "Snippet", diagram, ""),
            codingFiles: [{ name: fileName, content: snippet }],
          }}
        />
      );
    }
    if (snippet && mode !== "coding") {
      await getPageUser();
      const boardId = board ?? "arduino-uno";
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
The rest of the `new` branch (task starter / blank) stays as-is.

- [ ] **Step 4: Typecheck**

Run: `pnpm --filter robocode-frontend exec tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Manual verification (dev server)**

Run the frontend dev server, then open:
- `/studio/new?mode=coding&lang=python&code=cHJpbnQoIkhpIik` → Coding Studio opens with `main.py` containing `print("Hi")`.
- `/studio/new?mode=robotics&board=arduino-uno&code=dm9pZCBzZXR1cCgpe30` → Robotics Studio opens with `sketch.ino` containing `void setup(){}`.
- `/studio/new?mode=coding&lang=python&code=!!!bad` → falls back to a blank coding project (no crash).

(Use `studioHref` / `encodeStudioCode` in a node REPL to generate fresh params if needed.)

- [ ] **Step 6: Commit**
```bash
git add robocode-frontend/src/app/studio/[projectId]/page.tsx
git commit -m "feat(studio): load a code snippet from the URL into a new project"
```

---

### Task 6: Studio title says "RoboCode Studio"

**Files:**
- Modify: `robocode-frontend/src/components/studio/studio-header.tsx`

- [ ] **Step 1: Pass the name prop**

Change line ~18 from:
```tsx
      <BrandLogo href="/app" className="shrink-0" />
```
to:
```tsx
      <BrandLogo href="/app" name="RoboCode Studio" className="shrink-0" />
```
(`BrandLogo` already accepts `name`; default elsewhere stays "RoboCode.Africa".)

- [ ] **Step 2: Verify**

Run: `pnpm --filter robocode-frontend exec tsc --noEmit` → PASS. In the dev server, open any studio page and confirm the header wordmark reads "RoboCode Studio".

- [ ] **Step 3: Commit**
```bash
git add robocode-frontend/src/components/studio/studio-header.tsx
git commit -m "fix(studio): header wordmark reads 'RoboCode Studio'"
```

---

### Task 6B: Studio Code Explainer renders nicely formatted HTML/CSS

**Context:** The user's screenshot (from production) shows the Explanation panel as raw
markdown. The current branch already renders it via `<Markdown remarkPlugins={[remarkGfm]}>`
in a `md-body` div (`coding-studio.tsx:393-396`), and the backend explain prompt
(`ai.service.ts:111-115`) returns GitHub-flavoured Markdown. So this task is verify + polish,
not a rebuild. Do NOT change the backend prompt.

**Files:**
- Modify: `robocode-frontend/src/app/globals.css` (the `.md-body` rules)
- Verify only: `robocode-frontend/src/components/studio/coding-studio.tsx`

- [ ] **Step 1: Confirm the render path**

Read `coding-studio.tsx` around lines 387-398 and confirm the explain/validate output is
wrapped in `<div className="md-body text-sm"><Markdown remarkPlugins={[remarkGfm]}>...`.
Expected: it is. No code change needed here. (If a future regression shows plain `<pre>`,
restore the `<Markdown>` wrapper.)

- [ ] **Step 2: Polish md-body for the walkthrough pattern**

The explainer emits bullets like `` - `code line` `` followed by a short explanation. Tighten
the list rhythm and make inline-code chips read well. In `globals.css`, update these `.md-body`
rules (replace the existing `li` rule and add the two new rules):
```css
.md-body li { margin: 0.35rem 0; }
.md-body li > code:first-child { display: inline-block; margin-bottom: 0.15rem; }
.md-body ul ul, .md-body ol ol { margin-top: 0.3rem; }
```
Keep all other `.md-body` rules unchanged.

- [ ] **Step 3: Verify in the dev server**

Open a coding project in the Studio, click **Code Explainer**. Expected: the Explanation panel
shows a styled summary paragraph, bulleted walkthrough with grey inline-code chips (no literal
backticks), and comfortable spacing — visually consistent with the lesson pages. Repeat with
**Validate with AI** to confirm the Validation panel is equally clean.

- [ ] **Step 4: Commit**
```bash
git add robocode-frontend/src/app/globals.css
git commit -m "fix(studio): polish Code Explainer markdown formatting"
```

> Note for the team: production still shows raw markdown until this branch
> (`refactor/frontend-backend-split`) is deployed — the rendering fix lives here, not in the
> currently-deployed monolith.

---

## SLICE A2 — Persisted, cache-invalidated code explanations

### Task 6C: Schema — explanation columns on CodeFile

**Files:**
- Modify: `robocode-backend/prisma/schema.prisma` (the `CodeFile` model)

- [ ] **Step 1: Add columns**

In the `CodeFile` model, add after the existing `content` field:
```prisma
  explanation     String?
  explanationHash String?   // sha256 hex of the content this explanation was generated from
  explanationAt   DateTime?
```

- [ ] **Step 2: Hand-author a migration file (match the existing convention)**

This repo uses `prisma db push` for dev and keeps hand-authored migration files (9 exist under `prisma/migrations/`). Look at the newest one (`prisma/migrations/20260621100000_project_ai_score/migration.sql`) for the format, then create `prisma/migrations/20260621110000_codefile_explanation/migration.sql`:
```sql
-- AlterTable
ALTER TABLE "CodeFile" ADD COLUMN "explanation" TEXT;
ALTER TABLE "CodeFile" ADD COLUMN "explanationHash" TEXT;
ALTER TABLE "CodeFile" ADD COLUMN "explanationAt" TIMESTAMP(3);
```
(Use a timestamp later than the newest existing migration. Confirm the column SQL types match how Prisma maps `String?`→`TEXT` and `DateTime?`→`TIMESTAMP(3)` in the existing migrations.)

- [ ] **Step 3: Regenerate the Prisma client**

```bash
cd robocode-backend && pnpm db:generate
```
Expected: client regenerates with the new fields. (If a dev DB is reachable, `pnpm db:push` syncs it; otherwise the migration file + `db:generate` are sufficient for the build.) Then `pnpm typecheck` → PASS.

- [ ] **Step 4: Commit (backend repo)**
```bash
git -C robocode-backend add prisma/schema.prisma prisma/migrations/20260621110000_codefile_explanation
git -C robocode-backend commit -m "feat(db): persist code explanation on CodeFile"
```

---

### Task 6D: Backend — cache explanations in /ai/explain-code

**Files:**
- Modify: `robocode-backend/src/modules/ai/dto.ts` (`explainCodeSchema`)
- Modify: `robocode-backend/src/modules/ai/ai.controller.ts` (pass `projectId`)
- Modify: `robocode-backend/src/modules/ai/ai.service.ts` (`explainCode`, `ExplainCodeResult`)
- Test: `robocode-backend/src/modules/ai/ai.service.spec.ts` (or the repo's existing test file for ai)

**Interfaces:**
- Consumes: `PrismaService` (already injected in `AiService`); role helpers from `@/domain/roles` (e.g. `isStaff`).
- Produces: `explainCode(user, language, code, filename?, projectId?)` returning `ExplainCodeResult & { cached?: boolean }`.

No test framework in this repo — verify with `pnpm typecheck` + `pnpm lint`; the Task reviewer is the correctness gate.

- [ ] **Step 1: Extend the DTO (keep the existing enum)**

In `dto.ts`, add ONLY `projectId` to the existing `explainCodeSchema` (do not change `language`/`code`):
```ts
export const explainCodeSchema = z.object({
  language: z.enum(CODE_LANGUAGES),
  code: z.string().min(1).max(20000),
  filename: z.string().max(120).optional(),
  projectId: z.string().max(40).optional(),
});
```

- [ ] **Step 2: Pass projectId from the controller**

In `ai.controller.ts`, update the `explainCode` handler (keep the existing `@RequireActive()` decorator):
```ts
  explainCode(@CurrentUser() user: AuthUser, @Body(new ZodPipe(explainCodeSchema)) body: ExplainCodeInput) {
    return this.ai.explainCode(user, body.language, body.code, body.filename, body.projectId);
  }
```

- [ ] **Step 3: Add `cached` to the result type**

In `dto.ts` where `ExplainCodeResult` is declared, add `cached?: boolean;`.

- [ ] **Step 4: Implement caching in `explainCode`**

Add at the top of `ai.service.ts`: `import { createHash } from "node:crypto";` and `import { isStaff } from "../../domain/roles";` (confirm the relative path matches the file's location — `src/modules/ai/ai.service.ts` → `../../domain/roles`).

Add a private read-access helper:
```ts
  private canReadProject(user: AuthUser, p: { ownerId: string; tenantId: string | null; visibility: string }): boolean {
    if (p.ownerId === user.id) return true;
    if (p.visibility === "public") return true;
    if (p.tenantId && p.tenantId === user.tenantId) return p.visibility !== "private" || isStaff(user.role);
    return false;
  }
```

Replace the body of `explainCode` with:
```ts
  async explainCode(user: AuthUser | null, language: string, code: string, filename?: string, projectId?: string): Promise<ExplainCodeResult> {
    const cfg = this.resolveConfig(user);
    const hash = createHash("sha256").update(code).digest("hex");

    // Try the persisted cache first.
    let codeFile: { id: string; explanation: string | null; explanationHash: string | null } | null = null;
    if (user && projectId && projectId !== "new" && filename) {
      const project = await this.prisma.project.findUnique({
        where: { id: projectId },
        select: { ownerId: true, tenantId: true, visibility: true },
      });
      if (project && this.canReadProject(user, project)) {
        codeFile = await this.prisma.codeFile.findFirst({
          where: { projectId, filename },
          select: { id: true, explanation: true, explanationHash: true },
        });
        if (codeFile?.explanation && codeFile.explanationHash === hash) {
          return { ok: true, configured: true, explanation: codeFile.explanation, cached: true };
        }
      }
    }

    if (!cfg.apiKey) {
      return { ok: false, configured: false, text: "AI isn't configured yet. Add an AI model and API key in Settings (or ask your school admin)." };
    }
    const label = CODE_LANG_LABELS[language] ?? language;
    const prompt = `Language: ${label}${filename ? `\nFile: ${filename}` : ""}\n\nExplain this code line by line:\n\`\`\`\n${code.slice(0, 16000)}\n\`\`\``;
    try {
      const raw = (await this.rawChat(EXPLAIN_CODE_SYSTEM, prompt, cfg, false))?.trim();
      if (!raw) return { ok: false, configured: true, text: "AI request failed." };
      if (codeFile) {
        await this.prisma.codeFile.update({
          where: { id: codeFile.id },
          data: { explanation: raw, explanationHash: hash, explanationAt: new Date() },
        });
      }
      return { ok: true, configured: true, explanation: raw, cached: false };
    } catch (e) {
      return { ok: false, configured: true, text: `Could not reach the AI provider (${cfg.provider}): ${(e as Error).message}` };
    }
  }
```

- [ ] **Step 5: Verify**

```bash
cd robocode-backend && pnpm typecheck && pnpm lint
```
Expected: both PASS. Sanity-reason through the cache path: identical code + matching `explanationHash` → returns `cached:true` without calling `rawChat`; changed code → hash mismatch → AI call + re-persist.

- [ ] **Step 6: Commit (backend repo)**
```bash
git -C robocode-backend add src/modules/ai/dto.ts src/modules/ai/ai.controller.ts src/modules/ai/ai.service.ts
git -C robocode-backend commit -m "feat(ai): cache code explanations per file with hash invalidation"
```

---

### Task 6E: Frontend — auto-display persisted explanation + edit invalidation

**Files:**
- Modify: `robocode-frontend/src/lib/studio/coding-actions.ts` (`explainCodeAction`, `ExplainCodeResult`)
- Modify: `robocode-frontend/src/app/studio/[projectId]/page.tsx` (compute + pass explanations)
- Modify: `robocode-frontend/src/components/studio/studio-app.tsx` (`StudioInitial`, thread prop)
- Modify: `robocode-frontend/src/components/studio/coding-studio.tsx` (state, auto-show, reuse/refetch)

**Interfaces:**
- Consumes: backend `cached?: boolean` field; `decodeStudioCode` unaffected.
- Produces: `StudioInitial.codingExplanations?: Record<string, { text: string; current: boolean }>`; `CodingStudio` prop `initialExplanations`.

- [ ] **Step 1: Pass projectId from the action**

In `coding-actions.ts`, add `cached?: boolean;` to `ExplainCodeResult`, and update `explainCodeAction`:
```ts
export async function explainCodeAction(language: string, code: string, filename?: string, projectId?: string): Promise<ExplainCodeResult> {
  try {
    return await apiPost<ExplainCodeResult>("/ai/explain-code", { language, code, filename, projectId });
  } catch (e) {
    if (e instanceof ApiError) return { ok: false, configured: true, text: e.message };
    throw e;
  }
}
```

- [ ] **Step 2: Compute explanations in the studio page**

In `studio/[projectId]/page.tsx`:
1. Add `import { createHash } from "crypto";` at the top.
2. Extend the `StudioCodeFile` interface:
```tsx
interface StudioCodeFile {
  filename: string;
  content: string;
  explanation?: string | null;
  explanationHash?: string | null;
}
```
3. In the saved-project branch (after `project` is fetched), build the map and pass it:
```tsx
  const codingExplanations: Record<string, { text: string; current: boolean }> = {};
  if (kind === "coding") {
    for (const f of project.codeFiles) {
      if (f.explanation) {
        const current = f.explanationHash === createHash("sha256").update(f.content).digest("hex");
        codingExplanations[f.filename] = { text: f.explanation, current };
      }
    }
  }
```
Then add `codingExplanations` to the `initial` prop passed to `<StudioClient>` in that branch:
```tsx
        codingExplanations: kind === "coding" ? codingExplanations : undefined,
```

- [ ] **Step 3: Extend StudioInitial and thread the prop**

In `studio-app.tsx`:
1. Add to `StudioInitial`:
```tsx
  /** For coding projects: persisted explanations per file, with whether they match current content. */
  codingExplanations?: Record<string, { text: string; current: boolean }>;
```
2. Pass it to `CodingStudio`:
```tsx
          <CodingStudio projectId={initial.projectId} projectKind={initial.kind ?? "robotics"} initialFiles={initial.codingFiles} initialExplanations={initial.codingExplanations} />
```

- [ ] **Step 4: Auto-display + reuse/refetch in CodingStudio**

In `coding-studio.tsx`:
1. Add `initialExplanations` to the props:
```tsx
export function CodingStudio({
  projectId,
  projectKind = "robotics",
  initialFiles,
  initialExplanations,
}: {
  projectId: string;
  projectKind?: "robotics" | "coding";
  initialFiles?: CodeFile[];
  initialExplanations?: Record<string, { text: string; current: boolean }>;
}) {
```
2. Add explanation memory state (after the `output`/`busy` state declarations, ~line 58):
```tsx
  const [explained, setExplained] = React.useState<Record<string, { text: string; content: string }>>(() => {
    const seed: Record<string, { text: string; content: string }> = {};
    if (isCodingProject && initialExplanations) {
      for (const f of initialFiles!) {
        const e = initialExplanations[f.name];
        if (e?.current) seed[f.name] = { text: e.text, content: f.content };
      }
    }
    return seed;
  });
```
3. Auto-show the active file's current explanation once on mount (add a new effect near the other effects, ~line 102):
```tsx
  const didAutoShow = React.useRef(false);
  React.useEffect(() => {
    if (didAutoShow.current) return;
    didAutoShow.current = true;
    const e = explained[activeFile];
    if (e && e.content === active.content) setOutput({ mode: "explain", text: e.text });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
```
4. Replace the `explain` function (~lines 166-176) with a reuse-then-fetch version:
```tsx
  async function explain(thenSpeak = false) {
    const cached = explained[active.name];
    if (cached && cached.content === active.content) {
      setOutput({ mode: "explain", text: cached.text });
      if (thenSpeak) void speak(cached.text);
      return;
    }
    setBusy("explain");
    setOutput({ mode: "explain", text: "Explaining…" });
    try {
      const r = await explainCodeAction(lang, active.content, active.name, isCodingProject ? projectId : undefined);
      const text = r.ok && r.explanation ? r.explanation : r.text || "Couldn't explain.";
      setOutput({ mode: "explain", text });
      if (r.ok && r.explanation) {
        setExplained((m) => ({ ...m, [active.name]: { text: r.explanation as string, content: active.content } }));
        if (thenSpeak) void speak(r.explanation);
      }
    } finally {
      setBusy(null);
    }
  }
```
(Keep the existing `speak`-on-explain wiring at line ~215-216 working: it calls `explain(true)` when there's no explanation yet — unchanged.)

- [ ] **Step 5: Typecheck**

Run: `pnpm --filter robocode-frontend exec tsc --noEmit` → PASS.

- [ ] **Step 6: Manual verification (dev server, requires AI configured + a saved coding project)**

- Open a saved coding project, click **Code Explainer** → explanation appears (network call).
- Click **Clear**, then **Code Explainer** again → explanation reappears instantly (the backend returns `cached:true`; in-memory reuse means no spinner).
- Reload the page → the Explanation panel shows the persisted explanation automatically.
- Edit the code, click **Code Explainer** → a fresh explanation is fetched (hash mismatch) and re-persisted.

- [ ] **Step 7: Commit**
```bash
git add robocode-frontend/src/lib/studio/coding-actions.ts robocode-frontend/src/app/studio/[projectId]/page.tsx robocode-frontend/src/components/studio/studio-app.tsx robocode-frontend/src/components/studio/coding-studio.tsx
git commit -m "feat(studio): auto-display persisted code explanation, refetch on edit"
```

---

## SLICE B — Content infrastructure + demo course rewrites

### Task 7: Content module infrastructure

**Files:**
- Create: `robocode-backend/prisma/content/types.ts`
- Create: `robocode-backend/prisma/content/_assets.ts`
- Create: `robocode-backend/prisma/content/index.ts`
- Modify: `robocode-backend/prisma/seed.ts`

**Interfaces:**
- Produces:
  - `types.ts`: block constructors + `CourseModule` type.
  - `index.ts`: `export const CONTENT_MODULES: CourseModule[]` (ordered).
  - `seed.ts`: `course()` is driven by `CONTENT_MODULES`; the `intro-robotics` module's created course is still captured for enrollments.

- [ ] **Step 1: Block + module types and constructors**

Create `prisma/content/types.ts`:
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
  language: string, code: string, opts: { filename?: string; openInStudio?: boolean } = {},
): Block => ({ type: "code", language, code, openInStudio: true, ...opts });
export const mermaid = (chart: string, caption?: string): Block => ({ type: "mermaid", chart, caption });
export const svg = (svg: string, caption?: string): Block => ({ type: "svg", svg, caption });
export const callout = (variant: "tip" | "info" | "warning", text: string): Block => ({ type: "callout", variant, text });

export const body = (...blocks: Block[]) => ({ blocks });

export interface LessonDef {
  title: string;
  slug: string;
  estMinutes: number;
  contentType?: string;
  body: { blocks: Block[] };
}

export interface CourseModule {
  meta: {
    title: string; slug: string; track: string; level: string;
    description: string; coverImage: string; order: number;
  };
  lessons: LessonDef[];
  tasks?: Record<string, unknown>[];
}
```

- [ ] **Step 2: Shared illustration assets**

Create `prisma/content/_assets.ts` with reusable SVG strings used across courses. Provide at least these exports (author simple, labeled SVGs ~600×260, using `currentColor` strokes so they adapt to theme):
```ts
// Reusable inline SVG illustrations for courses. Keep them simple and labeled.
export const SVG_ARDUINO_BOARD = `<svg viewBox="0 0 600 260" role="img" aria-label="Arduino board with labeled pins" xmlns="http://www.w3.org/2000/svg">...`;
export const SVG_LED_CIRCUIT = `<svg viewBox="0 0 600 200" role="img" aria-label="LED in series with a resistor to pin 13">...`;
export const SVG_INPUT_PROCESS_OUTPUT = `<svg viewBox="0 0 600 160" role="img" aria-label="Input, process, output pipeline">...`;
```
Author the SVG bodies as real, valid markup (rectangles, lines, `<text>` labels). They must be self-contained (no external refs). Each must parse as valid XML.

- [ ] **Step 3: Aggregator**

Create `prisma/content/index.ts`:
```ts
import type { CourseModule } from "./types";
import { introRobotics } from "./intro-robotics";
import { codingArduino } from "./coding-arduino";
import { aiFoundations } from "./ai-foundations";
import { langPython } from "./lang-python";
import { langJavascript } from "./lang-javascript";
import { langTypescript } from "./lang-typescript";
import { langHtml } from "./lang-html";
import { langCss } from "./lang-css";
import { langGo } from "./lang-go";
import { langRust } from "./lang-rust";
import { langCpp } from "./lang-cpp";
import { langCsharp } from "./lang-csharp";
import { langSql } from "./lang-sql";
import { langArduino } from "./lang-arduino";
import { langMicropython } from "./lang-micropython";

export const DEMO_MODULES: CourseModule[] = [introRobotics, codingArduino, aiFoundations];
export const LANG_MODULES: CourseModule[] = [
  langPython, langJavascript, langTypescript, langHtml, langCss,
  langGo, langRust, langCpp, langCsharp, langSql, langArduino, langMicropython,
];
export const CONTENT_MODULES: CourseModule[] = [...DEMO_MODULES, ...LANG_MODULES];
```
NOTE: this file will not compile until Tasks 8-10 and 11-22 create the modules. Implement Step 4 (seed wiring) referencing `DEMO_MODULES` only first if executing tasks strictly in order; switch to `CONTENT_MODULES` after the language modules exist. To keep the build green between tasks, temporarily import only the modules that exist and expand the arrays as modules are added.

- [ ] **Step 4: Wire seed.ts to consume modules**

In `seed.ts`:
1. Add import at top: `import { introRobotics, codingArduino, aiFoundations } from "./content";` — actually import the arrays: `import { DEMO_MODULES } from "./content";` plus the demo tasks already defined inline (BLINK_CODE etc.). Because the demo tasks reference `blinkDiagram()`/`ULTRASONIC_CODE` defined in seed.ts, keep `tasks` for demo courses inside seed.ts and pass them in. Simplest: keep the three `course(...)` calls but replace their `lessons` array argument with `<module>.lessons` and their `meta` with `<module>.meta`, leaving the existing `tasks` arrays untouched.

Concretely, replace the `intro-robotics` call (lines ~502-513) with:
```ts
  const robotics = await course(
    introRobotics.meta,
    introRobotics.lessons,
    [
      { title: "Blink an LED", slug: "blink-led", description: "Make the on-board LED blink once per second.", track: "robotics", difficulty: "beginner", points: 50, boardType: "arduino-uno", starterCode: BLINK_CODE, starterDiagram: blinkDiagram(), checks: { rules: [{ type: "pin_toggles", pin: 13 }, { type: "serial_contains", value: "ready" }] } },
      { title: "Distance alarm", slug: "distance-alarm", description: "Sound the buzzer when an object is closer than 15 cm.", track: "robotics", difficulty: "intermediate", points: 100, boardType: "arduino-uno", starterCode: ULTRASONIC_CODE, starterDiagram: ultrasonicDiagram(), checks: { rules: [{ type: "serial_contains", value: "Distance" }] } },
    ],
  );
```
Do the same for `coding-arduino` (`codingArduino.meta`, `codingArduino.lessons`, existing countdown task) and `ai-foundations` (`aiFoundations.meta`, `aiFoundations.lessons`, existing gesture-light task). Import: `import { introRobotics, codingArduino, aiFoundations } from "./content";` (these are re-exported by index — add `export { introRobotics } from "./intro-robotics";` etc. to `index.ts`, OR import directly from the module files). Keep `lessonBody` only if still referenced; otherwise remove.

2. After the three demo `course(...)` calls, add a loop to seed the language courses:
```ts
  const { LANG_MODULES } = await import("./content");
  for (const m of LANG_MODULES) {
    await course(m.meta, m.lessons, m.tasks ?? []);
  }
```

- [ ] **Step 5: Update index.ts re-exports**

Add to `prisma/content/index.ts`:
```ts
export { introRobotics } from "./intro-robotics";
export { codingArduino } from "./coding-arduino";
export { aiFoundations } from "./ai-foundations";
```

- [ ] **Step 6: Commit (after Tasks 8-10 land, this compiles)**

This task's files reference modules created in Tasks 8-22. Commit this task together with Task 8 if executing in order, OR stub the three demo modules minimally first. Recommended: implement Tasks 8-10 before running the seed. Final commit:
```bash
git add robocode-backend/prisma/content/types.ts robocode-backend/prisma/content/_assets.ts robocode-backend/prisma/content/index.ts robocode-backend/prisma/seed.ts
git commit -m "feat(seed): content module infrastructure for rich courses"
```

---

### Task 8: Rewrite "Intro to Robotics" course content

**Files:**
- Create: `robocode-backend/prisma/content/intro-robotics.ts`

**Interfaces:**
- Consumes: `md, code, mermaid, svg, callout, body` from `./types`; `SVG_ARDUINO_BOARD, SVG_LED_CIRCUIT` from `./_assets`.
- Produces: `export const introRobotics: CourseModule`.

- [ ] **Step 1: Author the module**

Create `intro-robotics.ts` exporting `introRobotics` with `meta` matching the existing course (`{ title: "Intro to Robotics", slug: "intro-robotics", track: "robotics", level: "primary", description: "Meet the Arduino, light an LED, and read your first sensor.", coverImage: "/covers/robotics.svg", order: 1 }`) and **3 lessons** keeping the existing slugs (`what-is-mcu`, `first-led`, `reading-sensor`). Each lesson must include, in order:

- Lesson `what-is-mcu` (estMinutes 8): `md` intro (≥3 paragraphs: what a microcontroller is, the Arduino UNO, pins/power), `svg(SVG_ARDUINO_BOARD, "The Arduino UNO and its pins")`, `md` on the setup/loop model, `mermaid` flowchart of `setup() --> loop() --> loop()`, `callout("tip", ...)`.
- Lesson `first-led` (estMinutes 12): `md` explaining LEDs + resistors, `svg(SVG_LED_CIRCUIT, ...)`, `code("arduino", BLINK, { filename: "sketch.ino", openInStudio: true })` where BLINK is the standard pin-13 blink sketch, `md` line-by-line explanation, `callout("warning", "Always use a resistor ...")`.
- Lesson `reading-sensor` (estMinutes 15): `md` on the HC-SR04 ultrasonic sensor, `mermaid` sequence (trigger → echo → distance), `code("arduino", ULTRASONIC, { filename: "sketch.ino", openInStudio: true })` (read distance, print to serial), `md` explanation, `callout("tip", ...)`.

Use real, compilable Arduino code. Example BLINK:
```
void setup() {
  pinMode(13, OUTPUT);
  Serial.begin(9600);
  Serial.println("ready");
}
void loop() {
  digitalWrite(13, HIGH);
  delay(1000);
  digitalWrite(13, LOW);
  delay(1000);
}
```

- [ ] **Step 2: Typecheck backend**

Run: `pnpm --filter robocode-backend exec tsc --noEmit` (or the backend's typecheck script).
Expected: PASS once `index.ts` imports resolve.

- [ ] **Step 3: Commit**
```bash
git add robocode-backend/prisma/content/intro-robotics.ts
git commit -m "content: detailed Intro to Robotics course"
```

---

### Task 9: Rewrite "Coding with Arduino" course content

**Files:**
- Create: `robocode-backend/prisma/content/coding-arduino.ts`

**Interfaces:**
- Produces: `export const codingArduino: CourseModule`.

- [ ] **Step 1: Author the module**

`meta`: `{ title: "Coding with Arduino", slug: "coding-arduino", track: "coding", level: "high", description: "Variables, loops and functions — applied to real hardware.", coverImage: "/covers/coding.svg", order: 2 }`. Keep lesson slugs `variables`, `loops`; add a third `functions` lesson (estMinutes 12).

- `variables` (10 min): `md` on data types (`int`, `float`, `bool`, `char`, `String`), a `code("arduino", ...)` example declaring and printing variables (openInStudio), a markdown table of types/sizes, `callout("info", ...)`.
- `loops` (12 min): `md` on `for`/`while`, `mermaid` flowchart of a loop, `code("arduino", ...)` countdown 10→0 to serial (openInStudio), `md` explanation.
- `functions` (12 min): `md` on declaring/calling functions + parameters/return, `code("arduino", ...)` defining a `blinkTimes(int n)` helper (openInStudio), `callout("tip", ...)`.

- [ ] **Step 2: Typecheck + commit**
```bash
pnpm --filter robocode-backend exec tsc --noEmit
git add robocode-backend/prisma/content/coding-arduino.ts
git commit -m "content: detailed Coding with Arduino course"
```

---

### Task 10: Rewrite "AI Foundations" course content

**Files:**
- Create: `robocode-backend/prisma/content/ai-foundations.ts`

**Interfaces:**
- Produces: `export const aiFoundations: CourseModule`.
- Consumes: `SVG_INPUT_PROCESS_OUTPUT` from `./_assets`.

- [ ] **Step 1: Author the module**

`meta`: `{ title: "AI Foundations", slug: "ai-foundations", track: "ai", level: "high", description: "How machines learn — patterns, data and smart sensors.", coverImage: "/covers/ai.svg", order: 3 }`. Keep slugs `what-is-ai`, `smart-thresholds`; add a third `patterns-in-data` lesson.

- `what-is-ai` (10 min): `md` (what AI is, rules vs learning), `svg(SVG_INPUT_PROCESS_OUTPUT, "Data in → model → decision out")`, `mermaid` of a simple ML pipeline (data → train → predict), `callout("info", ...)`.
- `smart-thresholds` (12 min): `md` on decisions from sensor data, `code("arduino", ...)` reading a sensor and switching an LED on a threshold (openInStudio), `md` explanation, `callout("tip", ...)`.
- `patterns-in-data` (12 min): `md` on patterns/averages, a `code("python", ...)` snippet computing a moving average over readings (openInStudio → coding studio), `mermaid` or `svg` visual.

- [ ] **Step 2: Typecheck + commit**
```bash
pnpm --filter robocode-backend exec tsc --noEmit
git add robocode-backend/prisma/content/ai-foundations.ts
git commit -m "content: detailed AI Foundations course"
```

---

## SLICE C — Twelve language tutorial courses

Each language is its own task creating `prisma/content/lang-<id>.ts` exporting `export const lang<Id>: CourseModule`. All follow the **same lesson arc** (author real prose to match — do not copy placeholder text):

1. **Hello, <Language>** — what it is / where it runs; one runnable hello-world `code(...)` with `openInStudio: true`; one `svg` or `mermaid` visual; a `callout`.
2. **Variables & types** — core data types with a worked `code(...)` example (openInStudio) and a markdown table.
3. **Control flow** — conditionals + loops with a `code(...)` example (openInStudio) and a `mermaid` flowchart.
4. **Put it together** — a small worked program tying it together with a `code(...)` example (openInStudio).

`meta` template (substitute per language): `{ title: "<Language> Basics", slug: "lang-<id>", track: "<coding|robotics>", level: "high", description: "<one line>", coverImage: "/covers/coding.svg", order: <10+index> }`.

Use the canonical language id in every `code(...)` block so `studioHref` routes correctly:
`python, javascript, typescript, html, css, go, rust, cpp, csharp, sql` → coding studio; `arduino, micropython` → robotics studio.

**Reference hello-world snippets** (use these exact, working programs in Lesson 1; they mirror the Studio's own starters):

| Task | File | id | Hello-world snippet |
|---|---|---|---|
| 11 | `lang-python.ts` | `python` | `print("Hello, RoboCode!")` |
| 12 | `lang-javascript.ts` | `javascript` | `console.log("Hello, RoboCode!");` |
| 13 | `lang-typescript.ts` | `typescript` | `const msg: string = "Hello, RoboCode!";\nconsole.log(msg);` |
| 14 | `lang-html.ts` | `html` | `<!DOCTYPE html>\n<html><body><h1>Hello, RoboCode!</h1></body></html>` |
| 15 | `lang-css.ts` | `css` | (html+css pair styling an `h1`) |
| 16 | `lang-go.ts` | `go` | `package main\nimport "fmt"\nfunc main() { fmt.Println("Hello, RoboCode!") }` |
| 17 | `lang-rust.ts` | `rust` | `fn main() { println!("Hello, RoboCode!"); }` |
| 18 | `lang-cpp.ts` | `cpp` | `#include <iostream>\nint main(){ std::cout << "Hello, RoboCode!"; }` |
| 19 | `lang-csharp.ts` | `csharp` | `using System;\nclass P { static void Main(){ Console.WriteLine("Hello, RoboCode!"); } }` |
| 20 | `lang-sql.ts` | `sql` | `SELECT 'Hello, RoboCode!' AS greeting;` |
| 21 | `lang-arduino.ts` | `arduino` | pin-13 blink + `Serial.println("Hello, RoboCode!")` |
| 22 | `lang-micropython.ts` | `micropython` | `from machine import Pin\nled = Pin(2, Pin.OUT)\nled.on()\nprint("Hello, RoboCode!")` |

### Tasks 11-22: one per language

For each, repeat this structure (shown for Task 11; the others are identical in shape with the language's own id, snippets, types, and prose):

**Files:** Create `robocode-backend/prisma/content/lang-python.ts`

**Interfaces:** Produces `export const langPython: CourseModule`. Consumes `md, code, mermaid, svg, callout, body` from `./types`.

- [ ] **Step 1: Author the 4-lesson module** using the arc above. Lesson-1 `code` uses the snippet from the table with `openInStudio: true`. Every `code(...)` block uses language id `"python"`. Include at least one `mermaid` (control-flow lesson) and one `svg` or `mermaid` in Lesson 1. Write genuine explanatory prose (no "TODO"/placeholder text).
- [ ] **Step 2: Add the import + array entry** in `prisma/content/index.ts` (import `langPython`, include in `LANG_MODULES`). (If you pre-wrote the full `index.ts` in Task 7, this is already present — just ensure the file exists.)
- [ ] **Step 3: Typecheck** `pnpm --filter robocode-backend exec tsc --noEmit` → PASS.
- [ ] **Step 4: Commit** `git add robocode-backend/prisma/content/lang-python.ts robocode-backend/prisma/content/index.ts && git commit -m "content: Python Basics tutorial course"`

Repeat Tasks 12-22 for `javascript, typescript, html, css, go, rust, cpp, csharp, sql, arduino, micropython` using the table snippets and the correct language id. `html`/`css` tutorials are `render: true` languages — their Lesson-1 "Open in Studio" coding studio shows a live preview, so use the html-id for the HTML course and css-id for the CSS course (both open the coding studio). `arduino`/`micropython` courses use `track: "robotics"` and their `code` blocks open the robotics studio.

---

## Final verification (after all tasks)

- [ ] **Reseed the database.** Run the backend seed (e.g. `pnpm --filter robocode-backend exec prisma db seed`, or the documented seed command). Expected: completes without error.
- [ ] **Admin content count.** Visit `/app/admin/content`. Expected: **15 courses** (3 demo + 12 language) with non-trivial lesson counts (demo: 3/3/3; languages: 4 each).
- [ ] **Lesson rendering.** Open `intro-robotics/first-led` and `lang-python/<lesson-1-slug>`. Expected: styled markdown HTML, a syntax-highlighted code card, a rendered Mermaid/SVG figure, no console errors.
- [ ] **Open in Studio (coding).** On the Python Lesson-1 code card, click "Open in RoboCode Studio". Expected: Coding Studio opens in a new tab with `main.py` prefilled with the snippet.
- [ ] **Open in Studio (robotics).** On an Arduino lesson code card, click the button. Expected: Robotics Studio opens with `sketch.ino` prefilled.
- [ ] **Studio title.** Confirm the studio header reads "RoboCode Studio".
- [ ] **Code Explainer.** In a coding project, click Code Explainer — the Explanation panel shows formatted markdown (styled bullets, inline-code chips, no literal backticks), consistent with the lessons.
- [ ] **Explanation persistence.** Re-clicking Code Explainer on unchanged code reuses the stored explanation (no AI call); reloading the project auto-shows it; editing the code then clicking re-fetches a fresh one.
- [ ] **Typecheck both packages** pass; **no new lint errors** in touched files.

---

## Self-Review notes (coverage map)

- Spec §1 rich blocks → Tasks 1,3,4. §2 Open-in-Studio → Tasks 2,5. §3 twelve courses → Tasks 11-22 (+7 infra). §4 demo rewrites → Tasks 8-10. §5 studio title → Task 6. §6 studio Code Explainer formatting → Task 6B. §7 persisted explanations → Tasks 6C (schema), 6D (backend cache), 6E (frontend auto-display + invalidation). "Nicely formatted HTML/CSS for explanations" → Task 1 `.prose-lesson` (lessons) + Task 6B `md-body` (studio AI panels) + Task 3 `Markdown`. Visuals (SVG+Mermaid) → Task 3 components + `_assets.ts` + authored per course.
- Dependencies introduced (`mermaid`, `react-syntax-highlighter`) installed in Task 1 before first use in Task 3.
- All `code` block language ids align with `studioHref` routing (coding vs robotics) — verified against canonical id list in Global Constraints.
