# Functional Requirements: Learning Management and Content

## Overview

This section specifies the functional requirements for the Learning Management and Content subsystem of RoboCode.Africa. It translates the user requirements documented in *User Requirements: Learning, Courses, Tasks and Assessment* (UR-LRN) into precise, implementation-ready system requirements. All requirements in this section carry the prefix `FR-LRN-nnn`.

The subsystem spans four primary capability domains:

1. **Content architecture** — the data models, authoring workflows, and publishing lifecycle for courses, modules, lessons, and tasks.
2. **Instructional delivery** — guided tutorials, interactive simulation embeds, quizzes, and assignments.
3. **Assessment and grading** — automated verification via the Auto-Grader, rubric-based manual grading, submission management, and feedback.
4. **Progress and credentialling** — mastery tracking, learning-path prerequisites, certificates, and skill badges.

All learning content and student progress data are classified as personal data and are subject to the child-safety and data-protection obligations enumerated in the *Security, Privacy and Child Safety* section (SR-*) and the *Data Architecture and Database Design* section (DR-*). The prime directive — child safety first — applies throughout.

Cross-references to other SSD sections are made by section name and requirement-ID prefix. Cross-references to URD sections are made by the UR-LRN identifier series.

---

## Content Data Models

### Hierarchy and Entity Definitions

The learning content hierarchy is a five-level tree. Every node carries a `tenant_scope` discriminator: `global` (owned by Super Admin, publishable platform-wide), or `tenant` (owned by a School tenant, visible only within that tenant).

```
LEARNING CONTENT HIERARCHY
═══════════════════════════════════════════════════════════════════════
Level 1  Track Family      (e.g. "Robotics & Coding", "AI Fundamentals")
  Level 2  Track           (e.g. "Primary Robotics", "High School AI")
    Level 3  Module        (e.g. "Sensors & Sensing", "Motor Control")
      Level 4  Lesson      (atomic instructional unit)
                ├── Content Page(s)   (rich text / video / widget)
                ├── Guided Tutorial   (step-by-step in RoboCode Studio)
                └── Coding Task / Challenge
      Level 4  Module Quiz (standalone assessment node)
      Level 4  Capstone Project (terminal module assessment)
  Level 2  Track Certificate (issued on Track completion)
═══════════════════════════════════════════════════════════════════════
```

#### Track Family Entity

| Field | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK | Immutable after creation. |
| `slug` | varchar(64) | UNIQUE, NOT NULL | URL-safe identifier. |
| `title` | varchar(255) | NOT NULL, i18n | Display name. |
| `description` | text | nullable, i18n | Markdown-safe. |
| `tenant_scope` | enum | `global` | Track families are always global. |
| `created_by` | UUID FK → users | NOT NULL | Must be Super Admin role. |
| `created_at` | timestamptz | NOT NULL | UTC. |
| `updated_at` | timestamptz | NOT NULL | UTC. |

#### Track Entity

| Field | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK | — |
| `family_id` | UUID FK → track_family | NOT NULL | Parent family. |
| `slug` | varchar(64) | UNIQUE per family | — |
| `title` | varchar(255) | NOT NULL, i18n | — |
| `level` | enum | `primary`, `high_school` | Matches learner level bands. |
| `prerequisite_track_ids` | UUID[] | nullable | Ordered prerequisite list. |
| `status` | enum | `draft`, `review`, `published`, `archived` | — |
| `tenant_scope` | enum | `global` or `tenant_id` | — |
| `curriculum_tags` | jsonb | NOT NULL | Array of tag objects; see FR-LRN-060. |
| `estimated_hours` | numeric | nullable | Indicative duration. |
| `thumbnail_url` | varchar(512) | nullable | S3-compatible object key. |

#### Module Entity

| Field | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK | — |
| `track_id` | UUID FK → track | NOT NULL | — |
| `ordinal` | smallint | NOT NULL | Zero-based ordering within track. |
| `title` | varchar(255) | NOT NULL, i18n | — |
| `description` | text | nullable, i18n | — |
| `objectives` | text[] | NOT NULL | ≥ 1 learning objective. |
| `difficulty` | enum | `beginner`, `intermediate`, `advanced` | — |
| `estimated_minutes` | smallint | NOT NULL | Used for display and scheduling. |
| `prerequisite_module_ids` | UUID[] | nullable | In-track prerequisites. |
| `status` | enum | `draft`, `review`, `published`, `archived` | — |
| `tenant_scope` | enum | `global` or `tenant_id` | — |
| `curriculum_tags` | jsonb | nullable | Inherits from Track if absent. |

#### Lesson Entity

| Field | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK | — |
| `module_id` | UUID FK → module | NOT NULL | — |
| `ordinal` | smallint | NOT NULL | Zero-based ordering. |
| `title` | varchar(255) | NOT NULL, i18n | — |
| `lesson_type` | enum | `content`, `tutorial`, `task`, `quiz`, `project` | — |
| `status` | enum | `draft`, `review`, `published`, `archived` | — |
| `estimated_minutes` | smallint | nullable | — |
| `is_capstone` | boolean | DEFAULT false | Triggers certificate evaluation. |

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-LRN-001 | The system **shall** implement the five-level content hierarchy (Track Family → Track → Module → Lesson → Content Nodes) as distinct database entities with enforced referential integrity. | Must | PostgreSQL schema with FK constraints and cascading soft-deletes. |
| FR-LRN-002 | Every content entity **shall** carry a `status` field with the values `draft`, `review`, `published`, and `archived`. Only `published` entities **shall** be visible to Students. | Must | Status transitions validated server-side; see FR-LRN-020. |
| FR-LRN-003 | Every content entity **shall** carry a `tenant_scope` field. Global entities are owned by the Super Admin. Tenant-scoped entities are owned by a specific `tenant_id` and are isolated by PostgreSQL Row-Level Security, consistent with multi-tenancy controls defined in *Functional Requirements: Multi-Tenancy, Custom Domains and White-Labelling* (FR-TEN). | Must | RLS policy: `WHERE tenant_scope = 'global' OR tenant_id = current_setting('app.tenant_id')`. |
| FR-LRN-004 | The system **shall** maintain an ordered list of prerequisite entity IDs on each Track and Module. The prerequisite check **shall** be enforced at enrolment time: a student **shall not** be enrolled in a Track whose prerequisites are not fully completed unless a Teacher or School Admin has explicitly granted an override for that student. | Must | Override recorded as `enrolment_override` with actor and timestamp. |
| FR-LRN-005 | All text fields marked `i18n` **shall** be stored in a companion `content_translations` table keyed by `(entity_type, entity_id, locale_code)`. The system **shall** fall back to the platform-default locale (`en-GB`) when a translation for the user's preferred locale is not available. | Should | Supports curriculum localisation; see FR-LRN-062 and the authoritative locale matrix in the Accessibility, Internationalisation and Low-Bandwidth Design section. |

---

## Content Types

### Supported Content Types

Each Lesson node may contain one or more ordered content pages. The following content types are supported.

```
CONTENT TYPE TAXONOMY
══════════════════════════════════════════════════════════════
Type                  Renderer                  Bandwidth tier
──────────────────────────────────────────────────────────────
rich_text             React Markdown / ProseMirror editor  Low
image                 CDN-hosted via S3           Low-Medium
video_embed           Adaptive streaming (HLS)    High (adaptable)
video_upload          Platform-hosted HLS         High (adaptable)
simulation_widget     RoboCode Studio (iframe)    Medium
quiz_embed            Inline quiz renderer        Low
code_snippet          Monaco read-only            Low
file_attachment       S3 download link            Low
══════════════════════════════════════════════════════════════
```

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-LRN-010 | The system **shall** support the following content types within a lesson: `rich_text`, `image`, `video_embed`, `video_upload`, `simulation_widget`, `quiz_embed`, `code_snippet`, and `file_attachment`. | Must | Content type is recorded in the `lesson_page.content_type` column. |
| FR-LRN-011 | Rich-text content **shall** be authored using a WYSIWYG / Markdown hybrid editor (ProseMirror-based) supporting headings (H2–H4), bold, italic, inline code, code blocks with syntax highlighting, tables, unordered and ordered lists, blockquotes, and inline images. | Must | Editor available to Teachers for tenant content and Super Admin staff for global library content. |
| FR-LRN-012 | All video content served by the platform **shall** be delivered as adaptive bitrate streams (HLS) with at least three quality tiers (360p/720p/1080p) and automatic quality switching. A low-bandwidth mode **shall** serve a pre-generated 240p tier to students on connections below 1 Mbps. | Must | Supports low-connectivity African school networks; see *Accessibility, Internationalisation and Low-Bandwidth Design* (NFR-LBW). |
| FR-LRN-013 | Video players **shall** support: manual closed captions (WebVTT format, author-uploaded), playback speed control (0.5×, 0.75×, 1×, 1.25×, 1.5×, 2×), full-screen mode, and keyboard-navigable controls to meet WCAG 2.2 AA (Success Criterion 1.2.2, 2.1.1). | Must | Auto-generated captions via a third-party speech-to-text service are acceptable if editable by the author before publishing. |
| FR-LRN-014 | Simulation widgets **shall** embed a pre-configured RoboCode Studio instance (circuit layout + optional starter code) in an iframe or micro-frontend mount point. The widget configuration is serialised as a JSON snapshot and stored alongside the lesson page record. | Must | Widget state is read-only for students in content pages; editable only in tutorial/task contexts. |
| FR-LRN-015 | Each lesson page **shall** display a progress indicator showing the student's position within the lesson (e.g., "Step 3 of 7") and support sequential `Next` / `Back` navigation. | Should | Minimum 3 pages per lesson; navigation blocked at last page until a completion event is fired. |
| FR-LRN-016 | The system **shall** persist each student's last-read page position server-side (in the `lesson_progress` table) so that returning to a lesson resumes from the last-visited page. Progress is stored on every `Next` action, not only at lesson completion. | Must | Not reliant on browser local storage. Verified by clearing browser data and confirming resume position. |

---

## Content Authoring and Publishing Workflow

### Roles and Permissions

| Role | Can Author | Scope | Can Publish |
|---|---|---|---|
| Super Admin | Track Families, Tracks, Modules, Lessons | Global | Yes (any status → published) |
| Platform Moderator | Lessons, quiz questions | Global (review only) | Can approve; cannot self-approve own content. |
| School Admin | Tracks, Modules, Lessons | Own tenant | Yes (tenant-scoped content only) |
| Teacher / Educator | Modules, Lessons, Tasks, Quizzes | Own tenant | To own classes only; School Admin publishes tenant-wide. |
| Student | None | — | No |

### Publishing State Machine

```
CONTENT PUBLISHING STATE MACHINE
──────────────────────────────────────────────────────────────
  [Author creates entity]
          │
          ▼
      ┌────────┐   author submits for review   ┌──────────┐
      │ DRAFT  │ ──────────────────────────► │  REVIEW  │
      │        │ ◄────────────────────────── │          │
      └────────┘   reviewer returns changes  └──────────┘
                                                   │
                           reviewer approves       │
                           (or Super Admin /        │
                            School Admin           │
                            self-publishes)         │
                                                   ▼
                                           ┌──────────────┐
                                           │  PUBLISHED   │
                                           └──────────────┘
                                                   │
                          author / admin archives  │
                                                   ▼
                                           ┌──────────────┐
                                           │   ARCHIVED   │
                                           └──────────────┘
──────────────────────────────────────────────────────────────
Note: ARCHIVED entities remain readable to enrolled students
who had access at archive time; new enrolments cannot access.
──────────────────────────────────────────────────────────────
```

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-LRN-020 | The system **shall** enforce the content publishing state machine shown above. State transitions **shall** be validated server-side; invalid transitions **shall** return HTTP 422 with an error code. | Must | State is stored in the `status` column; transitions audited in `content_audit_log`. |
| FR-LRN-021 | Authors **shall** be able to save content in `draft` state without it being visible to students. A `preview` mode **shall** allow the author to view the lesson exactly as a student would before publishing. | Must | Preview renders the same React components as the student-facing view; no separate rendering path. |
| FR-LRN-022 | When a Teacher submits global library content (imported and locally customised) for review, the review request **shall** be routed to a Platform Moderator queue. Tenant-scoped content submitted by a Teacher for review **shall** be routed to the School Admin queue. | Should | Notification sent to reviewer per FR-COMM notification rules. |
| FR-LRN-023 | The content publishing workflow **shall** maintain a full version history of all saved drafts, keyed by `(entity_id, version_number)`. Authors **shall** be able to view a diff between any two versions and restore a previous version. | Should | Version history retained for the lifetime of the entity plus the data retention period. |
| FR-LRN-024 | Super Admin staff **shall** be able to import content from external standards-compliant packages (IMS Common Cartridge 1.3 or SCORM 2004 3rd Edition) into the global library as a migration pathway from other LMS platforms. | Could | Full SCORM runtime conformance is out of scope for v1; content import (metadata + media extraction) only. |
| FR-LRN-025 | AI Fundamentals modules targeting primary-level students (ages 9–13) **shall** require explicit approval from a Platform Moderator before being promoted to `published` status in the global library, as mandated by UR-LRN-061. | Must | Moderation flag `requires_ai_primary_review = true` set automatically when `lesson_type` references AI Fundamentals and `track.level = primary`. |

---

## Curriculum Tagging and Localisation

### Curriculum Tag Schema

Tags are stored as a JSONB array on each Module (and optionally Track). Each element conforms to the following structure:

```
{
  "standard": "ZW_OLEVEL_ICT",  // Controlled vocabulary code
  "strand":   "Programming",    // Curriculum strand / topic
  "grade":    "O-Level Form 3", // Grade / year reference
  "outcome":  "Demonstrate understanding of loop constructs"
}
```

Supported `standard` codes at launch: `ZW_OLEVEL_ICT`, `ZA_CAPS_TECH`, `NG_BASIC_TECH`, `KE_CBC_TECH`, `INTL_CS_PRINCIPLES`. Additional codes added by Super Admin via the tag vocabulary management interface.

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-LRN-060 | Every Module published to the Global Content Library **shall** have at least one `curriculum_tag` entry before its status may be set to `published`. The publishing API **shall** return HTTP 422 if the tag array is empty. | Must | Validation logic in the content service; enforcement at the NestJS guard layer. |
| FR-LRN-061 | The system **shall** maintain a Super Admin-managed controlled vocabulary of `standard` codes. Authors **shall** select tags from this vocabulary via a type-ahead search; free-text entry of new standard codes is restricted to Super Admin. | Must | Prevents vocabulary drift across tenants. |
| FR-LRN-062 | All user-facing content strings in Tracks, Modules, and Lessons **shall** be internationalised using the `content_translations` table (FR-LRN-005). The supported-locale set and launch phasing are the authoritative matrix defined in *Accessibility, Internationalisation and Low-Bandwidth Design* (Phase 1: en-GB, fr-FR, pt-PT, ar, sw; Phase 2: sn, nd, zu, ha, yo, am). Additional locales are addable by Super Admin without code deployment. | Should | Locale is resolved from: (1) user preference, (2) tenant default locale, (3) `en-GB` platform-default fallback. |
| FR-LRN-063 | Teachers **shall** be able to search and filter the Global Content Library by: curriculum standard code, level (`primary`/`high_school`), difficulty, component type (referencing the Component Catalogue defined in *Component and Sensor Library Specification*), estimated duration, and free-text keyword. Search results **shall** be returned within 1 second at p95. | Must | Full-text search via PostgreSQL `tsvector` or OpenSearch where deployed. |
| FR-LRN-064 | The system **shall** generate a **Curriculum Mapping Report** for School Admins and Teachers. The report lists all curriculum outcomes covered by assigned Tracks and Modules, grouped by standard code and strand, with a gap analysis showing uncovered outcomes. | Should | Exportable as PDF and CSV. Generated on demand; cached for up to 24 hours. |

---

## Tasks and Challenges

### Task Type Definitions

| Task Type | Code | Auto-Graded | Teacher-Graded | Timed |
|---|---|---|---|---|
| Guided Coding Task | `guided` | Yes | Optional rubric | No |
| Open Coding Challenge | `open` | Yes | Optional rubric | No |
| Debug Challenge | `debug` | Yes | Optional rubric | No |
| Timed Challenge | `timed` | Yes | No | Yes |
| Teacher-Assigned Task | `assigned` | Optional | Required rubric | Optional |

### Task Entity

| Field | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK | — |
| `lesson_id` | UUID FK → lesson | NOT NULL | Parent lesson node. |
| `task_type` | enum | NOT NULL | See task type codes above. |
| `title` | varchar(255) | NOT NULL, i18n | — |
| `brief` | text | NOT NULL, i18n | Rich text / Markdown. |
| `starter_circuit` | jsonb | nullable | Serialised Wokwi diagram JSON. |
| `starter_code` | text | nullable | Partial code scaffold. |
| `starter_code_editable_ranges` | jsonb | nullable | Array of `{start_line, end_line}` objects. |
| `test_suite_id` | UUID FK → test_suite | nullable | Auto-grader test suite; null = manual only. |
| `max_attempts` | smallint | DEFAULT NULL | NULL = unlimited. |
| `time_limit_seconds` | int | nullable | Required when `task_type = timed`. |
| `late_submission_policy` | enum | `accepted`, `rejected`, `penalised` | DEFAULT `accepted`. |
| `rubric_id` | UUID FK → rubric | nullable | — |
| `allow_peer_review` | boolean | DEFAULT false | Teacher-enabled per task. |
| `status` | enum | `draft`, `published`, `archived` | — |
| `tenant_scope` | enum | `global` or `tenant_id` | — |

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-LRN-070 | The system **shall** persist all five Task Types with the fields defined in the Task Entity schema above. Each task type **shall** be rendered with a distinct UI treatment in RoboCode Studio as specified in *Functional Requirements: RoboCode Studio IDE* (FR-STU). | Must | `task_type` drives the Studio mode selection. |
| FR-LRN-071 | Starter files (partial code scaffold and/or partial circuit layout) **shall** be pre-loaded into the student's task workspace when the task is opened. Editable regions in the code scaffold **shall** be delimited by `starter_code_editable_ranges`; regions outside these ranges **shall** be presented as read-only in Monaco editor. | Must | Monaco `readOnly` decorations applied to locked ranges. |
| FR-LRN-072 | Task briefs **shall** support the same rich-text content types as lesson pages (FR-LRN-010), including embedded images, code blocks, and video links. | Should | Same ProseMirror editor instance reused; consistent authoring experience. |
| FR-LRN-073 | For Timed Challenges, the countdown timer **shall** be displayed persistently in the RoboCode Studio toolbar. On expiry, the workspace **shall** be automatically submitted in its current state and the student **shall** receive a notification that time has elapsed. The timer **shall** be pausable only by a Teacher or School Admin for accessibility accommodations, recorded in the audit log with the actor and reason. | Should | Accessibility requirement; WCAG 2.2 SC 2.2.1 (adjustable timing). |
| FR-LRN-074 | Debug Challenges **shall** pre-load a circuit layout that is locked (circuit-canvas read-only) and intentionally broken code. The task brief **shall** describe the expected correct behaviour. Only the code editor is editable unless the task author explicitly marks circuit regions as editable. | Must | `starter_code_editable_ranges` must cover at least one range; `starter_circuit` is locked via a `circuit_locked = true` flag on the task. |

---

## Automated Grading: Auto-Grader Architecture

### Architectural Overview

The Auto-Grader is a backend service (part of the NestJS microservice layer) that executes a student's submitted project in a headless instance of the RoboCode Simulation Engine (RSE) and asserts a set of test cases against the resulting simulation state. It is invoked on every task submission where a `test_suite_id` is present.

```
AUTO-GRADER DATA FLOW
══════════════════════════════════════════════════════════════════════════

 ┌──────────────────────────────────────┐
 │  Student submits task in Studio      │
 │  (code + circuit snapshot)           │
 └──────────────────┬───────────────────┘
                    │  HTTP POST /submissions
                    ▼
 ┌──────────────────────────────────────┐
 │  Submission Service                  │
 │  • Validates attempt count/policy    │
 │  • Persists submission record        │
 │  • Queues auto-grade job (Redis/BullMQ)│
 └──────────────────┬───────────────────┘
                    │  enqueue job
                    ▼
 ┌──────────────────────────────────────┐
 │  Auto-Grader Worker (Node.js)        │
 │  • Pulls job from queue              │
 │  • Fetches test_suite from DB        │
 │  • Invokes Headless RSE              │
 └──────────────────┬───────────────────┘
                    │
         ┌──────────┴───────────┐
         │                      │
         ▼                      ▼
 ┌───────────────┐    ┌─────────────────────┐
 │ Compile Path  │    │ Interpreted Path     │
 │ (avr8js /     │    │ (RVM interpreter)    │
 │  rp2040js /   │    │                      │
 │  ESP32 core)  │    │ No compile step;     │
 │ WASM toolchain│    │ direct instruction   │
 │ or compile    │    │ execution            │
 │ microservice  │    │                      │
 └───────┬───────┘    └──────────┬──────────┘
         │                       │
         └──────────┬────────────┘
                    │ headless simulation run
                    ▼
 ┌──────────────────────────────────────┐
 │  Headless RSE Execution              │
 │  • Loads firmware / RVM bytecode     │
 │  • Runs for configured duration      │
 │    (default: 10 s simulated time)    │
 │  • Captures pin state events,        │
 │    serial output, component states   │
 └──────────────────┬───────────────────┘
                    │  telemetry stream
                    ▼
 ┌──────────────────────────────────────┐
 │  Assertion Engine                    │
 │  Evaluates each TestCase against     │
 │  captured telemetry:                 │
 │  • pin_state assertion               │
 │  • analog_range assertion            │
 │  • timing assertion                  │
 │  • serial_output assertion           │
 │  • component_visual assertion        │
 │  → pass / fail per case              │
 └──────────────────┬───────────────────┘
                    │
                    ▼
 ┌──────────────────────────────────────┐
 │  Grade Calculation                   │
 │  • Count passed / total test cases   │
 │  • Apply rubric weighting if present │
 │  • Record GradeResult in DB          │
 │  • Notify student (WebSocket)        │
 └──────────────────────────────────────┘

══════════════════════════════════════════════════════════════════════════
```

### Test Suite and Test Case Data Models

A `test_suite` belongs to one task and contains an ordered list of `test_case` records.

| Field (test_suite) | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK | — |
| `task_id` | UUID FK → task | UNIQUE, NOT NULL | One suite per task. |
| `simulated_duration_ms` | int | NOT NULL DEFAULT 10000 | Headless run length. |
| `board` | enum | `uno_r3`, `esp32`, `pico` | Target MCU for compilation. Binds to avr8js (uno_r3), rp2040js (pico), or ESP32 core (esp32). |
| `execution_mode` | enum | `compile`, `interpret` | Determines Auto-Grader path. |
| `pass_threshold_pct` | smallint | NOT NULL DEFAULT 100 | % of cases required to pass task. |
| `created_by` | UUID FK → users | NOT NULL | Task author. |

| Field (test_case) | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK | — |
| `suite_id` | UUID FK → test_suite | NOT NULL | — |
| `ordinal` | smallint | NOT NULL | Execution order. |
| `name` | varchar(255) | NOT NULL | Shown to student. |
| `assertion_type` | enum | NOT NULL | See assertion types table. |
| `assertion_params` | jsonb | NOT NULL | Type-specific parameters. |
| `feedback_on_fail` | text | nullable | Shown to student on failure; authored by task creator. |
| `reveal_expected` | boolean | DEFAULT false | If true, expected value shown on fail. |
| `weight` | numeric | DEFAULT 1.0 | Relative scoring weight. |

### Assertion Types

| Assertion Type | `assertion_params` Schema | Description |
|---|---|---|
| `pin_state` | `{pin: int, expected: "HIGH"/"LOW", at_ms: int}` | Assert MCU pin level at a specific simulation time. |
| `analog_range` | `{pin: int, min: int, max: int, at_ms: int}` | Assert ADC reading within range at simulation time. |
| `timing` | `{event: string, within_ms: int, after_ms: int}` | Assert that a named event occurs within a time window. |
| `serial_output` | `{contains: string, match_mode: "exact"/"substring"/"regex", within_ms: int}` | Assert Serial.print output matches pattern. |
| `component_visual` | `{component_id: string, property: string, expected: any}` | Assert component visual state (e.g., LCD text, LED colour). |

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-LRN-080 | The system **shall** implement the Auto-Grader architecture described above, executing student submissions in a headless RSE instance isolated from all other running simulations. Each Auto-Grader job **shall** run in a sandboxed container or worker thread with a hard wall-clock timeout of 30 seconds. | Must | Container/thread isolation prevents a malicious or infinite-loop submission from affecting other students. |
| FR-LRN-081 | The system **shall** support all five assertion types defined in the Assertion Types table: `pin_state`, `analog_range`, `timing`, `serial_output`, and `component_visual`. | Must | Each assertion type implemented as a distinct evaluator class in the Assertion Engine. |
| FR-LRN-082 | For `compile` execution mode, the Auto-Grader **shall** compile the student's Arduino C/C++, MicroPython, or CircuitPython code via the in-browser WASM toolchain (where invoked server-side via a Node.js WASM runner) or via a dedicated compile microservice, and load the resulting firmware binary into the appropriate headless simulator: avr8js (Arduino UNO R3), rp2040js (Raspberry Pi Pico / RP2040), or ESP32 core (ESP32 DevKit). The target simulator is determined by the `test_suite.board` field. Compilation failures **shall** be reported as a grading error, not a test-case failure. | Must | Compilation error messages returned to student via the test results panel. For Pico targets, a UF2/ELF image is loaded into rp2040js. |
| FR-LRN-083 | For `interpret` execution mode, the Auto-Grader **shall** load the student's project into the RoboCode Virtual Machine (RVM) interpreter and execute it against the headless RSE without a compilation step. | Must | Supports the simplified/interpreted path for younger or early-stage learners. |
| FR-LRN-084 | The Auto-Grader **shall** process a grading job within a p95 time of 15 seconds from job enqueue to grade result persisted. Queue depth and worker throughput **shall** be monitored via Prometheus metrics. | Must | Horizontal scaling of Auto-Grader workers via Kubernetes HPA when queue depth exceeds threshold. |
| FR-LRN-085 | A maximum of 50 test cases per test suite **shall** be enforced in v1. The `pass_threshold_pct` setting **shall** determine the minimum percentage of cases (by cumulative weight) that must pass for the task to be graded as passed. Default: 100 %. | Must | Configurable per task; threshold encoded in `test_suite.pass_threshold_pct`. |
| FR-LRN-086 | The Auto-Grader **shall** produce a `GradeResult` record per submission containing: `submission_id`, `passed` (boolean), `score_pct` (0–100), `cases_passed`, `cases_total`, `compilation_error` (nullable text), `case_results[]` (per-case pass/fail/feedback), `duration_ms`, and `graded_at` (UTC timestamp). | Must | `GradeResult` persisted in `grade_results` table; linked to `submission_id`. |
| FR-LRN-087 | Task authors **shall** be able to author and edit test suites through a structured form-based UI, specifying assertion type, parameters, failure feedback, and reveal-expected flag for each test case. Authors **shall** be able to run the test suite against a reference solution to verify correctness before publishing. | Must | "Dry-run" mode executes the author's reference solution and shows expected case results. |
| FR-LRN-088 | The test results panel **shall** display to the student: each test case name, pass/fail icon, the `feedback_on_fail` text for failed cases (if authored), and the expected value (if `reveal_expected = true`). The panel **shall not** reveal assertion parameters (`assertion_params`) beyond what the author explicitly allows. | Must | Panel rendered client-side from the `GradeResult.case_results[]` response; assertion params are never sent to the client. |
| FR-LRN-089 | Between re-attempts on a task, the system **shall** detect whether the student has made at least one change to the code or circuit before allowing re-submission. A re-submission with an unchanged project **shall** be rejected with HTTP 422 and an explanatory message. | Should | Change detection via a hash comparison of code content and circuit JSON snapshot between the current workspace state and the last submission. |

---

## Quizzes and Knowledge Checks

### Quiz Entity

| Field | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK | — |
| `lesson_id` | UUID FK → lesson | NOT NULL | Parent lesson. |
| `quiz_type` | enum | `knowledge_check`, `module_quiz` | Inline vs standalone. |
| `title` | varchar(255) | NOT NULL, i18n | — |
| `time_limit_seconds` | int | nullable | NULL = no limit. |
| `randomise_questions` | boolean | DEFAULT false | — |
| `randomise_options` | boolean | DEFAULT false | — |
| `pass_mark_pct` | smallint | NOT NULL DEFAULT 70 | Pass threshold. |
| `cooldown_hours` | smallint | NOT NULL DEFAULT 24 | Hours before retry after failure. |
| `max_attempts` | smallint | nullable | NULL = unlimited. |
| `status` | enum | `draft`, `published`, `archived` | — |

### Question Types

| Question Type | Code | Auto-Marked | Notes |
|---|---|---|---|
| Multiple choice (single answer) | `mc_single` | Yes | — |
| Multiple choice (multi-select) | `mc_multi` | Yes | All correct options must be selected. |
| True / False | `true_false` | Yes | — |
| Short answer (text) | `short_text` | Yes | Exact match or keyword match. |
| Code snippet completion | `code_fill` | Yes | Fill-in-the-blank in a code block. |
| Drag-and-drop ordering | `drag_order` | Yes | Should (v2). |

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-LRN-090 | The system **shall** support two quiz varieties: `knowledge_check` (1–5 questions, inline within a lesson page) and `module_quiz` (5–30 questions, a standalone lesson node at module level). | Must | Both rendered by the same quiz engine component; layout differs by type. |
| FR-LRN-091 | The system **shall** support the question types: `mc_single`, `mc_multi`, `true_false`, `short_text`, and `code_fill`. The `drag_order` type is a Should for v2. | Must | Each question type has a dedicated renderer and auto-marker. |
| FR-LRN-092 | Short-answer (`short_text`) questions **shall** support two matching modes: `exact` (case-insensitive full-string match) and `keyword` (all listed keywords present in the student's answer, order-independent). Authors specify the mode and answer at question-creation time. | Must | Keyword matching uses word-boundary detection; punctuation-normalised. |
| FR-LRN-093 | On quiz submission, the system **shall** immediately return to the student: overall score (percentage), pass/fail status against `pass_mark_pct`, and per-question feedback for incorrect answers. Per-question feedback text is authored; default is to show the correct answer if no custom text is provided. | Must | Feedback rendered client-side from the quiz result payload; correct answers are not included in the payload until after submission. |
| FR-LRN-094 | Students who fail a module quiz **shall** not be able to retake it until the `cooldown_hours` period has elapsed. Teachers **shall** be able to reset the cooldown or grant an immediate retry for an individual student from the class management interface. | Should | Cooldown enforced server-side; checked at quiz-attempt creation. Teacher reset logged in the audit trail. |
| FR-LRN-095 | All quiz results **shall** be stored in a `quiz_attempt` table per student, capturing: `quiz_id`, `student_id`, `attempt_number`, `answers` (jsonb), `score_pct`, `passed`, `started_at`, `submitted_at`. | Must | Results are accessible to the assigned Teacher via the Class Progress View. |
| FR-LRN-096 | The system **shall** enforce the `time_limit_seconds` for timed quizzes with a server-side deadline. The client timer is informational; the server **shall** reject submissions received after the deadline with HTTP 422. | Should | Server deadline = `started_at + time_limit_seconds + 10 s` (network buffer). |

---

## Assignments

### Assignment Entity

| Field | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK | — |
| `tenant_id` | UUID FK → tenant | NOT NULL | RLS-enforced. |
| `created_by` | UUID FK → users | NOT NULL | Teacher or School Admin role. |
| `title` | varchar(255) | NOT NULL | — |
| `description` | text | nullable | Rich text/Markdown. |
| `due_at` | timestamptz | nullable | NULL = no due date. |
| `late_policy` | enum | `accepted`, `rejected`, `penalised` | DEFAULT `accepted`. |
| `late_penalty_pct` | smallint | nullable | Required if `late_policy = penalised`. |
| `visible_autograder_results` | boolean | DEFAULT true | Student can see test results. |
| `rubric_id` | UUID FK → rubric | nullable | — |
| `status` | enum | `draft`, `published`, `closed` | — |
| `created_at` | timestamptz | NOT NULL | — |

An `assignment_item` join table links an Assignment to one or more `task_id`, `quiz_id`, or `project_id` entities with an `ordinal` for sequencing.

An `assignment_class` join table links an Assignment to one or more `class_id` or `student_id` targets.

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-LRN-100 | The system **shall** allow Teachers and School Admins to create Assignments by composing one or more Tasks, Quizzes, and/or Project briefs, configuring the assignment settings, and targeting one or more classes or individual students within their tenant. | Must | Assignment creation via the assignment editor; items selectable from the tenant's published content. |
| FR-LRN-101 | The system **shall** send an in-platform notification and (if configured) an email notification to all assigned students when an Assignment is published. A reminder notification **shall** be sent 24 hours before the due date by default; the Teacher may customise or disable reminder timing. Notification rules are governed by *Functional Requirements: Communication, Notifications and Moderation* (FR-COMM). | Must | Notification event `assignment.published` and `assignment.due_reminder` dispatched to the notification service. |
| FR-LRN-102 | The Student **My Assignments** view **shall** list all assignments with: title, class name, due date/time (formatted in local timezone), submission status (`not_started`, `in_progress`, `submitted`, `graded`, `overdue`), and a launch button. The list **shall** be sortable by due date and filterable by status and class. | Must | Status computed from `assignment_submission` records; real-time updates via WebSocket. |
| FR-LRN-103 | On student submission of an assignment (explicit submit action or automatic submission on due-date expiry), the system **shall** create a `assignment_submission` record with status `submitted`, and **shall** notify the assigned Teacher(s) via an in-platform notification. The submission **shall** appear in the Teacher's Grading Queue. | Must | Due-date auto-submit is triggered by a scheduled job (BullMQ delayed job set at assignment publication). |
| FR-LRN-104 | The Teacher's Grading Queue **shall** display each pending submission with: student display name, submission timestamp, auto-grader score (if applicable), and a link to open the student's submitted workspace in read-only mode. The Teacher **shall** be able to view the circuit, code, and (where available) a simulation state replay snapshot. | Must | Read-only workspace view is a restricted-permission Studio instance bound to the `submission_id`; the student's live workspace is not affected. |
| FR-LRN-105 | The system **shall** enforce the `late_policy` setting at the time of submission: if `rejected`, submissions received after `due_at` **shall** be refused with HTTP 422 and a user-facing message. If `penalised`, submissions received after `due_at` **shall** be accepted but the auto-grader score and manual grade **shall** be reduced by `late_penalty_pct`. | Must | Late determination uses server clock; client clock is not trusted. |

---

## Rubrics and Manual Grading

### Rubric Entity

| Field | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK | — |
| `tenant_id` | UUID FK → tenant | NOT NULL | RLS-enforced. |
| `created_by` | UUID FK → users | NOT NULL | Teacher or School Admin. |
| `name` | varchar(255) | NOT NULL | — |
| `criteria` | jsonb | NOT NULL | Array of criterion objects (see below). |
| `total_points` | numeric | NOT NULL | Sum of max points across criteria. |

Each criterion object: `{id: UUID, label: string, description: text, max_points: numeric, levels: [{label: string, points: numeric, description: string}]}`.

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-LRN-110 | The system **shall** support rubric-based grading. Teachers **shall** be able to create reusable Rubric entities with configurable criteria (e.g., Circuit Assembly, Code Quality, Correct Output, Comments/Documentation) and performance levels per criterion. | Must | Rubric builder UI; rubrics are tenant-scoped and reusable across multiple assignments. |
| FR-LRN-111 | When grading a submission, the Teacher **shall** be presented with the Rubric and **shall** select a performance level for each criterion. The system **shall** automatically calculate the total points and score percentage. | Must | Grading panel displayed alongside the read-only student workspace. |
| FR-LRN-112 | Teachers **shall** be able to attach free-text written feedback to a submission. Written feedback **shall** support at minimum plain text; rich text with inline code blocks is a Should. Feedback is private to the student and their Teacher; not visible to peers. | Must | Stored in `submission_feedback.comment`; rendered to student after grade is published. |
| FR-LRN-113 | Teachers **shall** be able to mark a submission for revision and return it to the student with feedback. The student **shall** receive a notification and **shall** be allowed to re-submit. The revision cycle **shall** be capped at a Teacher-configured maximum number of rounds (default: 2). | Should | Revision cycle tracked in `submission_revision_log`; submission status transitions to `revision_requested`. |
| FR-LRN-114 | Grades **shall** be held in a `draft` grading state until the Teacher explicitly publishes them. On publishing, all affected students **shall** be notified simultaneously. Students **shall not** be able to see their grade or feedback before the Teacher publishes. | Must | Grade publish is an atomic batch operation; all student notifications fired in a single event. |
| FR-LRN-115 | Where both auto-grader and manual rubric grades exist for a submission, the system **shall** display both to the Teacher and compute a combined score per a configurable weighting (e.g., 50 % auto / 50 % rubric). The Teacher may override the combined score with a manual adjustment and a required note. | Should | `grade_result.combined_score_pct` = `(auto_score * auto_weight) + (rubric_score * rubric_weight)`. |
| FR-LRN-116 | Peer review sessions, where enabled by the Teacher, **shall** assign submissions to anonymous reviewer students within the same class. Reviewers use a simplified view of the Rubric. Peer review scores are advisory and **shall not** be automatically applied to the official grade without Teacher action. | Could | Peer review is subject to the same safeguarding and content moderation controls defined in FR-COMM. |

---

## Progress and Mastery Tracking

### Progress Data Model

The `learning_progress` table is the authoritative ledger of each student's learning state.

| Field | Type | Notes |
|---|---|---|
| `student_id` | UUID FK → users | PK component. |
| `entity_type` | enum | `track`, `module`, `lesson`, `task`, `quiz`. |
| `entity_id` | UUID | FK to respective entity table. |
| `status` | enum | `not_started`, `in_progress`, `completed`. |
| `mastery_level` | enum | `none`, `completed`, `mastered`. |
| `score_pct` | numeric | nullable; populated for tasks and quizzes. |
| `attempts` | smallint | Submission / attempt count. |
| `started_at` | timestamptz | nullable. |
| `completed_at` | timestamptz | nullable. |
| `last_activity_at` | timestamptz | Updated on any activity. |

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-LRN-120 | The system **shall** maintain a `learning_progress` record for every (student, content entity) pair representing the student's current state in each Track, Module, Lesson, Task, and Quiz they have engaged with. Records are created lazily on first engagement. | Must | Upsert on each meaningful student action (page view, task attempt, quiz submission). |
| FR-LRN-121 | A Module **shall** be considered `completed` when all constituent Lessons are `completed`. A Module **shall** be awarded `mastered` status when: all Lessons are `completed`, the Module Quiz score is ≥ 80 %, and the Capstone Project (if present) has been submitted and received a passing grade from the Teacher or Auto-Grader. | Should | Mastery computation is event-driven; triggered on grade-publish and quiz-result events. |
| FR-LRN-122 | A Track **shall** be considered `completed` when all constituent Modules are `completed`. Track completion triggers the certificate issuance workflow (FR-LRN-130). | Must | Completion check runs asynchronously via a BullMQ job after each module completion event. |
| FR-LRN-123 | The Student **My Progress** dashboard **shall** display: enrolled tracks with overall completion percentage (count of completed modules / total modules), current active module and lesson, activity streak (consecutive calendar days with at least one learning activity), RoboPoints earned from learning, recent badges, and a "recommended next step" link computed from the student's current position. | Must | Dashboard data served from a cached read model updated on each progress event; cache TTL: 5 minutes. |
| FR-LRN-124 | The Teacher **Class Progress View** **shall** display a matrix of all students in the class versus all assigned modules, with colour-coded completion percentage cells, quiz scores, and assignment grades. The view **shall** be sortable by student name, module, or score and filterable by module and status. | Must | Matrix rendered client-side from a paginated API response; supports classes of up to 500 students. |
| FR-LRN-125 | The system **shall** detect students who are 2 or more modules behind the class median completion percentage (threshold configurable by School Admin) and set a flag on their `class_enrolment` record. The Teacher's Class Progress View **shall** highlight flagged students and the Teacher **shall** receive a daily digest notification listing flagged students. | Should | Flag computed nightly by a scheduled background job. Teacher digest notification respects notification preferences (FR-COMM). |
| FR-LRN-126 | Progress data **shall** be exportable by Teachers and School Admins in CSV format. The export **shall** include columns: student display name, student ID (anonymised for external sharing), module title, lesson title, status, score percentage, attempts, and completion date. | Must | Export generated asynchronously for large classes; download link emailed/notified on completion. |

---

## Learning Paths and Prerequisites

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-LRN-140 | The system **shall** enforce Track-level prerequisites: a student **shall not** be able to enrol in a Track if any of its `prerequisite_track_ids` are not `completed` in the student's `learning_progress` record, unless a Teacher or School Admin has recorded an explicit override. | Must | Enrolment API checks prerequisites server-side; UI displays locked state with prerequisite names. |
| FR-LRN-141 | The system **shall** enforce Module-level prerequisites within a Track: a student **shall not** be able to begin a Module if any of its `prerequisite_module_ids` within the same Track are not `completed`, with the same override mechanism. | Must | Lesson navigation within a module is gated at the module entry point. |
| FR-LRN-142 | Teachers **shall** be able to grant prerequisite overrides for individual students or for an entire class from the class management interface. Overrides **shall** be recorded in `prerequisite_override` with the actor, target, reason (free text), and timestamp. | Must | Overrides visible in the student record for audit purposes. |
| FR-LRN-143 | The system **shall** display a visual learning path map on the Student's My Progress dashboard showing Track → Module nodes, prerequisite edges (directed), and each node's completion status colour-coded (`not_started`, `in_progress`, `completed`, `mastered`). | Should | Rendered as an SVG graph; no external diagram library dependency required. |

---

## Certificates and Badges

### Certificate Entity

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | PK. |
| `student_id` | UUID FK → users | — |
| `track_id` | UUID FK → track | — |
| `tenant_id` | UUID FK → tenant | nullable; null = direct (platform-issued). |
| `issued_at` | timestamptz | UTC. |
| `verification_code` | varchar(32) | UNIQUE; random alphanumeric; used in public verification URL. |
| `pdf_url` | varchar(512) | S3 object key of generated PDF. |
| `revoked_at` | timestamptz | nullable; set if certificate is administratively revoked. |

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-LRN-130 | The system **shall** automatically issue a Certificate of Completion when a student's `learning_progress` record for a Track transitions to `completed` (FR-LRN-122). Certificate issuance is idempotent per (student, track) pair. | Must | Idempotency enforced by UNIQUE constraint on `(student_id, track_id)` in `certificates`. |
| FR-LRN-131 | The certificate PDF **shall** include: student full name, track title, completion date, platform name (RoboCode.Africa), platform logo, and the unique verification code and URL. For tenant-issued certificates, the school name and logo (from tenant branding settings, FR-TEN) **shall** replace or supplement the platform branding. | Must | PDF generated server-side via a PDF rendering service (e.g., Puppeteer / headless Chrome) from an HTML template; stored in S3-compatible object storage. |
| FR-LRN-132 | The system **shall** provide a public certificate verification endpoint (`GET /certificates/verify/{verification_code}`) that returns a JSON response containing: student name, track name, completion date, and issuing entity. This endpoint **shall** be accessible without authentication. | Should | Response **shall not** include the student's email, date of birth, or other PII beyond name. GDPR data-minimisation compliance. |
| FR-LRN-133 | The system **shall** award digital Skill Badges for the following trigger events: Module completed, Module mastered, Track completed, first task auto-graded passed, first Quiz passed, cumulative RoboPoints milestones (thresholds defined by Super Admin), and any Teacher Recognition Badge award. Badge award rules are co-defined with the gamification system in *Functional Requirements: Teams, Competitions and Gamification* (FR-GAM). | Must | Badge award events published to a `badge.awarded` event bus; badge service subscribes and creates `student_badge` records. |
| FR-LRN-134 | Students **shall** be able to view all earned certificates and badges on their **My Achievements** profile page. Sharing a certificate or badge via a public link **shall** require the student to be over 16, or for students under 16, require that a Parent/Guardian has granted sharing consent in their consent record. Sharing links direct to the public verification endpoint (FR-LRN-132). | Should | Sharing consent check performed server-side at share-link generation; no client-side bypass. |
| FR-LRN-135 | Teachers **shall** be able to manually award Teacher Recognition Badges to individual students from the class management interface, attaching a brief citation (max 500 characters). Manual badges **shall** be visually distinguished from system-awarded badges on the student's My Achievements page. | Could | `student_badge.source = 'teacher_recognition'`; citation stored in `student_badge.citation`. |

---

## Safeguarding and Data Protection in Learning

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-LRN-150 | All student learning data (progress records, quiz answers, submitted code, circuit snapshots, project files, grades, and feedback) **shall** be classified as personal data and **shall** be subject to the data minimisation, retention, and erasure controls mandated under COPPA, GDPR-K, Zimbabwe Cyber and Data Protection Act, POPIA, NDPR, and Kenya DPA, as enumerated in the *Security, Privacy and Child Safety* section (SR-PRIV). | Must | Retention period configured by Super Admin; default: 3 years post account deactivation or end of school subscription, whichever is sooner. |
| FR-LRN-151 | Student assignment submissions and project workspaces **shall** only be readable by: the submitting student, their assigned Teacher(s), the School Admin of their tenant, and (read-only) the Super Admin for safeguarding/audit purposes. Access control **shall** be enforced at the API layer via PostgreSQL Row-Level Security policies (`FR-TEN`), not solely by application-layer checks. | Must | RLS policy: `student_id = auth.uid() OR teacher_classes @> student_class OR tenant_admin = auth.tenant_id OR super_admin`. |
| FR-LRN-152 | Any free-text content entered by a student in quiz answers, code comments, assignment notes, or project documentation **shall** be passed through the platform's profanity and PII detection filter before being stored or displayed to other users. Flagged content **shall** be queued for Teacher/Moderator review rather than auto-deleted, to avoid incorrect censorship of legitimate technical vocabulary. | Must | Filter integrated as a NestJS middleware on all student-authored text ingest endpoints; see FR-MOD (Communication, Notifications and Moderation). |
| FR-LRN-153 | The Auto-Grader sandbox **shall** not permit student-submitted code to access the network, file system, or host OS resources. All execution **shall** occur within the headless RSE runtime bounded by the simulation model; no system calls beyond those provided by the MCU simulation ABI are accessible. | Must | Sandbox enforced at the container/worker-thread level; network egress blocked by Kubernetes NetworkPolicy or Node.js sandbox controls. |
| FR-LRN-154 | All learning content data at rest **shall** be encrypted (AES-256 or equivalent) in the PostgreSQL database and S3-compatible object store. Data in transit between all services **shall** use TLS 1.2 minimum (TLS 1.3 preferred). | Must | Consistent with NFR-SEC and SR-PRIV requirements. |

---

## MoSCoW Priority Summary

| ID | Requirement Summary | Priority |
|----|---------------------|----------|
| FR-LRN-001 | Five-level content hierarchy with referential integrity | Must |
| FR-LRN-002 | Content status lifecycle (draft / review / published / archived) | Must |
| FR-LRN-003 | Tenant-scope isolation via RLS | Must |
| FR-LRN-004 | Prerequisite enforcement with Teacher override | Must |
| FR-LRN-005 | i18n via content_translations table with locale fallback | Should |
| FR-LRN-010 | Eight content types supported in lesson pages | Must |
| FR-LRN-011 | WYSIWYG/Markdown author editor (ProseMirror) | Must |
| FR-LRN-012 | Adaptive bitrate video (HLS, 240p low-bandwidth tier) | Must |
| FR-LRN-013 | WCAG 2.2 AA video player (captions, speed, keyboard) | Must |
| FR-LRN-014 | Simulation widget as lesson content type | Must |
| FR-LRN-015 | Step pagination with progress indicator | Should |
| FR-LRN-016 | Server-side lesson position persistence | Must |
| FR-LRN-020 | Publishing state machine enforced server-side | Must |
| FR-LRN-021 | Draft save and author preview mode | Must |
| FR-LRN-022 | Review-request routing to Moderator / School Admin queue | Should |
| FR-LRN-023 | Full version history with diff and restore | Should |
| FR-LRN-024 | IMS CC 1.3 / SCORM 2004 import (content migration) | Could |
| FR-LRN-025 | AI primary content Moderator approval gate | Must |
| FR-LRN-060 | Mandatory curriculum tag before global publish | Must |
| FR-LRN-061 | Super Admin-managed tag vocabulary | Must |
| FR-LRN-062 | i18n locale support (authoritative matrix: en-GB, fr-FR, pt-PT, ar, sw; Phase 2: sn, nd, zu, ha, yo, am) | Should |
| FR-LRN-063 | Content library search with multi-facet filter, p95 < 1 s | Must |
| FR-LRN-064 | Curriculum Mapping Report (PDF/CSV export) | Should |
| FR-LRN-070 | Five task types with full entity schema | Must |
| FR-LRN-071 | Starter file with read-only locked scaffold ranges | Must |
| FR-LRN-072 | Rich-text task briefs with embedded media | Should |
| FR-LRN-073 | Timed Challenge countdown with accessibility pause | Should |
| FR-LRN-074 | Debug Challenge with locked circuit | Must |
| FR-LRN-080 | Headless RSE Auto-Grader in isolated container | Must |
| FR-LRN-081 | All five assertion types implemented | Must |
| FR-LRN-082 | Compile path: WASM toolchain / compile microservice; avr8js (UNO), rp2040js (Pico), ESP32 core | Must |
| FR-LRN-083 | Interpret path: RVM in headless RSE | Must |
| FR-LRN-084 | Auto-Grader p95 ≤ 15 s; Kubernetes HPA scaling | Must |
| FR-LRN-085 | 50 test case limit; configurable pass_threshold_pct | Must |
| FR-LRN-086 | GradeResult record with full case-level detail | Must |
| FR-LRN-087 | Test suite authoring UI with dry-run | Must |
| FR-LRN-088 | Test results panel: pass/fail, feedback, no param leakage | Must |
| FR-LRN-089 | Change-detection required before re-submission | Should |
| FR-LRN-090 | knowledge_check and module_quiz quiz types | Must |
| FR-LRN-091 | Five question types; drag_order v2 | Must |
| FR-LRN-092 | Short-answer exact and keyword matching modes | Must |
| FR-LRN-093 | Immediate quiz results with per-question feedback | Must |
| FR-LRN-094 | Failed quiz cooldown; Teacher reset | Should |
| FR-LRN-095 | quiz_attempt table persisting all attempts | Must |
| FR-LRN-096 | Server-side quiz deadline enforcement | Should |
| FR-LRN-100 | Teacher creates multi-item Assignments for classes/students | Must |
| FR-LRN-101 | Assignment published notification + 24 h reminder | Must |
| FR-LRN-102 | Student My Assignments dashboard | Must |
| FR-LRN-103 | Submission record + Teacher Grading Queue notification | Must |
| FR-LRN-104 | Teacher read-only workspace view of submission | Must |
| FR-LRN-105 | Late policy (rejected / penalised) enforced server-side | Must |
| FR-LRN-110 | Reusable rubric entity with weighted criteria | Must |
| FR-LRN-111 | Rubric grading panel alongside student workspace | Must |
| FR-LRN-112 | Teacher written feedback on submission | Must |
| FR-LRN-113 | Revision-requested cycle with Teacher-configured max rounds | Should |
| FR-LRN-114 | Grades held in draft; atomic batch publish | Must |
| FR-LRN-115 | Combined auto + rubric score with Teacher override | Should |
| FR-LRN-116 | Anonymous peer review sessions (Teacher-enabled) | Could |
| FR-LRN-120 | learning_progress ledger per (student, entity) pair | Must |
| FR-LRN-121 | Module mastery: all lessons + 80 % quiz + capstone pass | Should |
| FR-LRN-122 | Track completion triggers certificate issuance | Must |
| FR-LRN-123 | Student My Progress dashboard with streak and next step | Must |
| FR-LRN-124 | Teacher Class Progress View matrix up to 500 students | Must |
| FR-LRN-125 | Behind-median student flag; daily Teacher digest | Should |
| FR-LRN-126 | CSV export of progress data | Must |
| FR-LRN-130 | Idempotent Certificate issuance on Track completion | Must |
| FR-LRN-131 | Certificate PDF with branding; white-label school logo | Must |
| FR-LRN-132 | Public unauthenticated certificate verification endpoint | Should |
| FR-LRN-133 | Skill Badge awards for learning milestones | Must |
| FR-LRN-134 | My Achievements page; share links consent-gated for minors | Should |
| FR-LRN-135 | Teacher Recognition Badges (manual, with citation) | Could |
| FR-LRN-140 | Track-level prerequisite enforcement | Must |
| FR-LRN-141 | Module-level prerequisite enforcement within Track | Must |
| FR-LRN-142 | Teacher/Admin prerequisite override with audit record | Must |
| FR-LRN-143 | Visual learning path map on My Progress dashboard | Should |
| FR-LRN-150 | Learning data subject to multi-jurisdiction data protection | Must |
| FR-LRN-151 | Submission access restricted; RLS enforced | Must |
| FR-LRN-152 | Profanity/PII filter on all student free-text ingest | Must |
| FR-LRN-153 | Auto-Grader sandbox blocks network/filesystem access | Must |
| FR-LRN-154 | Data at rest AES-256; data in transit TLS 1.2+ | Must |

---

## Cross-References

- **FR-AUTH** (Identity, Authentication and Authorization): account approval, RBAC scopes (`content:write`, `task:submit`, `class:*`), session tokens, RLS JWT claims.
- **FR-TEN** (Multi-Tenancy, Custom Domains and White-Labelling): tenant isolation, subdomain routing, school branding applied to certificates, RLS `tenant_id` enforcement.
- **FR-SIM** (RoboCode Simulation Engine): headless RSE used by the Auto-Grader; component behavioural models driving assertion telemetry; Guided Tutorial mode canvas gating; avr8js (Arduino UNO R3), rp2040js (Raspberry Pi Pico / RP2040), and ESP32 core simulation targets; wokwi-boards extensible board definitions.
- **FR-CODE** (Code Authoring, Validation and Execution): Monaco editor scaffold regions; WASM compile path for Arduino C/C++, MicroPython, and CircuitPython; RVM interpret path; Serial output capture used by `serial_output` assertions; board-target binding (avr8js / rp2040js / ESP32 core).
- **FR-GAM** (Teams, Competitions and Gamification): RoboPoints earned from learning completions; Skill Badge co-definition; Leaderboard data sourced from `learning_progress`.
- **FR-COMM** (Communication, Notifications and Moderation): assignment published / due-reminder / grade-published / revision-requested notification events; profanity/PII filter pipeline; safeguarding escalation for flagged student content.
- **FR-ADM** (Administration, Analytics and Reporting): Teacher Grading Queue UI; Class Progress View; Curriculum Mapping Report; progress CSV export; global content library management by Super Admin.
- **DR-LRN** (Data Architecture): `learning_progress`, `submission`, `grade_result`, `quiz_attempt`, `certificate`, `student_badge` table schemas; index design for class-wide queries.
- **NFR-PERF** (Non-Functional Requirements — Performance): Auto-Grader p95 latency ≤ 15 s; Class Progress View load ≤ 2 s; content library search p95 ≤ 1 s.
- **NFR-LBW** (Accessibility, Internationalisation and Low-Bandwidth Design): adaptive video tiers; lesson page size budgets; offline-friendly content caching (roadmap).
- **SR-PRIV** (Security, Privacy and Child Safety): minor data minimisation; consent-gated sharing; retention and erasure schedules; Auto-Grader sandbox isolation.
- **UR-LRN** (User Requirements: Learning, Courses, Tasks and Assessment): source user requirements fully traced in this section; all UR-LRN-001–064 addressed by FR-LRN requirements above.
