# Non-Functional Requirements

## Overview

This section specifies the system-level non-functional requirements (NFRs) for RoboCode.Africa and RoboCode Studio. These requirements define the quality attributes — performance, scalability, reliability, capacity, maintainability, portability, and compliance — that all functional modules must satisfy. They constitute binding engineering contracts, not aspirational targets.

Requirements are grouped by quality attribute category, each identified with the prefix `NFR-<CAT>-<nnn>`. Priority is assigned using MoSCoW notation: **Must** / **Should** / **Could** / **Won-t (this release)**. Every requirement includes a measurable acceptance criterion. Cross-references to functional modules use the prefix `FR-<MODULE>-<nnn>`; security requirements use `SR-<nnn>`; data requirements `DR-<nnn>`; architecture decisions `AD-<nn>` (see "System Architecture", section 3).

Child safety is the prime directive. Where a non-functional trade-off conflicts with safety or data-protection obligations, safety takes precedence unconditionally.

---

## Capacity and Sizing Assumptions

Before stating measurable NFRs, the sizing model on which targets are calibrated is recorded here. Any material change to these assumptions must trigger a reassessment of dependent NFRs.

```
+------------------------------------------------------------------+
|              RoboCode.Africa v1.0 Sizing Model                   |
+------------------------------------------------------------------+
| Dimension                 | v1.0 Target     | Peak Design Point  |
|---------------------------+-----------------+--------------------|
| Active school tenants     | 20              | 50                 |
| Students per school       | 10 – 1,500      | 1,500              |
| Total registered students | 10,000          | 30,000             |
| Peak concurrent students  | 2,000           | 5,000              |
| Peak concurrent teachers  | 200             | 500                 |
| Concurrent RSE sessions   | 2,000           | 5,000              |
|   (all client-side)       |   (zero server  |   compute for RSE) |
| Projects stored           | 500,000         | 2,000,000          |
| Project file avg. size    | 150 KB          | 500 KB             |
| S3 object storage         | 75 GB           | 1 TB               |
| API requests/s (avg.)     | 500 rps         | 2,000 rps          |
| WebSocket connections     | 4,000           | 10,000             |
| Redis memory (est.)       | 8 GB            | 32 GB              |
| PostgreSQL primary DB size| 50 GB           | 200 GB             |
+------------------------------------------------------------------+
```

These figures inform autoscaling policies, database provisioning, CDN cache sizing, and Redis allocation. The Compile Microservice is excluded from concurrent RSE session counts because the simulation loop runs entirely in the browser (AD-01).

---

## Performance Requirements

Performance requirements are partitioned into four sub-categories: page load and time-to-interactive, simulation rendering and real-time factor, API and backend latency, and network/bandwidth behaviour.

### Page Load and Time-to-Interactive

The reference measurement configuration for page-load NFRs is:

```
+-------------------------------------------------------------+
|           Performance Measurement Reference Config          |
+-------------------------------------------------------------+
| Network emulation  | Slow 4G: 8 Mbps down, 1.5 Mbps up,   |
|                    | 400 ms RTT (Chrome DevTools / Lighthouse|
|                    | lab mode). Represents Tier B students.  |
+-------------------------------------------------------------+
| Reference device   | Tier 1: ARM Cortex-A72, 2 GB RAM,     |
|                    | ChromeOS (Chromebook). This is the      |
|                    | minimum supported device for the full   |
|                    | 2D student experience.                  |
+-------------------------------------------------------------+
| CDN edge           | Closest African CDN PoP                |
|                    | (Cloudflare/CloudFront Johannesburg     |
|                    | or Nairobi). Not the origin.            |
+-------------------------------------------------------------+
| Measurement tool   | Lighthouse 11+ lab report (CI); real-  |
|                    | user monitoring (RUM) via OpenTelemetry |
|                    | for p50/p75/p95 field data.             |
+-------------------------------------------------------------+
```

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| NFR-PERF-001 | The marketing site home page (`robocode.africa`) shall achieve Largest Contentful Paint (LCP) ≤ 2.5 s. | Must | Lighthouse lab score at reference config. CI gate: build fails if LCP > 2.5 s. Aligns with UR-NFR-070. |
| NFR-PERF-002 | The marketing site home page shall achieve a Cumulative Layout Shift (CLS) score ≤ 0.10. | Must | Lighthouse lab and field RUM. CLS > 0.10 blocks deployment. |
| NFR-PERF-003 | The student dashboard page (post-login) shall reach Time to Interactive (TTI) ≤ 5 s on a Tier 1 device over Slow 4G. | Must | Lighthouse TTI at reference config, 75th percentile. Aligns with UR-NFR-071. |
| NFR-PERF-004 | RoboCode Studio shall present an interactive canvas (first component placeable, simulation controls enabled) within 8 s of navigation start on a Tier 1 device over Slow 4G for an existing project. | Must | Measured from browser `navigationStart` to custom performance mark `studio:canvas:ready`. Aligns with UR-NFR-072. |
| NFR-PERF-005 | Subsequent client-side page transitions within the platform shell (Next.js App Router client navigation) shall complete in ≤ 1.5 s, excluding the initial full-page load. | Should | Measured via `PerformanceObserver` navigation entries in RUM. Covers dashboard → project, project → task, leaderboard → profile. Aligns with UR-NFR-073. |
| NFR-PERF-006 | The total compressed JavaScript bundle delivered for the initial RoboCode Studio SPA load shall not exceed 2 MB (Brotli). Monaco editor and AVR/ESP32 WASM binaries are excluded and must be loaded lazily. | Should | Webpack/Next.js bundle analyser runs in CI; build emits a warning at 1.8 MB and fails at 2 MB. Aligns with UR-NFR-063. |
| NFR-PERF-007 | Monaco editor chunks and the AVR/ESP32 WASM binaries shall be loaded on-demand (lazy import), not included in the critical rendering path. | Must | Verified by Network waterfall analysis in CI: no WASM or Monaco request in the first 3 s of a Studio load. Aligns with UR-NFR-064. |
| NFR-PERF-008 | The RoboCode Studio canvas shall not block the browser main thread for more than 50 ms during any user interaction (drag, wire routing, property panel open), as measured by the Long Tasks API. | Should | Long-task violations reported to the OpenTelemetry observability stack. Aligns with UR-NFR-066. |
| NFR-PERF-009 | A typical student session (20-component 2D circuit, active Monaco editor, one open project) shall consume no more than 512 MB of browser heap memory, measured by `performance.memory.usedJSHeapSize` in Chrome. | Should | Automated performance regression test in CI. Measured after 10 min of active use. Aligns with UR-NFR-067. |
| NFR-PERF-010 | All platform assets (JS bundles, CSS, WASM, 3D models, component images) served from the CDN shall be delivered with appropriate cache headers enabling browser caching for at minimum 7 days for versioned/hashed assets and 5 minutes for API responses. | Must | Cache-Control and ETag headers verified in CI response-header checks. |

### Simulation Rendering and Real-Time Factor

The RSE runs entirely in the browser (AD-01). Performance targets for the simulation are device-tier dependent.

```
+------------------------------------------------------------------+
|           Simulation Performance Tier Targets                    |
+------------------------------------------------------------------+
| Tier 1 — Low-end: ARM Cortex-A72, 2 GB RAM, 720p             |
|   2D (wokwi-elements): >= 30 FPS for <= 20 active components |
|   3D (Three.js/R3F):   NOT SUPPORTED — auto-degrades to 2D   |
|   Simulated AVR clock: >= 1 MHz (16 MHz target with throttle) |
+------------------------------------------------------------------+
| Tier 2 — Mid-range: x86/ARM, 4 GB RAM, 1080p                 |
|   2D:  >= 60 FPS                                               |
|   3D:  >= 30 FPS (WebGL2)                                     |
|   Simulated AVR clock: >= 8 MHz                               |
+------------------------------------------------------------------+
| Tier 3 — High-end: 8 GB+ RAM, dedicated GPU                   |
|   2D:  >= 60 FPS                                               |
|   3D:  >= 60 FPS (WebGL2 / progressive WebGPU)               |
|   Simulated AVR clock: >= 16 MHz (full speed)                 |
+------------------------------------------------------------------+
```

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| NFR-PERF-020 | The RSE 2D rendering path shall maintain a minimum of 30 FPS on a Tier 1 device for a circuit containing up to 20 active components (LEDs, LCD, servo, HC-SR04), measured in Chrome on a reference Chromebook during an active simulation run. | Must | FPS measured via `requestAnimationFrame` delta over a 10-second window. Aligns with UR-NFR-060. |
| NFR-PERF-021 | The RSE 3D rendering path shall maintain a minimum of 30 FPS on a Tier 2 device for a circuit containing up to 20 active components, using WebGL2 via Three.js / React Three Fiber. | Should | FPS measured via Three.js `renderer.info.render.frame` delta. Measured on an Intel Core i5-class laptop with integrated GPU. |
| NFR-PERF-022 | The simulated AVR clock on a Tier 1 device shall achieve at minimum 1 MHz (out of 16 MHz nominal). Tier 2 shall achieve at minimum 8 MHz. Tier 3 shall achieve full 16 MHz. | Must | Measured by running a firmware timing benchmark sketch and comparing simulated timer counts to real-time elapsed. Throttling is permitted for lower tiers. |
| NFR-PERF-023 | The 3D-to-2D degradation detection and switch shall complete within 3 s of first canvas load. No blank canvas or error screen shall be shown during the switch; a spinner with "Loading your workspace…" is displayed. | Must | Automated test: load Studio on a WebGL2-disabled browser; assert canvas displays correctly within 3 s. Aligns with UR-NFR-062. |
| NFR-PERF-024 | Simulation input events (button press, potentiometer change, joystick move) shall be reflected in observable component output (LED state change, LCD update) within 100 ms on a Tier 1 device. | Must | Measured from DOM input event to wokwi-elements visual state change via `MutationObserver`. |
| NFR-PERF-025 | RSE Web Worker message round-trip time for a pin-state update cycle shall not exceed 16 ms (one frame budget at 60 Hz) on a Tier 2 device. | Should | Measured with `performance.mark` / `performance.measure` in the Studio SPA. |
| NFR-PERF-026 | The in-browser WASM toolchain shall compile a 200-line Arduino C/C++ sketch to flashable firmware in ≤ 15 s on a Tier 2 device. | Should | Compile time measured from submit to firmware ready. Tier 1 devices may use the Compile Microservice if this target is not achievable. Microservice compile shall complete in ≤ 10 s. |
| NFR-PERF-027 | WebAudio output for buzzer/tone simulation shall have end-to-end latency (pin-state change to audible output) of ≤ 30 ms on browsers with WebAudio support. | Should | Measured using Web Audio API `AudioContext.currentTime` timestamps. |

### API and Backend Latency

All backend latency targets are measured at the API gateway (server-side), excluding client-side network propagation delay, unless stated otherwise.

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| NFR-PERF-030 | The p50 (median) API response time for authenticated REST and GraphQL queries shall not exceed 150 ms under the nominal load of 500 rps. | Must | Measured by load test using k6 at 500 rps on the reference Kubernetes cluster. Excludes compile and long-running export operations. |
| NFR-PERF-031 | The p95 API response time for authenticated REST and GraphQL queries shall not exceed 500 ms under nominal load (500 rps). | Must | k6 load test p95 latency assertion. CI gate: p95 > 500 ms fails the performance stage. |
| NFR-PERF-032 | The p99 API response time for authenticated REST and GraphQL queries shall not exceed 2,000 ms under nominal load. | Should | k6 p99 latency; violations are flagged for investigation but do not block deployment. |
| NFR-PERF-033 | The p95 API response time shall not exceed 1,000 ms under peak load (2,000 rps, the design-point ceiling). | Must | Separate peak-load k6 test suite. Must pass before each major release. |
| NFR-PERF-034 | WebSocket event delivery latency (server emit to client receipt) for in-app notifications and collaborative edit events (Yjs) shall not exceed 200 ms p95 under nominal WebSocket connection count (4,000 connections). | Should | Measured by a latency test that emits a server event and records the client receipt time via a shared timestamp. |
| NFR-PERF-035 | The Compile Microservice shall respond with compiled firmware within 10 s (p95) for a 200-line Arduino sketch. Results are cached by source hash in Redis; cache hits shall resolve in ≤ 50 ms. | Should | Measured by integration test. Cache hit rate target: ≥ 60 % for typical class workloads (same assignment, many students). |
| NFR-PERF-036 | Leaderboard read queries (global, school-scoped, class-scoped) served from Redis Sorted Sets shall respond in ≤ 50 ms p95 for leaderboards of up to 10,000 entries. | Must | Redis `ZREVRANGEBYSCORE` benchmark. Exceeding this triggers a review of leaderboard pagination strategy. |
| NFR-PERF-037 | Authentication token issuance (JWT sign-in response) shall complete in ≤ 300 ms p95, including database credential lookup, password verify (bcrypt), and JWT signing. | Must | Measured by auth service integration test. |

---

## Scalability Requirements

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| NFR-SCAL-001 | All domain microservices (Identity, Tenant, Student, Content/LMS, Teams, Gamification, Notification, Moderation, Reporting, Media/Asset, Compile) shall be designed as stateless workloads, enabling horizontal scaling via Kubernetes Horizontal Pod Autoscaler (HPA) without architectural changes. | Must | Session state is stored in Redis, not in-process. HPA is verified by a load test that scales from 1 to 10 replicas under increasing load. |
| NFR-SCAL-002 | The API gateway shall support horizontal scaling to at least 10 replicas. Load balancing across replicas shall be handled at the Kubernetes Service or Ingress layer with no sticky-session requirement on REST/GraphQL requests. | Must | WebSocket connections require sticky sessions at the Socket.IO layer, handled via `socket.io-redis` adapter (Redis Pub/Sub fan-out). |
| NFR-SCAL-003 | The platform shall sustain 2,000 peak concurrent student sessions (the v1.0 design-point ceiling) at or below the p95 API latency targets defined in NFR-PERF-031 without manual intervention. HPA shall scale service replicas automatically based on CPU utilisation (target: 70 %) and memory headroom. | Must | k6 load test at 2,000 concurrent virtual users. Pass criterion: no p95 breach, no pod OOMKill, error rate < 0.1 %. |
| NFR-SCAL-004 | The platform shall be architecturally capable of scaling to 5,000 concurrent student sessions (the design-point peak) by adding Kubernetes nodes, without code changes to any microservice. | Must | Demonstrated by a capacity-planning exercise using extrapolated k6 results and Kubernetes node-pool expansion. Validated before each major release. |
| NFR-SCAL-005 | The PostgreSQL database shall support at least 10,000 registered students and 50 active school tenants with Row-Level Security enabled, without query plan degradation. Indexes shall be defined on `tenant_id`, `user_id`, and all foreign-key columns. | Must | Database benchmark with synthetic 10,000-student dataset. Key query p95 latency must not exceed 50 ms for indexed lookups. |
| NFR-SCAL-006 | The Redis cluster shall be sized to handle the leaderboard Sorted Set write throughput of at least 1,000 RoboPoints award events per second at peak (competition scenario), without exceeding 70 % CPU utilisation on the primary Redis node. | Should | Redis benchmark with a simulated concurrent gamification event flood. |
| NFR-SCAL-007 | CDN/edge capacity shall absorb at least 10,000 rps of static asset requests (JS bundles, WASM, 3D models) globally without origin pull exceeding 5 % of total asset requests during normal operation. | Should | Cloudflare/CloudFront cache hit ratio target: ≥ 95 % for versioned static assets. |
| NFR-SCAL-008 | The platform shall support the onboarding of a new school tenant (subdomain/custom domain provisioning, TLS certificate issuance, white-label token injection) within 15 minutes of School Admin completing the configuration wizard, with no manual Super Admin intervention for subdomain-only schools. | Should | End-to-end automation test: trigger school creation, measure time to first successful authenticated login on the new subdomain. |
| NFR-SCAL-009 | Database schema migrations shall be designed as zero-downtime forward-compatible migrations (expand-and-contract pattern) so that new service replicas and old replicas can run simultaneously during a rolling deployment. | Must | Verified by the CI/CD migration gate: migration scripts are validated against the current and previous schema before deployment. |

---

## Reliability and Availability Requirements

### Service-Level Agreement

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| NFR-REL-001 | The RoboCode.Africa platform shall achieve a monthly uptime SLA of 99.9 % for authenticated student and teacher access, equating to no more than 43.8 minutes of unplanned downtime per calendar month. | Must | Measured by external uptime monitoring (e.g., Uptime Robot, Pingdom) at 1-minute intervals from at least two African probe locations. Planned maintenance windows (announced ≥ 48 h in advance) are excluded from SLA measurement. Aligns with UR-NFR-090. |
| NFR-REL-002 | The marketing site and public demo shall achieve a monthly uptime SLA of 99.5 % (3.6 h/month unplanned downtime). | Must | Measured by the same external monitor. The marketing site is served via Next.js SSG on the CDN; origin failures are masked for up to 24 h by CDN edge caching. |
| NFR-REL-003 | Planned maintenance windows shall be announced at minimum 48 hours in advance via in-platform banner, email notification to all active users, and the public status page (`status.robocode.africa`). Maintenance shall be scheduled between 20:00–04:00 Africa/Harare (UTC+2) on weekdays. | Must | Automated maintenance announcement is triggered by the Super Admin scheduling the window in the Admin Console. Aligns with UR-NFR-091. |

### Simulation Resilience

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| NFR-REL-010 | An active RSE simulation session shall not be interrupted by a backend microservice restart, rolling deployment, or brief network loss. The RSE runs entirely in the browser (AD-01) and has no dependency on backend availability for its simulation loop. | Must | Integration test: simulate backend down for 60 s; confirm RSE continues to execute and the canvas remains interactive. Aligns with UR-NFR-092. |
| NFR-REL-011 | During a backend unavailability period, the student's code editor (Monaco) shall remain functional for reading and writing code, even if save operations are queued. The unsaved-change indicator shall be visible; code shall not be lost. | Must | Auto-save to IndexedDB activates when the backend is unreachable. On reconnect, the queued save is submitted automatically. |
| NFR-REL-012 | The platform shall implement the graceful degradation pattern: if the Gamification Service, Notification Service, Leaderboard Service, or Moderation Service (non-critical path) is unavailable, the core student workflow — opening a project, editing code, running the 2D simulation, viewing course content — shall remain fully functional without error. | Must | Circuit-breaker pattern enforced at the API gateway. Non-critical service failures display a service-status indicator, not a blank page or unhandled exception. Aligns with UR-NFR-093. |
| NFR-REL-013 | The Compile Microservice shall apply per-request CPU limits (max 2 vCPU), memory limits (max 512 MB), and execution time limits (max 30 s) enforced at the Kubernetes pod level. A compile request that exceeds these limits shall be terminated with a structured error returned to the client; the error shall not cascade to other services. | Must | Verified by resource-limit enforcement tests in CI. Sandbox isolation prevents malicious or runaway sketch code from affecting the host. |

### Data Durability and Recovery

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| NFR-REL-020 | Student project files (schematic JSON, code, project metadata) shall be auto-saved to the backend at minimum every 60 seconds while the project is open. | Must | Auto-save interval is configurable by Super Admin (range: 30–300 s); default 60 s. Aligns with UR-NFR-094. |
| NFR-REL-021 | The platform shall retain a minimum of 10 auto-save versions per project (autosave history), restorable by the student from the project options menu. | Must | Each auto-save creates a versioned snapshot in S3-compatible object storage. Older versions beyond the limit are pruned. Aligns with UR-NFR-094. |
| NFR-REL-022 | All user data at rest in PostgreSQL and S3-compatible storage shall be backed up at minimum once per 24 hours. The recovery point objective (RPO) shall not exceed 24 hours. | Must | Backups stored in a separate region from the primary. Verified by the quarterly backup-restoration drill. Aligns with UR-NFR-095. |
| NFR-REL-023 | The recovery time objective (RTO) for full platform restoration from a backup after a catastrophic failure shall not exceed 4 hours. | Must | RTO validated in the quarterly disaster-recovery drill by the operations team. Results reported to the Super Admin dashboard. Aligns with UR-NFR-095. |
| NFR-REL-024 | Collaborative project documents (Yjs CRDT shared documents) shall remain consistent under network partitions of up to 10 seconds. On reconnection, the Yjs relay shall merge diverged document states without data loss. | Should | Yjs reconciliation test: simulate 10 s partition with concurrent edits on two clients; verify document convergence after reconnect. Aligns with NFR-ARCH-006. |
| NFR-REL-025 | The platform shall maintain a 30-day queue for in-app notifications that could not be delivered while a student was offline, delivering them in chronological order on next connection without loss. | Should | Notification queue stored in Redis Streams with a 30-day retention policy. Aligns with UR-NFR-085. |

---

## Maintainability Requirements

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| NFR-MAINT-001 | All platform source code (client and backend) shall be written in TypeScript (strict mode) with no `any` type escapes in production code paths. | Must | TypeScript compiler flags: `"strict": true`, `"noImplicitAny": true`. CI gate: zero TypeScript errors before merge. |
| NFR-MAINT-002 | Unit test coverage for all backend NestJS services shall be maintained at a minimum of 80 % line coverage. Integration test coverage for all API endpoints shall be maintained at a minimum of 70 % endpoint coverage. | Must | Coverage reports generated by Jest/Vitest. CI gate: build fails below the coverage floor. |
| NFR-MAINT-003 | Unit and component test coverage for the React/TypeScript Studio client shall be maintained at a minimum of 70 % line coverage for non-trivial logic (state managers, hooks, utility functions). Rendering snapshots are excluded from coverage minimums. | Should | Vitest + React Testing Library. Coverage tracked in CI; sub-floor results emit a warning. |
| NFR-MAINT-004 | End-to-end (E2E) tests shall cover the following critical user paths and must pass on every production deployment: student registration, parental consent flow, School Admin approval, studio project creation, component placement, 2D simulation run, code compile and flash, task submission, and gamification RoboPoints award. | Must | Playwright-based E2E suite. All listed paths must pass before a deployment is promoted to production. |
| NFR-MAINT-005 | Each microservice shall own and version its database migration scripts (using a tool such as TypeORM migrations or Flyway). Schema migrations shall be applied automatically on service startup in the CI/CD pipeline and shall not require manual SQL execution. | Must | Migration scripts are committed alongside service code. Reviewed as part of PR process. Zero-downtime expand-and-contract pattern required (NFR-SCAL-009). |
| NFR-MAINT-006 | The RSE and all Wokwi-derived open-source dependencies (wokwi-elements, avr8js) shall be abstracted behind versioned adapter interfaces in the Studio SPA. Upgrading or replacing these libraries shall not require changes outside the adapter layer. | Must | Verified by the dependency-upgrade process: a minor version bump of wokwi-elements shall require changes only in the adapter layer (not in Studio business logic). Implements AD-09 and UR-NFR-C024. |
| NFR-MAINT-007 | All public-facing UI strings shall be externalised into i18n message catalogues (i18next / React-Intl). No hard-coded user-visible text is permitted in component JSX. | Must | CI linting rule (`eslint-plugin-i18n-json` or equivalent) enforces this. Failing the lint check blocks merge. Aligns with UR-NFR-050. |
| NFR-MAINT-008 | Code style shall be enforced by ESLint and Prettier on every commit via pre-commit hooks and CI checks. Style violations block merge to the main branch. | Must | Shared `.eslintrc` and `.prettierrc` configurations are committed to the monorepo root and apply to all packages. |
| NFR-MAINT-009 | Dependency security scanning (OWASP Dependency-Check or Snyk) shall be executed in CI on every pull request. Critical-severity CVEs shall block merge; high-severity CVEs shall generate a tracked issue and be remediated within 7 days. | Must | Aligns with SR-xxx security requirements in "Security, Privacy and Child Safety" (section 18). |
| NFR-MAINT-010 | Open-source licence compliance shall be validated automatically in CI using a FOSS licence scanner (e.g., FOSSA, license-checker). Any new dependency with a licence incompatible with the platform's distribution terms (GPL, AGPL without commercial exception) shall block merge. | Must | Aligns with UR-NFR-C023. wokwi-elements and avr8js are MIT-licensed; compatibility must be re-verified on each upgrade. |
| NFR-MAINT-011 | All microservices shall expose a `/health` endpoint (liveness) and a `/ready` endpoint (readiness) conforming to Kubernetes probe conventions. The liveness probe must respond within 1 s; the readiness probe must also verify database and Redis connectivity. | Must | Kubernetes liveness and readiness probes configured in Helm charts for every service. |
| NFR-MAINT-012 | API contracts between services (internal gRPC/REST) and between the gateway and clients (GraphQL schema, REST OpenAPI spec) shall be versioned and maintained. Breaking changes require a new API version and a documented migration path; no silent breaking changes are permitted. | Must | OpenAPI 3.1 spec for REST endpoints, GraphQL schema with `@deprecated` directives for gradual deprecation. API versioning enforced by the API gateway. |

---

## Portability Requirements

### Browser and Device Matrix

The following matrix defines the minimum supported configuration for the full 2D student experience (core). 3D rendering requires WebGL2, which is available on Tier 2 and Tier 3 devices. Configurations below the minimum may access marketing pages and the limited sandbox demo.

| Browser | Min. Version | Platforms | Support Tier |
|---------|-------------|-----------|--------------|
| Google Chrome | 109 | Windows, macOS, ChromeOS, Android | Primary (CI reference) |
| Microsoft Edge | 109 | Windows, macOS | Primary (Chromium-parity) |
| Mozilla Firefox | 115 ESR | Windows, macOS, Linux | Primary |
| Apple Safari | 16.4 | macOS, iPadOS 16+, iOS 16+ | Primary |
| Chrome for Android | 109 | Android 8.0+ | Secondary (2D only) |
| Samsung Internet | 20 | Android 8.0+ | Secondary (Chromium) |

> Internet Explorer (all versions) is explicitly unsupported. Attempts to access the platform on IE shall return an "unsupported browser" page listing supported alternatives.

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| NFR-PORT-001 | All core student-facing functionality (2D simulation, Monaco editor, course content, gamification) shall be fully functional on every browser and minimum version listed in the matrix above, without polyfills that alter functional behaviour. | Must | Cross-browser E2E test suite (Playwright) runs against all primary-tier browsers on every release. |
| NFR-PORT-002 | The platform shall not require the installation of any browser plugin, extension, native desktop application, or OS-level driver. All functionality is delivered within the standard browser sandbox using WASM, WebGL2, WebAudio, and Web Workers. | Must | Aligns with UR-NFR-133. |
| NFR-PORT-003 | The core student experience shall be supported on devices meeting the minimum specification: 2 GB RAM, ARMv8 or x86-64 CPU at ≥ 1.5 GHz, 720p (1280 × 720) display, and one of the supported browsers. | Must | Reference Tier 1 device: Chromebook with MediaTek MT8173 or Rockchip RK3399. Verified in Tier 1 performance test (NFR-PERF-020). Aligns with UR-NFR-130. |
| NFR-PORT-004 | The platform UI shall be fully responsive and usable at viewport widths from 360 px (small Android phone) to 2560 px (large desktop), without horizontal scrolling at any supported width. | Must | Breakpoint tests at 360, 768, 1024, 1280, 1920, and 2560 px. CI screenshot regression tests. Aligns with UR-NFR-140. |
| NFR-PORT-005 | RoboCode Studio shall adapt its panel layout: at widths < 1024 px, a tab-switcher layout is used for the canvas, code editor, and Serial Monitor; at ≥ 1024 px, a resizable split-panel layout is the default. | Must | Verified in E2E viewport-resize tests. Aligns with UR-NFR-141. |
| NFR-PORT-006 | All text and interactive controls shall scale correctly at browser zoom levels from 50 % to 200 % without content overlap, truncation of controls, or loss of functionality. | Must | Tested at 50 %, 100 %, 150 %, 200 % zoom in CI screenshot tests. Aligns with UR-NFR-142. |
| NFR-PORT-007 | On Android smartphones (≥ 5.5-inch display, Android 8.0+, Chrome 109+), the platform shall present a responsive layout for course content, code reading, and 2D simulation canvas interaction. The Monaco editor falls back to a simplified text area on viewports narrower than 600 px. | Should | Touch interaction targets: minimum 48 × 48 dp per WCAG 2.5.5. Aligns with UR-NFR-131. |
| NFR-PORT-008 | On tablets (≥ 9.7-inch display, iPadOS 16+, or Android tablet with ≥ 4 GB RAM), the full 2D simulation experience shall be available with touch-friendly component placement and wiring. | Should | Touch-friendly canvas verified on iPad Air 5th generation and a mid-range Android tablet. Aligns with UR-NFR-132. |
| NFR-PORT-009 | The 3D simulation view (Three.js / React Three Fiber) shall automatically and transparently degrade to the 2D wokwi-elements rendering path when WebGL2 is unavailable or the GPU benchmark score falls below the platform-defined threshold. The user receives a dismissible informational banner. | Must | Automated test: disable WebGL2 in Chrome flags; verify Studio loads in 2D mode within 3 s. Aligns with UR-NFR-061. |
| NFR-PORT-010 | The platform's CSS architecture shall use Tailwind CSS logical properties (`margin-inline-start`, `padding-inline-end`) rather than physical directional properties (`margin-left`, `padding-right`) throughout, so that RTL language support can be added in a future release without architecture changes. | Could | CSS linting rule enforces logical properties. RTL is not required in v1.0. Aligns with UR-NFR-054. |

### Low-Bandwidth and Offline Portability

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| NFR-PORT-020 | The core student experience (2D simulation, code editing, course text) shall function at a minimum sustained download bandwidth of 1 Mbps, representing Tier B connectivity (see sizing model). | Must | Lighthouse network throttle test at 1 Mbps. Aligns with UR-NFR-080. |
| NFR-PORT-021 | A low-bandwidth mode shall be available — triggered manually by the student or automatically when connection speed falls below 1 Mbps — that disables 3D rendering, autoplay video, large image assets, and non-critical animations. In low-bandwidth mode, total page data transferred shall not exceed 200 KB per page. | Should | Measured by Lighthouse network panel in low-bandwidth mode. Aligns with UR-NFR-082. |
| NFR-PORT-022 | Text-based course content (lesson text, task briefs, code examples) shall be served as statically generated Next.js pages and cached by the CDN with a `Cache-Control: max-age=604800` (7-day) header, enabling re-read without re-downloading on slow connections. | Must | Cache-Control headers verified in CI. Aligns with UR-NFR-081. |
| NFR-PORT-023 | When the platform detects loss of internet connectivity, it shall display a visible non-blocking offline indicator. Auto-save shall switch to IndexedDB storage. Unsaved edits shall not be lost for at least 15 minutes of offline operation. On reconnection, pending saves shall be submitted automatically without user action. | Should | E2E test: disconnect network during editing session, wait 5 min, reconnect, verify save is applied. Aligns with UR-NFR-084. |
| NFR-PORT-024 | The Service Worker shall cache the Studio SPA shell, core CSS, wokwi-elements bundles, and the AVR/ESP32 WASM binaries on first visit, enabling offline simulation of up to 5 previously opened projects without re-downloading these assets. | Could | Service Worker cache strategy verified by Lighthouse offline audit. Aligns with UR-NFR-083. |
| NFR-PORT-025 | School networks that block WebSocket upgrades on non-443 ports shall be supported via Socket.IO's automatic HTTP long-polling fallback over port 443. The fallback shall be transparent to the student; real-time collaboration may have increased latency in long-polling mode. | Must | Integration test: configure a proxy to block WebSocket upgrade; verify Socket.IO falls back and collaborative edit events are delivered (within 2 s instead of < 200 ms). Aligns with UR-NFR-A015. |

---

## Compliance Non-Functional Requirements

These requirements codify the non-functional aspects of legal and standards compliance. Functional enforcement mechanisms are in "Security, Privacy and Child Safety" (section 18) and "Functional Requirements: Identity, Authentication and Authorization" (section 5).

### Data Protection and Privacy Laws

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| NFR-COMP-001 | The platform shall comply with COPPA (US) for users under 13, GDPR and GDPR-K (EU/EEA) for users under 16, Zimbabwe Cyber and Data Protection Act, South Africa POPIA, Nigeria NDPR, and Kenya Data Protection Act. Where requirements conflict, the most protective obligation applies. | Must | Legal compliance review before v1.0 launch. Annual review schedule. Aligns with UR-NFR-C008 through UR-NFR-C016. |
| NFR-COMP-002 | Personal data of students shall be stored in a cloud region within Africa (primary region: AWS `af-south-1` or equivalent) to honour data residency expectations under POPIA, NDPR, Kenya DPA, and Zimbabwe CDPA. | Must | Data-residency assertion verified by cloud storage region configuration in Terraform IaC. Cross-region replication for DR purposes must keep a copy within Africa. Aligns with UR-NFR-D021. |
| NFR-COMP-003 | A verified erasure request from a parent/guardian or a student who has reached the age of majority shall be fulfilled within 30 calendar days. System architecture must support per-user data deletion that does not cascade to anonymised/pseudonymised aggregate analytics. | Must | Erasure workflow tested end-to-end in CI: submit erasure request, verify PII removal from PostgreSQL and S3, confirm anonymised analytics are unaffected. Aligns with UR-NFR-C013. |
| NFR-COMP-004 | No behavioural advertising, commercial profiling, or sale of student data shall occur at any time, regardless of student age. This applies to all analytics data, gamification data, and usage telemetry. | Must | Absolute constraint. DPA and privacy policy enforcement. Verified by architecture review and DPIA (Data Protection Impact Assessment) before launch. Aligns with UR-NFR-103 and UR-NFR-C011. |
| NFR-COMP-005 | Audit logs recording all consent events, account approval/rejection actions, content moderation decisions, safeguarding escalations, and administrative actions on student accounts shall be retained for a minimum of 7 years in a tamper-evident, append-only store with cryptographic integrity verification, per the Authoritative Data Retention Schedule (Data Architecture and Database Design section). | Must | Audit log retention verified by automated retention-policy test. Aligns with UR-NFR-114 and UR-NFR-C014. |
| NFR-COMP-006 | All data in transit between clients and the platform (HTTPS/WSS) and between microservices (mTLS within the service mesh) shall be encrypted using TLS 1.2 or higher. TLS 1.0 and 1.1 shall be explicitly disabled at the load balancer and API gateway. | Must | TLS configuration verified by SSL Labs / testssl.sh automated scan in CI. Minimum cipher suite: ECDHE with AES-128-GCM or stronger. Aligns with SR-xxx. |
| NFR-COMP-007 | All data at rest in PostgreSQL, Redis, and S3-compatible storage shall be encrypted using AES-256 (or equivalent). Encryption key management shall use a managed key service (AWS KMS or equivalent) with key rotation enabled. | Must | Verified by cloud storage configuration audit in IaC review. Aligns with SR-xxx. |

### Accessibility Standards

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| NFR-COMP-010 | All student-facing, teacher-facing, and admin-facing UI shall conform to WCAG 2.2 Level AA. This applies equally to white-label tenant themes generated via the design-token system. | Must | Automated axe-core / Lighthouse accessibility audit (score ≥ 95) runs on every deployment. Manual screen-reader test (NVDA/Windows, VoiceOver/macOS, TalkBack/Android) required before each major release. Aligns with UR-NFR-020, UR-NFR-C020. |
| NFR-COMP-011 | All text elements shall maintain a minimum colour contrast ratio of 4.5:1 (normal text) and 3:1 (large text ≥ 18 pt or 14 pt bold) against their background on all platform themes. The white-label theme token generator shall validate and reject any token combination that fails this threshold. | Must | Contrast validation runs at design-token generation time. axe-core contrast rule enforced in CI. Aligns with UR-NFR-021. |
| NFR-COMP-012 | All interactive elements in RoboCode Studio and the broader platform shall be operable by keyboard alone. Drag-and-drop operations shall have a keyboard-accessible alternative workflow. | Must | Tab order and keyboard interaction verified in manual accessibility test plan. Aligns with UR-NFR-030, UR-NFR-C021. |

### Open-Source Licence Compliance

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| NFR-COMP-020 | All open-source dependencies, including wokwi-elements (MIT) and avr8js (MIT), shall be used in compliance with their licence terms. Derivative works and modifications shall comply with the upstream licence. | Must | FOSS licence scanner (FOSSA or license-checker) runs in CI. GPL/AGPL dependencies without a commercial licence exception are blocked from inclusion. Aligns with UR-NFR-C023. |
| NFR-COMP-021 | Dependency versions shall be pinned in `package-lock.json` / `yarn.lock` and committed to source control. Dependency updates shall follow a defined cadence (security patches: within 7 days of CVE disclosure; minor/patch: monthly review; major: quarterly with regression testing). | Must | Automated Dependabot or Renovate PR generation for security updates. Major updates require E2E regression test pass before merge. |

---

## Consolidated NFR Summary by Category

The following table provides a cross-reference of all NFR identifiers by category and their MoSCoW priority distribution for programme-level tracking.

| Category | IDs | Must | Should | Could | Won-t |
|----------|-----|------|--------|-------|-------|
| Performance (PERF) | NFR-PERF-001 to NFR-PERF-037 | 15 | 11 | 0 | 0 |
| Scalability (SCAL) | NFR-SCAL-001 to NFR-SCAL-009 | 7 | 2 | 0 | 0 |
| Reliability (REL) | NFR-REL-001 to NFR-REL-025 | 13 | 5 | 0 | 0 |
| Maintainability (MAINT) | NFR-MAINT-001 to NFR-MAINT-012 | 11 | 1 | 0 | 0 |
| Portability (PORT) | NFR-PORT-001 to NFR-PORT-025 | 13 | 6 | 3 | 0 |
| Compliance (COMP) | NFR-COMP-001 to NFR-COMP-021 | 18 | 0 | 0 | 0 |
| **Total** | **108** | **77** | **25** | **3** | **0** |

---

## Cross-References

- "System Architecture" (section 3), `NFR-ARCH-001` through `NFR-ARCH-008` and `AD-01` through `AD-10`: architectural decisions that inform scalability, reliability, and portability NFRs.
- "Functional Requirements: Identity, Authentication and Authorization" (section 5), `FR-AUTH-*`: session expiry, MFA, and consent enforcement that underpin NFR-COMP-001.
- "Functional Requirements: Multi-Tenancy, Custom Domains and White-Labelling" (section 6), `FR-TEN-*`: tenant isolation at the database layer (NFR-SCAL-009), white-label contrast enforcement (NFR-COMP-011), and ACME TLS automation (NFR-COMP-006).
- "Functional Requirements: RoboCode Studio IDE" (section 7), `FR-STU-*` and "Functional Requirements: RoboCode Simulation Engine (RSE)" (section 8), `FR-SIM-*`: simulation frame rate (NFR-PERF-020 to NFR-PERF-027), 3D degradation (NFR-PORT-009), and keyboard canvas access (NFR-COMP-012).
- "Functional Requirements: Code Authoring, Validation and Execution" (section 9), `FR-CODE-*`: Compile Microservice latency (NFR-PERF-035), WASM toolchain performance (NFR-PERF-026), and Monaco lazy loading (NFR-PERF-007).
- "Functional Requirements: Teams, Competitions and Gamification" (section 12), `FR-GAM-*`: leaderboard read latency (NFR-PERF-036), Redis Sorted Set throughput (NFR-SCAL-006).
- "Functional Requirements: Communication, Notifications and Moderation" (section 13), `FR-COMM-*`, `FR-MOD-*`: notification queue durability (NFR-REL-025), WebSocket delivery latency (NFR-PERF-034).
- "Functional Requirements: Administration, Analytics and Reporting" (section 14), `FR-ADM-*`: audit log retention (NFR-COMP-005), backup and RTO/RPO (NFR-REL-022, NFR-REL-023).
- "Data Architecture and Database Design" (section 15), `DR-*`: PostgreSQL RLS and index strategy (NFR-SCAL-005), zero-downtime migrations (NFR-SCAL-009).
- "Security, Privacy and Child Safety" (section 18), `SR-*`: TLS and encryption-at-rest requirements (NFR-COMP-006, NFR-COMP-007), dependency CVE patching (NFR-MAINT-009).
- "Infrastructure, Deployment and DevOps" (section 19): HPA configuration (NFR-SCAL-001 to NFR-SCAL-004), CI/CD gates (NFR-MAINT-002 to NFR-MAINT-004), CDN strategy (NFR-SCAL-007, NFR-PERF-010).
- "Accessibility, Internationalisation and Low-Bandwidth Design" (section 20): WCAG 2.2 AA (NFR-COMP-010 to NFR-COMP-012), i18n string externalisation (NFR-MAINT-007), low-bandwidth mode (NFR-PORT-021).
- "Observability, Logging, Monitoring and Support" (section 21): SLA monitoring (NFR-REL-001, NFR-REL-002), OpenTelemetry RUM metrics (NFR-PERF-001, NFR-PERF-030 to NFR-PERF-033).
- User Requirements Document "Non-Functional User Expectations" (URD section 20), `UR-NFR-*`: the traceability bridge between user-facing quality expectations and the measurable engineering targets in this section.
