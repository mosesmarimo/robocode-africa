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

  test('code block parses board when stamped', () {
    final b = parseBlocks({
      'blocks': [
        {'type': 'code', 'language': 'arduino', 'code': 'x', 'board': 'esp32'},
      ],
    });
    expect((b[0] as CodeBlock).board, 'esp32');
  });

  test('code block board is null when absent (non-robotics snippet)', () {
    final b = parseBlocks({'blocks': [{'type': 'code', 'language': 'python', 'code': 'x'}]});
    expect((b[0] as CodeBlock).board, isNull);
  });

  test('diagram block parses board, code and the raw diagram map', () {
    final diagram = {
      'board': 'raspberry-pi-pico',
      'parts': [
        {'id': 'mcu', 'type': '__board__:raspberry-pi-pico', 'x': 0, 'y': 0},
      ],
      'wires': <Map<String, dynamic>>[],
    };
    final b = parseBlocks({
      'blocks': [
        {
          'type': 'diagram',
          'board': 'raspberry-pi-pico',
          'language': 'micropython',
          'code': 'print(1)',
          'diagram': diagram,
        },
      ],
    });
    expect(b.length, 1);
    final block = b[0] as DiagramBlock;
    expect(block.board, 'raspberry-pi-pico');
    expect(block.code, 'print(1)');
    expect(block.diagram, diagram);
  });

  test('diagram block with a non-map diagram field yields an empty map, no throw', () {
    final b = parseBlocks({
      'blocks': [
        {'type': 'diagram', 'board': 'arduino-uno', 'code': 'x', 'diagram': 'not-a-map'},
      ],
    });
    expect((b[0] as DiagramBlock).diagram, isEmpty);
  });

  test('tryit block parses language, code, expectedOutput and caption', () {
    final b = parseBlocks({
      'blocks': [
        {
          'type': 'tryit',
          'language': 'python',
          'code': 'print(1)',
          'expectedOutput': '1',
          'caption': 'Run it!',
        },
      ],
    });
    expect(b.length, 1);
    final block = b[0] as TryitBlock;
    expect(block.language, 'python');
    expect(block.code, 'print(1)');
    expect(block.expectedOutput, '1');
    expect(block.caption, 'Run it!');
  });

  test('tryit block tolerates missing optional fields', () {
    final b = parseBlocks({
      'blocks': [
        {'type': 'tryit', 'language': 'arduino', 'code': 'void setup(){}'},
      ],
    });
    final block = b[0] as TryitBlock;
    expect(block.expectedOutput, isNull);
    expect(block.caption, isNull);
  });

  test('exercise block parses prompt, starter, solution, check and caption', () {
    final b = parseBlocks({
      'blocks': [
        {
          'type': 'exercise',
          'language': 'micropython',
          'prompt': 'Print "hi"',
          'starter': '# write here',
          'solution': 'print("hi")',
          'check': 'hi',
          'caption': 'Give it a go',
        },
      ],
    });
    expect(b.length, 1);
    final block = b[0] as ExerciseBlock;
    expect(block.language, 'micropython');
    expect(block.prompt, 'Print "hi"');
    expect(block.starter, '# write here');
    expect(block.solution, 'print("hi")');
    expect(block.check, 'hi');
    expect(block.caption, 'Give it a go');
  });

  test('exercise block tolerates missing optional fields', () {
    final b = parseBlocks({
      'blocks': [
        {
          'type': 'exercise',
          'language': 'go',
          'prompt': 'Print hi',
          'starter': '',
          'solution': 'fmt.Println("hi")',
        },
      ],
    });
    final block = b[0] as ExerciseBlock;
    expect(block.check, isNull);
    expect(block.caption, isNull);
  });
}
