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
  /// Studio board this snippet targets (e.g. `arduino-uno`, `esp32`,
  /// `raspberry-pi-pico`), stamped by the backend seed for robotics code
  /// blocks. Null for coding-only snippets.
  final String? board;
  const CodeBlock({
    required this.language,
    required this.code,
    this.filename,
    this.openInStudio = false,
    this.board,
  });
}

/// A baked wiring diagram spliced after a robotics code block (see backend
/// `prisma/baked-diagrams.ts` `diagramBlock`). `diagram` is the raw
/// `BakedDiagram` JSON (`{ board, parts: [...], wires: [...] }`) passed
/// through untouched so it round-trips to the Studio unchanged.
class DiagramBlock extends ContentBlock {
  final String board;
  final String code;
  final Map<String, dynamic> diagram;
  const DiagramBlock({
    required this.board,
    required this.code,
    required this.diagram,
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

/// An inline "try it" snippet (see backend `LessonBlock` union). The mobile
/// app has no code sandbox (Pyodide/Docker are web-only), so this always
/// renders read-only with an "Open in Studio" action rather than a Run
/// button — see `widgets/rich_content.dart`.
class TryitBlock extends ContentBlock {
  final String language;
  final String code;
  final String? expectedOutput;
  final String? caption;
  const TryitBlock({
    required this.language,
    required this.code,
    this.expectedOutput,
    this.caption,
  });
}

/// A prompt + starter/solution exercise (see backend `LessonBlock` union).
/// The mobile renderer shows the prompt and starter, with a "Show answer"
/// toggle revealing `solution` — there's no in-app Check since there's no
/// sandbox to run the learner's code against `check`.
class ExerciseBlock extends ContentBlock {
  final String language;
  final String prompt;
  final String starter;
  final String solution;
  final String? check;
  final String? caption;
  const ExerciseBlock({
    required this.language,
    required this.prompt,
    required this.starter,
    required this.solution,
    this.check,
    this.caption,
  });
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
          board: item['board']?.toString(),
        ));
        break;
      case 'diagram':
        final rawDiagram = item['diagram'];
        out.add(DiagramBlock(
          board: _str(item, 'board'),
          code: _str(item, 'code'),
          diagram: rawDiagram is Map ? Map<String, dynamic>.from(rawDiagram) : const {},
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
      case 'tryit':
        out.add(TryitBlock(
          language: _str(item, 'language'),
          code: _str(item, 'code'),
          expectedOutput: item['expectedOutput']?.toString(),
          caption: item['caption']?.toString(),
        ));
        break;
      case 'exercise':
        out.add(ExerciseBlock(
          language: _str(item, 'language'),
          prompt: _str(item, 'prompt'),
          starter: _str(item, 'starter'),
          solution: _str(item, 'solution'),
          check: item['check']?.toString(),
          caption: item['caption']?.toString(),
        ));
        break;
      default:
        out.add(const UnknownBlock());
    }
  }
  return out;
}
