# User Requirements: Teams, Competitions and Collaboration

## Overview

This section specifies user requirements governing how students form and manage teams, how schools organise and participate in inter-school competitions, how individuals participate in challenges, and how real-time collaborative project work is conducted inside RoboCode Studio. All requirements apply across both school-tenant accounts (subdomain or custom domain) and direct robocode.africa accounts. Child-safety and data-protection constraints from Section 6 (Onboarding, Signup and Approval) and Section 15 (Communication, Notifications and Safety) remain in force at all times.

Requirements are identified with the prefix **UR-TEAM-nnn**. Use-case cross-references follow the scheme **UC-nnn** defined in Section 17. Priority uses MoSCoW notation.

---

## Definitions

| Term | Meaning in this section |
|---|---|
| Team | A named group of one or more Students, scoped to a school tenant or the platform. |
| Captain | The Student who holds owner-level permissions within a Team. |
| Member | A Student who belongs to a Team without captain privileges. |
| Competition | A structured event with defined rounds, deadlines, challenge types, and a scoring mechanism, created by a Teacher, School Admin, or Super Admin. |
| Challenge | A single competitive task within a Competition (coding, simulator build, or AI task). |
| Bracket | A single-elimination or round-robin structure that organises Team matchups within a Competition round. |
| Submission | A Team's or individual's completed Challenge artefact submitted before the deadline. |
| Rubric | A weighted, criterion-based scoring guide used by human judges in addition to or instead of automated scoring. |
| Collaborative Project | A RoboCode Studio project shared among multiple Students or Team members, edited concurrently via CRDT synchronisation. |

---

## Team Formation and Membership

### Team Creation

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-TEAM-001 | A Student must be able to create a named Team within the school tenant to which they belong. | Must | Team name is unique per tenant; max 64 characters; profanity-filtered. |
| UR-TEAM-002 | A Student creating a Team automatically becomes the Team Captain. | Must | Only one Captain per Team at a time. |
| UR-TEAM-003 | A Teacher or School Admin must be able to create Teams on behalf of Students. | Must | Useful for class-organised competitions and younger primary-school cohorts. |
| UR-TEAM-004 | The system must enforce a configurable minimum and maximum Team size set per Competition or per school policy. | Must | Default: min 1, max 6. School Admin or Teacher overrides per event. |
| UR-TEAM-005 | A Student must only belong to one Team per Competition at a time. | Must | Students may belong to separate standing Teams outside of competitions. |
| UR-TEAM-006 | The system must allow a Student to be a member of multiple standing (non-competition) Teams simultaneously, up to a platform-configured cap. | Should | Default cap: 5 Teams per Student. |

### Team Roles

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-TEAM-007 | Every Team must have exactly one Captain at all times. | Must | If a Captain leaves, the system must prompt remaining members or a Teacher to assign a new Captain before the vacancy is persisted. |
| UR-TEAM-008 | The Captain must be able to invite Students (by username or school email) to join the Team. | Must | Invitations are subject to approval; see UR-TEAM-010. |
| UR-TEAM-009 | The Captain must be able to remove Members from the Team, subject to any competition freeze period. | Must | Removals during a freeze period require Teacher or School Admin approval. |
| UR-TEAM-010 | The Captain must be able to transfer the Captain role to any current Member. | Should | Transfer requires the receiving Member to accept. |
| UR-TEAM-011 | Members must be able to view the Team profile, shared projects, competition standings, and Team chat (where enabled by Teacher). | Must | Read access is always granted; write access governed by collaboration rules. |
| UR-TEAM-012 | Members must be able to leave a Team voluntarily, subject to competition freeze rules. | Must | |

### Invitations and Approvals

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-TEAM-013 | Team invitations sent to another Student within the same school tenant must be delivered via the in-platform notification system (see Section 15) and optionally via email, never via direct unsupervised messaging. | Must | Child-safety constraint: no private unmoderated messaging between minors. |
| UR-TEAM-014 | An invited Student must explicitly accept or decline a Team invitation; acceptance is not automatic. | Must | Invitations expire after a configurable period (default: 7 days). |
| UR-TEAM-015 | For Students under 16, a Teacher or School Admin must be able to configure the school policy so that all Team join actions require Teacher counter-approval before becoming effective. | Should | Required for schools with strict safeguarding policies. |
| UR-TEAM-016 | Cross-school Team invitations (for inter-school competitions) must be brokered through the competition management interface and approved by the School Admins of both schools. | Must | Prevents unsupervised contact between Students at different schools. |
| UR-TEAM-017 | The system must log all Team invitation events (sent, accepted, declined, expired, revoked) in the audit trail (see Section 16). | Must | |

### Team Profiles and Branding

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-TEAM-018 | Each Team must have a public-within-tenant profile page showing the Team name, members, school, competition history, RoboPoints total, and shared public projects. | Should | Profile visibility can be restricted to school-only by School Admin. |
| UR-TEAM-019 | The Captain must be able to upload a Team avatar/logo (image file, max 2 MB, content-moderated). | Could | Platform defaults to a generated avatar if none is uploaded. |
| UR-TEAM-020 | The system must allow Teams to earn and display a configurable set of achievement badges on their profile. | Could | Badges are awarded via the Gamification system (see Section 14). |

---

## Individual Participation

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-TEAM-021 | A Student who is not part of a Team must be able to participate in Competitions that allow individual entries. | Must | The system treats an individual entry as a single-member pseudo-Team for scoring purposes. |
| UR-TEAM-022 | A Competition creator must be able to designate a Competition as Team-only, individual-only, or open (Team or individual). | Must | |
| UR-TEAM-023 | Individual participants must have access to all Challenge materials and submission workflows identically to Team participants. | Must | |

---

## Collaborative Projects in RoboCode Studio

### Real-Time Collaboration

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-TEAM-024 | Team members must be able to open a shared Team project in RoboCode Studio and edit it concurrently in real time. | Must | Concurrent editing is synchronised via Yjs CRDT over Socket.IO WebSocket; see Technology Stack. |
| UR-TEAM-025 | Each collaborator's cursor position and selected component must be visible to other active collaborators via a distinct colour-coded presence indicator. | Must | Presence indicators show the Student's display name alongside the cursor. |
| UR-TEAM-026 | The system must prevent conflicting simultaneous edits to the same wiring connection or component property through optimistic concurrency resolved by CRDT merge semantics. | Must | Last-write-wins is not acceptable for wiring; structural merge is required. |
| UR-TEAM-027 | The system must maintain a versioned history of collaborative project changes, allowing a Teacher or Captain to roll back to any prior saved state. | Must | Minimum 30 saved versions retained; older snapshots may be pruned by policy. |
| UR-TEAM-028 | A Teacher assigned to a class must be able to join any Team project in that class as a read-only observer or in an annotate-only mode without interfering with Student edits. | Must | |
| UR-TEAM-029 | The system must support asynchronous collaboration: a Team member who is offline can open the last synced state and their changes will merge on reconnection. | Should | Conflict resolution follows the Yjs CRDT model; merge conflicts are surfaced to the Captain for resolution. |
| UR-TEAM-030 | A Student must be able to add inline comments to components or code lines within a shared project; comments are visible to all Team members and the supervising Teacher. | Should | Comments are subject to profanity/PII filtering (see Section 15). |

### Project Sharing and Permissions

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-TEAM-031 | A Captain must be able to set a Team project as private (Team-only), school-visible, or public (platform-wide). | Must | Public projects are moderated before appearing in the global gallery. |
| UR-TEAM-032 | A Teacher must be able to fork a Team's project for grading or exemplar purposes without modifying the original. | Must | |
| UR-TEAM-033 | Shared projects must clearly identify the contributing authors (Student display names) in the project metadata. | Must | Supports academic integrity and fair-play assessment. |

---

## Competitions and Tournaments

### Competition Creation and Configuration

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-TEAM-034 | A Teacher must be able to create an intra-school Competition visible only to Students and Teams within their school. | Must | |
| UR-TEAM-035 | A School Admin must be able to create school-level Competitions and open them to inter-school participation by inviting other school tenants on the platform. | Must | Inter-school competitions require Super Admin or Platform Moderator visibility for safety review. |
| UR-TEAM-036 | A Super Admin must be able to create platform-wide Competitions open to all registered Students or all registered school tenants. | Must | |
| UR-TEAM-037 | A Competition creator must be able to configure: name, description, start and end dates, registration deadline, eligibility (grade levels, age ranges, school, or platform-wide), Team or individual mode (UR-TEAM-022), maximum participants/teams, challenge list, scoring weights, judging method, and public or private visibility. | Must | |
| UR-TEAM-038 | A Competition must support multiple sequential rounds (e.g., Qualifier, Semi-Final, Final) each with independent deadlines and challenge sets. | Must | |
| UR-TEAM-039 | The system must enforce registration deadlines; no new Team or individual may register after the deadline has passed unless overridden by the Competition creator. | Must | |
| UR-TEAM-040 | A Competition creator must be able to publish, unpublish, postpone, or cancel a Competition; enrolled participants must be notified of any status change via the notification system. | Must | |

### Challenge Types

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-TEAM-041 | A Competition must support coding Challenges, where participants write Arduino C/C++ or MicroPython code to fulfil a specification and the submission is evaluated by automated test cases and/or a rubric. | Must | |
| UR-TEAM-042 | A Competition must support robotics simulator build Challenges, where participants construct a circuit on the RoboCode Studio canvas (components, breadboard, wiring) and write supporting code; the full simulator state (JSON schematic + code) is the submission artefact. | Must | |
| UR-TEAM-043 | A Competition must support AI task Challenges, where participants design, integrate, or apply a rule-based or pre-trained AI component within a RoboCode Studio project (e.g., gesture recognition via MPU6050, sensor-fusion logic). | Should | In-browser ML model training is out of scope for v1.0 (Section 1 and UR-NFR-C027); challenges use rule-based or pre-trained models only. AI task judging always requires a human rubric component given interpretive complexity. |
| UR-TEAM-044 | A single Competition may include a mix of Challenge types across its rounds. | Should | |
| UR-TEAM-045 | Each Challenge must have: a title, description, resource links, starter project (optional), required components list, evaluation criteria, maximum score, and per-criterion weighting if rubric-judged. | Must | |

### Submission Workflow

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-TEAM-046 | A Team (via the Captain) or an individual must be able to submit a Submission before the Challenge deadline. | Must | |
| UR-TEAM-047 | The system must allow multiple draft saves before final submission; only the explicitly submitted version is evaluated. | Must | |
| UR-TEAM-048 | Once a Submission is finalised, the Captain or individual must not be able to modify it unless the Competition creator opens a resubmission window. | Must | Immutability protects fair-play integrity. |
| UR-TEAM-049 | The system must capture the submission timestamp, submitting user ID, Team ID, and a cryptographic hash of the submission artefact in the audit log (see Section 16). | Must | |
| UR-TEAM-050 | The system must confirm receipt of a Submission to the submitting Captain or individual via an in-platform notification and email. | Must | |
| UR-TEAM-051 | Late submissions must be rejected automatically after the deadline unless the Competition creator has configured a grace period. | Must | |

### Judging: Automated Scoring

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-TEAM-052 | The platform must support automated evaluation of coding Challenges via a test-runner that executes the submitted firmware against a set of hidden test cases inside the RSE and reports a pass/fail score per test case. | Must | Test cases are authored by the Challenge creator and not visible to participants before results are released. |
| UR-TEAM-053 | Automated scoring must complete within a configurable timeout (default: 120 seconds per submission) and report a timeout failure if exceeded. | Must | |
| UR-TEAM-054 | For simulator build Challenges, automated checks must validate that the submitted schematic contains required components, correct wiring topology (as specified in the Challenge), and that the firmware produces expected pin/output states when simulated. | Must | |
| UR-TEAM-055 | The automated score for each Submission must be visible to the submitting Team/individual and to Teachers and judges immediately after the judging run completes, or at a reveal time configured by the Competition creator. | Must | |

### Judging: Rubric-Based (Human) Scoring

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-TEAM-056 | A Teacher or designated judge must be able to access a judging dashboard that lists all Submissions for their assigned Challenge, ordered by submission time. | Must | |
| UR-TEAM-057 | The judging dashboard must display the full Submission artefact (code, schematic, live simulation replay) alongside the rubric criteria and a numeric or level-based scoring control per criterion. | Must | |
| UR-TEAM-058 | A judge must be able to add written feedback per criterion; feedback is delivered to the Team/individual after scores are published. | Must | Feedback text is retained in the audit log. |
| UR-TEAM-059 | The system must support multiple judges scoring the same Submission independently; final rubric score is the mean (or a configured aggregation) of all judge scores. | Should | Reduces individual judge bias for high-stakes events. |
| UR-TEAM-060 | The Competition creator must be able to set a score-release date; rubric scores and feedback are not visible to participants until that date. | Must | |
| UR-TEAM-061 | Judges must not be able to view scores submitted by other judges for the same Submission until after the score-release date to prevent anchoring bias. | Should | |

### Brackets, Rounds and Leaderboards

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-TEAM-062 | The Competition creator must be able to configure the bracket format for each round: single-elimination, double-elimination, round-robin, or points-table (no bracket). | Must | |
| UR-TEAM-063 | The system must automatically populate bracket matchups from registered Teams/individuals at the start of each round, based on seeding (prior round scores) or random draw as configured. | Must | |
| UR-TEAM-064 | A participant-facing Competition page must display the current bracket, round schedule, each Team's score, and remaining time until the next deadline. | Must | |
| UR-TEAM-065 | The Competition leaderboard must update in real time (or near-real-time, within 60 seconds) as automated scores are published. | Must | |
| UR-TEAM-066 | The system must support a platform-wide aggregate leaderboard that ranks schools by their cumulative competition performance (RoboPoints earned in competitions) across a configurable period (week/month/term/year). | Should | See also Section 14: Gamification, RoboPoints and Leaderboards. |
| UR-TEAM-067 | Leaderboard entries for minors must not expose full real names or personal identifiers; only the Student's chosen display name and school name are shown. | Must | Data-protection constraint; see also Section 15. |

### Prizes, Awards and RoboPoints

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-TEAM-068 | Winning Teams and individuals must automatically receive a configured RoboPoints award upon Competition conclusion; the award scales by placement (1st, 2nd, 3rd, participation). | Must | RoboPoints mechanics are defined in Section 14. |
| UR-TEAM-069 | The system must generate a digital certificate (downloadable PDF) for competition winners and finalists; the certificate template is customisable by the Competition creator. | Should | |
| UR-TEAM-070 | Achievement badges earned through Competition wins must appear on the Student's profile and the Team profile. | Should | |

### Fair-Play Rules

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-TEAM-071 | The system must detect and flag suspiciously similar code submissions (using AST-based similarity analysis) to the Competition creator and assigned Teachers for review. | Must | Flagging is for human review; no automatic disqualification based solely on automated detection. |
| UR-TEAM-072 | A Competition creator or Super Admin must be able to disqualify a Team or individual from a Competition, with a mandatory reason recorded in the audit log. | Must | The affected Student(s) receive a notification; Teacher and School Admin are also notified. |
| UR-TEAM-073 | Submission timestamps must be server-authoritative; client-side clocks are not trusted for deadline enforcement. | Must | |
| UR-TEAM-074 | A Competition creator must be able to define explicit fair-play rules that participants must acknowledge (checkbox + timestamp) at registration. | Must | |
| UR-TEAM-075 | All judging decisions and score adjustments must be recorded in the immutable audit log with the judge's identity and a timestamp. | Must | Supports dispute resolution and appeals. |
| UR-TEAM-076 | A Student or Team must be able to raise a formal appeal against a scoring decision; appeals are routed to the Competition creator and, if unresolved, escalated to a Super Admin or Platform Moderator. | Should | |

---

## Inter-School Competition Safety

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-TEAM-077 | Inter-school Competition pages must not expose individual Student contact information or personal details to Students from other schools. | Must | Only display names and school names are visible across tenant boundaries. |
| UR-TEAM-078 | Any communication feature on a Competition page (e.g., public discussion board) must be moderated in accordance with Section 15 (Communication, Notifications and Safety). | Must | |
| UR-TEAM-079 | Super Admin or Platform Moderator must review and approve any inter-school Competition before it opens for registration. | Must | Approval is logged with the reviewer identity and timestamp. |

---

## Teacher and Admin Controls

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-TEAM-080 | A Teacher must be able to view a dashboard of all Teams and individual participants in their class and their competition status, scores, and submission history. | Must | |
| UR-TEAM-081 | A Teacher must be able to add or remove Students from Teams within their class prior to a Competition freeze date. | Must | |
| UR-TEAM-082 | A School Admin must be able to view all active and historic Competitions involving their school's Students, including inter-school events. | Must | |
| UR-TEAM-083 | A School Admin must be able to withdraw their school from an inter-school Competition and receive a confirmation that participant data shared with the Competition will be deleted or anonymised within the platform's data retention policy. | Should | |
| UR-TEAM-084 | A Super Admin must be able to clone an existing Competition as a template for a new one, retaining configuration but clearing participant registrations and submissions. | Should | |

---

## Notifications

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-TEAM-085 | The system must send notifications to relevant roles (Captain, Members, Teacher, School Admin) for: Team invitation sent/accepted/declined, Competition registration open/close, round start/end, submission received, score published, bracket updated, disqualification, appeal status change, and Competition cancelled/postponed. | Must | Notification channels follow Section 15 rules; email and in-platform at minimum. |
| UR-TEAM-086 | Notification frequency must be rate-limited to prevent flooding; a digest option must be available for Teachers and School Admins. | Should | |

---

## MoSCoW Priority Summary

| ID | Requirement Summary | Priority |
|---|---|---|
| UR-TEAM-001 | Student creates a named Team within their school tenant | Must |
| UR-TEAM-002 | Team creator auto-assigned as Captain | Must |
| UR-TEAM-003 | Teacher/School Admin creates Teams on behalf of Students | Must |
| UR-TEAM-004 | Configurable min/max Team size per Competition | Must |
| UR-TEAM-005 | One Team per Student per Competition | Must |
| UR-TEAM-006 | Student in multiple standing Teams up to platform cap | Should |
| UR-TEAM-007 | Exactly one Captain per Team at all times | Must |
| UR-TEAM-008 | Captain invites Students by username or school email | Must |
| UR-TEAM-009 | Captain removes Members (freeze rules apply) | Must |
| UR-TEAM-010 | Captain transfers role to a Member | Should |
| UR-TEAM-011 | Members view profile, projects, standings, Team chat | Must |
| UR-TEAM-012 | Members leave Team voluntarily | Must |
| UR-TEAM-013 | Team invitations via in-platform notifications only | Must |
| UR-TEAM-014 | Invitation requires explicit accept/decline | Must |
| UR-TEAM-015 | Under-16 Team join requires Teacher counter-approval | Should |
| UR-TEAM-016 | Cross-school invites brokered through competition interface | Must |
| UR-TEAM-017 | Audit log for all Team invitation events | Must |
| UR-TEAM-018 | Team public profile page | Should |
| UR-TEAM-019 | Captain uploads Team avatar/logo | Could |
| UR-TEAM-020 | Teams earn achievement badges on profile | Could |
| UR-TEAM-021 | Individual Students participate in open Competitions | Must |
| UR-TEAM-022 | Competition type: Team-only / individual-only / open | Must |
| UR-TEAM-023 | Identical workflow for individual vs. Team participants | Must |
| UR-TEAM-024 | Real-time concurrent editing of shared Team projects | Must |
| UR-TEAM-025 | Colour-coded presence indicators per collaborator | Must |
| UR-TEAM-026 | CRDT merge semantics for wiring conflicts | Must |
| UR-TEAM-027 | Versioned project history with rollback | Must |
| UR-TEAM-028 | Teacher joins Team project as read-only / annotate observer | Must |
| UR-TEAM-029 | Asynchronous offline collaboration with merge-on-reconnect | Should |
| UR-TEAM-030 | Inline comments on components/code in shared projects | Should |
| UR-TEAM-031 | Captain sets project visibility (private/school/public) | Must |
| UR-TEAM-032 | Teacher forks Team project for grading | Must |
| UR-TEAM-033 | Project metadata identifies contributing authors | Must |
| UR-TEAM-034 | Teacher creates intra-school Competition | Must |
| UR-TEAM-035 | School Admin creates inter-school Competition | Must |
| UR-TEAM-036 | Super Admin creates platform-wide Competition | Must |
| UR-TEAM-037 | Full Competition configuration fields | Must |
| UR-TEAM-038 | Multi-round Competitions with independent deadlines | Must |
| UR-TEAM-039 | Registration deadline enforcement | Must |
| UR-TEAM-040 | Competition lifecycle management (publish/postpone/cancel) | Must |
| UR-TEAM-041 | Coding Challenge type | Must |
| UR-TEAM-042 | Robotics simulator build Challenge type | Must |
| UR-TEAM-043 | AI task Challenge type | Should |
| UR-TEAM-044 | Mixed Challenge types within one Competition | Should |
| UR-TEAM-045 | Challenge metadata (title, description, components, criteria) | Must |
| UR-TEAM-046 | Submission by Captain or individual before deadline | Must |
| UR-TEAM-047 | Multiple draft saves; explicit final submission | Must |
| UR-TEAM-048 | Submission immutability after finalisation | Must |
| UR-TEAM-049 | Audit-logged submission with cryptographic hash | Must |
| UR-TEAM-050 | Submission receipt notification | Must |
| UR-TEAM-051 | Automatic rejection of late submissions | Must |
| UR-TEAM-052 | Automated test-runner for coding Challenges | Must |
| UR-TEAM-053 | Automated scoring timeout (default 120 s) | Must |
| UR-TEAM-054 | Automated schematic/wiring validation for build Challenges | Must |
| UR-TEAM-055 | Automated score visibility after judging run | Must |
| UR-TEAM-056 | Judge dashboard with Submission list | Must |
| UR-TEAM-057 | Rubric scoring controls with live simulation replay | Must |
| UR-TEAM-058 | Written feedback per rubric criterion | Must |
| UR-TEAM-059 | Multiple independent judges; score aggregation | Should |
| UR-TEAM-060 | Score-release date configuration | Must |
| UR-TEAM-061 | Judges blind to other judges' scores pre-release | Should |
| UR-TEAM-062 | Bracket format configuration per round | Must |
| UR-TEAM-063 | Auto-populated bracket matchups | Must |
| UR-TEAM-064 | Participant-facing bracket and standings page | Must |
| UR-TEAM-065 | Real-time leaderboard updates (within 60 s) | Must |
| UR-TEAM-066 | Platform-wide school aggregate leaderboard | Should |
| UR-TEAM-067 | Leaderboard shows display names only (no personal data) | Must |
| UR-TEAM-068 | Automatic RoboPoints award by placement | Must |
| UR-TEAM-069 | Digital certificate (PDF) for winners/finalists | Should |
| UR-TEAM-070 | Competition badges on Student and Team profiles | Should |
| UR-TEAM-071 | AST similarity detection for plagiarism flagging | Must |
| UR-TEAM-072 | Competition creator/Super Admin can disqualify with reason | Must |
| UR-TEAM-073 | Server-authoritative submission timestamps | Must |
| UR-TEAM-074 | Explicit fair-play rules acknowledgement at registration | Must |
| UR-TEAM-075 | Immutable audit log for all judging decisions | Must |
| UR-TEAM-076 | Formal appeal mechanism with escalation path | Should |
| UR-TEAM-077 | No personal data exposed across school boundaries | Must |
| UR-TEAM-078 | Competition communication moderated per Section 15 | Must |
| UR-TEAM-079 | Super Admin approves inter-school Competitions | Must |
| UR-TEAM-080 | Teacher dashboard: Teams, submissions, scores | Must |
| UR-TEAM-081 | Teacher adds/removes Students from Teams pre-freeze | Must |
| UR-TEAM-082 | School Admin views all Competitions involving their school | Must |
| UR-TEAM-083 | School Admin withdraws school from inter-school Competition | Should |
| UR-TEAM-084 | Super Admin clones Competition as template | Should |
| UR-TEAM-085 | Notifications for all Team and Competition lifecycle events | Must |
| UR-TEAM-086 | Notification rate-limiting and digest mode | Should |

---

## Competition Lifecycle State Machine

```
+----------------+       publish        +------------+
|    DRAFT       |  ─────────────────>  |  PUBLISHED |
| (creator only) |                      | (visible)  |
+----------------+                      +-----+------+
        ^                                     |
        | unpublish                           | registration opens
        |                                     v
+-------+--------+      postpone       +------------+
|   CANCELLED    |  <───────────────── | REGISTERING|
+----------------+                     +-----+------+
                                             |
                                             | deadline passes
                                             v
                                       +------------+
                                       |  IN PROGRESS|
                                       |  (rounds)   |
                                       +-----+------+
                                             |
                                             | all rounds scored
                                             v
                                       +------------+
                                       |  SCORING   |
                                       | (judging)  |
                                       +-----+------+
                                             |
                                             | scores released
                                             v
                                       +------------+
                                       |  CONCLUDED |
                                       | (archived) |
                                       +------------+
```

---

## Team Collaboration Flow within RoboCode Studio

```
  Captain / Member A                 Platform (Yjs + Socket.IO)        Member B
  ──────────────────                 ───────────────────────────        ──────────
  Opens shared project  ─────────>  Loads CRDT document state  ──────> Receives state
  Edits component        ─────────>  Broadcasts op (CRDT delta)  ──────> Applies op; sees
  (drag, wire, code)                                                     cursor of A
  Saves draft            ─────────>  Persists version snapshot   ──────> Notification: saved
  Submits (Captain only) ─────────>  Locks artefact (immutable)  ──────> Notification: submitted
                                     Audit entry created
  Teacher observer       ─────────>  Read-only / annotate stream ──────> (no edits sent)
```

---

## Cross-References

- **Section 6 (UR-ONB)** — Student signup and approval; parental consent for minors governs Team participation eligibility.
- **Section 5 (Roles and Permissions)** — Role-based access control (RBAC) underpins all Team and Competition permission checks.
- **Section 9 (UR-STU) and Section 10 (UR-SIM)** — RoboCode Studio canvas, component catalogue, wiring model, and simulation experience used in simulator build Challenges.
- **Section 11 (UR-CODE)** — Code editor, Monaco, and language support relevant to coding Challenge submission artefacts.
- **Section 14 (UR-GAM)** — RoboPoints, badges, and leaderboards awarded through Competition outcomes.
- **Section 15 (UR-COMM)** — Moderation, notifications, safeguarding, and child-safe communication rules apply to all Team and Competition interactions.
- **Section 16 (UR-ADM)** — Audit logging, reporting, and admin dashboards that surface Team and Competition data.
- **Section 17 (UC)** — Use cases UC-nnn detailing actor-system interactions for Competition creation, submission, and judging.
- **Section 18 (US)** — User stories with acceptance criteria for key Team and Competition workflows.
