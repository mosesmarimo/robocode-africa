# Accessibility, Internationalisation and Low-Bandwidth Design

## Overview

RoboCode.Africa serves a diverse population of primary and high school students, teachers, School Admins, and parents distributed across Sub-Saharan Africa, the African diaspora, and beyond. This population brings a wide spread of physical abilities, ages, native languages, device capabilities, and network conditions. Accessibility, internationalisation (i18n), and resilience to constrained connectivity are therefore first-class engineering concerns, not afterthoughts.

This section specifies the requirements that ensure every user — regardless of disability status, language, device tier, or connection quality — can participate fully in the RoboCode.Africa learning experience. Requirements are identified with the prefix `NFR-ACC` (accessibility), `NFR-I18N` (internationalisation and localisation), and `NFR-LBW` (low-bandwidth and offline). Cross-references are made to:

- **Section 17 (Non-Functional Requirements)** for performance budgets and device-tier definitions.
- **Section 18 (Security, Privacy and Child Safety)** for data-minimisation obligations that constrain analytics on minors.
- **Section 7 (Functional Requirements: RoboCode Studio IDE)** for the Studio canvas and editor surfaces to which many accessibility rules directly apply.
- **Section 8 (Functional Requirements: RoboCode Simulation Engine (RSE))** for the 3D/2D rendering fallback behaviour referenced in the low-bandwidth strategy.
- **Section 3 (System Architecture)** and **Section 4 (Technology Stack and Rationale)** for the technical layer choices (React 18, Next.js App Router, Tailwind CSS, Radix/shadcn, Monaco editor, Three.js, wokwi-elements, avr8js, rp2040js) against which these requirements are verified.

---

## Accessibility Requirements (WCAG 2.2 AA)

### Conformance Target and Scope

RoboCode.Africa commits to **WCAG 2.2 Level AA** conformance across all authenticated and public-facing surfaces: the marketing site (robocode.africa), every tenant subdomain and custom domain, RoboCode Studio (the IDE/simulator workspace), dashboards, onboarding flows, and all notification/email templates.

WCAG 2.2 introduces several success criteria beyond 2.1 AA that are directly applicable to the platform's interactive components — notably SC 2.4.11 (Focus Not Obscured), SC 2.4.12 (Focus Not Obscured — Enhanced), SC 2.5.7 (Dragging Movements), SC 2.5.8 (Target Size Minimum), and SC 3.2.6 (Consistent Help). All five are covered by specific requirements below.

The Monaco editor, Wokwi wokwi-elements web components, and Three.js/React Three Fiber canvases are third-party or open-source components. Where a third-party component cannot meet a success criterion natively, the platform **shall** provide an accessible wrapper, alternative interaction surface, or documented workaround.

### Perceivability

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| NFR-ACC-001 | All non-text content (icons, component thumbnails, board diagrams, simulation state indicators) **shall** have a programmatic text alternative (`alt`, `aria-label`, or `aria-labelledby`). Decorative images **shall** carry `alt=""` or `role="presentation"`. | Must | WCAG 2.2 SC 1.1.1. Verified by automated axe-core scan and manual screen-reader test. |
| NFR-ACC-002 | All audio output produced by the simulation (buzzer tones, sound sensor playback) **shall** have a visible on-screen volume indicator and an option to display a text or visual substitute (e.g., waveform animation labelled with frequency). Audio-only content **shall** not be the sole means of conveying simulation state. | Must | WCAG 2.2 SC 1.1.1, SC 1.4.2. |
| NFR-ACC-003 | All video content (tutorial videos, onboarding walkthroughs) **shall** provide captions and a text transcript. Captions **shall** meet a minimum accuracy of 98% and **shall** be synchronised to within ±250 ms. | Must | WCAG 2.2 SC 1.2.2, SC 1.2.3. |
| NFR-ACC-004 | The UI colour palette **shall** meet or exceed a contrast ratio of 4.5:1 for body text and UI labels, and 3:1 for large text (≥18 pt or ≥14 pt bold) and graphical UI components including simulation state badges. | Must | WCAG 2.2 SC 1.4.3, SC 1.4.11. Tested across all white-label Tenant themes via automated contrast checks at CI time. |
| NFR-ACC-005 | Text **shall** remain readable and the layout **shall** remain functional when a user enlarges text up to 200% via browser zoom without requiring horizontal scrolling on a 1280 px-wide viewport, and when custom font-size/spacing overrides (letter-spacing ≥ 0.12 em, line height ≥ 1.5) are applied via user stylesheets. | Must | WCAG 2.2 SC 1.4.4, SC 1.4.12. |
| NFR-ACC-006 | The RoboCode Studio canvas (wokwi-elements), the 3D simulation view (Three.js/React Three Fiber), and the code editor (Monaco) **shall** not rely exclusively on colour to convey component status, wire connections, error states, or simulation output. Shape, label, pattern, or icon **shall** supplement colour in every case. | Must | WCAG 2.2 SC 1.4.1. Critical for colour-blind students. |
| NFR-ACC-007 | On-hover tooltips and contextual popovers (component pin descriptions, error messages) **shall** remain visible when the pointer moves over the tooltip itself, **shall** be dismissible via Escape without losing context, and **shall** persist until dismissed. | Must | WCAG 2.2 SC 1.4.13. |

### Operability

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| NFR-ACC-008 | All platform functionality — including drag-and-drop component placement on the Studio canvas, breadboard wiring, and block-based code construction — **shall** be achievable via keyboard alone. Arrow-key navigation on the canvas, Enter/Space to place components, and a keyboard-accessible wiring mode **shall** be provided as the alternative to mouse/touch dragging. | Must | WCAG 2.2 SC 2.1.1, SC 2.5.7. |
| NFR-ACC-009 | No keyboard trap **shall** exist anywhere in the application. Focus **shall** never be confined to a sub-region (modal, panel, popover) unless a clearly labelled and keyboard-accessible means of escape is present (Escape key, or a visible close control reachable within ≤ 3 Tab presses). | Must | WCAG 2.2 SC 2.1.2. |
| NFR-ACC-010 | All interactive controls **shall** have a minimum touch/click target size of 24×24 CSS px; the recommended minimum is 44×44 CSS px for primary actions. Controls that cannot meet 44×44 px **shall** have no intercepting control within 24 px of any edge. | Must | WCAG 2.2 SC 2.5.8. Especially important for primary-school students on Android tablets. |
| NFR-ACC-011 | Keyboard focus **shall** be visible on all interactive elements at all times. The focus indicator **shall** have a minimum area of the perimeter of the unfocused component multiplied by 2 CSS px, and a minimum contrast ratio of 3:1 between the focused and unfocused states. Focus **shall** never be fully obscured by sticky headers, floating toolbars, or overlays. | Must | WCAG 2.2 SC 2.4.7, SC 2.4.11. |
| NFR-ACC-012 | The tab order within RoboCode Studio **shall** follow a logical reading/workflow sequence: toolbar → canvas → component palette → editor panel → run/stop controls → console. Where visual layout diverges from DOM order, `tabindex` management or a focus-management hook **shall** maintain a sensible sequence. | Must | WCAG 2.2 SC 2.4.3. |
| NFR-ACC-013 | All time limits imposed by the platform (session expiry, assignment deadlines) **shall** provide the user with advance notice of at least 20 seconds and offer options to extend the session or save work. Auto-submit of in-progress assignments at a deadline **shall** be preceded by a 5-minute and 1-minute warning. | Must | WCAG 2.2 SC 2.2.1. |
| NFR-ACC-014 | The platform **shall** honour the `prefers-reduced-motion` media query. When set, all non-essential animations (transition effects, loading spinners, canvas pan animations, 3D camera rotations) **shall** be replaced with instant state changes or static representations. The simulation visualisation (LEDs flashing, motor rotating) is considered essential and **shall** remain active but at reduced frame rate (≤ 10 fps) to minimise vestibular impact. | Must | WCAG 2.2 SC 2.3.3 (AAA aspiration). Applied via Tailwind `motion-safe` / `motion-reduce` variants. |
| NFR-ACC-015 | All pages **shall** include a "Skip to main content" link as the first focusable element, revealing on keyboard focus. RoboCode Studio **shall** provide "Skip to editor" and "Skip to canvas" landmarks accessible from the main navigation. | Must | WCAG 2.2 SC 2.4.1. |
| NFR-ACC-016 | Help affordances (onboarding tooltips, contextual help buttons, error recovery guidance) **shall** appear in a consistent location across all pages and screens (top-right corner of each panel) and **shall** be keyboard-accessible. | Should | WCAG 2.2 SC 3.2.6. |

### Understandability

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| NFR-ACC-017 | Every page **shall** declare its human language in the HTML `lang` attribute and set the locale-specific `lang` on any inline text rendered in a different language. | Must | WCAG 2.2 SC 3.1.1, SC 3.1.2. Critical for correct screen-reader pronunciation in African languages. |
| NFR-ACC-018 | Error messages **shall** identify the field in error, describe the cause in plain language appropriate to the primary-school reading level (Flesch-Kincaid Grade ≤ 6 for student-facing messages), and suggest a correction. Password-strength errors **shall** explain the specific unmet criterion. | Must | WCAG 2.2 SC 3.3.1, SC 3.3.3. |
| NFR-ACC-019 | Form labels **shall** be persistent (not placeholder-only). Required fields **shall** be marked with a visible indicator (asterisk) and an `aria-required="true"` attribute. Instructions that constrain acceptable input **shall** be displayed before the field, not only after submission. | Must | WCAG 2.2 SC 3.3.2. |
| NFR-ACC-020 | Critical and irreversible actions (account deletion, project deletion, student removal from a class) **shall** present an explicit confirmation step with clear labelling of the consequence. Confirmation dialogs **shall** be keyboard-operable and trap focus appropriately. | Must | WCAG 2.2 SC 3.3.4. |

### Robustness

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| NFR-ACC-021 | All custom interactive components built on Radix UI / shadcn **shall** expose complete WAI-ARIA roles, states, and properties consistent with the ARIA Authoring Practices Guide (APG) patterns (dialog, combobox, tree, menu, tabs, slider). | Must | WCAG 2.2 SC 4.1.2. Enforced by automated axe-core checks in CI. |
| NFR-ACC-022 | Status messages (save confirmation, simulation started, compile error, RoboPoints earned) that appear without the user moving focus **shall** use `role="status"` or `role="alert"` (for critical errors) so screen readers announce them without interrupting current focus. | Must | WCAG 2.2 SC 4.1.3. |
| NFR-ACC-023 | The platform **shall** undergo a manual accessibility audit with at least one primary-school-aged student using an assistive technology (screen reader or switch access) before each major release. Findings **shall** be tracked in the issue tracker and resolved within the same release cycle for Must/Should severity. | Must | Process requirement. Tooling: NVDA + Chrome, VoiceOver + Safari, TalkBack + Android Chrome. |

### Age-Appropriate UI

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| NFR-ACC-024 | Primary-school student interfaces (grades 1–7, typically ages 6–13) **shall** use a minimum body font size of 16 px, icon labels alongside every icon, block-based (visual) coding as the default mode, and simplified navigation with ≤ 5 top-level items. | Must | Aligned with WCAG 2.2 SC 1.4.4 and the UK Children's Code age-appropriate design principle. |
| NFR-ACC-025 | High-school student interfaces (grades 8–12, ages 13–18) **shall** default to the text-code editor (Monaco) while keeping the block-mode toggle available. Font size minimum 14 px. Navigation **shall** expose the full feature set but group advanced features under progressive disclosure. | Must | |
| NFR-ACC-026 | The block-based code editor **shall** support keyboard assembly of blocks: keyboard search of the block palette, arrow-key navigation of the block canvas, and a screen-reader-accessible block description that reads "Connect [block name] to [target slot name]" when a connection is made. | Must | SC 2.1.1. Implements accessible drag-and-drop alternative. |

---

## Internationalisation and Localisation Requirements

### I18n Architecture

RoboCode.Africa is built from the outset as a multilingual platform, using a robust i18n framework that separates all user-facing strings from application logic, supports bidirectional (LTR/RTL) text layout, and provides a structured localisation workflow for community and professional translators.

```
+-----------------------------------------------------------+
|                  i18n Architecture                        |
|                                                           |
|  Source language: English (en-GB)                         |
|                                                           |
|  Translation files (JSON / ICU format)                    |
|  /locales/<locale>/<namespace>.json                       |
|         |                                                 |
|         v                                                 |
|  next-intl (Next.js App Router integration)               |
|  +  react-i18next (Studio SPA / rich client)              |
|         |                                                 |
|         v                                                 |
|  Runtime locale resolution:                               |
|   1. User preference (account setting)                    |
|   2. Tenant default locale (School Admin setting)         |
|   3. Browser Accept-Language header                       |
|   4. Platform default: en-GB                              |
|         |                                                 |
|         v                                                 |
|  LTR / RTL layout via CSS logical properties             |
|  + Next.js `dir` attribute on <html>                      |
+-----------------------------------------------------------+
```

### Core I18n Framework Requirements

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| NFR-I18N-001 | All user-facing strings in the platform **shall** be externalised into locale message files (ICU MessageFormat) and **shall** never be hard-coded in JSX/TSX components or backend response bodies. | Must | Enforced by an ESLint i18n rule (`eslint-plugin-i18n`) in CI. |
| NFR-I18N-002 | The i18n framework **shall** support ICU MessageFormat features including: plural rules (CLDR-compliant), gender inflection, select expressions, date/time formatting per locale, and number formatting (decimal separators, grouping separators, currency symbols). | Must | Required for correct pluralisation in Swahili, Arabic, and French. |
| NFR-I18N-003 | The platform **shall** serve locale-appropriate date formats (DD/MM/YYYY vs. MM/DD/YYYY), number formats, and currency symbols without requiring manual string assembly in component code. | Must | Handled via `Intl.DateTimeFormat` and `Intl.NumberFormat` APIs. |
| NFR-I18N-004 | The Next.js App Router **shall** implement locale-prefixed routing (`/en/`, `/fr/`, `/sw/`, `/ar/`, etc.) with `next-intl` middleware for locale detection, redirects, and canonical URL generation. | Must | SEO-friendly. Avoids locale pollution in URL-sharing. |
| NFR-I18N-005 | The platform **shall** expose a per-user language preference setting (accessible from the account profile page and the top navigation), applied immediately without requiring a full page reload where technically feasible. | Must | |
| NFR-I18N-006 | School Admins **shall** be able to set a default locale for their tenant. That default **shall** pre-populate new user accounts created under that tenant but remain overridable by each user. | Should | Useful for monolingual school deployments. |

### Language Coverage

The initial supported-language set is defined below. Phase 1 covers the launch languages; Phase 2 adds extended African-language coverage in the subsequent release cycle.

| Phase | Locale Code | Language | Script | Dir | Notes |
|-------|------------|----------|--------|-----|-------|
| 1 | en-GB | English (British) | Latin | LTR | Source language and platform default. |
| 1 | fr-FR | French | Latin | LTR | Primary language in Francophone Africa (DRC, Senegal, Côte d'Ivoire, Cameroon, etc.). |
| 1 | pt-PT | Portuguese | Latin | LTR | Angola, Mozambique. Also pt-BR variant supported. |
| 1 | ar | Arabic (Modern Standard) | Arabic | RTL | North Africa (Egypt, Morocco, Sudan, Libya, Algeria, Tunisia). |
| 1 | sw | Swahili (Kiswahili) | Latin | LTR | East Africa — Kenya, Tanzania, Uganda, DRC, Rwanda. |
| 2 | sn | Shona | Latin | LTR | Zimbabwe. One of the platform's home-country languages. |
| 2 | nd | Ndebele (isiNdebele) | Latin | LTR | Zimbabwe, South Africa. |
| 2 | zu | Zulu (isiZulu) | Latin | LTR | South Africa. |
| 2 | ha | Hausa | Latin / Ajami | LTR | Nigeria, Niger, Ghana, and the Sahel. |
| 2 | yo | Yoruba | Latin | LTR | Nigeria, Benin. Could add — roadmap item. |
| 2 | am | Amharic | Ethiopic | LTR | Ethiopia. Complex script; specialist translator required. |

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| NFR-I18N-007 | The platform **shall** launch with complete UI translations for the Phase 1 locale set (en-GB, fr-FR, pt-PT, ar, sw). "Complete" means ≥ 97% string coverage with zero missing translations on critical user-journey paths (signup, login, Studio, assignment submission). | Must | Missing translation keys **shall** fall back to en-GB, never display raw key strings. |
| NFR-I18N-008 | The platform **shall** add Shona (`sn`) and Ndebele (`nd`) translations in Phase 2, given their status as official languages of Zimbabwe, the platform's home country. | Should | Community-assisted translation via the localisation workflow (NFR-I18N-012). |
| NFR-I18N-009 | Hausa (`ha`) and Zulu (`zu`) translations **shall** be delivered as Phase 2 languages for Nigeria and South Africa market entry. | Should | |
| NFR-I18N-010 | Arabic (`ar`) support **shall** trigger full RTL layout as specified in NFR-I18N-014 through NFR-I18N-018. No Arabic-locale user **shall** encounter an LTR-only layout. | Must | |

### RTL Layout Requirements

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| NFR-I18N-011 | All layout **shall** use CSS logical properties (`margin-inline-start`, `padding-inline-end`, `inset-inline-start`, `border-inline-end`, etc.) rather than physical properties (`margin-left`, `padding-right`) throughout the component library and application code. | Must | Tailwind CSS `[dir="rtl"]` variants and Tailwind v3+ logical-property utilities **shall** be the primary mechanism. |
| NFR-I18N-012 | When `ar` locale is active, the `<html>` element **shall** carry `dir="rtl"` and `lang="ar"`. All flex/grid layouts, icons that imply directionality (arrows, breadcrumbs, progress bars), and the Monaco editor **shall** render in RTL orientation. | Must | Monaco editor has experimental RTL support; verified against all Arabic locale user flows. |
| NFR-I18N-013 | The RoboCode Studio canvas (component drag-and-drop area) and breadboard layout **shall** remain spatially fixed (hardware diagrams are direction-neutral). Only the surrounding chrome (toolbars, panels, labels) **shall** mirror in RTL. | Must | Wokwi-elements SVG canvases are direction-neutral by design. |
| NFR-I18N-014 | RTL and LTR layouts **shall** be tested in automated visual regression (Chromatic or equivalent) for every pull request touching layout or CSS. A dedicated RTL test suite **shall** exist covering all major page templates. | Must | |

### Localisation Workflow

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| NFR-I18N-015 | Translation files **shall** be stored in version control under `/locales/<locale>/<namespace>.json`. A `translation-status.json` manifest **shall** track per-locale coverage percentage, updated automatically by CI on every merge to `main`. | Must | |
| NFR-I18N-016 | The platform **shall** integrate with a translation management system (TMS) — Lokalise or equivalent — that exposes an API for pushing new source strings and pulling reviewed translations. The CI/CD pipeline **shall** automatically push new English strings on merge and block release if critical-path translation coverage drops below 97%. | Should | Manual export/import acceptable at launch; TMS integration in Phase 2. |
| NFR-I18N-017 | Pseudo-localisation **shall** be run as a CI step to detect hard-coded strings, layout overflow caused by text expansion (French and Swahili strings are typically 20–40% longer than English), and RTL breakage. | Must | Pseudo-locale code: `xx-PSDO`. |
| NFR-I18N-018 | Community translators for Phase 2 African languages **shall** be able to contribute via a web-based translation review interface (provided by the TMS) without requiring access to the source code repository. Translations **shall** be reviewed by at least one native-speaker validator before merging. | Should | |
| NFR-I18N-019 | Arduino C/C++, MicroPython, CircuitPython, and block-based code editor keywords, API names, and compiler error messages **shall** remain in English in all locales. Only the surrounding IDE chrome (menus, labels, notifications, documentation) is translated. Programming language syntax is locale-invariant. | Must | Consistent with industry norms; avoids confusion when students search online for help. Applies across all three first-class boards (Arduino UNO R3, ESP32 DevKit, and Raspberry Pi Pico) and any custom boards added via the wokwi-boards library. |
| NFR-I18N-020 | Learning content (lesson text, challenge descriptions, hint text) **shall** be independently translatable per language, stored as separate content records in the database with a `locale` field, and linked to the canonical English content record. Untranslated lesson content **shall** fall back to English with a visible "Not yet translated" banner and an invitation to contribute a translation. | Should | See Section 11 (Functional Requirements: Learning Management and Content). |

---

## Low-Bandwidth and Offline Strategy

### Context and Principles

A significant portion of the RoboCode.Africa target audience connects via mobile data (2G/3G edge networks) or shared school Wi-Fi with low and variable throughput. Devices in use include budget Android tablets (2–3 GB RAM, ARM Cortex-A53), low-end Chromebooks (4 GB RAM), and shared desktop PCs in school computer labs. The platform **shall** be designed with a "low-bandwidth first" disposition: every byte counts, progressive enhancement governs feature delivery, and graceful degradation ensures that a student on a 1 Mbps mobile connection can still complete a lesson and run a simulation.

### Asset Optimisation

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| NFR-LBW-001 | All images **shall** be served as WebP (with AVIF where browser support permits), at appropriate responsive sizes via `<img srcset>` or Next.js `<Image>`. Raw PNG/JPEG uploads **shall** be transcoded at ingest time by the backend asset pipeline. | Must | Targets a 60–80% reduction over raw PNG for component thumbnails and lesson images. |
| NFR-LBW-002 | JavaScript bundles **shall** be code-split at the route level (Next.js App Router automatic code splitting) and at the feature level (RoboCode Studio, 3D simulation engine, Monaco editor loaded on demand). The initial page load JS payload for the marketing site **shall** not exceed 150 KB compressed (gzip/Brotli). | Must | Measured by Lighthouse in CI. |
| NFR-LBW-003 | The RoboCode Studio application shell (excluding the simulation engine and editor) **shall** be fully interactive within 5 seconds on a simulated 3G connection (10 Mbps download, 75 ms RTT) as measured by Time to Interactive (TTI) in Lighthouse. | Must | See also Section 17 (NFR-PERF). |
| NFR-LBW-004 | Wokwi-elements web components, avr8js WASM binaries, and rp2040js WASM binaries **shall** be cached aggressively in the browser (immutable cache headers for content-hashed asset filenames) and served from the CDN edge node nearest to the user. Target CDN: Cloudflare with a PoP in Johannesburg (for af-south-1 coverage), Lagos, Nairobi, and Cairo. | Must | Reduces cold-load time for returning users to < 1 second for cached assets. |
| NFR-LBW-005 | Fonts **shall** be subset to the Unicode ranges actually used by each locale (Latin, Arabic, Ethiopic) and served with `font-display: swap`. No more than two custom font families **shall** be loaded on initial page render. | Must | System font stack **shall** be the fallback. |
| NFR-LBW-006 | All API responses **shall** be compressed with Brotli (preferred) or gzip. The API gateway **shall** negotiate compression based on the `Accept-Encoding` request header. GraphQL query responses **shall** use field aliasing to avoid over-fetching; REST endpoints **shall** support sparse fieldsets where response size exceeds 10 KB. | Must | |

### 3D/2D Adaptive Rendering

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| NFR-LBW-007 | The RoboCode Studio simulation view **shall** offer two rendering modes: 3D (Three.js/React Three Fiber/WebGL2) and 2D (wokwi-elements SVG/Canvas). The default mode **shall** be determined by a device capability probe executed at session start. | Must | See Section 8 (Functional Requirements: RSE) for the rendering architecture. |
| NFR-LBW-008 | The device capability probe **shall** assess: WebGL2 availability, GPU renderer string (excluding known software renderers), available device memory (`navigator.deviceMemory`), and hardware concurrency (`navigator.hardwareConcurrency`). Devices with < 2 GB RAM or a software-only WebGL renderer **shall** default to 2D mode. | Must | |
| NFR-LBW-009 | Users **shall** be able to manually switch between 3D and 2D modes at any time via a toggle control in the RoboCode Studio toolbar without losing the current project state (component placement, wiring, code). | Must | |
| NFR-LBW-010 | The 3D simulation assets (GLTF models for Arduino UNO R3, ESP32 DevKit, Raspberry Pi Pico, breadboard, and component models) **shall** be lazy-loaded on demand and **shall** not be fetched if the session resolves to 2D mode. GLTF files **shall** use DRACO mesh compression and KTX2/Basis Universal texture compression. | Must | Estimated 3D asset bundle: < 5 MB compressed for the core board + breadboard set. |
| NFR-LBW-011 | The 2D simulation view **shall** be fully functional for all components in the Component and Sensor Library Specification (Section 10). No simulation feature **shall** be exclusive to 3D mode. 3D mode **shall** be a visual enhancement only. | Must | |
| NFR-LBW-012 | On detection of a network downgrade (Network Information API `effectiveType` change to `2g` or `slow-2g`) during an active session, the platform **shall** automatically offer to switch to 2D mode and suspend non-essential background requests (analytics, avatar fetch). | Should | |

### Progressive Web App and Offline Caching

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| NFR-LBW-013 | The platform **shall** implement a Progressive Web App (PWA) using a service worker (Workbox) providing the following offline capabilities: cached lesson content, cached Studio project files (most recent 10 projects per student), cached wokwi-elements, avr8js WASM, and rp2040js WASM for simulation, and cached Monaco editor bundle. | Must | A scoped PWA — read-ahead lesson caching, cached simulation assets, and an offline edit-and-queue path for the most recent 10 projects — is **in scope for v1.0** given the African connectivity context. This is the single authoritative scope decision; Sections 1, 7, and Appendix F are aligned to it. Full general-purpose offline editing of arbitrary projects remains out of scope for v1.0. |
| NFR-LBW-014 | The PWA **shall** be installable on Android Chrome and desktop Chrome/Edge. The `manifest.json` **shall** include app name, icons (192×192 and 512×512 px, maskable), theme colour, and `display: standalone`. | Should | Allows students to add RoboCode Studio to their home screen for fast access. |
| NFR-LBW-015 | When a user edits a project or completes a lesson step while offline, all mutations **shall** be queued in an IndexedDB-backed sync queue. On reconnection, the sync queue **shall** be replayed against the server API in order, with conflict resolution favouring the most recent local timestamp. The user **shall** be notified of sync status via a non-blocking status bar indicator. | Must | Uses Workbox Background Sync or a custom sync layer built on the Background Sync API. |
| NFR-LBW-016 | The service worker cache **shall** be segmented into three layers: (a) app shell (versioned, updated on deploy via cache-busting), (b) static assets (long-lived, content-hashed), and (c) dynamic content (lesson data, project files — stale-while-revalidate strategy with a 24-hour max-age). | Must | |
| NFR-LBW-017 | Offline lesson content **shall** be pre-cached when a student opens a lesson while online ("read-ahead" caching of the next 2 lessons in a learning path). Caching **shall** be throttled to avoid impacting active page performance (max 1 concurrent background fetch, deferred 5 seconds after page load). | Should | |
| NFR-LBW-018 | The service worker **shall** handle updates gracefully: users **shall** be notified of an available app update via a non-blocking banner ("Update available — tap to refresh"), and the update **shall** not activate mid-session without explicit user consent to avoid disrupting an active simulation or code edit. | Must | |

### Adaptive Media and Content Delivery

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| NFR-LBW-019 | Tutorial videos embedded in lessons **shall** be served via an adaptive bitrate (ABR) streaming protocol (HLS or MPEG-DASH). The default starting bitrate **shall** be 480p. Players **shall** respect the `prefers-reduced-data` media query and the Network Information API to lower the starting bitrate on metered or slow connections. | Should | Video hosting: S3-compatible object storage + CloudFront/Cloudflare Stream or equivalent. |
| NFR-LBW-020 | Static lesson content **shall** be available as a low-bandwidth text-only alternative, reachable via a "Low-bandwidth mode" toggle in user settings. In low-bandwidth mode: videos are replaced with thumbnails and transcripts; 3D simulation defaults to 2D; animations are reduced; image quality targets ≤ 50 KB per image. | Must | Addresses GSMA-reported 2G network conditions prevalent in rural Zimbabwe, Nigeria, and Tanzania. |
| NFR-LBW-021 | The platform **shall** optionally support SMS-based delivery of lesson completion confirmations and assignment notifications for students in areas where data access is intermittent but SMS is reliable. SMS integration **shall** use a provider with African coverage (e.g., Africa's Talking, Twilio). | Could | Requires School Admin opt-in per tenant. Data-minimisation: only send event type and timestamp via SMS, no PII beyond the student's registered phone number. |

### Low-End Device Support

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| NFR-LBW-022 | The platform **shall** be fully functional on the following minimum device profile: ARM Cortex-A53 SoC, 2 GB RAM, 16 GB storage, Android 9 or ChromeOS, and Chrome/Chromium 109+ (authoritative baseline: NFR-PORT matrix, NFR section). RoboCode Studio in 2D mode **shall** maintain ≥ 20 fps simulation update rate on this hardware floor. | Must | This profile represents the most common school-issued device in Sub-Saharan Africa as of 2025. |
| NFR-LBW-023 | The Monaco code editor **shall** be loaded with a minimal feature set on low-end devices (disable semantic tokenisation, disable breadcrumbs, reduce tokeniser worker thread count to 1) when `navigator.deviceMemory` < 2 is detected. Full feature set **shall** load on devices with ≥ 4 GB reported RAM. | Should | Monaco adaptive configuration via `editor.create` options. |
| NFR-LBW-024 | Memory usage of the RoboCode Studio tab **shall** not exceed 512 MB RSS on the minimum device profile (2 GB RAM) during a typical 45-minute lesson session in 2D simulation mode. A memory-usage monitor **shall** alert the engineering team via observability tooling (OpenTelemetry, Grafana) if the 90th-percentile session memory exceeds this threshold in production. | Must | See Section 21 (Observability, Logging, Monitoring and Support) for the observability stack. |
| NFR-LBW-025 | The avr8js and rp2040js WASM simulation cores **shall each** be instantiated in a dedicated Web Worker (or SharedArrayBuffer-backed worker where COOP/COEP headers permit) to prevent the simulation loop from blocking the main thread and degrading UI responsiveness on single-core or low-clock-speed devices. | Must | See Section 8 (Functional Requirements: RSE) for the threading model. |

---

## Verification and Testing

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| NFR-ACC-027 | An automated accessibility test gate (axe-core via `jest-axe` for unit/component tests, and `@axe-core/playwright` for end-to-end tests) **shall** run on every pull request and block merge on any new WCAG 2.2 AA violation. | Must | Zero new violations policy. Existing violations tracked as technical debt issues with assigned fix sprints. |
| NFR-ACC-028 | A Lighthouse CI accessibility audit **shall** be run on every deployment to staging, targeting a minimum Lighthouse accessibility score of 90. A score below 90 **shall** block promotion to production. | Must | |
| NFR-I18N-021 | Pseudo-localisation tests (`xx-PSDO`) **shall** run in CI to detect missing i18n wrappers, text-overflow layout breakage (simulates 40% text expansion), and RTL-specific failures. Results **shall** be reported in the CI pipeline as warnings that block merge if new regressions are introduced. | Must | |
| NFR-LBW-026 | Lighthouse Performance audits **shall** be run against a simulated 3G throttle profile (10 Mbps / 75 ms RTT) in CI on every pull request touching the Studio or lesson rendering paths, targeting a Lighthouse Performance score ≥ 70 and a Largest Contentful Paint (LCP) ≤ 4 seconds on that profile. | Must | |
| NFR-LBW-027 | End-to-end offline tests (Playwright service worker interception) **shall** verify that a student can load a pre-cached lesson, make a code edit, and queue a submission while offline, and that all queued mutations are correctly replayed after reconnection is simulated. | Must | Included in the integration test suite; run nightly against staging. |

---

## Summary of Requirement Counts

| Category | Must | Should | Could | Total |
|----------|------|--------|-------|-------|
| Accessibility (NFR-ACC) | 24 | 2 | 0 | 26 |
| Internationalisation (NFR-I18N) | 12 | 9 | 0 | 21 |
| Low-Bandwidth / Offline (NFR-LBW) | 14 | 7 | 1 | 22 |
| Verification | 5 | 0 | 0 | 5 |
| **Total** | **55** | **18** | **1** | **74** |

---

## Cross-References

- Section 3 (System Architecture) — CDN topology, service worker deployment model, COOP/COEP header configuration for SharedArrayBuffer.
- Section 4 (Technology Stack and Rationale) — Tailwind CSS logical properties, Radix/shadcn ARIA patterns, Next.js App Router i18n middleware, Workbox PWA.
- Section 7 (Functional Requirements: RoboCode Studio IDE) — canvas keyboard-navigation mode, block-based editor accessibility, Monaco integration.
- Section 8 (Functional Requirements: RoboCode Simulation Engine (RSE)) — 3D/2D rendering fallback, avr8js and rp2040js Web Worker threading model, Raspberry Pi Pico (RP2040) simulation via rp2040js.
- Section 9 (Functional Requirements: Code Authoring, Validation and Execution) — Monaco editor adaptive feature set, block-to-text transpilation.
- Section 10 (Component and Sensor Library Specification) — component catalogue whose 2D wokwi-elements representations are the accessibility-safe baseline.
- Section 11 (Functional Requirements: Learning Management and Content) — translated lesson content, video captioning, SMS notification.
- Section 17 (Non-Functional Requirements) — device-tier definitions, performance budgets, TTI targets.
- Section 18 (Security, Privacy and Child Safety) — data-minimisation obligations that constrain analytics SDKs loaded on student sessions.
- Section 21 (Observability, Logging, Monitoring and Support) — memory and performance alerting thresholds.
