# API Specification and Integration Interfaces

## Overview

This section specifies the design, structure, and contractual obligations of all programmatic interfaces exposed by and consumed by the RoboCode.Africa platform. It covers the REST and GraphQL APIs served by the backend microservices, the real-time WebSocket event protocol, the webhook/eventing subsystem, rate limiting, versioning and error conventions, and the catalogue of external integrations (DNS/ACME, email, SMS, payment gateways, SSO identity providers, CDN/object storage, the bundled Wokwi open-source libraries, and the AI-assistant provider).

All interface requirements carry the prefix `IR-`. Functional requirements cross-referenced from other sections retain their original prefixes (`FR-AUTH`, `FR-TEN`, `FR-SIM`, `FR-CODE`, `FR-LRN`, `FR-TEAM`, `FR-GAM`, `FR-COMM`, `FR-ADM`). Security obligations are specified in the Security, Privacy and Child Safety section (`SR-nnn`).

---

## API Design Principles

### Core Principles

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| IR-001 | The API **shall** follow a resource-oriented design where REST endpoints map to stable, well-named resources and GraphQL operations mirror the same domain model. | Must | Consistent naming reduces client integration effort. |
| IR-002 | Every API response **shall** include a `requestId` (UUID v4) to support distributed tracing; the same ID **shall** be propagated to all downstream microservice calls. | Must | Correlates with OpenTelemetry trace spans; see Observability section. |
| IR-003 | The API **shall** be versioned; the current stable version is `v1`. The version **shall** be expressed as a URI path prefix (`/api/v1/`) for REST and as a `version` header for GraphQL. | Must | Breaking changes increment the major version. |
| IR-004 | The API **shall** be documented using OpenAPI 3.1 for REST endpoints and an introspectable SDL for GraphQL. Documentation **shall** be auto-generated from code annotations and published at `api.robocode.africa/docs`. | Must | Swagger UI + GraphiQL hosted in non-production environments; SDL available in all. |
| IR-005 | All API request and response bodies **shall** use UTF-8 encoded JSON (`Content-Type: application/json`). Binary payloads (firmware uploads, 3D assets) use multipart form-data or pre-signed S3 URLs. | Must | |
| IR-006 | The API **shall** enforce idempotency for mutating operations that may be retried; clients **shall** supply an `Idempotency-Key` header (UUID) for POST/PATCH operations that create or modify financial records and project saves. | Must | Server caches result by key for 24 h. |
| IR-007 | The API **shall** support cursor-based pagination (`after`, `before`, `first`, `last`) for list endpoints returning more than 20 items. Page sizes **shall** be capped at 100 items per response. | Must | Consistent with GraphQL Relay pagination. |
| IR-008 | Deprecation notices **shall** be communicated via an `X-API-Deprecated` response header, a `sunset` HTTP header, and announcements in the developer changelog with a minimum 6-month migration window. | Must | Aligns with RFC 8594. |

### API Gateway Architecture

All external API traffic is routed through the RoboCode API Gateway before reaching individual NestJS microservices.

```
Client (Browser / Mobile / Integration)
         |
         v
+----------------------------+
|  Cloudflare Edge / CDN     |  TLS termination, DDoS protection, WAF
+----------------------------+
         |
         v
+----------------------------+
|  RoboCode API Gateway      |  Routing, auth middleware, rate limiting,
|  (NestJS + Kong/Traefik)   |  tenant context injection, logging
+----------------------------+
         |   (internal service mesh)
    +----+----+----+----+----+
    |    |    |    |    |    |
  Auth  Sim  LRN  GAM COMM  ADM   (NestJS microservices)
```

---

## Authentication and Authorisation

### Token Model

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| IR-010 | The API **shall** authenticate callers using short-lived JWT access tokens (RS256, 15-minute TTL) issued by the RoboCode Auth service following a successful OAuth2/OIDC login flow. | Must | FR-AUTH-060. |
| IR-011 | Refresh tokens (opaque, 30-day TTL, rotated on each use) **shall** be stored in HttpOnly, Secure, SameSite=Strict cookies; access tokens **shall** be kept in memory, never in localStorage. | Must | FR-AUTH-062; SR-001. |
| IR-012 | Every JWT **shall** carry the following standard claims: `sub` (user UUID), `tenant_id`, `roles[]`, `scope[]`, `iat`, `exp`, and `jti` (revocation support). | Must | |
| IR-013 | Machine-to-machine service accounts (webhooks, CI/CD, integration tests) **shall** authenticate via OAuth2 Client Credentials grant; issued tokens carry a `service_account: true` claim and restricted scopes. | Must | No user impersonation via service accounts. |
| IR-014 | The API **shall** enforce scope-based authorisation. Scopes follow the pattern `<resource>:<action>` (e.g., `projects:write`, `simulation:run`, `admin:tenants:read`). | Must | Scopes embedded in JWT `scope` claim. |

### Tenant Context

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| IR-015 | The API Gateway **shall** resolve the tenant context from the request hostname (subdomain or custom domain) and inject a `X-Tenant-ID` header into all upstream microservice requests. | Must | FR-TEN-010. |
| IR-016 | Clients that call the platform API directly (e.g., CI/CD scripts) **may** supply tenant context via the `X-Tenant-ID` request header; the gateway **shall** validate that the authenticated user's `tenant_id` claim matches the supplied header. | Must | Prevents cross-tenant data access. |
| IR-017 | Super Admin calls **may** supply an `X-Impersonate-Tenant` header to operate across tenant boundaries; this action **shall** be audit-logged with the impersonating user's identity. | Must | SR-020; Administration section. |

---

## GraphQL API

### Schema Overview

The GraphQL endpoint is served at `https://api.robocode.africa/graphql` (and `https://<school>.robocode.africa/graphql` for tenant-scoped calls). The schema is organised into domain namespaces reflected as root-level query/mutation groups.

```
schema {
  query:    Query
  mutation: Mutation
  subscription: Subscription
}

# Top-level query namespaces
type Query {
  # Identity & Auth
  me: User
  user(id: ID!): User
  users(filter: UserFilter, page: PageInput): UserConnection

  # Tenant / School
  tenant(id: ID!): Tenant
  tenants(filter: TenantFilter, page: PageInput): TenantConnection

  # Projects & Studio
  project(id: ID!): Project
  projects(filter: ProjectFilter, page: PageInput): ProjectConnection

  # Learning
  course(id: ID!): Course
  courses(filter: CourseFilter, page: PageInput): CourseConnection
  task(id: ID!): Task
  submission(id: ID!): Submission

  # Teams & Gamification
  team(id: ID!): Team
  leaderboard(scope: LeaderboardScope!): LeaderboardConnection
  badge(id: ID!): Badge

  # Administration
  auditLog(filter: AuditFilter, page: PageInput): AuditLogConnection
  report(type: ReportType!, params: ReportParams): Report
}

# Top-level mutation namespaces
type Mutation {
  # Auth
  register(input: RegisterInput!): RegisterPayload
  login(input: LoginInput!): AuthPayload
  refreshToken: AuthPayload
  logout: Boolean
  requestPasswordReset(email: String!): Boolean
  resetPassword(token: String!, password: String!): Boolean
  submitParentalConsent(token: String!, guardianName: String!): Boolean

  # Tenant
  createTenant(input: CreateTenantInput!): Tenant
  updateTenant(id: ID!, input: UpdateTenantInput!): Tenant
  verifyCustomDomain(tenantId: ID!, domain: String!): DomainVerification

  # Projects
  createProject(input: CreateProjectInput!): Project
  updateProject(id: ID!, input: UpdateProjectInput!): Project
  deleteProject(id: ID!): Boolean
  forkProject(id: ID!): Project
  saveProjectSnapshot(id: ID!): ProjectSnapshot

  # Simulation
  startSimulation(projectId: ID!): SimulationSession
  stopSimulation(sessionId: ID!): Boolean
  sendSimulationEvent(sessionId: ID!, event: SimEventInput!): Boolean

  # Learning
  submitTask(taskId: ID!, input: SubmissionInput!): Submission
  gradeSubmission(id: ID!, input: GradeInput!): Submission

  # Teams
  createTeam(input: CreateTeamInput!): Team
  joinTeam(inviteCode: String!): TeamMember
  submitCompetitionEntry(competitionId: ID!, projectId: ID!): Entry

  # Gamification
  awardBadge(userId: ID!, badgeId: ID!): BadgeAward
  adjustRoboPoints(userId: ID!, delta: Int!, reason: String!): PointsTransaction

  # Admin
  approveTenant(id: ID!): Tenant
  suspendUser(id: ID!, reason: String!): User
  purgeMinorData(userId: ID!): Boolean
}

# Real-time subscriptions
type Subscription {
  projectCollaboration(projectId: ID!): CollabEvent
  simulationTelemetry(sessionId: ID!): TelemetryFrame
  notificationStream(userId: ID!): Notification
  moderationAlert: ModerationEvent        # Super Admin / Moderator only
}
```

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| IR-020 | The GraphQL endpoint **shall** enforce query depth limiting (max depth: 10) and query complexity scoring (max cost: 500 points per request) to prevent denial-of-service via deeply nested queries. | Must | |
| IR-021 | GraphQL introspection **shall** be disabled in production for unauthenticated callers; it **shall** remain enabled for authenticated staff roles and for non-production environments. | Should | Reduces attack surface. |
| IR-022 | The GraphQL schema **shall** be versioned via the `version` request header; the SDL for each published version **shall** be retained for the deprecation window defined in IR-008. | Must | |
| IR-023 | Persisted queries (APQ) **shall** be supported to reduce bandwidth on low-connectivity African networks, consistent with NFR requirements in the Low-Bandwidth Design section. | Should | |

---

## REST API — Resource List and Endpoint Table

The following REST endpoints are served under the `v1` prefix. All paths below are relative to `https://api.robocode.africa/api/v1/` unless noted.

### Authentication and Identity

| Method | Path | Purpose | Roles |
|--------|------|---------|-------|
| POST | `/auth/register` | Submit new user registration | Guest |
| POST | `/auth/verify-email` | Confirm email with signed token | Guest |
| POST | `/auth/login` | Issue access + refresh tokens | All |
| POST | `/auth/refresh` | Rotate refresh token | Authenticated |
| POST | `/auth/logout` | Invalidate refresh token | Authenticated |
| POST | `/auth/password/reset-request` | Send password-reset email | Guest |
| POST | `/auth/password/reset` | Apply new password via token | Guest |
| GET | `/auth/oauth/:provider/start` | Initiate school SSO (Google/MS) | Guest |
| GET | `/auth/oauth/:provider/callback` | OAuth2 callback handler | Guest |
| POST | `/auth/consent/submit` | Record verifiable parental consent | Guardian (via token) |
| GET | `/users/me` | Fetch own profile | Authenticated |
| PATCH | `/users/me` | Update own profile | Authenticated |
| GET | `/users/:id` | Fetch user profile | Teacher, Admin |
| PATCH | `/users/:id/roles` | Update a user's role | School Admin, Super Admin |
| DELETE | `/users/:id` | Deactivate or purge user account | School Admin, Super Admin |

### Tenants and Multi-Tenancy

| Method | Path | Purpose | Roles |
|--------|------|---------|-------|
| GET | `/tenants` | List all tenants (paginated) | Super Admin |
| POST | `/tenants` | Create a new tenant/school | Super Admin |
| GET | `/tenants/:id` | Fetch tenant details | School Admin, Super Admin |
| PATCH | `/tenants/:id` | Update tenant settings/branding | School Admin, Super Admin |
| DELETE | `/tenants/:id` | Deactivate tenant | Super Admin |
| POST | `/tenants/:id/domain/verify` | Initiate custom-domain verification | School Admin |
| GET | `/tenants/:id/domain/status` | Poll DNS/TLS provisioning status | School Admin |
| GET | `/tenants/:id/members` | List tenant members | School Admin, Teacher |
| POST | `/tenants/:id/invites` | Send invitation emails | School Admin, Teacher |
| DELETE | `/tenants/:id/invites/:token` | Revoke an invitation | School Admin |

### Projects

| Method | Path | Purpose | Roles |
|--------|------|---------|-------|
| GET | `/projects` | List accessible projects | Authenticated |
| POST | `/projects` | Create a new project | Student, Teacher |
| GET | `/projects/:id` | Fetch project (canvas, code, meta) | Project Member, Teacher |
| PATCH | `/projects/:id` | Update project metadata | Project Owner, Teacher |
| DELETE | `/projects/:id` | Delete project | Project Owner, Teacher, Admin |
| POST | `/projects/:id/fork` | Fork project to own workspace | Student, Teacher |
| GET | `/projects/:id/snapshots` | List saved snapshots | Project Member |
| POST | `/projects/:id/snapshots` | Save a named snapshot | Project Member |
| GET | `/projects/:id/snapshots/:sid` | Restore a specific snapshot | Project Owner, Teacher |

### Simulation

| Method | Path | Purpose | Roles |
|--------|------|---------|-------|
| POST | `/simulation/sessions` | Create a simulation session | Student, Teacher |
| GET | `/simulation/sessions/:id` | Fetch session state | Session Participant |
| DELETE | `/simulation/sessions/:id` | Terminate a session | Session Participant, Teacher |
| POST | `/simulation/sessions/:id/events` | Push input event (button, sensor) | Session Participant |
| GET | `/simulation/sessions/:id/log` | Retrieve serial/debug log | Session Participant, Teacher |
| GET | `/simulation/components` | List supported components/sensors | Authenticated |
| GET | `/simulation/components/:slug` | Fetch component spec and model | Authenticated |
| GET | `/simulation/boards` | List available board definitions (built-in and approved custom) | Authenticated |
| GET | `/simulation/boards/:slug` | Fetch board manifest (board.json) and SVG asset | Authenticated |
| POST | `/simulation/boards` | Upload a custom board definition (board.json + SVG); triggers validation and approval workflow | Platform Admin, Advanced User/Teacher |
| GET | `/simulation/boards/:slug/status` | Poll custom board approval/moderation status | Uploader, Platform Admin |

### Code Compilation and Execution

| Method | Path | Purpose | Roles |
|--------|------|---------|-------|
| POST | `/code/compile` | Compile Arduino/MicroPython/CircuitPython/C++ sketch for target board (Arduino UNO, ESP32, Raspberry Pi Pico) | Student, Teacher |
| GET | `/code/compile/:jobId` | Poll compilation job status | Job Owner |
| POST | `/code/lint` | Run real-time lint/diagnostics | Student, Teacher |
| GET | `/code/libraries` | List available Arduino/MicroPython/CircuitPython/Pico SDK libs | Authenticated |
| GET | `/code/templates` | List starter code templates | Authenticated |

### Learning Management

| Method | Path | Purpose | Roles |
|--------|------|---------|-------|
| GET | `/courses` | List available courses | Authenticated |
| POST | `/courses` | Create course | Teacher, Super Admin |
| GET | `/courses/:id` | Fetch course details | Authenticated |
| PATCH | `/courses/:id` | Update course | Teacher (own), Admin |
| POST | `/courses/:id/enrol` | Enrol student in course | Student, Teacher |
| GET | `/tasks` | List tasks for a course or class | Authenticated |
| POST | `/tasks` | Create task/assignment | Teacher |
| GET | `/tasks/:id` | Fetch task details | Enrolled Student, Teacher |
| POST | `/tasks/:id/submissions` | Submit completed task | Student |
| GET | `/tasks/:id/submissions` | List submissions | Teacher, Admin |
| PATCH | `/submissions/:id/grade` | Grade a submission | Teacher |

### Teams and Competitions

| Method | Path | Purpose | Roles |
|--------|------|---------|-------|
| GET | `/teams` | List teams in scope | Authenticated |
| POST | `/teams` | Create a team | Student, Teacher |
| GET | `/teams/:id` | Fetch team profile | Authenticated |
| PATCH | `/teams/:id` | Update team name/avatar | Team Leader, Teacher |
| POST | `/teams/:id/members` | Invite member by email | Team Leader |
| DELETE | `/teams/:id/members/:uid` | Remove member | Team Leader, Teacher |
| GET | `/competitions` | List active competitions | Authenticated |
| POST | `/competitions/:id/entries` | Submit competition entry | Team Leader |
| GET | `/competitions/:id/entries` | List entries | Teacher, Admin |

### Gamification

| Method | Path | Purpose | Roles |
|--------|------|---------|-------|
| GET | `/gamification/leaderboard` | Fetch RoboPoints leaderboard | Authenticated |
| GET | `/gamification/badges` | List available badges | Authenticated |
| GET | `/users/:id/badges` | List earned badges for user | Authenticated |
| GET | `/users/:id/points` | Fetch RoboPoints balance/history | Student (own), Teacher, Admin |
| POST | `/gamification/points/adjust` | Manual points adjustment | Teacher, Admin |

### Administration and Moderation

| Method | Path | Purpose | Roles |
|--------|------|---------|-------|
| GET | `/admin/audit-log` | Query audit log | Super Admin, Platform Moderator |
| GET | `/admin/reports/:type` | Generate analytics report | School Admin, Super Admin |
| GET | `/admin/moderation/queue` | Fetch content moderation queue | Platform Moderator, Super Admin |
| PATCH | `/admin/moderation/:id` | Resolve a moderation item | Platform Moderator, Super Admin |
| POST | `/admin/safeguarding/alert` | Raise a safeguarding escalation | Teacher, Moderator, Admin |
| GET | `/admin/system/health` | Platform health status | Super Admin |
| GET | `/admin/billing/subscriptions` | List tenant subscriptions | Super Admin |
| PATCH | `/admin/billing/subscriptions/:id` | Update tenant plan | Super Admin |

---

## WebSocket Protocol

RoboCode.Africa uses Socket.IO over WebSocket (with Long-Polling fallback) for three real-time channels. Connections are authenticated by passing the JWT access token in the `Authorization` header or as a query parameter during the initial handshake.

### Connection and Namespaces

```
wss://api.robocode.africa/
  /collab       - Collaborative project editing (Yjs CRDT sync)
  /simulation   - Simulation telemetry and control events
  /notify       - Notifications, moderation alerts, system messages
```

### Collaboration Events (`/collab` namespace)

| Event (direction) | Payload Fields | Description |
|-------------------|----------------|-------------|
| `join` (C→S) | `projectId`, `userId` | Join a project collaboration room |
| `leave` (C→S) | `projectId` | Leave the room |
| `yjs:update` (C↔S) | `projectId`, `update` (Uint8Array) | Yjs CRDT delta broadcast to room peers |
| `awareness:update` (C↔S) | `projectId`, `awareness` | Cursor positions, selections, user presence |
| `snapshot:saved` (S→C) | `projectId`, `snapshotId`, `ts` | Broadcast when a peer saves a snapshot |
| `component:added` (S→C) | `projectId`, `component` | New canvas component placed by peer |
| `wire:connected` (S→C) | `projectId`, `wire` | New wire connection placed by peer |
| `error` (S→C) | `code`, `message` | Connection or authorisation error |

### Simulation Telemetry Events (`/simulation` namespace)

| Event (direction) | Payload Fields | Description |
|-------------------|----------------|-------------|
| `session:start` (C→S) | `projectId`, `mode` (`accurate`/`simplified`) | Start a simulation session |
| `session:stop` (C→S) | `sessionId` | Terminate session |
| `telemetry:frame` (S→C) | `sessionId`, `ts`, `pinStates`, `serialOut` | MCU pin state snapshot at tick rate |
| `component:state` (S→C) | `sessionId`, `componentId`, `state` | Visual state change (LED on/off, LCD text) |
| `serial:output` (S→C) | `sessionId`, `line` | Serial monitor output line |
| `serial:input` (C→S) | `sessionId`, `line` | User input to serial monitor |
| `sensor:inject` (C→S) | `sessionId`, `componentId`, `value` | Inject sensor reading (slider, joystick) |
| `breakpoint:hit` (S→C) | `sessionId`, `line`, `locals` | Debugger breakpoint reached |
| `session:error` (S→C) | `sessionId`, `code`, `message` | Simulation runtime error |
| `session:ended` (S→C) | `sessionId`, `reason` | Session terminated by server |

### Notification Events (`/notify` namespace)

| Event (direction) | Payload Fields | Description |
|-------------------|----------------|-------------|
| `notification` (S→C) | `id`, `type`, `title`, `body`, `link` | In-app notification delivery |
| `moderation:alert` (S→C) | `itemId`, `severity`, `excerpt` | Moderation flag; Moderators/Admins only |
| `badge:awarded` (S→C) | `badgeId`, `name`, `roboPoints` | Real-time badge award to student |
| `approval:status` (S→C) | `userId`, `status` | Account approval/rejection broadcast |
| `system:announcement` (S→C) | `title`, `body`, `severity` | Platform-wide announcement |

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| IR-030 | All WebSocket connections **shall** be authenticated; unauthenticated connection attempts **shall** be rejected with a `4001 Unauthorised` close code. | Must | SR-030. |
| IR-031 | The simulation telemetry channel **shall** support a configurable tick rate (default 60 fps); the server **shall** automatically throttle to 10 fps for clients that report high latency (>200 ms RTT), consistent with Low-Bandwidth Design section. | Must | |
| IR-032 | Collaboration rooms **shall** be scoped to a single project; a user **shall not** be admitted to a room for a project they do not have read access to. | Must | Enforced by API Gateway middleware. |
| IR-033 | WebSocket connections **shall** automatically reconnect with exponential back-off (initial 1 s, max 30 s, jitter ±20 %) on disconnect. | Should | Implemented in the client SDK. |

---

## Webhooks and Eventing

### Outbound Webhooks

School Admins and Super Admins may configure HTTP webhook endpoints to receive platform events for integration with external school management systems.

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| IR-040 | The platform **shall** support configurable outbound webhooks for the event types listed below. Payloads **shall** be signed using HMAC-SHA256 with a per-endpoint secret and delivered via the `X-RoboCode-Signature-256` header. | Must | Follows GitHub webhook signing convention. |
| IR-041 | Webhook delivery **shall** be retried with exponential back-off on HTTP 4xx (except 410)/5xx responses; delivery **shall** be abandoned after 5 attempts and flagged in the admin dashboard. | Must | |
| IR-042 | A webhook delivery log (last 30 days) **shall** be accessible to School Admins and Super Admins, showing each delivery attempt's timestamp, HTTP status, and response latency. | Should | |

Supported webhook event types:

| Event Type | Trigger |
|------------|---------|
| `user.created` | New user account registered |
| `user.approved` | Account moves to ACTIVE state |
| `user.suspended` | Account suspended by an admin |
| `consent.received` | Parental consent recorded |
| `submission.graded` | Teacher grades a task submission |
| `badge.awarded` | Student earns a badge |
| `competition.entry.submitted` | Team submits a competition entry |
| `tenant.domain.verified` | Custom domain TLS provisioned |
| `moderation.alert.raised` | Content flagged by moderation system |

### Internal Event Bus

Microservices communicate asynchronously via an internal event bus (Redis Streams / RabbitMQ). These events are internal and not exposed externally, but they underpin the webhook delivery pipeline and audit logging.

---

## Rate Limiting

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| IR-050 | The API Gateway **shall** enforce rate limits per authenticated user and per IP address. Limits **shall** be communicated via `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset` response headers. | Must | |
| IR-051 | Unauthenticated REST endpoints (auth, consent, demo) **shall** be limited to 20 requests per minute per IP address. | Must | Prevents brute-force and scraping. |
| IR-052 | Authenticated REST endpoints **shall** be limited to 300 requests per minute per user. Bulk admin endpoints (reports, audit log) **shall** be limited to 30 requests per minute per user. | Must | |
| IR-053 | The code compilation endpoint (`POST /code/compile`) **shall** be limited to 10 concurrent jobs per user and 5 requests per minute per tenant during peak hours. | Must | Protects WASM toolchain and compile microservice. |
| IR-054 | GraphQL mutations **shall** be subject to a separate complexity-based rate limit of 1,000 complexity points per minute per authenticated user. | Must | |
| IR-055 | When a rate limit is exceeded the API **shall** respond with HTTP 429 and a `Retry-After` header indicating the seconds until the limit resets. | Must | |
| IR-056 | Super Admins **shall** be exempt from per-user rate limits but **shall** remain subject to IP-level limits as a safeguard against compromised credentials. | Should | |

---

## API Versioning and Error Format

### Versioning Policy

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| IR-060 | REST API versions are expressed in the URI (`/api/v1/`, `/api/v2/`). Breaking changes (field removal, type change, endpoint removal) **shall** only be introduced in a new major version. | Must | Additive changes (new fields, new endpoints) are non-breaking and may appear within a version. |
| IR-061 | The platform **shall** maintain simultaneous support for at least two major REST API versions during the deprecation window defined in IR-008. | Must | |
| IR-062 | GraphQL versioning **shall** follow a schema evolution strategy (additive changes only); deprecated fields **shall** be annotated with `@deprecated(reason: "...")` and removed no sooner than the next major REST API version cycle. | Should | |

### Standard Error Envelope

All REST error responses **shall** use the following JSON structure:

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Human-readable description of the error.",
    "details": [
      {
        "field": "email",
        "issue": "Must be a valid email address."
      }
    ],
    "requestId": "550e8400-e29b-41d4-a716-446655440000",
    "timestamp": "2025-08-01T10:30:00Z",
    "docUrl": "https://api.robocode.africa/docs/errors/VALIDATION_FAILED"
  }
}
```

| HTTP Status | Code Pattern | Meaning |
|-------------|--------------|---------|
| 400 | `VALIDATION_FAILED` | Request body/params failed schema validation |
| 401 | `UNAUTHENTICATED` | Missing or invalid access token |
| 403 | `FORBIDDEN` | Authenticated but insufficient role/scope |
| 404 | `NOT_FOUND` | Resource does not exist or is inaccessible |
| 409 | `CONFLICT` | Duplicate resource or state conflict |
| 422 | `UNPROCESSABLE` | Business rule violation (e.g., consent required) |
| 429 | `RATE_LIMITED` | Rate limit exceeded; see `Retry-After` |
| 500 | `INTERNAL_ERROR` | Unexpected server error; requestId for support |
| 503 | `SERVICE_UNAVAILABLE` | Downstream dependency unavailable |

---

## External Integrations

### DNS and ACME / Custom Domain Provisioning

Custom domain support for tenant schools (FR-TEN-020) depends on automated DNS verification and TLS certificate provisioning.

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| IR-070 | The platform **shall** guide School Admins through a CNAME/TXT DNS verification workflow. The expected DNS record(s) **shall** be displayed in the admin dashboard alongside real-time verification status. | Must | FR-TEN-022. |
| IR-071 | On DNS verification success the platform **shall** automatically provision a TLS certificate via the ACME protocol (Let's Encrypt), store it in the secret store, and configure the edge proxy to serve the domain. | Must | Automated renewal 30 days before expiry. |
| IR-072 | The custom domain provisioning status **shall** be accessible via `GET /tenants/:id/domain/status` and via the `tenant.domain.verified` webhook event. | Must | |
| IR-073 | If DNS verification fails the platform **shall** retry every 15 minutes for up to 72 hours before notifying the School Admin to review their DNS settings. | Should | |

### Email Provider

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| IR-074 | The platform **shall** integrate with a transactional email provider (AWS SES or SendGrid) for all system emails: verification, consent, invitations, password reset, notifications, and receipts. | Must | Abstracted via an Email Service interface for provider portability. |
| IR-075 | All outbound emails **shall** include SPF, DKIM, and DMARC records for the `robocode.africa` sending domain. | Must | Reduces spam classification; SR-050. |
| IR-076 | Email templates **shall** be stored in the CMS and support localisation per the authoritative locale matrix in the Internationalisation section (Phase 1: en-GB, fr-FR, pt-PT, ar, sw; Phase 2: sn, nd, zu, ha, yo, am), with `en-GB` as the platform default. | Should | Aligned to Accessibility, Internationalisation and Low-Bandwidth Design matrix. |
| IR-077 | Bounce and complaint events from the email provider **shall** be processed via webhook; hard-bounce addresses **shall** be automatically suppressed. | Must | |

### SMS Provider

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| IR-078 | The platform **shall** optionally integrate with an SMS gateway (e.g., Africa's Talking, Twilio) for OTP delivery and critical notifications on low-connectivity devices. | Should | Low-Bandwidth Design section; operator costs vary by country. |
| IR-079 | SMS delivery **shall** be used as a fallback where email delivery fails or where a School Admin has enabled SMS notifications for their tenant. | Could | |

### Payment Gateways

RoboCode.Africa school subscriptions and per-seat billing are processed through payment gateways suited to the African market.

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| IR-080 | The platform **shall** integrate with at least two payment gateways to support card, mobile money, and bank-transfer payment methods prevalent in Africa. Stripe, Paystack, and Flutterwave **shall** be the primary candidates. | Must | Paystack covers Nigeria/Ghana/SA; Flutterwave covers broader pan-Africa; Stripe covers international cards. |
| IR-081 | Payment gateway selection per tenant **shall** be configurable by Super Admins; a tenant's billing currency and gateway **shall** be set at tenant creation. | Must | |
| IR-082 | The platform **shall** use the gateway's client-side SDK for card-number capture to ensure cardholder data never transits RoboCode.Africa servers (PCI-DSS scope reduction). | Must | SR-060. |
| IR-083 | Payment events (subscription created, payment succeeded, payment failed, refund issued) **shall** be received via gateway webhooks, processed by the Billing microservice, and recorded in the audit log. | Must | |
| IR-084 | The platform **shall** issue downloadable PDF invoices and receipts for all successful payments. | Should | |

### School SSO Identity Providers

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| IR-085 | The platform **shall** support federated login via Google Workspace for Education and Microsoft Azure AD/Entra ID as external OIDC identity providers (IdPs). | Must | FR-AUTH-030; configuration per tenant. |
| IR-086 | A School Admin **shall** be able to configure one or more external IdPs for their tenant via the admin dashboard by supplying the OIDC discovery URL and client credentials. | Must | |
| IR-087 | On first federated login the platform **shall** provision a new user account bound to the tenant, applying the role mapping configured by the School Admin (e.g., Google group → Teacher role). | Must | If no matching role mapping, account defaults to Student pending approval. |
| IR-088 | SSO sessions **shall** be subject to the same approval and parental-consent workflow as password-based registrations; a minor cannot bypass consent via SSO. | Must | FR-AUTH-005; SR-010. |

### CDN and Object Storage

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| IR-089 | Static assets (wokwi-elements, 3D models, course images, firmware blobs) **shall** be served via a CDN (Cloudflare or CloudFront) with an Africa-region Point of Presence to minimise latency. | Must | NFR-PERF-010; Infrastructure section. |
| IR-090 | Project files, snapshots, submitted work, and uploaded assets **shall** be stored in S3-compatible object storage. Pre-signed URLs (TTL: 15 minutes) **shall** be used for all client uploads and downloads. | Must | SR-055; no direct bucket access. |
| IR-091 | The CDN **shall** be configured with appropriate `Cache-Control` headers; immutable versioned assets (JS bundles, 3D models) **shall** have a cache TTL of 365 days; user-generated content URLs **shall** carry short TTLs or require signed tokens. | Must | |

### Bundled Wokwi Open-Source Libraries

RoboCode Studio's simulation core is built on Wokwi open-source projects hosted at `github.com/wokwi`.

| Library | Purpose in RoboCode Studio |
|---------|---------------------------|
| `wokwi-elements` | Web components for 2D component rendering (LEDs, displays, sensors, boards) |
| `avr8js` | ATmega328P AVR CPU emulator; runs real compiled firmware for Arduino UNO R3 |
| `rp2040js` | RP2040 CPU emulator (`github.com/wokwi/rp2040js`); runs real UF2/ELF firmware for Raspberry Pi Pico (MicroPython, CircuitPython, C/C++) |
| `@wokwi/elements-react` | React wrappers for wokwi-elements in the Studio SPA |
| `wokwi-board-esp32-devkit-v1` | ESP32 DevKit board model and pin definitions |
| `wokwi-boards` | Data-driven board manifest schema (`github.com/wokwi/wokwi-boards`); defines board name, pin list, SVG visual, and MCU core binding for all first-class boards and custom board definitions |
| Additional component models | Behavioural models for sensors, actuators, and displays in the component catalogue |

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| IR-092 | The platform **shall** consume the Wokwi open-source libraries (`avr8js`, `rp2040js`, `wokwi-elements`, `wokwi-boards`, and related packages) under their respective open-source licences (MIT / Apache 2.0). All licence notices **shall** be preserved in the distributed build artefacts. | Must | Legal obligation. A `THIRD_PARTY_NOTICES.txt` **shall** be generated at build time listing all OSS licences. |
| IR-093 | RoboCode.Africa **shall not** claim ownership of or sublicence the Wokwi libraries beyond what their licences permit. Modifications to library code **shall** be tracked in a fork and contributed upstream where appropriate. | Must | Community stewardship obligation. |
| IR-094 | The platform **shall** pin library versions in `package.json` (`package-lock.json`/`yarn.lock`) and **shall** review dependency updates in a staging environment before promoting to production. | Must | Prevents simulation behaviour regressions. |
| IR-094a | The standard `wokwi-boards` library **shall** ship built in, providing first-class definitions for the Arduino UNO R3 (bound to `avr8js`), the ESP32 DevKit (bound to the ESP32 core), the Raspberry Pi Pico/RP2040 (bound to `rp2040js`), and other boards in the Wokwi catalogue. Each board definition's `board.json` manifest declares pin names, pin types, and x/y positions; an SVG visual asset is bundled alongside. No code change is required to add a board that follows this schema. | Must | Enables data-driven board extension without firmware-core changes. |
| IR-094b | Platform Admins and approved advanced users/teachers **shall** be able to upload custom board definitions via `POST /simulation/boards`. Uploaded definitions **shall** be validated against the `wokwi-boards` JSON schema (pin sanity, SVG/asset safety) before being accepted. Non-admin uploads **shall** pass through the standard approval/moderation workflow before becoming visible to learners. Each definition **shall** declare the MCU core target (`avr8js`, `rp2040js`, or ESP32 core) so the simulator can execute firmware correctly. | Must | Enables schools to model custom carrier boards and shields without platform changes. |

### AI-Assistant Provider

RoboCode Studio includes an integrated AI coding assistant to help students debug code and understand electronics concepts.

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| IR-095 | The AI assistant **shall** be powered by a configurable large-language model (LLM) provider (e.g., Anthropic Claude, OpenAI GPT-4o class) accessed via a server-side proxy; client code **shall never** hold API credentials directly. | Must | SR-070; credentials held in the secrets store. |
| IR-096 | All AI assistant requests involving minor users **shall** route through a content-safety layer that filters both the prompt and the LLM response for PII, inappropriate content, and off-topic material before delivery to the student. | Must | FR-COMM-060; COPPA/GDPR-K; child-safety prime directive. |
| IR-097 | AI assistant interaction logs **shall** be retained for 90 days and be accessible to teachers for the students in their classes, subject to audit by Super Admins. | Must | Oversight and safeguarding. |
| IR-098 | The AI assistant **shall** be context-aware: it **shall** receive the current project's selected board (Arduino UNO, ESP32, Raspberry Pi Pico, or custom board definition), component list, circuit wiring, and visible code as context so that hints are relevant to the student's actual circuit and target MCU. | Should | Prompt construction managed server-side. |
| IR-099 | The AI provider integration **shall** support streaming responses (Server-Sent Events or WebSocket) to improve perceived responsiveness on low-bandwidth connections. | Should | Low-Bandwidth Design section. |
| IR-100 | The platform **shall** track AI assistant token usage per tenant and per user; Super Admins **shall** be able to configure usage quotas per school plan. | Should | Cost governance; billing integration. |
| IR-101 | The selected LLM provider **shall** be onboarded as a named **sub-processor** under a signed Data Processing Agreement (DPA) and listed in the platform's public sub-processor register. The DPA **shall** contractually bind the provider to: (a) **no use of prompt or response data for model training** (zero-training); and (b) **zero or minimal data retention** (≤ 30 days, abuse-monitoring only). No minor data **shall** be sent to any provider lacking these guarantees. | Must | Mirrors FR-CODE-086. Sub-processor register published at `robocode.africa/legal/subprocessors`; reviewed by legal/DPO before enablement. |
| IR-102 | LLM inference requests **shall** be routed to a provider endpoint in an EU or African (e.g., South Africa) data region consistent with student-data residency (NFR-COMP-002); cross-border transfer **shall** be covered by Standard Contractual Clauses (SR-COMP-034). Where no compliant region/endpoint exists, the AI assistant **shall** remain disabled for affected tenants. | Must | Mirrors FR-CODE-087. Endpoint region pinned per deployment; verified in configuration review. |

---

## Interface Requirements Summary Table

| ID | Interface | Type | Depends On | Priority |
|----|-----------|------|-----------|----------|
| IR-001–IR-008 | API Design Principles | Policy | All modules | Must |
| IR-010–IR-017 | Auth / Token / Tenant Context | REST + JWT | FR-AUTH, FR-TEN | Must |
| IR-020–IR-023 | GraphQL API | GraphQL | All FR modules | Must |
| IR-030–IR-033 | WebSocket Channels | WS/Socket.IO | FR-SIM, FR-COMM, FR-TEAM | Must |
| IR-040–IR-042 | Outbound Webhooks | HTTP Push | FR-ADM, FR-COMM | Must |
| IR-050–IR-056 | Rate Limiting | Gateway Policy | NFR-SEC, NFR-PERF | Must |
| IR-060–IR-062 | Versioning and Error Format | API Contract | All clients | Must |
| IR-070–IR-073 | DNS / ACME Integration | External API | FR-TEN-020 | Must |
| IR-074–IR-077 | Email Provider (SES/SendGrid) | External API | FR-AUTH, FR-COMM | Must |
| IR-078–IR-079 | SMS Gateway | External API | NFR low-bandwidth | Should |
| IR-080–IR-084 | Payment Gateways (Stripe/Paystack/Flutterwave) | External API | FR-ADM billing | Must |
| IR-085–IR-088 | School SSO / OIDC IdPs | Federation | FR-AUTH-030 | Must |
| IR-089–IR-091 | CDN and Object Storage | External Infra | FR-SIM, FR-LRN | Must |
| IR-092–IR-094b | Wokwi OSS Libraries (`avr8js`, `rp2040js`, `wokwi-elements`, `wokwi-boards`) and custom board definitions | OSS Dependency + REST | FR-SIM, FR-CODE | Must |
| IR-095–IR-102 | AI Assistant Provider (incl. sub-processor DPA, no-training, data-region) | External API | FR-CODE, FR-COMM | Must/Should |

---

## Cross-References

- **Functional Requirements: Identity, Authentication and Authorization** — `FR-AUTH-030`, `FR-AUTH-060`, `FR-AUTH-062`; parental consent gates (FR-AUTH-005, FR-AUTH-020 to FR-AUTH-027) inform IR-088 and IR-096.
- **Functional Requirements: Multi-Tenancy, Custom Domains and White-Labelling** — `FR-TEN-010`, `FR-TEN-020`, `FR-TEN-022`; tenant context resolution (IR-015) and custom domain provisioning (IR-070 to IR-073).
- **Functional Requirements: RoboCode Simulation Engine (RSE)** — simulation session and telemetry endpoints (IR-030 to IR-033, simulation REST table).
- **Functional Requirements: Code Authoring, Validation and Execution** — compile/lint endpoints supporting Arduino/MicroPython/CircuitPython/C++ across Arduino UNO, ESP32, and Raspberry Pi Pico targets; Wokwi library integration (IR-092 to IR-094b); custom board definition upload and approval (IR-094b).
- **Functional Requirements: Communication, Notifications and Moderation** — `FR-COMM-060`; notification WebSocket events; AI content safety (IR-096).
- **Functional Requirements: Administration, Analytics and Reporting** — admin REST endpoints; webhook delivery log (IR-042); payment gateway events (IR-083).
- **Security, Privacy and Child Safety** — `SR-001`, `SR-010`, `SR-020`, `SR-030`, `SR-050`, `SR-055`, `SR-060`, `SR-070`; AI content filtering for minors (IR-096).
- **Non-Functional Requirements** — `NFR-PERF-010`; rate limits (IR-050 to IR-056); CDN latency (IR-089).
- **Infrastructure, Deployment and DevOps** — container deployment of the API Gateway; Terraform-managed DNS and TLS resources.
- **Observability, Logging, Monitoring and Support** — `requestId` propagation (IR-002); AI assistant logs (IR-097).
- **Accessibility, Internationalisation and Low-Bandwidth Design** — APQ support (IR-023); telemetry throttling (IR-031); streaming AI responses (IR-099).
