# Observability, Logging, Monitoring and Support

## Overview

This section specifies the requirements governing observability, operational logging, metrics collection, distributed tracing, alerting, synthetic monitoring, error tracking, analytics data pipelines, audit logging for security and safeguarding, and support tooling for the RoboCode.Africa platform.

Observability is not an afterthought. The platform serves minors in low-connectivity African environments under strict child-safety obligations (COPPA, GDPR-K, POPIA, Zimbabwe Cyber and Data Protection Act, NDPR, Kenya Data Protection Act). The observability stack must therefore simultaneously support: rapid incident detection and response; forensic audit trails for safeguarding events; compliance evidence for data-protection regulators; learning-analytics infrastructure for Teachers and School Admins; and simulation performance telemetry specific to the RoboCode Simulation Engine (RSE). Requirements in this section reference the Technology Stack (Section 4), Security, Privacy and Child Safety (Section 18), and Infrastructure, Deployment and DevOps (Section 19) sections and use the requirement-ID scheme defined in the Introduction.

---

## Logging Standards

### Structured Log Format

All log output produced by any platform component — API gateway, domain microservices, WebSocket gateway, compile microservice, background workers, and infrastructure controllers — shall conform to a single structured JSON schema. Human-readable plain-text logs are prohibited in production.

```
STRUCTURED LOG SCHEMA (JSON, one object per line / NDJSON)
──────────────────────────────────────────────────────────────────────
Field              Type        Required   Description
──────────────────────────────────────────────────────────────────────
timestamp          ISO-8601    yes        UTC; millisecond precision.
level              string      yes        trace|debug|info|warn|error
                                          |fatal
service            string      yes        Logical service name, e.g.
                                          "auth-service", "rse-worker"
version            string      yes        Semver of the deployed artifact
environment        string      yes        production|staging|preview
correlation_id     UUID        yes        See Distributed Tracing section
span_id            string      yes        OpenTelemetry span ID
trace_id           string      yes        OpenTelemetry trace ID
tenant_id          UUID        cond.      Present for all tenant-scoped
                                          operations; omitted for
                                          platform-wide events
user_id            UUID        cond.      Pseudonymous internal UUID;
                                          never email or name in plain log
role               string      cond.      RBAC role of the acting user
request_id         UUID        cond.      HTTP/WS request identifier
method             string      cond.      HTTP method
path               string      cond.      URL path; query strings stripped
status_code        integer     cond.      HTTP status
duration_ms        float       cond.      Request or operation duration
message            string      yes        Human-readable summary;
                                          PII-redacted (see NFR-LOG-005)
error_code         string      cond.      Platform error code
stack_trace        string      cond.      Only at error/fatal; truncated
                                          to 4 KB
metadata           object      no         Arbitrary structured context;
                                          PII-scrubbed before write
──────────────────────────────────────────────────────────────────────
```

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| NFR-LOG-001 | All services **shall** emit logs in NDJSON (newline-delimited JSON) to stdout/stderr only; no file sinks in application code. | Must | Log collectors (Fluentd/Fluent Bit) capture stdout from container runtimes. |
| NFR-LOG-002 | Every log line **shall** include `timestamp`, `level`, `service`, `version`, `environment`, `correlation_id`, `trace_id`, `span_id`, and `message`. All other fields are conditional as described above. | Must | Log pipeline validation rejects non-conforming lines. |
| NFR-LOG-003 | Log levels **shall** be configurable at runtime per service without redeployment, using an environment variable or a live-reload endpoint available only to Super Admin operators. | Should | Enables temporary `debug` uplift during incident investigation. |
| NFR-LOG-004 | The compile microservice and RSE telemetry exporter **shall** emit simulation-specific log fields: `board_type` (uno\|esp32\|pico; custom board definitions from the wokwi-boards library use their declared board identifier), `sketch_size_bytes`, `compile_duration_ms`, `sim_tick_rate_hz`, `sim_wall_clock_ms`. | Must | Required for simulation SLO dashboards. The `pico` value covers Raspberry Pi Pico (RP2040, simulated with rp2040js). |
| NFR-LOG-005 | Log pipelines **shall** apply a PII scrubbing filter before any log is written to a persistent store. The filter **shall** redact or hash: email addresses, full names, phone numbers, IP addresses (IPv4 last octet zeroed; IPv6 to /48), date-of-birth values, and any field matching a configurable PII pattern list. | Must | Verified by automated test that injects synthetic PII and asserts scrubbing. |
| NFR-LOG-006 | Logs relating to minor users **shall** additionally suppress the `user_id` field in any log level below `warn` in externally-accessible log views. Pseudonymous `user_id` UUIDs may appear only in security and safeguarding audit logs (see Audit Log section) accessible exclusively to Super Admin and Platform Moderator. | Must | Child-safety prime directive. |
| NFR-LOG-007 | Log retention **shall** be: 30 days in hot storage (OpenSearch / Elasticsearch for full-text search), 1 year in warm/cold compressed object storage (S3-compatible), and 7 years for security and safeguarding audit logs in immutable WORM storage. | Must | Regulatory retention — GDPR, POPIA, Zimbabwe Cyber and Data Protection Act. |
| NFR-LOG-008 | The log pipeline **shall** guarantee at-least-once delivery with back-pressure handling. Log loss under sustained load **shall** not exceed 0.01 % of emitted lines. | Must | Measured via pipeline counter metrics. |

### Correlation IDs

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| NFR-LOG-010 | The API gateway **shall** generate a UUID v4 `X-Correlation-ID` header on every inbound HTTP request and WebSocket connection that does not already carry one. Subsequent service-to-service calls **shall** propagate this header unchanged. | Must | Enables full cross-service trace reconstruction from a single ID. |
| NFR-LOG-011 | The `X-Correlation-ID` value **shall** be returned to the client in the HTTP response header for all requests, to allow support staff and automated agents to reference a specific user-reported incident. | Should | Clients display the correlation ID on error screens for user reporting. |
| NFR-LOG-012 | All asynchronous tasks dispatched to Redis Streams workers **shall** carry the originating `correlation_id` in the message payload, which workers **shall** include in all logs emitted during task processing. | Must | Enables async-path tracing for compilation and report-generation jobs. |

---

## Distributed Tracing

RoboCode.Africa implements distributed tracing using the OpenTelemetry (OTel) specification across all backend services and — where WebSocket communication is involved — the client-side RoboCode Studio.

```
DISTRIBUTED TRACING FLOW (simplified)
─────────────────────────────────────────────────────────────────────
 Browser (RoboCode Studio)
 ┌────────────────────────────────────────────────────────────────┐
 │  OTel browser SDK                                              │
 │  • Automatic HTTP instrumentation (fetch)                      │
 │  • Manual span: "compile-and-run"                              │
 │  • Manual span: "sim-frame-render"                             │
 │  Exports via OTLP/HTTP to Collector at /otel                   │
 └───────────────────────────┬────────────────────────────────────┘
                             │ W3C Trace Context headers
                             ▼
 API Gateway (NestJS)
 ┌────────────────────────────────────────────────────────────────┐
 │  OTel NestJS auto-instrumentation                              │
 │  Propagates context to downstream services via gRPC/HTTP       │
 └────────┬──────────────┬──────────────┬──────────────┬──────────┘
          │              │              │              │
   Auth   │       Code   │      LMS     │     Mod      │
   Svc    │       Exec   │      Svc     │     Svc      │
          │       Svc    │              │              │
          ▼              ▼              ▼              ▼
 ┌─────────────────────────────────────────────────────────────┐
 │  OTel Collector (DaemonSet, one per node)                   │
 │  Receives OTLP/gRPC from services; OTLP/HTTP from browser   │
 │  Processors: batch, resource detection, attribute transform  │
 │  Exporters: Jaeger (traces) │ Prometheus (metrics)          │
 └─────────────────────────────────────────────────────────────┘
```

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| NFR-TRC-001 | Every backend service **shall** instrument all inbound and outbound HTTP, gRPC, and database calls using the OpenTelemetry SDK for Node.js with auto-instrumentation packages (`@opentelemetry/auto-instrumentations-node`). | Must | Manual instrumentation for business-critical operations in addition. |
| NFR-TRC-002 | The RoboCode Studio client **shall** instrument the following operations as manual OTel spans using the OTel browser SDK: sketch compilation request, simulation start/stop, canvas component drag-and-drop, and WebSocket reconnection. | Must | Helps identify client-side latency hotspots under low-bandwidth conditions. |
| NFR-TRC-003 | Trace context **shall** be propagated using W3C Trace Context headers (`traceparent`, `tracestate`) across all synchronous HTTP and gRPC calls, and embedded in async Redis Stream message envelopes for background jobs. | Must | Interoperable with any OTel-compatible backend. |
| NFR-TRC-004 | The OTel Collector **shall** be deployed as a Kubernetes DaemonSet so that each node runs a local collector agent, minimising network hops from application pods. | Should | See Infrastructure section (Section 19). |
| NFR-TRC-005 | Trace sampling **shall** be head-based at 10 % for routine traffic and 100 % for requests that result in a 5xx error, a `security_event`, or a safeguarding flag. | Must | Ensures all error and safeguarding traces are captured in full. |
| NFR-TRC-006 | Traces **shall** be stored in Jaeger (or a compatible backend such as Tempo) with a retention period of 14 days for routine traces and 90 days for traces linked to a safeguarding or security event. | Must | Cross-reference Security section (Section 18) SR-AUD requirements. |
| NFR-TRC-007 | Every service **shall** emit span attributes for `tenant_id`, `user_role`, and `board_type` where applicable, enabling per-tenant and per-board performance analysis. Valid `board_type` values include `uno` (Arduino UNO, avr8js), `esp32` (ESP32 DevKit), `pico` (Raspberry Pi Pico / RP2040, rp2040js), and any custom board identifier registered via the wokwi-boards library. | Should | Enables per-school and per-board SLO monitoring across all three first-class boards and custom board definitions. |

---

## Metrics Collection

### RED and USE Metrics

The platform follows the RED method (Rate, Errors, Duration) for request-driven services and the USE method (Utilisation, Saturation, Errors) for resource-level components.

```
METRICS TAXONOMY
─────────────────────────────────────────────────────────────
Category    Metric Name (Prometheus)         Labels
─────────────────────────────────────────────────────────────
RED         http_requests_total              service, method,
                                             status, tenant_id
RED         http_request_errors_total        service, method,
                                             status, tenant_id
RED         http_request_duration_seconds    service, method,
            (histogram)                      status, tenant_id
USE         cpu_utilisation_ratio            node, pod
USE         memory_utilisation_ratio         node, pod
USE         db_connection_pool_saturation    service
USE         redis_queue_depth                queue_name
SIM         sim_compile_duration_seconds     board_type
            (histogram)
SIM         sim_tick_rate_hz (gauge)         board_type, session_id
SIM         sim_active_sessions (gauge)      board_type, tenant_id
SIM         sim_component_count (histogram)  board_type
LMS         lms_task_submissions_total       tenant_id, task_type
LMS         lms_lesson_completions_total     tenant_id, grade_level
LMS         lms_active_learners (gauge)      tenant_id
GAM         robopoints_awarded_total         tenant_id, reason
COMM        moderation_flags_total           flag_type, severity
COMM        safeguarding_escalations_total   (no tenant label —
                                             platform-level only)
─────────────────────────────────────────────────────────────
```

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| NFR-MET-001 | Every NestJS microservice **shall** expose a `/metrics` Prometheus scrape endpoint protected by a network policy that restricts access to the in-cluster monitoring stack. | Must | No external exposure of metrics endpoint. |
| NFR-MET-002 | The platform **shall** collect all metrics listed in the metrics taxonomy table above as a minimum set. Additional service-specific metrics may be added without restriction. | Must | Prometheus scrape interval: 15 s. |
| NFR-MET-003 | Simulation-specific metrics (`sim_*`) **shall** be emitted from the compile microservice and from the WebSocket gateway that relays RSE telemetry from browser sessions. The RSE running client-side **shall** report aggregate performance data via a dedicated telemetry endpoint on a best-effort basis (not on the critical path). | Must | Client telemetry is non-blocking; dropped if network unavailable. |
| NFR-MET-004 | Metrics **shall** not include cardinality-explosion labels. In particular, `session_id`, `user_id`, and raw URL paths **shall not** be used as label values. Aggregation must happen before export. | Must | High cardinality breaks Prometheus performance. |
| NFR-MET-005 | Learning-analytics infrastructure metrics (`lms_*`) **shall** be emitted by the Learning Management Service and consumed by the analytics pipeline (see Analytics Pipeline section) as well as the Grafana dashboards. | Must | Enables school-level learning insights for Teachers and School Admins. |
| NFR-MET-006 | A Prometheus Alertmanager instance **shall** be deployed and configured as the sole routing layer for metric-based alerts. PagerDuty, Slack, and email are valid notification channels. | Must | See Alerting section. |

---

## Dashboards, SLOs and Alerting

### Service Level Objectives

| SLO Name | Target | Measurement Window | Error Budget |
|----------|--------|--------------------|--------------|
| Platform Availability (authenticated) | 99.9 % uptime | Rolling 30 days | 43.8 min/month |
| Marketing Site Availability | 99.5 % uptime | Rolling 30 days | 3.6 h/month |
| API P99 Latency | < 500 ms | Rolling 7 days | 1 % of requests |
| Sketch Compile Latency (in-browser WASM) | P90 < 8 s | Rolling 7 days | 10 % of compiles |
| Sketch Compile Latency (compile microservice) | P90 < 6 s | Rolling 7 days | 10 % of compiles |
| Simulation Tick Rate | > 95 % of sessions sustaining ≥ 100 Hz | Rolling 7 days | 5 % of sessions |
| Auth Service Availability | 99.9 % | Rolling 30 days | 43 min/month |
| Safeguarding Escalation Notification | Delivered within 60 s of flag | Rolling 30 days | 99 % |

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| NFR-SLO-001 | Each SLO listed above **shall** be implemented as a Prometheus recording rule computing a burn-rate metric. An error-budget alert **shall** fire when the burn rate exceeds 2× the budget over 1 h or 5× over 5 min. | Must | Multi-window, multi-burn-rate alerting per Google SRE workbook. |
| NFR-SLO-002 | SLO attainment reports **shall** be automatically generated and emailed to the Super Admin and relevant School Admins on a weekly and monthly cadence. | Should | Automated via an alerting pipeline or a scheduled report job. |
| NFR-SLO-003 | Error budgets **shall** be visible on the primary operations Grafana dashboard with burn-rate graphs and a remaining-budget gauge per SLO. | Must | Dashboard provisioned as a Grafana ConfigMap; version-controlled in the IaC repository. |

### Dashboards

| Dashboard Name | Audience | Key Panels |
|----------------|----------|------------|
| Platform Health | Super Admin, on-call engineer | SLO burn rates, API gateway throughput, error rate, pod status |
| Simulation Performance | Engineering | Compile durations by board type (Arduino UNO / avr8js, ESP32, Raspberry Pi Pico / rp2040js, custom wokwi-boards), sim tick rate distribution, active sessions heatmap |
| Tenant Health | School Admin (tenant-scoped) | Active learners, task submissions, RoboPoints awarded, moderation flags |
| Learning Analytics | Teacher, School Admin | Lesson completion funnel, task pass/fail rates, grade distribution |
| Security and Audit | Super Admin, Platform Moderator | Authentication failures, safeguarding escalations, PII access events |
| Infrastructure | Platform engineering | Kubernetes node utilisation, pod restart rates, network egress, storage capacity |

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| NFR-DASH-001 | All Grafana dashboards **shall** be defined as JSON provisioning files stored in the IaC repository and applied automatically during deployment. Manual dashboard edits in the UI are non-authoritative. | Must | GitOps discipline; prevents configuration drift. |
| NFR-DASH-002 | Tenant Health and Learning Analytics dashboards **shall** be scoped to the authenticated tenant's `tenant_id` using Grafana data source variable injection. A School Admin **shall** see only their school's data. | Must | Enforced at dashboard query level, not merely UI filtering. |
| NFR-DASH-003 | The Security and Audit dashboard **shall** be accessible only to Super Admin and Platform Moderator roles. Access control **shall** be enforced at the Grafana organisation/team level. | Must | Cross-reference FR-ADM and SR requirements. |

### Alerting

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| NFR-ALT-001 | All metric-based alerts **shall** be defined as Prometheus alerting rules in version-controlled YAML files and applied via the IaC pipeline. | Must | Prevents undocumented alert creation. |
| NFR-ALT-002 | Alerts **shall** be classified into three severity tiers: `critical` (page on-call engineer immediately, 24/7), `warning` (notify Slack channel during business hours), and `info` (logged only). | Must | Severity mapping documented in runbooks. |
| NFR-ALT-003 | A `critical` alert for any safeguarding-related metric (e.g., `safeguarding_escalations_total` spike, moderation service downtime) **shall** notify both the on-call engineer and the designated Safeguarding Lead by separate channels (PagerDuty + email). | Must | Child-safety prime directive — safeguarding alerts bypass standard paging rules. |
| NFR-ALT-004 | Alert fatigue **shall** be managed through inhibition rules (a `critical` suppresses child `warning` for the same component) and alert grouping by service and tenant. | Should | Reviewed quarterly by the platform operations team. |
| NFR-ALT-005 | All `critical` alerts **shall** link to a runbook URL in the alert annotation. Runbooks **shall** be maintained in the platform operations repository. | Must | See Support Tooling section. |

---

## Uptime and Synthetic Monitoring

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| NFR-SYN-001 | Synthetic probes **shall** be deployed to test the following flows at regular intervals from at least two geographic probe locations (one within Africa, e.g. `af-south-1`, and one in Europe or the US): public marketing site load, login flow, RoboCode Studio initial load, sketch compile round-trip, and simulation start. | Must | Probe interval: 1 min per flow. |
| NFR-SYN-002 | Synthetic probe failures exceeding 2 consecutive checks **shall** trigger a `critical` alert. | Must | Threshold prevents single transient failure from paging. |
| NFR-SYN-003 | Uptime check results **shall** be published to a public status page (e.g., Statuspage.io or a self-hosted equivalent) visible without authentication, displaying current status and 90-day uptime history per component. | Must | Transparency for schools and parents. |
| NFR-SYN-004 | Synthetic probes **shall** measure and record Time to First Byte (TTFB), Time to Interactive (TTI), and the custom metric `studio_ready_ms` (time from navigation to RoboCode Studio being fully interactive with a component loaded). | Should | Low-bandwidth performance visibility. |
| NFR-SYN-005 | A low-bandwidth synthetic probe **shall** simulate a 3G connection (≤ 1 Mbps throughput, 150 ms RTT) and alert if `studio_ready_ms` exceeds 15 s on a cold cache. | Should | Critical for African connectivity baseline. |

---

## Security and Safeguarding Audit Logs

The security and safeguarding audit log is a separate, immutable record distinct from operational logs. It records all security-sensitive and child-safety-critical events with full fidelity. PII scrubbing rules that apply to operational logs do NOT apply to the audit log; however, audit log access is itself strictly controlled and access-logged.

### Audit Event Categories

```
AUDIT EVENT TAXONOMY
──────────────────────────────────────────────────────────────────────
Category            Examples
──────────────────────────────────────────────────────────────────────
Authentication      Login success/failure, password reset, MFA
                    enrol/verify/bypass, session creation/expiry,
                    SSO assertion received, account lockout
Authorisation       Permission denied events, RBAC role change,
                    privilege escalation attempt
Account Lifecycle   Registration, email verification, consent grant/
                    decline/revoke, approval granted/rejected,
                    suspension, deactivation, deletion request
Parental Consent    Consent email sent/opened/responded, re-consent
                    triggered, consent record accessed
Safeguarding        Content moderation flag created/escalated/
                    resolved, abuse report submitted, profanity/PII
                    filter trigger, safeguarding escalation to Lead,
                    minor account accessed by admin
Data Access         PII field read by admin, export of student data,
                    GDPR/POPIA subject access request processed,
                    data deletion completed
Admin Operations    Tenant created/modified/suspended, global config
                    changed, billing plan changed, user impersonation,
                    bulk data operations
System              API key creation/revocation, TLS cert renewal,
                    Kubernetes cluster config change, secrets rotation
──────────────────────────────────────────────────────────────────────
```

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| NFR-AUD-001 | Every event in the audit taxonomy above **shall** be written to the audit log synchronously within the same transaction or request as the event itself. Audit log write failure **shall** cause the originating operation to fail (fail-closed). | Must | Audit integrity guarantee. |
| NFR-AUD-002 | Each audit record **shall** include: `event_id` (UUID v4), `event_type` (taxonomy code), `timestamp` (UTC, ms precision), `actor_user_id`, `actor_role`, `actor_ip_address`, `target_entity_type`, `target_entity_id`, `tenant_id`, `outcome` (success\|failure), `metadata` (event-specific structured data), and `correlation_id`. | Must | Provides complete forensic context. |
| NFR-AUD-003 | Audit log records **shall** be stored in WORM (Write Once, Read Many) object storage with a 7-year retention period. Records **shall** be cryptographically signed (HMAC-SHA256 chained hash) to detect tampering. | Must | Regulatory requirement — GDPR, POPIA, Zimbabwe Cyber Act. |
| NFR-AUD-004 | Read access to the audit log **shall** be restricted to Super Admin and Platform Moderator roles. Every read operation against the audit log **shall** itself generate an audit record. | Must | Access to audit log is audited to prevent insider suppression. |
| NFR-AUD-005 | A safeguarding event that is escalated (e.g., potential grooming, CSAM detection, bullying with threat of harm) **shall** additionally trigger an immediate notification to the designated Safeguarding Lead and, where applicable, the School Admin. The notification **shall** include a reference ID that maps to the full audit record. | Must | Child-safety prime directive. |
| NFR-AUD-006 | Audit logs for a specific tenant **shall** be exportable in JSON and CSV format by a Super Admin for regulatory inspection or law-enforcement cooperation. Exported files **shall** be encrypted (AES-256) and delivered via a time-limited signed URL. | Must | Evidence preservation chain-of-custody. |
| NFR-AUD-007 | The audit logging subsystem **shall** be isolated from operational logging infrastructure. It **shall** use a separate storage backend, separate credentials, and separate access controls. | Must | Operational log compromise must not affect audit log integrity. |

---

## Error Tracking

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| NFR-ERR-001 | Sentry **shall** be deployed as the primary error tracking platform, with separate Sentry projects for: the Next.js/React frontend (including RoboCode Studio), each backend NestJS service, and the compile microservice. | Must | Separate projects enable per-component alert routing and ownership. |
| NFR-ERR-002 | All unhandled exceptions and unhandled promise rejections in backend services **shall** be automatically captured by the Sentry SDK and reported with full stack trace, `correlation_id`, `service`, `version`, `environment`, and `tenant_id` (where available) as tags. | Must | PII scrubbing rules (NFR-LOG-005) apply before Sentry transmission. |
| NFR-ERR-003 | Client-side Sentry integration **shall** capture JavaScript errors in RoboCode Studio and the Next.js shell. Source maps **shall** be uploaded at build time. User context sent to Sentry **shall** use the pseudonymous `user_id` UUID only; no names or email addresses. | Must | Minor privacy — no PII to Sentry for students. |
| NFR-ERR-004 | Sentry performance monitoring **shall** be enabled for the frontend, capturing transaction traces for critical user flows: login, studio load, compile-and-run, and lesson navigation. | Should | Complements OTel traces for user-perceived performance. |
| NFR-ERR-005 | Sentry alerts **shall** be routed to the responsible service owner's Slack channel. A new error type appearing in production for the first time **shall** trigger a `warning` alert. Error volume exceeding 10× the 7-day baseline **shall** trigger a `critical` alert. | Should | Issue ownership via Sentry team assignments. |
| NFR-ERR-006 | Error tracking data **shall** be retained in Sentry for 90 days. Sentry's data residency region **shall** be configured to an EU or South Africa location to comply with data-export obligations for minor data. | Must | GDPR, POPIA cross-border transfer obligations. |

---

## Analytics Data Pipeline

The analytics pipeline supports learning-analytics reporting for Teachers and School Admins, RoboPoints and gamification insights, and platform-level usage analytics for the Super Admin. It is architecturally decoupled from operational telemetry.

```
ANALYTICS DATA PIPELINE ARCHITECTURE
─────────────────────────────────────────────────────────────────────
 Domain Services (Auth, LMS, Studio, Gamification, Moderation)
       │
       │  Domain Events (via Redis Streams / AMQP message bus)
       ▼
 Analytics Ingest Service (NestJS consumer)
 • Validates and enriches events
 • Applies per-tenant pseudonymisation (hashes minor user_id
   with a tenant-scoped HMAC key for analytics store)
 • Strips direct PII before writing to analytics store
       │
       ▼
 Analytics Store
 ┌───────────────────────────────────────────────────────────────┐
 │  PostgreSQL (events schema, partitioned by tenant + month)    │
 │  — or —                                                       │
 │  ClickHouse / OpenSearch (for large-scale aggregation)        │
 └───────────────────────────────────────────────────────────────┘
       │                        │
       ▼                        ▼
 Scheduled Aggregation    Query API (GraphQL,
 Jobs (Redis queue)       authenticated, tenant-scoped)
       │                        │
       ▼                        ▼
 Pre-aggregated Summary   Grafana Dashboards (via
 Tables / Materialised    data source plugin)
 Views                    and In-app Reports
```

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| NFR-ANL-001 | The analytics ingest service **shall** consume domain events from the platform message bus in near-real-time (< 30 s event-to-store lag under normal load). | Must | Enables near-real-time Teacher dashboards. |
| NFR-ANL-002 | Before writing any event to the analytics store, the ingest service **shall** pseudonymise all minor student identifiers using a per-tenant HMAC key stored in the platform secrets store (Kubernetes Secrets / AWS Secrets Manager). The pseudonymisation key **shall** be rotatable without historical data loss. | Must | GDPR-K, COPPA data-minimisation. Direct PII never stored in analytics store. |
| NFR-ANL-003 | The analytics store **shall** be multi-tenant with `tenant_id` as a partition key. Cross-tenant queries **shall** be impossible from the query API layer; enforced by parameterised queries and a middleware check. | Must | Tenant data isolation — see Multi-Tenancy section (FR-TEN). |
| NFR-ANL-004 | The following event types **shall** be captured in the analytics store as a minimum: `lesson_started`, `lesson_completed`, `task_submitted`, `task_graded`, `sketch_compiled`, `simulation_started`, `simulation_stopped`, `robopoints_awarded`, `team_created`, `competition_entered`, `content_flag_raised`. | Must | Powers LMS reporting requirements (FR-LRN). |
| NFR-ANL-005 | Pre-aggregated summary tables **shall** be computed by scheduled jobs at hourly, daily, and weekly intervals for: active learner counts, lesson completion rates, task pass/fail ratios, RoboPoints leaderboard snapshots, and moderation flag volumes. | Should | Reduces query load for in-app dashboard views. |
| NFR-ANL-006 | A Teacher or School Admin **shall** be able to export their school's analytics data in CSV or JSON format via the administration interface. Exports **shall** be pseudonymised (no student names or emails) and available for up to 90 days. | Should | See Administration section (FR-ADM). |
| NFR-ANL-007 | Platform-level analytics (cross-tenant aggregates) **shall** be accessible to Super Admin only and **shall** never expose individual tenant-level student data. | Must | Aggregate statistics only at platform level. |

---

## Support Tooling and Runbooks

### Runbook Standards

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| NFR-SUP-001 | A runbook **shall** exist for every `critical` and `warning` alert defined in the platform. Each runbook **shall** be a Markdown document in the platform operations repository containing: alert description, probable root causes, diagnostic steps (CLI commands, dashboard links), remediation procedures, escalation contacts, and post-incident review checklist. | Must | Alert annotation `runbook_url` links directly to the document. |
| NFR-SUP-002 | Runbooks **shall** be reviewed and updated after every P1/P2 incident as part of the post-incident review process. A stale runbook (not reviewed within 90 days) **shall** generate a `warning` ticket in the issue tracker. | Should | Prevents runbook rot. |
| NFR-SUP-003 | The following runbooks **shall** exist at platform launch as mandatory baseline: auth service outage, compile microservice overload, simulation SLO breach, RSE WebSocket storm, database connection exhaustion, safeguarding escalation handling, PII data breach response, ACME/TLS cert renewal failure, and Kubernetes node failure. | Must | Minimum operational readiness requirement. |

### Support Interface and Tooling

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| NFR-SUP-010 | A Super Admin **shall** have access to an internal support console (admin panel) that provides: user account search (by pseudonymous ID or school-scoped name), account state transitions, session invalidation, manual approval/rejection, safeguarding case management, and tenant configuration override. | Must | See Administration section (FR-ADM-ADM). |
| NFR-SUP-011 | The support console **shall** display the `correlation_id` and a link to the relevant Grafana trace for any error reported by a user, enabling rapid incident cross-reference. | Should | Support agents copy correlation IDs from user reports. |
| NFR-SUP-012 | A School Admin **shall** have access to a tenant-scoped support view showing their school's recent errors, moderation events, student approval queue, and system status, without visibility into other tenants or platform internals. | Must | Tenant isolation for support tooling. |
| NFR-SUP-013 | All support console actions **shall** be recorded in the security audit log (NFR-AUD-002) with the support agent's `user_id`, role, and the specific action taken. | Must | Audit integrity for support operations. |
| NFR-SUP-014 | The platform **shall** provide a support ticket ingestion mechanism (email-to-ticket or embedded form) accessible to Teachers and School Admins. Tickets **shall** automatically attach the submitting user's `tenant_id` and the current platform status page URL. | Should | Reduces support overhead for known incidents. |

### Incident Management

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| NFR-SUP-020 | The platform **shall** define a severity classification for incidents: P1 (complete outage or child-safety breach — 15 min response SLA), P2 (major feature unavailable — 1 h response SLA), P3 (degraded performance — 4 h response SLA), P4 (minor issue — next business day). | Must | SLA targets documented in the platform SLA agreement. |
| NFR-SUP-021 | A P1 incident involving a child-safety or data-breach event **shall** trigger the Data Breach Response runbook, notify the designated Data Protection Officer, and (where required by GDPR Art. 33, POPIA Section 22, or equivalent) initiate a 72-hour regulatory notification process. | Must | Legal obligation — failure to notify is a regulatory offence. |
| NFR-SUP-022 | Post-incident reviews (PIRs) **shall** be conducted within 5 business days of all P1 and P2 incidents. PIR documents **shall** be stored in the operations repository and linked from the relevant Sentry issue and Grafana annotation. | Should | Blameless PIR culture; continuous reliability improvement. |
| NFR-SUP-023 | Grafana **shall** support event annotations so that deployments, incidents, and configuration changes can be overlaid on metric graphs. Annotations **shall** be created automatically by the CI/CD pipeline at each production deployment. | Should | Rapid correlation of metric anomalies with deployment events. |

---

## Summary of Requirement IDs

The following table cross-references the requirement groups defined in this section to the relevant System Specification Document sections and User Requirements Document (URD) areas.

| Requirement Group | ID Range | Cross-Reference |
|-------------------|----------|-----------------|
| Logging Standards | NFR-LOG-001 to NFR-LOG-012 | Section 18 (Security, Privacy and Child Safety); Section 19 (Infrastructure) |
| Distributed Tracing | NFR-TRC-001 to NFR-TRC-007 | Section 3 (System Architecture); Section 19 (Infrastructure) |
| Metrics Collection | NFR-MET-001 to NFR-MET-006 | Section 8 (RSE); Section 14 (Administration) |
| SLOs and Alerting | NFR-SLO-001 to NFR-ALT-005 | Section 17 (Non-Functional Requirements); Section 19 (Infrastructure) |
| Synthetic Monitoring | NFR-SYN-001 to NFR-SYN-005 | Section 17 (Non-Functional Requirements); Section 19 (Infrastructure) |
| Audit Logging | NFR-AUD-001 to NFR-AUD-007 | Section 18 (Security, Privacy and Child Safety); FR-MOD; FR-AUTH |
| Error Tracking | NFR-ERR-001 to NFR-ERR-006 | Section 18; Section 19 |
| Analytics Pipeline | NFR-ANL-001 to NFR-ANL-007 | Section 11 (Learning Management); Section 14 (Administration) |
| Support Tooling | NFR-SUP-001 to NFR-SUP-023 | Section 14 (Administration); Section 18 (Security) |
