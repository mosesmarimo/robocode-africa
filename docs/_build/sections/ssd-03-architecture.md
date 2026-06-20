# System Architecture

## Overview

This section specifies the system architecture of RoboCode.Africa. It defines the architectural goals and drivers that shape all design decisions, the architectural style adopted, a logical layered view of the system, a decomposition of component services, a deployment view, the multi-tenant routing and isolation approach, the real-time architecture, and the key architectural decisions with their rationale.

All requirement identifiers follow the convention defined in the System Specification Document introduction: functional requirements carry the prefix `FR-<MODULE>-<nnn>`; non-functional requirements carry `NFR-<CAT>-<nnn>`; security requirements carry `SR-<nnn>`; interface requirements carry `IR-<nnn>`; and data requirements carry `DR-<nnn>`.

---

## Architectural Goals and Drivers

The architecture of RoboCode.Africa is shaped by six primary quality drivers. Every structural decision traces back to at least one of these drivers.

| Driver | Description | Primary Impact |
|---|---|---|
| Child Safety and Data Protection | Safety is the prime directive. The platform serves minors under COPPA, GDPR-K, POPIA, NDPR, Zimbabwe Cyber Act, and the Kenya Data Protection Act. Every data flow involving a minor must be auditable, consent-gated, and moderated. | Identity, Moderation, Data, Compliance |
| Multi-Tenancy and Isolation | Schools operate as isolated tenants on subdomains or custom domains with white-label branding. Tenant data must never leak across boundaries, and each tenant's configuration must be independently manageable. | Multi-tenant routing, RLS, API gateway |
| Client-Heavy Interactive Simulation | The RoboCode Simulation Engine (RSE) runs entirely in the browser — AVR/ATmega328P firmware via avr8js, ESP32 core simulation, RP2040 firmware via rp2040js (Raspberry Pi Pico), 2D wokwi-elements rendering, and optional 3D via Three.js/React Three Fiber. Offloading simulation to the client avoids server-side compute costs and enables offline-capable low-latency interaction. | SPA architecture, WASM toolchain, CDN delivery |
| Low-Bandwidth and Connectivity | Serving learners across Africa means designing for intermittent, low-throughput connections. Assets must be aggressively cached, critical paths must be progressively loadable, and the simulator must remain functional while offline or on a slow link after initial load. | CDN/edge strategy, asset compression, offline-first service worker |
| Scalability and Availability | The platform must support thousands of concurrent students and tens of school tenants in its initial release, growing to many more without architectural rework. Stateless services, horizontal pod autoscaling, and a well-defined service boundary strategy underpin this. | Kubernetes HPA, stateless service design, Redis caching |
| Collaborative Real-Time Editing | Students and teachers must be able to co-author projects and code simultaneously. The architecture must support conflict-free concurrent edits (Yjs CRDT) and real-time simulation telemetry streaming. | WebSocket gateway, CRDT sync, Socket.IO |

---

## Architectural Style

RoboCode.Africa adopts a **layered service-oriented architecture** with a **thick client** strategy for simulation. The overall shape is:

- A **Single-Page Application (SPA)** client (React 18 + TypeScript) that hosts RoboCode Studio. The Studio SPA encompasses the component canvas, wiring editor, Monaco code editor, and the full RSE running inside Web Workers. The Next.js App Router shell handles the marketing site and app-level routing with server-side rendering (SSR) for public pages and static generation for documentation and marketing content.
- A **service-oriented backend** composed of independently deployable NestJS microservices, each owning a bounded domain. Services expose their capabilities through a shared API gateway — GraphQL for rich data queries and REST for resource-oriented endpoints — and communicate internally over an async message queue (Redis Streams / AMQP).
- **Client-side simulation** as the deliberate architectural centrepiece: all firmware compilation (in-browser WASM toolchain or a lightweight compile microservice) and execution (avr8js for Arduino UNO, rp2040js for Raspberry Pi Pico, ESP32 core for ESP32 DevKit) run in the browser, with results rendered by wokwi-elements (2D) or Three.js/React Three Fiber (3D). Board definitions are data-driven using the wokwi-boards manifest format, allowing new boards to be added without code changes. The backend never executes simulation code.
- **Real-time infrastructure** using Socket.IO WebSocket connections through the API gateway for collaborative editing (Yjs CRDT documents), simulation telemetry replay/sharing, notifications, and moderation events.

---

## Logical Layered View

The following diagram shows the logical layers and their major contents. The arrows represent the primary dependency direction.

```
┌─────────────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                              │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  Next.js App Shell (Marketing, Auth flows, Tenant routing)    │  │
│  │  React 18 + TypeScript  │  Tailwind CSS + Radix/shadcn       │  │
│  │  Design token theming (white-label per tenant)                │  │
│  └───────────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  RoboCode Studio SPA                                          │  │
│  │  Canvas/Wiring (SVG/Canvas)  │  Monaco Editor                │  │
│  │  Redux Toolkit / Zustand state                                │  │
│  │  ┌───────────────────────────────────────────────────────┐   │  │
│  │  │   RoboCode Simulation Engine (RSE) — Web Worker       │   │  │
│  │  │   avr8js (UNO)  │  rp2040js (Pico)  │  ESP32 core    │   │  │
│  │  │   wokwi-elements (2D)  │  Three.js/R3F (3D WebGL2)    │   │  │
│  │  │   RoboCode Virtual Machine (RVM) — interpreted path   │   │  │
│  │  │   WASM toolchain (in-browser compile)                  │   │  │
│  │  └───────────────────────────────────────────────────────┘   │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                 │  HTTPS / WSS
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         API LAYER                                   │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  API Gateway (NestJS Gateway / Kong / NGINX)                  │  │
│  │  GraphQL endpoint   │   REST endpoints   │   WS gateway       │  │
│  │  JWT verification   │   Tenant resolution  │  Rate limiting   │  │
│  │  Request routing to domain services                           │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                 │  Internal (mTLS / service mesh)
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      DOMAIN SERVICES LAYER                          │
│                                                                     │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────┐  │
│  │ Identity /   │ │  Tenant /    │ │  Student /   │ │  Content │  │
│  │ Auth Service │ │ School Svc   │ │  Profile Svc │ │  / LMS   │  │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────┘  │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────┐  │
│  │  Teams /     │ │ Gamification │ │ Notification │ │Moderation│  │
│  │ Competition  │ │   Service    │ │   Service    │ │ Service  │  │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────┘  │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐               │
│  │  Reporting / │ │  Media /     │ │  Compile     │               │
│  │  Analytics   │ │  Asset Svc   │ │  Microservice│               │
│  └──────────────┘ └──────────────┘ └──────────────┘               │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                                   │
│                                                                     │
│  ┌───────────────────────┐  ┌──────────┐  ┌──────────────────────┐ │
│  │ PostgreSQL            │  │  Redis   │  │   S3-compatible      │ │
│  │ (multi-tenant, RLS)   │  │ (cache,  │  │   Object Storage     │ │
│  │ Primary + read        │  │ sessions,│  │ (projects, assets,   │ │
│  │ replicas              │  │ queues,  │  │  3D models, firmware)│ │
│  │                       │  │ leaderbd)│  │                      │ │
│  └───────────────────────┘  └──────────┘  └──────────────────────┘ │
│  ┌───────────────────────┐                                          │
│  │ OpenSearch (optional) │                                          │
│  │ Content/project search│                                          │
│  └───────────────────────┘                                          │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     INTEGRATION LAYER                               │
│                                                                     │
│  Email (SES/SendGrid) │ SMS (low-connectivity fallback)            │
│  School SSO (Google/Microsoft OIDC) │ Payments (Stripe/Paystack/  │
│  Flutterwave) │ DNS/ACME (Let's Encrypt) │ CDN (Cloudflare/       │
│  CloudFront) │ Observability (OTEL, Prometheus, Sentry)            │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Component Decomposition

### Studio Client

The Studio Client is a React 18 / TypeScript SPA loaded from the CDN. It is the primary user-facing application for Students, Teachers, and Guests using RoboCode Studio.

| Sub-component | Responsibility |
|---|---|
| Next.js App Shell | SSR marketing pages, tenant-aware routing, auth flows, top-level layout, design-token injection |
| Canvas / Wiring Editor | SVG/Canvas layer for drag-and-drop component placement, breadboard rendering, and jumper wire routing |
| Monaco Editor | Code authoring with Arduino C/C++, MicroPython, and block-based mode; real-time lint/diagnostics |
| Studio State Manager | Redux Toolkit / Zustand store managing project state, component tree, simulation state, and collaboration cursors |
| RSE Web Worker Host | Spawns and communicates with the RSE Web Worker; relays pin events, handles compile requests, streams telemetry |
| Offline / Service Worker | Caches core SPA assets, wokwi-elements, and the WASM toolchain for offline-capable simulation after initial load |

### RoboCode Simulation Engine (RSE)

The RSE runs entirely in the browser inside a dedicated Web Worker to avoid blocking the UI thread. It is the simulation layer defined in "Functional Requirements: RoboCode Simulation Engine (RSE)" (section 8).

| Sub-component | Responsibility |
|---|---|
| avr8js Core | Executes real compiled ATmega328P (Arduino UNO) firmware cycle-accurately; manages CPU registers, memory, timers, UART, SPI, I2C |
| rp2040js Core | Executes real RP2040 (Raspberry Pi Pico) firmware — loads UF2/ELF firmware images and simulates the dual-core ARM Cortex-M0+, 264 KB SRAM, 26 GPIO, ADC, UART, SPI, I2C, PWM, PIO state machines, and USB 1.1; supports MicroPython, CircuitPython, and C/C++ (Arduino-Pico core / Pico SDK) |
| ESP32 Core Simulation | Simulates ESP32 DevKit (ESP-WROOM-32); supports Wi-Fi/BLE stubs, dual-core task model, peripheral buses |
| RoboCode Virtual Machine (RVM) | Interpreted/translated execution path for simplified code mode; maps high-level constructs to component pin actions |
| Component Behavioural Models | Per-component models (LED, LCD, servo, HC-SR04, DHT11, etc.) that react to pin state changes and produce output events |
| Board Definition Loader | Reads wokwi-boards manifests (board.json + SVG asset) to configure the pin map, visual rendering, and MCU core binding for each board; the built-in library covers Arduino UNO/Nano/Mega, the ESP32 family, and Raspberry Pi Pico; platform admins and approved users can upload validated custom board definitions |
| WASM Toolchain (in-browser) | Compiles Arduino C/C++ sketches to AVR, RP2040, or ESP32 ELF/UF2 firmware inside the browser using a WASM-packaged toolchain (avr-gcc, arm-none-eabi-gcc / Pico SDK, or xtensa-esp32 GCC) |
| 2D Renderer Bridge | Passes component state to wokwi-elements Web Components for 2D canvas rendering |
| 3D Scene Manager | Drives Three.js / React Three Fiber scene from component states; manages 3D models, lighting, and camera; degrades to 2D on low-end devices |
| WebAudio Bridge | Routes buzzer/tone frequency and duty-cycle values to the Web Audio API for audible simulation output |

### Identity / Auth Service

Handles OAuth2/OIDC flows, JWT issuance and verification, session management, school SSO federation, TOTP MFA for staff/admins, and consent workflow orchestration. Detailed requirements are in "Functional Requirements: Identity, Authentication and Authorization" (section 5).

### Tenant / School Service

Manages school (tenant) lifecycle: provisioning, subdomain and custom-domain configuration, ACME/Let's Encrypt TLS certificate automation (CNAME/TXT DNS verification), white-label branding tokens, seat and plan management, and tenant policy settings. Detailed requirements are in "Functional Requirements: Multi-Tenancy, Custom Domains and White-Labelling" (section 6).

### Student / Profile Service

Manages student and staff profiles, role assignments (RBAC), approval workflows (pending → approved → active), parental consent records, and account lifecycle (suspension, deletion, GDPR right-to-erasure). Interfaces with the Identity Service for authentication data.

### Content / LMS Service

Manages the global and tenant-scoped content library: coding tasks, robotics projects, curricula, learning pathways, rubrics, and teacher annotations. Provides assignment workflows (create → assign → submit → grade). Detailed requirements are in "Functional Requirements: Learning Management and Content" (section 11).

### Teams / Competition Service

Manages team formation, join requests, competition events, bracket management, submission windows, and judging workflows. Detailed requirements are in "Functional Requirements: Teams, Competitions and Gamification" (section 12).

### Gamification Service

Owns RoboPoints issuance, ledger, and audit trail; badge/achievement definitions and unlock logic; leaderboard computation (global, school-scoped, class-scoped); streak tracking; and reward configurations. Interfaces with Redis for real-time leaderboard sorted sets.

### Notification Service

Routes transactional and in-app notifications through appropriate channels (in-app push via WebSocket, email via SES/SendGrid, SMS for low-connectivity fallback). Enforces consent preferences and parental notification rules for minors. Detailed requirements are in "Functional Requirements: Communication, Notifications and Moderation" (section 13).

### Moderation Service

Provides automated content filtering (profanity, PII, safeguarding keywords), manual moderation queues, abuse report workflows, escalation to Super Admin / Platform Moderator, and audit-log emission. All student-generated content and messages pass through this service before storage or delivery. Detailed requirements are in "Functional Requirements: Communication, Notifications and Moderation" (section 13).

### Reporting / Analytics Service

Aggregates anonymised and pseudonymised usage events (OpenTelemetry spans emitted by all services) into dashboards for Super Admin, School Admin, and Teacher roles. No behavioural advertising or third-party analytics tracking of minors. Detailed requirements are in "Functional Requirements: Administration, Analytics and Reporting" (section 14).

### Media / Asset Service

Manages upload, storage, virus-scanning, transformation (image resize, 3D model optimisation), and CDN-backed signed-URL delivery of project files, 3D component models, uploaded images, and firmware binaries. Backed by S3-compatible object storage.

### Compile Microservice

An optional backend microservice that accepts Arduino C/C++, MicroPython, CircuitPython, or Pico SDK/Arduino-Pico source and returns compiled firmware (ELF/BIN/UF2) targeting AVR (Arduino UNO), RP2040 (Raspberry Pi Pico), or ESP32. Invoked when the in-browser WASM toolchain is unavailable or too slow on low-end devices. Runs in an isolated sandbox container with strict CPU/memory/timeout limits. Output is cached in Redis by source hash.

### API Gateway

The single ingress for all client-to-backend traffic. Responsibilities: JWT verification and claims propagation, tenant resolution from Host header, request routing to domain services, rate limiting per role and tenant, GraphQL schema stitching, REST-to-gRPC transcoding, WebSocket upgrade and session binding.

---

## Deployment View

```
                         ┌──────────────────────────────────┐
  Users (browsers)  ───► │   CDN / Edge Layer               │
                         │   Cloudflare / CloudFront        │
                         │   - Static SPA assets, WASM      │
                         │   - wokwi-elements bundles       │
                         │   - 3D model assets              │
                         │   - TLS termination              │
                         │   - DDoS protection              │
                         │   - WAF (custom domain tenants)  │
                         └─────────────┬────────────────────┘
                                       │  Origin pull / API proxy
                                       ▼
                         ┌──────────────────────────────────┐
                         │   Kubernetes Cluster             │
                         │   (AWS af-south-1 or equivalent) │
                         │                                  │
                         │  ┌──────────────────────────┐   │
                         │  │  Ingress Controller      │   │
                         │  │  (NGINX / Traefik)       │   │
                         │  │  Tenant-aware SNI routing │   │
                         │  └────────────┬─────────────┘   │
                         │               │                  │
                         │  ┌────────────▼─────────────┐   │
                         │  │  API Gateway Pod(s)       │   │
                         │  │  NestJS Gateway + Kong    │   │
                         │  │  GraphQL / REST / WS      │   │
                         │  └────────────┬─────────────┘   │
                         │               │                  │
                         │  ┌────────────▼─────────────┐   │
                         │  │  Domain Service Pods      │   │
                         │  │  Identity  │ Tenant       │   │
                         │  │  Student   │ Content/LMS  │   │
                         │  │  Teams     │ Gamification │   │
                         │  │  Notif.    │ Moderation   │   │
                         │  │  Reporting │ Media/Asset  │   │
                         │  │  Compile Microservice     │   │
                         │  └────────────┬─────────────┘   │
                         │               │                  │
                         │  ┌────────────▼─────────────┐   │
                         │  │  WebSocket Gateway Pod(s) │   │
                         │  │  Socket.IO  │  Yjs relay  │   │
                         │  └──────────────────────────┘   │
                         │                                  │
                         └───┬──────────────┬──────────────┘
                             │              │
              ┌──────────────▼──┐   ┌───────▼──────────────┐
              │  PostgreSQL     │   │  Redis Cluster       │
              │  Primary +      │   │  (ElastiCache /      │
              │  Read Replicas  │   │   self-hosted)       │
              │  Multi-tenant   │   │  Cache, sessions,    │
              │  Row-Level      │   │  queues, leaderboards│
              │  Security       │   └──────────────────────┘
              └─────────────────┘
              ┌─────────────────┐   ┌──────────────────────┐
              │  S3-compatible  │   │  OpenSearch          │
              │  Object Storage │   │  (optional)          │
              │  (project files,│   │  Content/project     │
              │  models, FW)    │   │  full-text search    │
              └─────────────────┘   └──────────────────────┘
              ┌─────────────────┐
              │  Message Queue  │
              │  Redis Streams  │
              │  / AMQP broker  │
              │  Async inter-   │
              │  service events │
              └─────────────────┘
```

---

## Multi-Tenant Routing and Isolation

### Tenant Resolution

Every inbound HTTP/WebSocket request carries a `Host` header. The API gateway and Kubernetes Ingress Controller resolve the tenant as follows:

1. If the host matches `robocode.africa` or `www.robocode.africa` — the request is a direct (main-domain) request and is handled by the platform itself with no tenant scope reduction.
2. If the host matches `<slug>.robocode.africa` — the slug is looked up in the tenant registry to resolve a `tenant_id`.
3. If the host matches a custom domain registered by a school — the custom domain is looked up in the tenant custom-domain table (DNS CNAME/TXT verified; TLS certificate managed via ACME/Let's Encrypt) to resolve a `tenant_id`.
4. Unrecognised hosts return HTTP 404 with a platform-branded error page.

The resolved `tenant_id` is injected as a JWT claim and as a request-context variable that propagates through the service mesh to every database query.

### Data Isolation

All multi-tenant tables in PostgreSQL carry a `tenant_id` column. Row-Level Security (RLS) policies are defined at the database layer so that a session variable `app.current_tenant` constrains every SELECT, INSERT, UPDATE, and DELETE to the owning tenant's rows. Application services set this variable on connection checkout. This provides a defence-in-depth isolation guarantee independent of application logic. See "Data Architecture and Database Design" (section 15) for the full schema and RLS policy specifications.

### White-Label Branding

Tenant branding tokens (primary/secondary colours, logo URL, font overrides, favicon) are stored in the Tenant Service and served as a small JSON blob on tenant resolution. The Next.js app shell injects these tokens as CSS custom properties at the document root, and the Tailwind/shadcn design system reads them at render time. This enables per-school visual identity without per-tenant code builds.

### Approval Workflow Routing

- Students signing up on `robocode.africa` are placed in a pending queue visible to Super Admin and Platform Moderators.
- Students signing up on a school subdomain or custom domain are auto-assigned `tenant_id` and placed in the school's pending queue, visible to the School Admin.
- No student account is activated until explicitly approved. Minors additionally require verifiable parental/guardian consent before approval can proceed (see "Functional Requirements: Identity, Authentication and Authorization", section 5).

---

## Real-Time Architecture

### WebSocket Gateway

The WebSocket gateway runs as a horizontally-scalable Socket.IO cluster. Clients establish a persistent WSS connection on authentication. The gateway authenticates the connection using the JWT access token (passed as a handshake query parameter or HTTP upgrade header). Once authenticated, the connection is joined to tenant-scoped, class-scoped, or project-scoped Socket.IO rooms, enforcing that a student can only receive events from their own tenant.

Redis Pub/Sub (via `socket.io-redis` adapter) synchronises events across gateway pod replicas, ensuring that a message emitted by one service instance reaches clients connected to any gateway pod.

### Collaborative Editing (Yjs CRDT)

Project documents (component canvas state, code files, project metadata) are represented as Yjs shared documents. When a student or teacher opens a project, the Studio client connects to the WebSocket gateway and joins the project's Yjs document room. The gateway hosts a `y-websocket` relay that:

1. Persists the latest document state to PostgreSQL (via the Content/LMS Service) on each update.
2. Distributes incremental Yjs update messages to all connected peers in the room.
3. Sends the full document state to newly joining peers.

Yjs's CRDT merge guarantees that concurrent edits (e.g., two students wiring components simultaneously) are reconciled without conflicts and without requiring a lock or turn-taking protocol.

### Simulation Telemetry Streaming

When a student shares a live simulation session (e.g., a teacher observing a running project), the Studio client emits timestamped pin-state snapshots to the WebSocket gateway. The gateway fans these out to observer connections in the same project room. Telemetry frames are rate-limited client-side (configurable, default 30 fps) to cap bandwidth usage. Observers render the simulation state locally using the same RSE component models, so no server-side simulation computation is required.

### Notification Push

The Notification Service emits events to Redis Streams. A notification consumer process converts these to Socket.IO room-targeted pushes through the WebSocket gateway. This decouples notification generation (which may be triggered by any domain service) from delivery.

---

## Architectural Decisions

The following table records significant architectural decisions (ADs), their rationale, and the alternatives considered.

| AD | Decision | Rationale | Alternatives Considered |
|---|---|---|---|
| AD-01 | Run the RSE entirely in the browser (Web Worker) | Eliminates server-side simulation compute cost; enables offline usage after initial load; simulation latency is bounded by the local device, not network RTT. | Server-side simulation: rejected due to cost at scale, high latency, and inability to work offline. |
| AD-02 | Use avr8js, rp2040js, and the wokwi open-source ecosystem (wokwi-elements, wokwi-boards) | Reuses battle-tested, cycle-accurate MCU simulators (avr8js for ATmega328P, rp2040js for RP2040) and a rich, data-driven board/component library, reducing time-to-market and ensuring correctness. The wokwi-boards manifest format enables new boards to be added without code changes. | Build a proprietary simulator: rejected due to engineering cost and accuracy risk. Use a cloud FPGA: rejected due to cost and latency. |
| AD-03 | PostgreSQL with Row-Level Security for multi-tenancy | Single-cluster multi-tenancy with RLS provides strong data isolation at the database layer as a defence-in-depth backstop beyond application-layer checks. | Separate database per tenant: rejected due to operational overhead at scale. Schema-per-tenant: rejected due to migration complexity. |
| AD-04 | NestJS microservices behind a unified API gateway | Clear service boundaries align with team ownership; the gateway provides a single auth/routing point; services can be scaled, deployed, and updated independently. | Monolith: rejected due to scaling inflexibility and risk of cross-domain coupling. Pure serverless: rejected due to cold-start latency for WebSocket-heavy workloads. |
| AD-05 | Yjs CRDT for collaborative project editing | CRDT-based merge is conflict-free, works under network partitions, and does not require a central locking authority, making it resilient to intermittent connectivity. | Operational Transform (OT): rejected as more complex to implement correctly. Server-authoritative locking: rejected as it blocks collaboration under latency. |
| AD-06 | Next.js App Router for the shell; pure SPA for Studio | Marketing and auth pages benefit from SSR/SSG for SEO and initial load speed. RoboCode Studio is a highly interactive application where client-side routing and state are preferable. | Full SPA: rejected because public marketing pages need SEO. Full SSR: rejected because simulation state cannot be serialised server-side. |
| AD-07 | CDN/edge (Cloudflare/CloudFront) with African PoPs | Serving wokwi-elements bundles, WASM toolchain, and 3D assets from edge nodes close to African learners dramatically reduces initial load time on high-latency international links. | Direct origin serving: rejected due to unacceptable latency from non-African cloud regions. |
| AD-08 | Redis for leaderboards, caching, and queues | Redis Sorted Sets provide O(log N) leaderboard operations. Redis Pub/Sub underpins the Socket.IO cluster adapter. Redis Streams provide durable async event queues. A single Redis cluster serves multiple roles, reducing operational surface area. | Separate message broker (Kafka): deferred to future scale; Redis Streams sufficient for initial load. In-memory leaderboard in the application: rejected as it does not survive pod restarts. |
| AD-09 | Compile microservice as optional fallback | Keeps the primary path fully client-side, but provides a server-side safety net for low-end devices that cannot run the in-browser WASM toolchain. Results are cached by source hash, making repeated compilations fast. | Always compile server-side: rejected as it creates a backend bottleneck and removes offline capability. No fallback: rejected as it excludes low-end devices. |
| AD-10 | Safety-first approval gate before any account activation | Mandatory pre-activation approval for all students (direct by Super Admin/Platform Moderator, school-routed by School Admin) is a non-negotiable child-safety control. No "open registration" path exists for students. | Self-service activation: rejected as it violates COPPA, GDPR-K, and the platform's safety-first prime directive. |

---

## Non-Functional Requirements: Architecture-Level

The following NFRs are architectural in nature. Full NFR tables, including performance, availability, and security, are in "Non-Functional Requirements" (section 17) and "Security, Privacy and Child Safety" (section 18).

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| NFR-ARCH-001 | All domain services must be independently deployable without coordinated downtime. | Must | CI/CD pipeline validates independent deployment for each service. |
| NFR-ARCH-002 | The RSE must produce zero backend simulation traffic during a running session (all simulation is client-side). | Must | Network trace during a simulation session shows no server calls attributable to RSE execution. |
| NFR-ARCH-003 | The Studio SPA (excluding 3D assets) must be usable after initial load with no active internet connection for at least 30 minutes of simulation. | Should | Service Worker cache hit rate for core assets >= 99% after first visit. |
| NFR-ARCH-004 | The API gateway must enforce tenant isolation on every request before routing to domain services. | Must | Penetration test: cross-tenant data access attempts return 403 with no data leakage. |
| NFR-ARCH-005 | The system must support horizontal scaling of all stateless services via Kubernetes HPA without architectural changes. | Must | Load test at 2x projected peak concurrent users passes without degraded response times. |
| NFR-ARCH-006 | All real-time collaborative sessions must remain consistent under 10-second network partitions without data loss. | Should | Yjs CRDT reconciliation test: simulate 10-second disconnect, re-join, verify document convergence. |
| NFR-ARCH-007 | Tenant data isolation must be enforced at the database layer (RLS) independently of application logic. | Must | Unit tests bypass application layer and query Postgres directly; confirm RLS blocks cross-tenant rows. |
| NFR-ARCH-008 | The system must be deployable in an African cloud region (e.g., AWS af-south-1) as the primary region. | Must | Deployment playbook targets af-south-1 or equivalent; confirmed in infrastructure IaC. |

---

## Cross-References

- Tenant routing and isolation details: "Functional Requirements: Multi-Tenancy, Custom Domains and White-Labelling" (section 6), `FR-TEN-*`.
- Identity, JWT, and SSO specifics: "Functional Requirements: Identity, Authentication and Authorization" (section 5), `FR-AUTH-*`.
- RSE component and simulation requirements: "Functional Requirements: RoboCode Simulation Engine (RSE)" (section 8), `FR-SIM-*`.
- Code execution paths (compiled vs. interpreted): "Functional Requirements: Code Authoring, Validation and Execution" (section 9), `FR-CODE-*`.
- Data schema and RLS policy: "Data Architecture and Database Design" (section 15), `DR-*`.
- Infrastructure, Kubernetes, and IaC specifics: "Infrastructure, Deployment and DevOps" (section 19).
- Full NFR catalogue: "Non-Functional Requirements" (section 17), `NFR-*`.
- Security controls and child-safety requirements: "Security, Privacy and Child Safety" (section 18), `SR-*`.
