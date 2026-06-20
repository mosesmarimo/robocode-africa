# Functional Requirements: Communication, Notifications and Moderation

## Overview

This section specifies the functional requirements governing all communication channels, notification delivery, content moderation, abuse-report handling, safeguarding escalation, and audit retention for the RoboCode.Africa platform. It is the authoritative system-level specification for the **COMM** and **MOD** modules and translates the corresponding user requirements (UR-COMM-001 through UR-COMM-061 from the User Requirements: Communication, Notifications and Safety section) into implementable, testable functional requirements for the engineering team.

Child safety is the prime directive of this section. Every architectural choice — channel topology, moderation pipeline ordering, default configuration states, data retention periods — is governed first by the obligation to protect minors, and second by pedagogical utility or commercial convenience. No requirement in this section may be relaxed in ways that weaken child-protection controls without the written approval of the platform's Designated Safeguarding Lead (DSL) and the Super Admin.

**Scope of this section:**

- Communication channel service (FR-COMM-nnn): class announcements, broadcast messaging, teacher-to-student messaging, team channels, project comments, and peer-review threads.
- Notification service (FR-COMM-nnn): in-app, email, and SMS channels; event taxonomy; preference management; templating; batching; localisation.
- Content moderation pipeline (FR-MOD-nnn): pre-persistence screening, profanity/hate-speech filter, PII detector, grooming-signal detector, moderation queue, human review workflow, blocklists.
- Abuse reporting and safeguarding escalation (FR-MOD-nnn): report ingestion, routing, triage, outcome recording, parent/guardian notification.
- Audit and retention (FR-COMM-nnn / FR-MOD-nnn): immutable log schema, integrity verification, search and export.

**Out of scope for this section:** real-time collaborative editing of project artefacts (covered in Functional Requirements: RoboCode Studio IDE); account-authentication audit logging (covered in Functional Requirements: Identity, Authentication and Authorization FR-AUTH-110–114); general admin analytics dashboards (covered in Functional Requirements: Administration, Analytics and Reporting).

---

## Channel Architecture

### Channel Topology

All communication on RoboCode.Africa flows through a structured, supervised channel hierarchy. The following ASCII diagram shows the channel model, the actors with write access to each channel, and the actors with mandatory read/oversight access.

```
+------------------------------------------------------------------------+
|                  ROBOCODE.AFRICA COMMUNICATION CHANNEL MODEL           |
+------------------------------------------------------------------------+
|                                                                        |
|  LAYER 1 — PLATFORM-WIDE                                               |
|  +------------------------------------------------------------------+  |
|  | PLATFORM ANNOUNCEMENTS                                           |  |
|  |   Writers : Super Admin, Platform Moderator                     |  |
|  |   Readers : all authenticated users                             |  |
|  |   Mode    : read-only broadcast                                 |  |
|  +------------------------------------------------------------------+  |
|                                                                        |
|  LAYER 2 — SCHOOL / TENANT                                             |
|  +------------------------------------------------------------------+  |
|  | SCHOOL ANNOUNCEMENTS                                             |  |
|  |   Writers : School Admin                                         |  |
|  |   Readers : Teachers and Students in the school                 |  |
|  |   Mode    : read-only broadcast                                 |  |
|  +------------------------------------------------------------------+  |
|                                                                        |
|  LAYER 3 — CLASS                                                       |
|  +------------------------------------------------------------------+  |
|  | CLASS ANNOUNCEMENTS                                              |  |
|  |   Writers : Teacher                                             |  |
|  |   Readers : enrolled Students                                   |  |
|  |   Mode    : read-only broadcast                                 |  |
|  +-----------+------------------------------------------------------+  |
|  | TASK / ASSIGNMENT FEED                                           |  |
|  |   Writers : system (LRN module), Teacher commentary             |  |
|  |   Readers : enrolled Students                                   |  |
|  |   Mode    : read-only feed                                      |  |
|  +-----------+------------------------------------------------------+  |
|  | TEACHER <-> STUDENT DIRECT MESSAGE THREAD                        |  |
|  |   Initiator : Teacher only                                      |  |
|  |   Replies   : Student (to that thread only)                     |  |
|  |   Oversight : School Admin (read-only, always visible)          |  |
|  +------------------------------------------------------------------+  |
|  | PROJECT COMMENTS                                                 |  |
|  |   Writers : Teacher (feedback), Student author/team (response)  |  |
|  |   Readers : Teacher + owning Student/team                       |  |
|  |   Peer-review variant: class-visible when teacher enables       |  |
|  +------------------------------------------------------------------+  |
|                                                                        |
|  LAYER 4 — TEAM                                                        |
|  +------------------------------------------------------------------+  |
|  | TEAM CHANNEL                                                     |  |
|  |   Writers : team members (Students)                             |  |
|  |   Oversight : Teacher (read + moderate), School Admin (read)    |  |
|  |   Mode    : moderated group channel                             |  |
|  +------------------------------------------------------------------+  |
|  | TEAM PROJECT COMMENTS                                            |  |
|  |   Writers : team members, Teacher                               |  |
|  |   Readers : team members + Teacher + School Admin               |  |
|  +------------------------------------------------------------------+  |
|                                                                        |
|  CROSS-CUTTING                                                         |
|  +------------------------------------------------------------------+  |
|  | ABUSE / SAFETY REPORTS  (any user -> moderation queue)           |  |
|  | SAFEGUARDING ESCALATION (Teacher/Mod -> safeguarding queue)      |  |
|  +------------------------------------------------------------------+  |
+------------------------------------------------------------------------+

ARCHITECTURALLY PROHIBITED (no API path shall implement these):
  - Student-to-Student direct messaging (any variant, any age group)
  - Anonymous public forums or open comment feeds involving Students
  - Third-party chat embeds linked from the authenticated session
```

### Real-Time Transport

Communication channels with real-time delivery requirements (Team Channel, Teacher-Student DM, Class Announcements) use Socket.IO over WebSocket. Long-form, non-real-time channels (Project Comments, Task Feed) use REST/GraphQL polling or server-sent events. Collaborative project artefact editing uses Yjs CRDT (see Functional Requirements: RoboCode Studio IDE); that channel is distinct from the communication channels specified here.

---

## Functional Requirements: Communication Channels

### Platform and School Announcements

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-COMM-001 | The system shall provide a Platform Announcements channel through which a Super Admin or Platform Moderator may broadcast a read-only message to all authenticated users or to a scoped subset (by role: all School Admins, all Teachers, etc.). | Must | Subset scoping enforced via JWT `role` claim; message queued to all matching accounts within 30 seconds of publication. |
| FR-COMM-002 | The system shall provide a School Announcements channel per tenant through which the School Admin may broadcast read-only messages to all Teachers, all Students, or both within the school. | Must | Messages scoped by `tenant_id` + `role` filter; RLS enforced at data layer. |
| FR-COMM-003 | Platform and School Announcements shall be read-only for all recipients. No student or teacher reply mechanism shall be exposed on announcement messages. | Must | The absence of a reply affordance is enforced at API level: `POST /channels/{id}/messages` returns `403 Forbidden` for recipients on announcement channels. |
| FR-COMM-004 | Announcements shall be persisted to the database and visible to users who log in after the announcement was sent (i.e., they are not ephemeral push-only messages). | Must | Announcements remain visible in the channel history for 90 days by default; configurable by Super Admin up to 365 days. |
| FR-COMM-005 | The system shall support scheduling a Platform or School Announcement for future delivery, with a specified UTC delivery timestamp. | Should | Scheduled announcement stored in `PENDING` state; a background job promotes it to `PUBLISHED` at the scheduled time via a Redis-backed task queue. |

### Class Announcements and Task Feed

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-COMM-010 | The system shall provide a Class Announcements channel per class, scoped to the enrolling tenant and class. Only the assigned Teacher(s) may post to the channel; enrolled Students may only read. | Must | Class enrolment and teacher assignment managed by FR-LRN (Learning Management); channel membership derived from class roster at runtime. |
| FR-COMM-011 | The system shall provide a Task / Assignment Feed per class that publishes system-generated events from the LRN module (task assigned, deadline reminder, task graded, feedback posted) alongside optional teacher commentary messages. | Must | Feed entries are created by the LRN module via an internal event bus (NestJS EventEmitter or message broker); Teacher commentary posts use the standard message creation API. |
| FR-COMM-012 | Students shall not be able to post to the Task/Assignment Feed. The Teacher may post commentary messages that appear inline with system events in the feed timeline. | Must | System events are distinguished from teacher commentary by a `source` field (`system` vs. `teacher`) in the message schema (DR-COMM). |
| FR-COMM-013 | The system shall deliver deadline reminder notifications from the Task/Assignment Feed to enrolled Students at configurable lead times (default: 48 hours and 24 hours before a deadline), as in-app notifications and email. | Should | Lead times configurable per task by the Teacher. Reminder notifications link directly to the relevant task in RoboCode Studio. |

### Teacher-to-Student Direct Messaging

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-COMM-020 | The system shall support Teacher-initiated one-to-one message threads between a Teacher and an individual Student, scoped to a class the Teacher is assigned to. | Must | A Teacher may initiate a DM thread only with Students in their own classes and within their tenant. Cross-tenant DMs are prohibited. |
| FR-COMM-021 | A Student shall be able to reply to a Teacher-initiated DM thread. Students shall not be able to initiate a new DM thread, either to a Teacher or to any other Student. | Must | The DM thread initiation endpoint is restricted to the `Teacher` and higher roles via RBAC scope `class:dm_initiate`. |
| FR-COMM-022 | All Teacher-Student DM threads and their complete history shall be visible in read-only mode to the School Admin of the tenant at any time, without prior notice to participants. | Must | Disclosed in the platform Terms of Service and Privacy Notice. Accessed via the School Admin's student safeguarding view; access itself is audit-logged (FR-COMM-120). |
| FR-COMM-023 | Every message in a Teacher-Student DM thread shall pass through the content moderation pipeline (FR-MOD-010) before delivery. Messages with FLAG status are held pending review; messages with BLOCK status are rejected before storage. | Must | The pipeline applies in both directions (teacher-to-student and student reply). |
| FR-COMM-024 | If a Teacher's DM to a Student is moderated (flagged or blocked), the Platform Moderator and School Admin shall be notified. If a Student's DM reply is moderated, the Teacher and School Admin shall be notified. | Must | Notification routes: FR-COMM-060. The notification is sent regardless of the ultimate moderation outcome. |

### Team Channels

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-COMM-030 | The system shall provide a Team Channel for each team created under the Teams module (FR-TEAM). The channel shall be accessible to all team members (Students) and to the supervising Teacher(s) and School Admin. | Must | Team membership synchronised from FR-TEAM data model via an internal domain event; channel membership updated within 10 seconds of team roster change. |
| FR-COMM-031 | Team member Students may post messages in the Team Channel. The channel is not visible to Students outside the team or to the general public. | Must | Visibility enforced by `team_id` scoping at data layer with Postgres RLS; no public-facing endpoint exposes team channel content. |
| FR-COMM-032 | The supervising Teacher and School Admin shall have read-only access to Team Channel history by default; they may post messages in a "moderator" capacity (e.g., to issue instructions or warnings). | Must | Teacher moderator posts are visually distinguished from student posts in the UI using a role badge. |
| FR-COMM-033 | A Teacher shall be able to mute a specific Student within a Team Channel (preventing the student from posting for a configurable duration) or remove the Student from the channel. Mute and removal events shall be audit-logged and visible to the School Admin. | Must | Mute/remove is reversible. The Teacher may simultaneously raise a safeguarding flag (FR-MOD-050) for the underlying conduct. |
| FR-COMM-034 | All messages posted to a Team Channel shall pass through the content moderation pipeline (FR-MOD-010) before delivery to other channel members. | Must | Pipeline latency budget: 2 seconds for messages up to 2 000 characters (see FR-MOD-011). |

### Project Comments

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-COMM-040 | The system shall provide a Project Comments thread on each submitted project or task artefact, allowing the Teacher to post feedback and the Student author (or team members) to respond. | Must | Comments are scoped to the project artefact (`project_id`). Non-owning students may not read or post unless the Teacher explicitly enables peer review for that artefact. |
| FR-COMM-041 | The Teacher may enable a peer-review mode for a specific project or task, making the artefact and its comments visible to other enrolled Students in the class for review and discussion. Peer-review comments remain visible to the Teacher and School Admin. | Could | Peer review is disabled by default. Student anonymity within peer review should be supported as a Teacher-configurable option (reviewer names are replaced with anonymous identifiers in the student-facing view, but are visible to the Teacher). |
| FR-COMM-042 | All Project Comments shall pass through the content moderation pipeline before persistence. | Must | Same pipeline as FR-MOD-010. |

---

## Functional Requirements: Notification Service

### Notification Channels

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-COMM-050 | The notification service shall support three delivery channels: in-app (real-time WebSocket push and on-load pull), email (transactional, via SES/SendGrid), and optional SMS (Africa-suitable gateway, e.g., Africa's Talking or Vonage). | Must | SMS is an opt-in supplement. The in-app and email channels are always active. Delivery channel availability is configured per deployment environment. |
| FR-COMM-051 | In-app notifications shall be delivered to the authenticated user's browser session within 5 seconds of the triggering event under normal platform operating conditions (see NFR-PERF in the Non-Functional Requirements section). | Must | Delivered via Socket.IO room keyed on `user_id`; a REST endpoint (`GET /notifications`) provides catch-up for sessions that were offline at event time. |
| FR-COMM-052 | Undelivered in-app notifications (user was offline) shall be persisted to the offline notification queue and delivered on the user's next authenticated session. Undelivered notifications older than 30 days shall be automatically expired, per the Authoritative Data Retention Schedule (Data Architecture section) and NFR-REL-025. | Must | 30-day queue stored in Redis Streams (NFR-REL-025); expired notifications are deleted (not archived) as they are non-sensitive operational data. General (delivered) notifications follow the 12-month retention in the Authoritative Data Retention Schedule. |
| FR-COMM-053 | Email notifications shall be sent as transactional emails from a platform-managed address (e.g., `no-reply@robocode.africa`) using a configured SES/SendGrid integration. White-label tenants shall be able to configure a custom sender address (e.g., `noreply@school.example.com`) subject to domain verification (SPF/DKIM). | Must | Domain verification for custom sender addresses uses the same ACME/DNS flow as custom domain setup (FR-TEN). |
| FR-COMM-054 | SMS notifications shall be sent only to phone numbers that have received explicit opt-in consent, separate from general account consent. SMS is used only for time-critical events: safeguarding alerts, account approval for School Admins, and critical security events. | Should | SMS opt-in captured at account settings; consent record stored in the audit log with timestamp and source. |
| FR-COMM-055 | Notification email templates shall be defined in a versioned template store (e.g., MJML source compiled to HTML), supporting localisation (see FR-COMM-075) and white-label theming (logo, brand colours via design tokens). | Must | Template changes deployed via CI/CD; version pinned per notification type to allow staged rollout. |
| FR-COMM-056 | Notification emails shall include a plain-text alternative part, use a minimum body font size of 14 px, meet WCAG 2.2 AA colour contrast (4.5:1 for normal text), and render correctly in major email clients (tested via Litmus or equivalent). | Must | See Accessibility, Internationalisation and Low-Bandwidth Design section. |

### Notification Event Taxonomy

The following table defines the platform's canonical notification events, the delivery channels, and the roles that receive each event. In-app and Email are the default channels; SMS is noted where applicable.

| Event Type | In-App | Email | SMS | Recipients |
|------------|--------|-------|-----|------------|
| Student direct signup awaiting approval | Yes | Yes | — | Super Admin, Platform Moderator |
| Student school signup awaiting approval | Yes | Yes | Yes | School Admin |
| Parental consent request sent | — | Yes | — | Parent / Guardian |
| Parental consent responded (granted/declined) | Yes | Yes | — | School Admin, Super Admin |
| Account activated (approved) | Yes | Yes | — | Student, Parent/Guardian |
| Account rejected | — | Yes | — | Student, Parent/Guardian |
| Task assigned | Yes | Yes | — | Student |
| Task deadline reminder | Yes | Yes | — | Student |
| Task graded / feedback posted | Yes | Yes | — | Student |
| Class announcement posted | Yes | Yes | — | enrolled Students |
| School announcement posted | Yes | Yes | — | Teachers, Students |
| Platform announcement posted | Yes | Yes | — | all authenticated users |
| Teacher DM received (by student) | Yes | Should | — | Student |
| Team channel message | Yes | — | — | team members |
| Abuse report submitted | Yes | Yes | — | School Admin, Platform Mod, Super Admin |
| Moderation queue item added | Yes | Yes | — | School Admin (scoped), Platform Mod |
| Safeguarding item created | Yes | Yes | Yes | School Admin (scoped), Platform Mod, Super Admin |
| Safeguarding item unacknowledged (SLA breach) | Yes | Yes | Yes | Platform Mod, Super Admin |
| Account security event (new device login, MFA reset) | Yes | Yes | — | account owner |
| RoboPoints milestone reached | Yes | Could | — | Student |
| Subscription / billing event | Yes | Yes | — | Super Admin, School Admin |
| Platform maintenance notice | Yes | Yes | — | all authenticated users |

### Notification Preferences

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-COMM-060 | Users shall be able to configure notification preferences per event category and per delivery channel from within account settings. Preferences are stored in the `notification_preferences` table (DR-COMM). | Must | Preferences UI must be keyboard-accessible and operable without a mouse (WCAG 2.2 SC 2.1.1). |
| FR-COMM-061 | Mandatory notifications that cannot be disabled: parental consent requests; safeguarding alerts; account security events (new-device login, password changed, MFA enrolled/reset); critical platform-wide notices; account approval/rejection. The preference UI shall not display toggle controls for mandatory notifications. | Must | The API rejects preference-change requests that target mandatory event types with `400 Bad Request`. |
| FR-COMM-062 | The notification service shall support digest mode: for eligible lower-priority event categories (e.g., RoboPoints earned, new task available, class announcement), users may opt for a daily or weekly digest email aggregating multiple events. Critical and safety events are always sent immediately. | Should | Digest jobs run daily at 07:00 and weekly on Monday 07:00 (UTC); tenant timezone offset applied where configured. |
| FR-COMM-063 | Notification preference changes shall be logged to the audit log (FR-COMM-120) with the previous and new preference state, the actor user ID, and a timestamp. | Must | Allows detection of an attacker disabling security notifications after account compromise. |

### Notification Batching and Delivery

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-COMM-065 | The notification service shall implement delivery deduplication: if the same logical event would trigger multiple notifications to the same user within a 60-second window, they shall be coalesced into a single notification. | Should | Prevents notification storms from rapid LRN module events. |
| FR-COMM-066 | Failed email deliveries (bounce or rejection from SES/SendGrid) shall be retried up to 3 times with exponential back-off (30 s, 5 min, 30 min). Persistent delivery failure shall be flagged in the audit log and, for critical notifications, shall trigger an in-app fallback notification. | Must | Delivery events (sent, bounced, delivered) recorded in FR-COMM-120 audit log. |
| FR-COMM-067 | The notification service shall track email delivery status via webhook callbacks from the email provider (SES/SendGrid event webhooks). Open-tracking (pixel tracking) shall not be used for engagement analytics or behavioural profiling; it is permissible only for diagnosing critical delivery failures. | Must | Complies with GDPR data-minimisation principle; no behavioural advertising. |
| FR-COMM-068 | Bulk notification dispatch (e.g., a Platform Announcement to tens of thousands of users) shall be processed via a Redis-backed queue (Bull/BullMQ) with rate limiting to respect email-provider sending limits. Estimated delivery completion time shall be visible to the issuing Super Admin. | Must | Queue depth and dispatch rate monitored via Prometheus/Grafana (see Observability, Logging, Monitoring and Support section). |

### Notification Localisation

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-COMM-075 | Notification copy (in-app, email, SMS) shall be internationalised using i18n message keys. The platform default locale is `en-GB` and the supported-locale set is the authoritative matrix defined in *Accessibility, Internationalisation and Low-Bandwidth Design*; additional locales may be contributed per tenant. | Must | i18n library: react-intl (client) and a Node.js i18n library (server-side template rendering). Default locale aligned to en-GB platform default. |
| FR-COMM-076 | A tenant may configure a default locale for its school; individual users may override the locale in their account settings. Notification templates are rendered in the recipient's locale at dispatch time. | Should | Locale stored on the `users` table; template rendering service selects the correct locale bundle at runtime. |
| FR-COMM-077 | All notification templates shall be stored with their locale variants in the template store and must be updated whenever product copy changes in the corresponding UI locale strings, enforced by a CI lint check. | Should | The lint check compares template keys against the i18n source-of-truth bundle; missing translations fail the build. |

---

## Functional Requirements: Content Moderation Pipeline

### Pipeline Architecture

The content moderation pipeline is the mandatory pre-persistence filter applied to all user-generated text on the platform. It runs synchronously before any message or comment is stored or dispatched to recipients.

```
+-------------------------------------------------------------------+
|                 CONTENT MODERATION PIPELINE (FR-MOD)              |
+-------------------------------------------------------------------+
|                                                                   |
|  USER SUBMITS TEXT (message / comment / project title / DM)       |
|          |                                                        |
|          v                                                        |
|  [STEP 1]  URL / LINK EXTRACTION                                  |
|            Strip and inspect embedded URLs.                       |
|            Blocklisted domains -> BLOCK immediately.              |
|            Unknown domains -> FLAG for review.                    |
|          |                                                        |
|          v                                                        |
|  [STEP 2]  PROFANITY / HATE-SPEECH FILTER                         |
|            Regex + configurable word list (platform + school).    |
|            ML classifier (confidence threshold configurable).     |
|          |                                                        |
|          v                                                        |
|  [STEP 3]  PII DETECTION                                          |
|            Regex patterns: email, phone, address, ID number,      |
|            social-media handles, off-platform contact vectors.    |
|            Named Entity Recognition (NER) model for coverage.     |
|          |                                                        |
|          v                                                        |
|  [STEP 4]  GROOMING / SOLICITATION SIGNAL DETECTOR                |
|            Keyword pattern matching + ML classifier.              |
|            Signals: requests to move off-platform, age/location   |
|            solicitation, gift/secret patterns.                    |
|          |                                                        |
|          v                                                        |
|  AGGREGATE RESULT:  CLEAN | FLAG | BLOCK                          |
|                                                                   |
|  CLEAN  -----> Message stored; delivered to recipients.           |
|  FLAG   -----> Message held (not visible to recipient).           |
|                Submitter sees "pending review" status.            |
|                Item added to moderation queue.                    |
|  BLOCK  -----> Message rejected (not stored in channel).          |
|                Full content stored in safeguarding audit log.     |
|                Submitter sees non-specific error.                 |
|                Incident logged; safeguarding auto-escalated if    |
|                grooming signal or minor-PII trigger.              |
+-------------------------------------------------------------------+
```

### Pipeline Requirements

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-MOD-010 | The content moderation pipeline shall be applied to all user-generated text before storage or delivery, covering: channel messages (all layers), project comments, project and team display names, user-controlled display names, and code comments/string literals in submitted project artefacts. | Must | Pipeline is a NestJS injectable service (`ModerationService`) called synchronously from message-creation and project-submission handlers. |
| FR-MOD-011 | The pipeline shall complete screening and return a verdict within 2 seconds for text inputs up to 2 000 characters under the platform's standard load conditions. Pipeline P95 latency must not exceed 3 seconds. | Must | Monitored via Prometheus histogram; alert threshold at P95 > 3 s. If the pipeline is unavailable, submissions must be rejected with a retriable error (fail-closed, never fail-open). |
| FR-MOD-012 | The pipeline shall execute steps in the order: (1) URL/link extraction and blocklist check; (2) profanity/hate-speech filter; (3) PII detection; (4) grooming/solicitation signal detection. The first BLOCK verdict short-circuits subsequent steps and immediately records the incident. | Must | Short-circuiting reduces latency for clear-cut BLOCK cases and avoids exposing content to all filter steps unnecessarily. |
| FR-MOD-013 | The pipeline verdict for each submission shall be recorded in the `moderation_events` table (DR-MOD) with: submission hash (SHA-256 of content), verdict, triggered rule or classifier ID, confidence score (for ML verdicts), submission timestamp, channel ID, actor user ID, and tenant ID. | Must | The full content of BLOCK verdicts is stored in the safeguarding audit log (FR-COMM-120), not in the `moderation_events` table, to limit access surface. |
| FR-MOD-014 | The pipeline shall be configurable without a code deployment: profanity word list updates, ML confidence thresholds, URL blocklist entries, and grooming keyword patterns are managed via an admin-accessible configuration store, with changes taking effect within 60 seconds of save. | Must | Configuration stored in Redis (with database persistence fallback); cache TTL 60 seconds on pipeline worker nodes. All configuration changes are audit-logged (FR-COMM-120) with the actor and before/after values. |

### Profanity and Hate-Speech Filter

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-MOD-020 | The profanity/hate-speech filter shall use a curated, human-maintained platform-level word list plus an ML text-classification model (operated as a platform-managed microservice, not via a third-party consumer API that would receive raw student text). | Must | The platform-level word list covers English profanity and common slang; additional African English variants shall be included in the baseline release word list. |
| FR-MOD-021 | The Super Admin and Platform Moderator shall be able to add, remove, and review entries in the platform-level word list via the administration panel without a code deployment. All changes are audit-logged. | Must | Word list edits are effective within 60 seconds (FR-MOD-014 cache flush). |
| FR-MOD-022 | School Admins shall be able to add entries to a school-scoped supplementary word list that augments (but does not replace) the platform-level list. School-scoped additions are effective only within that tenant and are audit-logged. Individual Teachers may propose additions to the School Admin but may not directly edit the list. | Should | Multi-tenant isolation: school-scoped list entries carry the `tenant_id` and are loaded alongside the platform list for evaluating messages in that tenant. |
| FR-MOD-023 | The ML classifier for profanity/hate-speech shall produce a confidence score between 0.0 and 1.0. The threshold above which a verdict becomes FLAG (versus CLEAN) shall be configurable by the Super Admin; the default is 0.75. The threshold above which a verdict becomes BLOCK shall be configurable separately; the default is 0.92. | Must | Configurable thresholds allow the platform to tune precision/recall trade-offs without a code deployment. Threshold changes are audit-logged. |
| FR-MOD-024 | The profanity filter false-positive rate on typical educational content (e.g., Arduino sketch comments, common English educational vocabulary) shall be below 0.5% as validated in pre-release testing on a representative content corpus. | Must | Acceptance criterion: run the filter against a labelled 10 000-sample educational content test set; false-positive count must be ≤ 50. |

### PII Detection

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-MOD-030 | The PII detection step shall identify the following data types as minimum: email addresses (RFC 5322 pattern), phone numbers (E.164 and common local formats for Zimbabwe, South Africa, Nigeria, Kenya), physical addresses (street address patterns), national identification / passport numbers (country-specific patterns for ZW, ZA, NG, KE), social media handles (common platform patterns), and URLs that appear to be off-platform contact vectors. | Must | Regex patterns maintained in the configuration store; NER model supplements regex coverage. |
| FR-MOD-031 | When a PII pattern is detected in any communication involving a minor (either the sender or the recipient is a minor), the pipeline verdict shall be BLOCK. When detected in a communication between adults only, the default verdict shall be FLAG; the Super Admin may reconfigure this to BLOCK for specific PII types. | Must | Minor status is determined from the `is_minor` flag on the user record, derived from the date of birth at account creation (FR-AUTH-005) and recalculated on birthday boundaries. |
| FR-MOD-032 | When a minor's message is blocked due to PII detection, the blocking shall be handled discreetly: the minor sees a generic message-submission error, not an explanation identifying the specific PII pattern. If the detected PII type matches a grooming/solicitation vector (e.g., the minor is sharing an off-platform contact detail with a Teacher), a safeguarding flag shall be raised automatically (FR-MOD-050). | Must | Non-specific error wording: "Your message could not be sent. Please try again." The safeguarding flag is created without informing either party of the flag. |
| FR-MOD-033 | Blocked content containing PII shall not be stored in any user-visible database table or channel history. The full content (including the detected PII) shall be stored exclusively in the safeguarding audit log (FR-COMM-120) with access restricted to Super Admin and Platform Moderator. | Must | Ensures no PII exposure via data breach of general-purpose tables. |

### Grooming and Solicitation Signal Detection

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-MOD-040 | The grooming/solicitation signal detector shall use a combination of keyword pattern matching and an ML classifier trained or fine-tuned on known grooming-conversation patterns. The detector must operate as a platform-managed service and must not transmit raw student content to external third-party APIs. | Must | Model evaluated quarterly against updated pattern libraries; see Observability, Logging, Monitoring and Support section for model performance monitoring. |
| FR-MOD-041 | Grooming signal patterns shall include, at minimum: requests to move conversation off-platform (other apps, phone, email); age, location, or appearance solicitation; offers of gifts, secrets, or special arrangements; isolation patterns (discouraging contact with parents/teachers); and explicit sexual language or image solicitation. | Must | Pattern list is reviewed and updated at minimum quarterly by the DSL and the Super Admin. All pattern list changes are audit-logged. |
| FR-MOD-042 | Any positive grooming signal detection in a communication involving a minor participant shall result in an immediate BLOCK verdict plus automatic creation of a safeguarding queue item (FR-MOD-050) classified at High or Critical severity according to the classifier confidence. | Must | Auto-escalation is non-configurable; it cannot be disabled by any role including Super Admin. |
| FR-MOD-043 | The grooming signal detector shall produce a confidence score for each detection. The threshold for automatic safeguarding escalation shall be configurable between 0.65 and 0.95; the default is 0.80. Detections below the threshold but above 0.50 shall result in FLAG status without automatic safeguarding escalation. | Must | Threshold configurable by Super Admin; changes logged. Setting the threshold above 0.95 is blocked by the platform (minimum sensitivity guard). |

### Moderation Queue and Human Review

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-MOD-045 | The system shall maintain a moderation queue for all FLAG-status items. The queue is separate from the safeguarding queue. Items in the queue are visible to Platform Moderators (all items) and School Admins (items scoped to their tenant). | Must | Queue UI displays: submission timestamp, channel type, submitter role and anonymised identifier (full identity visible on item open), verdict reason, ML confidence score, and content preview (truncated for list view). |
| FR-MOD-046 | A moderator shall be able to perform one of three actions on a FLAG queue item: (a) Approve — release the message to its intended recipient(s); (b) Reject — permanently block the message, notify the Teacher (or School Admin if Teacher is the submitter), and log the outcome; (c) Escalate to Safeguarding — move the item to the safeguarding queue (FR-MOD-050) and apply BLOCK status. | Must | All actions are recorded in FR-COMM-120 audit log with: moderator user ID, action type, rationale (free text, required for Reject and Escalate), timestamp, and item ID. |
| FR-MOD-047 | The moderation queue shall display each item with the surrounding message context (up to 50 messages before and after in the same channel) to enable informed moderation decisions. | Must | Context access is itself audit-logged with the moderator's identity and timestamp. |
| FR-MOD-048 | The target review time for items in the general moderation queue is 4 business hours. Items that exceed this target shall be highlighted in the queue UI and shall trigger an escalating reminder notification to the responsible moderators. | Should | 4-hour target is a platform operations commitment, not an automated enforcement. Metric tracked in admin analytics (FR-ADM). |
| FR-MOD-049 | Platform Moderators shall be able to perform bulk moderation actions (approve all, reject all) on filtered subsets of the moderation queue, with a mandatory confirmation step. Bulk actions are audit-logged at the individual item level. | Should | Bulk action targets filtered view (e.g., all items for a specific school, all items of a specific verdict reason). Each item in the bulk action receives its own audit log entry. |

---

## Functional Requirements: Abuse Reporting and Safeguarding Escalation

### Abuse Report Ingestion

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-MOD-050 | The system shall provide a one-click "Report" action accessible on every message, comment, user profile, and project artefact visible to authenticated users. The control shall be keyboard-accessible and shall not require additional navigation to reach (WCAG 2.2 SC 2.1.1). | Must | Implemented as a contextual menu item and a persistent icon on hover/focus; always visible in the accessible keyboard navigation order. |
| FR-MOD-051 | The abuse report submission form shall require the reporter to select a report category from a controlled vocabulary: Inappropriate content, Harassment or bullying, Grooming or safety concern, Spam or scam, Other. The reporter may optionally add a free-text description up to 500 characters. | Must | Category selection is mandatory; free text is optional. The form is submitted as a `POST /reports` API call; the response includes a reference number displayed to the reporter. |
| FR-MOD-052 | Reporter identity shall be kept confidential from the reported party. The report record stores the reporter's user ID but this field is not exposed in any API response accessible to non-moderator roles. | Must | API guard: the `reporter_user_id` field is excluded from all GraphQL/REST projections available to Teacher, Student, Parent/Guardian, and Guest roles. |
| FR-MOD-053 | A submitted abuse report shall appear in the appropriate moderation queue within 60 seconds of submission. Reports with category "Grooming or safety concern" shall additionally be auto-created in the safeguarding queue (FR-MOD-055) simultaneously. | Must | Report routing is synchronous with report ingestion for safeguarding categories; general categories use an async queue (BullMQ). |
| FR-MOD-054 | Upon completing review of an abuse report, the moderator shall select an outcome from a controlled vocabulary: No action (dismissed), Content removed, User warned, User temporarily suspended, User deactivated (pending Super Admin confirmation), Escalated to safeguarding. All outcomes are audit-logged with a mandatory rationale. | Must | User suspensions and deactivations triggered by abuse report outcomes require Super Admin confirmation before taking effect, except when the reported content involves a grooming signal, in which case immediate temporary suspension of the reported account is permitted and the Super Admin is notified. |
| FR-MOD-055 | The reporting user shall receive an in-app and (for higher-priority reports) email notification confirming that their report has been received and reviewed, along with the report reference number. The notification shall not disclose the specific outcome taken against the reported party. | Should | Non-disclosure prevents reporter identification and retaliation. The reporter may contact the platform's published safeguarding contact for further enquiry. |

### Safeguarding Queue and Escalation Workflow

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-MOD-060 | The system shall maintain a Safeguarding Queue, separate from the general moderation queue. Items enter the safeguarding queue via: (a) automatic grooming signal detection (FR-MOD-042); (b) abuse report with category "Grooming or safety concern" (FR-MOD-053); (c) Teacher-initiated safeguarding flag from within the class or team communication view; (d) moderator escalation from the general moderation queue (FR-MOD-046). | Must | The Teacher-initiated flag is a first-class API endpoint (`POST /safeguarding/flags`) restricted to Teacher role and above; it bypasses the general moderation queue entirely. |
| FR-MOD-061 | The Safeguarding Queue shall be visible to: School Admins (items scoped to their tenant only), Platform Moderators (all items), and Super Admins (all items). No other role shall have access to the queue or its contents. | Must | Access control enforced via RBAC scope `safeguarding:read` assigned only to the three roles above; Postgres RLS applied for school scoping. |
| FR-MOD-062 | Each safeguarding queue item shall carry a severity classification: Low, Medium, High, or Critical. The automatic pipeline assigns an initial classification based on trigger type and ML confidence: grooming signal detection → High/Critical; PII-involving-minor block → Medium; general abuse report (safety category) → Medium. Moderators may adjust the classification with a mandatory written rationale; all adjustments are audit-logged. | Must | Setting a severity to lower than the auto-assigned level requires Super Admin approval (the moderator submits a reclassification request). |
| FR-MOD-063 | The system shall impose a mandatory acknowledgement SLA on safeguarding queue items: items must be acknowledged by an authorised role within 1 business hour of entering the queue (where "business hours" are defined in the platform operational policy, configurable by the Super Admin). The platform shall send escalating notifications (in-app, email, SMS where configured) at 30 minutes and at the 1-hour boundary. If not acknowledged within 1 business hour, the system shall automatically escalate to the next level in the role hierarchy. | Must | Escalation chain: School Admin → Platform Moderator → Super Admin. Escalation notifications use the mandatory (non-disableable) notification category (FR-COMM-061). |
| FR-MOD-064 | Each safeguarding item shall be resolved by a moderator selecting one of four documented outcome types: (a) No concern — logged and closed with rationale; (b) Internal action — warning, content removal, temporary suspension, or account deactivation, with audit record; (c) Super Admin escalation — for cross-tenant, serious, or repeat incidents; (d) External referral — documented referral to law enforcement or a recognised child-protection authority. | Must | For outcome (d), the system provides a structured referral documentation template (pre-filled with incident timeline, account details, moderation history) that a Super Admin can export as PDF for use with external authorities. |
| FR-MOD-065 | When a safeguarding case involves a minor, the system shall notify the associated Parent / Guardian of the existence of a safeguarding concern and that it is under review, using plain-language wording appropriate for a non-technical audience. For Critical items, Parent / Guardian notification is sent automatically upon severity classification. For High/Medium items, notification is triggered at the point of triage decision (outcome b, c, or d). The notification must not name the reporting party or contain details that could compromise an investigation. | Must | Parent / Guardian notification uses the mandatory (non-disableable) notification category. If no Parent / Guardian account is linked (e.g., the minor has not yet had a guardian consent record created), the School Admin is notified to contact the guardian directly. |
| FR-MOD-066 | The safeguarding escalation pathway shall be fully documented in ASCII-diagram form in the platform's internal operations runbook and reflected in the published Safeguarding Policy accessible from the marketing site footer and the authenticated platform help centre. | Must | The Safeguarding Policy shall name the Designated Safeguarding Lead (DSL) for the platform, the reporting procedure, the applicable legal standards, and the external escalation contacts. |

```
+------------------------------------------------------------+
|            SAFEGUARDING ESCALATION PATHWAY                 |
+------------------------------------------------------------+
|                                                            |
|  TRIGGER (any of):                                         |
|  (a) Auto: grooming/PII signal detected -> BLOCK           |
|  (b) User report: category = safety concern                |
|  (c) Teacher initiates safeguarding flag                   |
|  (d) Moderator escalates from moderation queue             |
|          |                                                 |
|          v                                                 |
|  [1]  SAFEGUARDING QUEUE ITEM CREATED                      |
|       Auto-classified: Low / Medium / High / Critical      |
|       Visible to: School Admin (scoped), Plat Mod, SA      |
|       SLA: acknowledge within 1 business hour              |
|       Escalating notifications at 30 min and 60 min        |
|          |                                                 |
|          v                                                 |
|  [2]  TRIAGE (School Admin / Platform Moderator)           |
|       Outcome A: No concern   -> log and close             |
|       Outcome B: Internal action -> warn/suspend/remove    |
|       Outcome C: Escalate     -> Super Admin review        |
|       Outcome D: External referral -> export documentation |
|          |                                                 |
|          v (if outcome C)                                  |
|  [3]  SUPER ADMIN REVIEW                                   |
|       May: apply platform-level account action;            |
|            notify Parent / Guardian;                       |
|            initiate external referral (outcome D);         |
|            deactivate account.                             |
|          |                                                 |
|          v                                                 |
|  [4]  CLOSE WITH FULL AUDIT RECORD                         |
|       All steps, decisions, actors, and timestamps         |
|       in immutable safeguarding audit log (FR-COMM-120).   |
|       Safeguarding records retained 7 years minimum.       |
+------------------------------------------------------------+
```

### Safeguarding Dashboard

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-MOD-070 | The system shall provide a Safeguarding Incidents Dashboard accessible to the Super Admin, displaying: open incidents by severity; average acknowledgement time; average time-to-close; incidents per school (school names anonymised in exported reports); and incident outcomes over a configurable date range. | Must | Dashboard data refreshes at most every 5 minutes. Aggregate statistics exportable as CSV and PDF for regulatory and DSL reporting. |
| FR-MOD-071 | The dashboard shall expose a breakdown of automated pipeline triggers (grooming detections, PII blocks, flagged items per channel type) to support tuning of detection thresholds and identification of emerging risk patterns. | Should | Visible to Super Admin and Platform Moderator only. No student-level PII exposed in aggregate statistics views. |

---

## Functional Requirements: Audit Logging and Retention

### Audit Log Schema and Capture

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-COMM-120 | The system shall maintain an immutable communications and moderation audit log covering the following event categories: message sent, message delivered, message held (FLAG), message blocked (BLOCK), message deleted by user, report submitted, report actioned, moderation queue item created, moderation decision taken, safeguarding item created, safeguarding item acknowledged, safeguarding item resolved, notification sent, notification delivery status changed, notification preference changed, audit log accessed by platform staff. | Must | "Immutable" means no platform operation (including Super Admin actions) can modify or delete log entries. Implemented via S3-compatible object store with S3 Object Lock (WORM policy) or a PostgreSQL append-only log partition with revocation-protected write grants. |
| FR-COMM-121 | Each audit log entry shall include at minimum: `event_id` (UUID v4), `event_type` (enum), `timestamp` (UTC, millisecond precision), `actor_user_id`, `actor_role`, `tenant_id`, `target_resource_type`, `target_resource_id`, `outcome` (success / failure / blocked / flagged / approved / rejected / escalated), `ip_address`, `correlation_id` (distributed trace ID), and `schema_version`. | Must | Schema additions are permitted in future versions; field deletions require a documented deprecation cycle and a schema migration audit entry. |
| FR-COMM-122 | Full content of BLOCK-verdict submissions (messages and comments) shall be stored in the safeguarding audit log partition, associated with the corresponding `moderation_event_id`. Access to this partition is restricted to Super Admin and Platform Moderator roles, enforced by Postgres RLS and application-layer RBAC. | Must | Full content storage is necessary for safeguarding evidence; it must not appear in general channel history or general moderation event views. |
| FR-COMM-123 | When a user deletes a message, the message text shall be removed from the user-visible channel history and marked `deleted` in the `messages` table. The original message content, the deleting actor's user ID, and the deletion timestamp shall be retained in the audit log. | Must | Disclosed in the platform Terms of Service and Privacy Notice. Deleted-message audit entries are subject to the same access restrictions as other audit data. |
| FR-COMM-124 | The audit log shall implement a cryptographic integrity mechanism (e.g., a SHA-256 hash chain where each entry includes the hash of the preceding entry) or WORM storage policy so that tampering with historical entries is detectable. | Must | Integrity verification is run as a scheduled daily job; verification failures trigger an alert to the Super Admin and Platform Moderator (see Observability section). Cross-reference SR-AUDIT in the Security, Privacy and Child Safety section. |

### Audit Log Access and Export

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-COMM-125 | The Super Admin shall have access to a structured audit log search interface supporting filters on: time range (from/to UTC), event type, actor user ID, target resource type and ID, tenant, outcome, and IP address. Search results shall be paginated and exportable as JSON-L or CSV. | Must | Search response time: P95 ≤ 5 seconds for date ranges up to 90 days. Queries against longer ranges are accepted but may be served as asynchronous export jobs. |
| FR-COMM-126 | School Admins shall have access to a school-scoped audit log view covering communication and moderation events within their tenant. They shall not be able to access audit log entries from other tenants. Multi-tenant isolation is enforced by Postgres RLS on the `tenant_id` column. | Must | School Admin audit log view does not include safeguarding content (FR-COMM-122) or content from moderation events in other schools. |
| FR-COMM-127 | Access to the audit log by any platform staff member (including Super Admin) shall itself be audit-logged, creating a meta-audit trail. Meta-audit entries are subject to the same retention and immutability requirements as primary audit entries. | Must | Meta-audit prevents insider-threat scenarios where a staff member accesses sensitive records and deletes the evidence of access. |
| FR-COMM-128 | The Super Admin shall be able to initiate a full audit log export (platform-wide or school-scoped) in JSON-L or CSV format for regulatory inspection or legal disclosure. Exports shall be queued for background processing and delivered as a time-limited (48-hour expiry), authenticated secure download link. | Must | Export request itself is audit-logged. Large exports must complete within 24 hours of request initiation. |

### Retention Periods

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-COMM-130 | General communication audit log entries (messages, notifications, general moderation) shall be retained for a minimum of 12 months from the event date. | Must | Aligns with UR-COMM-010. Entries older than the retention period are automatically purged by a scheduled job; purge actions are themselves logged in the meta-audit trail. |
| FR-COMM-131 | Safeguarding audit records (safeguarding queue items, grooming detection events, abuse reports with a safety category, and associated BLOCK-verdict content) shall be retained for a minimum of 7 years from the date of the safeguarding event, or longer if required by applicable law. | Must | Aligns with the most conservative applicable legal instrument across COPPA, GDPR-K, Zimbabwe CDPA 2021, South Africa POPIA, Nigeria NDPR, and Kenya Data Protection Act 2019. |
| FR-COMM-132 | Notification delivery audit records (email sent, bounced, delivered) shall be retained for a minimum of 12 months. Email open events (if captured for critical delivery diagnostics) shall be retained for a maximum of 30 days and must not be used for engagement profiling or behavioural advertising. | Must | Data-minimisation obligation; complies with GDPR and GDPR-K. |

---

## MoSCoW Priority Summary

The following table provides a consolidated MoSCoW view of all FR-COMM and FR-MOD requirements in this section.

| ID | Short Title | Priority |
|----|-------------|----------|
| FR-COMM-001 | Platform Announcements broadcast | Must |
| FR-COMM-002 | School Announcements per tenant | Must |
| FR-COMM-003 | Announcements read-only for recipients | Must |
| FR-COMM-004 | Announcements persisted to history | Must |
| FR-COMM-005 | Scheduled announcement delivery | Should |
| FR-COMM-010 | Class Announcements channel | Must |
| FR-COMM-011 | Task / Assignment Feed with LRN events | Must |
| FR-COMM-012 | Students read-only on Task Feed | Must |
| FR-COMM-013 | Deadline reminder notifications | Should |
| FR-COMM-020 | Teacher-initiated Student DM thread | Must |
| FR-COMM-021 | Student may reply; cannot initiate DM | Must |
| FR-COMM-022 | School Admin oversight of DM threads | Must |
| FR-COMM-023 | DM messages pass moderation pipeline | Must |
| FR-COMM-024 | Notification when DM is moderated | Must |
| FR-COMM-030 | Team Channel with teacher oversight | Must |
| FR-COMM-031 | Team Channel scoped to team membership | Must |
| FR-COMM-032 | Teacher and School Admin moderator access | Must |
| FR-COMM-033 | Teacher mute / remove student from channel | Must |
| FR-COMM-034 | Team Channel messages pass moderation | Must |
| FR-COMM-040 | Project Comments thread | Must |
| FR-COMM-041 | Teacher-enabled peer-review mode | Could |
| FR-COMM-042 | Project Comments pass moderation | Must |
| FR-COMM-050 | Three notification delivery channels | Must |
| FR-COMM-051 | In-app notification within 5 seconds | Must |
| FR-COMM-052 | Offline notification persistence (30 days) | Must |
| FR-COMM-053 | Transactional email with tenant sender config | Must |
| FR-COMM-054 | SMS for time-critical events (opt-in) | Should |
| FR-COMM-055 | Versioned localised email templates | Must |
| FR-COMM-056 | WCAG 2.2 AA email template compliance | Must |
| FR-COMM-060 | User-configurable notification preferences | Must |
| FR-COMM-061 | Mandatory non-disableable notification types | Must |
| FR-COMM-062 | Daily / weekly digest mode | Should |
| FR-COMM-063 | Notification preference changes audit-logged | Must |
| FR-COMM-065 | Delivery deduplication (60-second window) | Should |
| FR-COMM-066 | Failed email delivery retry (3 attempts) | Must |
| FR-COMM-067 | Email open-tracking restricted to diagnostics | Must |
| FR-COMM-068 | Bulk notification via Redis-backed queue | Must |
| FR-COMM-075 | i18n for notification copy | Must |
| FR-COMM-076 | Per-tenant and per-user locale configuration | Should |
| FR-COMM-077 | Template locale completeness CI lint check | Should |
| FR-MOD-010 | Moderation pipeline applied to all channels | Must |
| FR-MOD-011 | Pipeline P95 latency ≤ 3 seconds; fail-closed | Must |
| FR-MOD-012 | Ordered pipeline steps; short-circuit on BLOCK | Must |
| FR-MOD-013 | Moderation event record in DR-MOD table | Must |
| FR-MOD-014 | Pipeline configurable without code deployment | Must |
| FR-MOD-020 | Profanity filter: word list + ML classifier | Must |
| FR-MOD-021 | Super Admin / Platform Mod can edit word list | Must |
| FR-MOD-022 | School Admin supplementary word list | Should |
| FR-MOD-023 | Configurable ML confidence thresholds | Must |
| FR-MOD-024 | False-positive rate below 0.5% on educational content | Must |
| FR-MOD-030 | PII detection: regex + NER for defined types | Must |
| FR-MOD-031 | BLOCK on PII detection for minor participants | Must |
| FR-MOD-032 | Minor PII block is discreet; auto safeguarding flag | Must |
| FR-MOD-033 | Blocked PII content stored only in safeguarding log | Must |
| FR-MOD-040 | Grooming signal detector: keyword + ML | Must |
| FR-MOD-041 | Defined grooming signal pattern catalogue | Must |
| FR-MOD-042 | Grooming detection for minors auto-escalates | Must |
| FR-MOD-043 | Configurable grooming detection threshold (0.65–0.95) | Must |
| FR-MOD-045 | Moderation queue with school-scoped access | Must |
| FR-MOD-046 | Moderator actions: approve / reject / escalate | Must |
| FR-MOD-047 | Moderator context view (50-message window) | Must |
| FR-MOD-048 | 4-hour target review time with reminder | Should |
| FR-MOD-049 | Bulk moderation with confirmation and item-level log | Should |
| FR-MOD-050 | One-click Report on all content and profiles | Must |
| FR-MOD-051 | Report form: category + optional free text | Must |
| FR-MOD-052 | Reporter identity confidential from reported party | Must |
| FR-MOD-053 | Report in queue within 60 seconds | Must |
| FR-MOD-054 | Structured outcome vocabulary for report resolution | Must |
| FR-MOD-055 | Reporter notification upon report actioned | Should |
| FR-MOD-060 | Safeguarding Queue: four trigger types | Must |
| FR-MOD-061 | Safeguarding Queue access restricted to three roles | Must |
| FR-MOD-062 | Severity classification with reclassification audit | Must |
| FR-MOD-063 | 1-hour acknowledgement SLA with escalating alerts | Must |
| FR-MOD-064 | Four structured safeguarding outcome types | Must |
| FR-MOD-065 | Parent / Guardian notification for minor cases | Must |
| FR-MOD-066 | Safeguarding pathway documented in policy | Must |
| FR-MOD-070 | Safeguarding Incidents Dashboard for Super Admin | Must |
| FR-MOD-071 | Pipeline trigger breakdown for threshold tuning | Should |
| FR-COMM-120 | Immutable communications and moderation audit log | Must |
| FR-COMM-121 | Minimum audit log entry schema | Must |
| FR-COMM-122 | BLOCK content in restricted safeguarding partition | Must |
| FR-COMM-123 | Deleted-message content retained in audit log | Must |
| FR-COMM-124 | Cryptographic audit log integrity verification | Must |
| FR-COMM-125 | Super Admin audit log search and export | Must |
| FR-COMM-126 | School Admin school-scoped audit log view | Must |
| FR-COMM-127 | Meta-audit trail for audit log access | Must |
| FR-COMM-128 | Full audit log export for regulatory disclosure | Must |
| FR-COMM-130 | General audit log retention: 12 months | Must |
| FR-COMM-131 | Safeguarding audit retention: 7 years minimum | Must |
| FR-COMM-132 | Notification delivery log: 12 months; open events: 30 days | Must |

---

## Data Model Notes

The following tables and their key columns are defined in the Data Architecture and Database Design section (DR-COMM, DR-MOD). This section cross-references them for traceability.

| Table | Key Columns | Used By |
|-------|------------|---------|
| `channels` | `id`, `type`, `tenant_id`, `class_id`, `team_id`, `created_at` | FR-COMM-001–042 |
| `messages` | `id`, `channel_id`, `sender_user_id`, `content`, `status`, `deleted_at`, `tenant_id` | FR-COMM-020–042 |
| `notifications` | `id`, `user_id`, `tenant_id`, `event_type`, `channel`, `status`, `expires_at` | FR-COMM-050–068 |
| `notification_preferences` | `user_id`, `event_type`, `channel`, `enabled`, `digest_mode` | FR-COMM-060–063 |
| `moderation_events` | `id`, `submission_hash`, `verdict`, `rule_id`, `confidence`, `channel_id`, `actor_user_id`, `tenant_id` | FR-MOD-010–043 |
| `moderation_queue` | `id`, `moderation_event_id`, `status`, `assignee_user_id`, `tenant_id` | FR-MOD-045–049 |
| `abuse_reports` | `id`, `reporter_user_id`, `reported_resource_type`, `category`, `description`, `outcome`, `tenant_id` | FR-MOD-050–055 |
| `safeguarding_items` | `id`, `trigger_type`, `severity`, `status`, `tenant_id`, `acknowledged_at`, `resolved_at`, `outcome_type` | FR-MOD-060–071 |
| `comm_audit_log` | `event_id`, `event_type`, `timestamp`, `actor_user_id`, `tenant_id`, `outcome`, `schema_version` | FR-COMM-120–132 |

All tables include a `tenant_id` column with Postgres Row-Level Security policies enforcing tenant isolation. The `comm_audit_log` table uses an append-only write grant; no `UPDATE` or `DELETE` privilege is granted to the application role.

---

## Interface and Integration Cross-References

| Reference | Description |
|-----------|-------------|
| IR-COMM-WS | WebSocket (Socket.IO) channel events for real-time message delivery; JWT authentication at connection handshake (FR-AUTH-076). |
| IR-COMM-EMAIL | Email delivery integration: SES/SendGrid webhook events for bounce and delivery status; template rendering API. |
| IR-COMM-SMS | SMS delivery integration: Africa's Talking / Vonage API; opt-in consent management. |
| IR-COMM-LRN | Internal domain event bus integration with the LRN module for Task/Assignment Feed event publication (FR-COMM-011). |
| IR-COMM-TEAM | Internal integration with the TEAM module for team roster synchronisation to Team Channel membership (FR-COMM-030). |
| IR-MOD-CLASSIFY | Internal moderation pipeline service API (NestJS injectable); not exposed externally. Grooming/PII model served from platform-managed inference container. |
| SR-AUDIT | Audit log integrity and WORM storage controls; defined in the Security, Privacy and Child Safety section. |
| DR-COMM, DR-MOD | Full schema definitions for communication and moderation tables; defined in the Data Architecture and Database Design section. |
| NFR-PERF | Notification latency, moderation pipeline throughput, and audit log search performance SLOs; defined in the Non-Functional Requirements section. |

---

## Compliance Mapping

| Legal Instrument | Key Obligation | Fulfilled By |
|------------------|---------------|--------------|
| COPPA (US, under-13) | No personal data without verifiable consent; right to deletion | FR-MOD-031 (block minor PII), FR-MOD-033 (no PII in user-visible storage); consent gate in FR-AUTH-020 |
| GDPR / GDPR-K (EU) | Data minimisation; no profiling; right to erasure; age-appropriate design | FR-COMM-003 (no unsolicited messaging), FR-COMM-067 (no engagement tracking), FR-COMM-132 (short open-event retention) |
| UK Children's Code | Privacy by default; best-interests design; no nudge techniques | FR-COMM-060/061 (safety notifications non-disableable), FR-COMM-003 (read-only broadcasts) |
| Zimbabwe CDPA 2021 | Lawful processing; data subject rights; cross-border transfer restrictions | FR-COMM-120–132 (full audit trail); data residency addressed in NFR |
| South Africa POPIA | Conditions for lawful processing; special conditions for children's data | FR-MOD-065 (guardian notification), FR-COMM-131 (7-year safeguarding retention) |
| Nigeria NDPR 2019 | Consent; data subject rights; data processing principles | FR-COMM-060 (preference management), FR-COMM-128 (regulatory export capability) |
| Kenya Data Protection Act 2019 | Registration; processing principles; children's data special category | FR-MOD-066 (published safeguarding policy with DSL), FR-MOD-070 (incident dashboard for regulatory reporting) |

---

## Cross-References to Other Sections

- **Functional Requirements: Identity, Authentication and Authorization (FR-AUTH)** — account state machine (FR-AUTH-080–082) governs the suspension and deactivation outcomes available in the moderation and safeguarding workflows; JWT role claims used for RBAC enforcement across all channel and moderation APIs.
- **Functional Requirements: Multi-Tenancy, Custom Domains and White-Labelling (FR-TEN)** — subdomain routing, Postgres RLS, and custom sender domain verification used by the notification service and audit log.
- **Functional Requirements: Learning Management and Content (FR-LRN)** — LRN module publishes domain events consumed by the Task/Assignment Feed (FR-COMM-011); class and task lifecycle drives notification events.
- **Functional Requirements: Teams, Competitions and Gamification (FR-TEAM, FR-GAM)** — Team Channel membership synchronised from TEAM module; RoboPoints milestone events trigger notification events via FR-GAM.
- **Functional Requirements: Administration, Analytics and Reporting (FR-ADM)** — admin console dashboards surface moderation queue statistics, safeguarding incident summaries, and audit log search; defined in FR-ADM.
- **Data Architecture and Database Design (DR-COMM, DR-MOD)** — canonical schema for all tables referenced in the Data Model Notes subsection above.
- **Security, Privacy and Child Safety (SR-AUDIT, SR-COMM)** — audit log integrity controls, WORM storage policy, access-control security requirements for safeguarding data.
- **Non-Functional Requirements (NFR-PERF, NFR-SEC)** — latency SLOs for in-app notification delivery and content moderation pipeline; security NFRs for input validation and injection prevention in message handling.
- **API Specification and Integration Interfaces (IR)** — WebSocket event schemas, REST/GraphQL endpoint definitions for channel, notification, report, and moderation queue APIs.
- **Observability, Logging, Monitoring and Support** — Prometheus metrics for moderation pipeline latency, notification queue depth, safeguarding SLA compliance; Sentry error tracking for pipeline failures; audit log integrity check alerting.
- **Accessibility, Internationalisation and Low-Bandwidth Design** — WCAG 2.2 AA requirements for notification UI components, keyboard accessibility of the Report control and moderation queue, and email template accessibility; i18n framework alignment.
