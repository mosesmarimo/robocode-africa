# Data Architecture and Database Design

## Overview

This section specifies the data architecture for RoboCode.Africa, covering the relational schema, multi-tenant isolation model, caching strategy, object storage layout, and data lifecycle governance. All design decisions are informed by the safety-first prime directive, the multi-jurisdictional child-protection legal set (COPPA, GDPR-K, POPIA, Zimbabwe Cyber and Data Protection Act, Nigeria NDPR, Kenya Data Protection Act), and the performance requirements imposed by a browser-based simulation platform serving schools across the African continent.

The persistence layer is organised into three tiers:

1. **Primary relational store** — PostgreSQL (multi-tenant, Row-Level Security), the system of record for all structured domain entities.
2. **Cache / real-time store** — Redis (sessions, queues, leaderboards, pub/sub, transient simulation state).
3. **Object store** — S3-compatible storage (project files, firmware binaries, 3D models, media assets, audit archives).

All three tiers are deployed within the same cloud-region boundary as the application layer to satisfy data-residency obligations. Africa-region (e.g., AWS `af-south-1`) placement is the default for production.

---

## Multi-Tenant Data Model

RoboCode.Africa is a multi-tenant SaaS platform. Each School is a **Tenant** with its own subdomain (`school.robocode.africa`) and optional custom domain. Tenant isolation is enforced at the database layer, not only at the application layer, using two complementary mechanisms.

### Tenant Isolation Strategy

```
+-------------------------------+
|  PostgreSQL database          |
|  (shared schema, single DB)   |
|                               |
|  Every row-bearing table      |
|  carries: tenant_id UUID      |
|                               |
|  Row-Level Security (RLS)     |
|  policies enforce:            |
|  tenant_id = current_tenant() |
|                               |
|  Superuser / migration        |
|  bypass via BYPASSRLS role    |
+-------------------------------+
```

**Approach:** Shared schema with `tenant_id` column and PostgreSQL Row-Level Security (RLS) policies. This balances operational simplicity with strong isolation guarantees.

- Every API request sets `SET LOCAL app.current_tenant = '<uuid>'` at the start of the database session.
- A stable function `current_tenant()` reads this session variable.
- RLS policies on each table filter and restrict writes by `tenant_id = current_tenant()`.
- Cross-tenant queries (Super Admin analytics) use a dedicated admin role that holds `BYPASSRLS` or explicitly sets `tenant_id = ANY(permitted_tenants)`.
- Migrations are applied by a migration-runner role that holds `BYPASSRLS` only during schema-change transactions.

### Tenant Identification at Request Time

Incoming HTTP requests carry a `tenant_id` resolved from:
1. Subdomain (`{slug}.robocode.africa`) matched against `domains.subdomain`.
2. Custom domain (`Host` header) matched against `domains.custom_domain` where `verified = true`.
3. Direct platform domain (`robocode.africa`) resolves to the platform tenant (`is_platform = true`).

The resolved `tenant_id` is embedded in the session context for the lifetime of every downstream database connection.

---

## Core Entity Catalogue

The following entities form the canonical domain model. All IDs are UUID v7 (time-ordered) unless noted.

| Entity | Table Name | Description |
|---|---|---|
| Tenant / School | `tenants` | A school or the platform itself |
| User | `users` | All human accounts |
| Role | `roles` | Named RBAC roles |
| UserRole | `user_roles` | M:M assignment of roles to users |
| ConsentRecord | `consent_records` | Parental / guardian consent artefacts |
| ApprovalRequest | `approval_requests` | Pending account-activation approvals |
| BrandingConfig | `branding_configs` | White-label colours, logos, fonts |
| Domain | `domains` | Subdomain and custom-domain records |
| Plan / Subscription | `plans`, `subscriptions` | Billing tiers and seat counts |
| Project | `projects` | A student or team studio workspace |
| Diagram | `diagrams` | Circuit/wiring canvas snapshot |
| CodeFile | `code_files` | Source files within a project |
| SimulationRun | `simulation_runs` | Recorded execution sessions |
| ComponentLibraryItem | `component_library_items` | Catalogue of simulatable components |
| BoardDefinition | `board_definitions` | Built-in and custom board manifests (wokwi-boards format) |
| Course | `courses` | Structured learning sequence |
| Lesson | `lessons` | Individual learning unit |
| Task | `tasks` | Coding/robotics challenge |
| Submission | `submissions` | Student task attempt |
| Grade | `grades` | Evaluated score for a submission |
| Team | `teams` | Student team (competition or project) |
| TeamMember | `team_members` | M:M team-user membership |
| Competition | `competitions` | Timed contest event |
| Round | `rounds` | Competition stage |
| Score | `scores` | Points recorded per round |
| RoboPointLedger | `robopoint_ledger` | Append-only points transaction log |
| Badge | `badges` | Achievement definitions |
| UserBadge | `user_badges` | Badge awards to users |
| LeaderboardEntry | `leaderboard_entries` | Materialised leaderboard rows |
| Notification | `notifications` | In-platform alert records |
| ModerationCase | `moderation_cases` | Content / safety escalation |
| AuditLog | `audit_logs` | Immutable event trail |

---

## ASCII Entity-Relationship Diagram

The diagram below shows primary relationships. Cardinality notation: `||` = one (mandatory), `|o` = one (optional), `}|` = one-or-more, `}o` = zero-or-more.

```
 tenants ----||----o{ users
    |                |
    |                |--o{ user_roles }o--|| roles
    |                |
    |                |--o{ consent_records
    |                |
    |                |--o{ approval_requests
    |
    |--o{ branding_configs
    |--o{ domains
    |--|| subscriptions ||--|| plans
    |
    |--o{ courses ||--o{ lessons ||--o{ tasks
    |                               |--o{ submissions }o--|| users
    |                                      |--o{ grades
    |
    |--o{ competitions ||--o{ rounds ||--o{ scores
    |
    |--o{ teams ||--o{ team_members }o--|| users
    |
    |--o{ component_library_items

 users ----o{ projects ||--o{ diagrams
             |         ||--o{ code_files
             |         ||--o{ simulation_runs
             |
             |--o{ robopoint_ledger
             |--o{ user_badges }o--|| badges
             |--o{ leaderboard_entries
             |--o{ notifications
             |--o{ moderation_cases (reporter)
             |--o{ audit_logs (actor)
```

---

## Key Table Schemas

### `tenants`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` | Tenant identity |
| `name` | `varchar(200)` | NOT NULL | School display name |
| `slug` | `varchar(63)` | UNIQUE, NOT NULL | Subdomain slug |
| `is_platform` | `boolean` | NOT NULL, default false | True for root tenant |
| `country_code` | `char(2)` | NOT NULL | ISO 3166-1 alpha-2 |
| `timezone` | `varchar(64)` | NOT NULL | IANA tz identifier |
| `created_at` | `timestamptz` | NOT NULL, default now() | |
| `deleted_at` | `timestamptz` | nullable | Soft-delete |

### `users`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK | |
| `tenant_id` | `uuid` | FK tenants, NOT NULL | RLS anchor |
| `email` | `varchar(320)` | UNIQUE (per tenant), nullable | Nullable for minors without email |
| `username` | `varchar(60)` | NOT NULL | Unique within tenant |
| `password_hash` | `text` | nullable | bcrypt; null for SSO-only |
| `display_name` | `varchar(120)` | NOT NULL | |
| `date_of_birth` | `date` | nullable | Age gating; minimised for minors |
| `age_band` | `varchar(10)` | NOT NULL | `primary`, `secondary`, `adult` |
| `status` | `varchar(20)` | NOT NULL | `pending`, `active`, `suspended`, `deleted` |
| `created_at` | `timestamptz` | NOT NULL | |
| `activated_at` | `timestamptz` | nullable | Set on approval |
| `deleted_at` | `timestamptz` | nullable | Soft-delete |
| `last_login_at` | `timestamptz` | nullable | |
| `mfa_enabled` | `boolean` | NOT NULL, default false | Staff/admin only |
| `totp_secret_enc` | `text` | nullable | AES-256 encrypted |

### `consent_records`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK | |
| `tenant_id` | `uuid` | FK tenants, NOT NULL | RLS anchor |
| `student_id` | `uuid` | FK users, NOT NULL | The minor |
| `guardian_name` | `varchar(200)` | NOT NULL | Data-minimised guardian name |
| `guardian_email` | `varchar(320)` | NOT NULL | Contact for consent verification |
| `guardian_relationship` | `varchar(60)` | NOT NULL | e.g., `parent`, `guardian` |
| `method` | `varchar(30)` | NOT NULL | `email_link`, `form`, `school_register` |
| `consented_at` | `timestamptz` | nullable | NULL = pending |
| `revoked_at` | `timestamptz` | nullable | |
| `ip_address` | `bytea` | nullable | SHA-256 hash for COPPA audit; raw IP never stored (SR-PRIV-015) |
| `document_ref` | `text` | nullable | S3 key to signed consent form PDF |
| `created_at` | `timestamptz` | NOT NULL | |

### `approval_requests`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK | |
| `tenant_id` | `uuid` | FK tenants, NOT NULL | |
| `user_id` | `uuid` | FK users, NOT NULL | Applicant |
| `reviewer_id` | `uuid` | FK users, nullable | Admin who actioned |
| `type` | `varchar(30)` | NOT NULL | `direct_signup`, `school_signup` |
| `status` | `varchar(20)` | NOT NULL | `pending`, `approved`, `rejected` |
| `rejection_reason` | `text` | nullable | |
| `created_at` | `timestamptz` | NOT NULL | |
| `decided_at` | `timestamptz` | nullable | |

### `projects`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK | |
| `tenant_id` | `uuid` | FK tenants, NOT NULL | RLS anchor |
| `owner_id` | `uuid` | FK users, NOT NULL | Individual or team owner |
| `team_id` | `uuid` | FK teams, nullable | Set for team projects |
| `title` | `varchar(200)` | NOT NULL | |
| `board` | `varchar(60)` | NOT NULL | `uno_r3`, `esp32`, `rp2040_pico`; custom board slug for user-defined boards |
| `visibility` | `varchar(20)` | NOT NULL, default `private` | `private`, `class`, `school`, `public` |
| `forked_from_id` | `uuid` | FK projects, nullable | Provenance chain |
| `created_at` | `timestamptz` | NOT NULL | |
| `updated_at` | `timestamptz` | NOT NULL | |
| `deleted_at` | `timestamptz` | nullable | |
| `snapshot_s3_key` | `text` | nullable | Latest persisted snapshot path |

### `diagrams`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK | |
| `tenant_id` | `uuid` | FK tenants, NOT NULL | |
| `project_id` | `uuid` | FK projects, NOT NULL | |
| `version` | `integer` | NOT NULL, default 1 | Incremented on save |
| `canvas_json` | `jsonb` | NOT NULL | Component placement + wire map |
| `thumbnail_s3_key` | `text` | nullable | PNG preview in object store |
| `created_at` | `timestamptz` | NOT NULL | |

### `code_files`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK | |
| `tenant_id` | `uuid` | FK tenants, NOT NULL | |
| `project_id` | `uuid` | FK projects, NOT NULL | |
| `filename` | `varchar(255)` | NOT NULL | e.g., `sketch.ino`, `main.py` |
| `language` | `varchar(30)` | NOT NULL | `arduino_cpp`, `micropython`, `circuitpython`, `pico_c_cpp`, `blocks` |
| `content` | `text` | NOT NULL | Source text (≤ 512 KB inline) |
| `content_s3_key` | `text` | nullable | Overflow to S3 for large files |
| `version` | `integer` | NOT NULL, default 1 | |
| `created_at` | `timestamptz` | NOT NULL | |
| `updated_at` | `timestamptz` | NOT NULL | |

### `simulation_runs`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK | |
| `tenant_id` | `uuid` | FK tenants, NOT NULL | |
| `project_id` | `uuid` | FK projects, NOT NULL | |
| `user_id` | `uuid` | FK users, NOT NULL | |
| `board` | `varchar(30)` | NOT NULL | |
| `mode` | `varchar(20)` | NOT NULL | `compiled`, `interpreted` |
| `firmware_s3_key` | `text` | nullable | Compiled firmware: `.hex` (AVR/UNO), `.bin` (ESP32), `.uf2`/`.elf` (RP2040/Pico) |
| `started_at` | `timestamptz` | NOT NULL | |
| `ended_at` | `timestamptz` | nullable | |
| `exit_reason` | `varchar(30)` | nullable | `completed`, `error`, `timeout`, `user_stop` |
| `serial_log_s3_key` | `text` | nullable | Serial monitor capture |

### `robopoint_ledger`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK | |
| `tenant_id` | `uuid` | FK tenants, NOT NULL | |
| `user_id` | `uuid` | FK users, NOT NULL | |
| `delta` | `integer` | NOT NULL | Positive = earn, negative = spend |
| `balance_after` | `integer` | NOT NULL | Denormalised running total |
| `reason_code` | `varchar(50)` | NOT NULL | e.g., `task_submit`, `badge_award`, `competition_place` |
| `ref_id` | `uuid` | nullable | FK to triggering entity |
| `ref_table` | `varchar(60)` | nullable | e.g., `submissions`, `competitions` |
| `created_at` | `timestamptz` | NOT NULL | Append-only; never UPDATE/DELETE |

### `audit_logs`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK | UUID v7 (time-ordered) |
| `tenant_id` | `uuid` | nullable | NULL for platform-level events |
| `actor_id` | `uuid` | nullable | FK users; NULL for system actions |
| `actor_role` | `varchar(40)` | NOT NULL | Role at time of action |
| `action` | `varchar(100)` | NOT NULL | e.g., `user.approved`, `project.deleted` |
| `target_type` | `varchar(60)` | nullable | Entity class |
| `target_id` | `uuid` | nullable | Entity primary key |
| `ip_address` | `inet` | nullable | |
| `user_agent` | `text` | nullable | |
| `payload` | `jsonb` | nullable | Before/after diff for mutations |
| `created_at` | `timestamptz` | NOT NULL | |

Audit logs are **immutable** — no UPDATE or DELETE is permitted by any application role. Only the archival job (running as a restricted service account) may move rows to cold archive.

### `moderation_cases`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK | |
| `tenant_id` | `uuid` | FK tenants, NOT NULL | |
| `reporter_id` | `uuid` | FK users, nullable | NULL = automated detection |
| `subject_id` | `uuid` | FK users, nullable | Reported user |
| `content_type` | `varchar(40)` | NOT NULL | `project`, `comment`, `submission` |
| `content_id` | `uuid` | NOT NULL | FK to the offending entity |
| `category` | `varchar(40)` | NOT NULL | `safeguarding`, `profanity`, `pii`, `abuse` |
| `severity` | `varchar(20)` | NOT NULL | `low`, `medium`, `high`, `critical` |
| `status` | `varchar(20)` | NOT NULL | `open`, `under_review`, `resolved`, `escalated` |
| `resolver_id` | `uuid` | FK users, nullable | |
| `resolution` | `text` | nullable | |
| `created_at` | `timestamptz` | NOT NULL | |
| `resolved_at` | `timestamptz` | nullable | |

### `board_definitions`

Stores built-in and custom board manifests in the wokwi-boards format. Built-in boards (Arduino UNO R3, ESP32 DevKit, Raspberry Pi Pico, and the full standard wokwi-boards library) are seeded as platform records (`tenant_id IS NULL`). Custom boards uploaded by platform admins or approved advanced users are scoped to a tenant.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK | |
| `tenant_id` | `uuid` | FK tenants, nullable | NULL = built-in platform board |
| `slug` | `varchar(80)` | NOT NULL | Unique identifier, e.g. `rp2040_pico`, `uno_r3` |
| `display_name` | `varchar(200)` | NOT NULL | Human-readable name |
| `mcu_core` | `varchar(30)` | NOT NULL | `avr8js`, `rp2040js`, `esp32` — binds to simulator engine |
| `manifest_s3_key` | `text` | NOT NULL | S3 path to `board.json` (wokwi-boards manifest) |
| `svg_s3_key` | `text` | nullable | S3 path to SVG visual asset |
| `status` | `varchar(20)` | NOT NULL, default `active` | `pending`, `active`, `rejected`; custom boards start `pending` |
| `uploaded_by_id` | `uuid` | FK users, nullable | NULL for seeded platform boards |
| `approved_by_id` | `uuid` | FK users, nullable | Moderator/admin who approved |
| `created_at` | `timestamptz` | NOT NULL | |
| `approved_at` | `timestamptz` | nullable | |

The `(tenant_id, slug)` pair carries a unique constraint so that tenant-scoped custom boards cannot collide with each other; platform boards are constrained by `(slug)` where `tenant_id IS NULL`.

### `branding_configs`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK | |
| `tenant_id` | `uuid` | FK tenants, UNIQUE, NOT NULL | 1:1 per tenant |
| `primary_color` | `char(7)` | NOT NULL | Hex colour e.g. `#1A73E8` |
| `secondary_color` | `char(7)` | nullable | |
| `logo_s3_key` | `text` | nullable | School logo in object store |
| `favicon_s3_key` | `text` | nullable | |
| `font_family` | `varchar(60)` | nullable | CSS font name |
| `custom_css_s3_key` | `text` | nullable | Optional override CSS |
| `updated_at` | `timestamptz` | NOT NULL | |

### `domains`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK | |
| `tenant_id` | `uuid` | FK tenants, NOT NULL | |
| `subdomain` | `varchar(63)` | UNIQUE, nullable | `{slug}` in `{slug}.robocode.africa` |
| `custom_domain` | `varchar(253)` | UNIQUE, nullable | Verified FQDN |
| `verified` | `boolean` | NOT NULL, default false | DNS/ACME check |
| `acme_challenge` | `text` | nullable | TXT record value |
| `tls_cert_arn` | `text` | nullable | ACM / Let's Encrypt ref |
| `created_at` | `timestamptz` | NOT NULL | |
| `verified_at` | `timestamptz` | nullable | |

---

## Indexing and Performance

### Primary Indexes

All PK columns carry a B-tree unique index by default. The following secondary indexes are required.

| Table | Index Columns | Type | Rationale |
|---|---|---|---|
| `users` | `(tenant_id, email)` | B-tree unique | Login lookup |
| `users` | `(tenant_id, username)` | B-tree unique | Username uniqueness |
| `users` | `(tenant_id, status)` | B-tree | Pending approval queue |
| `users` | `(date_of_birth)` | B-tree | Age-gating batch jobs |
| `projects` | `(tenant_id, owner_id)` | B-tree | Student project list |
| `projects` | `(tenant_id, team_id)` | B-tree | Team project list |
| `projects` | `(tenant_id, visibility)` | B-tree | Public gallery |
| `simulation_runs` | `(project_id, started_at DESC)` | B-tree | Run history |
| `robopoint_ledger` | `(tenant_id, user_id, created_at DESC)` | B-tree | Balance queries |
| `audit_logs` | `(tenant_id, actor_id, created_at DESC)` | B-tree | Admin audit viewer |
| `audit_logs` | `(action, created_at DESC)` | B-tree | Action-type filtering |
| `moderation_cases` | `(tenant_id, status, severity)` | B-tree | Moderation queue |
| `submissions` | `(task_id, user_id, created_at DESC)` | B-tree | Latest attempt lookup |
| `leaderboard_entries` | `(tenant_id, scope, score DESC)` | B-tree | Leaderboard ranking |
| `notifications` | `(user_id, read, created_at DESC)` | B-tree | Unread badge count |
| `domains` | `(custom_domain)` | B-tree unique | Request routing |
| `consent_records` | `(student_id, consented_at)` | B-tree | Minor onboarding check |
| `board_definitions` | `(tenant_id, slug)` | B-tree unique | Board lookup by tenant scope and slug |
| `board_definitions` | `(status, mcu_core)` | B-tree | Filter active boards by simulator engine |

### Partial Indexes

```sql
-- Active users only (the common query path)
CREATE INDEX idx_users_active
  ON users (tenant_id, email)
  WHERE status = 'active' AND deleted_at IS NULL;

-- Open moderation cases
CREATE INDEX idx_mod_cases_open
  ON moderation_cases (tenant_id, severity, created_at DESC)
  WHERE status IN ('open', 'under_review');

-- Projects visible to public gallery
CREATE INDEX idx_projects_public
  ON projects (tenant_id, updated_at DESC)
  WHERE visibility = 'public' AND deleted_at IS NULL;
```

### Full-Text Search

Project titles and lesson content are indexed via `tsvector` columns (or OpenSearch for cross-tenant global search) to support keyword discovery in the content library. The `component_library_items` table carries a `search_vector tsvector` column updated by trigger.

---

## Partitioning and Sharding Strategy

### Partitioning

High-volume append-only tables are range-partitioned by time to support efficient archival and query pruning.

| Table | Partition Key | Partition Interval | Notes |
|---|---|---|---|
| `audit_logs` | `created_at` | Monthly | Drop or archive partitions after retention period |
| `simulation_runs` | `started_at` | Monthly | Older runs cold-tiered to S3 |
| `robopoint_ledger` | `created_at` | Quarterly | Immutable; archived after account closure |
| `notifications` | `created_at` | Monthly | Pruned after read + 90 days |

PostgreSQL declarative partitioning (`PARTITION BY RANGE`) is used. Partition maintenance (creation of future partitions, archival of past partitions) is automated via a scheduled `pg_partman`-managed maintenance job.

### Sharding

In Phase 1 (up to ~500 schools / ~50,000 students), a single PostgreSQL primary with read replicas is sufficient. RLS provides logical isolation without physical sharding overhead.

Phase 2 scaling path: shard by `tenant_id` using a consistent-hash partitioning scheme across multiple PostgreSQL clusters, mediated by Citus or a PgBouncer-tier routing proxy. The `tenant_id` column exists on every row to make this migration non-breaking.

---

## Redis Caching and Real-Time State

Redis is used for six distinct purposes, each with its own key-space prefix and TTL policy.

| Prefix | Purpose | TTL | Eviction |
|---|---|---|---|
| `session:{user_id}` | JWT session metadata, TOTP state | 24 h (rolling) | Explicit invalidation on logout |
| `tenant:{tenant_id}` | Tenant config / branding cache | 15 min | Invalidated on branding update |
| `lb:{scope}:{tenant_id}` | Leaderboard sorted sets (ZSET) | 5 min | Refreshed by background worker |
| `sim:{session_id}` | Live simulation pin-state deltas | 60 s | Expiry on run completion |
| `queue:compile` | Firmware compile job queue (BullMQ) | Persistent | Consumed by compile workers |
| `collab:{project_id}` | Yjs document awareness state | 30 min idle | Flushed to DB on disconnect |

Leaderboards use Redis sorted sets (`ZADD`, `ZREVRANGE`) for O(log N) rank queries. The PostgreSQL `leaderboard_entries` table is the durable source of truth; Redis is the read-optimised projection.

Rate-limiting counters (API, login attempts, consent email sends) are stored in Redis with sliding-window or fixed-window counters using `INCR` + `EXPIRE`.

---

## Object Storage Layout

All binary and large-text assets are stored in an S3-compatible bucket. Objects are never publicly accessible by default; presigned URLs with short expiry (15 minutes for student-generated content, 1 hour for read-only assets) are used for browser delivery.

### Bucket Structure

```
robocode-assets/
  tenants/
    {tenant_id}/
      branding/
        logo.png
        favicon.ico
        custom.css
      projects/
        {project_id}/
          diagram/
            canvas.json          # Full diagram JSON
            thumbnail.png        # Preview image
          code/
            {code_file_id}.txt   # Overflow code content
          simruns/
            {simulation_run_id}/
              firmware.hex       # Compiled AVR firmware (UNO)
              firmware.bin       # ESP32 binary
              firmware.uf2       # Raspberry Pi Pico (RP2040) UF2 image
              firmware.elf       # Pico ELF (debug / SDK builds)
              serial.log         # Serial monitor capture
          snapshots/
            {timestamp}.zip      # Full project snapshot
      consent/
        {consent_record_id}.pdf  # Signed consent form
      submissions/
        {submission_id}/
          attachments/           # Student-uploaded media

  platform/
    components/
      models-3d/
        {component_slug}/
          model.glb              # Three.js-compatible GLTF/GLB
          preview.png
      icons/
        {component_slug}.svg
      manifests/
        component-library.json   # Full catalogue manifest
    firmware-cache/
      {board}/{library_hash}/
        compiled.hex             # Cached pre-built firmware (AVR/UNO)
        compiled.bin             # Cached pre-built firmware (ESP32)
        compiled.uf2             # Cached pre-built firmware (RP2040/Pico)
    board-definitions/
      builtin/
        {board_slug}/
          board.json             # wokwi-boards manifest (pins, MCU core)
          board.svg              # SVG visual asset
      custom/
        {tenant_id}/
          {board_slug}/
            board.json           # Custom board manifest (pending or approved)
            board.svg
    course-media/
      {course_id}/
        {lesson_id}/
          video/
          images/

  audit-archives/
    {year}/{month}/
      audit_logs_{partition}.gz  # Monthly compressed exports
```

### Object Lifecycle Policies

| Prefix | Retention Rule | Action |
|---|---|---|
| `tenants/{id}/simruns/` | 90 days (free plan), 1 year (paid) | Transition to Glacier / cold tier |
| `tenants/{id}/consent/` | Duration of account + 7 years | Legal hold; no auto-delete |
| `audit-archives/` | 7 years minimum | Immutable object lock |
| `tenants/{id}/snapshots/` | 30 most-recent kept | Oldest purged by lifecycle rule |
| `platform/firmware-cache/` | 180 days since last access | Auto-expire if unused |
| `platform/board-definitions/builtin/` | Indefinite | Platform-seeded; versioned |
| `platform/board-definitions/custom/{tenant_id}/` | Lifetime of tenant + 90 days | Purged after tenant offboarding |

---

## Data Retention, Minimisation and Child Data Governance

Child-data protection is a hard constraint, not a guideline. The following data-architecture requirements enforce compliance.

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| DR-001 | Every table containing personal data of a minor MUST carry `tenant_id` and be subject to RLS. | Must | Verified by automated schema linter in CI. |
| DR-002 | `date_of_birth` MUST NOT be stored in plaintext in any cache, log, or search index. | Must | Only `age_band` is indexed; DOB stored encrypted at rest (AES-256). |
| DR-003 | Consent records MUST be retained for the lifetime of the student account plus 7 years after deletion for audit purposes. | Must | Object-lock applied to consent S3 prefix. |
| DR-004 | On student account deletion request, PII fields (name, email, DOB, IP) MUST be pseudonymised within 30 days; RoboPoints and grade aggregates MAY be retained in anonymised form. | Must | Deletion job sets `email=NULL`, `display_name='[deleted]'`, `date_of_birth=NULL`, hashes IP. |
| DR-005 | Audit logs MUST be retained for a minimum of 7 years and MUST be immutable (no UPDATE/DELETE by any application role). | Must | Postgres trigger `RAISE EXCEPTION` on any mutation; S3 object-lock for archives. |
| DR-006 | No behavioural advertising data MUST be persisted or transmitted to third parties. Analytics events MUST be anonymised before export. | Must | Analytics pipeline strips `user_id` before sending to any external analytics system. |
| DR-007 | Serial monitor logs containing student code output MUST be stored in tenant-scoped S3 paths with the same access controls as project files. | Must | Presigned URL access only; no public S3 URLs. |
| DR-008 | Guardian email addresses in `consent_records` MUST be encrypted at the column level using pgcrypto or application-layer encryption. | Must | Key management via AWS KMS / equivalent. |
| DR-009 | Data classified as GDPR Special Category or COPPA-covered MUST not leave the primary cloud region without explicit DPA approval. | Must | No cross-region replication for personal data tables without opt-in. |
| DR-010 | Students below age 13 (COPPA) and age 16 (GDPR-K) MUST have verifiable parental consent recorded in `consent_records` before `users.status` is set to `active`. | Must | Enforced by approval-request state machine (see FR-AUTH and FR-STU). |
| DR-011 | Backup snapshots containing personal data MUST be encrypted at rest (AES-256) and stored in geo-restricted buckets. | Must | Tested by backup-restore runbook quarterly. |
| DR-012 | Inactive student accounts (no login for 24 months) MUST trigger a re-consent / account-review notification to the School Admin and Parent / Guardian. | Should | Cron job checks `users.last_login_at`; generates `notifications` and email. |

---

## Authoritative Data Retention Schedule

This table is the **single authoritative source of truth** for retention and purge periods across the SSD. Where any other section states a retention period, it MUST conform to the value below. Periods are expressed relative to the triggering event.

| Data Class | Retention Period | Trigger / Notes |
|---|---|---|
| Audit logs (all, incl. safeguarding) | 7 years | From event creation; immutable; S3 Object Lock (DR-005, FR-AUTH-112, SR-LOG-030, NFR-AUD-003) |
| Parental/guardian consent records | Account lifetime + 7 years | From account deletion; legal hold (DR-003, SR-PRIV-012, FR-AUTH-112) |
| Moderation / safeguarding case records | 7 years | From case creation; retained regardless of account deletion (DR-020) |
| Inactive-account re-consent trigger | 24 months | No login; notifies School Admin and Parent / Guardian (DR-012) |
| Inactive-account PII pseudonymisation | 3 years after deactivation | If re-consent not obtained; account deactivated then pseudonymised (FR-LRN-150, SR-PRIV-012) |
| Student PII on deletion request | Pseudonymised within 30 days | Data-subject erasure (DR-004) |
| Simulation run / serial-log objects | 90 days (free) / 1 year (paid) | Cold-tier then expire (object lifecycle) |
| Undelivered notifications | 30 days | Offline notification queue (FR-COMM-052, NFR-REL-025) |
| General notifications | 12 months | Pruned after read + retention window |
| Operational logs (warm) | 1 year warm + 7 years audit | Per Observability tiering (NFR-LOG-007) |

---

## Backup and Archival

### PostgreSQL Backup

| Component | Mechanism | Frequency | Retention |
|---|---|---|---|
| Full base backup | `pg_basebackup` / managed RDS snapshot | Daily | 30 days |
| WAL / PITR | Continuous WAL archiving to S3 | Continuous | 7 days PITR window |
| Logical backup | `pg_dump` per-tenant (for portability) | Weekly | 90 days |
| Schema-only dump | CI artefact of latest migration state | Per deployment | Indefinite |

Recovery-Time Objective (RTO): 1 hour. Recovery-Point Objective (RPO): 5 minutes (WAL continuity). These targets are validated by quarterly restore drills documented in the operational runbook (see Section 21, Observability, Logging, Monitoring and Support).

### Redis Backup

Redis AOF (Append-Only File) persistence is enabled with `everysec` fsync policy. RDB snapshots are taken every 15 minutes. Both are replicated to S3. Redis data is treated as ephemeral cache; the authoritative state is always PostgreSQL.

### Object Storage

Versioning is enabled on all production buckets. Cross-region replication is configured for disaster recovery (replication lag ≤ 15 minutes to a secondary region). Audit-archive objects carry S3 Object Lock (Compliance mode, 7-year retention) and are encrypted with SSE-KMS.

---

## DR Requirements Summary Table

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| DR-013 | The `robopoint_ledger` table MUST be append-only; balance queries derive current balance from `balance_after` of the latest row. | Must | No UPDATE/DELETE permitted on ledger table; DB trigger enforces. |
| DR-014 | Project `canvas_json` MUST be validated against a versioned JSON schema on write; invalid diagrams MUST be rejected with a schema-validation error. | Must | Schema version stored in `diagrams.canvas_json.schema_version`. |
| DR-015 | All timestamps MUST be stored in UTC (`timestamptz`); display conversion to the tenant timezone is the responsibility of the API/UI layer. | Must | Linting rule in DB migration CI. |
| DR-016 | The `component_library_items` table MUST be the single source of truth for component metadata; RSE and the Studio IDE MUST derive their component catalogue from this table. | Must | Cross-references FR-SIM (Section 8) and Section 10. |
| DR-017 | Simulation run records MUST reference the exact firmware binary S3 key used, enabling deterministic replay for debugging and academic integrity review. | Should | `simulation_runs.firmware_s3_key` is immutable after run completion. |
| DR-018 | Leaderboard entries MUST be derived from `robopoint_ledger` aggregations, not stored as a primary source of truth, and MUST be refreshable from the ledger at any time. | Must | `leaderboard_entries` carries `last_recalculated_at`; background worker reconciles. |
| DR-019 | Soft-deleted records (`deleted_at IS NOT NULL`) MUST be excluded from all RLS-visible queries by default via RLS policy; hard deletion MUST only occur after the retention period has elapsed. | Must | CI test verifies RLS policies include `AND deleted_at IS NULL` for user-facing roles. |
| DR-020 | ModerationCase records and their associated content snapshots MUST be retained for a minimum of 7 years for safeguarding audit purposes, regardless of account deletion status, per the Authoritative Data Retention Schedule. | Must | S3 content snapshot stored at case-creation time; object lock applied. |
| DR-021 | The `projects.board` column MUST reference a valid slug present in `board_definitions` (either a platform built-in or an approved tenant-scoped custom board). Foreign-key enforcement or an application-layer check MUST prevent projects being created against `pending` or `rejected` board definitions. | Must | Validated on project create/update; `board_definitions.status = 'active'` required. |
| DR-022 | Custom board definitions uploaded by non-admin users MUST be stored with `status = 'pending'` and MUST pass JSON-schema validation (wokwi-boards manifest schema), pin-sanity checks, and SVG/asset safety scanning before their status is set to `active`. | Must | Validation runs synchronously on upload; approval workflow sets `approved_by_id` and `approved_at`. |
| DR-023 | The `simulation_runs.firmware_s3_key` MUST store the board-appropriate firmware format: `.hex` for AVR (Arduino UNO R3), `.bin` for ESP32, and `.uf2` or `.elf` for RP2040 (Raspberry Pi Pico). The `board` column on `simulation_runs` determines the expected format. | Must | Enforced by compile-worker output conventions; format mismatch triggers a run-level error. |

---

## Cross-References

- Multi-tenant routing and subdomain/custom-domain resolution: Section 6, Functional Requirements: Multi-Tenancy, Custom Domains and White-Labelling (FR-TEN).
- Authentication session data and JWT: Section 5, Functional Requirements: Identity, Authentication and Authorization (FR-AUTH).
- Simulation run lifecycle and component state: Section 8, Functional Requirements: RoboCode Simulation Engine (FR-SIM); covers all three first-class boards (Arduino UNO R3 / avr8js, ESP32 / ESP32 core, Raspberry Pi Pico / rp2040js) and the extensible wokwi-boards custom board library.
- Component catalogue definition: Section 10, Component and Sensor Library Specification (FR-SIM-200 through FR-SIM-212).
- Custom board definition upload, validation and moderation: board_definitions entity (this section, DR-021, DR-022) and FR-SIM (Section 8).
- Approval and consent state machine: FR-AUTH-010 through FR-AUTH-030.
- Moderation and safeguarding escalation: Section 13, Functional Requirements: Communication, Notifications and Moderation (FR-MOD).
- Observability and log retention: Section 21, Observability, Logging, Monitoring and Support.
- Security controls and encryption: Section 18, Security, Privacy and Child Safety (SR-nnn).
