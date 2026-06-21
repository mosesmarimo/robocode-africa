# Mobile Parity Phase 1 — Rich Content + Content Library — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render RoboCode lessons natively on mobile with rich blocks (markdown, syntax-highlighted code, SVG illustrations, callouts, Mermaid-as-code) and an "Open in RoboCode Studio" button, matching the web Content Library overhaul.

**Architecture:** A typed `ContentBlock` model parses `lesson.body.blocks`; a reusable `RichContent` widget dispatches each block to a native renderer; code blocks build a web-compatible `studioHref` (base64url) and open the existing Studio WebView at that URL.

**Tech Stack:** Flutter/Dart, `flutter_markdown_plus`, `flutter_highlight`+`highlight`, `flutter_svg`, `url_launcher`, `go_router`, `webview_flutter`, `flutter_test`.

## Global Constraints

- **Repo:** all work is in `/Users/marimo/Dev/robocode/robocode-mobile` (its OWN git repo, branch `main`). Commit there with `git -C /Users/marimo/Dev/robocode/robocode-mobile ...`, staging only the files each task changes (never `git add -A`). Do NOT touch the root repo or other sub-repos. Branch first if instructed by the executor; otherwise commit to the working branch the executor set up.
- **Flutter HAS a test runner.** Use real TDD: `flutter test` for unit/widget tests, `flutter analyze` for static analysis (must be clean for files you touch). Run all flutter commands with the repo as cwd: `cd /Users/marimo/Dev/robocode/robocode-mobile && flutter <cmd>`.
- **base64url parity:** `encodeStudioCode` must produce RFC-4648 base64url with padding stripped, byte-identical to the web `encodeStudioCode`, so the same `/studio/new?...&code=...` URL round-trips through the web studio decoder. Pinned vector: `encodeStudioCode('AB') == 'QUI'`.
- **Studio routing mirrors web:** only `arduino` → `mode=robotics&board=arduino-uno`; every other language (incl. `micropython`) → `mode=coding&lang=<language>`.
- **All-native rendering; Mermaid shown as a labeled code block** (not rendered). SVG via `flutter_svg` with a graceful fallback (never throw on a bad SVG).
- **Theme tokens** (`lib/theme.dart` `RoboTheme`): primary `#2563FF`, secondary `#16C79A`, accent `#FFB020`, ink `#0D1426`, `brandGradient`. Reuse these; do not hardcode new brand colors.
- Reuse existing widgets from `lib/widgets/common.dart` (`AsyncView`, `BrandHeader`, `EmptyState`, `MiniChip`, `SectionTitle`) where applicable.

---

## File Structure

- Create: `lib/studio/open_in_studio.dart` — `studioHref` / `encodeStudioCode`.
- Create: `lib/models/content.dart` — `ContentBlock` types + `parseBlocks`.
- Create: `lib/widgets/rich_content.dart` — `RichContent` renderer + `markdownStyleSheet`.
- Modify: `lib/screens/studio_screen.dart` — accept a launch path, not only a projectId.
- Modify: `lib/router.dart` — route to open the Studio at an arbitrary launch path.
- Modify: `lib/screens/learn/lesson_screen.dart` — render via `RichContent`.
- Modify: `lib/screens/learn/learn_screen.dart` — confirm/adjust language-tutorial grouping.
- Modify: `pubspec.yaml` — new dependencies.
- Create tests: `test/open_in_studio_test.dart`, `test/content_blocks_test.dart`, `test/rich_content_test.dart`.

---

### Task 1: Add dependencies

**Files:**
- Modify: `pubspec.yaml`

- [ ] **Step 1: Add deps**

Add to the `dependencies:` block in `pubspec.yaml` (under the existing `intl:` line), matching the file's 2-space indentation:
```yaml
  flutter_markdown_plus: ^1.0.3
  flutter_highlight: ^0.7.0
  highlight: ^0.7.0
  flutter_svg: ^2.0.10+1
  url_launcher: ^6.3.0
```

- [ ] **Step 2: Resolve**

```bash
cd /Users/marimo/Dev/robocode/robocode-mobile && flutter pub get
```
Expected: resolves with no version conflicts. If `flutter_markdown_plus` fails to resolve, fall back to `markdown_widget: ^2.3.2+8` and note it in the report (the renderer task adapts). If a specific patch version is unavailable, relax to the nearest published `^` minor and note it.

- [ ] **Step 3: Commit**
```bash
git -C /Users/marimo/Dev/robocode/robocode-mobile add pubspec.yaml pubspec.lock
git -C /Users/marimo/Dev/robocode/robocode-mobile commit -m "feat(learn): add markdown, syntax-highlight, svg deps"
```

---

### Task 2: Open-in-Studio URL helper (TDD)

**Files:**
- Create: `lib/studio/open_in_studio.dart`
- Test: `test/open_in_studio_test.dart`

**Interfaces:**
- Produces:
  - `String encodeStudioCode(String code)` — base64url of UTF-8, no padding.
  - `String studioHref(String language, String code)` — relative path `studio/new?...`.
  - `const roboticsLangs = {'arduino'}`.

- [ ] **Step 1: Write the failing test**

Create `test/open_in_studio_test.dart`:
```dart
import 'package:flutter_test/flutter_test.dart';
import 'package:robocode_mobile/studio/open_in_studio.dart';

void main() {
  group('encodeStudioCode', () {
    test('matches the web base64url (no padding) — pinned vector', () {
      expect(encodeStudioCode('AB'), 'QUI');
    });
    test('is url-safe (no +,/,=)', () {
      final enc = encodeStudioCode('a' * 40 + '?&=#');
      expect(RegExp(r'[+/=]').hasMatch(enc), isFalse);
    });
    test('round-trips utf8 incl. emoji', () {
      final code = 'print("Héllo 🌍")';
      // decode by re-adding padding then base64Url decode
      final padded = encodeStudioCode(code).padRight(
          (encodeStudioCode(code).length + 3) & ~3, '=');
      expect(decodeForTest(padded), code);
    });
  });

  group('studioHref', () {
    test('python routes to coding studio', () {
      final h = studioHref('python', 'print(1)');
      expect(h, contains('mode=coding'));
      expect(h, contains('lang=python'));
      expect(h, contains('code='));
      expect(h.startsWith('studio/new?'), isTrue);
    });
    test('arduino routes to robotics studio', () {
      final h = studioHref('arduino', 'void setup(){}');
      expect(h, contains('mode=robotics'));
      expect(h, contains('board=arduino-uno'));
    });
    test('micropython routes to coding (matches web)', () {
      expect(studioHref('micropython', 'x'), contains('mode=coding'));
    });
  });
}
```
(Confirm the package name in `pubspec.yaml` `name:` field is `robocode_mobile`; if it differs, use the real package name in the import.)

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/marimo/Dev/robocode/robocode-mobile && flutter test test/open_in_studio_test.dart
```
Expected: FAIL (target library/URI does not exist).

- [ ] **Step 3: Implement**

Create `lib/studio/open_in_studio.dart`:
```dart
import 'dart:convert';

/// Languages that open the robotics Studio (sketch.ino). Matches the web
/// `ROBOTICS_LANGS` (only arduino; micropython opens the coding studio).
const Set<String> roboticsLangs = {'arduino'};

/// base64url (RFC 4648) of the UTF-8 bytes, padding stripped — byte-identical
/// to the web `encodeStudioCode`, so the same studio URL round-trips.
String encodeStudioCode(String code) {
  return base64Url.encode(utf8.encode(code)).replaceAll('=', '');
}

/// Test-only helper: decode a padded base64url string back to text.
String decodeForTest(String padded) => utf8.decode(base64Url.decode(padded));

/// Relative Studio path that opens [code] in the right Studio mode.
/// Coding langs -> `studio/new?mode=coding&lang=<language>&code=<b64url>`.
/// arduino -> `studio/new?mode=robotics&board=arduino-uno&code=<b64url>`.
String studioHref(String language, String code) {
  final robotics = roboticsLangs.contains(language);
  final params = <String, String>{
    'mode': robotics ? 'robotics' : 'coding',
    'lang': language,
    if (robotics) 'board': 'arduino-uno',
    'code': encodeStudioCode(code),
  };
  final query = params.entries
      .map((e) => '${e.key}=${Uri.encodeQueryComponent(e.value)}')
      .join('&');
  return 'studio/new?$query';
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd /Users/marimo/Dev/robocode/robocode-mobile && flutter test test/open_in_studio_test.dart
```
Expected: PASS (all cases). Then `flutter analyze lib/studio/open_in_studio.dart` → no issues.

- [ ] **Step 5: Commit**
```bash
git -C /Users/marimo/Dev/robocode/robocode-mobile add lib/studio/open_in_studio.dart test/open_in_studio_test.dart
git -C /Users/marimo/Dev/robocode/robocode-mobile commit -m "feat(studio): open-in-studio URL helper (web-compatible base64url)"
```

---

### Task 3: ContentBlock model + parser (TDD)

**Files:**
- Create: `lib/models/content.dart`
- Test: `test/content_blocks_test.dart`

**Interfaces:**
- Produces:
  - `sealed class ContentBlock` with subclasses `MarkdownBlock(text)`, `CodeBlock(language, code, filename?, openInStudio)`, `MermaidBlock(chart, caption?)`, `SvgBlock(svg, caption?)`, `CalloutBlock(variant, text)`, `UnknownBlock()`.
  - `List<ContentBlock> parseBlocks(dynamic body)` — reads `body['blocks']`.

- [ ] **Step 1: Write the failing test**

Create `test/content_blocks_test.dart`:
```dart
import 'package:flutter_test/flutter_test.dart';
import 'package:robocode_mobile/models/content.dart';

void main() {
  test('parses each block type', () {
    final blocks = parseBlocks({
      'blocks': [
        {'type': 'markdown', 'text': '# Hi'},
        {'type': 'code', 'language': 'python', 'code': 'print(1)', 'openInStudio': true},
        {'type': 'mermaid', 'chart': 'graph TD; A-->B'},
        {'type': 'svg', 'svg': '<svg/>', 'caption': 'fig'},
        {'type': 'callout', 'variant': 'tip', 'text': 'be careful'},
        {'type': 'wat'},
      ],
    });
    expect(blocks.length, 6);
    expect(blocks[0], isA<MarkdownBlock>());
    expect((blocks[1] as CodeBlock).language, 'python');
    expect((blocks[1] as CodeBlock).openInStudio, isTrue);
    expect(blocks[2], isA<MermaidBlock>());
    expect((blocks[3] as SvgBlock).caption, 'fig');
    expect((blocks[4] as CalloutBlock).variant, 'tip');
    expect(blocks[5], isA<UnknownBlock>());
  });

  test('malformed body yields empty list, no throw', () {
    expect(parseBlocks(null), isEmpty);
    expect(parseBlocks('nope'), isEmpty);
    expect(parseBlocks({'blocks': 'x'}), isEmpty);
  });

  test('code openInStudio defaults to false when absent', () {
    final b = parseBlocks({'blocks': [{'type': 'code', 'language': 'go', 'code': 'x'}]});
    expect((b[0] as CodeBlock).openInStudio, isFalse);
  });
}
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/marimo/Dev/robocode/robocode-mobile && flutter test test/content_blocks_test.dart
```
Expected: FAIL (library/URI not found).

- [ ] **Step 3: Implement**

Create `lib/models/content.dart`:
```dart
/// Typed lesson content blocks parsed from `lesson.body.blocks`.
sealed class ContentBlock {
  const ContentBlock();
}

class MarkdownBlock extends ContentBlock {
  final String text;
  const MarkdownBlock(this.text);
}

class CodeBlock extends ContentBlock {
  final String language;
  final String code;
  final String? filename;
  final bool openInStudio;
  const CodeBlock({
    required this.language,
    required this.code,
    this.filename,
    this.openInStudio = false,
  });
}

class MermaidBlock extends ContentBlock {
  final String chart;
  final String? caption;
  const MermaidBlock(this.chart, {this.caption});
}

class SvgBlock extends ContentBlock {
  final String svg;
  final String? caption;
  const SvgBlock(this.svg, {this.caption});
}

class CalloutBlock extends ContentBlock {
  final String variant; // tip | info | warning
  final String text;
  const CalloutBlock({required this.variant, required this.text});
}

class UnknownBlock extends ContentBlock {
  const UnknownBlock();
}

String _str(Map b, String k) => b[k]?.toString() ?? '';

/// Parse `body['blocks']` into typed [ContentBlock]s. Never throws.
List<ContentBlock> parseBlocks(dynamic body) {
  if (body is! Map) return const [];
  final raw = body['blocks'];
  if (raw is! List) return const [];
  final out = <ContentBlock>[];
  for (final item in raw) {
    if (item is! Map) {
      out.add(const UnknownBlock());
      continue;
    }
    switch (item['type']?.toString()) {
      case 'markdown':
        out.add(MarkdownBlock(_str(item, 'text')));
        break;
      case 'code':
        out.add(CodeBlock(
          language: _str(item, 'language'),
          code: _str(item, 'code'),
          filename: item['filename']?.toString(),
          openInStudio: item['openInStudio'] == true,
        ));
        break;
      case 'mermaid':
        out.add(MermaidBlock(_str(item, 'chart'),
            caption: item['caption']?.toString()));
        break;
      case 'svg':
        out.add(SvgBlock(_str(item, 'svg'), caption: item['caption']?.toString()));
        break;
      case 'callout':
        out.add(CalloutBlock(
            variant: _str(item, 'variant').isEmpty ? 'tip' : _str(item, 'variant'),
            text: _str(item, 'text')));
        break;
      default:
        out.add(const UnknownBlock());
    }
  }
  return out;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd /Users/marimo/Dev/robocode/robocode-mobile && flutter test test/content_blocks_test.dart
```
Expected: PASS. Then `flutter analyze lib/models/content.dart` → no issues.

- [ ] **Step 5: Commit**
```bash
git -C /Users/marimo/Dev/robocode/robocode-mobile add lib/models/content.dart test/content_blocks_test.dart
git -C /Users/marimo/Dev/robocode/robocode-mobile commit -m "feat(learn): typed ContentBlock model + parser"
```

---

### Task 4: Generalize StudioScreen to open an arbitrary launch path

**Files:**
- Modify: `lib/screens/studio_screen.dart`
- Modify: `lib/router.dart`

**Interfaces:**
- Consumes: `AppConfig.webBase`, `ApiClient.instance.token` (existing).
- Produces: `StudioScreen.launch(String launchPath)` named constructor; a router path `/studio-open` that reads the launch path from `state.extra` (a `String`).

- [ ] **Step 1: Read the current file**

Read `lib/screens/studio_screen.dart` to get its exact current shape (constructor `StudioScreen({required this.projectId})`, the `WebViewController` setup, the `loadRequest(Uri.parse('${AppConfig.webBase}/studio/${widget.projectId}'))` line, and the cookie injection).

- [ ] **Step 2: Add a launch-path constructor and use it for the URL**

Edit `lib/screens/studio_screen.dart`:
1. Change the fields/constructors so the screen accepts EITHER a project id OR a full launch path:
```dart
  final String? projectId;
  final String? launchPath;
  const StudioScreen({super.key, required String this.projectId}) : launchPath = null;
  const StudioScreen.launch(String path, {super.key})
      : launchPath = path,
        projectId = null;
```
2. Replace the hardcoded load URL with a computed one. Where it currently builds
   `Uri.parse('${AppConfig.webBase}/studio/${widget.projectId}')`, use:
```dart
  String get _studioUrl {
    final path = widget.launchPath ?? 'studio/${widget.projectId}';
    return '${AppConfig.webBase}/$path';
  }
```
   and call `..loadRequest(Uri.parse(_studioUrl))`. Leave the cookie injection (sets `rc_session` on `Uri.parse(AppConfig.webBase).host`) unchanged — it already covers any path on that origin.

- [ ] **Step 3: Add the router route**

In `lib/router.dart`, near the existing `GoRoute(path: '/studio/:id', ...)`, add:
```dart
GoRoute(
  path: '/studio-open',
  builder: (c, s) => StudioScreen.launch(s.extra as String? ?? 'studio/new'),
),
```
(Keep the existing `/studio/:id` route. Ensure `StudioScreen` is imported — it already is.)

- [ ] **Step 4: Verify**

```bash
cd /Users/marimo/Dev/robocode/robocode-mobile && flutter analyze lib/screens/studio_screen.dart lib/router.dart
```
Expected: no issues. (No widget test here — WebView can't load in the test harness. Correctness is covered by analyze + the lesson-screen integration in Task 6.)

- [ ] **Step 5: Commit**
```bash
git -C /Users/marimo/Dev/robocode/robocode-mobile add lib/screens/studio_screen.dart lib/router.dart
git -C /Users/marimo/Dev/robocode/robocode-mobile commit -m "feat(studio): open the Studio WebView at an arbitrary launch path"
```

---

### Task 5: RichContent renderer (widget test)

**Files:**
- Create: `lib/widgets/rich_content.dart`
- Test: `test/rich_content_test.dart`

**Interfaces:**
- Consumes: `ContentBlock` types from `lib/models/content.dart`; `studioHref` from `lib/studio/open_in_studio.dart`; `RoboTheme` from `lib/theme.dart`; the `/studio-open` route (Task 4).
- Produces: `RichContent({ required List<ContentBlock> blocks })`; `MarkdownStyleSheet markdownStyleSheet(BuildContext)`.

- [ ] **Step 1: Write the failing widget test**

Create `test/rich_content_test.dart`:
```dart
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:robocode_mobile/models/content.dart';
import 'package:robocode_mobile/widgets/rich_content.dart';

Widget _host(List<ContentBlock> blocks) =>
    MaterialApp(home: Scaffold(body: SingleChildScrollView(child: RichContent(blocks: blocks))));

void main() {
  testWidgets('renders markdown, callout and a code block without throwing',
      (tester) async {
    await tester.pumpWidget(_host(const [
      MarkdownBlock('# Title\n\nSome **bold** text.'),
      CalloutBlock(variant: 'tip', text: 'Remember this.'),
      CodeBlock(language: 'python', code: 'print(1)', openInStudio: true),
    ]));
    await tester.pumpAndSettle();
    expect(find.byType(RichContent), findsOneWidget);
    // The Open-in-Studio button shows when openInStudio is true.
    expect(find.text('Open in RoboCode Studio'), findsOneWidget);
  });

  testWidgets('code block without openInStudio shows no studio button',
      (tester) async {
    await tester.pumpWidget(_host(const [
      CodeBlock(language: 'go', code: 'x'),
    ]));
    await tester.pumpAndSettle();
    expect(find.text('Open in RoboCode Studio'), findsNothing);
  });

  testWidgets('bad SVG does not throw', (tester) async {
    await tester.pumpWidget(_host(const [SvgBlock('<not-svg>')]));
    await tester.pumpAndSettle();
    expect(find.byType(RichContent), findsOneWidget);
  });
}
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/marimo/Dev/robocode/robocode-mobile && flutter test test/rich_content_test.dart
```
Expected: FAIL (library/URI not found).

- [ ] **Step 3: Implement**

Create `lib/widgets/rich_content.dart`:
```dart
import 'package:flutter/material.dart';
import 'package:flutter_markdown_plus/flutter_markdown_plus.dart';
import 'package:flutter_highlight/flutter_highlight.dart';
import 'package:flutter_highlight/themes/atom-one-dark.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../models/content.dart';
import '../studio/open_in_studio.dart';
import '../theme.dart';

/// Shared markdown typography for lessons (and, later, social posts).
MarkdownStyleSheet markdownStyleSheet(BuildContext context) {
  final base = Theme.of(context).textTheme;
  return MarkdownStyleSheet.fromTheme(Theme.of(context)).copyWith(
    p: base.bodyMedium?.copyWith(fontSize: 15.5, height: 1.6),
    h1: base.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
    h2: base.titleLarge?.copyWith(fontWeight: FontWeight.bold),
    h3: base.titleMedium?.copyWith(fontWeight: FontWeight.bold),
    code: const TextStyle(fontFamily: 'monospace', fontSize: 13.5),
    blockquoteDecoration: BoxDecoration(
      border: Border(left: BorderSide(color: RoboTheme.primary.withOpacity(0.4), width: 3)),
    ),
  );
}

// Map block language ids to highlight.js language ids.
const _hlLang = {
  'python': 'python', 'javascript': 'javascript', 'typescript': 'typescript',
  'html': 'xml', 'css': 'css', 'go': 'go', 'rust': 'rust', 'cpp': 'cpp',
  'csharp': 'cs', 'sql': 'sql', 'arduino': 'cpp', 'micropython': 'python',
};

class RichContent extends StatelessWidget {
  final List<ContentBlock> blocks;
  const RichContent({super.key, required this.blocks});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [for (final b in blocks) _block(context, b)],
    );
  }

  Widget _block(BuildContext context, ContentBlock b) {
    switch (b) {
      case MarkdownBlock(:final text):
        return Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: MarkdownBody(
            data: text,
            selectable: false,
            styleSheet: markdownStyleSheet(context),
            onTapLink: (t, href, title) {
              if (href != null) launchUrl(Uri.parse(href), mode: LaunchMode.externalApplication);
            },
          ),
        );
      case CodeBlock():
        return _CodeCard(block: b);
      case MermaidBlock(:final chart, :final caption):
        return _CodeCard(
          block: CodeBlock(language: 'text', code: chart),
          label: 'Mermaid diagram',
          caption: caption,
        );
      case SvgBlock(:final svg, :final caption):
        return _SvgCard(svg: svg, caption: caption);
      case CalloutBlock(:final variant, :final text):
        return _Callout(variant: variant, text: text);
      case UnknownBlock():
        return const SizedBox.shrink();
    }
  }
}

class _CodeCard extends StatelessWidget {
  final CodeBlock block;
  final String? label;
  final String? caption;
  const _CodeCard({required this.block, this.label, this.caption});

  @override
  Widget build(BuildContext context) {
    final lang = _hlLang[block.language] ?? 'plaintext';
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            decoration: BoxDecoration(
              color: const Color(0xFF282C34),
              borderRadius: BorderRadius.circular(12),
            ),
            clipBehavior: Clip.antiAlias,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(12, 8, 8, 8),
                  child: Row(
                    children: [
                      Expanded(
                        child: Text(
                          label ?? block.filename ?? block.language,
                          style: const TextStyle(
                              color: Colors.white70, fontSize: 12, fontFamily: 'monospace'),
                        ),
                      ),
                      if (block.openInStudio)
                        FilledButton.icon(
                          style: FilledButton.styleFrom(
                            backgroundColor: RoboTheme.primary,
                            visualDensity: VisualDensity.compact,
                          ),
                          onPressed: () => context.push('/studio-open',
                              extra: studioHref(block.language, block.code)),
                          icon: const Icon(Icons.open_in_new, size: 16),
                          label: const Text('Open in RoboCode Studio',
                              style: TextStyle(fontSize: 12)),
                        ),
                    ],
                  ),
                ),
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: HighlightView(
                    block.code,
                    language: lang,
                    theme: atomOneDarkTheme,
                    padding: const EdgeInsets.all(12),
                    textStyle: const TextStyle(fontFamily: 'monospace', fontSize: 13),
                  ),
                ),
              ],
            ),
          ),
          if (caption != null && caption!.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 6),
              child: Text(caption!,
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 12.5, color: Theme.of(context).hintColor)),
            ),
        ],
      ),
    );
  }
}

class _SvgCard extends StatelessWidget {
  final String svg;
  final String? caption;
  const _SvgCard({required this.svg, this.caption});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              border: Border.all(color: Theme.of(context).dividerColor),
              borderRadius: BorderRadius.circular(12),
            ),
            child: SvgPicture.string(
              svg,
              fit: BoxFit.contain,
              placeholderBuilder: (_) =>
                  const SizedBox(height: 40, child: Center(child: Icon(Icons.image_outlined))),
            ),
          ),
          if (caption != null && caption!.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 6),
              child: Text(caption!,
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 12.5, color: Theme.of(context).hintColor)),
            ),
        ],
      ),
    );
  }
}

class _Callout extends StatelessWidget {
  final String variant;
  final String text;
  const _Callout({required this.variant, required this.text});

  @override
  Widget build(BuildContext context) {
    final (color, icon) = switch (variant) {
      'warning' => (RoboTheme.accent, Icons.warning_amber_rounded),
      'info' => (RoboTheme.primary, Icons.info_outline),
      _ => (RoboTheme.secondary, Icons.lightbulb_outline),
    };
    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withOpacity(0.08),
        border: Border.all(color: color.withOpacity(0.35)),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(padding: const EdgeInsets.only(top: 2, right: 10), child: Icon(icon, size: 20, color: color)),
          Expanded(
            child: MarkdownBody(data: text, styleSheet: markdownStyleSheet(context)),
          ),
        ],
      ),
    );
  }
}
```
NOTE on imports: if Task 1 fell back to `markdown_widget`, replace `flutter_markdown_plus` imports/usage (`MarkdownBody`, `MarkdownStyleSheet`) with the `markdown_widget` equivalent (`MarkdownBlock`/`MarkdownWidget` + `MarkdownConfig`) and adjust `markdownStyleSheet` accordingly — the public `RichContent`/`markdownStyleSheet` names stay the same.

- [ ] **Step 4: Run test to verify it passes**

```bash
cd /Users/marimo/Dev/robocode/robocode-mobile && flutter test test/rich_content_test.dart
```
Expected: PASS (3 widget tests). Then `flutter analyze lib/widgets/rich_content.dart` → no issues.

- [ ] **Step 5: Commit**
```bash
git -C /Users/marimo/Dev/robocode/robocode-mobile add lib/widgets/rich_content.dart test/rich_content_test.dart
git -C /Users/marimo/Dev/robocode/robocode-mobile commit -m "feat(learn): RichContent block renderer (markdown, code, svg, callout, mermaid-as-code)"
```

---

### Task 6: Render lessons with RichContent

**Files:**
- Modify: `lib/screens/learn/lesson_screen.dart`

**Interfaces:**
- Consumes: `parseBlocks` (`lib/models/content.dart`), `RichContent` (`lib/widgets/rich_content.dart`).

- [ ] **Step 1: Read the current file**

Read `lib/screens/learn/lesson_screen.dart`. Note: the `_load()` fetch, the unpacking of `lesson` from `data`, the current flatten logic (`rawBody`/`blocks`/`body` join near lines 87–92), and the `_renderBody(context, body)` method (~lines 189–253) and where it is called in `build`.

- [ ] **Step 2: Replace the flatten + `_renderBody` with RichContent**

1. Add imports at the top:
```dart
import '../../models/content.dart';
import '../../widgets/rich_content.dart';
```
2. Remove the flatten block (the `rawBody`/`blocks`/`body` lines ~87–92) and instead parse typed blocks where `lesson` is available:
```dart
    final contentBlocks = parseBlocks(lesson['body']);
```
3. In `build`, replace the place that renders `_renderBody(context, body)` (a `Column`/list of widgets) with:
```dart
    contentBlocks.isEmpty
        ? const EmptyState(icon: Icons.article_outlined, message: 'This lesson has no content yet.')
        : RichContent(blocks: contentBlocks),
```
   (Match the surrounding widget structure — if `_renderBody` returned a `List<Widget>` spread into a `Column`, replace that subtree with the single `RichContent` widget.)
4. Delete the now-unused `_renderBody` method.

- [ ] **Step 3: Verify**

```bash
cd /Users/marimo/Dev/robocode/robocode-mobile && flutter analyze lib/screens/learn/lesson_screen.dart && flutter test
```
Expected: analyze clean (no unused-symbol warnings for the removed method/vars); the full test suite still passes.

- [ ] **Step 4: Commit**
```bash
git -C /Users/marimo/Dev/robocode/robocode-mobile add lib/screens/learn/lesson_screen.dart
git -C /Users/marimo/Dev/robocode/robocode-mobile commit -m "feat(learn): render lessons with RichContent blocks + Open in Studio"
```

---

### Task 7: Confirm language tutorials list correctly

**Files:**
- Modify (only if needed): `lib/screens/learn/learn_screen.dart`

- [ ] **Step 1: Read the current grouping**

Read `lib/screens/learn/learn_screen.dart`. It renders `GET /learn/courses` using `grouped` + `trackOrder`. The backend now returns 15 courses incl. 12 `lang-*` courses on `coding`/`robotics` tracks.

- [ ] **Step 2: Verify grouping covers all tracks**

Confirm the screen iterates `trackOrder` (or `grouped` keys) generically rather than hardcoding only specific track names — so the 12 language courses appear under their tracks. If the screen hardcodes a fixed set of track sections and would drop a track, change it to iterate `trackOrder`/`grouped` keys dynamically (render every track present), reusing the existing card layout. If it already iterates dynamically, make NO change and note that in the report.

- [ ] **Step 3: Verify**

```bash
cd /Users/marimo/Dev/robocode/robocode-mobile && flutter analyze lib/screens/learn/learn_screen.dart
```
Expected: no issues. (Visual confirmation that all 15 courses list is a manual step the controller will note for the user — requires the seeded backend + a running app.)

- [ ] **Step 4: Commit (only if changed)**
```bash
git -C /Users/marimo/Dev/robocode/robocode-mobile add lib/screens/learn/learn_screen.dart
git -C /Users/marimo/Dev/robocode/robocode-mobile commit -m "feat(learn): list all course tracks dynamically (surfaces language tutorials)"
```

---

## Final verification (after all tasks)

- [ ] `cd /Users/marimo/Dev/robocode/robocode-mobile && flutter analyze` → clean for all touched files.
- [ ] `flutter test` → all unit + widget tests pass (open_in_studio, content_blocks, rich_content).
- [ ] Manual (controller notes for user; needs seeded backend + running app/emulator): open a language-tutorial lesson → rich markdown, a colored code card, an SVG, and a callout render; tapping "Open in RoboCode Studio" opens the Studio WebView with the snippet; the Learn home lists all 15 courses by track.

## Self-Review (coverage map)

- Spec §1 deps → Task 1. §2 ContentBlock → Task 3. §3 RichContent → Task 5. §4 Open in Studio (helper + StudioScreen + route) → Tasks 2 + 4. §5 lesson screen → Task 6. §6 listing → Task 7. Tests (§Testing) → Tasks 2, 3, 5 (TDD) + final suite run.
- base64url parity pinned by the `encodeStudioCode('AB') == 'QUI'` vector (Task 2).
- All names consistent across tasks: `parseBlocks`, `ContentBlock`/subclasses, `studioHref`, `RichContent`, `markdownStyleSheet`, `StudioScreen.launch`, route `/studio-open`.
