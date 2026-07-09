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

  testWidgets('diagram block renders a wiring-diagram card with a View in Studio button',
      (tester) async {
    await tester.pumpWidget(_host([
      DiagramBlock(
        board: 'arduino-uno',
        code: 'void setup(){}',
        diagram: {
          'board': 'arduino-uno',
          'parts': [
            {'id': 'mcu', 'type': '__board__:arduino-uno', 'x': 0, 'y': 0},
            {'id': 'led1', 'type': 'wokwi-led', 'x': 10, 'y': 10},
          ],
          'wires': const [],
        },
      ),
    ]));
    await tester.pumpAndSettle();
    expect(find.text('Wiring diagram'), findsOneWidget);
    expect(find.text('1 component'), findsOneWidget);
    expect(find.text('View in Studio'), findsOneWidget);
  });

  testWidgets('tryit block renders code, expected output, caption and an Open in Studio button',
      (tester) async {
    await tester.pumpWidget(_host(const [
      TryitBlock(
        language: 'python',
        code: 'print(1)',
        expectedOutput: '1',
        caption: 'Give it a go',
      ),
    ]));
    await tester.pumpAndSettle();
    expect(find.textContaining('Try it'), findsOneWidget);
    expect(find.text('Open in RoboCode Studio'), findsOneWidget);
    expect(find.textContaining('Give it a go'), findsOneWidget);
    // Not tapped here: tapping pushes to '/studio-open', which needs a
    // GoRouter in the widget tree (see studio/open_in_studio tests for the
    // href-building logic itself).
  });

  testWidgets('exercise block renders the prompt, starter code and a Show answer button',
      (tester) async {
    await tester.pumpWidget(_host(const [
      ExerciseBlock(
        language: 'python',
        prompt: 'Print "hi"',
        starter: '# write here',
        solution: 'print("hi")',
      ),
    ]));
    await tester.pumpAndSettle();
    expect(find.text('EXERCISE'), findsOneWidget);
    // The starter/solution code renders via HighlightView (a RichText with
    // per-token spans for syntax highlighting), so matching its text needs
    // findRichText: true — plain find.textContaining only looks at Text.data.
    expect(find.textContaining('write here', findRichText: true), findsOneWidget);
    expect(find.text('Show answer'), findsOneWidget);
    expect(find.text('SOLUTION'), findsNothing);
    // Not tapped here: revealing pings the (in-progress) completion endpoint
    // via a real ApiClient/Dio call, same reason the Open-in-Studio buttons
    // above aren't tapped either — see _ExerciseCardState._reveal.
  });
}
