# RoboCode.Africa — Mobile (Flutter)

The native mobile client for RoboCode.Africa. It talks to the same NestJS backend
(`robocode-backend`) as the web app, with native screens for auth, dashboard, learn,
projects, challenges, competitions, teams, leaderboard, badges, notifications and
profile/settings. The Studio simulator is embedded via a WebView pointing at the web
app's `/studio` route (the simulator is JS/WebAssembly only).

## Run

```bash
flutter pub get

# iOS simulator / web (backend on localhost):
flutter run --dart-define=API_BASE=http://localhost:4000 --dart-define=WEB_BASE=http://localhost:3000

# Android emulator (host is 10.0.2.2):
flutter run --dart-define=API_BASE=http://10.0.2.2:4000 --dart-define=WEB_BASE=http://10.0.2.2:3000

# Production:
flutter run --dart-define=API_BASE=https://api.robocode.africa --dart-define=WEB_BASE=https://robocode.africa
```

## Architecture

- `lib/config.dart` — API/web base URLs (override with `--dart-define`).
- `lib/api/api_client.dart` — Dio client; stores the JWT in secure storage and attaches it as a Bearer token.
- `lib/state/auth.dart` — auth/session state (Provider + ChangeNotifier).
- `lib/router.dart` — go_router with auth redirect + bottom-nav shell.
- `lib/theme.dart` — RoboCode brand theme (Material 3).
- `lib/screens/**` — one folder/file per feature area.
- `lib/widgets/common.dart` — shared widgets (AsyncView, BrandHeader, StatTile, …).

Auth: the app logs in at `POST /auth/login`, stores the returned JWT, and sends it as
`Authorization: Bearer`. The Studio WebView is authenticated by injecting the same JWT as
the `rc_session` cookie for the web origin.
