# Mobile Parity — Phase 1: Rich Content + Content Library — Design

Date: 2026-06-22
Repo: `robocode-mobile` (own git repo, branch `main`, remote github.com/mosesmarimo/robocode-mobile)

## Context

`robocode-mobile` is a Flutter app already ~85% feature-complete vs the web app (auth, dashboard,
learn, projects, studio-via-WebView, challenges, competitions, teams, leaderboard, badges,
notifications, profile, settings, full social). The user wants **full parity** with
`robocode-frontend`, decomposed into 6 sequential phases. This is **Phase 1**.

The web Content Library was just overhauled (rich lesson blocks, 12 language tutorials,
"Open in RoboCode Studio"). Mobile's Learn lags badly: `lesson_screen.dart` flattens
`lesson.body.blocks[].text` into one string and renders regex "markdown-lite" (headings +
bullets only) — losing code samples, SVG illustrations, Mermaid diagrams, callouts, and
Open-in-Studio. No markdown/SVG/syntax-highlight dependencies exist.

## Decisions (confirmed with user)

- **All-native rendering**; Mermaid shown as a labeled code block (not rendered).
- SVG via `flutter_svg`. Markdown via `flutter_markdown_plus`. Code coloring via
  `flutter_highlight`/`highlight`.
- Build Phase 1 first, then proceed through Phases 2–6 sequentially.

## Current state (from code recon)

- `lib/screens/learn/lesson_screen.dart` — fetches `GET /learn/courses/:slug/lessons/:lessonSlug`;
  body is `{ blocks: [{type, text, ...}] }`; current `_renderBody` flattens to text + regex.
- Learn screens use `Map<String,dynamic>` (no model classes); `ApiClient.instance.get/post`.
- `lib/screens/studio_screen.dart` — WebView loads `${AppConfig.webBase}/studio/${projectId}`,
  injects JWT as `rc_session` cookie on the `webBase` host. Hardcoded to `/studio/:id`.
- `lib/config.dart` — `AppConfig.apiBase`, `AppConfig.webBase`.
- `lib/theme.dart` — `RoboTheme` (primary `#2563FF`, secondary `#16C79A`, accent `#FFB020`,
  ink `#0D1426`, `brandGradient`).
- `lib/widgets/common.dart` — reusable `AsyncView`, `BrandHeader`, `EmptyState`, `MiniChip`,
  `SectionTitle`, etc.
- `lib/router.dart` — `/learn`, `/learn/:slug`, `/learn/:slug/:lessonSlug`, `/studio/:id`.
- `pubspec.yaml` — has `dio`, `flutter_secure_storage`, `go_router`, `provider`,
  `webview_flutter`, `intl`. Missing: any markdown/SVG/highlight/url_launcher lib.
- Flutter `flutter_test` IS available → real unit/widget tests (unlike web/backend).

## Architecture

### 1. Dependencies (added to `robocode-mobile/pubspec.yaml`)

- `flutter_markdown_plus` — maintained fork of the discontinued official `flutter_markdown`;
  renders GFM (headings, lists, tables, bold, inline code, links, blockquotes) via `MarkdownBody`.
- `flutter_highlight` + `highlight` — language-aware code coloring for code blocks.
- `flutter_svg` — render seed-authored inline SVG illustrations.
- `url_launcher` — open external links tapped in markdown.

### 2. `ContentBlock` model — `lib/models/content.dart`

Typed parse of `lesson.body.blocks`, defensive `fromJson` (matching app style):

```
sealed/base ContentBlock with subtypes:
  MarkdownBlock { String text }
  CodeBlock     { String language; String code; String? filename; bool openInStudio }
  MermaidBlock  { String chart; String? caption }
  SvgBlock      { String svg; String? caption }
  CalloutBlock  { String variant; String text }   // tip | info | warning
  UnknownBlock  {}                                  // forward-compatible, renders nothing
```

`List<ContentBlock> parseBlocks(dynamic body)` reads `body['blocks']` and maps by `type`.

### 3. `RichContent` renderer — `lib/widgets/rich_content.dart`

`RichContent({ List<ContentBlock> blocks })` → `Column` dispatching by block type. The
**reusable rendering foundation** (Phase 2 social markdown reuses `MarkdownBody` styling):

- `MarkdownBlock` → `MarkdownBody` with a shared `MarkdownStyleSheet` derived from `RoboTheme`.
- `CodeBlock` → a rounded dark card: a header row (filename/language label + optional
  **"Open in RoboCode Studio"** button) over a `HighlightView` (mapped language). The button
  shows only when `openInStudio == true`; tapping it opens the Studio WebView at the
  `studioHref(language, code)` URL (see §4).
- `MermaidBlock` → a code card labeled "Mermaid diagram" rendering `chart` as monospace text
  (+ optional caption). (All-native decision.)
- `SvgBlock` → `SvgPicture.string(svg)` in a bordered card + optional caption; on parse error,
  fall back to a small "diagram" placeholder (never throw).
- `CalloutBlock` → tinted container (tip=primary, info=blue, warning=amber) with a leading icon
  and `MarkdownBody` text.

A `markdownStyleSheet(BuildContext)` helper centralizes typography so lessons and (Phase 2)
social posts look consistent.

### 4. Open in RoboCode Studio

- `lib/lib/studio/open_in_studio.dart` (or `lib/studio/open_in_studio.dart`) —
  `String studioHref(String language, String code)`:
  - `encodeStudioCode(code)` = base64url of UTF-8 bytes, **padding stripped** — byte-identical to
    the web `encodeStudioCode` so the same URL round-trips through the web studio's decoder.
  - Routing mirrors web: `arduino` → `mode=robotics&board=arduino-uno`; everything else →
    `mode=coding&lang=<language>`. (Web reduced `ROBOTICS_LANGS` to just `arduino`; match that —
    `micropython` routes to coding.)
  - Returns a path like `studio/new?mode=coding&lang=python&code=<b64url>`.
- `StudioScreen` generalized to accept either a `projectId` (loads `studio/<id>`) or a
  `launchPath` (loads `<path>` verbatim under `webBase`). Cookie auth injection is unchanged
  (same `webBase` origin). Add a router route to open a launch-path studio (e.g. `/studio-open`
  with the path passed via `extra`, or reuse `StudioScreen` with a named constructor).
- The `CodeBlock` "Open in RoboCode Studio" button calls
  `context.push(...)` to open `StudioScreen.launch(studioHref(lang, code))`.

### 5. Lesson screen

Replace `_renderBody`/flatten logic in `lib/screens/learn/lesson_screen.dart` with
`RichContent(blocks: parseBlocks(lesson['body']))`. Keep the existing header, progress,
"mark complete" (`POST /learn/complete-lesson`), and prev/next navigation.

### 6. Content Library listing

The 12 language tutorials already arrive via `GET /learn/courses` (`grouped` + `trackOrder`),
which `learn_screen.dart` already renders by track. Verify the new `coding`/`robotics`-track
language courses surface correctly (they should need no change); adjust grouping labels only if
a track renders unlabeled.

## Data flow

1. `GET /learn/courses/:slug/lessons/:lessonSlug` → `lesson.body.blocks` (unchanged backend).
2. `parseBlocks` → `List<ContentBlock>`.
3. `RichContent` renders native widgets; `CodeBlock` Open-in-Studio → `studioHref` URL.
4. `StudioScreen` WebView loads `webBase/studio/new?...&code=<b64url>`; the web studio decodes
   the snippet into an editor buffer (already built in the web Content Library work).

## Testing (flutter test)

- Unit: `studioHref`/`encodeStudioCode` — assert base64url output matches a known web-produced
  value for the same input (byte-identical, no padding); assert routing (`arduino`→robotics,
  `python`→coding).
- Unit: `parseBlocks` — each block type parsed; unknown type → `UnknownBlock`; malformed input
  → empty list, no throw.
- Widget: `RichContent` renders a markdown block, a code block (with the Open-in-Studio button
  when flagged), a callout, and an SVG without throwing.

## Out of scope (Phase 1)

- Native Mermaid rendering (shown as code).
- Native code editing / native Studio (stays WebView — Phase 6).
- Social markdown rendering (Phase 2 reuses `RichContent`/markdown styling).
- Course/lesson Dart model classes beyond `ContentBlock` (keep Map-based metadata).

## Risks / notes

- `flutter_markdown_plus` API ≈ official `flutter_markdown` (`MarkdownBody`, `MarkdownStyleSheet`).
  If it proves unsuitable, `markdown_widget` is the fallback (actively maintained, GFM + code).
- `flutter_svg` may not parse every authored SVG feature; wrap in try/builder with a graceful
  fallback so a lesson never crashes on a diagram.
- base64url parity: Dart `base64Url.encode(utf8.encode(code))` adds `=` padding → strip it; the
  web decoder re-adds padding, so stripped output round-trips. A test pins this.
- WebView Open-in-Studio requires the web app reachable at `webBase` (already true for Studio).
