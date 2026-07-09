import 'package:flutter_test/flutter_test.dart';
import 'package:robocode_mobile/models/project.dart';

void main() {
  test('ProjectDetail.fromJson reads project envelope', () {
    final p = ProjectDetail.fromJson({
      'project': {'id': 'p1', 'title': 'Robot', 'boardType': 'arduino-uno', 'kind': 'robotics', 'description': 'hi', 'ownerId': 'u1'}
    });
    expect(p.id, 'p1');
    expect(p.title, 'Robot');
    expect(p.boardType, 'arduino-uno');
    expect(p.ownerId, 'u1');
  });

  test('ProjectDetail tolerates flat shape and missing fields', () {
    final p = ProjectDetail.fromJson({'id': 'p2', 'title': 'X'});
    expect(p.id, 'p2');
    expect(p.description, isNull);
    expect(p.boardType, '');
  });

  test('ProjectSummary parses owner + aiScoreData; null aiScoreData ok', () {
    final list = ProjectSummary.listFromTop({
      'projects': [
        {'id': 'a', 'title': 'A', 'kind': 'coding', 'aiScore': 90,
         'aiScoreData': {'usefulness': 1, 'innovation': 2, 'originality': 3, 'complexity': 4, 'overall': 90, 'summary': 's'},
         'owner': {'id': 'o1', 'displayName': 'Ada', 'avatarSeed': 'seed'}},
        {'id': 'b', 'title': 'B', 'owner': {'id': 'o2', 'displayName': 'Lee'}},
      ]
    });
    expect(list.length, 2);
    expect(list[0].aiScore, 90);
    expect(list[0].aiScoreData!.usefulness, 1);
    expect(list[0].ownerName, 'Ada');
    expect(list[1].aiScoreData, isNull);
  });

  test('listFromTop tolerates malformed input', () {
    expect(ProjectSummary.listFromTop(null), isEmpty);
    expect(ProjectSummary.listFromTop({'projects': 'x'}), isEmpty);
  });
}
