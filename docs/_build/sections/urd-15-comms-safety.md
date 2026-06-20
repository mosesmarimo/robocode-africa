# User Requirements: Communication, Notifications and Safety

## Overview

This section defines all user requirements governing communication between platform participants, the notification system, and — above all — the safety of children who use RoboCode.Africa. Safety is the prime directive of this section and overrides every convenience or engagement objective. Requirements that protect minors are non-negotiable Must items; no commercial or pedagogical rationale supersedes them.

The scope covers:

- Moderated in-platform communication (class announcements, teacher-to-student messaging, team channels, project comments)
- Notifications (in-app, email, optional SMS)
- Content moderation infrastructure (profanity filter, PII detection, moderation queues)
- Abuse reporting and flagging
- Safeguarding escalation pathways
- Audit logging and evidence preservation
- Compliance with the child-safety legal set (COPPA, GDPR-K, Zimbabwe CDPA, POPIA, NDPR, Kenya DPA)

All requirement identifiers in this section use the prefix **UR-COMM**. Cross-references to the System Specification Document use **FR-COMM**, **SR-nnn**, and **DR-nnn** prefixes. Related requirements in adjacent sections are cross-referenced by name and ID.

---

## Safety-First Prime Directive

> **No unsupervised private messaging between minors is permitted on RoboCode.Africa under any circumstances.** Every communication channel that can reach a Student is either teacher/admin-overseen or does not exist. This constraint is permanent and architectural, not configurable.

The following principles flow from this directive and are binding on all design, engineering, and operational decisions in this section:

1. **Supervised channels only.** Direct peer-to-peer messaging between students is not available. All channels route through, or are visible to, the responsible Teacher or School Admin.
2. **Default-safe.** Every communication feature defaults to the most restrictive safe setting. Relaxation requires explicit opt-in by a Teacher or School Admin and is bounded by platform policy.
3. **Transparent to guardians.** The existence, scope, and moderation of every communication channel is disclosed in the platform Privacy Notice. Significant safeguarding events trigger Parent/Guardian notification.
4. **Content moderated before persistence.** All user-generated text passes through automated screening before storage or display to others. Flagged content is held in a moderation queue.
5. **Full audit trail.** Every communication event, moderation action, escalation, and safeguarding decision is logged with tamper-evident timestamps and actor identities.
6. **Legal compliance.** All channels comply with COPPA, GDPR-K, the Zimbabwe CDPA, South Africa POPIA, Nigeria NDPR, and the Kenya DPA. Data minimisation applies; only data necessary to deliver and moderate the channel is collected.

---

## Communication Channels

RoboCode.Africa provides a structured, layered set of communication channels. The following ASCII diagram illustrates the channel hierarchy and the oversight relationships.

```
+---------------------------------------------------------------+
|               RoboCode.Africa Communication Model             |
+---------------------------------------------------------------+
|                                                               |
|  LAYER 1 — PLATFORM-WIDE (Super Admin / Platform Moderator)  |
|  +---------------------------------------------------------+  |
|  |  Platform Announcements  (read-only broadcast)          |  |
|  +---------------------------------------------------------+  |
|                                                               |
|  LAYER 2 — SCHOOL / TENANT (School Admin → Teachers)         |
|  +---------------------------------------------------------+  |
|  |  School Announcements    (School Admin broadcasts)      |  |
|  |  Teacher Notifications   (admin → individual teacher)  |  |
|  +---------------------------------------------------------+  |
|                                                               |
|  LAYER 3 — CLASS (Teacher → Students, fully overseen)        |
|  +---------------------------------------------------------+  |
|  |  Class Announcements     (teacher broadcasts)           |  |
|  |  Task / Assignment Feed  (teacher posts, system events) |  |
|  |  Teacher ↔ Student DM    (1:1, teacher-initiated only)  |  |
|  |  Project Comments        (on a submitted project/task)  |  |
|  +---------------------------------------------------------+  |
|                                                               |
|  LAYER 4 — TEAM (supervised team channel)                    |
|  +---------------------------------------------------------+  |
|  |  Team Channel            (members + supervising teacher)|  |
|  |  Team Project Comments   (on shared project artefacts)  |  |
|  +---------------------------------------------------------+  |
|                                                               |
|  CROSS-CUTTING                                                |
|  +---------------------------------------------------------+  |
|  |  Abuse / Safety Reports  (any user → moderation queue)  |  |
|  |  Safeguarding Escalation (teacher/mod → admin/external) |  |
|  +---------------------------------------------------------+  |
+---------------------------------------------------------------+
```

### What Is Explicitly Not Permitted

The following channel types are architecturally excluded and must not be implemented:

- Student-to-student direct messaging (any form, any age group)
- Anonymous public forums or global chat rooms involving students
- Social media-style open comment feeds visible to the general public
- Third-party chat embeds (e.g., Discord, WhatsApp) linked from within the authenticated platform

---

## Requirements: Moderated Communication

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-COMM-001 | The platform shall provide a Class Announcements channel per class, through which a Teacher may broadcast read-only messages to all enrolled Students. | Must | Students cannot reply directly to a class announcement; the teacher controls the discussion. |
| UR-COMM-002 | The platform shall provide a Task / Assignment Feed per class, automatically publishing system-generated events (task assigned, deadline changed, task graded) alongside optional teacher commentary. | Must | Events are generated by the LRN module. Feed is read-only for Students. |
| UR-COMM-003 | The platform shall allow a Teacher to send a one-to-one message to an individual Student (Teacher-initiated DM). Students may reply to the Teacher only, within that thread. | Must | Students cannot initiate a DM to a Teacher. The Teacher-DM thread is visible to the School Admin. Messages pass through content moderation before delivery. |
| UR-COMM-004 | The platform shall provide a Team Channel per team, visible to all team members and to the supervising Teacher(s) and School Admin. Students may post within the team channel. | Must | The Team Channel is not visible to students outside the team or to the public. Teacher and School Admin have read-only access by default; they may post as moderators. Content passes through automated screening. |
| UR-COMM-005 | The platform shall provide a Project Comments thread on each submitted project or task artefact, allowing the Teacher to post feedback and the Student author (or team) to respond. | Must | Comment threads are scoped to the project artefact. Other students in the class may not read or post to another student's project comments unless the teacher explicitly makes a project public within the class for peer review. |
| UR-COMM-006 | The platform shall allow a School Admin to broadcast a School Announcement to all Teachers and/or Students in the school. | Must | School Announcements are read-only for recipients. Students cannot reply to a School Announcement. |
| UR-COMM-007 | The platform shall allow a Super Admin or Platform Moderator to broadcast a Platform Announcement to all authenticated users, or to a scoped subset (e.g., all School Admins, all Teachers). | Must | Platform Announcements are read-only for recipients. Used for maintenance notices, policy updates, and critical safety communications. |
| UR-COMM-008 | The platform shall not provide any direct student-to-student messaging capability, including but not limited to: 1:1 DMs, group chats not overseen by a Teacher, anonymous posting, and reaction threads that can identify peer identities to other students. | Must | This is a hard architectural constraint enforced at the API layer. Attempts to circumvent (e.g., encoding messages in project names) shall be detectable via the content moderation pipeline. |
| UR-COMM-009 | The platform shall make all Teacher ↔ Student DM threads and Team Channel history accessible in read-only view to the School Admin for safeguarding review at any time, without prior notice to participants. | Must | Disclosed in the platform Terms of Service and Privacy Notice. |
| UR-COMM-010 | The platform shall retain all communication content, including deleted messages, in an immutable audit log for a minimum of 12 months, accessible only to Super Admin and authorised safeguarding roles. | Must | Deletion by a user marks the message hidden in the UI but does not remove it from the audit log. See UR-COMM-057. |
| UR-COMM-011 | A Teacher shall be able to mute or remove a specific Student from a Team Channel, with the action logged and visible to the School Admin. | Must | Mute/remove is reversible. The Teacher may also escalate the underlying conduct to the School Admin via the safeguarding workflow (UR-COMM-045). |
| UR-COMM-012 | The platform shall support optional peer-review of projects within a class, where the Teacher explicitly enables Students to view and comment on one another's published project artefacts. Peer-review comments are visible to the Teacher and School Admin. | Could | Only available when explicitly activated by a Teacher per task/assignment. Student anonymity option within peer review should be supported to reduce social pressure. |

---

## Requirements: Notifications

### Notification Delivery Channels

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-COMM-013 | The platform shall deliver in-app notifications within the authenticated UI for all system events relevant to the receiving user. | Must | In-app notifications must be visible within 5 seconds of the triggering event during normal platform operation (see Section 20: Non-Functional User Expectations). |
| UR-COMM-014 | The platform shall send email notifications for critical events, including: account activation, password reset, parental consent requests, safeguarding escalation confirmations, assignment deadlines (configurable lead time), and system-wide announcements. | Must | Transactional email is delivered via SES/SendGrid. Email templates must be plain-language, mobile-optimised, and WCAG 2.2 AA accessible. |
| UR-COMM-015 | The platform shall support optional SMS notification as a delivery channel for time-critical events (e.g., safeguarding alerts, account approval) in low-connectivity contexts. | Should | SMS is an opt-in supplement, not a replacement for email. Delivery via an Africa-suitable SMS gateway. Consent for SMS must be captured separately from general account consent. |
| UR-COMM-016 | Users shall be able to configure their notification preferences (channel and frequency) for each notification category from within their account settings, subject to mandatory notifications that cannot be disabled. | Must | Mandatory (non-configurable) notifications include: parental consent requests, safeguarding alerts, account security events (login from new device, password changed, MFA change), and platform-wide critical notices. |
| UR-COMM-017 | The platform shall support notification digest mode, allowing daily or weekly digest emails to replace individual-event emails for lower-priority notification categories (e.g., RoboPoints earned, new task available). | Should | Digest cadence is user-configurable. Critical and safety notifications are always sent immediately regardless of digest settings. |

### Notification Events by Role

The following table lists the principal notification events and the roles that receive them.

| Event | Super Admin | Platform Mod | School Admin | Teacher | Student | Parent / Guardian |
|-------|-------------|--------------|--------------|---------|---------|-------------------|
| New student signup (direct domain) | Yes | Yes | — | — | — | — |
| New student signup (school domain) | — | — | Yes | — | — | — |
| Parental consent request sent/responded | — | — | Yes | — | — | Yes |
| Student account approved / rejected | — | — | — | — | Yes | Yes |
| Task assigned / deadline | — | — | — | — | Yes | — |
| Task graded | — | — | — | — | Yes | — |
| Abuse report submitted | Yes | Yes | Yes | Yes | — | — |
| Safeguarding escalation | Yes | Yes | Yes | Yes | — | Yes (if involves their child) |
| Content moderation queue item | — | Yes | Yes (school-scoped) | — | — | — |
| RoboPoints milestone | — | — | — | — | Yes | Could |
| New class announcement | — | — | — | — | Yes | — |
| Account security event | — | — | — | Yes | Yes | — |
| Subscription/billing event | Yes | — | Yes | — | — | — |
| Platform maintenance notice | Yes | Yes | Yes | Yes | Yes | — |

> Note: "Could" in the Parent/Guardian column for RoboPoints milestone indicates an optional progress summary feature that is Could-priority for v1.0.

---

## Requirements: Content Moderation

Content moderation is a mandatory, always-on layer that applies to all user-generated text before it is stored or displayed to another user.

```
+------------------------------------------+
|       Content Moderation Pipeline         |
+------------------------------------------+
|                                          |
|  User submits text (message / comment /  |
|  project name / code comment)            |
|          |                               |
|          v                               |
|  [1] Profanity / Hate-Speech Filter      |
|      (configurable word-list + ML        |
|       classifier)                        |
|          |                               |
|  [2] PII Detection                       |
|      (email, phone, address, ID number   |
|       pattern matching + NER model)      |
|          |                               |
|  [3] Grooming / Solicitation Signals     |
|      (keyword pattern + ML classifier)  |
|          |                               |
|  Result: CLEAN | FLAG | BLOCK            |
|          |                               |
|  CLEAN ---> Stored and displayed         |
|  FLAG  ---> Held + queued for moderator  |
|             review; user sees "pending"  |
|  BLOCK ---> Rejected; user sees error;   |
|             incident logged; reporter    |
|             notified                     |
+------------------------------------------+
```

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-COMM-018 | All user-generated text submitted through any platform communication channel shall pass through the automated content moderation pipeline before being stored or displayed to any other user. | Must | The pipeline must complete screening within 2 seconds for messages up to 2 000 characters. |
| UR-COMM-019 | The content moderation pipeline shall include a configurable profanity and hate-speech filter driven by a curated word list plus an ML-based classifier. The word list shall be maintainable by the Super Admin and Platform Moderator without a code deployment. | Must | The default word list must include English profanity and common slang; School Admins may add school-specific terms to the school-scoped list. |
| UR-COMM-020 | The content moderation pipeline shall include PII detection covering at minimum: email addresses, phone numbers, home addresses, national identification numbers, and URLs that appear to be off-platform contact details. | Must | Detected PII in messages from or to minors must result in BLOCK status. Detected PII in messages between adults may result in FLAG status with moderator review. |
| UR-COMM-021 | The content moderation pipeline shall include a pattern-matching and ML-based grooming / solicitation signal detector that flags messages containing known grooming patterns or attempts to move conversation to off-platform channels. | Must | Any positive detection involving a minor participant shall result in immediate BLOCK and automatic escalation to the safeguarding queue (see UR-COMM-044). |
| UR-COMM-022 | Content that results in BLOCK status shall be rejected before storage. The submitting user shall see a non-specific error message ("Your message could not be sent") without revealing the specific filter rule triggered. The incident shall be logged with full content, timestamp, and actor identity in the audit log. | Must | Non-specific error message is intentional to prevent adversarial filter circumvention. The full content is retained in the audit log, not displayed to other users. |
| UR-COMM-023 | Content that results in FLAG status shall be held in a moderation queue, invisible to the intended recipient until a moderator approves it. The submitter shall see a "message pending review" status. | Must | Moderation queues are visible to Platform Moderators (all queues) and School Admins (school-scoped queue). Target review time is within 4 business hours. |
| UR-COMM-024 | A Platform Moderator or School Admin (within their scope) shall be able to: approve a flagged item (making it visible to the recipient), reject it (blocking permanently, logging, and optionally notifying the Teacher), or escalate it to the safeguarding workflow. | Must | All moderation decisions are logged with the moderator's identity, timestamp, and decision rationale. |
| UR-COMM-025 | The Super Admin shall be able to view aggregate content moderation statistics (items processed, flagged rate, block rate, average review time) in the admin dashboard, filterable by school, time range, and content type. | Must | Statistics must update at most every 5 minutes. |
| UR-COMM-026 | The content moderation pipeline shall be applied not only to chat messages but also to: project titles and descriptions, code comments and string literals visible in submissions, team and project names, user-controlled display names, and AI Hint Assistant prompts and responses (see Section 11, UR-CODE-101). | Should | Code comments and string literals are lower-risk but still scanned; false-positive rate must be acceptable for typical teaching code (e.g., `// turn on LED`). AI Hint prompts/responses are screened before display to the Student. |
| UR-COMM-027 | School Admins shall be able to view the school-scoped moderation queue and take moderation decisions on items originating within their school. They shall not be able to access moderation data from other schools. | Must | Multi-tenant data isolation enforced via Postgres RLS (see Section 8: User Requirements: School Onboarding, Custom Domain and White-Labelling). |
| UR-COMM-028 | The platform shall support bulk moderation actions (approve all, reject all within a filter) for Platform Moderators managing high-volume queues. | Should | Bulk actions require a confirmation step and are audit-logged at the individual item level. |

---

## Requirements: Abuse Reporting and Flagging

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-COMM-029 | Any authenticated user shall be able to report any piece of content or any user account as abusive, inappropriate, or concerning, using a one-tap/one-click Report function accessible on every message, comment, and user profile. | Must | The report function must be visible without requiring additional navigation. It must be accessible and labelled clearly (not hidden behind a menu if practical). |
| UR-COMM-030 | The abuse report form shall allow the reporter to select a category (e.g., Inappropriate content, Harassment, Grooming concern, Spam, Other) and optionally provide a free-text description of up to 500 characters. | Must | Submission of a report shall be confirmed to the reporter with a reference number. Reporter identity is kept confidential from the reported party. |
| UR-COMM-031 | Submitted abuse reports shall be routed to the appropriate moderation queue: reports originating within a school are routed to the School Admin's queue first and to the Platform Moderator's queue; platform-level reports are routed to the Platform Moderator's queue. Safeguarding-category reports are simultaneously escalated to the safeguarding workflow (UR-COMM-044). | Must | Routing logic must be deterministic and audited. A report must appear in a queue within 60 seconds of submission. |
| UR-COMM-032 | A moderator actioning an abuse report shall have access to: the reported content in full, the reporting user's identity (confidential from others), the reported user's account details and prior moderation history, and the surrounding message context (up to 50 messages before and after in the same channel). | Must | Context window is configurable by Super Admin. Moderator access to this extended context is itself audit-logged. |
| UR-COMM-033 | Upon completing an abuse report review, the moderator shall select an outcome: No action (dismissed), Content removed, User warned, User suspended (temporary), User deactivated (pending Super Admin review), or Escalated to safeguarding. All outcomes are logged. | Must | User suspensions and deactivations triggered by a moderator require Super Admin confirmation before taking effect, except for accounts involving minor-protection incidents where immediate suspension is permitted. |
| UR-COMM-034 | The reporting user shall receive a notification when their report has been actioned, confirming that it was reviewed. The notification shall not reveal the specific outcome taken against the reported party. | Should | Non-disclosure of outcomes protects both parties and prevents retaliation. The reporter may contact the platform at a published safeguarding contact address for further enquiry. |
| UR-COMM-035 | Teachers shall be able to flag a student's behaviour or communication as a safeguarding concern directly from within the class or team communication view, in addition to the generic report function. | Must | A teacher-initiated safeguarding flag bypasses the general moderation queue and enters the safeguarding escalation workflow directly (UR-COMM-044). |

---

## Requirements: Profanity and PII Filtering

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-COMM-036 | The profanity filter shall operate on a real-time basis, screening each submission before persistence. It shall be tunable via an admin-maintained word list and an ML confidence threshold without a code deployment. | Must | False-positive rate on typical educational content should be below 0.5% in testing. False-negative rate on clearly profane content should be below 1%. |
| UR-COMM-037 | The PII filter shall detect and block the following data types at minimum when found in communication channels involving a minor participant: email addresses, telephone numbers, physical addresses, national ID / passport numbers, social media handles, and explicit off-platform URLs used as contact vectors. | Must | The filter should use both regex pattern matching and a Named Entity Recognition (NER) model to improve accuracy over regex alone. |
| UR-COMM-038 | When PII is detected in a submission by or to a minor, the platform shall: block the submission, log the full content in the safeguarding audit log, and (if the pattern matches a grooming/contact-solicitation vector) automatically trigger a safeguarding flag. | Must | The minor-submitting-PII case (e.g., a child accidentally sharing their home address) should trigger a quieter internal flag rather than an error visible to potential bad actors. |
| UR-COMM-039 | The platform shall not store filtered/blocked content in any user-visible location. Blocked content persists only in the immutable safeguarding audit log with restricted access. | Must | Ensures that blocked content cannot be retrieved by the submitter or recipient through any platform UI path. |
| UR-COMM-040 | School Admins and Teachers shall be able to add school-specific terms to a school-scoped augmented word list that supplements (but does not replace) the platform-level list. | Should | School-scoped additions must be approved by the School Admin (not individual teachers). All additions are audit-logged. |

---

## Requirements: Safeguarding Escalation

Safeguarding escalation is the process by which a potential child-protection concern is elevated from an automated or user-generated flag to a structured response involving the appropriate human decision-makers and, where required, external authorities.

```
+------------------------------------------------------+
|           Safeguarding Escalation Pathway            |
+------------------------------------------------------+
|                                                      |
|  TRIGGER (any of):                                   |
|  - Automated: grooming/solicitation signal detected  |
|  - User report: category = safeguarding concern      |
|  - Teacher flag: via safeguarding flag function      |
|  - Moderator escalation from moderation queue        |
|          |                                           |
|          v                                           |
|  [1] SAFEGUARDING QUEUE                              |
|      Visible to: School Admin (in-scope)             |
|                  Platform Moderator                  |
|                  Super Admin                         |
|      SLA: acknowledge within 1 business hour         |
|          |                                           |
|          v                                           |
|  [2] TRIAGE (School Admin / Platform Moderator)      |
|      Outcome A: No concern (log and close)           |
|      Outcome B: Internal action (warn/suspend user)  |
|      Outcome C: Escalate to Super Admin              |
|      Outcome D: Refer to external authority          |
|          |                                           |
|          v                                           |
|  [3] SUPER ADMIN REVIEW (if escalated)               |
|      Outcome: Platform-level action; possible        |
|      referral to law enforcement / child protection  |
|      authority; notification to Parent/Guardian;     |
|      account deactivation                            |
|          |                                           |
|          v                                           |
|  [4] CLOSE WITH FULL AUDIT RECORD                    |
|      All steps, decisions, actors, and timestamps    |
|      recorded in immutable safeguarding audit log    |
+------------------------------------------------------+
```

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-COMM-041 | The platform shall maintain a dedicated Safeguarding Queue, separate from the general content moderation queue, visible only to the School Admin (school-scoped), Platform Moderator, and Super Admin. | Must | The queue must surface: trigger type, involved accounts, timestamp, severity classification, and associated evidence (message content, prior flags). |
| UR-COMM-042 | The Safeguarding Queue shall impose a mandatory acknowledgement SLA: items must be acknowledged by an authorised role within 1 business hour of entering the queue. The platform shall send escalating notifications (in-app and email) to the responsible parties until acknowledged. | Must | SLA clock starts at item creation. If not acknowledged within 1 business hour, the notification escalates to the next level in the hierarchy (e.g., from School Admin to Platform Moderator to Super Admin). |
| UR-COMM-043 | Each safeguarding queue item shall carry a severity classification (Low / Medium / High / Critical) assigned by the automated pipeline or adjustable by the triage moderator. Critical items (e.g., confirmed grooming signal, CSAM detection) must trigger immediate notification to Super Admin regardless of school-level triage status. | Must | The severity classification is editable by moderators but all changes are audit-logged and require a written rationale. |
| UR-COMM-044 | The safeguarding escalation workflow shall support four documented outcome types: (a) No concern — logged and closed; (b) Internal action — warning, suspension, or content removal with audit record; (c) Super Admin escalation — for cross-school, serious, or repeat issues; (d) External referral — documented referral to law enforcement or a recognised child-protection authority, with a case reference captured in the log. | Must | The platform must provide a structured referral documentation template that a Super Admin can export for use with external authorities. |
| UR-COMM-045 | When a safeguarding case involves a minor, the platform shall notify the associated Parent/Guardian of the existence of a safeguarding concern and the fact that it is under review, using language appropriate for a non-technical audience. The notification must not contain details that could compromise an ongoing investigation or identify the reporting party. | Must | The exact timing and content of the Parent/Guardian notification is subject to the triage decision (outcome b, c, or d). For Critical items, notification occurs automatically upon classification. |
| UR-COMM-046 | The platform shall provide the Super Admin with a Safeguarding Incidents Dashboard showing: open incidents by severity, average acknowledgement time, average time-to-close, incidents per school (anonymised for external reporting), and outcomes over a configurable time range. | Must | Dashboard data must comply with data minimisation; aggregate statistics must be available for export as a structured CSV or PDF report for regulatory purposes. |
| UR-COMM-047 | All safeguarding audit records shall be retained for a minimum of 7 years (or longer if required by applicable law), stored separately from general operational logs, with access restricted to Super Admin and authorised safeguarding officers. | Must | Retention policy aligns with the most conservative applicable legal instrument across COPPA, GDPR-K, Zimbabwe CDPA, POPIA, NDPR, and Kenya DPA. |
| UR-COMM-048 | The platform shall publish a clear, plain-language Safeguarding Policy accessible from the footer of the marketing site and from within the authenticated platform. The policy shall identify: the named Designated Safeguarding Lead (DSL) for the platform, the reporting procedure, the applicable laws and standards, and the external escalation contacts. | Must | The DSL is a named Super Admin or a designated member of the RoboCode.Africa operations team. |

---

## Requirements: Audit Logging

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-COMM-049 | The platform shall maintain an immutable audit log covering all communication and moderation events, including: message sent, message delivered, message held (flagged), message blocked, message deleted (by user), report submitted, report actioned, moderation decision, safeguarding item created, safeguarding item actioned, notification sent, and notification preference changed. | Must | "Immutable" means log entries cannot be modified or deleted through any normal platform operation. The log may be stored in append-only storage (e.g., S3-compatible object store with object lock). |
| UR-COMM-050 | Each audit log entry shall record at minimum: a unique event ID, event type, event timestamp (UTC, millisecond precision), actor user ID and role, target resource (user, message, channel, or case ID), outcome, and IP address. | Must | Audit log schema must be stable; additions to the schema are permitted but deletions are not without a documented deprecation cycle. |
| UR-COMM-051 | The audit log shall be accessible to the Super Admin via a structured search interface supporting filters on: time range, event type, actor, school, and outcome. | Must | Search results must be exportable in CSV format. |
| UR-COMM-052 | Access to the audit log by platform staff shall itself be logged, creating a meta-audit trail. | Must | Meta-audit log entries are subject to the same retention and immutability requirements as the primary audit log. |
| UR-COMM-053 | The platform shall provide School Admins with a school-scoped view of the audit log covering communication events within their school. School Admins shall not be able to access audit log entries from other schools. | Must | Multi-tenant isolation enforced via Postgres RLS; see Section 8 (School Onboarding, Custom Domain and White-Labelling) and FR-COMM and SR-nnn in the SSD. |
| UR-COMM-054 | The platform shall support export of a full school-scoped or platform-wide audit log in a structured format (JSON-L or CSV) for regulatory inspection or legal disclosure, accessible only to the Super Admin. | Must | Export must be possible within 24 hours of request. Large exports must be queued and delivered by a secure download link with a time-limited expiry. |
| UR-COMM-055 | Notification delivery events (sent, bounced, opened for email) shall be recorded in the audit log. Notification preference changes shall also be logged with the before and after state. | Should | Email open-tracking is permissible only for transactional system emails; must not be used for engagement analytics or behavioural profiling. |
| UR-COMM-056 | The platform shall implement log integrity verification (e.g., a cryptographic hash chain or WORM storage policy) so that tampering with historical audit log entries can be detected. | Must | Integrity verification mechanism must be documented in the SSD security controls section (SR-nnn). |
| UR-COMM-057 | When a user deletes a message, the message text and metadata shall be removed from the user-visible conversation view but retained in the audit log with a `deleted_by` marker, timestamp, and original content. | Must | This retention is disclosed in the platform Terms of Service and Privacy Notice. Deleted messages in the audit log are subject to the same access restrictions as other audit data. |

---

## Authoritative Retention Schedule

This table is the single, authoritative log- and record-retention schedule for the entire
URD. Every other section that states a retention period (Sections 7, 11, 14, 16, 20, 21)
**defers to this table**; where an earlier draft stated a different figure, this schedule
governs. The categories are deliberately distinct: different record classes have different
minima because they serve different legal purposes, not because the document is
inconsistent.

| ID | Record category | Minimum retention | Acceptance / Notes |
|----|-----------------|-------------------|--------------------|
| UR-COMM-062 | Operational / application logs (non-audit) | 90 days | Performance and debug logs; not safety-relevant; rotated after 90 days. |
| UR-COMM-063 | Platform audit log — standard (admin actions, approvals, role changes, RoboPoints adjustments, anti-cheat events, AI Hint Assistant interactions, security/auth events, communication & moderation events) | 12 months | Single standard minimum for all "audit log — standard" categories across the platform. Supersedes any 3-year or 5-year figure stated elsewhere for these categories. |
| UR-COMM-064 | Parental / guardian consent records | Lifetime of the minor account + 3 years | Then deleted. Mirrors UR-ONB-035. |
| UR-COMM-065 | Safeguarding records (incidents, escalations, blocked-content evidence) | Minimum 7 years (or longer if required by law) | Stored separately from operational logs with restricted access. Mirrors UR-COMM-047. |

> Where a national law mandates a longer minimum than a figure above for a given record
> class, the longer statutory minimum applies for the affected data subjects.

---

## MoSCoW Priority Summary

The following table provides a consolidated, scannable MoSCoW view of all UR-COMM requirements.

| ID | Short Title | Priority |
|----|-------------|----------|
| UR-COMM-001 | Class Announcements channel | Must |
| UR-COMM-002 | Task/Assignment Feed | Must |
| UR-COMM-003 | Teacher-initiated Student DM | Must |
| UR-COMM-004 | Team Channel with teacher oversight | Must |
| UR-COMM-005 | Project Comments thread | Must |
| UR-COMM-006 | School Admin broadcast announcements | Must |
| UR-COMM-007 | Platform-wide broadcast announcements | Must |
| UR-COMM-008 | No student-to-student direct messaging | Must |
| UR-COMM-009 | School Admin read access to all comms | Must |
| UR-COMM-010 | 12-month immutable communication retention | Must |
| UR-COMM-011 | Teacher mute/remove from Team Channel | Must |
| UR-COMM-012 | Peer review within class (teacher-enabled) | Could |
| UR-COMM-013 | In-app notifications | Must |
| UR-COMM-014 | Email notifications for critical events | Must |
| UR-COMM-015 | Optional SMS notifications | Should |
| UR-COMM-016 | User-configurable notification preferences | Must |
| UR-COMM-017 | Notification digest mode | Should |
| UR-COMM-018 | Automated content moderation on all channels | Must |
| UR-COMM-019 | Profanity / hate-speech filter (configurable) | Must |
| UR-COMM-020 | PII detection in content pipeline | Must |
| UR-COMM-021 | Grooming/solicitation signal detection | Must |
| UR-COMM-022 | BLOCK behaviour (reject + log + non-specific error) | Must |
| UR-COMM-023 | FLAG behaviour (hold + queue + pending status) | Must |
| UR-COMM-024 | Moderator actions on flagged content | Must |
| UR-COMM-025 | Moderation statistics in admin dashboard | Must |
| UR-COMM-026 | Moderation applied to project names and code comments | Should |
| UR-COMM-027 | School-scoped moderation queue for School Admin | Must |
| UR-COMM-028 | Bulk moderation actions | Should |
| UR-COMM-029 | One-click abuse report on any content/profile | Must |
| UR-COMM-030 | Abuse report category and free-text form | Must |
| UR-COMM-031 | Abuse report routing to appropriate queue | Must |
| UR-COMM-032 | Moderator context view for abuse reports | Must |
| UR-COMM-033 | Structured abuse report outcome options | Must |
| UR-COMM-034 | Reporter notification upon report actioned | Should |
| UR-COMM-035 | Teacher safeguarding flag from comms view | Must |
| UR-COMM-036 | Real-time profanity filter with tunable thresholds | Must |
| UR-COMM-037 | PII filter: specific data types blocked for minors | Must |
| UR-COMM-038 | Minor-involving PII auto-triggers safeguarding flag | Must |
| UR-COMM-039 | Blocked content not visible via any UI path | Must |
| UR-COMM-040 | School-scoped word list augmentation | Should |
| UR-COMM-041 | Dedicated Safeguarding Queue | Must |
| UR-COMM-042 | 1-business-hour acknowledgement SLA with escalating alerts | Must |
| UR-COMM-043 | Severity classification on safeguarding items | Must |
| UR-COMM-044 | Four structured outcome types in safeguarding workflow | Must |
| UR-COMM-045 | Parent/Guardian notification for minor safeguarding cases | Must |
| UR-COMM-046 | Safeguarding Incidents Dashboard for Super Admin | Must |
| UR-COMM-047 | 7-year safeguarding audit record retention | Must |
| UR-COMM-048 | Published Safeguarding Policy with named DSL | Must |
| UR-COMM-049 | Immutable communication and moderation audit log | Must |
| UR-COMM-050 | Minimum audit log entry schema | Must |
| UR-COMM-051 | Super Admin audit log search and export | Must |
| UR-COMM-052 | Meta-audit trail for audit log access | Must |
| UR-COMM-053 | School-scoped audit log view for School Admin | Must |
| UR-COMM-054 | Full audit log export for regulatory disclosure | Must |
| UR-COMM-055 | Notification delivery events in audit log | Should |
| UR-COMM-056 | Audit log integrity verification | Must |
| UR-COMM-057 | Deleted-message retention in audit log | Must |
| UR-COMM-062 | Operational/application log retention (90 days) | Must |
| UR-COMM-063 | Standard platform audit log retention (12 months) | Must |
| UR-COMM-064 | Consent record retention (account lifetime + 3 years) | Must |
| UR-COMM-065 | Safeguarding record retention (minimum 7 years) | Must |

---

## Accessibility Requirements for Communication Features

All communication interfaces must meet WCAG 2.2 Level AA. The following specific obligations apply to the communication and notification components.

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-COMM-058 | All notification elements (in-app banners, badges, toast messages) shall be announced by screen readers using ARIA live regions with appropriate politeness levels (assertive for critical alerts, polite for informational updates). | Must | Verify with NVDA + Firefox and VoiceOver + Safari. |
| UR-COMM-059 | The abuse report function shall be keyboard-accessible and operable without a mouse, with a visible focus indicator. | Must | WCAG 2.2 SC 2.1.1 (Keyboard) and SC 2.4.11 (Focus Appearance). |
| UR-COMM-060 | Notification email templates shall use semantic HTML, a minimum body font size of 14px, sufficient colour contrast (4.5:1 for normal text), and a plain-text alternative. | Must | Test with Litmus or equivalent cross-client tool. |
| UR-COMM-061 | The moderation queue UI shall be fully keyboard-navigable, with all approve/reject/escalate actions operable via keyboard shortcut and screen-reader-friendly labelling. | Must | Moderators often process large queues; keyboard efficiency is a functional requirement as well as an accessibility requirement. |

---

## Compliance Mapping

The following table maps the principal child-data-protection legal instruments to the requirements in this section that fulfil them.

| Legal Instrument | Key Obligation | Fulfilled By |
|------------------|---------------|--------------|
| COPPA (US, under-13) | Verifiable parental consent; no personal data collection without consent; right to deletion | UR-COMM-037, UR-COMM-038; cross-ref UR-ONB (Section 6) for consent gate |
| GDPR-K (EU, under-16) | Age-appropriate design; data minimisation; no profiling; right to erasure | UR-COMM-008, UR-COMM-020, UR-COMM-039, UR-COMM-057 |
| UK Children's Code | Best-interests default; no nudge techniques; privacy by default | UR-COMM-008, UR-COMM-016 (mandatory non-configurable safety notifications), UR-COMM-022 |
| Zimbabwe CDPA 2021 | Lawful processing; data subject rights; cross-border transfer restrictions | UR-COMM-049 through UR-COMM-057 (audit trail); data residency addressed in Section 20 (NFR) |
| South Africa POPIA | Conditions for lawful processing; special conditions for children | UR-COMM-045 (guardian notification); UR-COMM-047 (retention) |
| Nigeria NDPR 2019 | Consent; data subject rights; data processing principles | UR-COMM-016, UR-COMM-054 (regulatory export capability) |
| Kenya DPA 2019 | Registration of data controllers; processing principles; children's data | UR-COMM-048 (published safeguarding policy); UR-COMM-046 (incident dashboard for regulatory reporting) |

---

## Cross-References

The requirements in this section interact closely with the following other sections of this URD and the companion SSD:

- **Section 6: User Requirements: Onboarding, Signup and Approval** — UR-ONB requirements for parental consent collection and minor account activation gates that are the precondition for minor access to communication channels.
- **Section 7: User Requirements: Authentication and Account Management** — UR-AUTH requirements for account suspension and deactivation outcomes referenced in UR-COMM-033 and UR-COMM-044.
- **Section 8: User Requirements: School Onboarding, Custom Domain and White-Labelling** — Multi-tenant data isolation (Postgres RLS) that underpins school-scoped moderation queues and audit log views (UR-COMM-027, UR-COMM-053).
- **Section 13: User Requirements: Teams, Competitions and Collaboration** — UR-TEAM requirements for team formation and team project workspaces; the Team Channel (UR-COMM-004) is the communication layer for those teams.
- **Section 16: User Requirements: Administration and Reporting** — UR-ADM requirements for the admin console dashboards that surface moderation statistics, safeguarding incident summaries, and audit log access.
- **Section 20: Non-Functional User Expectations** — NFR requirements for notification latency, content moderation pipeline throughput, and audit log search performance that the communication system must satisfy.
- **SSD FR-COMM** — Functional requirements for the communication microservice, WebSocket channel management (Socket.IO), and Yjs CRDT integration.
- **SSD SR-nnn** — Security requirements including audit log integrity controls and access control enforcement on safeguarding records.
- **SSD DR-nnn** — Data requirements including audit log schema, retention policies, and data residency constraints for communication records.

---

## Assumptions and Constraints

| # | Statement |
|---|-----------|
| 1 | The content moderation pipeline (profanity filter, PII detector, grooming signal detector) is implemented as a platform-managed service, not outsourced to a third-party consumer-facing API that would receive raw student content. |
| 2 | SMS notification capability is dependent on the availability of a suitable SMS gateway for the target African markets. The specific gateway is a deployment-time configuration; the feature is architecturally supported. |
| 3 | The Designated Safeguarding Lead (DSL) named in the Safeguarding Policy (UR-COMM-048) is a human individual reachable during business hours. The platform supplements but does not replace human judgement in safeguarding decisions. |
| 4 | Teachers are trusted to use the Teacher-initiated DM (UR-COMM-003) appropriately. Misuse of teacher-to-student messaging is subject to the same abuse-reporting mechanism (UR-COMM-029) and is visible in the audit log. |
| 5 | Notification email deliverability is subject to the reputation and configuration of the chosen transactional email provider (SES/SendGrid). The platform is responsible for correct SPF/DKIM/DMARC DNS configuration; deliverability rates above 98% are targeted but not unconditionally guaranteed. |
| 6 | The 1-business-hour safeguarding acknowledgement SLA (UR-COMM-042) is defined relative to the platform's operational business hours, which must be defined in the platform operational policy and published in the Safeguarding Policy document. |
