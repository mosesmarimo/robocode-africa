# Mobile Parity — Phase 2: Learner Gaps — Design

Date: 2026-06-22
Repo: `robocode-mobile` (own git repo). Builds on Phase 1 (merged to `main`).

## Context

Phase 2 closes the remaining **learner-facing** gaps vs the web app. Recon found most learner
features already at parity (public profile, notifications, badges). The genuine gaps are three:

1. **Project Detail + social wall** — web `/app/projects/[id]` exists; mobile has NO project
   detail screen (tapping a project jumps straight into the Studio).
2. **Top Projects** — web `/app/top-projects` (AI-ranked); mobile has no such screen.
3. **AI-model settings** — web settings lets a user/school set AI provider/model/baseUrl/apiKey;
   mobile settings has only displayName/avatar/locale/password.

Public profile, notifications, badges are at parity → out of scope (YAGNI). One tiny optional
profile tweak ("Following" count) is deferred unless trivially free.

## Backend endpoints (existing — no backend change)

- `GET /projects/{id}` → `{ project: { id, title, boardType, kind?, description, thumbnail, ownerId } }`
- `GET /social/posts/wall/project/{id}?cursor=` → `Wall { posts[], nextCursor, canPost, following }`
- `GET /social/follows/project/{id}/follow-preview` → `{ followerCount, friendFollowerCount, friendFollowers: UserCard[] }`
- `POST /social/follows` / `POST /social/follows/unfollow` (target `project`).
- `GET /projects/top` → `{ projects: [{ id, title, description, kind, boardType, aiScore, aiScoreData{usefulness,innovation,originality,complexity,overall,summary}|null, owner{id,displayName,avatarSeed} }] }`
- `GET /ai/config` → `{ scope, schoolName, canEdit, config{provider,baseUrl,model,hasKey}, effective{provider,model,baseUrl}, defaultModel }`
- `PUT /ai/config` body `{ provider?, baseUrl?, model?, apiKey?, clearKey? }`.

## Current mobile state (recon)

- `lib/screens/projects_screen.dart` — lists `GET /projects`; tapping a project →
  `context.push('/studio/{id}')`. New project → POST then push studio.
- `lib/api/social_api.dart` — `SocialApi.instance` with `wall(targetType,targetId,{cursor})`,
  follow/unfollow, follow-preview, etc. `lib/models/social.dart` has `Wall`, `Post`, `UserCard`,
  `FollowPreview`.
- `lib/widgets/social_widgets.dart` — reusable `PostCard`, `PostComposer`, `CommentSheet`/
  `showCommentSheet`, `FollowPreviewRow`.
- `lib/widgets/common.dart` — `AsyncView`, `BrandHeader`, `EmptyState`, `MiniChip`, `StatTile`,
  `SeedAvatar`, `SectionTitle`, `relativeTime`.
- `lib/screens/settings_screen.dart` — displayName/locale/avatar + read-only email/role/school.
- `lib/api/api_client.dart` — `get/post/put/patch/delete<T>(path,{query|body})`, throws `ApiException`.
- `lib/router.dart` — `/projects` is a shell tab; full-screen routes added to the top-level list.

## Architecture

### 1. Project detail (`lib/screens/projects/project_detail_screen.dart` + route)

- New route `/projects/:id` (top-level, full-screen). `projects_screen.dart` tap changes from
  `/studio/{id}` → `/projects/{id}`.
- Screen fetches `GET /projects/{id}` (project header: title, kind/board badge, description),
  `GET /social/follows/project/{id}/follow-preview` (FollowPreviewRow), and the project wall via
  the existing `SocialApi.wall('project', id)` with cursor "Load more".
- Header actions: **Open in Studio** button → `context.push('/studio/{id}')`; **Follow/Following**
  toggle → `SocialApi.follow/unfollow` (target `project`). Reuse `PostComposer` (when `canPost`)
  and `PostCard` for the wall, exactly like the existing social wall screens.
- Add `ProjectApi` (`lib/api/project_api.dart`) with `detail(id)`, `top()` and a small
  `ProjectDetail` / `ProjectSummary` model in `lib/models/project.dart` (defensive `fromJson`,
  matching the app's style). The project-follow-preview reuses `SocialApi`'s existing method.

### 2. Top Projects (`lib/screens/projects/top_projects_screen.dart` + route)

- New route `/projects/top` (full-screen). Entry point: a "Top Projects" action in the Projects
  tab header (and/or a Community hub tile — primary is the Projects tab header to match the web's
  Projects-area placement).
- Fetches `ProjectApi.top()` → ranked list. Each card: rank (1/2/3 medal colors via `RoboTheme`),
  kind icon, title, owner (`SeedAvatar` + name → tap opens `/social/users/{ownerId}`), the AI
  score (overall) and a compact 4-dim breakdown (usefulness/innovation/originality/complexity),
  and an Open-in-Studio affordance → `/studio/{id}`.

### 3. AI-model settings (expand `lib/screens/settings_screen.dart`)

- On load, also fetch `GET /ai/config`. Add an "AI model" section:
  - Provider dropdown (`deepseek | openai | custom`), Model text field (hint = `defaultModel`),
    Base URL field (shown only when provider == `custom`), API key field (obscured; hint
    "saved — leave blank to keep" when `config.hasKey`).
  - **Save** → `PUT /ai/config { provider, model, baseUrl?, apiKey? (omit if blank) }`.
    **Use platform default** → `PUT /ai/config { clearKey: true }`.
  - If `canEdit == false` (school-managed): render the section read-only showing the `effective`
    provider/model with a lock note ("Managed by {schoolName}").

## Testing (flutter test)

- Unit: `ProjectDetail.fromJson` / `ProjectSummary.fromJson` / top-list parse — defensive,
  never throws on missing fields; `aiScoreData` null tolerated.
- Widget smoke: `TopProjectsScreen` renders a ranked list from injected data without throwing;
  `ProjectDetailScreen` header renders title + Open-in-Studio button. (Network calls are stubbed
  or the widgets accept injected data where practical; otherwise assert structure with a fake
  future via the existing `AsyncView` pattern — keep tests hermetic, no real HTTP.)
- `flutter analyze` clean for all touched files; full suite green.

## Out of scope (Phase 2)

- Public profile / notifications / badges rework (already at parity).
- Project collaborators, project sharing UI (web has share; defer — not a learner-blocker here).
- Native Studio (Phase 6).

## Risks / notes

- Route ordering: add `/projects/:id` and `/projects/top` to the TOP-LEVEL route list (not the
  `/projects` shell branch) so they open full-screen without disturbing tab state. `/projects/top`
  must be registered so it doesn't get captured by `/projects/:id` (`top` as an id) — register the
  literal `/projects/top` BEFORE `/projects/:id`, or guard in the `:id` builder.
- AI key field: never display the stored key (backend returns only `hasKey`); blank submit keeps
  the existing key. Mirror the web semantics exactly.
- Reuse existing social widgets/models rather than re-implementing wall/post UI.
