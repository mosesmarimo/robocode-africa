/// Runtime configuration. Override at build/run time with --dart-define:
///   flutter run --dart-define=API_BASE=http://10.0.2.2:4000 --dart-define=WEB_BASE=http://10.0.2.2:3000
///
/// Defaults target a local dev backend. Android emulators must use 10.0.2.2
/// instead of localhost to reach the host machine.
class AppConfig {
  /// Base URL of the RoboCode NestJS API.
  static const String apiBase = String.fromEnvironment(
    'API_BASE',
    defaultValue: 'http://localhost:4000',
  );

  /// Base URL of the RoboCode web app (used to embed the Studio simulator).
  static const String webBase = String.fromEnvironment(
    'WEB_BASE',
    defaultValue: 'http://localhost:3000',
  );

  static const String appName = 'RoboCode.Africa';
}
