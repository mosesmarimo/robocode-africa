import 'dart:convert';

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
    test('micropython + esp32 board routes to robotics on that board (matches web)', () {
      final h = studioHref('micropython', 'x', board: 'esp32');
      expect(h, contains('mode=robotics'));
      expect(h, contains('board=esp32'));
    });
    test('micropython + raspberry-pi-pico board routes to robotics on that board', () {
      final h = studioHref('micropython', 'x', board: 'raspberry-pi-pico');
      expect(h, contains('mode=robotics'));
      expect(h, contains('board=raspberry-pi-pico'));
    });
    test('unknown board falls back to the language heuristic', () {
      final h = studioHref('python', 'x', board: 'not-a-real-board');
      expect(h, contains('mode=coding'));
    });
    test('diagram is appended for a robotics link, base64url encoded', () {
      final diagram = {
        'board': 'arduino-uno',
        'parts': [
          {'id': 'mcu', 'type': '__board__:arduino-uno', 'x': 0, 'y': 0},
        ],
        'wires': <Map<String, dynamic>>[],
      };
      final h = studioHref('arduino', 'void setup(){}', board: 'arduino-uno', diagram: diagram);
      expect(h, contains('diagram='));
      final diagramParam = Uri.splitQueryString(h.split('?').last)['diagram']!;
      expect(RegExp(r'^[A-Za-z0-9\-_]+$').hasMatch(diagramParam), isTrue);
      expect(jsonDecode(decodeForTest(diagramParam.padRight((diagramParam.length + 3) & ~3, '='))), diagram);
    });
    test('diagram is omitted for a coding link even if supplied', () {
      final diagram = {'board': 'arduino-uno', 'parts': [], 'wires': []};
      final h = studioHref('python', 'x', diagram: diagram);
      expect(h, isNot(contains('diagram=')));
    });
    test('oversize diagram is omitted past the 16000-char cap', () {
      final huge = {
        'board': 'arduino-uno',
        'parts': [
          {'id': 'mcu', 'type': '__board__:arduino-uno', 'x': 0, 'y': 0, 'blob': 'x' * 20000},
        ],
        'wires': <Map<String, dynamic>>[],
      };
      final h = studioHref('arduino', 'x', board: 'arduino-uno', diagram: huge);
      expect(h, isNot(contains('diagram=')));
    });
  });
}
