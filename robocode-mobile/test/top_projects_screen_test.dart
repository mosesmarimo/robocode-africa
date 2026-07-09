import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:robocode_mobile/models/project.dart';
import 'package:robocode_mobile/screens/projects/top_projects_screen.dart';

void main() {
  testWidgets('renders a ranked list of projects', (tester) async {
    final items = [
      const ProjectSummary(id: 'a', title: 'Alpha', kind: 'coding', ownerName: 'Ada', aiScore: 95),
      const ProjectSummary(id: 'b', title: 'Beta', kind: 'robotics', ownerName: 'Lee', aiScore: 80),
    ];
    await tester.pumpWidget(MaterialApp(
      home: Scaffold(body: TopProjectsList(items: items)),
    ));
    await tester.pumpAndSettle();
    expect(find.text('Alpha'), findsOneWidget);
    expect(find.text('Beta'), findsOneWidget);
    expect(find.textContaining('95'), findsWidgets);
  });

  testWidgets('empty list renders without throwing', (tester) async {
    await tester.pumpWidget(const MaterialApp(
      home: Scaffold(body: TopProjectsList(items: [])),
    ));
    await tester.pumpAndSettle();
    expect(find.byType(TopProjectsList), findsOneWidget);
  });
}
