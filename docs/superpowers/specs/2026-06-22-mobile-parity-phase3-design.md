# Mobile Parity — Phase 3: Teacher Tooling — Design + Plan

Date: 2026-06-22. Repo: `robocode-mobile`. Builds on Phases 1–2 (on `main`).
Implemented by the controller (subagent orchestration is 529-overloaded); verified with
`flutter analyze` + `flutter test` + controller self-review.

## Goal

Add teacher tooling to mobile — classes, assignments, grading — reached through a role-gated
"Teaching" entry, matching the web teacher area.

## Contracts (existing backend; no backend change)

- `GET /teacher/classes` → `{ classes:[{id,name,joinCode,_count:{members}}], totalStudents, totalAssignments }`
- `POST /teacher/classes` body `{ name }`
- `GET /teacher/classes/:id` → `{ cls:{id,name,joinCode,members:[{user:{id,displayName,email}}],assignments:[{id,title,dueAt}]}, tasks:[{id,title}] }`
- `POST /teacher/classes/:classId/students` body `{ email }`
- `GET /teacher/assignments` → `{ assignments:[{id,title,classId,instructions,dueAt,task:{id,title}|null}], classes:[{id,name}], tasks:[{id,title}] }`
- `POST /teacher/assignments` body `{ classId, title, taskId?, instructions?, dueAt? }`
- `GET /teacher/grading` → `{ submissions:[{id,status,score,feedback,user:{id,displayName,email},task:{id,title,difficulty,points}}] }`
- `POST /teacher/submissions/:submissionId/grade` body `{ score (int 0–100), feedback? }`

## Approach

Map-based screens (no model classes) calling `ApiClient.instance.get/post`, matching the app's
existing CRUD screens (challenges/competitions/projects). Reuse `AsyncView`, `BrandHeader`,
`EmptyState`, `MiniChip`, `SeedAvatar`, `SectionTitle`, `relativeTime`.

**Role gating:** `AppUser.isStaff` (super_admin|moderator|school_admin|teacher). Show the
"Teaching" entry for class-managing roles: `teacher`, `school_admin`, `super_admin`.

**Files:**
- `lib/screens/teacher/teacher_hub_screen.dart` — `/teacher` hub (Classes, Assignments, Grading).
- `lib/screens/teacher/classes_screen.dart` — `/teacher/classes`: list + "New class" dialog (POST name).
- `lib/screens/teacher/class_detail_screen.dart` — `/teacher/classes/:id`: roster, add-student (email dialog), assignments list, join code.
- `lib/screens/teacher/assignments_screen.dart` — `/teacher/assignments`: list grouped by class + "New assignment" sheet (class dropdown, title, instructions, optional task, optional dueAt) → POST.
- `lib/screens/teacher/grading_screen.dart` — `/teacher/grading`: submissions list + "Grade" dialog (score 0–100, feedback) → POST.
- Modify `lib/router.dart` — five `/teacher*` top-level routes.
- Modify `lib/screens/community_screen.dart` — staff-gated "Teaching" hub card → `/teacher`.

## Verification

`flutter analyze` clean for all touched files; `flutter test` suite green (existing tests).
Manual (seeded backend, teacher login): create class, add student, create assignment, grade a
submission. No new automated tests beyond analyze/suite (these are API-backed UI screens with
little pure logic; the grade-score 0–100 clamp is the one validated input).

## Out of scope

School-admin and platform-admin tooling (Phases 4–5). Native Studio (Phase 6).
