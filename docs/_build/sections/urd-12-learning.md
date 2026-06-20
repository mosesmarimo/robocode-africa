# User Requirements: Learning, Courses, Tasks and Assessment

## Overview

This section defines user requirements governing the structured learning experience on RoboCode.Africa. It covers the end-to-end curriculum architecture — from enrolment in a learning track through lesson delivery, guided project work, coding tasks, assessment and certification — as experienced by Students, Teachers/Educators, School Admins and Super Admins. Requirements here apply to both the direct (robocode.africa) context and the multi-tenant (school subdomain / custom domain) context.

All requirements in this section carry the prefix `UR-LRN-`. Cross-references to upstream identity, approval and safety controls are found in *User Requirements: Onboarding, Signup and Approval* and *User Requirements: Authentication and Account Management*. Cross-references to the simulation canvas and code editor are found in *User Requirements: RoboCode Studio Canvas, Components and Wiring* (Section 9), *User Requirements: Simulation Experience* (Section 10), and *User Requirements: Code Editor and Programming* (Section 11). Gamification outcomes such as RoboPoints and badge awards are elaborated in *User Requirements: Gamification, RoboPoints and Leaderboards* (Section 14).

---

## Curriculum Architecture

### Learning Tracks

RoboCode.Africa organises content into structured **Learning Tracks** — curated sequences of modules aligned to learner age, prior knowledge and curriculum standard. Two primary track families exist: **Robotics & Coding** and **AI Fundamentals**, each subdivided by school level.

```
LEARNING TRACK HIERARCHY
═══════════════════════════════════════════════════════════
Track Family
  └── Track (level-specific)
        └── Module (topic unit, e.g. "Sensors & Sensing")
              └── Lesson (atomic instructional unit)
                    ├── Content Pages (text / video / interactive)
                    ├── Guided Tutorial / Project
                    └── Coding Task / Challenge
              └── Module Quiz
        └── Module Project (capstone, assessed)
  └── Certificate of Completion
═══════════════════════════════════════════════════════════
```

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-LRN-001 | The platform SHALL provide at least two distinct Learning Track families: **Robotics & Coding** and **AI Fundamentals**. | Must | Both families present at launch with at least one track each. |
| UR-LRN-002 | Each track family SHALL contain separate tracks differentiated by school level: **Primary** (ages 9–13, Grades 4–7) and **High School** (ages 13–18, Grades 8–12). | Must | Track metadata must record `level: primary | high_school`. |
| UR-LRN-003 | Tracks SHALL be sequentially ordered so that prerequisites are satisfied before a learner can begin an advanced track; the system SHALL enforce this sequencing unless a Teacher or School Admin explicitly overrides it for a student or class. | Must | Locked track displays prerequisite name and completion percentage required. |
| UR-LRN-004 | Track, module and lesson metadata SHALL include curriculum alignment tags (e.g., Zimbabwe O-Level ICT Syllabus, South African CAPS Technology, Nigerian Basic Technology, Kenyan CBC Technology strand) so that teachers can filter content by national curriculum. | Should | Tags managed by Super Admin in the global content library. |
| UR-LRN-005 | The Super Admin and Platform Moderator SHALL maintain a **Global Content Library** from which School Admins and Teachers can import tracks, modules or individual lessons into their school context. | Must | School-imported items are read-only clones; original is preserved in the library. |
| UR-LRN-006 | Teachers SHALL be able to create custom modules and lessons scoped to their school tenant, assigning them to classes independently of the global library. | Must | Custom content is isolated to the creating tenant and not visible platform-wide. |

### Module and Lesson Structure

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-LRN-007 | Each **Module** SHALL have: a title, description, learning objectives, estimated duration, difficulty label (Beginner / Intermediate / Advanced), prerequisite module references, and an ordered list of lessons. | Must | Rendered in the module overview page before a student enters. |
| UR-LRN-008 | Each **Lesson** SHALL support at least the following content types: rich-text pages with embedded static images, embedded video (hosted or external URL), and interactive RoboCode Studio widgets (pre-configured component canvases). | Must | Interactive widgets must launch RoboCode Studio in an embedded or full-screen mode. |
| UR-LRN-009 | Lessons SHOULD support step-by-step instructional pagination (one concept per page) with explicit **Next / Back** navigation and a progress indicator showing current page within the lesson. | Should | Minimum step count is 3; maximum recommended is 15 pages per lesson. |
| UR-LRN-010 | Lesson content SHALL be authored in a WYSIWYG/Markdown editor by Teachers (for school-scoped content) and by Super Admin staff (for global library content). | Must | Content editor must support code blocks with syntax highlighting, inline images and tables. |
| UR-LRN-011 | Video content embedded in lessons SHALL support manual closed captions / subtitles, playback speed control (0.5×–2×), and full-screen mode, to meet WCAG 2.2 AA accessibility requirements. | Must | Auto-captions via third-party service are acceptable if editable. |
| UR-LRN-012 | The platform SHALL track and persist each student's position within a lesson (current page) so that reloading the browser or returning later resumes from the last-visited page. | Must | Position stored server-side; not reliant on browser local storage alone. |

---

## Guided Tutorials and Projects

### Guided Tutorials

Guided tutorials are teacher- or platform-authored walkthroughs that lead a student step-by-step through building a circuit in RoboCode Studio and writing corresponding code. They sit inside a lesson and launch the full IDE in a guided mode.

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-LRN-013 | The platform SHALL support **Guided Tutorial** mode within RoboCode Studio, where a sidebar displays numbered instructional steps that the student follows in sequence to assemble a specified circuit and write corresponding code. | Must | Sidebar steps are authored alongside the tutorial definition. |
| UR-LRN-014 | Each tutorial step SHALL be able to: display instructional text and images; highlight a specific component, pin or wire on the canvas; and optionally gate progression until the student performs a specified action (e.g., places a component, connects a wire, writes a code keyword). | Must | Gate conditions are optional per step; authors may leave steps ungated. |
| UR-LRN-015 | The system SHALL provide a **Hint** mechanism per tutorial step, offering one or more progressive hints (first hint: general; second hint: specific; third hint: reveals answer) without penalising the student's completion record. | Should | Hint usage is logged for teacher visibility but does not affect task grade. |
| UR-LRN-016 | On completing all tutorial steps, the student SHALL receive a visual completion confirmation and automatic progress credit for that lesson/tutorial node. | Must | Credit is awarded only once per unique tutorial per student. |
| UR-LRN-017 | Teachers SHALL be able to author guided tutorials using a step-definition editor that supports text, image upload, canvas action triggers and optional gate conditions without requiring programming knowledge. | Should | Author preview mode must simulate the student experience. |

### Projects

Projects are open-ended or semi-structured practical assignments where students apply multiple skills learnt across lessons to build a working circuit + code solution in RoboCode Studio.

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-LRN-018 | Each **Project** SHALL have a brief (title, description, learning outcomes, required components list, acceptance criteria) visible to the student before they begin work. | Must | Required components list should reference the canonical component names from the Component Catalogue. |
| UR-LRN-019 | Students SHALL work on projects within a dedicated **Project Workspace** in RoboCode Studio that is saved separately from their personal sandbox and is linked to the specific assignment or task. | Must | Workspace auto-saved continuously; versioned snapshots on each simulation run. |
| UR-LRN-020 | Module **Capstone Projects** SHALL be marked as the terminal assessment for their module and SHALL trigger a certificate evaluation upon successful submission and grading. | Must | Capstone Projects are distinct from routine tasks in metadata and UI treatment. |
| UR-LRN-021 | The platform SHOULD allow collaborative projects where two or more students work in a shared RoboCode Studio workspace with real-time collaboration (Yjs CRDT). Collaborative rules and team formation requirements are detailed in *User Requirements: Teams, Competitions and Collaboration* (Section 13). | Should | Collaboration requires explicit Teacher or School Admin enablement per assignment. |

---

## Coding Tasks and Challenges

### Task Types

| Task Type | Description | Evaluated By |
|---|---|---|
| Guided Coding Task | Structured; student completes partial code scaffold | Auto-checker against expected simulation output |
| Open Coding Challenge | Unstructured; student writes full solution | Auto-checker + optional teacher rubric |
| Debug Challenge | Student is given broken code and must fix it | Auto-checker verifies corrected behaviour |
| Timed Challenge | Open challenge with countdown timer | Auto-checker; time recorded for leaderboard |
| Teacher-Assigned Task | Specific brief assigned to a class or individual | Teacher grades via rubric + optional auto-check |

### Task Requirements

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-LRN-022 | The platform SHALL support all five Task Types listed in the Task Types table above, each launchable within RoboCode Studio. | Must | Task type is recorded in task metadata; UI treatment varies by type. |
| UR-LRN-023 | For **auto-checked tasks**, the system SHALL evaluate student submissions by running the submitted code + circuit against a set of **expected simulation outcomes** (e.g., LED on at pin 13 after 500 ms, sensor reading in range 20–30 cm) and reporting pass/fail per test case. | Must | Test cases are authored by Teachers or Super Admin staff alongside the task definition. |
| UR-LRN-024 | Auto-check test cases SHALL support at minimum: pin state assertions (HIGH/LOW), analog reading range assertions, timing assertions (event within N ms), serial output string matching, and component visual state checks (e.g., LCD text content). | Must | Additional assertion types may be added in future releases. |
| UR-LRN-025 | The auto-checker SHALL provide the student with a **test results panel** showing each test case name, pass/fail status, and — where the task author permits — an explanatory message for failed cases, without revealing the full expected answer. | Must | Explanation text is optional and authored per test case. |
| UR-LRN-026 | Students SHALL be permitted a configurable number of submission attempts (default: unlimited; Teacher may cap attempts per task). Between re-attempts the student must make at least one change to code or circuit before re-submitting. | Should | Attempt count and change-detection are logged server-side. |
| UR-LRN-027 | **Debug Challenges** SHALL provide the student with a pre-built circuit and intentionally broken code; the task brief SHALL describe the expected (correct) behaviour, and the auto-checker SHALL verify that the student's corrected code produces that behaviour. | Must | The broken code and circuit are locked read-only for the circuit portion; only code is editable unless the task specifies otherwise. |
| UR-LRN-028 | **Timed Challenges** SHALL display a countdown timer in the RoboCode Studio interface; on expiry the workspace is automatically submitted in its current state. | Should | Timer can be paused only by a Teacher/Admin for accessibility accommodations. |
| UR-LRN-029 | Tasks SHALL support a **starter file** (partial code scaffold and/or partial circuit layout) provided by the task author and pre-loaded into the student workspace when the task is opened. | Must | Starter file is immutable from the student's perspective (read-only scaffold sections); editable sections are clearly marked. |
| UR-LRN-030 | Task descriptions and briefs SHALL support rich text, embedded images, component diagrams, and embedded video, consistent with the lesson content authoring capabilities (see UR-LRN-010). | Should | Same content editor used for lesson authoring and task authoring. |

---

## Quizzes and Knowledge Checks

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-LRN-031 | The platform SHALL support **inline Knowledge Checks** (1–5 questions embedded within a lesson) and standalone **Module Quizzes** (5–30 questions covering a full module). | Must | Both types must be completable without leaving the lesson/module context. |
| UR-LRN-032 | Supported question types SHALL include: multiple choice (single answer), multiple choice (multi-select), true/false, short-answer text (exact match or keyword match), and code-snippet completion (fill in the blank in a code block). | Must | Additional types (drag-and-drop, ordering) are Should for v2. |
| UR-LRN-033 | Module Quizzes SHALL support a configurable time limit, randomisation of question order, and randomisation of answer option order, all set by the Teacher or content author. | Should | Defaults: no time limit, no randomisation. |
| UR-LRN-034 | On quiz completion, the student SHALL immediately see their score (percentage and pass/fail against a Teacher-configured pass mark, default 70 %), per-question feedback for questions the student got wrong, and — if they passed — a progress credit. | Must | Per-question feedback text is authored per question; defaults to showing the correct answer if no custom feedback is written. |
| UR-LRN-035 | Students who fail a Module Quiz SHALL be able to retake it after a Teacher-configured cooldown period (default: 24 hours). Teachers may reset the cooldown or grant an immediate retry for an individual student. | Should | Max attempts may be set to unlimited or a fixed cap. |
| UR-LRN-036 | Quiz results SHALL be stored per student and accessible to the assigned Teacher for analytics and grading purposes. | Must | Results are accessible via the teacher dashboard described in *User Requirements: Administration and Reporting* (Section 16). |

---

## Teacher-Assigned Assignments

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-LRN-037 | Teachers SHALL be able to create **Assignments** by composing one or more tasks, quizzes and/or project briefs, setting a due date, and assigning the Assignment to one or more classes or individual students within their school tenant. | Must | Assignment creation requires Teacher role at minimum; School Admin may also create. |
| UR-LRN-038 | Teachers SHALL be able to set per-assignment configuration including: due date and time, max attempts per task, late submission policy (accepted / not accepted / accepted with penalty), visible/hidden auto-check results, and grading rubric attachment. | Must | Defaults are platform-configurable by School Admin. |
| UR-LRN-039 | Students SHALL receive a notification (in-platform and optionally via email) when a new Assignment is posted to their class, including assignment title, description, due date and a link to begin. Notification requirements are detailed in *User Requirements: Communication, Notifications and Safety* (Section 15). | Must | Notification sent at time of assignment publication; reminder sent 24 h before due date by default. |
| UR-LRN-040 | Students SHALL be able to view all their Assignments in a **My Assignments** dashboard listing pending, in-progress and submitted assignments with due dates, status indicators and direct launch into the relevant workspace. | Must | Dashboard must be sortable by due date and filterable by status and class. |
| UR-LRN-041 | On student submission of an Assignment (or on due-date expiry), the Teacher SHALL be notified and the submission SHALL appear in the Teacher's **Grading Queue** with the student's name, submission timestamp, auto-check score (if applicable) and a link to open the student's workspace read-only for review. | Must | Teacher can open the submitted workspace in a read-only view of the circuit, code and simulation replay if available. |

### Submission and Grading

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-LRN-042 | Teachers SHALL be able to grade assignment submissions using a **Rubric** with configurable criteria (e.g., Circuit Assembly, Code Quality, Correct Output, Documentation/Comments) and a numeric or descriptive scale per criterion. | Must | Rubric is defined at assignment creation; point weights per criterion are configurable. |
| UR-LRN-043 | Teachers SHALL be able to attach written feedback comments to a submission, viewable by the student after grading is published. | Must | Feedback is plain text minimum; rich-text with code snippets is Should. |
| UR-LRN-044 | Teachers SHALL be able to mark a submission for revision and return it to the student with feedback, allowing the student to resubmit before final grading closes. | Should | Revision cycle limited to a Teacher-configured maximum number of rounds. |
| UR-LRN-045 | Grades SHALL be stored per student per assignment and aggregated into the student's progress record accessible to the Teacher and School Admin. | Must | Grades must not be visible to other students (no peer-visible scores unless Teacher explicitly enables peer review). |
| UR-LRN-046 | The platform SHOULD support **peer review** of submissions where a Teacher enables it, with student reviewers assigned anonymously and guided by a provided rubric. Peer review scores are advisory and not automatically applied to the official grade. | Could | Peer review is subject to the same safeguarding and moderation controls as all student communication. |

---

## Progress and Mastery Tracking

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-LRN-047 | The platform SHALL maintain a **Learning Progress Record** for each student tracking: track enrolment and completion status, module completion percentage, lesson completion status, task submission history and scores, quiz scores, assignment grades, and total RoboPoints earned from learning activities. | Must | Progress Record is the authoritative data source for certificates, leaderboards and teacher reporting. |
| UR-LRN-048 | Students SHALL have a **My Progress** dashboard showing: enrolled tracks with overall completion %, current module and lesson, streak (consecutive days of activity), recent achievements, and recommended next step. | Must | Dashboard must load within 2 seconds on a standard school internet connection (defined as ≥ 2 Mbps). |
| UR-LRN-049 | The platform SHALL implement **Mastery Levels** per module: Not Started, In Progress, Completed, Mastered. Mastered status is awarded when the student completes all lessons, achieves ≥ 80 % on the module quiz, and submits and passes the capstone project (where present). | Should | Mastery level is displayed on the student's profile and reported to Teachers. |
| UR-LRN-050 | Teachers SHALL have access to a **Class Progress View** showing all students in a class with their completion percentages per module, quiz scores and assignment grades, sortable and filterable. | Must | Class Progress View is part of the teacher dashboard described in Section 16. |
| UR-LRN-051 | Progress data SHALL be exportable by Teachers and School Admins in CSV format for offline record-keeping and reporting to school leadership. | Must | Export includes student name, ID, module, lesson, score and date columns. |
| UR-LRN-052 | The system SHALL detect and surface students who are significantly behind the class average (configurable threshold, default: 2 or more modules behind) and alert the assigned Teacher via a dashboard flag. | Should | Alert does not notify the student directly; teacher decides how to respond. |

---

## Certificates and Badges

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-LRN-053 | On completing a Learning Track (all modules completed and mastery criteria met), the platform SHALL automatically award a **Certificate of Completion** to the student. | Must | Certificate is generated as a PDF with the student's name, track name, completion date and platform logo. White-label tenants may have school logo substituted per tenant branding settings. |
| UR-LRN-054 | Certificates SHALL include a unique verifiable code (URL) that any third party can use to confirm the certificate's authenticity on robocode.africa without requiring a login. | Should | Verification page shows name, track, date and issuing entity (platform or school). |
| UR-LRN-055 | The platform SHALL award digital **Skill Badges** for completing individual modules, achieving mastery, completing a specified number of tasks, and other learning milestones as defined in the gamification system (see *User Requirements: Gamification, RoboPoints and Leaderboards*, Section 14). | Must | Badge artwork is maintained by Super Admin in the global badge library; tenant-specific badges may be created by School Admin. |
| UR-LRN-056 | Students SHALL be able to view all earned certificates and badges on their **My Achievements** profile page and, subject to parental consent for minors, share them via a public link. | Should | Share link links to the public verification URL; no personal data other than name and achievement is exposed. |
| UR-LRN-057 | Teachers SHALL be able to manually award **Teacher Recognition Badges** to individual students for outstanding work, good citizenship or other qualitative achievements, with a brief citation attached. | Could | Manual badges are distinguished from system-awarded badges in the student's achievement list. |

---

## Curriculum Alignment

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-LRN-058 | All globally published tracks and modules SHALL be tagged against at least one national or regional curriculum standard relevant to the target learner market (see UR-LRN-004). | Must | Curriculum tags are mandatory before a module is published to the Global Content Library. |
| UR-LRN-059 | Teachers SHALL be able to filter and search the Global Content Library by curriculum tag, level, topic, component type and difficulty, to find suitable content for their students. | Must | Search must return results within 1 second. |
| UR-LRN-060 | The platform SHOULD provide a **Curriculum Mapping Report** for School Admins and Teachers showing which national curriculum outcomes are covered by the tracks and modules assigned to their school, and which remain uncovered, to support lesson planning. | Should | Report is exportable as PDF or CSV. |
| UR-LRN-061 | Where a module directly addresses AI literacy concepts (e.g., machine learning basics, data training, bias in AI), it SHALL be tagged with the AI Fundamentals track family tag and comply with age-appropriate framing aligned to the learner level (primary vs high school). | Must | AI content targeting primary students must be reviewed by a Platform Moderator before global publication. |
| UR-LRN-062 | At launch the Global Content Library SHALL contain concrete curriculum-mapped content, not merely a tag taxonomy: at minimum one complete track mapped to each of the named target syllabi — Zimbabwe ZIMSEC/O-Level ICT, South Africa CAPS Technology, Nigeria NERDC Basic Technology, and Kenya KICD/CBC Technology strand — with each constituent module carrying outcome-level tags. | Must | Verified by a pre-launch curriculum-coverage audit; satisfies OBJ-13's ">=20 templates" with documented curriculum coverage. |
| UR-LRN-063 | The **AI Fundamentals** track family SHALL define, at minimum, the following age-framed content units (no in-browser ML model training, which is out of scope per UR-NFR-C027): (primary) what AI is, everyday examples of AI, rule-based decision-making with sensors on the simulator, and an introduction to bias/fairness; (high school) how rule-based vs data-driven AI differ, applying a pre-trained or rule-based model in a RoboCode Studio project, data and bias literacy, and AI ethics. | Must | AI Fundamentals is delivered as conceptual lessons plus simulator activities using rule-based or pre-trained components only; it does not require training models in the browser. |

---

## Child Safety and Data Protection in Learning

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-LRN-062 | All student learning data (progress records, quiz answers, submitted code, project files, grades) is classified as **personal data** and SHALL be subject to the data minimisation and retention controls mandated under COPPA, GDPR-K, Zimbabwe Cyber and Data Protection Act, POPIA, NDPR and Kenya DPA as applicable. | Must | Retention period is configurable by Super Admin with defaults compliant with the strictest applicable jurisdiction. |
| UR-LRN-063 | Student assignment submissions and project workspaces SHALL only be accessible to: the submitting student, their assigned Teacher(s), the School Admin of their tenant, and (read-only) the Super Admin for audit/safeguarding purposes. No other student may view another's submitted work unless the Teacher explicitly enables a supervised peer-review session. | Must | Access control enforced at the API layer via Row-Level Security in PostgreSQL (see technology stack). |
| UR-LRN-064 | Any free-text content entered by a student in quiz answers, code comments or assignment notes SHALL pass through the platform's profanity/PII filter before being stored or displayed to other users, consistent with safeguarding requirements defined in *User Requirements: Communication, Notifications and Safety* (Section 15). | Must | Filter may flag for Teacher/Moderator review rather than auto-delete to avoid incorrect censorship of technical content. |

---

## MoSCoW Priority Summary

| ID | Requirement Summary | Priority |
|---|---|---|
| UR-LRN-001 | Two Learning Track families (Robotics & Coding; AI Fundamentals) | Must |
| UR-LRN-002 | Primary and High School level tracks per family | Must |
| UR-LRN-003 | Sequential prerequisite enforcement with Teacher override | Must |
| UR-LRN-004 | Curriculum alignment tags (multi-country) | Should |
| UR-LRN-005 | Global Content Library managed by Super Admin | Must |
| UR-LRN-006 | Teacher-authored custom modules per tenant | Must |
| UR-LRN-007 | Module metadata (objectives, duration, difficulty, prerequisites) | Must |
| UR-LRN-008 | Lesson content types: text, video, interactive widget | Must |
| UR-LRN-009 | Step-by-step lesson pagination with progress indicator | Should |
| UR-LRN-010 | WYSIWYG/Markdown lesson authoring for Teachers and Staff | Must |
| UR-LRN-011 | WCAG 2.2 AA video accessibility (captions, speed control) | Must |
| UR-LRN-012 | Server-side lesson position persistence across sessions | Must |
| UR-LRN-013 | Guided Tutorial mode with sidebar steps in RoboCode Studio | Must |
| UR-LRN-014 | Tutorial step gating on student actions | Must |
| UR-LRN-015 | Progressive Hint mechanism in tutorials | Should |
| UR-LRN-016 | Automatic progress credit on tutorial completion | Must |
| UR-LRN-017 | Teacher tutorial authoring with step editor | Should |
| UR-LRN-018 | Project brief with component list and acceptance criteria | Must |
| UR-LRN-019 | Dedicated project workspace in RoboCode Studio | Must |
| UR-LRN-020 | Module capstone project and certificate trigger | Must |
| UR-LRN-021 | Collaborative projects via Yjs CRDT (Teacher-enabled) | Should |
| UR-LRN-022 | Five task types supported | Must |
| UR-LRN-023 | Auto-check against expected simulation outcomes | Must |
| UR-LRN-024 | Auto-check assertion types: pin, analog, timing, serial, visual | Must |
| UR-LRN-025 | Test results panel for students with per-case feedback | Must |
| UR-LRN-026 | Configurable attempt limits; change-detection before retry | Should |
| UR-LRN-027 | Debug Challenges with locked circuit and editable code | Must |
| UR-LRN-028 | Timed Challenges with countdown and auto-submit | Should |
| UR-LRN-029 | Starter file (partial scaffold) pre-loaded into workspace | Must |
| UR-LRN-030 | Rich-text task descriptions with embedded media | Should |
| UR-LRN-031 | Inline Knowledge Checks and standalone Module Quizzes | Must |
| UR-LRN-032 | Multiple choice, true/false, short-answer, code-fill question types | Must |
| UR-LRN-033 | Quiz time limit, question and answer randomisation | Should |
| UR-LRN-034 | Immediate quiz results with per-question feedback | Must |
| UR-LRN-035 | Failed quiz retake with configurable cooldown | Should |
| UR-LRN-036 | Quiz results stored and accessible to Teacher | Must |
| UR-LRN-037 | Teacher creates Assignments from tasks/quizzes/projects | Must |
| UR-LRN-038 | Assignment configuration (due date, attempts, late policy, rubric) | Must |
| UR-LRN-039 | Student notification on Assignment posting and due-date reminder | Must |
| UR-LRN-040 | My Assignments dashboard for students | Must |
| UR-LRN-041 | Teacher Grading Queue with read-only student workspace view | Must |
| UR-LRN-042 | Rubric-based grading with configurable criteria and weights | Must |
| UR-LRN-043 | Teacher written feedback attached to submissions | Must |
| UR-LRN-044 | Mark for revision and student resubmission cycle | Should |
| UR-LRN-045 | Grades stored per student and accessible to Teacher/Admin | Must |
| UR-LRN-046 | Optional anonymous peer review (Teacher-enabled) | Could |
| UR-LRN-047 | Learning Progress Record per student | Must |
| UR-LRN-048 | My Progress dashboard for students | Must |
| UR-LRN-049 | Module Mastery Levels (Not Started → Mastered) | Should |
| UR-LRN-050 | Class Progress View for Teachers | Must |
| UR-LRN-051 | CSV export of progress data for Teachers and School Admins | Must |
| UR-LRN-052 | Behind-average student alert to Teacher | Should |
| UR-LRN-053 | Certificate of Completion on track completion | Must |
| UR-LRN-054 | Verifiable certificate URL (unauthenticated confirmation) | Should |
| UR-LRN-055 | Skill Badges for module completion and milestones | Must |
| UR-LRN-056 | My Achievements page with shareable links (consent-gated for minors) | Should |
| UR-LRN-057 | Teacher Recognition Badges (manual award) | Could |
| UR-LRN-058 | Mandatory curriculum alignment tagging before global publication | Must |
| UR-LRN-059 | Content library search by curriculum tag, level, topic | Must |
| UR-LRN-060 | Curriculum Mapping Report for Schools | Should |
| UR-LRN-061 | AI Fundamentals content tagged and age-framed; Moderator review | Must |
| UR-LRN-062 | Concrete curriculum-mapped tracks for ZIMSEC/CAPS/NERDC/KICD at launch | Must |
| UR-LRN-063 | AI Fundamentals content units defined (no in-browser ML training) | Must |
| UR-LRN-062 | Student learning data subject to multi-jurisdiction data protection | Must |
| UR-LRN-063 | Submission access restricted to student, Teacher, Admin, Super Admin | Must |
| UR-LRN-064 | Profanity/PII filter on student free-text before storage/display | Must |

---

## Assumptions and Constraints

- It is assumed that all student learning interactions occur within an authenticated, approved account context as defined in *User Requirements: Onboarding, Signup and Approval* (Section 6) and *User Requirements: Authentication and Account Management* (Section 7). No learning content other than the publicly accessible marketing demo is available to unauthenticated Guests.
- It is assumed that the in-browser WASM toolchain or compile microservice for auto-checking task submissions is available with a p95 response time of ≤ 10 seconds for compilation and simulation execution, consistent with non-functional expectations in Section 20.
- Offline lesson content caching (Service Worker / PWA) is a roadmap item and is not a requirement for the initial release.
- Curriculum content authoring quality and pedagogical accuracy are the responsibility of the Super Admin and Teacher user roles respectively; the platform provides the tooling but not editorial review.
- The maximum number of test cases per auto-checked task is 50 per submission in v1; this limit may be increased in future versions.
