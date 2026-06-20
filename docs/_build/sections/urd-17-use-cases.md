# Use Cases

## Overview

This section presents the detailed use cases that express how users of every role interact with RoboCode.Africa to accomplish their primary goals. Each use case (UC-nnn) follows the IEEE 830 / ISO/IEC/IEEE 29148 template: unique identifier, title, actors, preconditions, main success flow, alternate and exception flows, and postconditions.

The use cases in this section are the primary bridge between the user requirements stated in Sections 6–16 and the user stories and acceptance criteria in **Section 18 (User Stories and Acceptance Criteria)**. Every use case traces to one or more user requirement IDs (UR-*) and, where relevant, to functional requirements in the System Specification Document (FR-* / SR-* / DR-*).

The full set covers:

| UC ID | Title | Primary Actor |
|-------|-------|---------------|
| UC-001 | School Registers and Configures Its Tenant | School Admin |
| UC-002 | School Admin Configures Custom Domain | School Admin |
| UC-003 | School Admin Applies White-Label Branding | School Admin |
| UC-004 | Student Signs Up via School Domain and Is Approved | Student, School Admin |
| UC-005 | Parent / Guardian Provides Verifiable Consent | Parent / Guardian |
| UC-006 | Super Admin Approves a Direct Signup | Super Admin / Platform Moderator |
| UC-007 | Super Admin Moderates Flagged Content | Super Admin / Platform Moderator |
| UC-008 | Student Builds and Simulates a Blink LED Project | Student |
| UC-009 | Student Builds an Ultrasonic Obstacle-Avoiding Robot | Student |
| UC-010 | Teacher Creates and Assigns a Coding Task | Teacher |
| UC-011 | Teacher Reviews and Grades a Student Submission | Teacher |
| UC-012 | Team Forms and Enters a Competition | Student, Teacher, School Admin |
| UC-013 | Student Earns RoboPoints and Rises on the Leaderboard | Student |
| UC-014 | Student Collaborates in Real Time on a Team Project | Student, Teacher |
| UC-015 | Teacher Authors a Block-Based Lesson for Primary Students | Teacher |
| UC-016 | School Admin Monitors School-Level Reports and Compliance | School Admin |

---

## Use Case Conventions

Each use case is presented with the following structure:

```
UC-nnn  Title
─────────────────────────────────────────────────────
Actor(s)         : Primary actor; secondary actors
Preconditions    : State of the system before the flow begins
Main Success Flow: Numbered steps of the primary path
Alternate Flows  : Alternative valid paths (A-nnn.n)
Exception Flows  : Error / failure paths (E-nnn.n)
Postconditions   : State of the system on success
Traces to        : UR-* requirement IDs
```

Steps that generate an audit log entry are marked **(AUDIT)**.
Steps that enforce a safety control are marked **(SAFETY)**.
Steps involving a minor are marked **(MINOR)**.

---

## UC-001 — School Registers and Configures Its Tenant

**Actor(s):** Primary — School Admin (prospective); Secondary — Super Admin, Platform Moderator

**Preconditions:**
- The school does not yet have an account on RoboCode.Africa.
- The prospective School Admin has access to a valid institutional email address.
- The `robocode.africa` marketing site is publicly accessible.

**Main Success Flow:**

1. The prospective School Admin navigates to `robocode.africa` and selects **Register Your School**.
2. The system presents the school registration form. The prospective School Admin enters: legal school name, country, physical address, school type (primary / secondary / both), estimated student count, their full name, institutional work email, contact phone number, and accepts the Platform Terms of Service and Data Processing Agreement.
3. The system validates all fields, checks that the email domain is not blocklisted, and submits the registration in **Unverified** status (pending email verification; per UR-ONB-056).
4. The system sends an email verification link to the submitted work email address. **(AUDIT)**
5. The prospective School Admin clicks the verification link within 48 hours.
6. The system transitions the registration to **Pending Admin Review** and notifies the Super Admin / Platform Moderator queue. **(AUDIT)**
7. A Super Admin or Platform Moderator reviews the submission in the Administration dashboard (see **Section 16: User Requirements: Administration and Reporting**), finds no issues, and clicks **Approve**.
8. The system provisions the tenant: creates the isolated database partition with `tenant_id` and Row-Level Security, auto-generates the school slug from the school name (e.g. `harare-high` → `harare-high.robocode.africa`), and transitions to **Activated — Pending School Admin Setup**. **(AUDIT)**
9. The system sends the School Admin an account-activation email containing a single-use link valid for 7 days.
10. The School Admin clicks the activation link, sets a strong password (minimum 12 characters: uppercase, lowercase, digit, symbol), and configures TOTP-based MFA before accessing the tenant dashboard. **(AUDIT)**
11. The system presents the **School Setup Wizard**: confirm/edit the school slug (3–48 characters, unique), upload a school logo, set primary brand colour, select the default student age group, and configure the default communication language.
12. The School Admin completes the wizard. The system saves the configuration, resolves `<slug>.robocode.africa` to the tenant's branded login page, and marks the tenant as **Active**. **(AUDIT)**

**Alternate Flows:**

- **A-001.1 — School Admin edits auto-generated slug:** At step 11, the School Admin types an alternative slug. The system performs a real-time availability check; if unique and format-valid, it accepts the slug. If not, it displays a validation error and suggests alternatives.
- **A-001.2 — Super Admin requests changes:** At step 7, the Super Admin selects **Request Changes**, enters a mandatory free-text reason, and the system emails the School Admin with the change request. The School Admin updates the registration and resubmits; the flow resumes from step 6.

**Exception Flows:**

- **E-001.1 — Email verification link expires:** If the School Admin does not click the link within 48 hours, the link expires. The School Admin must request a new link from the registration confirmation page; the system re-sends a fresh link. **(AUDIT)**
- **E-001.2 — Super Admin rejects the registration:** At step 7, the Super Admin selects **Reject**, provides a mandatory reason, and the system notifies the School Admin by email. The tenant is not provisioned. The School Admin may reapply after correcting the identified issues. **(AUDIT)**
- **E-001.3 — Activation link expires:** If the School Admin does not activate within 7 days of step 9, the link expires and the tenant is placed in **Provisioned — Activation Expired** status. The Super Admin is notified; a new activation link is issued on request.

**Postconditions (Success):**
- A new school tenant exists, is isolated by RLS, and is accessible at `<slug>.robocode.africa`.
- The School Admin account is active, MFA-protected, and holds the `School Admin` role scoped to this tenant.
- An immutable audit log records all state transitions.

**Traces to:** UR-SCH-001 through UR-SCH-008 (Section 8 school registration), UR-SCH-007 and UR-AUTH-016/UR-AUTH-017 (staff MFA), UR-SCH-090 through UR-SCH-095 (tenant isolation), FR-TEN-*, SR-001.

---

## UC-002 — School Admin Configures Custom Domain

**Actor(s):** Primary — School Admin; Secondary — DNS/ACME infrastructure (automated)

**Preconditions:**
- The school tenant is Active (UC-001 completed).
- The School Admin has access to their school's DNS registrar or DNS control panel.
- The desired custom domain (e.g. `code.myschool.edu`) is owned by the school.

**Main Success Flow:**

1. The School Admin navigates to **School Settings → Custom Domain** in the tenant dashboard.
2. The School Admin enters the desired custom domain name (e.g. `code.myschool.edu`) and selects **Add Domain**.
3. The system validates that the domain string is well-formed and is not already claimed by another tenant. **(AUDIT)**
4. The system generates a unique CNAME target and a TXT verification token and displays them to the School Admin in a step-by-step DNS instructions panel.
5. The School Admin logs in to their DNS registrar and adds both records:
   - `CNAME code.myschool.edu → <tenant-id>.proxy.robocode.africa`
   - `TXT _robocodeproof.code.myschool.edu → <verification-token>`
6. The School Admin returns to the dashboard and selects **Verify Domain**.
7. The system queries DNS for both records. Both records resolve correctly.
8. The system issues a TLS certificate for the custom domain via ACME / Let's Encrypt, stores the certificate, and configures the edge routing layer to serve the tenant at the custom domain. **(AUDIT)**
9. The system marks the custom domain as **Active** and displays a success confirmation. Within 5 minutes the custom domain serves the tenant's branded login page over HTTPS.

**Alternate Flows:**

- **A-002.1 — DNS propagation delay:** At step 7, DNS records are not yet visible due to propagation delay. The system schedules an automatic retry every 15 minutes for up to 48 hours and notifies the School Admin by email once verification succeeds.
- **A-002.2 — School Admin removes the custom domain:** At any point after step 9, the School Admin may navigate to **Custom Domain → Remove** to detach the custom domain. The system revokes the certificate and restores service to the subdomain only. **(AUDIT)**

**Exception Flows:**

- **E-002.1 — Domain already claimed:** At step 3, if the domain is claimed by another tenant, the system displays an error and instructs the School Admin to contact platform support. **(AUDIT)**
- **E-002.2 — ACME certificate issuance fails:** At step 8, if Let's Encrypt rate-limits or fails, the system retries using exponential backoff, notifies the Super Admin, and displays a pending notice to the School Admin. The subdomain continues to function during the retry window.
- **E-002.3 — Verification timeout:** If DNS records are not verified within 48 hours, the pending request is cancelled, the School Admin is notified by email, and the domain may be resubmitted.

**Postconditions (Success):**
- The custom domain resolves to the tenant's branded login page over HTTPS.
- The school subdomain continues to function in parallel.
- An audit record captures the domain addition, verification, and certificate issuance timestamps.

**Traces to:** UR-SCH-020 through UR-SCH-030, FR-TEN-020, SR-002.

---

## UC-003 — School Admin Applies White-Label Branding

**Actor(s):** Primary — School Admin

**Preconditions:**
- The school tenant is Active.
- The School Admin is authenticated and has navigated to **School Settings → Branding**.

**Main Success Flow:**

1. The School Admin opens the **Branding** panel. The system displays a live preview panel alongside the configuration controls.
2. The School Admin uploads a school logo (PNG or SVG, max 2 MB). The system validates the file, generates optimised variants (favicon, navbar logo, email header), and stores them in S3-compatible object storage.
3. The School Admin sets a primary brand colour using the colour-picker or by entering a hex code. The system derives a full design-token palette (primary, secondary, surface, text, accent) from the chosen colour using the platform's white-label token generator and applies them to the live preview.
4. The School Admin optionally sets a custom landing-page tagline (max 120 characters) and a school-specific welcome message displayed to students on first login.
5. The School Admin selects **Save Branding**. The system validates and persists the branding configuration.
6. The system applies the new design tokens to all pages served under the tenant's subdomain and custom domain (if configured). The change propagates to the CDN edge within 60 seconds.
7. The system logs the branding change with the acting user's identity and a before/after record. **(AUDIT)**

**Alternate Flows:**

- **A-003.1 — School Admin resets branding to platform defaults:** The School Admin selects **Reset to Default**. The system removes all custom tokens, reverts to the RoboCode.Africa default theme, and logs the reset. **(AUDIT)**

**Exception Flows:**

- **E-003.1 — Invalid logo file:** If the uploaded file exceeds 2 MB or is not PNG/SVG, the system rejects it with a clear error message and does not alter the existing logo.
- **E-003.2 — Colour accessibility failure:** If the derived palette produces insufficient contrast ratios (below WCAG 2.2 AA 4.5:1 for normal text), the system displays a warning in the live preview, highlights the failing elements, and requires the School Admin to adjust the colour before saving. Core safety features (moderation banners, consent notices) cannot be overridden by tenant branding.

**Postconditions (Success):**
- The tenant's subdomain and custom domain display the school logo and brand colours across all authenticated and public-facing pages.
- An audit record captures the change.

**Traces to:** UR-SCH-040 through UR-SCH-047, FR-TEN-030, NFR-ACCESS-001.

---

## UC-004 — Student Signs Up via a School Domain and Is Approved

**Actor(s):** Primary — Student; Secondary — School Admin; Tertiary — Parent / Guardian (if minor) **(MINOR)**

**Preconditions:**
- The school tenant is Active.
- The Student has been given the school subdomain URL or custom domain URL by a Teacher or School Admin.
- The Student does not yet have an account on RoboCode.Africa.

**Main Success Flow:**

1. The Student navigates to the school's URL (e.g. `harare-high.robocode.africa`) and selects **Sign Up as Student**.
2. The system presents the student registration form branded with the school's identity. The Student enters: chosen display name, email address, year/grade level, and a password. The system collects date of birth to determine if parental consent is required. **(MINOR)**
3. The system validates fields and determines the student's age against the applicable consent threshold (under 13 for COPPA; under 16 for GDPR-K; the most restrictive applicable threshold is used). **(SAFETY)**
4. If the student is above the consent threshold: the system sends an email verification link to the student's email and places the registration in **Unverified** status (pending email verification; per UR-ONB-056).
5. The Student clicks the verification link. The system transitions the registration to **Pending School Admin Approval** and notifies the School Admin. **(AUDIT)**
6. The School Admin reviews the pending student in the **Approval Queue** of the school dashboard, verifies the student's grade and enrolment legitimacy, and selects **Approve**. **(AUDIT)**
7. The system activates the Student account, assigns the `Student` role scoped to this tenant, sends the Student a welcome email with login instructions, and optionally enrolls them in the default class if the School Admin has configured auto-enrollment.
8. The Student logs in and completes a first-login profile setup (avatar selection from an approved gallery, optional bio, preferred coding language). The system records the completed first-login timestamp.

**Alternate Flows:**

- **A-004.1 — Student is a minor (consent required):** At step 3, if the student is below the consent threshold, after step 4 the system additionally initiates the parental consent workflow (see UC-005). The account remains in **Pending Parental Consent** status until consent is received; thereafter it enters **Pending School Admin Approval** and the flow continues from step 6.
- **A-004.2 — School Admin bulk-invites students:** The School Admin uploads a CSV of student names and email addresses. The system generates invitation links for each student. Students who click their invitation link are pre-assigned to the correct class and bypass some registration fields. The approval step at step 6 is still required unless the School Admin has enabled auto-approval for CSV-invited students.

**Exception Flows:**

- **E-004.1 — Email already registered:** If the email address at step 2 is already registered (in any tenant or at the main domain), the system informs the student and offers a **Sign In** link instead.
- **E-004.2 — School Admin rejects the signup:** At step 6, the School Admin selects **Reject** and provides a mandatory reason. The system notifies the Student by email. The account is not activated. The student may contact the School Admin to resolve the issue and reapply.
- **E-004.3 — Email verification link expires:** If the Student does not verify their email within 48 hours, the link expires. The Student may request a resend from the login page.

**Postconditions (Success):**
- The Student account is Active, scoped to the school tenant, and the Student can log in and access RoboCode Studio.
- If applicable, parental consent is on record.
- An audit log captures registration, email verification, and approval timestamps.

**Traces to:** UR-ONB-001 through UR-ONB-020, UR-ONB-090 through UR-ONB-096 (minor protections), FR-AUTH-010, DR-001.

---

## UC-005 — Parent / Guardian Provides Verifiable Consent

**Actor(s):** Primary — Parent / Guardian; Secondary — Student (minor), School Admin **(MINOR) (SAFETY)**

**Preconditions:**
- A minor Student has completed the registration form (UC-004, step 2–3) and been identified as below the consent age threshold.
- The Parent / Guardian's email address has been captured from the Student's registration form.
- The Student account is in **Pending Parental Consent** status.

**Main Success Flow:**

1. The system sends a consent request email to the Parent / Guardian's email address. The email includes: the platform name and logo, a plain-language description of data collected and how it is used (COPPA/GDPR-K notice), a list of features the child will access, and a secure consent link valid for 7 days.
2. The Parent / Guardian opens the consent link. The system presents the Parental Consent form, which includes: the full consent notice (data minimisation policy, no behavioural advertising, no private messaging for minors, right to withdraw consent, right to erasure), and requires the Parent / Guardian to enter: their full name, their relationship to the child, and confirmation of the child's name and date of birth.
3. The Parent / Guardian reads the notice, checks **I have read and understood the above**, and selects **Give Consent**. **(SAFETY)**
4. The system records the consent: consenting adult's name, relationship, email address, IP address, timestamp, platform privacy policy version, and consent record ID. This record is stored immutably in the audit database. **(AUDIT)**
5. The system transitions the student registration from **Pending Parental Consent** to **Pending School Admin Approval** (if not already in that state) and notifies the School Admin.
6. The system sends a confirmation email to the Parent / Guardian acknowledging that their consent has been recorded and explaining how to withdraw consent.

**Alternate Flows:**

- **A-005.1 — Parent / Guardian declines consent:** At step 3, the Parent / Guardian selects **Decline**. The system records the decline, notifies the Student (at their own email, if provided), and places the student account in **Consent Declined — Not Activated** status. The decline is logged. **(AUDIT)**
- **A-005.2 — Parent / Guardian withdraws previously given consent:** At any point after step 4, the Parent / Guardian may click the **Withdraw Consent** link in their confirmation email or log in to the Parental Consent portal. The system deactivates the minor's account, initiates the data deletion / retention review workflow (see UR-ONB-096), notifies the School Admin, and logs the withdrawal. **(AUDIT)**

**Exception Flows:**

- **E-005.1 — Consent link expires:** If the consent link is not used within 7 days, it expires. The system sends a reminder email to the Parent / Guardian at day 5. If still unused at day 7, the system notifies the School Admin that consent is overdue; the School Admin may request the system to re-send the consent request email.
- **E-005.2 — Suspected fraudulent consent:** If the consent email address domain matches the student's own email domain (suggesting self-consent), the system flags the record for Platform Moderator review before activating the account. **(SAFETY) (AUDIT)**

**Postconditions (Success):**
- An immutable parental consent record is stored.
- The minor Student's account may proceed to School Admin approval.
- The Parent / Guardian has received confirmation and understands their rights.

**Traces to:** UR-ONB-015, UR-ONB-027 through UR-ONB-036 (consent gate), UR-ONB-090, UR-ONB-096, SR-003, DR-002, FR-AUTH-015.

---

## UC-006 — Super Admin Approves a Direct Signup

**Actor(s):** Primary — Super Admin or Platform Moderator; Secondary — Student (direct signup)

**Preconditions:**
- A Student has self-registered at `robocode.africa` (not via a school domain) and completed email verification.
- If a minor, parental consent has been received (UC-005).
- The student account is in **Pending Approval** status in the platform's central approval queue (per UR-ONB-056).

**Main Success Flow:**

1. The Super Admin or Platform Moderator logs in to the Administration Dashboard and navigates to **Signup Approval Queue → Direct Signups**.
2. The queue displays all pending direct-signup student accounts sorted by submission date, showing: display name, email domain, country, age group, and consent status.
3. The Super Admin / Platform Moderator selects a pending account and reviews the details. The system displays the full registration record including submitted data, email verification timestamp, and (if minor) consent record.
4. The Super Admin / Platform Moderator optionally performs a content-safety check: verifies the display name does not contain profanity, PII, or inappropriate content. **(SAFETY)**
5. The Super Admin / Platform Moderator selects **Approve**. **(AUDIT)**
6. The system activates the Student account in the direct-signup space (accessible at `robocode.africa`), sends the Student a welcome email with login instructions, and removes the record from the approval queue.

**Alternate Flows:**

- **A-006.1 — Platform Moderator reviews in bulk:** The Platform Moderator can select multiple records and perform a bulk approve action for straightforward cases. Each approval is individually logged with the Moderator's identity. **(AUDIT)**
- **A-006.2 — Super Admin requests clarification:** At step 3, the Super Admin selects **Request Information**, enters a message, and the system emails the Student. The account remains Pending until the student responds and the Super Admin re-reviews.

**Exception Flows:**

- **E-006.1 — Super Admin rejects the signup:** At step 5, the Super Admin / Platform Moderator selects **Reject**, provides a mandatory reason (selected from a categorised dropdown: suspected fraud, inappropriate display name, missing consent, duplicate account, other), and the system notifies the Student by email with a brief explanation (not disclosing moderation details). **(AUDIT)**
- **E-006.2 — Minor consent missing or fraudulent:** If a minor's consent record is flagged (see UC-005, E-005.2), the system blocks the approval option and requires the Platform Moderator to resolve the consent flag first. **(SAFETY)**

**Postconditions (Success):**
- The Student account is Active at `robocode.africa` and the Student can access RoboCode Studio.
- An audit log records the approving actor, timestamp, and rationale.

**Traces to:** UR-ONB-010, UR-ONB-012 through UR-ONB-015, UR-ADM-008 through UR-ADM-012 (signup approvals), FR-AUTH-010, SR-004.

---

## UC-007 — Super Admin Moderates Flagged Content

**Actor(s):** Primary — Super Admin or Platform Moderator; Secondary — Teacher (reporter), Student (subject) **(SAFETY)**

**Preconditions:**
- A piece of content (project description, forum post, code comment, or display name) has been flagged either automatically by the profanity/PII filter or manually by a Teacher, School Admin, or Student.
- The Super Admin or Platform Moderator is logged in and navigating the **Moderation Queue**.

**Main Success Flow:**

1. The system displays the Moderation Queue, listing flagged items in priority order. Each item shows: content type, snippet, flagging source (automated filter or reporter role), tenant (if applicable), timestamp, and a severity indicator.
2. The Super Admin / Platform Moderator opens a flagged item. The system presents: the full content in context, the flag reason, the reporter identity (visible to moderators, not to the subject), and the subject user's account history and prior flags.
3. The moderator reviews the content and determines a disposition:
   - **Clear** — flag was a false positive; content is restored/published without action.
   - **Edit/Redact** — moderator removes the offending text and notifies the user with guidance.
   - **Remove** — content is removed and the user receives a warning notification.
   - **Suspend Account** — for severe/repeated violations; account is suspended pending review.
   - **Escalate (Safeguarding)** — content contains indicators of child abuse, self-harm, or criminal activity; the system triggers the safeguarding escalation protocol. **(SAFETY)**
4. The moderator selects a disposition and adds a mandatory moderator note. **(AUDIT)**
5. The system applies the disposition, logs every action with the moderator's identity, the content hash, and a timestamp, and notifies the affected user of the outcome (without revealing the reporter identity or internal notes). **(AUDIT)**
6. If the tenant has a School Admin, the system notifies the School Admin of any moderation actions taken on students within their school. **(AUDIT)**

**Alternate Flows:**

- **A-007.1 — School Admin moderates within tenant:** A School Admin may access a tenant-scoped moderation queue and apply Clear, Edit/Redact, or Remove dispositions for their own tenant's content. Actions that rise to Suspend or Escalate are forwarded to the Super Admin / Platform Moderator and flagged for cross-tenant review.

**Exception Flows:**

- **E-007.1 — Safeguarding escalation:** At step 3, if the moderator selects **Escalate (Safeguarding)**, the system immediately: preserves the content in a locked evidence store, notifies the Super Admin, generates a safeguarding incident report, and (per the school's configured policy) may send an email notification to the School Admin and the associated school's safeguarding lead. A mandatory follow-up timer is set; if not resolved within 24 hours, the system sends an escalation reminder. **(SAFETY) (AUDIT)**
- **E-007.2 — Moderator conflict of interest:** If the content involves the moderator's own school (Platform Moderator with school affiliation), the system assigns the item to a different available moderator or escalates to a Super Admin.

**Postconditions (Success):**
- The flagged content has been dispositioned and an immutable audit record exists.
- The affected user and (where applicable) the School Admin have been notified.
- If safeguarding was triggered, the incident is being tracked to resolution.

**Traces to:** UR-COMM-018 through UR-COMM-035 (moderation and reporting), UR-ADM-018 through UR-ADM-021 (global moderation console), SR-005, FR-MOD-*, DR-003.

---

## UC-008 — Student Builds and Simulates a Blink LED Project

**Actor(s):** Primary — Student

**Preconditions:**
- The Student is authenticated and their account is Active.
- The Student has navigated to RoboCode Studio (either from the dashboard or from an assigned task).
- The Student has basic familiarity with the Studio interface (or is following a guided lesson step).

**Main Success Flow:**

1. The Student selects **New Project** in RoboCode Studio. The system creates an empty project workspace with the canvas panel on the left, the code editor on the right, and the component panel on the top or side.
2. The Student opens the **Components** panel and locates the **Arduino UNO R3** board. They drag it onto the canvas. The system renders the UNO R3 using the wokwi-elements web component with all GPIO pin labels visible.
3. The Student drags a **full-size breadboard** (830 tie-points) onto the canvas and positions it below the UNO.
4. The Student drags a **red LED** component and a **220 ohm resistor** onto the breadboard. The system renders them in the correct tie-point rows.
5. The Student uses the wiring tool to connect: a jumper wire from UNO pin D13 to the resistor's anode row on the breadboard; a wire from the resistor to the LED anode; a wire from the LED cathode row to the GND rail; and a wire from the UNO GND pin to the breadboard GND rail.
6. The system validates the electrical connections in real time, highlights any open circuits or short circuits in the wiring overlay, and shows a connection status indicator. All connections are valid.
7. The Student switches to the **Code** tab. The system opens the Monaco editor pre-populated with the Arduino C/C++ skeleton (`setup()` and `loop()` functions) for the UNO. Autocomplete and syntax highlighting are active.
8. The Student writes the Blink sketch:

   ```
   void setup() {
     pinMode(13, OUTPUT);
   }
   void loop() {
     digitalWrite(13, HIGH);
     delay(1000);
     digitalWrite(13, LOW);
     delay(1000);
   }
   ```

9. The Student selects **Run Simulation**. The RoboCode Simulation Engine (RSE) compiles the sketch via the in-browser WASM toolchain (or compile microservice), loads the firmware into the avr8js ATmega328P simulator (for the Arduino UNO R3; rp2040js is used for Raspberry Pi Pico projects), and begins execution.
10. The LED component on the canvas animates: it illuminates red for one second and extinguishes for one second, repeating the blink cycle. The Serial Monitor panel shows no output (no `Serial.print` calls).
11. The Student selects **Pause** to halt the simulation. They modify the `delay` value to 500ms and select **Run** again. The LED blinks faster.
12. The Student selects **Save Project**, enters the project name "Blink LED", and the system saves the project (canvas state as JSON, code as a text file) to the database associated with the student's account.
13. If the project was opened from an assigned task, the Student selects **Submit for Grading**. The system creates a submission record linked to the task and notifies the Teacher. (See UC-011.)

**Alternate Flows:**

- **A-008.1 — Student uses 3D view:** At any step, the Student may toggle the canvas to 3D view. The system renders the UNO, breadboard, LED, and wires in Three.js / React Three Fiber. Simulation behaviour is identical.
- **A-008.2 — Student uses Block-Based mode (primary school):** For younger students (primary-school sub-class or block mode enabled by Teacher), the code editor presents a block-based interface. The student drags a `set pin 13 to OUTPUT` block and a `blink pin 13 every 1 second` block. The system transpiles the blocks to Arduino C/C++ and executes identically from step 9.
- **A-008.3 — Low-end device fallback:** If the browser does not support WebGL2, the system detects this and serves the 2D wokwi-elements canvas only. A notice informs the student that 3D view is unavailable.
- **A-008.4 — Student uses Raspberry Pi Pico board:** Instead of the Arduino UNO R3, the Student selects the **Raspberry Pi Pico (RP2040)** from the Components panel (sourced from the built-in wokwi-boards library). The blink sketch is written in MicroPython, CircuitPython, or C/C++ (Arduino-Pico core). The RSE loads the compiled UF2/ELF firmware image into the rp2040js simulator; the LED connected to a GPIO pin (e.g. GP15) blinks identically. The pin wiring and code differ from the UNO example but all simulation steps (steps 9–13) proceed in the same manner.

**Exception Flows:**

- **E-008.1 — Compilation error:** At step 9, if the code contains a syntax error, the RSE returns the compiler error output. The Monaco editor underlines the offending line(s) and the error is displayed in an error panel below the editor. The simulation does not start. The student corrects the code and retries.
- **E-008.2 — Open circuit detected:** At step 6, if the LED is wired without a resistor (short/overload path), the system highlights the connection in red and displays a circuit warning: "LED may be damaged without a current-limiting resistor." The simulation may still run but the LED component shows a visual "burnt" state and a warning badge.
- **E-008.3 — Project save fails:** If the network drops briefly at step 12, the system buffers the in-progress save in the active browser session (short-lived transient buffer) and displays a "Save pending — reconnecting" notice, retrying automatically when connectivity returns. This is transient in-session resilience only; persistent offline operation/PWA is out of scope for v1.0 (Section 1; UR-NFR-A003). If connectivity is not restored within the session, the user is warned before unload.

**Postconditions (Success):**
- The project is saved to the student's account.
- The LED blinks in the simulator as coded.
- If submitted for grading, a submission record exists and the Teacher is notified.

**Traces to:** UR-STU-001, UR-STU-005, UR-SIM-001 through UR-SIM-015, UR-CODE-001, UR-CODE-005, FR-SIM-010, FR-CODE-020.

---

## UC-009 — Student Builds an Ultrasonic Obstacle-Avoiding Robot

**Actor(s):** Primary — Student (typically high-school)

**Preconditions:**
- The Student is authenticated, account Active, and has intermediate RoboCode Studio experience.
- A task "Build an Obstacle-Avoiding Robot" has been assigned by the Teacher (see UC-010), or the Student is creating a free project.

**Main Success Flow:**

1. The Student creates a new project in RoboCode Studio and drags an **Arduino UNO R3** onto the canvas.
2. The Student adds the following components from the catalogue and places them on the canvas: full-size breadboard, **HC-SR04 ultrasonic distance sensor**, **L298N dual H-bridge motor driver module**, two **DC motors**, one **active buzzer**.
3. The Student wires the circuit:
   - HC-SR04 VCC → 5V; GND → GND; TRIG → D9; ECHO → D10.
   - L298N: ENA → D5 (PWM), IN1 → D6, IN2 → D7, ENB → D4 (PWM), IN3 → D2, IN4 → D3; Motor-A and Motor-B terminals to respective DC motors.
   - Active buzzer: positive → D11, negative → GND.
   - L298N 12V input → UNO Vin (or external supply); GND → common GND.
4. The system validates all pin assignments and electrical connections and confirms no conflicts.
5. The Student opens the Code tab and writes the obstacle-avoidance sketch in Arduino C/C++, using `#include <NewPing.h>` for the HC-SR04. The sketch reads distance, stops and sounds the buzzer if an obstacle is detected within 20 cm, otherwise drives the motors forward.
6. The Student selects **Run Simulation**. The RSE compiles the firmware and loads it into the avr8js simulator.
7. The simulation canvas displays the robot circuit. The Student uses the **Sensor Control Panel** to simulate HC-SR04 distance readings by dragging a virtual obstacle slider.
8. When the slider is moved to 15 cm (within 20 cm threshold): the motor outputs go LOW (motors stop in simulation), the buzzer component activates (WebAudio tone plays through the browser speaker), and the Serial Monitor shows "Obstacle detected at 15 cm — stopping".
9. When the slider is moved to 50 cm: motors resume, buzzer deactivates, Serial Monitor shows "Path clear — moving forward".
10. The Student saves the project and, if task-assigned, submits for grading.

**Alternate Flows:**

- **A-009.1 — ESP32 variant:** The Student replaces the UNO with an **ESP32 DevKit** board. The pin assignments change. MicroPython is selected as the language. The RSE switches to the ESP32 core simulation. The NewPing library is replaced by MicroPython equivalent code using machine.Pin and direct timing.
- **A-009.2 — Raspberry Pi Pico variant:** The Student replaces the UNO with a **Raspberry Pi Pico (RP2040)** board (from the wokwi-boards built-in library). The HC-SR04 TRIG/ECHO lines are rewired to two GP pins (e.g. GP9/GP10); the L298N motor control signals go to additional GP pins. The code is written in MicroPython or C/C++ (Arduino-Pico core). The RSE loads the compiled UF2/ELF firmware into the rp2040js simulator; sensor and motor simulation proceed identically to the UNO path.
- **A-009.3 — Wiring error assistance:** If the Student wires ECHO to a non-interrupt-capable pin and the system detects a known incompatibility, it displays a contextual hint: "HC-SR04 ECHO typically connected to a digital input pin. Consider D10 or D2."

**Exception Flows:**

- **E-009.1 — Library not found:** At step 5, if `NewPing.h` is not in the approved library catalogue, the compiler returns an error. The code editor's autocomplete suggests the correct import path from the platform's supported library list. The student selects the correct library and the code compiles.
- **E-009.2 — Pin conflict:** If the Student assigns two components to the same pin, the system highlights both conflicting assignments in the wiring overlay and displays a conflict warning before simulation is attempted.

**Postconditions (Success):**
- The obstacle-avoidance circuit is wired and simulated correctly.
- The simulation responds accurately to virtual sensor inputs.
- Project saved; submission sent to Teacher if task-assigned.

**Traces to:** UR-STU-010, UR-SIM-020 through UR-SIM-030, UR-CODE-010, FR-SIM-020, FR-CODE-030.

---

## UC-010 — Teacher Creates and Assigns a Coding Task

**Actor(s):** Primary — Teacher; Secondary — Students (recipients)

**Preconditions:**
- The Teacher is authenticated with the `Teacher` role scoped to their tenant.
- At least one class exists with enrolled, Active students.
- The Teacher has navigated to **My Classes → [Class Name] → Assignments**.

**Main Success Flow:**

1. The Teacher selects **Create Assignment**. The system presents the assignment authoring form.
2. The Teacher enters: assignment title, description (rich text with code snippets and image attachments), learning objectives (selectable from the curriculum tag taxonomy), target grade level, estimated duration (minutes), and due date/time.
3. The Teacher selects the starter project type: **Blank Project**, **Template** (from the global or school content library), or **Fork of an existing project**. The system attaches the selected starter to the assignment.
4. The Teacher configures grading criteria using the rubric builder: adds rubric rows (e.g. "Circuit correctly wired — 30 pts", "Code compiles without errors — 20 pts", "Simulation behaves as specified — 50 pts"), and sets the total point value.
5. The Teacher configures the RoboPoints reward for successful completion (e.g. 150 RoboPoints for full marks). **(GAM)**
6. The Teacher assigns the task to one or more classes. The system displays a student count preview.
7. The Teacher selects **Publish**. The system creates the assignment record, associates it with the selected classes, and sends an in-platform notification and email to each enrolled Student. **(AUDIT)**
8. The assignment appears in each Student's **My Tasks** dashboard with the due date, description, starter project link, and RoboPoints potential.

**Alternate Flows:**

- **A-010.1 — Teacher saves as draft:** At step 7, the Teacher selects **Save as Draft**. The assignment is not visible to students. The Teacher may continue editing and publish later.
- **A-010.2 — Teacher schedules a future publish time:** The Teacher sets a **Publish At** date/time. The system publishes the assignment automatically at the scheduled time.
- **A-010.3 — Teacher imports from global content library:** At step 3, the Teacher selects a task template authored by the RoboCode.Africa content team from the global library, customises the description and rubric, and publishes.

**Exception Flows:**

- **E-010.1 — No enrolled students:** If the selected class has zero enrolled Active students, the system warns the Teacher and prevents publishing until at least one student is enrolled.
- **E-010.2 — RoboPoints value exceeds school policy maximum:** If the School Admin has set a per-task RoboPoints cap and the Teacher's value exceeds it, the system displays a validation error and shows the allowable maximum.

**Postconditions (Success):**
- The assignment is visible in each enrolled Student's task list.
- Students receive notification of the new task.
- An audit log records the assignment creation and publication.

**Traces to:** UR-LRN-001 through UR-LRN-015, UR-GAM-010, FR-LRN-010, FR-GAM-005.

---

## UC-011 — Teacher Reviews and Grades a Student Submission

**Actor(s):** Primary — Teacher; Secondary — Student

**Preconditions:**
- An assignment exists and has been published (UC-010).
- At least one Student has submitted their project for grading (UC-008, step 13).
- The Teacher is authenticated and navigates to **My Classes → [Class] → Assignments → [Assignment] → Submissions**.

**Main Success Flow:**

1. The Teacher opens the Submissions panel. The system lists all student submissions, showing: student display name, submission timestamp, submission status (Submitted / Late / Draft), and current grade (blank for ungraded).
2. The Teacher selects a student submission. The system opens the submission view, which displays: a read-only (teacher-view) copy of the student's RoboCode Studio project (canvas + code), the submission timestamp, and the assignment rubric.
3. The Teacher launches the simulation in review mode. The RSE runs the student's saved firmware/code in the simulator, allowing the Teacher to interact with sensor controls and verify behaviour.
4. The Teacher scores each rubric row by clicking a point value or entering a score. The system running total updates in real time.
5. The Teacher adds inline code annotations: highlights specific lines in the Monaco editor and attaches comments (e.g. "Good use of PWM for speed control" or "Missing `delay()` in loop — motor will spin at full speed without control").
6. The Teacher enters overall written feedback in the Summary Feedback text area.
7. The Teacher selects **Submit Grade**. The system saves the grade record, marks the submission as **Graded**, and sends the Student an in-platform notification and email: "Your submission for [Assignment] has been graded." **(AUDIT)**
8. The Student can view their grade, rubric scores, inline annotations, and overall feedback in their **My Tasks → [Assignment] → My Submission** view. **(MINOR)** — Grade data is not shared with other students.

**Alternate Flows:**

- **A-011.1 — Teacher returns submission for revision:** Instead of submitting a grade, the Teacher selects **Return for Revision**, adds mandatory feedback notes, and the Student's submission status reverts to **Revision Required**. The Student may resubmit once before the due date.
- **A-011.2 — Auto-grading of objective criteria:** If the assignment has auto-gradeable criteria (e.g. "Code must compile without errors"), the system automatically scores those rubric rows on submission and pre-fills the Teacher's rubric. The Teacher reviews and may override the auto-grade.

**Exception Flows:**

- **E-011.1 — Student project fails to load in review mode:** If the saved project JSON is corrupted or a required component model is missing, the system displays an error and offers the Teacher a raw JSON view of the project file. The Teacher may still enter manual grades and feedback.
- **E-011.2 — Late submission:** If the submission timestamp is after the due date, the system displays a **LATE** badge on the submission. The Teacher may apply a late penalty per the rubric or override and accept the submission at full marks.

**Postconditions (Success):**
- The submission is graded and the grade record is stored.
- The Student receives their grade and feedback.
- If RoboPoints were configured, the system awards them to the Student (see UC-013).
- An audit log records the grading event.

**Traces to:** UR-LRN-020 through UR-LRN-030, UR-GAM-015, FR-LRN-020, FR-GAM-010.

---

## UC-012 — Team Forms and Enters a Competition

**Actor(s):** Primary — Teacher; Secondary — Students, School Admin, Super Admin

**Preconditions:**
- A competition has been created (by Super Admin for platform-wide, or School Admin for school-internal).
- The school has been enrolled in the competition by the School Admin.
- The Teacher has been authorised by the School Admin to form teams for this competition.

**Main Success Flow:**

1. The Teacher navigates to **Competitions → [Competition Name] → Teams** and selects **Create Team**.
2. The Teacher enters a team name, selects up to 4 students from their enrolled classes, and assigns themselves as Team Mentor. The system validates that all selected students are Active and enrolled in the current tenant. **(AUDIT)**
3. Each selected Student receives an in-platform notification: "You have been added to team [Team Name] for [Competition]. Accept or Decline?"
4. Each Student logs in, views the team invitation, and selects **Accept**. On acceptance, the Student's team membership is confirmed.
5. The Teacher creates a Collaborative Project for the team in RoboCode Studio. The system creates a shared Yjs CRDT document and provisions a real-time collaborative workspace. **(AUDIT)**
6. Team members work collaboratively on the project (see UC-014). The Teacher monitors progress via the read-only mentor view.
7. When the project meets the team's quality criteria, the Teacher marks the submission as **Eligible for Competition Entry** in the team project dashboard.
8. One designated team member (or the Teacher) opens the competition submission form, attaches the team project, enters a project title, description (max 300 words), and a short video/screenshot (optional), and selects **Submit to Competition**. **(AUDIT)**
9. The system records the competition submission, timestamps it, confirms it is within the competition deadline, and sends a confirmation notification to all team members and the Teacher.
10. After the competition judging period, the results are published. Students and Teachers receive a notification. The competition leaderboard is updated.

**Alternate Flows:**

- **A-012.1 — Student-initiated team (Teacher-sanctioned):** A Teacher enables student-led team formation for a specific competition. A Student selects **Form a Team**, invites peers from the same class, and the system creates the team pending Teacher confirmation. The Teacher must confirm before the team is official.
- **A-012.2 — Competition extends the deadline:** The Super Admin or School Admin extends the competition deadline. The system notifies all enrolled teams and updates the submission portal's displayed deadline.

**Exception Flows:**

- **E-012.1 — Student declines team invitation:** At step 4, a Student declines. The system notifies the Teacher, who may invite a replacement student or proceed with a smaller team (if the competition rules allow).
- **E-012.2 — Submission after deadline:** At step 8, if the submission timestamp is past the competition closing time, the system rejects the submission, notifies the team and Teacher with the closure message, and does not create a competition entry.
- **E-012.3 — Team project contains flagged content:** Before competition submission is confirmed, the system runs the profanity/PII filter on the project title and description. If flagged, the submission is held in **Pending Moderation** status. **(SAFETY) (AUDIT)**

**Postconditions (Success):**
- The team's project is recorded as a competition entry before the deadline.
- All team members and the Teacher are notified.
- On competition close, results are published and RoboPoints are awarded (if configured).

**Traces to:** UR-TEAM-001 through UR-TEAM-020, UR-GAM-020, FR-TEAM-010, FR-GAM-015.

---

## UC-013 — Student Earns RoboPoints and Rises on the Leaderboard

**Actor(s):** Primary — Student; Secondary — Platform (automated gamification engine), Teacher

**Preconditions:**
- The Student is Active and enrolled in at least one class.
- One or more RoboPoints-earning events have occurred (task submission, graded assignment, first simulation run, badge unlocked, competition result).

**Main Success Flow:**

1. A qualifying event occurs — for example, the Teacher submits a grade for the student's assignment and the assignment awards 150 RoboPoints on completion (as configured in UC-010, step 5).
2. The gamification engine computes the RoboPoints award: base points (150) plus any multipliers (e.g. ×1.2 if submitted before the due date, ×1.5 if first attempt earns full marks). The computed award is logged.
3. The system credits the RoboPoints to the Student's account balance and appends a timestamped entry to the Student's RoboPoints history ledger. **(AUDIT)**
4. The system evaluates badge rules. If the credit pushes the Student's total past a badge threshold (e.g. "Circuit Champion — first simulation run graded ≥ 80%"), the badge is unlocked and the Student receives an in-platform toast notification: "Badge unlocked: Circuit Champion!"
5. The system recalculates the Student's rank on three leaderboards: class, school, and (if not opted out) platform-wide.
6. The Student's rank has improved. The system sends a rank-up notification if the Student enters the top 10 of their class or school leaderboard: "You've climbed to 4th in your class!"
7. The Student navigates to **My Profile → RoboPoints** and views: total balance, rank, badge collection, and a full transaction history showing each earning event, the source (graded by Teacher, first-time simulation, competition bonus, etc.), and the timestamp.
8. The Student optionally views the **Class Leaderboard** and the **School Leaderboard**. For minors, the platform-wide leaderboard displays an anonymised handle unless the parent has enabled full public visibility (per UR-ONB-093).

**Alternate Flows:**

- **A-013.1 — Teacher awards bonus RoboPoints manually:** A Teacher navigates to a student's profile within their class and selects **Award Bonus RoboPoints**, enters a value and a mandatory reason (e.g. "Outstanding project presentation"). The system credits the points and logs the manual award, including the Teacher's identity. **(AUDIT)**
- **A-013.2 — Student opts out of public leaderboard:** The Student (or their Parent for a minor) navigates to **Account Settings → Privacy → Leaderboard Visibility** and sets visibility to **Class Only**. The system immediately removes the student from the platform-wide and school leaderboards without removing their RoboPoints balance or badges.

**Exception Flows:**

- **E-013.1 — Duplicate point award:** If a grading event is re-submitted due to a system error, the gamification engine checks the event ID for idempotency and does not double-credit RoboPoints. The duplicate event is logged as a no-op. **(AUDIT)**
- **E-013.2 — RoboPoints deduction (misconduct):** A Super Admin may deduct RoboPoints from a student's account (e.g. as a consequence of a safeguarding violation finding). Deductions are only performable by Super Admins, are always explained with a mandatory reason, and are logged immutably. **(AUDIT)**

**Postconditions (Success):**
- The Student's RoboPoints balance is updated.
- Applicable badges are unlocked.
- Leaderboard rankings are refreshed in real time (or within 60 seconds for Redis-cached leaderboards).
- An audit record exists for every credit and debit event.

**Traces to:** UR-GAM-001 through UR-GAM-030, FR-GAM-020, DR-004.

---

## UC-014 — Student Collaborates in Real Time on a Team Project

**Actor(s):** Primary — Student (multiple team members); Secondary — Teacher (mentor observer)

**Preconditions:**
- A team has been formed (UC-012).
- The Teacher has created a collaborative project for the team (UC-012, step 5).
- Team members are authenticated and have accepted their team invitations.

**Main Success Flow:**

1. Student A opens the team project from **My Teams → [Team Name] → Project**. The system loads the shared RoboCode Studio workspace backed by a Yjs CRDT document.
2. Student B and Student C open the same project link. The system establishes WebSocket connections (Socket.IO) for each member and merges them into the shared session.
3. The system displays online presence indicators for each active team member: coloured cursors on the canvas and coloured highlights in the code editor showing each member's cursor position.
4. Student A drags an ESP32 board onto the canvas. The change is immediately propagated via Yjs to Students B and C, who see the component appear on their canvases in real time.
5. Student B edits the code in the Monaco editor. Keystrokes are synchronised character-by-character via the Yjs text binding. Students A and C see Student B's cursor and the text appearing in real time.
6. Student C adds a component property conflict — moves the same component that Student A is configuring. The CRDT resolves the conflict automatically using last-write-wins for property values and notifies both students with a brief conflict-resolution banner.
7. The Teacher opens the project in **Read-Only Mentor View**. The Teacher can observe all changes in real time without blocking any student action. The Teacher may add mentor comments (pinned annotations on the canvas or in the code editor margin) that are visible to all team members. **(AUDIT)**
8. A team member selects **Save Snapshot** to create a named checkpoint of the project state. Snapshots allow the team to revert to a prior state if needed. **(AUDIT)**
9. The team runs the simulation collaboratively: one student controls the Sensor Control Panel (adjusting virtual sensor inputs) while others observe the circuit behaviour on their own canvases.

**Alternate Flows:**

- **A-014.1 — Member with a brief network drop rejoins:** If Student C experiences a short connectivity drop within an active session, edits made during the gap are held in the in-session Yjs buffer and synced to the shared Yjs document on reconnection. Conflicts are resolved by the CRDT. The other team members see a "Student C reconnected" presence update. (This covers transient drops only; persistent offline editing is out of scope for v1.0 per Section 1 and UR-NFR-A003.)
- **A-014.2 — Teacher takes control for demonstration:** The Teacher temporarily switches from Read-Only to **Demo Mode** (if explicitly enabled by the School Admin for this competition/class), makes a demonstration change on the canvas, narrates it via a text annotation, and returns to Read-Only. Demo Mode usage is audit-logged. **(AUDIT)**

**Exception Flows:**

- **E-014.1 — Session conflict: too many concurrent editors:** If more than the supported maximum of concurrent editors (initial v1.0 cap: 10 per project) attempt to connect, the system queues additional connections and notifies the queued user: "Waiting for a slot — please wait a moment."
- **E-014.2 — CRDT sync failure:** If the Yjs document state becomes desynchronised between clients (e.g. an extended connectivity gap with complex edits), the system detects the divergence, prompts the affected client to reload, and merges the in-session buffer on reconnection.

**Postconditions (Success):**
- All team members see a consistent shared project state.
- The project history (snapshots and Yjs operation log) is stored for audit and revert.
- The Teacher's annotations are visible to the team.

**Traces to:** UR-TEAM-010, UR-TEAM-015, UR-STU-020, FR-TEAM-020, FR-COMM-010.

---

## UC-015 — Teacher Authors a Block-Based Lesson for Primary Students

**Actor(s):** Primary — Teacher; Secondary — Primary-School Students

**Preconditions:**
- The Teacher is authenticated and is assigned to a class with primary-school students enrolled.
- The school tenant has the block-based coding mode enabled (default On for primary-school classes).

**Main Success Flow:**

1. The Teacher navigates to **Content Library → Create Lesson** and selects **Block-Based Mode** as the coding interface for this lesson.
2. The Teacher authors the lesson: title, learning objective (e.g. "Make an LED blink using block commands"), step-by-step written instructions with annotated screenshots, and a starter project with the chosen board (typically the Arduino UNO, but the Teacher may select the ESP32 DevKit or Raspberry Pi Pico from the wokwi-boards library) and an LED pre-wired.
3. The Teacher opens the starter project in the authoring preview. The block editor displays categorised block drawers: **Control**, **Digital I/O**, **Timing**, **Variables**, and **Sensors** (contextual to the components on the canvas).
4. The Teacher drags a **Set pin [13] to [OUTPUT]** block into the `setup` area and a **Blink pin [13] every [1] seconds** block into the `loop` area, demonstrating the intended solution.
5. The Teacher locks certain blocks as **Required** (the student must use them) and marks the LED pin as a **Constrained Variable** (student can change the pin number within an allowed range defined by the Teacher).
6. The Teacher sets the lesson's assessment criteria: "Simulation must run for 10 seconds without error; LED must blink at 1 Hz (±0.1 Hz)." The system stores these as auto-gradeable criteria.
7. The Teacher publishes the lesson to the class. Students see it in their **My Lessons** feed.
8. A primary-school Student opens the lesson. The RoboCode Studio interface loads in Block Mode: the block drawer is visible; the text code editor is hidden (or shown as read-only transpiled output below, for transparency). The pre-wired circuit is on the canvas.
9. The Student drags blocks, connects them, and selects **Run**. The RSE transpiles the blocks to the appropriate language for the board (Arduino C/C++ for UNO, MicroPython for Pico or ESP32) and compiles/executes them on the corresponding simulator (avr8js for the UNO, rp2040js for the Raspberry Pi Pico). The LED blinks as expected.
10. The Student selects **Submit**. The auto-grader checks the blink frequency criterion and awards the configured RoboPoints if met.

**Alternate Flows:**

- **A-015.1 — Student switches to text mode:** A Student (or Teacher, for older primary students) may toggle from Block Mode to Text Mode mid-lesson to see the generated C++ code. The system transpiles the current blocks and opens the Monaco editor. Changes made in Text Mode update the block representation bidirectionally.

**Exception Flows:**

- **E-015.1 — Block configuration yields invalid code:** If the student's block arrangement produces a logical error (e.g. infinite `delay` blocking the loop), the simulation freezes. The system detects a simulation timeout (no pin state change for 10 s) and displays a "Simulation may be stuck — check your loop for long delays" hint block, highlighting the likely problematic block.

**Postconditions (Success):**
- Primary-school students have completed a guided block-based coding exercise.
- Auto-graded results are recorded and RoboPoints awarded.

**Traces to:** UR-CODE-030, UR-LRN-010, UR-GAM-010, FR-CODE-030.

---

## UC-016 — School Admin Monitors School-Level Reports and Compliance

**Actor(s):** Primary — School Admin

**Preconditions:**
- The School Admin is authenticated and their tenant is Active with enrolled students and teachers.
- At least one reporting period (e.g. one week) of student activity has occurred.

**Main Success Flow:**

1. The School Admin navigates to **School Dashboard → Reports**.
2. The system presents a summary dashboard showing: total active students, active teachers, total projects created, total simulation runs, tasks published, average task completion rate, and total RoboPoints awarded in the current period.
3. The School Admin selects **Student Progress Report** for a date range. The system generates a table: student display name, grade/class, tasks assigned, tasks completed, tasks graded, average grade, RoboPoints balance, and last active date.
4. The School Admin selects a specific student and drills into their individual progress view: task-by-task breakdown, grade history, project list, simulation run count, badge collection, and consent record status. **(MINOR)**
5. The School Admin navigates to **Reports → Safeguarding and Moderation**. The system shows: open moderation flags (for this tenant), resolved flags in the period, safeguarding escalations (if any), and student consent records with expiry warnings for those approaching annual re-consent requirements. **(SAFETY) (AUDIT)**
6. The School Admin selects **Export** on any report. The system generates a CSV or PDF and emails a download link to the School Admin's registered address. All exported reports are logged. **(AUDIT)**
7. The School Admin reviews the **Seat Usage** panel: seats used vs. licenced, seat renewal date, and a projection of seat consumption if enrolment continues at the current rate. The School Admin may initiate a seat upgrade from this view.
8. The School Admin navigates to **Reports → Audit Log** and views the tenant-scoped audit log: a chronological list of all administrative actions within the school (teacher creations, student approvals, assignment publications, moderation actions, branding changes), searchable by actor, action type, and date. **(AUDIT)**

**Alternate Flows:**

- **A-016.1 — Teacher-level report delegation:** The School Admin selects **Delegate Report Access** to share a read-only view of the class progress report with specific Teachers (they see only their own classes).

**Exception Flows:**

- **E-016.1 — Report generation timeout:** If the date range is very large (e.g. full academic year), report generation may exceed 30 seconds. The system runs the generation asynchronously, notifies the School Admin by email when ready, and provides a secure download link valid for 48 hours.
- **E-016.2 — Data export blocked pending data-protection review:** If the Super Admin has placed a compliance hold on the tenant (e.g. during a safeguarding investigation), the export function is disabled and the School Admin sees a notice to contact the platform administrator.

**Postconditions (Success):**
- The School Admin has reviewed school-level progress and safeguarding status.
- Any exported reports are logged in the audit trail.

**Traces to:** UR-ADM-036 through UR-ADM-039 (global reports), UR-COMM-055, FR-ADM-010, DR-005.

---

## Cross-References

The use cases in this section are elaborated into atomic user stories in **Section 18 (User Stories and Acceptance Criteria)** and placed in context in **Section 19 (User Journey Maps)**. The detailed functional behaviour required to implement each use case is specified in the System Specification Document, in the modules referenced by each `Traces to` line above.

The following sections provide the requirements that constrain the flows described here:

| Cross-Reference | Applies To |
|----------------|------------|
| Section 6 — User Requirements: Onboarding, Signup and Approval | UC-004, UC-005, UC-006 |
| Section 7 — User Requirements: Authentication and Account Management | UC-001, UC-002, UC-006 |
| Section 8 — User Requirements: School Onboarding, Custom Domain and White-Labelling | UC-001, UC-002, UC-003 |
| Section 9 — User Requirements: RoboCode Studio Canvas, Components and Wiring | UC-008, UC-009, UC-014, UC-015 |
| Section 10 — User Requirements: Simulation Experience | UC-008, UC-009 |
| Section 11 — User Requirements: Code Editor and Programming | UC-008, UC-009, UC-015 |
| Section 12 — User Requirements: Learning, Courses, Tasks and Assessment | UC-010, UC-011, UC-015 |
| Section 13 — User Requirements: Teams, Competitions and Collaboration | UC-012, UC-014 |
| Section 14 — User Requirements: Gamification, RoboPoints and Leaderboards | UC-013 |
| Section 15 — User Requirements: Communication, Notifications and Safety | UC-005, UC-007 |
| Section 16 — User Requirements: Administration and Reporting | UC-016 |
