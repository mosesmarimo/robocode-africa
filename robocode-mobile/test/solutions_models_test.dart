import 'package:flutter_test/flutter_test.dart';
import 'package:robocode_mobile/models/solutions.dart';

void main() {
  test('SolutionEntry.fromJson reads all fields', () {
    final e = SolutionEntry.fromJson({
      'submissionId': 's1',
      'language': 'python',
      'code': 'print("hi")',
      'likeCount': 3,
      'likedByMe': true,
      'exemplar': false,
    });
    expect(e.submissionId, 's1');
    expect(e.language, 'python');
    expect(e.code, 'print("hi")');
    expect(e.likeCount, 3);
    expect(e.likedByMe, isTrue);
    expect(e.exemplar, isFalse);
  });

  test('SolutionEntry.fromJson tolerates missing fields', () {
    final e = SolutionEntry.fromJson(const {});
    expect(e.submissionId, '');
    expect(e.language, '');
    expect(e.code, '');
    expect(e.likeCount, 0);
    expect(e.likedByMe, isFalse);
    expect(e.exemplar, isFalse);
  });

  test('SolutionsGallery.fromJson parses the {solutions: [...]} envelope', () {
    final g = SolutionsGallery.fromJson({
      'solutions': [
        {'submissionId': 'a', 'language': 'cpp', 'code': 'x', 'likeCount': 5, 'likedByMe': false, 'exemplar': true},
        {'submissionId': 'b', 'language': 'python', 'code': 'y', 'likeCount': 1, 'likedByMe': true, 'exemplar': false},
      ],
    });
    expect(g.solutions, hasLength(2));
    expect(g.solutions[0].submissionId, 'a');
    expect(g.solutions[0].exemplar, isTrue);
    expect(g.solutions[1].likedByMe, isTrue);
  });

  test('SolutionsGallery.fromJson tolerates a malformed/missing list', () {
    expect(SolutionsGallery.fromJson(const {}).solutions, isEmpty);
    expect(SolutionsGallery.fromJson({'solutions': 'nope'}).solutions, isEmpty);
  });

  test('SolutionsResult.unlocked carries the gallery and is not locked', () {
    final r = SolutionsResult.unlocked(SolutionsGallery.empty);
    expect(r.locked, isFalse);
    expect(r.lockedMessage, isNull);
    expect(r.gallery.solutions, isEmpty);
  });

  test('SolutionsResult.locked defaults to the standard "solve it first" message', () {
    final r = SolutionsResult.locked();
    expect(r.locked, isTrue);
    expect(r.lockedMessage, 'Solve it first to see other solutions.');
    expect(r.gallery.solutions, isEmpty);
  });

  test('SolutionsResult.locked can carry the backend\'s own 403 message', () {
    final r = SolutionsResult.locked('Solve it first to see other solutions.');
    expect(r.lockedMessage, 'Solve it first to see other solutions.');
  });
}
