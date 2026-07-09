import 'dart:convert';

/// Languages that open the robotics Studio when no `board` is given. Matches
/// the web `ROBOTICS_LANGS` (only arduino; micropython alone opens the coding
/// studio — it only stays robotics when it carries a robotics `board`, e.g.
/// esp32/pico).
const Set<String> roboticsLangs = {'arduino'};

/// Boards the robotics Studio can open. Matches the web `ROBOTICS_BOARDS`.
/// Used to decide mode=robotics vs coding: a known board always wins over the
/// language heuristic (so micropython on the Pico opens robotics, not coding).
const Set<String> roboticsBoards = {'arduino-uno', 'esp32', 'raspberry-pi-pico'};

/// Max chars of the encoded `diagram` query param (mirrors web
/// `STUDIO_DIAGRAM_MAX`) so the URL stays within browser/WebView limits.
const int studioDiagramMax = 16000;

/// base64url (RFC 4648) of the UTF-8 bytes, padding stripped — byte-identical
/// to the web `encodeStudioCode`, so the same studio URL round-trips.
String encodeStudioCode(String code) {
  return base64Url.encode(utf8.encode(code)).replaceAll('=', '');
}

/// Test-only helper: decode a padded base64url string back to text.
String decodeForTest(String padded) => utf8.decode(base64Url.decode(padded));

/// base64url of the diagram's JSON encoding — byte-identical to the web
/// `encodeStudioDiagram`, so the Studio decodes it the same way regardless of
/// which client (web or mobile) built the link.
String encodeStudioDiagram(Map<String, dynamic> diagram) {
  return base64Url.encode(utf8.encode(jsonEncode(diagram))).replaceAll('=', '');
}

/// Relative Studio path that opens [code] in the right Studio mode.
/// - When [board] is a known robotics board, forces mode=robotics on that
///   board (so e.g. micropython on the Pico opens robotics, not coding).
/// - Else falls back to the language heuristic (only `arduino` is robotics).
/// - When a [diagram] is supplied for a robotics link, appends
///   `&diagram=<base64url(JSON)>`, omitting it past [studioDiagramMax] chars
///   so the URL never blows past practical limits.
String studioHref(
  String language,
  String code, {
  String? board,
  Map<String, dynamic>? diagram,
}) {
  final explicitRobotics = board != null && roboticsBoards.contains(board);
  final isRobotics = explicitRobotics || roboticsLangs.contains(language);
  final params = <String, String>{
    'mode': isRobotics ? 'robotics' : 'coding',
    'lang': language,
    if (isRobotics) 'board': explicitRobotics ? board : 'arduino-uno',
    'code': encodeStudioCode(code),
  };
  if (isRobotics && diagram != null) {
    final enc = encodeStudioDiagram(diagram);
    if (enc.length <= studioDiagramMax) params['diagram'] = enc;
  }
  final query = params.entries
      .map((e) => '${e.key}=${Uri.encodeQueryComponent(e.value)}')
      .join('&');
  return 'studio/new?$query';
}
