# Functional Requirements: Teams, Competitions and Gamification

## Overview

This section specifies the functional requirements governing team management, the competition and tournament engine, the RoboPoints currency, levels, badges, leaderboard services, and season mechanics within RoboCode.Africa. Requirements are assigned the prefixes **FR-TEAM-nnn** (team and competition) and **FR-GAM-nnn** (gamification). All requirements in this section intersect with the child-safety prime directive; where a requirement conflicts with convenience or feature richness, safety and data-protection obligations take precedence unconditionally.

The systems specified here depend on foundational capabilities described in:

- **Functional Requirements: Identity, Authentication and Authorization** (FR-AUTH) — role enforcement and RBAC underpinning all permission checks.
- **Functional Requirements: Multi-Tenancy, Custom Domains and White-Labelling** (FR-TEN) — tenant isolation and cross-tenant data boundaries.
- **Functional Requirements: RoboCode Studio IDE** (FR-STU), **Functional Requirements: RoboCode Simulation Engine** (FR-SIM), and **Functional Requirements: Code Authoring, Validation and Execution** (FR-CODE) — the canvas, simulation engine, and code execution environment used within competition challenges.
- **Functional Requirements: Learning Management and Content** (FR-LRN) — task and course completion events that feed the RoboPoints ledger.
- **Functional Requirements: Communication, Notifications and Moderation** (FR-COMM, FR-MOD) — notification delivery channels, content moderation, and safeguarding rules that apply to all team and competition interactions.
- **Functional Requirements: Administration, Analytics and Reporting** (FR-ADM) — audit logging, dashboards, and reports that surface team and competition data.

---

## Part 1: Team Management

### Team CRUD Within a Tenant

Teams are the primary social unit for collaborative work and competition participation. Each team is scoped to a school tenant unless it is formed as part of a cross-tenant competition (see Cross-Tenant Teams).

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-TEAM-001 | The platform **shall** allow a Student to create a named team within the school tenant to which their account belongs. | Must | Team name: unique per tenant; 3–64 UTF-8 characters; profanity-filtered at creation time. |
| FR-TEAM-002 | The platform **shall** allow a Teacher or School Admin to create teams on behalf of students. | Must | Necessary for primary-school cohorts and class-organised events where students are too young to self-organise. |
| FR-TEAM-003 | The platform **shall** enforce a configurable minimum and maximum team size per competition event or per school policy, defaulting to min 1, max 6. | Must | School Admin sets school default; Teacher overrides per competition. Super Admin sets platform hard maximum (12). |
| FR-TEAM-004 | The platform **shall** allow a student to be a member of multiple standing (non-competition) teams simultaneously, up to a platform-configured cap (default: 5 teams). | Should | Students compete in at most one team per competition simultaneously (FR-TEAM-030). |
| FR-TEAM-005 | The platform **shall** provide a team profile page visible within the tenant, displaying: team name, current members with display names and levels, RoboPoints total for the current season, shared public projects, competition history, and earned badges. | Should | School Admin may restrict team profiles to within-school visibility only. |
| FR-TEAM-006 | The Captain **shall** be able to rename the team, update the team avatar (image, max 2 MB, content-moderated before display), and update the team description. | Should | Avatar upload triggers the platform content-moderation pipeline (FR-MOD). |
| FR-TEAM-007 | The platform **shall** delete a team when it has zero members after the Captain leaves or is removed and no Teacher/Admin reassigns a new Captain within 48 hours. | Must | Orphaned teams without members are garbage-collected. Deletion is soft-delete; data retained per policy. |

### Team Roles and Membership

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-TEAM-010 | Every team **shall** have exactly one Captain at all times. The Student who creates the team is automatically assigned the Captain role. | Must | The system must enforce the invariant: a Captain vacancy triggers immediate resolution before persisting the state (see FR-TEAM-013). |
| FR-TEAM-011 | The Captain **shall** be able to invite students (by username or school email address) within the same school tenant to join the team. | Must | Invitations are delivered via the in-platform notification system; no direct unsupervised private message is sent between minors. |
| FR-TEAM-012 | The Captain **shall** be able to remove a Member from the team, subject to any active competition freeze period (see FR-TEAM-031). | Must | Removals during a freeze period require Teacher or School Admin counter-approval. |
| FR-TEAM-013 | The Captain **shall** be able to transfer the Captain role to any current Member. The transfer requires acceptance by the receiving Member before taking effect. | Should | If the Captain's account is deactivated or suspended, the system shall automatically prompt remaining members or the supervising Teacher to elect a new Captain. |
| FR-TEAM-014 | A Member **shall** be able to leave a team voluntarily, subject to competition freeze rules. | Must | Members are notified of freeze-period restrictions before confirming departure. |
| FR-TEAM-015 | Members **shall** be able to view the team profile, shared projects, competition standings, and team communication channels enabled by the Teacher. | Must | Read access is always granted; write access to shared projects governed by collaboration rules (FR-TEAM-060 through FR-TEAM-075). |

### Invitations and Approvals

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-TEAM-020 | Team invitations **shall** be delivered exclusively through the in-platform notification system and optionally via email; no unmoderated direct message between minor students is permitted. | Must | Safeguarding constraint; cross-reference FR-COMM and FR-AUTH-108. |
| FR-TEAM-021 | An invited student **shall** explicitly accept or decline a team invitation; acceptance is never automatic. Invitations **shall** expire after a configurable period (default: 7 days). | Must | Expired invitations are purged from the notification queue. |
| FR-TEAM-022 | For students under 16, a School Admin **shall** be able to configure the school policy so that all team-join actions additionally require Teacher counter-approval before the membership becomes effective. | Should | Required for schools with strict safeguarding policies. |
| FR-TEAM-023 | The platform **shall** write an audit log entry for every team invitation event: invitation sent, accepted, declined, expired, and revoked. Each entry **shall** include actor identity, target identity, team ID, tenant ID, and UTC timestamp. | Must | Audit entries are immutable; retained per FR-ADM data-retention policy (minimum 3 years). |

### Cross-Tenant Teams

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-TEAM-025 | The platform **shall** support cross-tenant (inter-school) teams formed exclusively within the context of an inter-school competition, brokered through the competition management interface. | Must | Cross-tenant team membership is approved by the School Admins of all participating tenants. |
| FR-TEAM-026 | Cross-tenant team invitations **shall not** expose personal identifiers (real names, email addresses, school-internal IDs) of students at one school to students at another school. Only display names and school names **shall** be visible across tenant boundaries. | Must | GDPR-K, COPPA, and POPIA privacy constraints; cross-reference FR-TEN-RLS. |
| FR-TEAM-027 | Cross-tenant team membership records **shall** be scoped to the lifetime of the competition that created them. At competition conclusion, the cross-tenant membership association is archived but the underlying student accounts remain in their respective tenants. | Must | No persistent cross-school social graph is created. |

---

## Part 2: Shared Team Projects and Real-Time Collaboration

### Project Ownership and Visibility

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-TEAM-050 | A team **shall** be able to create one or more shared projects in RoboCode Studio that are associated with the team record and accessible to all current team members. | Must | Shared projects inherit the team's tenant scope. |
| FR-TEAM-051 | The Captain **shall** be able to set a team project visibility as: Private (team members only), School-visible (all authenticated users in the tenant), or Public (platform-wide gallery). | Must | Public projects are subject to moderation review before appearing in the global gallery (FR-MOD). |
| FR-TEAM-052 | A Teacher **shall** be able to fork a team's project for grading, annotation, or exemplar purposes without modifying the original. | Must | Fork creates a new project record attributed to the Teacher; the original team project is unchanged. |
| FR-TEAM-053 | Shared project metadata **shall** identify all contributing authors by their display names, with contribution timestamps, to support academic integrity assessment. | Must | Real names are not displayed; only display names and contribution metrics. |

### Real-Time Concurrent Editing

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-TEAM-060 | Team members **shall** be able to open a shared project in RoboCode Studio and edit it concurrently in real time. Concurrent edits are synchronised via Yjs CRDT over Socket.IO WebSocket connections authenticated using short-lived JWTs (FR-AUTH-076). | Must | The Yjs CRDT document encompasses both the schematic canvas state and the Monaco code editor state. |
| FR-TEAM-061 | Each collaborator's cursor position, selected component, and active code-editor line **shall** be visible to all other active collaborators via a distinct colour-coded presence indicator showing the student's display name. | Must | At most 8 concurrent colour slots; additional collaborators are grouped under a "+N" overflow indicator. |
| FR-TEAM-062 | The platform **shall** prevent unresolvable conflicting simultaneous edits to the same wiring connection, component pin assignment, or component placement coordinates through CRDT structural merge semantics. Last-write-wins is not acceptable for wiring topology changes. | Must | Conflict resolution algorithm documented in the API Specification and Integration Interfaces section. |
| FR-TEAM-063 | The platform **shall** maintain a versioned snapshot history of shared project changes. A minimum of 30 named snapshots **shall** be retained; older snapshots are pruned by the platform retention policy. A Teacher or Captain **shall** be able to restore any retained snapshot. | Must | Snapshot retention is a school-plan feature; free-plan tenants retain 10 snapshots. |
| FR-TEAM-064 | A Teacher assigned to the class containing the team **shall** be able to join any shared team project as a read-only observer or in an annotate-only mode (inline comments visible to all members) without interfering with student edits. | Must | Teacher's presence indicator is distinctly styled to distinguish it from student collaborators. |
| FR-TEAM-065 | The platform **shall** support asynchronous offline collaboration: a team member who is offline **shall** be able to open the last synced CRDT document state. On reconnection, their local changes **shall** be merged with the live document using Yjs merge semantics. Structural conflicts (if any) **shall** be surfaced to the Captain for resolution. | Should | Offline operation requires the client-side service worker to cache the Yjs document; see Functional Requirements: RoboCode Studio IDE. |
| FR-TEAM-066 | A student **shall** be able to add inline comments to components on the canvas or to code lines within a shared project. Comments are visible to all team members and the supervising Teacher. Comment text **shall** pass through the profanity/PII content filter before display. | Should | Comments are not a real-time chat channel; they are asynchronous annotations attached to project artefacts. |

---

## Part 3: Competition and Tournament Engine

### Competition Lifecycle Overview

```
COMPETITION LIFECYCLE STATE MACHINE
─────────────────────────────────────────────────────────────────────────
  [Creator configures]
         │
         ▼
  ┌──────────────┐  publish   ┌───────────────┐  registration  ┌──────────────┐
  │    DRAFT     │ ─────────► │   PUBLISHED   │  deadline      │ REGISTRATION │
  │ (creator     │            │  (visible to  │  not yet open  │    OPEN      │
  │  only)       │ ◄───────── │  eligible     │ ─────────────► │              │
  └──────────────┘  unpublish │  users)       │                └──────┬───────┘
                              └───────────────┘                       │
         ▲                                                            │ deadline passes
         │ postpone ◄──────────────────────────────────────────────── │
         │                                                            ▼
  ┌──────────────┐                                           ┌───────────────┐
  │  CANCELLED   │ ◄──────────── creator/admin cancels ───── │  IN PROGRESS  │
  └──────────────┘                                           │  (rounds      │
                                                             │   active)     │
                                                             └──────┬────────┘
                                                                    │ all rounds
                                                                    │ complete
                                                                    ▼
                                                           ┌───────────────┐
                                                           │    SCORING    │
                                                           │  (judging     │
                                                           │   pipeline)   │
                                                           └──────┬────────┘
                                                                  │ scores
                                                                  │ released
                                                                  ▼
                                                           ┌───────────────┐
                                                           │   CONCLUDED   │
                                                           │  (archived)   │
                                                           └───────────────┘
─────────────────────────────────────────────────────────────────────────
```

### Competition Creation and Configuration

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-TEAM-100 | A Teacher **shall** be able to create an intra-school competition, visible only to students and teams within their school tenant. | Must | Teacher-created competitions are not visible to other tenants. |
| FR-TEAM-101 | A School Admin **shall** be able to create school-level competitions and open them to inter-school participation by inviting other school tenants. | Must | Inter-school competitions require Super Admin or Platform Moderator review and approval before registration opens (FR-TEAM-102). |
| FR-TEAM-102 | A Super Admin or Platform Moderator **shall** review and approve any inter-school competition before it opens for registration. The approval decision and reviewer identity **shall** be recorded in the audit log. | Must | Prevents unsanctioned cross-school contact between minors. |
| FR-TEAM-103 | A Super Admin **shall** be able to create platform-wide competitions open to all registered students or all school tenants. | Must | Platform-wide competitions are visible in the global competition catalogue. |
| FR-TEAM-104 | A competition creator **shall** be able to configure the following attributes: name; description; start and end dates; registration deadline; eligibility rules (grade levels, age ranges, school, platform-wide); participation mode (team-only, individual-only, or open); minimum and maximum participants; challenge list; scoring weights; judging method; score-release date; and public or private visibility. | Must | Validation enforces logical consistency (e.g., registration deadline before start date). |
| FR-TEAM-105 | A competition **shall** support multiple sequential rounds (e.g., Qualifier, Semi-Final, Final), each with an independent deadline, challenge set, bracket configuration, and advancement rule. | Must | Rounds are numbered and ordered; a student or team advances to the next round only if the advancement rule is met. |
| FR-TEAM-106 | The platform **shall** enforce registration deadlines server-side. No new team or individual may register after the deadline unless the competition creator explicitly opens a late-registration window. | Must | Server-authoritative timestamps; client clocks are not trusted (FR-TEAM-155). |
| FR-TEAM-107 | A competition creator **shall** be able to publish, unpublish, postpone, or cancel a competition at any time. All enrolled participants **shall** be notified of any lifecycle state change via the notification system (FR-COMM). | Must | Cancellation triggers a notification to School Admins and Teacher supervisors in addition to participants. |
| FR-TEAM-108 | A Super Admin **shall** be able to clone an existing competition as a template, retaining all configuration but clearing participant registrations, submissions, and scores. | Should | Accelerates recurring event setup (e.g., annual robotics championships). |

### Challenge Types

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-TEAM-110 | A competition **shall** support Coding Challenges, where participants write Arduino C/C++ or MicroPython code to fulfil a specification. Submissions are evaluated by automated test cases executed against the RSE and/or a manual rubric. | Must | Cross-reference Functional Requirements: Code Authoring, Validation and Execution (FR-CODE). |
| FR-TEAM-111 | A competition **shall** support Robotics Simulator Build Challenges, where participants construct a circuit on the RoboCode Studio canvas (components, breadboard, wiring) and write supporting code. The full simulator state (JSON schematic + source code) constitutes the submission artefact. | Must | Cross-reference Functional Requirements: RoboCode Simulation Engine (FR-SIM). |
| FR-TEAM-112 | A competition **shall** support AI Task Challenges, where participants design, train, or integrate a machine-learning or rule-based AI component within a RoboCode Studio project (e.g., gesture recognition via MPU6050, sensor-fusion logic). | Should | AI task judging always includes a human rubric component given interpretive complexity. |
| FR-TEAM-113 | A single competition **shall** be able to include a mix of challenge types across its rounds. | Should | Example: Qualifier is a Coding Challenge; Final is a Robotics Simulator Build. |
| FR-TEAM-114 | Each challenge **shall** carry the following metadata: title; description; resource and reference links; optional starter project (forked into each participant's workspace on registration); required components list; evaluation criteria; maximum score; per-criterion weight (for rubric judging); and estimated difficulty tier (1–5). | Must | Required components list is validated against the Component and Sensor Library Specification (Section 10). |

### Participant Registration

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-TEAM-120 | A student who is not part of a team **shall** be able to register as an individual participant in competitions that allow individual entries. The platform shall treat an individual entry as a single-member pseudo-team for all scoring, submission, and leaderboard purposes. | Must | Individual participants have access to all challenge materials and submission workflows identically to team participants. |
| FR-TEAM-121 | At registration, participants **shall** be presented with the competition's explicit fair-play rules and **shall** be required to acknowledge them (checkbox + server-recorded timestamp) before registration is confirmed. | Must | Acknowledgement is recorded in the audit log. |
| FR-TEAM-122 | A student's registration eligibility **shall** be evaluated against the competition's eligibility rules (age band, grade level, school, tenant) at registration time. Ineligible participants are blocked with a clear explanation. | Must | Age check is derived from the date-of-birth stored on the account (FR-AUTH-005). |

### Submission Workflow

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-TEAM-130 | A team (submitted by the Captain) or an individual participant **shall** be able to submit a challenge response before the challenge deadline. | Must | The Captain is the only team member with submit authority; other members may save drafts. |
| FR-TEAM-131 | The platform **shall** allow multiple draft saves of a submission artefact before final submission. Only the explicitly finalised submission is forwarded to the judging pipeline. | Must | Drafts are versioned and recoverable by the Captain or Teacher. |
| FR-TEAM-132 | Once a submission is finalised, the artefact **shall** be immutable. The Captain or individual **shall not** be able to modify it unless the competition creator opens a resubmission window. | Must | Immutability protects fair-play integrity. Any resubmission window is audit-logged. |
| FR-TEAM-133 | The platform **shall** capture and store: submission timestamp (server-authoritative UTC); submitting user ID; team ID (or pseudo-team ID for individuals); challenge ID; competition ID; tenant ID; and a SHA-256 cryptographic hash of the submission artefact (code + schematic JSON) in the audit log. | Must | Hash enables tamper-detection and supports dispute resolution. |
| FR-TEAM-134 | The platform **shall** send a submission-receipt notification to the Captain (or individual) and to the supervising Teacher via the notification system, confirming the submission timestamp and artefact hash. | Must | Email and in-platform notification at minimum. |
| FR-TEAM-135 | Late submissions **shall** be automatically rejected after the deadline. A configurable grace period (default: 0 minutes) **shall** be available to competition creators for special circumstances. Grace period usage is audit-logged. | Must | Server-clock is authoritative. |

### Judging Pipeline — Automated Scoring

```
AUTOMATED JUDGING PIPELINE
────────────────────────────────────────────────────────────────────────
  Submission            Judging Worker (NestJS + Bull Queue)
  Finalised  ─────►   ┌─────────────────────────────────────────┐
                       │ 1. Retrieve artefact from S3             │
                       │ 2. Verify SHA-256 hash                   │
                       │ 3. Spawn isolated RSE sandbox instance   │
                       │ 4. Load firmware / schematic             │
                       │ 5. Execute test cases (max 120 s TTL)    │
                       │ 6. Collect pass/fail per test case       │
                       │ 7. Aggregate score (weighted)            │
                       │ 8. Write result to DB + audit log        │
                       └───────────────────┬─────────────────────┘
                                           │
                       ┌───────────────────▼─────────────────────┐
                       │ Score visible at reveal_time?             │
                       │  Yes → publish to participant            │
                       │  No  → held in escrow until reveal_time  │
                       └─────────────────────────────────────────┘
────────────────────────────────────────────────────────────────────────
```

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-TEAM-140 | The platform **shall** support automated evaluation of Coding Challenges by executing submitted firmware against a set of hidden test cases within an isolated RSE sandbox instance. Pass/fail and score are reported per test case. | Must | Test cases are authored by the challenge creator using the same RSE runtime environment. Test case inputs and expected outputs are not visible to participants before results are released. |
| FR-TEAM-141 | Automated scoring **shall** complete within a configurable timeout (default: 120 seconds per submission). A timeout failure **shall** be recorded as a zero score with a `TIMEOUT` status and reported to the judging dashboard. | Must | Timeout is enforced at the worker process level; RSE sandbox is terminated on timeout. |
| FR-TEAM-142 | For Robotics Simulator Build Challenges, the automated checker **shall** validate: (a) the submitted schematic contains all required components; (b) the wiring topology matches the specification; and (c) when the firmware is executed in the RSE, the required pin/output states are achieved within the timeout. | Must | Schematic validation uses the JSON schematic format defined in Functional Requirements: RoboCode Simulation Engine. |
| FR-TEAM-143 | Automated scores **shall** be published to participants at the score-release date configured by the competition creator, or immediately if no release date is set. | Must | Scores held in escrow in the database; release is a scheduled job. |
| FR-TEAM-144 | The automated judging worker **shall** be horizontally scalable. Multiple simultaneous submissions in a large competition (up to 500 concurrent) **shall** be handled without queue starvation. | Must | Bull queue (Redis-backed) with configurable worker concurrency; see Infrastructure, Deployment and DevOps section. |

### Judging Pipeline — Manual Rubric Scoring

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-TEAM-150 | A Teacher or designated competition judge **shall** be able to access a judging dashboard listing all submissions for their assigned challenge, ordered by submission time. | Must | Judges are assigned by the competition creator; the assignment is audit-logged. |
| FR-TEAM-151 | The judging dashboard **shall** display, for each submission: the full submission artefact (source code, schematic viewer, and a live playback of the RSE simulation); the rubric criteria; a numeric or level-based scoring control per criterion; and a free-text feedback field per criterion. | Must | The live RSE simulation replay is driven by the submitted firmware and schematic; it is read-only and cannot be modified by the judge. |
| FR-TEAM-152 | The platform **shall** support multiple independent judges scoring the same submission. The final rubric score **shall** be the mean of all judges' scores (or a weighted aggregation configured by the competition creator). | Should | Reduces individual judge bias in high-stakes events. Aggregation formula is disclosed to participants in the competition rules. |
| FR-TEAM-153 | Judges **shall not** be able to view scores submitted by other judges for the same submission until after the competition's score-release date, preventing anchoring bias. | Should | Enforced at the API layer; judge score records are hidden from cross-judge queries until the release date. |
| FR-TEAM-154 | Judge scores and written feedback **shall** be delivered to the team or individual at the competition's score-release date. Feedback text **shall** be stored in the audit log and linked to the judge identity and submission record. | Must | Feedback is retained for the minimum audit-retention period (3 years). |

### Brackets, Rounds, Scoring, and Tiebreakers

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-TEAM-155 | The competition creator **shall** be able to configure the bracket format per round: single-elimination, double-elimination, round-robin, or points-table (no bracket). | Must | Points-table format is the default for intra-school competitions. |
| FR-TEAM-156 | The platform **shall** automatically populate bracket matchups from registered teams or individuals at the start of each round, using seeding derived from prior-round scores or a random draw as configured by the competition creator. | Must | Bracket population is deterministic given the same seed; the algorithm is disclosed in the competition configuration UI. |
| FR-TEAM-157 | The participant-facing competition page **shall** display: the current bracket or standings table; each team's or individual's score; round schedule and remaining time to the next deadline; and submission status for the current round. | Must | Countdown timer is rendered client-side from a server-provided deadline timestamp. |
| FR-TEAM-158 | The overall competition score **shall** be calculated as the weighted sum of automated test-case score and rubric score, using per-challenge weights configured by the competition creator. For multi-round competitions, round scores are aggregated by the configured advancement rule. | Must | Score calculation formula is published to participants in the competition rules. |
| FR-TEAM-159 | Score ties **shall** be broken in the following priority order: (1) rubric score, (2) automated test-case score, (3) earliest submission timestamp, (4) random draw (seeded, reproducible). The active tiebreaker is disclosed in the competition rules. | Must | Tiebreaker sequence is immutable once a competition is published. |
| FR-TEAM-160 | The competition leaderboard **shall** update within 60 seconds of an automated score being published or a judge releasing scores. | Must | Redis sorted-set update triggers a WebSocket push to connected clients viewing the competition page. |

### Results Publication and Awards

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-TEAM-165 | At competition conclusion, winning teams and individuals **shall** automatically receive a configured RoboPoints award, scaled by placement (1st, 2nd, 3rd, participation). Awards are posted to the RoboPoints ledger (FR-GAM-200 through FR-GAM-215). | Must | RoboPoints are credited only after the competition state transitions to CONCLUDED. |
| FR-TEAM-166 | The platform **shall** generate a digital certificate (downloadable PDF) for competition winners and finalists. The certificate template is customisable by the competition creator (school logo, custom wording). | Should | Certificate generation is a background job triggered at competition conclusion. |
| FR-TEAM-167 | Achievement badges earned through competition placements **shall** be permanently recorded on both the student's individual profile and the team profile, regardless of subsequent season resets. | Should | Badge permanence is consistent with FR-GAM-285 (badges never reset). |
| FR-TEAM-168 | The final competition results page **shall** be publicly visible (at school scope for intra-school, at platform scope for inter-school) to all authenticated users, displaying only display names and school names. Real names and contact information are never exposed. | Must | Privacy constraint; enforced at the API serialisation layer. |

### Fair-Play and Integrity

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-TEAM-170 | The platform **shall** detect suspiciously similar code submissions within the same competition challenge using AST-based structural similarity analysis. Submissions exceeding a configurable similarity threshold **shall** be flagged for Teacher/judge review. | Must | Flagging is advisory; no automatic disqualification based solely on automated detection. Flagged pairs are presented side-by-side in the judging dashboard. |
| FR-TEAM-171 | A competition creator or Super Admin **shall** be able to disqualify a team or individual from a competition. A mandatory reason must be recorded; the decision is written to the immutable audit log. The affected student(s), their Teacher, and their School Admin **shall** be notified. | Must | Disqualification triggers RoboPoints revocation for competition awards already credited. |
| FR-TEAM-172 | Submission timestamps **shall** be server-authoritative. Client-side clocks are not trusted for deadline enforcement. The server-clock is synchronised via NTP and its drift is monitored; an alert fires if drift exceeds 1 second. | Must | See Observability, Logging, Monitoring and Support section. |
| FR-TEAM-173 | All judging decisions, score adjustments, disqualifications, and appeal outcomes **shall** be recorded in the immutable audit log with the actor identity, action, timestamp, and free-text justification. | Must | Supports dispute resolution, regulatory inspection, and parent/guardian queries. |
| FR-TEAM-174 | A student or team **shall** be able to raise a formal appeal against a scoring decision via a structured appeal form. Appeals are routed to the competition creator; unresolved appeals are escalated to a Super Admin or Platform Moderator within a configurable escalation window (default: 5 business days). | Should | Appeal submissions are acknowledgement-stamped and the student is notified of the current status. |

---

## Part 4: Gamification — RoboPoints Engine

### RoboPoints Ledger and Idempotency

The RoboPoints engine maintains a transactional ledger of all point-earning and point-deduction events. The ledger is the authoritative source for all leaderboard queries, reward redemptions, and season archives.

```
ROBOPOINTS LEDGER SERVICE
────────────────────────────────────────────────────────────────────────
  Earning Event                  Ledger Service (NestJS)
  ─────────────────              ─────────────────────────────────────
  Task completed    ─────────►  ┌──────────────────────────────────┐
  Course unit done  ─────────►  │ 1. Validate event source token   │
  Simulation run    ─────────►  │    (RSE heartbeat / grader JWT)  │
  Competition win   ─────────►  │ 2. Check idempotency key in      │
  Streak milestone  ─────────►  │    Redis (TTL: 24 h)             │
  Teacher award     ─────────►  │ 3. INSERT ledger row (Postgres)  │
                                │ 4. Update Redis sorted set       │
                                │    (leaderboard score)           │
                                │ 5. Publish event to notification  │
                                │    bus (point award notification) │
                                └──────────────────────────────────┘
────────────────────────────────────────────────────────────────────────
```

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-GAM-200 | The platform **shall** maintain a RoboPoints ledger table in PostgreSQL for each student, recording every credit and debit event with: event type; amount; source reference (task ID, competition ID, teacher ID, etc.); idempotency key; tenant ID; and UTC timestamp. | Must | Ledger rows are append-only (no UPDATE/DELETE). Point balance is derived by summing the ledger. |
| FR-GAM-201 | Every point-earning event **shall** carry a unique idempotency key. The ledger service **shall** reject duplicate submissions of the same idempotency key within a 24-hour window, preventing double-crediting from network retries or replays. | Must | Idempotency keys are stored in Redis with a 24-hour TTL for fast lookup before the database write. |
| FR-GAM-202 | Simulation-run point events **shall** be validated against an RSE session heartbeat token issued by the RoboCode Simulation Engine. A point event that cannot present a valid token **shall** be rejected with a fraud-flag. | Must | Prevents scripted point-farming via direct API calls. RSE token scheme defined in Functional Requirements: RoboCode Simulation Engine. |
| FR-GAM-203 | The platform **shall** credit RoboPoints and XP to a student on verified completion of the following event types, at the base values shown in the Reference Point Schedule below (configurable per School Admin within the range 0.5× to 2×). | Must | School Admin multipliers are stored per tenant and applied at award time; default multiplier is 1×. |
| FR-GAM-204 | A Teacher **shall** be able to manually award or deduct a configurable number of RoboPoints to/from any student in their class, with a mandatory free-text reason field, subject to a School Admin-defined per-transaction cap (default: ±500 points). | Must | All manual adjustments are audit-logged with actor identity, reason, and timestamp. Deductions are bounded to prevent a negative total-season balance. |
| FR-GAM-205 | RoboPoints awarded in connection with a submission subsequently found to be fraudulent or plagiarised **shall** be revoked automatically upon confirmation of the anti-cheat decision (FR-GAM-310). Revocation is a signed debit ledger entry; the student is notified. | Must | Revocation does not remove the original credit entry; the ledger is always append-only. |

### Reference Point Schedule

| Earning Event | Base RoboPoints | Base XP | Notes |
|---------------|-----------------|---------|-------|
| Task completion (standard) | 50 | 50 | Scaled by task difficulty tier (1–5): ×tier |
| Task completion — first-attempt bonus | +25 | +25 | Added on top of base; not multiplied again |
| Project save + simulation run | 10 | 10 | Once per project per calendar day |
| Course unit completion | 30 | 30 | Proportional for partial completion |
| Competition participation | 20 | 10 | All registered entrants who submit |
| Competition 3rd place | +100 | +75 | Team or individual |
| Competition 2nd place | +200 | +125 | Team or individual |
| Competition 1st place | +350 | +200 | Team or individual |
| Daily activity streak (3+ days active) | 15/day | 10/day | Meaningful action required (not mere login) |
| 7-day streak milestone | +50 | +30 | One-off per streak run |
| 14-day streak milestone | +100 | +60 | One-off per streak run |
| 30-day streak milestone | +300 | +150 | One-off per streak run |
| Teacher peer-help endorsement | 40 | 20 | Per endorsed public post; Teacher must approve |
| Manual Teacher award | Configurable | 0 | XP not affected by manual awards |

---

## Part 5: Experience Points (XP) and Levels

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-GAM-220 | The platform **shall** maintain a separate, lifetime XP tally for each student that accumulates monotonically and is never reset by season changes or account transfers. | Must | XP and RoboPoints are distinct accumulators; XP drives levels, RoboPoints drive leaderboards. |
| FR-GAM-221 | The platform **shall** map XP to a named Level using a progressive threshold table (Level 1 through Level 20). The current Level and XP progress bar toward the next Level **shall** be displayed persistently in the platform navigation header when the student is logged in. | Must | Level names from the Reference Level Table below. |
| FR-GAM-222 | Reaching a new Level **shall** trigger: an in-platform notification; a visual celebration animation within RoboCode Studio (skippable; must not interrupt an active simulation or code run); and a badge award if a Level milestone badge exists. | Should | Animation is a lightweight CSS/canvas animation; does not block the main thread. |
| FR-GAM-223 | Level thresholds and Level names **shall** be configurable by a Super Admin without a code deployment, via a configuration panel backed by a database table. Changes apply to all tenants globally. | Should | Enables post-launch balancing of progression pace without a release cycle. |

### Reference Level Table

| Level | Name | Cumulative XP Required |
|-------|------|------------------------|
| 1 | Circuit Beginner | 0 |
| 2 | Wire Connector | 200 |
| 3 | LED Tinkerer | 500 |
| 4 | Breadboard Builder | 900 |
| 5 | Sensor Scout | 1,400 |
| 6 | Code Cadet | 2,000 |
| 7 | Signal Sender | 2,800 |
| 8 | Loop Master | 3,800 |
| 9 | Firmware Pioneer | 5,000 |
| 10 | Microcontroller Pro | 6,500 |
| 11–15 | Intermediate tiers | +2,000 XP per level |
| 16–19 | Advanced tiers | +4,000 XP per level |
| 20 | RoboCode Master | 40,000 |

---

## Part 6: Badges and Achievements

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-GAM-230 | The platform **shall** award badges to students upon meeting predefined achievement conditions. Badge awards are evaluated by the platform in real time whenever a relevant event fires. | Must | Badge conditions are expressed as rule predicates evaluated by a lightweight rules engine in the NestJS badge service. |
| FR-GAM-231 | Badge awards **shall** be idempotent: re-triggering the same achievement event on an account that has already received the badge **shall** produce no duplicate award. | Must | Idempotency enforced by a unique constraint on (student_id, badge_id) in the badge_awards table. |
| FR-GAM-232 | The platform **shall** provide the following mandatory badge categories: Skill Badges (component/sensor mastery); Consistency Badges (streaks); Competition Badges (placement); Collaboration Badges (team activities); Milestone Badges (Level, XP, projects completed); and Special/Event Badges (seasonal, Teacher-awarded). | Must | Super Admin may create additional global badge types; School Admin may create tenant-specific badges. |
| FR-GAM-233 | A student **shall** be able to view a complete badge catalogue showing all available badges — both earned (with award date) and unearned (with a progress indicator and earning condition description). No badge is hidden from discovery. | Must | Age-appropriate transparency: students should be able to see what they are working toward. |
| FR-GAM-234 | A Teacher **shall** be able to award a Special Badge from a school-defined badge library to any student in their class, with an optional custom message (max 280 characters, profanity/PII filtered). | Should | Special Badge awards are audit-logged with Teacher identity, student identity, badge ID, message, and timestamp. |
| FR-GAM-235 | Badges **shall not** be automatically shared to any external social network or third-party service. For students under 16, no external share option is displayed. For students 16 and over, an explicit, informed consent step is required before any external share action. | Must | Compliance with age-appropriate design code, COPPA, and GDPR-K. No share widget visible to under-16 users. |
| FR-GAM-236 | Badges and achievements earned in any season **shall** be permanently retained on the student's profile and are not affected by season resets. | Must | Consistent with XP/Level retention; badges are lifetime records. |

### Sample Badge Catalogue

| Badge Name | Category | Earning Condition |
|------------|----------|--------------------|
| Hello LED | Skill | Simulate first LED circuit in RoboCode Studio |
| Sensor Explorer | Skill | Use 5 distinct sensor types across projects |
| Breadboard Wizard | Skill | Complete 10 breadboard wiring tasks correctly |
| 7-Day Streak | Consistency | Maintain 7 consecutive days of meaningful activity |
| 30-Day Streak | Consistency | Maintain 30 consecutive days of meaningful activity |
| Podium Finisher | Competition | Place 1st, 2nd, or 3rd in any competition |
| Team Player | Collaboration | Complete 3 shared team projects |
| Level 10 Achiever | Milestone | Reach Level 10 (Microcontroller Pro) |
| RoboCode Master | Milestone | Reach Level 20 |
| Season Champion | Special/Event | Top of school leaderboard at season close |
| Most Improved | Special/Event | Teacher-awarded; highest XP gain in a term |

---

## Part 7: Leaderboard Service

### Architecture

The leaderboard service is built on Redis Sorted Sets, providing O(log N) rank queries and O(1) score updates. Each leaderboard scope and time window is maintained as a separate sorted-set key.

```
LEADERBOARD SERVICE — REDIS KEY SCHEME
────────────────────────────────────────────────────────────────────────
Key pattern:
  lb:{scope}:{window}:{tenant_id?}:{class_id?}:{season_id}

Scope values:
  individual  — individual student RoboPoints
  team        — aggregate team RoboPoints (sum of members)
  school      — aggregate school RoboPoints (sum of all students)

Window values:
  weekly      — points earned in current 7-day window (resets Monday 00:00 UTC)
  season      — points earned since season start
  alltime     — cumulative lifetime points (XP basis for levels)

Examples:
  lb:individual:weekly:tenant_42::season_3   → within-school weekly
  lb:individual:season::class_7:season_3    → within-class season
  lb:individual:season:::season_3           → global season (all tenants)
  lb:school:season:::season_3              → school aggregate global

Score field: RoboPoints integer (for individual/team) or aggregate integer (school)
Member field: student_id or team_id or tenant_id
────────────────────────────────────────────────────────────────────────
```

### Leaderboard Scopes and Time Windows

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-GAM-250 | The platform **shall** provide Individual Leaderboards at the following scopes: (a) within-class; (b) within-school (tenant); (c) global (across all tenants where permitted by School Admin opt-in). | Must | Global individual leaderboard is opt-in per tenant; default is within-school only (FR-GAM-265). |
| FR-GAM-251 | The platform **shall** provide Team Leaderboards at: (a) within-school and (b) global scope. Team score is the aggregate seasonal RoboPoints of all current team members. | Must | Team leaderboard updates whenever any member earns points. |
| FR-GAM-252 | The platform **shall** provide a School (Tenant) Leaderboard, visible to Super Admin by default and optionally to School Admin, comparing aggregate school statistics: total seasonal RoboPoints, average per-student points, task completion rate, and active student count. | Should | Individual student data is never exposed on cross-tenant views. Only school-level aggregates are displayed. |
| FR-GAM-253 | Each leaderboard **shall** support a Weekly view (points in the current 7-day window, resetting at Monday 00:00 UTC) and a Season view (points since season start). A Global All-Time view is available to Super Admin only. | Must | Weekly reset is a background job; sorted-set score is zeroed; prior week snapshot is archived. |
| FR-GAM-254 | Leaderboards **shall** be filterable by class (for Teachers), by grade/age-band, and by active season. | Should | Reduces information overload in schools with many classes. |
| FR-GAM-255 | A student's own rank position **shall** always be shown on the leaderboard even when they do not appear in the top N visible rows (e.g., "You are ranked 42nd this week"). | Must | Inclusive design; avoids demotivating lower-ranked students by making their position invisible. |
| FR-GAM-256 | Score ties in the leaderboard **shall** be broken first by total season XP, then by the timestamp of the most recent point-earning event (earliest wins). The tiebreaker logic is disclosed to students on the leaderboard page. | Must | Consistent with FR-TEAM-159 for competition-internal tiebreakers. |
| FR-GAM-257 | The leaderboard **shall** refresh within 60 seconds of a point-earning event being committed. A visible "last updated" timestamp **shall** be displayed on all leaderboard views. | Should | Redis sorted-set write → WebSocket broadcast to subscribed clients. |

### Privacy Controls for Leaderboards

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-GAM-260 | Leaderboard entries **shall** display only: rank position; student display name; Level icon; seasonal RoboPoints total; and XP total. Real names, email addresses, school-internal student IDs, and contact information **shall never** appear on any leaderboard view. | Must | Privacy by design; enforced at the API serialisation layer. |
| FR-GAM-261 | Students under 13 (COPPA) or under 16 (GDPR-K) **shall** appear on leaderboards using only their chosen display name (reviewed for appropriateness at signup) and their school name. No further identifying attribute is displayed. | Must | Display name must pass the content-moderation filter at account creation (FR-AUTH-004). |
| FR-GAM-262 | A School Admin **shall** be able to disable the global individual leaderboard for their school's students, limiting visibility to within-school rankings only. This setting is persistent and applies immediately across all leaderboard views. | Must | Privacy control required by GDPR-K and age-appropriate design code. Schools must have an active opt-out. |
| FR-GAM-263 | A Parent/Guardian **shall** be able to opt their child out of all leaderboards (school and global) via the Parent/Guardian account settings panel. The opt-out **shall** take effect immediately and persist across season resets. Re-opt-in requires Parent/Guardian action. | Must | COPPA and GDPR-K parental control requirement. When opted out, the student's entry is removed from all sorted sets; their own rank view shows "Leaderboard hidden by parent/guardian". |
| FR-GAM-264 | A Parent/Guardian **shall** be able to view their own child's leaderboard position and score within the school scope. They **shall not** be able to see the names, scores, or positions of other students. | Must | Read is filtered server-side; only the linked child's rank record is returned. |
| FR-GAM-265 | The default leaderboard visibility for a newly onboarded school tenant **shall** be limited to within-school scope. A School Admin must take an explicit action to participate in the global leaderboard. | Must | Privacy-by-default for minors; consistent with age-appropriate design code. |

---

## Part 8: Seasons and Resets

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-GAM-270 | The platform **shall** support configurable Seasons, each with a defined start date, end date, and optional theme name. Super Admin defines global seasons; School Admins may define additional tenant-level seasons within a global season. | Must | Season configuration stored in the database; no code deployment required to create or close a season. |
| FR-GAM-271 | At Season end, each student's seasonal RoboPoints balance **shall** be archived in an immutable season_snapshot table (not deleted) and the seasonal leaderboard state **shall** be preserved for retrospective viewing for a minimum of 2 years. | Must | Archived snapshots satisfy audit, data-retention, and parent/guardian reporting obligations. |
| FR-GAM-272 | At Season start, the active RoboPoints balance used for leaderboard ranking **shall** reset to zero. XP totals, Levels, and all earned Badges **shall never** be reset. This distinction **shall** be communicated clearly to students on the season-transition notification. | Must | Seasonal RoboPoints reset is a write to the sorted set (score zeroed); ledger history is unchanged. |
| FR-GAM-273 | Students **shall** receive an in-platform notification and email (where email is configured) at least 7 days before Season end, summarising their current standing, badges earned in the season, and the reset countdown. | Should | Motivates a final sprint; manages expectations around the reset. |
| FR-GAM-274 | Super Admin **shall** be able to define Season-specific themes, temporary bonus-point event multipliers (applied on top of School Admin multipliers), and limited-edition Badges available only during that Season. | Should | Seasonal novelty sustains re-engagement. Limited-edition Badges are permanently retained on student profiles after the season ends. |
| FR-GAM-275 | School Admins **shall** receive a Season Summary Report automatically at season close, showing aggregate school statistics (total RoboPoints earned, task completion rate, competition placements, active student count) without exposing individual student data to unauthorised parties. | Should | Report is generated as a PDF by a background job; also available on demand from the Administration panel (FR-ADM). |

---

## Part 9: Anti-Abuse and Fairness Engine

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-GAM-300 | The platform **shall** detect and suppress rapid-repeat point-earning events that exceed statistical norms for the activity type. Rate limits are configurable by Super Admin per event type (default: 10 simulation-run events per student per hour). | Must | Rate-limiting counters are maintained in Redis. Events exceeding the limit are queued for admin review, not silently discarded. |
| FR-GAM-301 | The platform **shall** detect copy-paste plagiarism in code submissions by comparing AST fingerprints against a configurable similarity threshold across the tenant's student submissions. Matches above the threshold are flagged for Teacher review. | Must | Flagged submissions earn zero points pending Teacher review. The student is notified that their submission is under review, without revealing the comparison target. |
| FR-GAM-302 | The platform **shall** detect coordinated point-farming patterns across multiple accounts (e.g., rapid mutual peer-endorsements, repeated submission-and-withdrawal cycles) using cross-account event correlation. | Should | Pattern detection runs as a scheduled batch job hourly; alerts are surfaced to the anti-cheat dashboard. |
| FR-GAM-310 | Teachers and School Admins **shall** have access to an Anti-Cheat Alerts dashboard scoped to their tenant, showing flagged submissions, unusual earning patterns, and suggested actions (review, revoke, dismiss). No automatic revocation occurs without Teacher or Admin confirmation. | Must | Dashboard is a filtered view of the anti-cheat_alerts table, scoped by tenant_id. |
| FR-GAM-311 | Super Admin and Platform Moderators **shall** have a global Anti-Cheat view showing cross-tenant anomalies and coordinated gaming patterns beyond the scope of any single school. | Must | Necessary for platform-wide integrity; logically distinct from per-school views. |
| FR-GAM-312 | All anti-cheat decisions (flag raised, points revoked, submission dismissed) **shall** be logged in the immutable audit trail with actor identity, affected student ID, event details, decision, and timestamp. Audit entries are retained for a minimum of 3 years. | Must | Supports appeals (FR-TEAM-174), regulatory inspection, and parent/guardian queries. |

---

## Part 10: Rewards Catalogue

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-GAM-320 | The platform **shall** provide a Rewards Catalogue where students may redeem seasonal RoboPoints for in-platform cosmetic rewards (e.g., profile themes, Studio colour schemes, avatar frames, badge frames). No real-money or real-goods redemption is included in this release. | Should | Non-monetary rewards avoid financial regulatory complications across multi-jurisdiction Africa deployment. |
| FR-GAM-321 | Reward redemption **shall** deduct the corresponding RoboPoints from the student's seasonal ledger balance. XP is not affected by redemption. Students **shall** be clearly informed before confirming redemption that it reduces their leaderboard-competing balance. | Must | Deduction is a signed ledger entry; the student's seasonal balance cannot go below zero through redemption. |
| FR-GAM-322 | A Teacher or School Admin **shall** be able to define school-specific reward items (e.g., early access to a premium lesson, a digital certificate) with configurable RoboPoints costs. | Could | Extends the reward system without requiring platform-level code changes. |
| FR-GAM-323 | All reward items **shall** be age-appropriate and **shall not** include advertising, brand sponsorship, or external commercial links visible to minor students without verifiable parental consent. | Must | Absolute prohibition; compliance with age-appropriate design code, COPPA, and GDPR-K. |

---

## Part 11: Privacy and Data Protection for Gamification

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-GAM-330 | Gamification data (RoboPoints, XP, badges, levels, leaderboard positions) **shall not** be used for targeted advertising, commercial profiling, or any purpose beyond the educational experience. | Must | Absolute prohibition applicable to all student age groups; contractually enforceable in Terms of Service. |
| FR-GAM-331 | Students **shall** be able to view a clear "Who can see this?" control on their gamification profile, appropriate for their age and reading level, showing which roles and scopes can see each data item. | Must | Age-appropriate transparency per the age-appropriate design code. |
| FR-GAM-332 | Super Admin **shall** be able to define platform-wide minimum age thresholds above which specific gamification features (e.g., global leaderboard participation, public badge sharing, rewards catalogue) become available, enforced by date-of-birth verification at account level (FR-AUTH-005). | Should | Enables jurisdiction-specific tuning of age gates without a code deployment. |
| FR-GAM-333 | All gamification data for a student whose account is deleted or whose Parent/Guardian withdraws consent **shall** be anonymised or deleted within 30 days. Historical leaderboard and season archive entries for the deleted account **shall** be replaced with the placeholder "Deleted User". Statistical aggregates are retained. | Must | Right to erasure (GDPR Art. 17); COPPA deletion obligations. Season archives maintain statistical integrity via anonymised placeholders. |

---

## MoSCoW Priority Summary

### FR-TEAM Requirements

| ID | Requirement Summary | Priority |
|----|---------------------|----------|
| FR-TEAM-001 | Student creates named team within tenant | Must |
| FR-TEAM-002 | Teacher/School Admin creates teams for students | Must |
| FR-TEAM-003 | Configurable min/max team size | Must |
| FR-TEAM-004 | Student in multiple standing teams (cap: 5) | Should |
| FR-TEAM-005 | Team profile page with stats and projects | Should |
| FR-TEAM-006 | Captain renames team, updates avatar and description | Should |
| FR-TEAM-007 | Garbage-collect orphaned teams | Must |
| FR-TEAM-010 | Exactly one Captain per team at all times | Must |
| FR-TEAM-011 | Captain invites students within tenant | Must |
| FR-TEAM-012 | Captain removes Members (freeze rules apply) | Must |
| FR-TEAM-013 | Captain transfers Captain role with acceptance | Should |
| FR-TEAM-014 | Member leaves team voluntarily | Must |
| FR-TEAM-015 | Members view profile, projects, standings, channels | Must |
| FR-TEAM-020 | Invitations via notification system only (no DM) | Must |
| FR-TEAM-021 | Invitation requires explicit accept/decline; expires 7 d | Must |
| FR-TEAM-022 | Under-16 team join requires Teacher counter-approval | Should |
| FR-TEAM-023 | Audit log for all team invitation events | Must |
| FR-TEAM-025 | Cross-tenant teams for inter-school competitions | Must |
| FR-TEAM-026 | No personal identifiers exposed across tenant boundary | Must |
| FR-TEAM-027 | Cross-tenant membership scoped to competition lifetime | Must |
| FR-TEAM-050 | Team creates shared projects in RoboCode Studio | Must |
| FR-TEAM-051 | Captain sets project visibility | Must |
| FR-TEAM-052 | Teacher forks team project for grading | Must |
| FR-TEAM-053 | Project metadata identifies contributing authors | Must |
| FR-TEAM-060 | Real-time concurrent editing via Yjs CRDT + Socket.IO | Must |
| FR-TEAM-061 | Colour-coded presence indicators per collaborator | Must |
| FR-TEAM-062 | CRDT structural merge for wiring conflicts | Must |
| FR-TEAM-063 | Versioned snapshot history; min 30 snapshots; rollback | Must |
| FR-TEAM-064 | Teacher joins project as read-only/annotate observer | Must |
| FR-TEAM-065 | Asynchronous offline collaboration with merge-on-reconnect | Should |
| FR-TEAM-066 | Inline comments on canvas/code; filtered before display | Should |
| FR-TEAM-100 | Teacher creates intra-school competition | Must |
| FR-TEAM-101 | School Admin creates inter-school competition | Must |
| FR-TEAM-102 | Super Admin/Platform Moderator approves inter-school event | Must |
| FR-TEAM-103 | Super Admin creates platform-wide competition | Must |
| FR-TEAM-104 | Full competition configuration fields | Must |
| FR-TEAM-105 | Multi-round competitions with independent deadlines | Must |
| FR-TEAM-106 | Server-side registration deadline enforcement | Must |
| FR-TEAM-107 | Competition lifecycle management; participant notifications | Must |
| FR-TEAM-108 | Super Admin clones competition as template | Should |
| FR-TEAM-110 | Coding Challenge type | Must |
| FR-TEAM-111 | Robotics Simulator Build Challenge type | Must |
| FR-TEAM-112 | AI Task Challenge type | Should |
| FR-TEAM-113 | Mixed challenge types within one competition | Should |
| FR-TEAM-114 | Challenge metadata including required components list | Must |
| FR-TEAM-120 | Individual participation as pseudo-team | Must |
| FR-TEAM-121 | Fair-play acknowledgement at registration | Must |
| FR-TEAM-122 | Eligibility check at registration time | Must |
| FR-TEAM-130 | Captain or individual submits before deadline | Must |
| FR-TEAM-131 | Multiple draft saves; explicit finalisation | Must |
| FR-TEAM-132 | Submission immutability after finalisation | Must |
| FR-TEAM-133 | Audit-logged submission with SHA-256 artefact hash | Must |
| FR-TEAM-134 | Submission-receipt notification to Captain and Teacher | Must |
| FR-TEAM-135 | Automatic rejection of late submissions | Must |
| FR-TEAM-140 | Automated test-runner in isolated RSE sandbox | Must |
| FR-TEAM-141 | Automated scoring timeout (default 120 s) | Must |
| FR-TEAM-142 | Automated schematic/wiring validation for build challenges | Must |
| FR-TEAM-143 | Scores held in escrow until score-release date | Must |
| FR-TEAM-144 | Horizontally scalable judging worker queue | Must |
| FR-TEAM-150 | Judge dashboard with ordered submission list | Must |
| FR-TEAM-151 | Rubric scoring with live RSE simulation replay | Must |
| FR-TEAM-152 | Multiple independent judges; mean aggregation | Should |
| FR-TEAM-153 | Judges blind to other judges' scores pre-release | Should |
| FR-TEAM-154 | Scores and feedback released at score-release date | Must |
| FR-TEAM-155 | Bracket format configuration per round | Must |
| FR-TEAM-156 | Auto-populated bracket matchups | Must |
| FR-TEAM-157 | Participant-facing bracket and standings page | Must |
| FR-TEAM-158 | Weighted score aggregation across judging modes | Must |
| FR-TEAM-159 | Tiebreaker sequence: rubric → auto → timestamp → draw | Must |
| FR-TEAM-160 | Leaderboard updates within 60 s of score event | Must |
| FR-TEAM-165 | Automatic RoboPoints award at competition conclusion | Must |
| FR-TEAM-166 | Digital certificate (PDF) for winners/finalists | Should |
| FR-TEAM-167 | Competition badges permanently on student and team profiles | Should |
| FR-TEAM-168 | Results page shows display names and school names only | Must |
| FR-TEAM-170 | AST-based code similarity detection for plagiarism flagging | Must |
| FR-TEAM-171 | Disqualification with mandatory reason and notifications | Must |
| FR-TEAM-172 | Server-authoritative submission timestamps; NTP monitored | Must |
| FR-TEAM-173 | Immutable audit log for all judging decisions | Must |
| FR-TEAM-174 | Formal appeal mechanism with escalation path | Should |

### FR-GAM Requirements

| ID | Requirement Summary | Priority |
|----|---------------------|----------|
| FR-GAM-200 | Append-only RoboPoints ledger in PostgreSQL | Must |
| FR-GAM-201 | Idempotency keys; 24 h Redis TTL | Must |
| FR-GAM-202 | RSE heartbeat token validates simulation-run events | Must |
| FR-GAM-203 | Points credited on verified earning events | Must |
| FR-GAM-204 | Teacher manual award/deduction with audit log | Must |
| FR-GAM-205 | Point revocation on fraud confirmation | Must |
| FR-GAM-220 | Lifetime XP tally — never reset | Must |
| FR-GAM-221 | XP-to-Level mapping; progress bar in nav header | Must |
| FR-GAM-222 | Level-up notification and skippable animation | Should |
| FR-GAM-223 | Level thresholds configurable by Super Admin without deploy | Should |
| FR-GAM-230 | Badge awards evaluated in real time on events | Must |
| FR-GAM-231 | Idempotent badge awards (no duplicates) | Must |
| FR-GAM-232 | Six mandatory badge categories | Must |
| FR-GAM-233 | Full badge catalogue visible (earned and unearned) | Must |
| FR-GAM-234 | Teacher Special Badge award with filtered message | Should |
| FR-GAM-235 | No external badge sharing for under-16; consent required for 16+ | Must |
| FR-GAM-236 | Badges permanently retained; never reset by season | Must |
| FR-GAM-250 | Individual leaderboards: class / school / global | Must |
| FR-GAM-251 | Team leaderboards: school / global | Must |
| FR-GAM-252 | School aggregate leaderboard for Super Admin | Should |
| FR-GAM-253 | Weekly and Season leaderboard views | Must |
| FR-GAM-254 | Leaderboard filters: class, grade, season | Should |
| FR-GAM-255 | Student's own rank shown outside top N | Must |
| FR-GAM-256 | Tiebreaker: XP then most-recent event timestamp | Must |
| FR-GAM-257 | Leaderboard refresh within 60 s; last-updated timestamp | Should |
| FR-GAM-260 | Display name, Level icon, points only — no real name | Must |
| FR-GAM-261 | Under-16 display name only on leaderboards | Must |
| FR-GAM-262 | School Admin opt-out of global individual leaderboard | Must |
| FR-GAM-263 | Parent/Guardian opt-out of all leaderboards | Must |
| FR-GAM-264 | Parent/Guardian sees child's rank only, not others' | Must |
| FR-GAM-265 | Default leaderboard visibility within-school | Must |
| FR-GAM-270 | Configurable Seasons with start/end dates and themes | Must |
| FR-GAM-271 | Season RoboPoints archived; snapshot preserved 2 years | Must |
| FR-GAM-272 | Seasonal RoboPoints reset; XP/Levels/Badges never reset | Must |
| FR-GAM-273 | 7-day pre-season-end notification to students | Should |
| FR-GAM-274 | Season themes, multipliers, and limited-edition badges | Should |
| FR-GAM-275 | Season Summary Report auto-generated for School Admin | Should |
| FR-GAM-300 | Rapid-repeat event detection with configurable rate limits | Must |
| FR-GAM-301 | AST plagiarism detection for code submissions | Must |
| FR-GAM-302 | Cross-account coordinated farming pattern detection | Should |
| FR-GAM-310 | Anti-Cheat Alerts dashboard for Teachers and School Admins | Must |
| FR-GAM-311 | Global Anti-Cheat view for Super Admin/Platform Moderator | Must |
| FR-GAM-312 | Audit log for all anti-cheat decisions (retained 3 years) | Must |
| FR-GAM-320 | In-platform cosmetic Rewards Catalogue (no real-money) | Should |
| FR-GAM-321 | Redemption deducts seasonal RoboPoints; XP unaffected | Must |
| FR-GAM-322 | School-specific custom reward items | Could |
| FR-GAM-323 | Age-appropriate, advertising-free rewards | Must |
| FR-GAM-330 | No commercial use of gamification data | Must |
| FR-GAM-331 | "Who can see this?" transparency control on profile | Must |
| FR-GAM-332 | Configurable age thresholds for feature access | Should |
| FR-GAM-333 | Gamification data erasure on account deletion within 30 d | Must |

---

## Cross-References

- **FR-AUTH** (Functional Requirements: Identity, Authentication and Authorization) — RBAC, JWT scope enforcement, parental consent capture, and session management underpin all permission checks for team operations, competition access, and gamification data access.
- **FR-TEN** (Functional Requirements: Multi-Tenancy, Custom Domains and White-Labelling) — Postgres Row-Level Security (RLS) enforces tenant isolation for all team, competition, and ledger records. Cross-tenant competition data boundaries are defined in FR-TEN.
- **FR-STU** (Functional Requirements: RoboCode Studio IDE) — The RoboCode Studio canvas, Yjs CRDT synchronisation, and Socket.IO WebSocket layer are the collaboration infrastructure for shared team projects (FR-TEAM-060 through FR-TEAM-066). **FR-SIM** (RoboCode Simulation Engine) — the RSE heartbeat token used in FR-GAM-202 is generated by the simulation engine.
- **FR-CODE** (Functional Requirements: Code Authoring, Validation and Execution) — The Monaco editor, compiler toolchain, and RVM execution layer handle the code artefacts within Coding Challenges (FR-TEAM-110).
- **FR-LRN** (Functional Requirements: Learning Management and Content) — Task and course unit completion events are primary RoboPoints earning sources (FR-GAM-203). Difficulty tier metadata on tasks feeds the point-scaling formula.
- **FR-COMM and FR-MOD** (Functional Requirements: Communication, Notifications and Moderation) — All team invitation notifications, competition lifecycle notifications, badge award notifications, season-end alerts, and anti-cheat decisions are delivered through the notification system governed by FR-COMM. Content moderation of team names, avatars, inline comments, judge feedback, and competition discussion is governed by FR-MOD. Child-safe communication constraints (FR-AUTH-108) prohibit unmoderated private messaging between minors in all team and competition contexts.
- **FR-ADM** (Functional Requirements: Administration, Analytics and Reporting) — Audit log storage, search, export, and retention policies referenced throughout this section (FR-TEAM-023, FR-TEAM-133, FR-TEAM-173, FR-GAM-312) are specified in FR-ADM. Season Summary Reports (FR-GAM-275) and Teacher competition dashboards are surfaced via the administration and analytics layer.
- **Section 10 — Component and Sensor Library Specification** — The required components list on each challenge (FR-TEAM-114) references component identifiers from the canonical component catalogue. Automated schematic validation (FR-TEAM-142) uses the same catalogue for component presence checks.
- **Data Architecture and Database Design** (DR) — The RoboPoints ledger table, season_snapshot table, badge_awards table, leaderboard Redis key scheme, and anti-cheat_alerts table described in this section are formally specified in the Data Architecture and Database Design section.
- **Security, Privacy and Child Safety** (SR) — Child-safety requirements for leaderboard privacy (FR-GAM-260 through FR-GAM-265), data erasure on account deletion (FR-GAM-333), and prohibition on commercial use of gamification data (FR-GAM-330) are validated against the Security, Privacy and Child Safety section's compliance matrix for COPPA, GDPR-K, POPIA, Zimbabwe Cyber and Data Protection Act, Nigeria NDPR, and Kenya Data Protection Act.
- **NFR** (Non-Functional Requirements) — Leaderboard query latency (P99 under 200 ms), judging pipeline throughput (500 concurrent submissions), and WebSocket push latency (within 60 s) are captured as NFR-PERF items in the Non-Functional Requirements section.
- **API Specification and Integration Interfaces** (IR) — GraphQL subscriptions for real-time leaderboard updates, REST endpoints for team CRUD, WebSocket events for competition lifecycle and submission confirmation, and the competition judging API schema are specified in the API Specification and Integration Interfaces section.
