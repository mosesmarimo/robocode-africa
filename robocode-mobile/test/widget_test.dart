// Basic smoke test for the RoboCode mobile app.
import 'package:flutter_test/flutter_test.dart';

import 'package:robocode_mobile/main.dart';

void main() {
  testWidgets('App boots', (WidgetTester tester) async {
    await tester.pumpWidget(const RoboCodeApp());
    expect(find.byType(RoboCodeApp), findsOneWidget);
  });
}
