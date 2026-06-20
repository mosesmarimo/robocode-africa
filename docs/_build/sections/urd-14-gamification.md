# User Requirements: Gamification, RoboPoints and Leaderboards

## Overview

This section specifies the user requirements governing the gamification systems within RoboCode.Africa. Gamification is a central motivational mechanism designed to sustain engagement, reward learning progress, promote healthy competition, and build a sense of community among students at both primary-school and high-school levels. The system operates across three tiers: individual Students, Teams (see _User Requirements: Teams, Competitions and Collaboration_), and Schools (Tenants). All gamification features must comply with the child-safety and data-protection obligations stated in the Project Canon, including COPPA, GDPR-K, POPIA, Zimbabwe Cyber and Data Protection Act, Nigeria NDPR, and Kenya Data Protection Act. Visibility controls and privacy defaults are treated as first-class requirements, not optional add-ons.

The gamification system is composed of the following subsystems:

```
+-----------------------------------------------------------+
|                RoboCode.Africa Gamification               |
|                                                           |
|  +-----------+   +-----------+   +---------------------+ |
|  | RoboPoints|   |  XP /     |   | Badges &            | |
|  | Earning   +-->+ Levels    +-->+ Achievements        | |
|  +-----------+   +-----------+   +---------------------+ |
|        |                                  |               |
|        v                                  v               |
|  +-----------+   +-----------+   +---------------------+ |
|  | Seasons & |   |Leaderboards|  | Rewards &           | |
|  | Resets    +-->+ (Ind/Team/ +->+ Redemption          | |
|  +-----------+   |  School)  |   +---------------------+ |
|                  +-----------+                            |
|        |                |              |                  |
|        v                v              v                  |
|  +------------------+  +------------------------------+  |
|  | Anti-Cheat /     |  | Privacy / Visibility Controls|  |
|  | Fairness Engine  |  | (Minor-Safe Defaults)        |  |
|  +------------------+  +------------------------------+  |
+-----------------------------------------------------------+
```

---

## RoboPoints Earning Rules

RoboPoints are the platform's unified points currency. Every Student account carries a RoboPoints balance that accumulates over time and within Seasons. Points are awarded by the platform automatically on verified completion events and by Teacher/Educator manual awards for qualitative assessment outcomes.

### Earning Sources

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-GAM-001 | The platform shall award RoboPoints to a Student upon verified completion of a coding task assigned by a Teacher. | Must | Points are credited only after the task submission is marked complete or graded by the Teacher. Auto-graded tasks credit immediately on passing test harness. |
| UR-GAM-002 | The platform shall award RoboPoints to a Student upon verified completion of a learning module or course unit (see _User Requirements: Learning, Courses, Tasks and Assessment_, UR-LRN series). | Must | Partial completion awards a proportional fraction defined by the course author. |
| UR-GAM-003 | The platform shall award RoboPoints when a Student successfully saves and runs a RoboCode Studio project that meets the minimum viability criteria (at least one simulated component active, simulation runs without fatal error). | Must | Prevents empty submissions farming points. RSE must confirm a non-trivial simulation state. |
| UR-GAM-004 | The platform shall award bonus RoboPoints for competition placements (1st, 2nd, 3rd and participation tiers) as configured per competition by a Teacher or School Admin. | Must | Participation points are awarded to all entrants; placement bonuses are additional. See _User Requirements: Teams, Competitions and Collaboration_. |
| UR-GAM-005 | The platform shall award Streak Bonus RoboPoints when a Student maintains a daily-login-and-activity streak of 3 or more consecutive days, with escalating bonuses at 7, 14, and 30-day milestones. | Should | Activity must include at least one meaningful action (task submission, project save, quiz answer) per day, not mere login. |
| UR-GAM-006 | The platform shall award First-Attempt Bonus RoboPoints when a Student passes an auto-graded task on the first submission attempt. | Should | Encourages careful, considered work before submission. |
| UR-GAM-007 | The platform shall award Peer-Help RoboPoints when a Student's public forum post or resource is endorsed by a Teacher as helpful (see _User Requirements: Communication, Notifications and Safety_). | Could | Teacher endorsement required; students cannot self-award or peer-award without staff oversight. |
| UR-GAM-008 | A Teacher shall be able to manually award or deduct a configurable number of RoboPoints to/from any Student in their class, with a mandatory reason field, subject to School Admin-defined limits. | Must | Default per-award bound is 1 to 500 RoboPoints; School Admins may tighten (but not raise) this default within tenant policy. All manual adjustments are logged in the audit trail (see UR-ADM series). Deductions must be bounded to prevent negative total balances. |
| UR-GAM-009 | The platform shall publish a School-level point schedule that is visible to Students and Parents/Guardians before any points are earned, ensuring transparency. | Must | Honoring data-minimisation and transparency principles under GDPR-K and age-appropriate design code. |
| UR-GAM-010 | RoboPoints awarded through cheating-detected events shall be revoked automatically and flagged for admin review (see UR-GAM-041 through UR-GAM-046). | Must | Revocation is logged; the Student is notified of the reason. |

### Point Schedule (Reference Values)

The following table provides baseline reference point values. School Admins may configure multipliers (0.5x – 2x) per activity type within their tenant.

| Earning Event | Base RoboPoints | Notes |
|---------------|----------------|-------|
| Task completion (standard) | 50 | Scaled by task difficulty tier (1–5) |
| Task completion (first attempt) | +25 bonus | Added on top of base |
| Project save + simulation run | 10 | Once per project per day |
| Course unit completion | 30 | Proportional for partial |
| Competition participation | 20 | All entrants |
| Competition 3rd place | +100 bonus | Team or individual |
| Competition 2nd place | +200 bonus | Team or individual |
| Competition 1st place | +350 bonus | Team or individual |
| Daily streak (3+ days) | 15/day | While streak is active |
| 7-day streak milestone | +50 bonus | One-off per streak |
| 14-day streak milestone | +100 bonus | One-off per streak |
| 30-day streak milestone | +300 bonus | One-off per streak |
| Teacher peer-help endorsement | 40 | Per endorsed post |
| Manual Teacher award | Configurable | Capped by School Admin policy |

---

## Experience Points (XP) and Levels

RoboPoints and XP are related but distinct. XP accumulates from a subset of earning events and determines a Student's Level within the platform. Levels serve as a persistent rank that does not reset with Seasons.

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-GAM-011 | The platform shall maintain a separate Experience Points (XP) tally for each Student, accumulating over the lifetime of the account (never reset). | Must | XP is always increasing; only RoboPoints fluctuate seasonally. |
| UR-GAM-012 | The platform shall map XP to a named Level using a progressive threshold table (e.g., Level 1 Beginner through Level 20 RoboCode Master), visible on the Student profile. | Must | Level name and badge icon are displayed on the Student's profile and within RoboCode Studio. |
| UR-GAM-013 | Levelling up shall trigger an in-platform notification and a visual celebration animation in RoboCode Studio. | Should | Animation must be skippable and must not interrupt an active simulation or code-run. |
| UR-GAM-014 | The Level thresholds table shall be configurable by Super Admin without a code deployment. | Should | Supports gradual balancing post-launch. |
| UR-GAM-015 | The Student's current Level and XP progress toward the next Level shall be visible at all times in the platform navigation header when logged in. | Must | Progress bar with next-level XP requirement clearly shown. |

### Level Reference Table

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
| 11–15 | (Intermediate tiers) | +2,000 per level |
| 16–19 | (Advanced tiers) | +4,000 per level |
| 20 | RoboCode Master | 40,000 |

---

## Badges and Achievements

Badges are discrete, named awards for specific milestone events or accomplishments. They are displayed on the Student profile and may be shared (subject to privacy controls).

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-GAM-016 | The platform shall award Badges to Students upon meeting predefined achievement conditions, with the Badge name, icon, and description visible on the Student's profile. | Must | Badge conditions are evaluated automatically by the platform in real time. |
| UR-GAM-017 | The platform shall provide at minimum the following Badge categories: Skill Badges (component/sensor mastery), Consistency Badges (streaks), Competition Badges (placement), Collaboration Badges (team activities), Milestone Badges (level, XP, projects completed), and Special/Event Badges (seasonal, teacher-awarded). | Must | Super Admin may create additional global badge types; School Admin may create tenant-specific badges. |
| UR-GAM-018 | A Student shall be able to view all available Badges (earned and unearned), with a locked-state icon and a progress indicator for partially-met conditions, to enable discovery and motivation. | Must | Unearned badges show the earning condition description, not hidden, per age-appropriate design principles. |
| UR-GAM-019 | Badge awards shall generate a platform notification to the Student (see _User Requirements: Communication, Notifications and Safety_, UR-COMM series). | Should | Notification must not include personal information about other students. |
| UR-GAM-020 | A Teacher shall be able to award a Special Badge (from a school-defined library) to any Student in their class, with a custom message, subject to content moderation filters. | Should | Special Badge awards are logged. Custom message is filtered for PII and profanity before display. |
| UR-GAM-021 | Badges earned on the platform shall not be automatically shared to any external social network or third-party service without explicit, informed consent from the student (and parent/guardian for minors). | Must | No share-to-social widget active for users under 16. Consent UI required for 16+ before any external share. |
| UR-GAM-022 | The platform shall prevent duplicate Badge awards for the same achievement event. | Must | Idempotent award logic: re-triggering the same event does not re-grant the badge. |

### Sample Badge Catalogue

| Badge Name | Category | Earning Condition |
|------------|----------|-------------------|
| Hello LED | Skill | Simulate first LED circuit in RoboCode Studio |
| Sensor Explorer | Skill | Use 5 distinct sensor types in projects |
| Breadboard Wizard | Skill | Complete 10 breadboard wiring tasks correctly |
| 7-Day Streak | Consistency | Maintain 7-day activity streak |
| 30-Day Streak | Consistency | Maintain 30-day activity streak |
| Podium Finisher | Competition | Earn 1st, 2nd or 3rd in any competition |
| Team Player | Collaboration | Complete 3 team projects |
| Century Builder | Milestone | Complete 100 RoboPoints-earning events |
| Level 10 Achiever | Milestone | Reach Level 10 |
| Season Champion | Special/Event | Top of school leaderboard at season close |
| Most Improved | Special/Event | Teacher-awarded; highest XP gain in a term |

---

## Leaderboards

Leaderboards provide visible ranking of Students, Teams, and Schools. They are designed to motivate constructive competition while respecting the privacy and wellbeing of minor users.

### Leaderboard Scope and Tiers

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-GAM-023 | The platform shall provide Individual Leaderboards at the following scopes: (a) within-class, (b) within-school (tenant), (c) global (across all tenants). | Must | Students are shown in the leaderboard by display name; real names are not required for global scope. |
| UR-GAM-024 | The platform shall provide Team Leaderboards at: (a) within-school and (b) global scope (see _User Requirements: Teams, Competitions and Collaboration_). | Must | Team score is the aggregate of member RoboPoints over the season. |
| UR-GAM-025 | The platform shall provide a School (Tenant) Leaderboard visible to Super Admin and optionally to School Admin, comparing aggregate school statistics (average student RoboPoints, task completion rate, active student count). | Should | School names are shown on the global school leaderboard. Individual student data is never exposed on cross-tenant views. |
| UR-GAM-026 | Each leaderboard shall support both a Weekly view (points earned in the current 7-day window) and an All-Time view (cumulative since account creation or season start). | Must | Weekly resets occur at midnight UTC on the configured day (default: Monday). |
| UR-GAM-027 | Leaderboards shall be filterable by class (for Teachers), by grade/age-band, and by active season. | Should | Reduces information overload for schools with many classes. |
| UR-GAM-028 | A Student's position in the leaderboard shall be shown even when they do not appear in the top N visible rows (e.g., "You are ranked 42nd"). | Must | Inclusive design: avoids excluding or demotivating lower-ranked students. |
| UR-GAM-029 | A School Admin shall be able to disable the global individual leaderboard for their school's students, limiting visibility to within-school rankings only. | Must | Privacy control required by GDPR-K and age-appropriate design code — schools must have opt-out control. |
| UR-GAM-030 | A Parent/Guardian shall be able to view their child's leaderboard position within their school but shall not be able to view the positions or scores of other students by name. | Must | Protects other minors' data per COPPA and GDPR-K. |

### Leaderboard Display Requirements

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-GAM-031 | The leaderboard shall display at minimum: rank position, display name, Level icon, RoboPoints total, and XP total for the selected scope and time window. | Must | No real name, school name, or location visible on global leaderboard without School Admin opt-in. |
| UR-GAM-032 | The leaderboard shall refresh at least every 5 minutes when viewed live, with a visible last-updated timestamp. | Should | Near-real-time updates are motivating; exact real-time is Could priority. |
| UR-GAM-033 | Ties in leaderboard ranking shall be broken first by XP, then by most recent point-earning event timestamp. | Must | Tie-breaking logic is documented in-platform and disclosed to students. |

---

## Seasons and Resets

Seasons provide periodic fresh starts, sustaining long-term engagement and preventing early adopters from permanently dominating leaderboards.

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-GAM-034 | The platform shall support configurable Seasons, each with a defined start date, end date, and an optional theme name. | Must | Super Admin defines global seasons; School Admins may define additional tenant seasons within a global season. |
| UR-GAM-035 | At Season end, each Student's seasonal RoboPoints balance shall be archived (not deleted) and the seasonal leaderboard snapshot shall be preserved for retrospective viewing for at least 2 years. | Must | Students can view their past season performance. Archive satisfies audit/data-retention obligations. |
| UR-GAM-036 | At Season start, the active RoboPoints balance used for leaderboard ranking shall reset to zero; XP and Levels shall never reset. | Must | Clearly communicates to students that effort is always retained (XP/Level) while competition is refreshed (RoboPoints). |
| UR-GAM-037 | Students shall receive an in-platform notification at least 7 days before Season end, with a summary of their current standings and badges earned in the season. | Should | Motivates a final push and manages expectations for the reset. |
| UR-GAM-038 | Badges and achievements earned in a Season shall be permanently retained on the student profile regardless of resets. | Must | Consistent with XP/Level retention philosophy. |
| UR-GAM-039 | Super Admin shall be able to define Season-specific leaderboard themes, bonus-point event multipliers, and limited-time Badges that are only available during that Season. | Should | Seasonal novelty sustains re-engagement. |
| UR-GAM-040 | School Admins shall receive a Season Summary Report for their school at season close, showing aggregate statistics without revealing individual student data to parents or unapproved third parties. | Should | Report generated automatically; see _User Requirements: Administration and Reporting_. |

---

## Anti-Cheating and Fairness

Maintaining the integrity of the gamification system is essential to its motivational value and to safeguarding fairness for all students.

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-GAM-041 | The platform shall detect and suppress rapid-repeat event submissions that exceed statistical norms for the activity type, flagging them as potential gaming attempts. | Must | Rate-limiting per event type per student per hour; configurable thresholds by Super Admin. |
| UR-GAM-042 | The platform shall detect copy-paste plagiarism in code submissions by comparing against a configurable similarity threshold across the tenant's student submissions, and flag matches for Teacher review. | Must | Flagged submissions earn zero points pending Teacher review; the Student is informed the submission is under review. |
| UR-GAM-043 | The platform shall require that RoboCode Studio simulation run events originate from a genuine simulation session (RSE heartbeat token), preventing direct API calls that spoof simulation completion. | Must | Prevents scripted point farming via API manipulation. |
| UR-GAM-044 | Teachers and School Admins shall receive an Anti-Cheat Alerts dashboard showing flagged submissions and unusual point-earning patterns within their scope. | Must | Alerts include suggested action (review, revoke, dismiss). No false-positive auto-revoke without Teacher/Admin confirmation. |
| UR-GAM-045 | Super Admin and Platform Moderators shall have a global Anti-Cheat view showing cross-tenant anomalies and coordinated gaming patterns. | Must | Necessary for platform integrity; distinct from per-school views. |
| UR-GAM-046 | All anti-cheat decisions (flag, revoke, dismiss) shall be logged in the audit trail with the actor identity, timestamp, and justification (see _User Requirements: Administration and Reporting_, UR-ADM series). | Must | Audit log entries are immutable and retained per the authoritative retention schedule in Section 15 (UR-COMM-063): standard platform audit log minimum 12 months. |

---

## Rewards

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-GAM-047 | The platform shall support a Rewards Catalogue where RoboPoints can be redeemed for non-monetary in-platform rewards (e.g., profile themes, avatar items, Studio colour schemes, badge frames). | Should | No real-money or real-goods redemption in v1. Avoids regulatory complications in multi-jurisdiction Africa deployment. |
| UR-GAM-048 | Reward redemption shall deduct the corresponding RoboPoints from the Student's seasonal balance; XP is unaffected. | Must | Students must be clearly informed that redemption reduces their leaderboard-competing balance. |
| UR-GAM-049 | A Teacher or School Admin shall be able to define school-specific reward items (e.g., early-access to a new lesson, a digital certificate) with configurable RoboPoints costs. | Could | Extends the reward system without requiring platform-level changes. |
| UR-GAM-050 | All reward items must be age-appropriate and must not include any advertising, brand sponsorship, or external commercial links visible to minor students without verifiable parental consent. | Must | Compliance with age-appropriate design code, COPPA, and GDPR-K. |

---

## Privacy and Visibility Controls for Minors

Privacy is a design requirement, not an afterthought. The following requirements reflect age-appropriate design code principles, GDPR-K, COPPA, and the multi-jurisdiction data protection obligations specified in the Project Canon.

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-GAM-051 | The default visibility of a Student's leaderboard profile shall be limited to within-school (tenant) scope until a School Admin explicitly opts the school into global leaderboard participation. | Must | Privacy-by-default for minors. Global participation requires School Admin action, not student action. |
| UR-GAM-052 | Students aged under 13 (COPPA) or under 16 (GDPR-K) shall have their real name replaced with their display name (chosen at signup, reviewed for appropriateness) on all leaderboards and badge displays. | Must | Real name is never exposed on leaderboards. Display name must pass content-moderation filter at creation. |
| UR-GAM-053 | A Parent/Guardian shall be able to opt their child out of all leaderboards (school and global) via the Parent/Guardian account settings, and this preference must be respected immediately across all views. | Must | Opt-out persists across Season resets. Re-opt-in requires parent/guardian action. |
| UR-GAM-054 | The platform shall not use gamification data (RoboPoints, badges, level, leaderboard position) for targeted advertising, profiling, or any commercial purpose beyond the educational experience. | Must | Absolute prohibition; applies to all student age groups. |
| UR-GAM-055 | Students shall be able to view who can see their gamification data through a simple "Who can see this?" control on their profile, appropriate for their age and reading level. | Must | Age-appropriate transparency requirement from the age-appropriate design code. |
| UR-GAM-056 | Super Admin shall be able to define platform-wide minimum age thresholds above which certain gamification features (e.g., global leaderboard, public badge sharing) become available, enforced by date-of-birth verification at account level. | Should | Enables jurisdiction-specific tuning without code changes. |
| UR-GAM-057 | All gamification data for a Student whose account is deleted or whose parent/guardian withdraws consent shall be anonymised or deleted within 30 days, with leaderboard historical entries replaced by "Deleted User." | Must | Right to erasure under GDPR Art. 17; COPPA deletion obligations. Historical season archives retain anonymised placeholders for statistical integrity. |

---

## MoSCoW Priority Summary

| ID | Requirement Summary | Priority |
|----|---------------------|----------|
| UR-GAM-001 | Award points on task completion | Must |
| UR-GAM-002 | Award points on course unit completion | Must |
| UR-GAM-003 | Award points on project save + simulation run | Must |
| UR-GAM-004 | Award competition placement points | Must |
| UR-GAM-005 | Streak Bonus RoboPoints with milestones | Should |
| UR-GAM-006 | First-Attempt Bonus | Should |
| UR-GAM-007 | Peer-Help points via Teacher endorsement | Could |
| UR-GAM-008 | Teacher manual point awards and deductions | Must |
| UR-GAM-009 | Published, transparent point schedule | Must |
| UR-GAM-010 | Revoke cheating-detected points | Must |
| UR-GAM-011 | Lifetime XP tally (never reset) | Must |
| UR-GAM-012 | XP-to-Level mapping with named tiers | Must |
| UR-GAM-013 | Level-up notification and animation | Should |
| UR-GAM-014 | Configurable Level thresholds by Super Admin | Should |
| UR-GAM-015 | Level and XP progress in navigation header | Must |
| UR-GAM-016 | Badge awards on achievement conditions | Must |
| UR-GAM-017 | Minimum badge category coverage | Must |
| UR-GAM-018 | View all badges (earned and unearned) with progress | Must |
| UR-GAM-019 | Notification on badge award | Should |
| UR-GAM-020 | Teacher Special Badge award | Should |
| UR-GAM-021 | No external badge sharing for minors without consent | Must |
| UR-GAM-022 | No duplicate badge awards | Must |
| UR-GAM-023 | Individual leaderboards (class / school / global) | Must |
| UR-GAM-024 | Team leaderboards (school / global) | Must |
| UR-GAM-025 | School aggregate leaderboard | Should |
| UR-GAM-026 | Weekly and All-Time leaderboard views | Must |
| UR-GAM-027 | Leaderboard filters (class, grade, season) | Should |
| UR-GAM-028 | Student's own rank shown outside top N | Must |
| UR-GAM-029 | School Admin opt-out from global individual leaderboard | Must |
| UR-GAM-030 | Parent/Guardian restricted leaderboard view | Must |
| UR-GAM-031 | Leaderboard display fields | Must |
| UR-GAM-032 | Leaderboard refresh every 5 minutes | Should |
| UR-GAM-033 | Tie-breaking by XP then timestamp | Must |
| UR-GAM-034 | Configurable Seasons with dates and themes | Must |
| UR-GAM-035 | Archive seasonal RoboPoints and snapshot | Must |
| UR-GAM-036 | Seasonal RoboPoints reset; XP/Level never reset | Must |
| UR-GAM-037 | 7-day pre-season-end student notification | Should |
| UR-GAM-038 | Permanent retention of badges regardless of resets | Must |
| UR-GAM-039 | Season-specific themes, multipliers, and badges | Should |
| UR-GAM-040 | Season Summary Report for School Admin | Should |
| UR-GAM-041 | Rapid-repeat event detection (rate limiting) | Must |
| UR-GAM-042 | Code plagiarism detection with Teacher review | Must |
| UR-GAM-043 | Simulation run events require genuine RSE session | Must |
| UR-GAM-044 | Anti-Cheat Alerts dashboard for Teachers and Admins | Must |
| UR-GAM-045 | Global Anti-Cheat view for Super Admin | Must |
| UR-GAM-046 | Audit logging of all anti-cheat decisions | Must |
| UR-GAM-047 | In-platform Rewards Catalogue (cosmetic only) | Should |
| UR-GAM-048 | Reward redemption deducts RoboPoints (not XP) | Must |
| UR-GAM-049 | School-specific custom reward items | Could |
| UR-GAM-050 | Age-appropriate, advertising-free rewards | Must |
| UR-GAM-051 | Default leaderboard visibility within-school | Must |
| UR-GAM-052 | Display name only (no real name) on leaderboards | Must |
| UR-GAM-053 | Parent/Guardian opt-out from all leaderboards | Must |
| UR-GAM-054 | No commercial use of gamification data | Must |
| UR-GAM-055 | "Who can see this?" transparency control | Must |
| UR-GAM-056 | Configurable age thresholds for feature access | Should |
| UR-GAM-057 | Gamification data erasure on account deletion | Must |

---

## Cross-References

- _User Requirements: Onboarding, Signup and Approval_ — UR-ONB series: Student account creation and parental consent process that underpins age-gating for gamification features.
- _User Requirements: Authentication and Account Management_ — UR-AUTH series: Parent/Guardian account linking required for consent-based leaderboard opt-in/opt-out (UR-GAM-053).
- _User Requirements: School Onboarding, Custom Domain and White-Labelling_ — UR-SCH series: Tenant isolation that bounds school-scoped leaderboards (UR-GAM-023, UR-GAM-024, UR-GAM-029).
- _User Requirements: Learning, Courses, Tasks and Assessment_ — UR-LRN series: Task and course completion events that trigger RoboPoints and XP (UR-GAM-001, UR-GAM-002).
- _User Requirements: Teams, Competitions and Collaboration_ — UR-TEAM series: Team formation, competition structure, and competition-placement point awards (UR-GAM-004, UR-GAM-024).
- _User Requirements: Communication, Notifications and Safety_ — UR-COMM series: Notification delivery for badge awards, streak milestones, season-end alerts, and anti-cheat decisions.
- _User Requirements: Administration and Reporting_ — UR-ADM series: Audit logging, season summary reports, and anti-cheat alert dashboards.
- _User Requirements: RoboCode Studio Canvas, Components and Wiring_ and _User Requirements: Simulation Experience_ — UR-SIM series: RSE session token used to validate simulation-run point events (UR-GAM-043).
