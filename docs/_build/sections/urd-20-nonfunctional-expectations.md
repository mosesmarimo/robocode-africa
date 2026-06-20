# Non-Functional User Expectations

## Overview

This section specifies the user-facing non-functional requirements (UR-NFR series) for RoboCode.Africa and RoboCode Studio. Non-functional requirements describe the qualities — not the features — that every user must be able to depend on: how fast the platform feels, how easy it is to pick up for an eight-year-old student on a borrowed Chromebook with a slow rural internet connection, how safe and private the experience is, how accessible it is to students with disabilities, and what minimum device and browser configuration is needed to participate.

These requirements apply platform-wide. Functional sections — including _User Requirements: RoboCode Studio Canvas, Components and Wiring_, _User Requirements: Simulation Experience_, _User Requirements: Code Editor and Programming_, and _User Requirements: Learning, Courses, Tasks and Assessment_ — inherit and must satisfy every UR-NFR constraint listed here. Corresponding system-level non-functional requirements are labelled NFR-CAT-nnn in the System Specification Document (SSD).

Requirements in this section use the identifier prefix **UR-NFR** and are grouped by quality attribute. MoSCoW priorities are assigned per the project canon convention: Must / Should / Could / Won-t (this release).

---

## Usability and Age-Appropriate Design

RoboCode.Africa serves primary-school students (approximately ages 8–12) and high-school students (approximately ages 13–18) within the same platform. The interface must be immediately comprehensible to both groups without extensive reading, while remaining professional enough for Teachers, School Admins, and Super Admins who use the same shell.

```
+-----------------------------------------------------------+
|           Age-Appropriate Interface Strategy              |
|                                                           |
|  Primary Mode (ages 8-12)   High-School Mode (13-18+)    |
|  +----------------------+   +--------------------------+  |
|  | Large icons          |   | Full editor controls     |  |
|  | Block-code default   |   | Text code (C/C++/Python) |  |
|  | Minimal text labels  |   | Advanced diagnostics     |  |
|  | Guided prompts       |   | Pro toolbar options      |  |
|  | Simplified error msg |   | Raw compiler output opt  |  |
|  +----------------------+   +--------------------------+  |
|                    |                 |                     |
|         Shared foundation: WCAG 2.2 AA, multilingual,     |
|         offline-capable, low-bandwidth, cross-device       |
+-----------------------------------------------------------+
```

### Interface Clarity and Simplicity

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-NFR-001 | The platform UI shall use a consistent visual language (icons, colour coding, button shapes) that allows a first-time student to identify the primary actions — create project, run simulation, submit task — without reading any on-screen text beyond a single label. | Must | Usability test with grade-4 student cohort: > 80 % must locate Run without assistance within 60 seconds. |
| UR-NFR-002 | All body text, labels, tooltips, and instructions presented to primary-school students shall target a reading grade level of Grade 4–5 (Flesch-Kincaid Grade Level ≤ 6) by default. | Must | Automated readability checks applied during content authoring. Teachers may author tasks at any level; the platform shell itself must comply. |
| UR-NFR-003 | The platform shall not require a student to read a block of text longer than three sentences before being able to take the next action. | Should | UI copy review must flag blocks exceeding this limit. |
| UR-NFR-004 | Primary-school students shall default to the block-based coding mode in RoboCode Studio (see _User Requirements: Code Editor and Programming_); a single clearly labelled toggle shall switch to text-code mode, with a confirmation prompt explaining the change. | Must | Default mode is determined by the student's grade-band setting, configurable by School Admin and Teacher. |
| UR-NFR-005 | Icons shall be accompanied by a short text label in all primary navigation elements; icons-only navigation is not acceptable in the main UI for student-facing pages. | Must | Exception: RoboCode Studio toolbar icons may omit text labels if a persistent tooltip appears on hover/focus within 500 ms. |
| UR-NFR-006 | The platform shall provide contextual inline help — a "?" icon that reveals a plain-English explanation and/or a short illustrative animation — alongside every non-obvious UI element in RoboCode Studio. | Must | Inline help must be available without leaving the current page or opening a new browser tab. |
| UR-NFR-007 | Error messages, warnings, and validation feedback displayed to students shall use plain, encouraging language; they shall identify what went wrong and suggest a corrective action, and shall never use raw system identifiers, stack traces, or HTTP status codes as the primary message. | Must | See also UR-SIM-100 through UR-SIM-104 for simulation-specific error message requirements. |
| UR-NFR-008 | The platform shall support a "Student View" and a "Teacher View" of the same page where layout complexity differs substantially — for example, a Teacher's gradebook dashboard must not impose its data density on a student's task submission page. | Must | Verified by role-based UI routing and separate component trees for each view. |
| UR-NFR-009 | All user-facing date and time displays shall use a human-readable format (e.g., "3 days left", "Due Monday 23 June") rather than raw ISO timestamps, except in admin/reporting exports. | Should | Timezone must be configurable per school (tenant); defaults to Africa/Harare (UTC+2). |
| UR-NFR-010 | Interactive onboarding tours shall be available for first-time login for each user role (Student, Teacher, School Admin), auto-triggered on first login and re-accessible from the help menu at any time. | Should | Tours must be skippable at any step. Completion state persisted per user account. |

---

## Accessibility

RoboCode.Africa must be accessible to students and educators with visual, motor, cognitive, and hearing differences. The platform targets WCAG 2.2 Level AA as its minimum accessibility standard.

### WCAG 2.2 AA Compliance

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-NFR-020 | The entire student-facing UI, teacher-facing UI, and admin-facing UI shall conform to WCAG 2.2 Level AA success criteria across all supported browsers and device types. | Must | Automated axe-core / Lighthouse scans plus manual screen-reader testing (NVDA on Windows, VoiceOver on macOS/iOS, TalkBack on Android) required before each major release. |
| UR-NFR-021 | All text elements shall maintain a minimum contrast ratio of 4.5:1 against their background (3:1 for large text ≥ 18 pt or 14 pt bold), across all platform themes including white-label tenant themes. | Must | White-label design-token generation (see _User Requirements: School Onboarding, Custom Domain and White-Labelling_) must enforce contrast validation at token-creation time. |
| UR-NFR-022 | The platform shall not rely solely on colour to convey information; every colour-coded indicator (e.g., simulation status, error/warning states, leaderboard ranks, pin states) shall include a supplementary text label, pattern, or icon. | Must | Tested against deuteranopia and protanopia simulation profiles. |
| UR-NFR-023 | All non-text content — including component icons in RoboCode Studio, badge images, avatar graphics, and tutorial diagrams — shall have a text alternative (alt text or aria-label) that conveys equivalent information to a screen reader user. | Must | Decorative images use empty alt="". No informational image is rendered without alt text. |
| UR-NFR-024 | All animations and motion effects (celebration animations, component movement in RoboCode Studio, level-up effects) shall respect the `prefers-reduced-motion` CSS media query, substituting instant state changes for animated transitions when the user has indicated a preference for reduced motion. | Must | Verified on all major browsers. Applies to both 2D canvas and 3D WebGL rendering paths. |
| UR-NFR-025 | Audio output from the simulation (buzzers, tone generation) shall be accompanied by a visible indicator on the simulated component (e.g., a speaker/sound icon with animation) so that deaf or hard-of-hearing students can observe that audio is being produced. | Must | Visual indicator active whenever the Web Audio API is producing non-zero audio output for that component. |

### Keyboard and Motor Accessibility

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-NFR-030 | All platform functionality accessible via mouse or touch shall also be fully operable via keyboard alone, including RoboCode Studio canvas interactions (component selection, wiring initiation, component property editing, simulation controls). | Must | Tab order on all pages must be logical and announced correctly by screen readers. Focus must be visibly styled (minimum 2 px outline, 3:1 contrast against surrounding colour per WCAG 2.2 SC 2.4.11). |
| UR-NFR-031 | All interactive sensor-input controls in RoboCode Studio (button press, potentiometer knob, joystick sliders, etc.) must be operable via keyboard (arrow keys, Space, Enter) and must expose appropriate ARIA roles and live-region announcements so screen-reader users are informed of state changes. | Must | See also UR-SIM-057. ARIA `role="slider"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax` for range inputs. |
| UR-NFR-032 | Drag-and-drop component placement on the RoboCode Studio canvas shall provide a keyboard-alternative workflow (e.g., component search + place command) that achieves the same result without requiring pointer input. | Must | Keyboard alternative must be discoverable from the canvas (announced by screen reader on canvas focus). |
| UR-NFR-033 | The platform shall provide a comprehensive keyboard shortcuts reference accessible from the help menu and from within RoboCode Studio, covering at minimum: run/stop/pause simulation, save project, switch editor tab, zoom canvas in/out, delete selected component. | Should | Shortcut reference is displayed in a modal, not a new tab. |
| UR-NFR-034 | Focus management shall be handled correctly when modals, drawers, and notification toasts appear: focus shall move into the modal/toast on appearance and return to the triggering element on dismissal. | Must | Verified by screen-reader testing protocol. |

### Cognitive and Dyslexia Accessibility

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-NFR-040 | The platform shall offer a dyslexia-friendly typography option (e.g., OpenDyslexic font or similar) as a user-preference setting, applied platform-wide including in the Monaco code editor. | Should | Setting is persisted per user account. No impact on layout must be introduced when the font is activated. |
| UR-NFR-041 | The platform shall support adjustable font size (at minimum: Small / Medium / Large / Extra Large) as a user-preference setting, with all layouts reflowing correctly at each size without horizontal scrolling on a 1024 px-wide viewport. | Should | Tested at 1024 px width, 150 % browser zoom, and 200 % browser zoom. |
| UR-NFR-042 | Where instructions consist of multiple sequential steps, they shall be presented as a numbered list or step-by-step wizard rather than a prose paragraph, to support students with attention or reading difficulties. | Must | Applies to all onboarding flows, course unit introductions, and task brief layouts. |
| UR-NFR-043 | The platform shall not implement auto-playing audio or video that begins without user initiation. Audio from the simulation is exempt when the student explicitly clicks Run; all tutorial or marketing media must require an explicit play action. | Must | Browser autoplay policy compliance is a floor, not a ceiling — the requirement is stronger than browser defaults. |

### Multilingual and African Language Support

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-NFR-050 | The platform UI shall be fully internationalised (i18n) using a standard message-catalogue approach (e.g., i18next / React-Intl), with all UI strings externalised and translatable without code changes. | Must | No hard-coded UI strings in component source code. Enforced by CI linting rule. |
| UR-NFR-051 | English shall be the primary and default interface language for V1. The localisation framework shall be in place so that additional language packs can be added without a platform release. | Must | Language packs are loaded as separate JSON bundles; switching language does not require a page reload. |
| UR-NFR-052 | The platform shall support at minimum the following languages in V2 of the interface: Shona (Zimbabwe), Ndebele (Zimbabwe), Swahili (Kenya/Tanzania/East Africa), Zulu (South Africa), Xhosa (South Africa), Hausa (Nigeria), French (francophone Africa), Portuguese (Mozambique/Angola). | Should | V2 target. V1 must establish the i18n infrastructure and accept community-contributed translations. |
| UR-NFR-053 | All locale-specific data formatting (dates, numbers, currency symbols) shall automatically adapt to the active language locale; no locale-specific formatting shall be hard-coded. | Should | Managed via Intl browser APIs or equivalent library. |
| UR-NFR-054 | RTL (right-to-left) layout support is not required for V1 but the CSS architecture (Tailwind CSS with logical properties) shall not architecturally block RTL addition in a future version. | Could | Logical CSS properties (`margin-inline-start` etc.) preferred over physical directional properties. |

---

## Performance on Low-End Devices, Chromebooks and Low-Bandwidth Environments

The primary addressable market for RoboCode.Africa includes students in sub-Saharan Africa who may use shared Chromebooks, low-specification Android tablets, or refurbished laptops on 2G/3G mobile connections or VSAT broadband. Performance requirements must reflect these real-world constraints.

### Device Performance Targets

```
+--------------------------------------------------------------+
|               Device Performance Tier Model                  |
|                                                              |
|  Tier 1 — Low-end (Chromebook/Android tablet, 2GB RAM,      |
|            quad-core ARM, 720p display):                     |
|    2D simulation must run at >= 30 FPS; 3D degrades to 2D   |
|                                                              |
|  Tier 2 — Mid-range (Chromebook/Windows laptop, 4GB RAM,    |
|            x86/ARM, 1080p display):                          |
|    2D >= 60 FPS; 3D >= 30 FPS (WebGL2)                      |
|                                                              |
|  Tier 3 — High-end (Desktop/MacBook, 8GB+ RAM,              |
|            dedicated GPU):                                   |
|    2D >= 60 FPS; 3D >= 60 FPS (WebGL2 / progressive WebGPU) |
+--------------------------------------------------------------+
```

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-NFR-060 | The RoboCode Studio 2D simulation view shall render at a minimum of 30 frames per second on a Tier 1 device (defined above) running a circuit of up to 20 components, measured in Chrome 120+ on a Chromebook with ARM Cortex-A72 or equivalent. | Must | FPS measurement taken during an active simulation with LEDs, an LCD, and a servo in the circuit. |
| UR-NFR-061 | The RoboCode Studio 3D simulation view shall automatically and transparently degrade to the 2D wokwi-elements rendering path when WebGL2 is not available or when the device GPU benchmark score falls below a platform-defined threshold detectable at session start. | Must | Degradation is silent but notified to the user by a brief dismissible banner: "3D view not available on this device — using 2D mode." |
| UR-NFR-062 | The 3D-to-2D degradation detection and switch shall complete within 3 seconds of first canvas load; the student shall not be shown a blank canvas or an error screen during the switch. | Must | Spinner with "Loading your workspace…" shown during detection. |
| UR-NFR-063 | The total JavaScript bundle delivered to a student's browser for the initial RoboCode Studio load shall not exceed 2 MB compressed (Brotli/Gzip), excluding the Monaco editor (loaded on demand) and WASM binaries (loaded on demand at simulation start). | Should | Webpack/Next.js build output is checked in CI; build fails if bundle exceeds the limit. |
| UR-NFR-064 | The Monaco editor and the AVR/ESP32 WASM simulation binaries shall be loaded lazily (on-demand), not included in the initial page load. | Must | Lazy loading is verified by Network waterfall analysis in CI. |
| UR-NFR-065 | The platform shall use progressive image loading (low-resolution placeholder → full resolution) for all component catalogue images, course thumbnail images, and avatar graphics. | Should | Reduces perceived load time on slow connections. |
| UR-NFR-066 | The RoboCode Studio canvas shall not block the browser's main thread for more than 50 ms during any user interaction (component drag, wire routing, property panel open) as measured by the Chrome Long Tasks API. | Should | Long-task violations reported to the platform's observability stack (OpenTelemetry). |
| UR-NFR-067 | The platform shall not require more than 512 MB of browser memory (measured by the Performance.memory API in Chrome) for a typical student session involving a 20-component circuit simulation and active Monaco editor. | Should | Memory usage reported in automated performance regression tests. |

### Page Load and Time-to-Interactive Targets

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-NFR-070 | The marketing site home page (robocode.africa) shall achieve a Largest Contentful Paint (LCP) of ≤ 2.5 s and a Cumulative Layout Shift (CLS) score of ≤ 0.10, measured by Lighthouse on a simulated Slow 4G connection from the closest African CDN edge (Cloudflare/CloudFront). | Must | Measured in CI on every marketing-site deployment. |
| UR-NFR-071 | The student dashboard page (post-login) shall load and be interactive (Time to Interactive ≤ 5 s) on a Tier 1 device over a Slow 4G (8 Mbps downlink, 400 ms latency) network, as measured by a Lighthouse lab report. | Must | Measurement target: Lighthouse TTI ≤ 5 s at the 75th percentile. |
| UR-NFR-072 | RoboCode Studio shall achieve an interactive canvas (first component placeable, simulation controls enabled) within 8 seconds of the student navigating to an existing project on a Tier 1 device over a Slow 4G network. | Must | Measured from navigation start to first meaningful paint of the canvas with the project's components visible. |
| UR-NFR-073 | Subsequent navigations between pages within the platform shall complete in ≤ 1.5 s using client-side routing (Next.js App Router client navigation), excluding the initial page load. | Should | Applies to dashboard → project, project → task, leaderboard → profile, etc. |

---

## Low-Bandwidth and Offline Expectations

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-NFR-080 | The platform shall function with a minimum sustained download bandwidth of 1 Mbps for the core student experience (viewing course content, coding in Monaco, running a 2D simulation). Higher-bandwidth features (3D rendering, video tutorials) gracefully degrade or are unavailable at lower speeds. | Must | Bandwidth detection at session start presents a low-bandwidth mode option if connection speed is below 1 Mbps. |
| UR-NFR-081 | All text-based course content (lesson text, task briefs, code examples) shall be served as static assets via the CDN and shall be cacheable by the browser for at least 7 days, enabling re-read without re-downloading. | Must | Cache-Control headers set appropriately; Next.js static generation used for content pages where possible. |
| UR-NFR-082 | The platform shall support a low-bandwidth mode that disables autoplay video, 3D rendering, large image assets, and non-critical animations, reducing the data transferred per page to ≤ 200 KB. | Should | Low-bandwidth mode toggled manually by the student or suggested automatically when slow connectivity is detected. |
| UR-NFR-083 | A student shall be able to compose and edit code in RoboCode Studio and locally simulate (run) a project they have previously opened, even when the internet connection is temporarily interrupted, provided the project was cached by the Service Worker on last visit. | Could | V1 Service Worker caches the last 5 opened projects and the simulation WASM binaries. Saves are queued and synced when connectivity is restored. |
| UR-NFR-084 | When the platform detects loss of connectivity, it shall display a visible but non-blocking offline indicator and shall not lose any unsaved edits for up to 15 minutes; it shall attempt to auto-save when connectivity is restored. | Should | Auto-save state stored in IndexedDB. User is informed of the pending sync. |
| UR-NFR-085 | Platform notifications and badge awards that occur while a student is offline shall be queued server-side and delivered in a batch when the student next connects, without loss of notification content. | Should | Server-side notification queue with a minimum retention of 30 days. |
| UR-NFR-086 | The platform shall support SMS-based notifications for critical events (account approval, password reset, parental consent request) as an alternative channel for students and parents who may not have reliable email or push notification access. | Should | Optional SMS channel via an Africa-compatible SMS gateway (e.g., Twilio, Africa's Talking). Opt-in only; phone number collection subject to data-minimisation policy. |

---

## Availability, Reliability and Resilience

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-NFR-090 | Students and Teachers shall expect the platform to be available 99.5 % of the time on a monthly basis (excluding pre-announced maintenance windows), equating to no more than approximately 3.6 hours of unplanned downtime per month. | Must | SLA measured by external uptime monitoring. Status page at status.robocode.africa updated in real time. |
| UR-NFR-091 | Scheduled maintenance shall be communicated to all users with at minimum 48 hours' notice via in-platform banner, email, and the status page. Maintenance windows shall be scheduled outside peak school hours for the Africa/Harare timezone (UTC+2) — preferably 20:00–04:00 local time on weekdays. | Must | Super Admin configures maintenance schedule; notification is sent automatically by the platform. |
| UR-NFR-092 | A student's active simulation session shall not be terminated by a backend service restart or deployment; the simulation runs in-browser (client-side) and shall be resilient to backend unavailability for its core operation. | Must | Backend is required only for project save, authentication, and real-time collaboration (Yjs). Local simulation continues uninterrupted during backend intermittency. |
| UR-NFR-093 | The platform shall implement graceful degradation: if a non-critical microservice (e.g., leaderboard service, notification service, gamification engine) is unavailable, the core student experience — coding, simulating, and viewing course content — shall remain fully functional. | Must | Circuit-breaker patterns required at the API gateway level. Error states for degraded services are communicated as in-platform service status indicators, not as blank pages or uncaught errors. |
| UR-NFR-094 | Student project files (schematic, code) shall be auto-saved at least every 60 seconds while the project is open, and the platform shall retain a minimum of 10 previous versions per project (autosave history) restorable by the student. | Must | Version history accessible from the project options menu. |
| UR-NFR-095 | All user data at rest shall be backed up at minimum daily, with a recovery point objective (RPO) of 24 hours and a recovery time objective (RTO) of 4 hours for full platform restoration from backup, as operationally verifiable by the Super Admin. | Must | Backup and RTO/RPO targets are verified by platform operations team on a quarterly basis. |

---

## Safety, Privacy and Data-Protection Expectations

Safety is the prime directive for RoboCode.Africa. The following user-facing expectations reflect the legal obligations (COPPA, GDPR, GDPR-K, Zimbabwe Cyber and Data Protection Act, POPIA, NDPR, Kenya Data Protection Act) and the age-appropriate design code principles specified in the project canon. Platform-level enforcement mechanisms are specified in the SSD (SR-nnn series); this section captures what users must be able to observe and rely on.

### Privacy Transparency

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-NFR-100 | Every user (student, teacher, parent/guardian, admin) shall be presented with a clear, plain-language privacy notice at the point of account creation that explains: what personal data is collected, why it is collected, who it is shared with, how long it is retained, and how to request deletion. | Must | Privacy notice for minors must be written at a reading level appropriate for the minor's age band. A separate, more detailed notice is available for parents/guardians and adults. |
| UR-NFR-101 | The platform shall not collect any personal data from a student that is not strictly necessary for the delivery of the educational service. The sign-up form for students shall request only: first name, last name, email or school ID, date of birth (for age-gating), and grade/year. | Must | Data minimisation per GDPR Art. 5(1)(c) and COPPA § 312.3. Optional fields (avatar, bio) are never required and are clearly marked optional. |
| UR-NFR-102 | Students (and parents/guardians for minors) shall be able to view, download, and request deletion of all personal data held by the platform via a self-service Data and Privacy centre accessible from the account settings page, without needing to email support. | Must | Data export in machine-readable format (JSON). Deletion request initiates a verified workflow subject to applicable retention obligations (e.g., audit logs). |
| UR-NFR-103 | The platform shall not use any student's personal data, usage data, or gamification data for behavioural advertising, profiling for commercial purposes, or sale to third parties. This prohibition applies regardless of the student's age. | Must | Absolute constraint. Violation would constitute a fundamental breach of the platform's child-safety mandate and applicable law. |
| UR-NFR-104 | A student or parent/guardian shall be able to withdraw consent at any time, which shall immediately suspend data processing activities beyond operational necessity and initiate account deactivation within 24 hours. | Must | Withdrawal of parental consent for a minor triggers immediate account suspension pending deletion confirmation. |
| UR-NFR-105 | The platform shall display a clear, persistent and age-appropriate "Who can see my data?" summary on the student's profile settings page, explaining the current visibility settings for their name, projects, leaderboard rank, and gamification badges. | Must | Aligned with age-appropriate design code transparency principle. See also UR-GAM-055. |

### Safeguarding and Communication Safety

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-NFR-110 | No unsupervised private messaging between minor students shall be enabled at any time. All communication channels available to students shall be visible to their assigned Teacher and to the School Admin. | Must | See _User Requirements: Communication, Notifications and Safety_ for detailed communication channel requirements (UR-COMM series). |
| UR-NFR-111 | All student-generated content visible to other users (project names, descriptions, comments, display names, chat messages) shall pass through automated profanity and PII filtering before publication, with flagged content held for moderation. | Must | Filtering applies in real time; the student sees their own content immediately but it is held from other users until cleared or rejected. |
| UR-NFR-112 | Any user shall be able to report inappropriate content or behaviour via a clearly visible, one-click "Report" button accessible on all social-facing surfaces (leaderboards, project gallery, comment threads, chat). Report submission shall be acknowledged within the UI immediately, and the moderation outcome notified to the reporter within 72 hours. | Must | Anonymous reporting is supported; reporter identity is never disclosed to the reported user. |
| UR-NFR-113 | The platform shall escalate safeguarding concerns (reports of abuse, harm, self-harm, or exploitation) to the designated School Admin (for school-enrolled students) and to the Super Admin within 1 hour of report submission, via in-platform alert and email. | Must | Escalation does not depend on the automated content filter; human moderator review is triggered immediately for safeguarding categories. |
| UR-NFR-114 | Audit logs of all moderation actions, user consent events, data access events, and administrative actions on student accounts shall be tamper-evident (append-only log with cryptographic integrity verification) and retained per the authoritative retention schedule in Section 15 (UR-COMM-062 to UR-COMM-065): standard platform audit log minimum 12 months; consent records account-lifetime + 3 years; safeguarding records minimum 7 years. | Must | Audit log is accessible to Super Admin and, within scope, to School Admin. Students may request a summary of access events on their account via the Data and Privacy centre (UR-NFR-102). |

### Session and Account Security

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-NFR-120 | Student sessions shall expire automatically after 30 minutes of inactivity on a shared/public device configuration, and after 8 hours on a personal device configuration; the school's device-trust policy (set by School Admin) determines which regime applies. | Must | Session expiry is configurable per tenant by School Admin within the Super Admin-defined bounds (5 min – 24 hours). |
| UR-NFR-121 | The platform shall detect concurrent logins from different devices for the same student account and notify the student (and the student's Teacher for minors) with an option to terminate other sessions. | Should | Concurrent login notification delivered as an in-platform notification and optionally via email. |
| UR-NFR-122 | Password reset and account recovery flows for minor students shall require verification via the parent/guardian's registered email or the school's administrative contact, not solely the student's own email, to prevent account takeover via a compromised student email. | Must | School SSO (Google/Microsoft) accounts use IdP-managed recovery; this requirement applies to email-and-password accounts only. |

---

## Supported Devices and Browsers

The following matrix defines the minimum configuration required for a full student experience (2D simulation, Monaco editor, course content). Configurations below the minimum may access marketing pages and limited demo content.

### Supported Browser Matrix

| Browser | Minimum Version | Platform | Notes |
|---------|----------------|----------|-------|
| Google Chrome | 109 | Windows, macOS, ChromeOS, Android | Primary reference browser for CI testing |
| Microsoft Edge | 109 | Windows, macOS | Chromium-based; parity with Chrome |
| Mozilla Firefox | 115 ESR | Windows, macOS, Linux | WebAssembly and WebGL2 required; verify avr8js WASM compat |
| Apple Safari | 16.4 | macOS, iPadOS, iOS | Web Audio, WebGL2, and SharedArrayBuffer support verified |
| Samsung Internet | 20 | Android | Chromium-based; secondary validation tier |
| Chrome for Android | 109 | Android 8+ | Mobile-optimised 2D-only simulation mode |

> 3D simulation (Three.js / React Three Fiber / WebGL2) requires WebGL2 support. Browsers that lack WebGL2 receive the 2D simulation path automatically (UR-NFR-061).

### Device Minimum Specifications

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-NFR-130 | The platform shall support the core student experience (2D simulation, code editor, course content) on a device with a minimum specification of: 2 GB RAM, ARMv8 or x86-64 CPU at ≥ 1.5 GHz, 720p (1280 × 720) display, and a supported browser as listed above. | Must | Verified by Tier 1 device performance testing (UR-NFR-060). Chromebook with MediaTek MT8173 or Rockchip RK3399 is the reference Tier 1 device. |
| UR-NFR-131 | On mobile devices (Android smartphones, ≥ 5.5-inch display), the platform shall present a responsive layout that allows students to view course content, read code, and interact with the 2D simulation canvas; the Monaco editor is accessible but secondary on mobile. | Should | Minimum supported Android version: Android 8.0 (Oreo) on Chrome 109+. Monaco editor falls back to a simplified text area on displays narrower than 600 px. |
| UR-NFR-132 | Tablet and iPad support (≥ 9.7-inch display, iPadOS 16+, Android tablet with ≥ 4 GB RAM) shall deliver the full 2D simulation experience with touch-friendly component placement and wiring interactions. | Should | Touch-friendly canvas interactions (tap to select, two-finger zoom, drag to place) verified on iPad Air (5th gen) and a mid-range Android tablet reference device. |
| UR-NFR-133 | The platform shall not require the installation of any browser plugin, extension, or desktop application to deliver the full core student experience. All functionality shall run within a standard browser sandbox. | Must | No Java, Flash, Silverlight, or native extensions. WASM and Web APIs only. |
| UR-NFR-134 | The platform shall be fully operable with JavaScript enabled in the browser; a no-JavaScript fallback shall be provided only for the marketing site home page (a static HTML page with a "Please enable JavaScript" notice). RoboCode Studio requires JavaScript and cannot degrade to a no-JS mode. | Must | Progressive enhancement for the marketing site only. |

### Screen Size and Responsive Layout

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-NFR-140 | All student-facing and teacher-facing pages shall be fully responsive and usable at viewport widths from 360 px (small Android phone) to 2560 px (large desktop monitor), without horizontal scrolling at any supported width. | Must | Breakpoints tested at 360 px, 768 px, 1024 px, 1280 px, 1920 px. |
| UR-NFR-141 | RoboCode Studio shall adapt its panel layout to the available viewport: at widths < 1024 px, the canvas, code editor, and Serial Monitor shall be navigable via a tab switcher rather than displayed simultaneously side-by-side; at ≥ 1024 px, a split-panel (resizable) layout is the default. | Must | Panel layout preference (tabs vs split) is user-configurable and persisted per account. |
| UR-NFR-142 | Text shall scale correctly with browser zoom levels from 50 % to 200 % without content overlap, truncation of interactive controls, or loss of functionality. | Must | Verified at 50 %, 100 %, 150 %, and 200 % browser zoom in CI screenshot tests. |

---

## MoSCoW Priority Summary

| ID | Requirement Summary | Priority |
|----|---------------------|----------|
| UR-NFR-001 | Single-label primary-action discoverability for students | Must |
| UR-NFR-002 | Grade 4–5 reading level for primary student UI text | Must |
| UR-NFR-003 | No more than three sentences before next action | Should |
| UR-NFR-004 | Block-code default for primary students, text toggle | Must |
| UR-NFR-005 | Icon + text label in all primary navigation | Must |
| UR-NFR-006 | Contextual inline help in RoboCode Studio | Must |
| UR-NFR-007 | Plain, encouraging error messages with corrective guidance | Must |
| UR-NFR-008 | Student View vs Teacher View layout separation | Must |
| UR-NFR-009 | Human-readable date/time display for students | Should |
| UR-NFR-010 | Role-specific onboarding tours | Should |
| UR-NFR-020 | WCAG 2.2 AA compliance across all user-facing UI | Must |
| UR-NFR-021 | Minimum 4.5:1 text contrast across all themes | Must |
| UR-NFR-022 | No colour-only information conveyance | Must |
| UR-NFR-023 | Alt text / aria-label on all non-text content | Must |
| UR-NFR-024 | Reduced-motion preference respected for all animations | Must |
| UR-NFR-025 | Visual indicator for simulation audio output | Must |
| UR-NFR-030 | Full keyboard operability including canvas interactions | Must |
| UR-NFR-031 | Keyboard-operable sensor input controls with ARIA | Must |
| UR-NFR-032 | Keyboard alternative to drag-and-drop component placement | Must |
| UR-NFR-033 | Keyboard shortcuts reference in help menu | Should |
| UR-NFR-034 | Correct focus management for modals and toasts | Must |
| UR-NFR-040 | Dyslexia-friendly typography option | Should |
| UR-NFR-041 | Adjustable font size (Small/Medium/Large/XL) | Should |
| UR-NFR-042 | Step-by-step instruction presentation | Must |
| UR-NFR-043 | No auto-playing audio or video | Must |
| UR-NFR-050 | Fully internationalised (i18n) UI string catalogue | Must |
| UR-NFR-051 | English as default language with V1 framework in place | Must |
| UR-NFR-052 | V2 African language packs (Shona, Swahili, Zulu, etc.) | Should |
| UR-NFR-053 | Locale-specific date/number/currency formatting | Should |
| UR-NFR-054 | CSS logical properties (no RTL block) | Could |
| UR-NFR-060 | 2D simulation ≥ 30 FPS on Tier 1 device | Must |
| UR-NFR-061 | Auto 3D-to-2D fallback on unsupported GPU | Must |
| UR-NFR-062 | 3D-to-2D switch within 3 s, no blank canvas | Must |
| UR-NFR-063 | Initial JS bundle ≤ 2 MB compressed | Should |
| UR-NFR-064 | Monaco and WASM binaries loaded lazily | Must |
| UR-NFR-065 | Progressive image loading | Should |
| UR-NFR-066 | No main-thread block > 50 ms per interaction | Should |
| UR-NFR-067 | ≤ 512 MB browser memory for typical session | Should |
| UR-NFR-070 | Marketing site LCP ≤ 2.5 s on Slow 4G | Must |
| UR-NFR-071 | Dashboard TTI ≤ 5 s on Tier 1 / Slow 4G | Must |
| UR-NFR-072 | Studio interactive canvas within 8 s on Tier 1 / Slow 4G | Must |
| UR-NFR-073 | Client-side page transitions ≤ 1.5 s | Should |
| UR-NFR-080 | Platform functional at ≥ 1 Mbps sustained bandwidth | Must |
| UR-NFR-081 | Static course content cacheable for 7 days | Must |
| UR-NFR-082 | Low-bandwidth mode ≤ 200 KB per page | Should |
| UR-NFR-083 | Offline simulation for cached projects (Service Worker) | Could |
| UR-NFR-084 | Offline indicator; no edit loss for 15 minutes | Should |
| UR-NFR-085 | Offline notifications queued and delivered on reconnect | Should |
| UR-NFR-086 | SMS notification fallback channel (opt-in) | Should |
| UR-NFR-090 | 99.5 % monthly availability SLA | Must |
| UR-NFR-091 | 48-hour maintenance notice; off-peak windows | Must |
| UR-NFR-092 | Simulation resilient to backend unavailability | Must |
| UR-NFR-093 | Core experience maintained during non-critical service outage | Must |
| UR-NFR-094 | Auto-save every 60 s; 10-version project history | Must |
| UR-NFR-095 | RPO 24 h / RTO 4 h; daily backups | Must |
| UR-NFR-100 | Plain-language privacy notice at account creation | Must |
| UR-NFR-101 | Minimum personal data collected at student signup | Must |
| UR-NFR-102 | Self-service data view, download, deletion | Must |
| UR-NFR-103 | No behavioural advertising or data sale | Must |
| UR-NFR-104 | Consent withdrawal within 24 hours | Must |
| UR-NFR-105 | "Who can see my data?" summary on profile | Must |
| UR-NFR-110 | No unsupervised private messaging for minors | Must |
| UR-NFR-111 | Real-time profanity/PII filtering on student content | Must |
| UR-NFR-112 | One-click content/behaviour reporting | Must |
| UR-NFR-113 | Safeguarding escalation within 1 hour | Must |
| UR-NFR-114 | Tamper-evident audit logs retained per Section 15 schedule (audit ≥ 12 months; safeguarding ≥ 7 years) | Must |
| UR-NFR-120 | Inactivity session expiry (30 min shared / 8 h personal) | Must |
| UR-NFR-121 | Concurrent login detection and notification | Should |
| UR-NFR-122 | Minor account recovery via parent/guardian or school | Must |
| UR-NFR-130 | Minimum device spec: 2 GB RAM, 1.5 GHz, 720p | Must |
| UR-NFR-131 | Responsive layout on Android smartphones ≥ 5.5 in | Should |
| UR-NFR-132 | Full 2D simulation on tablets ≥ 9.7 in | Should |
| UR-NFR-133 | No browser plugins or desktop installation required | Must |
| UR-NFR-134 | No JS fallback for marketing site only | Must |
| UR-NFR-140 | Responsive 360 px – 2560 px without horizontal scroll | Must |
| UR-NFR-141 | Studio panel layout: tabs < 1024 px, split ≥ 1024 px | Must |
| UR-NFR-142 | Text scales correctly at 50 %–200 % browser zoom | Must |

---

## Cross-References

- _User Requirements: Onboarding, Signup and Approval_ — UR-ONB series: Age-gating at signup underpins UR-NFR-100, UR-NFR-101, and the COPPA/GDPR-K consent requirements.
- _User Requirements: Authentication and Account Management_ — UR-AUTH series: Session expiry (UR-NFR-120), MFA for staff, and minor account recovery (UR-NFR-122).
- _User Requirements: School Onboarding, Custom Domain and White-Labelling_ — UR-SCH series: White-label theme generation must enforce contrast requirements (UR-NFR-021); timezone and device-trust policy are tenant-configurable.
- _User Requirements: RoboCode Studio Canvas, Components and Wiring_ — UR-STU series: Canvas keyboard operability (UR-NFR-030, UR-NFR-032) and 3D-to-2D fallback (UR-NFR-061) are directly exercised in the canvas.
- _User Requirements: Simulation Experience_ — UR-SIM series: Simulation frame-rate targets (UR-NFR-060), audio visual indicators (UR-NFR-025), student-friendly error messages (UR-NFR-007), and ARIA-annotated sensor controls (UR-NFR-031) all apply to the RSE.
- _User Requirements: Code Editor and Programming_ — UR-CODE series: Monaco lazy loading (UR-NFR-064), dyslexia font in editor (UR-NFR-040), and block-code default for primary students (UR-NFR-004).
- _User Requirements: Learning, Courses, Tasks and Assessment_ — UR-LRN series: Reading-level requirements (UR-NFR-002) and step-by-step instruction presentation (UR-NFR-042) apply to all course and task content.
- _User Requirements: Gamification, RoboPoints and Leaderboards_ — UR-GAM series: Privacy visibility controls (UR-NFR-105) complement UR-GAM-055; no behavioural advertising (UR-NFR-103) extends UR-GAM-054.
- _User Requirements: Communication, Notifications and Safety_ — UR-COMM series: Safeguarding escalation (UR-NFR-113), content reporting (UR-NFR-112), and no unsupervised messaging (UR-NFR-110) are enforced by the communication subsystem.
- _User Requirements: Administration and Reporting_ — UR-ADM series: Audit log requirements (UR-NFR-114) and backup/RTO/RPO targets (UR-NFR-095) are verified and managed by the Super Admin and School Admin administrative tooling.
