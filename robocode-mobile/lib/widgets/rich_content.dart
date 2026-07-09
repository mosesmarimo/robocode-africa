import 'package:flutter/material.dart';
import 'package:flutter_markdown_plus/flutter_markdown_plus.dart';
import 'package:flutter_highlight/flutter_highlight.dart';
import 'package:flutter_highlight/themes/atom-one-dark.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../api/api_client.dart';
import '../models/content.dart';
import '../studio/open_in_studio.dart';
import '../theme.dart';

/// Default Studio board for a robotics language when a `tryit`/`exercise`
/// block doesn't carry its own `board` (unlike the older `code`/`diagram`
/// blocks, these never do). Mirrors the web
/// `DEFAULT_ROBOTICS_BOARD`/`ROBOTICS_TRYIT_LANGS`
/// (components/learn/lesson-block-shared.ts) — `studioHref` only infers
/// robotics mode from the language itself for `arduino`; `micropython` needs
/// an explicit board to land in robotics mode (on the Pico) instead of
/// falling back to a plain coding Studio session.
const Map<String, String> _defaultRoboticsBoard = {
  'arduino': 'arduino-uno',
  'micropython': 'raspberry-pi-pico',
};

/// Best-effort ping for `POST /learn/complete-task {type, refId, language}` —
/// awards XP for a `tryit` "Open in Studio" tap or an `exercise` "Show
/// answer" reveal. The endpoint is landing in parallel with this client
/// change (and the caller may be offline), so every failure — 404 while it
/// doesn't exist yet, a network error, anything — is swallowed. Never blocks
/// or interrupts reading the lesson.
void recordBlockCompletion({required String type, required String refId, required String language}) {
  ApiClient.instance.post<dynamic>(
    '/learn/complete-task',
    body: {'type': type, 'refId': refId, 'language': language},
  ).catchError((_) => null);
}

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
      border: Border(
        left: BorderSide(
          color: RoboTheme.primary.withValues(alpha: 0.4),
          width: 3,
        ),
      ),
    ),
  );
}

// Map block language ids to highlight.js language ids.
const _hlLang = {
  'python': 'python',
  'javascript': 'javascript',
  'typescript': 'typescript',
  'html': 'xml',
  'css': 'css',
  'go': 'go',
  'rust': 'rust',
  'cpp': 'cpp',
  'csharp': 'cs',
  'sql': 'sql',
  'arduino': 'cpp',
  'micropython': 'python',
};

class RichContent extends StatelessWidget {
  final List<ContentBlock> blocks;
  /// Seeds a stable `refId` (`${lessonId}#${index}`) for tryit/exercise
  /// completion pings — see `recordBlockCompletion`. Optional because not
  /// every caller has a lesson id; blocks then fall back to a page-local
  /// `lesson#index` id, matching the web's `LessonBody`.
  final String? lessonId;
  const RichContent({super.key, required this.blocks, this.lessonId});

  @override
  Widget build(BuildContext context) {
    // Built once per RichContent.build (not per block) — MarkdownStyleSheet
    // construction walks the whole Theme, so re-deriving it per block was
    // needless work for lessons with many blocks.
    final styleSheet = markdownStyleSheet(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        for (final (i, b) in blocks.indexed)
          _block(context, b, styleSheet, '${lessonId ?? 'lesson'}#$i'),
      ],
    );
  }

  Widget _block(BuildContext context, ContentBlock b, MarkdownStyleSheet styleSheet, String refId) {
    switch (b) {
      case MarkdownBlock(:final text):
        return Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: MarkdownBody(
            data: text,
            selectable: false,
            styleSheet: styleSheet,
            onTapLink: (t, href, title) {
              if (href != null) {
                launchUrl(Uri.parse(href), mode: LaunchMode.externalApplication);
              }
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
        return _Callout(variant: variant, text: text, styleSheet: styleSheet);
      case DiagramBlock(:final board, :final code, :final diagram):
        return _DiagramCard(board: board, code: code, diagram: diagram);
      case TryitBlock():
        return _TryitCard(block: b, refId: refId);
      case ExerciseBlock():
        return _ExerciseCard(block: b, refId: refId, styleSheet: styleSheet);
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
                            color: Colors.white70,
                            fontSize: 12,
                            fontFamily: 'monospace',
                          ),
                        ),
                      ),
                      if (block.openInStudio)
                        FilledButton.icon(
                          style: FilledButton.styleFrom(
                            backgroundColor: RoboTheme.primary,
                            visualDensity: VisualDensity.compact,
                          ),
                          onPressed: () => context.push(
                            '/studio-open',
                            extra: studioHref(block.language, block.code, board: block.board),
                          ),
                          icon: const Icon(Icons.open_in_new, size: 16),
                          label: const Text(
                            'Open in RoboCode Studio',
                            style: TextStyle(fontSize: 12),
                          ),
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
                    textStyle:
                        const TextStyle(fontFamily: 'monospace', fontSize: 13),
                  ),
                ),
              ],
            ),
          ),
          if (caption != null && caption!.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 6),
              child: Text(
                caption!,
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 12.5,
                  color: Theme.of(context).hintColor,
                ),
              ),
            ),
        ],
      ),
    );
  }
}

/// Renders a `tryit` block: read-only code (the mobile app has no sandbox to
/// run it in) + an "Open in Studio" action that lands on the right Studio
/// mode — coding for the 10 coding languages, robotics for arduino/
/// micropython. Tapping it is this block's "attempt" signal, so it also
/// pings the (in-progress) completion endpoint.
class _TryitCard extends StatelessWidget {
  final TryitBlock block;
  final String refId;
  const _TryitCard({required this.block, required this.refId});

  void _openStudio(BuildContext context) {
    recordBlockCompletion(type: 'tryit', refId: refId, language: block.language);
    context.push(
      '/studio-open',
      extra: studioHref(block.language, block.code, board: _defaultRoboticsBoard[block.language]),
    );
  }

  @override
  Widget build(BuildContext context) {
    final lang = _hlLang[block.language] ?? 'plaintext';
    final expected = block.expectedOutput;
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
                          '${block.language} — Try it',
                          style: const TextStyle(
                            color: Colors.white70,
                            fontSize: 12,
                            fontFamily: 'monospace',
                          ),
                        ),
                      ),
                      FilledButton.icon(
                        style: FilledButton.styleFrom(
                          backgroundColor: RoboTheme.primary,
                          visualDensity: VisualDensity.compact,
                        ),
                        onPressed: () => _openStudio(context),
                        icon: const Icon(Icons.open_in_new, size: 16),
                        label: const Text(
                          'Open in RoboCode Studio',
                          style: TextStyle(fontSize: 12),
                        ),
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
                if (expected != null && expected.trim().isNotEmpty)
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
                    child: RichText(
                      text: TextSpan(
                        children: [
                          const TextSpan(
                            text: 'Expected: ',
                            style: TextStyle(color: Colors.white70, fontWeight: FontWeight.bold, fontSize: 12),
                          ),
                          TextSpan(
                            text: expected,
                            style: const TextStyle(color: Colors.white54, fontFamily: 'monospace', fontSize: 12),
                          ),
                        ],
                      ),
                    ),
                  ),
              ],
            ),
          ),
          if (block.caption != null && block.caption!.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 6),
              child: Text(
                block.caption!,
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 12.5, color: Theme.of(context).hintColor),
              ),
            ),
        ],
      ),
    );
  }
}

/// Renders an `exercise` block: prompt + read-only starter code, and a "Show
/// answer" toggle that reveals `solution` (as a normal `_CodeCard`, so it
/// gets the same Open-in-Studio action for robotics languages). There's no
/// in-app Check — the mobile app has no sandbox to run the learner's code
/// against `check` — so "Show answer" is this block's completion signal.
class _ExerciseCard extends StatefulWidget {
  final ExerciseBlock block;
  final String refId;
  final MarkdownStyleSheet styleSheet;
  const _ExerciseCard({required this.block, required this.refId, required this.styleSheet});

  @override
  State<_ExerciseCard> createState() => _ExerciseCardState();
}

class _ExerciseCardState extends State<_ExerciseCard> {
  bool _showSolution = false;

  void _reveal() {
    if (_showSolution) return;
    recordBlockCompletion(type: 'exercise', refId: widget.refId, language: widget.block.language);
    setState(() => _showSolution = true);
  }

  @override
  Widget build(BuildContext context) {
    final block = widget.block;
    final lang = _hlLang[block.language] ?? 'plaintext';
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Container(
        decoration: BoxDecoration(
          border: Border.all(color: Theme.of(context).dividerColor),
          borderRadius: BorderRadius.circular(12),
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'EXERCISE',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 0.6,
                      color: Theme.of(context).hintColor,
                    ),
                  ),
                  const SizedBox(height: 6),
                  MarkdownBody(data: block.prompt, styleSheet: widget.styleSheet),
                ],
              ),
            ),
            Container(
              color: const Color(0xFF282C34),
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: HighlightView(
                  block.starter,
                  language: lang,
                  theme: atomOneDarkTheme,
                  padding: const EdgeInsets.all(12),
                  textStyle: const TextStyle(fontFamily: 'monospace', fontSize: 13),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(12),
              child: OutlinedButton.icon(
                onPressed: _showSolution ? null : _reveal,
                icon: const Icon(Icons.visibility_outlined, size: 16),
                label: Text(_showSolution ? 'Answer shown' : 'Show answer'),
              ),
            ),
            if (_showSolution)
              Padding(
                padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text(
                      'SOLUTION',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 0.6,
                        color: Theme.of(context).hintColor,
                      ),
                    ),
                    const SizedBox(height: 6),
                    _CodeCard(
                      block: CodeBlock(
                        language: block.language,
                        code: block.solution,
                        openInStudio: true,
                        board: _defaultRoboticsBoard[block.language],
                      ),
                    ),
                  ],
                ),
              ),
            if (block.caption != null && block.caption!.isNotEmpty)
              Padding(
                padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
                child: Text(
                  block.caption!,
                  style: TextStyle(fontSize: 12.5, color: Theme.of(context).hintColor),
                ),
              ),
          ],
        ),
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
              placeholderBuilder: (_) => const SizedBox(
                height: 40,
                child: Center(child: Icon(Icons.image_outlined)),
              ),
              errorBuilder: (context2, err, stack) => const SizedBox(
                height: 40,
                child: Center(child: Icon(Icons.broken_image_outlined)),
              ),
            ),
          ),
          if (caption != null && caption!.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 6),
              child: Text(
                caption!,
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 12.5,
                  color: Theme.of(context).hintColor,
                ),
              ),
            ),
        ],
      ),
    );
  }
}

/// Maps a Studio board id to the language its lessons author in, purely so
/// `studioHref`'s `lang` param reads sensibly — the Studio ignores `lang` once
/// `mode=robotics` (see `studio/[projectId]/page.tsx`), so this only affects
/// display, never behavior.
String _languageForBoard(String board) {
  switch (board) {
    case 'raspberry-pi-pico':
      return 'micropython';
    case 'arduino-uno':
    case 'esp32':
    default:
      return 'arduino';
  }
}

class _DiagramCard extends StatelessWidget {
  final String board;
  final String code;
  final Map<String, dynamic> diagram;
  const _DiagramCard({required this.board, required this.code, required this.diagram});

  @override
  Widget build(BuildContext context) {
    final parts = (diagram['parts'] as List?) ?? const [];
    final componentCount = parts.where((p) => p is Map && p['id'] != 'mcu').length;
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          border: Border.all(color: Theme.of(context).dividerColor),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            Icon(Icons.bolt_rounded, color: RoboTheme.primary, size: 26),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Wiring diagram', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                  const SizedBox(height: 2),
                  Text(
                    '$componentCount component${componentCount == 1 ? '' : 's'}',
                    style: TextStyle(fontSize: 12.5, color: Theme.of(context).hintColor),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 10),
            FilledButton.icon(
              style: FilledButton.styleFrom(
                backgroundColor: RoboTheme.primary,
                visualDensity: VisualDensity.compact,
              ),
              onPressed: () => context.push(
                '/studio-open',
                extra: studioHref(_languageForBoard(board), code, board: board, diagram: diagram),
              ),
              icon: const Icon(Icons.open_in_new, size: 16),
              label: const Text('View in Studio', style: TextStyle(fontSize: 12)),
            ),
          ],
        ),
      ),
    );
  }
}

class _Callout extends StatelessWidget {
  final String variant;
  final String text;
  final MarkdownStyleSheet styleSheet;
  const _Callout({required this.variant, required this.text, required this.styleSheet});

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
        color: color.withValues(alpha: 0.08),
        border: Border.all(color: color.withValues(alpha: 0.35)),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(top: 2, right: 10),
            child: Icon(icon, size: 20, color: color),
          ),
          Expanded(
            child: MarkdownBody(
              data: text,
              styleSheet: styleSheet,
            ),
          ),
        ],
      ),
    );
  }
}
