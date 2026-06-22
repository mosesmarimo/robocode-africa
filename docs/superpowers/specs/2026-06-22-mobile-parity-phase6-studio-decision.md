# Mobile Parity — Phase 6: Studio — Decision

Date: 2026-06-22. Repo: `robocode-mobile`.

## Decision: keep the embedded WebView Studio (do NOT rewrite native)

The mobile Studio (`lib/screens/studio_screen.dart`) embeds the real web Studio in a WebView,
authenticated by injecting the JWT as the `rc_session` cookie. Phase 1 generalized it to load
an arbitrary path (`StudioScreen.launch`), so it already opens saved projects, challenge
starters, AND the new coding-mode "Open in RoboCode Studio" snippet URLs.

This already delivers **full feature parity** with the web Studio: Monaco multi-file editor,
the in-browser Arduino/RP2040 simulation (avr8js/rp2040js), the Wokwi circuit canvas, serial
monitor, AI run/explain/validate, and RoboVibe — all the real thing, running inside the app.

A native Flutter rewrite was evaluated and **rejected**:

- It would require reimplementing Monaco (or an inferior editor), the avr8js/rp2040js simulators
  (JS-only, no Dart port), and the Wokwi canvas — months of work.
- It would *reduce* capability versus the WebView (which runs the actual web Studio), i.e. a
  regression, not parity.
- The web Studio is the single source of truth; embedding it keeps mobile automatically in sync
  with web Studio improvements (no duplicate maintenance).

## What Phase 6 shipped

A small UX polish to the WebView host: a **Retry** button on the load-error state (previously the
user had to back out and re-enter). Loading spinner, error message, refresh action, title
"RoboCode Studio", and cookie auth were already present.

## Revisit criteria

Reconsider a native editor only if: (a) offline editing becomes a hard requirement, or (b) the
WebView proves too slow/janky on low-end devices in real testing. Neither is currently evidenced.
