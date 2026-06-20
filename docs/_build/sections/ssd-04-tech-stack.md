# Technology Stack and Rationale

This section specifies every technology chosen for the RoboCode.Africa platform — from the browser client to the cloud infrastructure — together with the rationale for each choice and the principal alternatives that were evaluated. Where tables are used, each row carries a **technology-stack requirement identifier** of the form `TS-<nnn>`. These are deliberately distinct from the functional (`FR-*`), non-functional (`NFR-*`), interface (`IR-*`), and data (`DR-*`) identifiers defined in the functional sections: the rows below specify *stack and runtime choices and their rationale*, and they reference — rather than redefine — the authoritative functional requirements (for example, the canonical Monaco-editor requirements live in *Functional Requirements: Code Authoring, Validation and Execution* (FR-CODE), the simulation requirements in *Functional Requirements: RoboCode Simulation Engine (RSE)* (FR-SIM), authentication in FR-AUTH, data in DR-*, interfaces in IR-*, and infrastructure NFRs in *Infrastructure, Deployment and DevOps*). Cross-references to adjacent sections are made by section name and requirement ID only.

---

## Guiding Principles

The selection of every technology was driven by six non-negotiable constraints that override convenience or familiarity:

1. **African-first performance** — latency to sub-Saharan Africa must be minimised; low-bandwidth and intermittent-connectivity scenarios are first-class concerns (see *Accessibility, Internationalisation and Low-Bandwidth Design*).
2. **Child safety by design** — the stack must support robust RBAC, audit logging, data minimisation, and the legal frameworks enumerated in *Security, Privacy and Child Safety* (COPPA, GDPR-K, POPIA, Zimbabwe Cyber and Data Protection Act, NDPR, Kenya DPA).
3. **Simulation fidelity in the browser** — the RoboCode Simulation Engine (RSE) must run entirely client-side to eliminate round-trip latency and enable offline use; this dictates a WASM-capable, WebGL2-capable modern browser runtime.
4. **Multi-tenant isolation** — school tenant data, branding, and routing must be strictly isolated at every layer.
5. **Open-source simulation core** — reuse of the Wokwi open-source ecosystem (wokwi-elements, avr8js, related libraries) is a stated architectural decision, minimising licence cost and maximising hardware fidelity.
6. **Incremental complexity exposure** — the stack must accommodate both block-based novice learners (primary school) and advanced compiled-firmware engineers (high school) on the same deployment.

---

## Client-Side Responsibility Split

A key architectural decision is which computation runs in the browser versus on the server. The table below documents this split; fuller rationale appears in the subsections that follow.

| Concern | Executes In | Rationale |
|---|---|---|
| MCU firmware simulation (avr8js / rp2040js / ESP32 core) | Browser (WASM / JS) | Eliminates server round-trips; enables offline use; avr8js and rp2040js are designed as browser-embeddable WASM/JS libraries |
| Component behavioural models (RSE) | Browser | Must react synchronously with simulator clock ticks; network latency would break real-time fidelity |
| 3D rendering (Three.js / React Three Fiber) | Browser (WebGL2) | GPU rendering cannot be proxied without server-side rendering pipeline of prohibitive cost |
| Arduino sketch compilation (accurate path) | Browser (WASM toolchain) **or** Compile Microservice | WASM path preferred for privacy and offline; microservice fallback for low-memory devices or unsupported browsers |
| Monaco editor, syntax/lint diagnostics | Browser | IDE responsiveness requires zero-latency feedback |
| Block-to-text transpilation | Browser | Immediate visual feedback required; output is sent to the compilation step |
| CRDT collaborative sync (Yjs) | Browser + WebSocket relay | Yjs diff computation is client-side; awareness and persistence relay is server-side |
| Business logic, data persistence, access control | Server (NestJS) | Authoritative RBAC, audit trails and multi-tenant isolation must not be bypassable client-side |
| Content delivery (assets, 3D models, project files) | CDN / S3-compatible | Static and large binary assets served from the edge for low latency |
| Authentication, session management | Server (OIDC/JWT) + Browser token store | Tokens verified server-side on every API call; short-lived JWTs with refresh tokens |
| Leaderboard/ranking computation | Server (Redis sorted sets) | Prevents client-side score manipulation |
| Content moderation, PII scanning | Server | Must not be bypassable; requires server-side audit log |

---

## Layer-by-Layer Technology Specification

### Client Application

#### Framework and Language

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| TS-001 | The RoboCode Studio SPA and the marketing/app shell shall be implemented in **React 18** with **TypeScript** (strict mode). | Must | TypeScript strict compilation must pass in CI without `any` suppressions in public APIs. |
| TS-002 | The marketing site and application shell shall use **Next.js** (App Router) for server-side rendering, static generation, and edge middleware routing. | Must | Next.js chosen for built-in ISR/SSG (critical for SEO on the marketing site), App Router co-location of server actions, and first-class TypeScript support. |
| TS-003 | The RoboCode Studio workspace shall be delivered as a rich SPA embedded within the Next.js shell, isolated in its own React subtree. | Must | Studio state must not cause full-page navigations; deep-link URL state is managed via the app router. |

**Alternatives considered for the SPA framework:**

| Alternative | Reason Rejected |
|---|---|
| Vue 3 / Nuxt | Smaller ecosystem for WASM/WebGL integrations; fewer senior engineers in the African talent pool relative to React. |
| SvelteKit | Immature TypeScript ecosystem for complex state machines at the time of specification; limited SSR middleware extensibility. |
| Angular | Bundle size and framework overhead conflict with low-bandwidth priority (NFR-PERF-002). |

#### State Management

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| TS-004 | Global application state (auth, tenant context, notifications) shall be managed with **Redux Toolkit** (RTK). | Must | RTK provides serialisable actions suitable for time-travel debugging and audit replay. |
| TS-005 | Localised, high-frequency Studio state (canvas selections, wire drag state, simulator pin states) shall use **Zustand** stores to avoid RTK boilerplate overhead in the hot rendering path. | Should | Zustand stores are colocated with Studio components; they do not appear in Redux DevTools by default to reduce noise. |

#### UI Component System

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| TS-006 | All UI primitives shall be built on **Radix UI** unstyled components wrapped by the **shadcn/ui** copy-into-codebase pattern, styled with **Tailwind CSS** utility classes. | Must | Design tokens are CSS custom properties that tenant themes override; Tailwind JIT purges unused classes for minimal CSS payload. |
| TS-007 | The design-token set shall expose `--brand-primary`, `--brand-secondary`, `--brand-surface`, `--brand-text`, `--brand-radius`, and typographic tokens as CSS variables so School Admin white-labelling (see *Functional Requirements: Multi-Tenancy, Custom Domains and White-Labelling*) can restyle the interface without a redeployment. | Must | Token override is injected at the `<html>` root by the tenant-context middleware during SSR. |

---

### 3D Rendering and Canvas Wiring

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| TS-010 | 3D visualisation of boards, breadboards, and components shall be implemented with **Three.js r160+** managed through **React Three Fiber (R3F)** and the **drei** helper library. | Must | R3F provides a declarative React reconciler for Three.js scene graphs, allowing component state to drive geometry without imperative scene management. |
| TS-011 | WebGL2 is the minimum required rendering context for 3D mode. The engine shall detect context availability at startup and fall back to 2D wokwi-elements mode transparently. | Must | Fallback tested on Chromium 90+ without hardware acceleration and on low-end Android WebView. |
| TS-012 | Progressive WebGPU acceleration shall be enabled when the browser exposes `navigator.gpu`. The Three.js WebGPU renderer path shall be feature-flagged behind a capability check. | Could | WebGPU provides ~3x throughput for particle/wire-density scenes; degradation to WebGL2 must be seamless. |
| TS-013 | The canvas wiring layer (breadboard tie-points, jumper wire routing, net highlighting) shall be implemented as a custom **SVG/Canvas** overlay composited above the 3D scene. | Must | SVG allows hit-testing and cursor interaction on wires; Canvas 2D is used for wire animation (signal propagation glow). |
| TS-014 | 2D mode shall render all components using **wokwi-elements** web components (github.com/wokwi/wokwi-elements), which are the canonical Wokwi open-source component renderers. | Must | wokwi-elements are custom elements; they are loaded into the React tree via a thin wrapper that bridges React prop changes to element attributes. |

**Alternatives considered for 3D rendering:**

| Alternative | Reason Rejected |
|---|---|
| Babylon.js | Larger bundle; R3F ecosystem (GLTF loaders, physics, postprocessing) better aligned with React 18 Concurrent Mode. |
| A-Frame | Designed for VR scenes, not precise electronics layout; CSS-positioned DOM components cannot be hit-tested alongside a 3D canvas. |
| CSS 3D transforms | Insufficient rendering fidelity for complex PCB/breadboard geometry. |

---

### Code Editor

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| TS-015 | The in-browser code editor shall be **Monaco Editor** (the engine underlying VS Code), integrated via `@monaco-editor/react`. | Must | Monaco provides LSP-compatible language services, multi-cursor editing, diff views, and a mature TypeScript SDK. |
| TS-016 | Monaco shall expose language support for: **Arduino C/C++** (clangd language server via WASM or a remote LSP proxy), **MicroPython** (pyright/Pylance subset), and a **block-based mode** that renders a Blockly or Scratch-style canvas and transpiles blocks to the active text language. | Must | Syntax definitions and snippet libraries for Arduino are bundled as Monaco language contributions. |
| TS-017 | Real-time lint diagnostics, inline error squiggles, and auto-complete for component/library APIs (e.g., `servo.attach()`, `Wire.begin()`) shall be driven by a precomputed API descriptor file updated with the component catalogue (see *Component and Sensor Library Specification*). | Must | Descriptor files are versioned and cached in Redis; Monaco receives them via a lightweight language-service worker. |
| TS-018 | The block-based mode transpiler shall produce semantically equivalent Arduino C/C++ or MicroPython that can be passed through the standard compilation/execution pipeline unchanged. | Must | Transpilation is deterministic and unit-tested; generated code is shown in a read-only side panel to aid students' transition to text coding. |

---

### Simulation Core

This is the most architecturally critical layer. It runs entirely in the browser (see *Client-Side Responsibility Split*).

#### AVR Simulation (Arduino UNO R3)

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| TS-020 | The RoboCode Simulation Engine (RSE) shall embed **avr8js** (github.com/wokwi/avr8js) to simulate the ATmega328P microcontroller at the instruction level, enabling real compiled Arduino UNO firmware to run in the browser. | Must | avr8js implements the full AVR instruction set and peripheral register map (GPIO, Timer/Counter 0/1/2, UART, SPI, I2C/TWI, ADC, Watchdog). |
| TS-021 | Arduino UNO sketches compiled to ELF/HEX by the in-browser WASM toolchain (or the compile microservice) shall be loaded directly into avr8js without any translation; execution is cycle-accurate. | Must | This eliminates a whole class of behavioural approximation bugs that affect simplified/interpreted modes. |
| TS-022 | The avr8js CPU loop shall run in a **Web Worker** to prevent blocking the main thread during simulation. Pin state changes shall be communicated to the UI thread via a `SharedArrayBuffer` or `postMessage` ring buffer, at a minimum of 60 samples per simulated millisecond for visual fidelity. | Must | Worker isolation is mandatory; the main thread must remain responsive for wiring, component drag, and editor interaction during a running simulation. |

#### ESP32 Simulation

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| TS-023 | An **ESP32 core simulation** shall model the Xtensa LX6 dual-core architecture and the ESP-IDF peripheral set (GPIO, PWM/LEDC, ADC, I2C, SPI, UART, Wi-Fi stub, BLE stub) sufficient to run MicroPython and Arduino-ESP32 sketches as used in the component catalogue. | Must | Full instruction-level Xtensa emulation is deferred to a roadmap item; the v1.0 target runs an interpreted ESP32 abstraction within the RoboCode Virtual Machine (RVM). |
| TS-024 | The RVM (RoboCode Virtual Machine) shall interpret a well-defined instruction set derived from the sketch's AST, mapping high-level calls to component actuator/sensor actions without full MCU-level emulation. | Must | RVM is the primary execution path for ESP32 in v1.0 and for simplified educational mode on both boards. |
| TS-025 | Wi-Fi and BLE simulation shall produce stub responses sufficient to demonstrate connection state, SSID scanning, MQTT publish/subscribe, and basic HTTP GET without a real network. | Should | Stub responses are defined in a fixture table within the RSE component model. |

#### RP2040 Simulation (Raspberry Pi Pico)

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| TS-026 | The RSE shall embed **rp2040js** (github.com/wokwi/rp2040js) to simulate the RP2040 microcontroller at the instruction level, enabling real compiled Raspberry Pi Pico firmware (UF2/ELF) to run in the browser. | Must | rp2040js implements the dual-core ARM Cortex-M0+ instruction set and RP2040 peripheral set (GPIO, PWM, ADC, I2C, SPI, UART, PIO state machines, USB 1.1); running real firmware eliminates behavioural approximation bugs. |
| TS-027 | MicroPython, CircuitPython, and C/C++ firmware compiled for the RP2040 (via Arduino-Pico core or Pico SDK) shall be loaded as UF2 or ELF images directly into rp2040js without translation; execution is instruction-accurate. | Must | The same compile pipeline used for AVR and ESP32 dispatches to the appropriate rp2040js loader based on the selected board target. |
| TS-028 | The rp2040js CPU loop shall run in a **Web Worker** (the same worker isolation model as avr8js per TS-022); pin state and ADC updates shall be communicated to the UI thread at a minimum of 60 samples per simulated millisecond. | Must | Worker isolation is mandatory to keep the main thread responsive; SharedArrayBuffer or postMessage ring buffer used for high-frequency pin state transfer. |
| TS-029 | The Raspberry Pi Pico W variant (CYW43439 Wi-Fi/BLE) is a **roadmap item**: the rp2040js simulation core shall be designed to accept a CYW43439 stub model without requiring changes to the core execution loop. | Could | Wi-Fi/BLE stub shall follow the same fixture-table pattern used for the ESP32 Wi-Fi stub (see TS-025). |

#### Component Behavioural Models

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| TS-030 | Every component in the RoboCode component catalogue (see *Component and Sensor Library Specification*) shall have a **behavioural model** registered with the RSE that maps input pin states / ADC values to output signals and visual state changes in the wokwi-elements renderer. | Must | Models are authored in TypeScript, unit-tested in isolation, and versioned with the component catalogue. |
| TS-031 | Audio output for buzzers and tone() calls shall use the **Web Audio API** (`AudioContext`, `OscillatorNode`, `AudioBuffer`) so frequency, duty cycle, and envelope are faithfully reproduced. | Must | Web Audio is available in all supported browsers; an AudioContext must be resumed on first user gesture per browser policy. |

#### Board Definition Library

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| TS-032 | RoboCode Studio shall use the **wokwi-boards** definition format (github.com/wokwi/wokwi-boards) as its canonical, data-driven board schema; each board is described by a `board.json` manifest (pin names, types, and x/y positions) plus an SVG visual asset — adding a new board requires no code change. | Must | The built-in wokwi-boards library (covering Arduino UNO, Nano, Mega, the ESP32 family, Raspberry Pi Pico, and more) ships pre-bundled; each board manifest declares its MCU core target (avr8js / rp2040js / ESP32 core) so the simulator selects the correct execution engine automatically. |
| TS-033 | Platform admins and approved advanced users/teachers shall be able to upload **custom board definitions** in the wokwi-boards manifest format; uploads are validated against the JSON schema (pin sanity, SVG/asset safety) and, for non-admins, enter the standard approval/moderation workflow before becoming available to learners. | Should | Validation is enforced server-side in the Compile/Studio microservice; rejected manifests return structured error details; approved custom boards are stored in S3 and indexed in PostgreSQL per tenant. |

#### Compilation Pipeline

```
Student writes/generates sketch
        │
        ▼
┌──────────────────────────────────────────────────────┐
│          In-Browser WASM Toolchain (preferred)        │
│  avr-gcc / avr-libc + Arduino core (Emscripten WASM) │
│  or                                                   │
│  ESP32 toolchain WASM (xtensa-gcc / arduino-esp32)   │
│  or                                                   │
│  arm-none-eabi-gcc + Pico SDK / Arduino-Pico (WASM)  │
└───────────────────┬──────────────────────────────────┘
                    │  if WASM unavailable or OOM
                    ▼
┌──────────────────────────────────────────────────────┐
│           Compile Microservice (NestJS)               │
│  Dockerised toolchain; sketch POSTed over HTTPS;     │
│  returns ELF/HEX/UF2; result cached in Redis by hash │
└───────────────────┬──────────────────────────────────┘
                    │
                    ▼
        ELF / Intel HEX / UF2
                    │
        ┌───────────┼────────────┐
        ▼           ▼            ▼
  avr8js (UNO)  rp2040js     RVM / ESP32 core
  (cycle-acc.)  (Pico/RP2040) (interpreted v1.0)
                (instr.-acc.)
```

---

### Backend Services

#### Runtime and Framework

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| TS-040 | All backend microservices shall be implemented in **Node.js LTS** (v20+) using the **NestJS** framework with TypeScript. | Must | NestJS provides dependency injection, modular architecture, and first-class support for microservice transports (TCP, Redis pub/sub, gRPC). |
| TS-041 | Inter-service communication shall use **Redis pub/sub** for event-driven messaging and direct **gRPC** calls for synchronous service-to-service requests within the cluster. | Must | Redis is already in the stack for caching; adding pub/sub avoids an additional message broker for internal events. |

**Alternatives considered:**

| Alternative | Reason Rejected |
|---|---|
| Express + custom DI | No structural enforcement; scales poorly as team grows. |
| Go / Rust microservices | Team skill set; Node/TS enables code sharing between client and server (e.g., shared type definitions, Zod schemas). |
| Django / FastAPI | Python runtime inconsistency with the Node-dominated stack; additional container image to maintain. |

#### API Layer

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| TS-050 | The platform shall expose a **GraphQL** API (using `@nestjs/graphql` with Apollo Server) as the primary client-facing API for structured data queries and mutations. | Must | GraphQL enables the RoboCode Studio SPA to co-locate data fetching with components and request only needed fields, reducing payload size on constrained connections. |
| TS-051 | A **REST/HTTP** API shall be provided for webhooks, third-party integrations, and school SSO callbacks (OAuth2 redirect URIs, SAML ACS endpoints). | Must | REST endpoints are documented as OpenAPI 3.1 schemas, auto-generated from NestJS decorators. |
| TS-052 | Real-time project collaboration, simulator state streaming, and notification delivery shall use **WebSocket** (Socket.IO) connections managed by a dedicated realtime gateway service. | Must | Socket.IO provides automatic fallback to HTTP long-polling for restrictive school network environments. |
| TS-053 | Collaborative project editing (shared canvas, shared code) shall use **Yjs CRDT** over the Socket.IO transport, with the server acting as a persistence and awareness relay (y-socket.io provider). | Should | Yjs convergence is conflict-free; it handles concurrent edits from multiple students in a team without server-side merge logic. |

---

### Data Persistence

#### Primary Database

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| TS-060 | All relational data (users, tenants, classes, tasks, projects, RoboPoints, audit logs) shall be stored in **PostgreSQL 15+** in a multi-tenant schema where every table carries a `tenant_id` column and **Row-Level Security (RLS)** policies enforce tenant isolation. | Must | RLS is enforced at the database driver level; a compromised application layer cannot read cross-tenant rows. This is essential for GDPR-K and POPIA compliance (see *Security, Privacy and Child Safety*). |
| TS-061 | Database migrations shall be managed with **Prisma Migrate** or **TypeORM Migrations**, applied in CI before deployment and reversible with a down-migration. | Must | Migration history is version-controlled in the monorepo; rollbacks are automated in the CD pipeline. |
| TS-062 | Connection pooling shall use **PgBouncer** in transaction mode, with pool sizes tuned per microservice. The maximum connection count to PostgreSQL shall not exceed the `max_connections` parameter set during cluster provisioning. | Must | Verified by load tests in the CI pipeline (see *Infrastructure, Deployment and DevOps*). |

#### Caching and Realtime Data Structures

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| TS-063 | **Redis 7+** shall serve as the shared cache, session store, job queue (BullMQ), pub/sub bus, and leaderboard store (sorted sets for RoboPoints rankings). | Must | Redis Cluster or Redis Sentinel shall be configured for HA; no single-node Redis in production. |
| TS-064 | Compiled sketch ELF/HEX artefacts shall be cached in Redis keyed by `SHA256(sketch_source + board_target + toolchain_version)`. Cache TTL is 7 days. | Should | Avoids redundant recompilation for common classroom exercises; reduces compile microservice load. |
| TS-065 | Session JWTs shall use short-lived access tokens (15 minutes) with refresh tokens stored in Redis with a TTL matching the session policy per role (e.g., 8 hours for Students, 24 hours for Teachers). | Must | Redis token revocation on logout or role change; verified by integration test covering the revocation path. |

#### Object Storage

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| TS-066 | Static assets (3D GLTF models, wokwi-elements bundles, student project screenshots, uploaded media) shall be stored in an **S3-compatible object store** (AWS S3 or compatible: MinIO for self-hosted, Cloudflare R2 for egress-cost reduction). | Must | Pre-signed URLs (15-minute TTL) are used for all private asset access; public CDN distribution uses signed CloudFront/Cloudflare URLs. |
| TS-067 | Student project files (canvas JSON, sketch source, compiled HEX) shall be stored as versioned objects; at least 20 previous versions shall be retained per project. | Should | Versioning is implemented as S3 object versioning; a background Lambda/job prunes versions beyond the retention limit. |

#### Search

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| TS-068 | Full-text search over the content library (learning modules, task descriptions, component documentation) shall be implemented with **OpenSearch** (AWS OpenSearch Service or self-hosted) as an optional service. | Could | PostgreSQL `tsvector`/`tsquery` is the fallback if OpenSearch is not provisioned; API contract is identical. |

---

### Identity and Authentication

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| TS-070 | The Identity service shall implement **OAuth 2.0** and **OpenID Connect (OIDC)** using a self-hosted OIDC provider (Keycloak or a custom NestJS OIDC server) as the authority for all access and identity tokens. | Must | JWTs are signed RS256; public JWKS endpoint is used by all services to verify tokens without a network call per request. |
| TS-071 | School SSO integration shall support **Google Workspace for Education** and **Microsoft Entra ID (Azure AD)** as external OIDC/SAML2 IdPs, mapped to the tenant's identity namespace. | Must | IdP metadata exchange is documented in the onboarding wizard for School Admins (see *Functional Requirements: Multi-Tenancy, Custom Domains and White-Labelling*). |
| TS-072 | TOTP-based MFA (RFC 6238) shall be mandatory for Super Admin and Platform Moderator accounts, and optional (but recommended) for School Admin and Teacher accounts. | Must | MFA enforcement is a per-role policy stored in the Identity service; verified by penetration test in QA. |
| TS-073 | Parental/guardian consent tokens shall be delivered via email (and optionally SMS) as signed, time-limited JWT links that resolve through a dedicated consent endpoint, recording verifiable consent with timestamp and IP. | Must | Consent records are append-only in PostgreSQL; deletion requests trigger a GDPR erasure workflow, not direct deletion. |

---

### Infrastructure and Deployment

#### Containerisation and Orchestration

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| TS-080 | All services shall be packaged as **Docker** images following a multi-stage build pattern (build stage → distroless/slim runtime image) to minimise attack surface and image size. | Must | Images are scanned by Trivy in CI; any Critical CVE blocks the pipeline. |
| TS-081 | Production workloads shall run on **Kubernetes (K8s)** managed clusters (AWS EKS, GCP GKE, or Azure AKS). The primary region shall include **af-south-1** (AWS Cape Town) or equivalent African region. | Must | Horizontal Pod Autoscaler (HPA) is configured for every deployment; resource requests and limits are mandatory. |
| TS-082 | Infrastructure shall be provisioned and version-controlled using **Terraform** (HCL) with remote state stored in S3 + DynamoDB lock. | Must | Modules are organised per environment (dev / staging / prod); `terraform plan` output is reviewed in PRs before apply. |

#### CDN and Edge

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| TS-083 | Static assets and the Next.js HTML shell shall be distributed via a global CDN — **Cloudflare** (preferred for its African PoPs) or **AWS CloudFront** — with cache-control headers appropriate to asset immutability. | Must | Cloudflare Workers handle tenant subdomain routing and custom-domain TLS termination at the edge (see *Functional Requirements: Multi-Tenancy, Custom Domains and White-Labelling*). |
| TS-084 | Automated TLS certificate provisioning for school custom domains shall use the **ACME / Let's Encrypt** protocol with DNS-01 challenge, requiring the school to add a CNAME or TXT record during onboarding. | Must | Certificate renewal is automated; expiry within 7 days triggers an alert to Super Admin. |

#### CI/CD

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| TS-085 | The CI/CD pipeline shall be implemented with **GitHub Actions** workflows: lint, unit test, integration test, Docker build, image scan, Terraform plan, and Kubernetes rolling deploy stages. | Must | All stages are required to pass before merge to `main`; branch protection rules enforce this. |
| TS-086 | Production deployments shall use a **blue/green** or **rolling update** strategy with automated rollback triggered if error-rate Prometheus alerts fire within the first 10 minutes post-deploy. | Must | Rollback is tested quarterly in a chaos engineering drill. |

---

### Observability

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| TS-090 | All services shall emit traces, metrics, and logs using the **OpenTelemetry SDK** (OTLP export), with an OpenTelemetry Collector sidecar forwarding to the observability backend. | Must | Trace context propagation is mandatory across HTTP, gRPC, and Redis pub/sub hops. |
| TS-091 | Metrics shall be collected and stored in **Prometheus** and visualised in **Grafana** dashboards covering: request latency, error rate, active WebSocket sessions, simulation CPU time, compile queue depth, and per-tenant active users. | Must | Alert rules are defined as Prometheus AlertManager rules, code-reviewed alongside the service they monitor. |
| TS-092 | Client-side and server-side exception tracking shall use **Sentry** with source-map upload in CI so stack traces resolve to TypeScript source lines. | Must | PII scrubbing rules are configured in Sentry to prevent student data appearing in error payloads. |
| TS-093 | All structured logs shall be emitted as JSON, collected by a Fluent Bit / Fluentd DaemonSet, and stored in OpenSearch or an equivalent log analytics backend with a minimum 90-day retention for audit logs and 30-day for operational logs. | Must | Audit log retention aligns with POPIA and GDPR-K requirements (see *Security, Privacy and Child Safety*). |

---

### Integrations and External Services

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| TS-100 | Transactional email (account verification, consent requests, password reset, notifications) shall use **AWS SES** or **SendGrid**, with **Mailhog** substituted in local development. | Must | DMARC/DKIM/SPF records are configured on the `robocode.africa` sending domain. |
| TS-101 | SMS delivery for low-connectivity regions and optional parental consent shall use a provider with African coverage (e.g., **Africa's Talking**, Twilio) selected per deployment region. | Should | SMS is a fallback channel; email is primary. Provider is configurable via environment variable per tenant. |
| TS-102 | Payment processing for school seat plans and individual subscriptions shall support **Stripe** (international cards), **Paystack** (West Africa), and **Flutterwave** (pan-Africa), selectable per tenant. | Must | Payment provider selection is a tenant-level configuration; all payment flows are PCI-DSS compliant via provider-hosted checkout pages. No card data passes through RoboCode.Africa servers. |

---

### Browser and Runtime Requirements

The authoritative supported-browser baseline is the Browser and Device Matrix in *Non-Functional Requirements* (NFR-PORT). The values below restate that single baseline; they must not diverge from it.

| Requirement | Minimum Version | Notes |
|---|---|---|
| Chrome / Chromium | 109 | Primary target; Web Workers, SharedArrayBuffer, WebGL2, WASM all required. |
| Firefox | 115 ESR | Full support; SharedArrayBuffer requires COOP/COEP headers (set globally). |
| Safari / WebKit | 16.4+ | WebGPU available from 17; WebGL2 from 15; SharedArrayBuffer from 15.2. |
| Edge (Chromium) | 109 | Equivalent to Chrome. |
| Mobile Chrome (Android) | 109 | 3D mode optional; 2D wokwi-elements mode is the default for mobile. |
| Mobile Safari (iOS) | 16.4+ | 3D mode limited; AudioContext resume on gesture required. |
| Node.js (server) | 20 LTS | ESM-first; built-in `fetch`, `crypto`, and `stream/web` APIs used. |

**Required browser capabilities (enforced at startup):**

- `WebAssembly` (for toolchain WASM)
- `Worker` and `SharedArrayBuffer` (COOP + COEP headers mandatory — see *Security, Privacy and Child Safety*, SR-HDR-001)
- `WebGL2RenderingContext` (for 3D; graceful 2D fallback if absent)
- `AudioContext` (for buzzer simulation)
- `WebSocket` (for realtime collaboration)

---

### Build and Packaging

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| TS-110 | The frontend shall be built with **Next.js** (`next build`) which invokes **Webpack 5** (or **Turbopack** when stable) for bundle splitting, tree-shaking, and asset hashing. | Must | Separate chunk for Monaco editor and Three.js prevents main-bundle bloat; dynamic `import()` used for Studio workspace. |
| TS-111 | The WASM toolchain binary shall be distributed as a pre-compiled artefact hosted on the CDN and loaded lazily only when the user initiates a compilation. | Must | WASM binary is typically 20–40 MB; lazy loading is mandatory to not block initial page paint. |
| TS-112 | The `wokwi-elements` web component bundle shall be imported as an ES module via a CDN URL with a locked version hash in the Next.js `next.config.js` Content Security Policy. | Must | Version locking prevents supply-chain drift; upgrades are explicit PRs with changelogs. |
| TS-113 | A **pnpm** monorepo (Turborepo or Nx) shall manage shared packages: `@robocode/types`, `@robocode/ui`, `@robocode/rse-core`, `@robocode/rvm`, `@robocode/component-models`. | Must | Shared types ensure client/server API contracts are identical TypeScript interfaces without runtime overhead. |

---

## Technology Stack Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                      CLIENT (Browser)                           │
│  React 18 + TypeScript │ Next.js App Router │ Tailwind + shadcn │
│  Redux Toolkit │ Zustand │ Monaco Editor (C++/MicroPython/Blocks)│
│  Three.js + R3F + drei (WebGL2/WebGPU)                          │
│  wokwi-elements (2D)  │  SVG/Canvas wiring overlay              │
│  avr8js (Web Worker)  │  rp2040js (Worker) │  RVM / ESP32 core  │
│  Web Audio API        │  wokwi-boards (board definition library)  │
│  Yjs CRDT │ Socket.IO client │ Apollo Client (GraphQL)          │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTPS / WSS
┌──────────────────────────────▼──────────────────────────────────┐
│                  EDGE / CDN (Cloudflare / CloudFront)           │
│  Static assets │ HTML shell │ WASM toolchain │ GLTF models      │
│  Subdomain routing │ Custom-domain TLS (ACME / Let's Encrypt)   │
└──────────────────────────────┬──────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────┐
│              API GATEWAY (Kong / NGINX Ingress)                 │
│  Rate limiting │ JWT verification │ Tenant routing              │
└──────┬──────────────────────┬──────────────────────┬───────────┘
       │                      │                      │
  GraphQL API           REST / Webhooks        Socket.IO Gateway
  (Apollo+NestJS)       (NestJS REST)          (NestJS + Yjs relay)
       │                      │                      │
┌──────▼──────────────────────▼──────────────────────▼───────────┐
│              MICROSERVICES (NestJS / Node.js 20)               │
│  Identity │ Tenant │ Studio │ Compile │ LMS │ Teams │ Moderation│
│  Gamification │ Notifications │ Analytics │ Payments            │
└──────┬────────────────────────────────┬────────────────────────┘
       │                                │
┌──────▼────────────┐       ┌───────────▼───────────────────────┐
│   PostgreSQL 15   │       │   Redis 7 (Cluster)               │
│   PgBouncer pool  │       │   Cache │ Sessions │ BullMQ │ Sets │
│   Row-Level Sec.  │       └───────────────────────────────────┘
└───────────────────┘
┌──────────────────────────────────────────────────────────────── ┐
│   S3-Compatible Object Store (AWS S3 / Cloudflare R2 / MinIO)  │
│   GLTF models │ Project files (versioned) │ Compiled HEX cache  │
└─────────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────── ┐
│   Observability: OpenTelemetry → Prometheus / Grafana / Sentry  │
│   Logs: Fluent Bit → OpenSearch │ Audit trail: PostgreSQL       │
└─────────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────── ┐
│   Infrastructure: Kubernetes (EKS/GKE) │ Terraform │ GitHub CI  │
│   Primary region: af-south-1 (Cape Town) + global CDN PoPs     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Cross-References

- Browser security headers (COOP, COEP, CSP) required by the WASM/SharedArrayBuffer environment are specified in *Security, Privacy and Child Safety* (SR-HDR-001 through SR-HDR-005).
- The multi-tenant subdomain and custom-domain routing that the CDN and API Gateway enable is detailed in *Functional Requirements: Multi-Tenancy, Custom Domains and White-Labelling*.
- The full component behavioural model interface, pin mapping, and component catalogue are specified in *Component and Sensor Library Specification*.
- Performance targets (page load, simulation frame rate, compile latency) that this stack must satisfy are enumerated in *Non-Functional Requirements* (NFR-PERF-001 through NFR-PERF-010).
- The CI/CD pipeline stages, IaC conventions, and deployment strategy are expanded in *Infrastructure, Deployment and DevOps*.
- Observability dashboards, alert rules, and SLA monitoring are detailed in *Observability, Logging, Monitoring and Support*.
