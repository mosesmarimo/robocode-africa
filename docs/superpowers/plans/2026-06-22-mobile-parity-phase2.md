# Mobile Parity Phase 2 — Learner Gaps — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the three missing learner-facing screens/features on mobile — Project Detail (with social wall), Top Projects (AI-ranked), and AI-model settings — matching the web app.

**Architecture:** A small `ProjectApi` + `lib/models/project.dart` feed two new full-screen routes (`/projects/:id`, `/projects/top`) that reuse the existing social widgets (`PostCard`, `PostComposer`, `FollowPreviewRow`) and `SocialApi`; the existing settings screen gains an AI-config section backed by `GET`/`PUT /ai/config`.

**Tech Stack:** Flutter/Dart 3.11, Dio, go_router, Provider, `flutter_test`. Reuses Phase 1 patterns.

## Global Constraints

- **Repo:** all work in `/Users/marimo/Dev/robocode/robocode-mobile` (own git repo). Commit with `git -C /Users/marimo/Dev/robocode/robocode-mobile ...`, staging only each task's files (never `git add -A`). The executor sets the working branch (e.g. `feature/mobile-parity-phase2`); commit there.
- **Flutter binary:** `/Users/marimo/Dev/flutter/bin/flutter`. Run all commands with the repo as cwd. Verify every task with `flutter analyze <files>` (no new issues) and `flutter test` (suite green). Real TDD for pure-Dart logic (models).
- **Reuse, don't reinvent:** use `SocialApi.instance` (`wall(type,id,{cursor})`, `follow(type,id)`, `unfollow(type,id)`, `followPreview(type,id)`, `toggleLike(postId)`), models in `lib/models/social.dart` (`Wall`, `Post`, `UserCard`, `FollowPreview`), and widgets in `lib/widgets/social_widgets.dart` (`PostCard`, `PostComposer`, `FollowPreviewRow`) + `lib/widgets/common.dart` (`AsyncView`, `BrandHeader`, `EmptyState`, `MiniChip`, `StatTile`, `SeedAvatar`, `SectionTitle`). **Read the real constructors before using them.**
- **Theme:** reuse `RoboTheme` tokens (`primary` `#2563FF`, `secondary` `#16C79A`, `accent` `#FFB020`, `ink` `#0D1426`). No new hardcoded brand colors.
- **AI key safety:** never display the stored API key (backend returns only `hasKey`); a blank key field on Save keeps the existing key. Mirror web semantics.
- **Routing:** add `/projects/top` and `/projects/:id` to the TOP-LEVEL route list (`_routes` in `lib/router.dart`, alongside `/studio/:id`), NOT the `/projects` shell branch. Register literal `/projects/top` BEFORE `/projects/:id` so `top` isn't captured as an id.

---

## File Structure

- Create: `lib/models/project.dart` — `ProjectDetail`, `ProjectSummary` (+ `AiScoreData`).
- Create: `lib/api/project_api.dart` — `ProjectApi` (`detail`, `top`).
- Create: `lib/screens/projects/project_detail_screen.dart`.
- Create: `lib/screens/projects/top_projects_screen.dart`.
- Modify: `lib/router.dart` — two routes.
- Modify: `lib/screens/projects_screen.dart` — tap → detail; add "Top Projects" entry.
- Modify: `lib/screens/settings_screen.dart` — AI-config section.
- Tests: `test/project_models_test.dart`, `test/top_projects_screen_test.dart`.

---

### Task 1: Project models + ProjectApi (TDD)

**Files:**
- Create: `lib/models/project.dart`, `lib/api/project_api.dart`
- Test: `test/project_models_test.dart`

**Interfaces:**
- Produces:
  - `class ProjectDetail { String id, title, boardType; String? kind, description, thumbnail, ownerId; }` + `fromJson`.
  - `class AiScoreData { int usefulness, innovation, originality, complexity, overall; String summary; }` + `fromJson`.
  - `class ProjectSummary { String id, title; String? description, kind, boardType, ownerId, ownerName, ownerSeed; int? aiScore; AiScoreData? aiScoreData; }` + `fromJson`.
  - `class ProjectApi { static final instance; Future<ProjectDetail> detail(String id); Future<List<ProjectSummary>> top(); }`.

- [ ] **Step 1: Write the failing test**

Create `test/project_models_test.dart`:
```dart
import 'package:flutter_test/flutter_test.dart';
import 'package:robocode_mobile/models/project.dart';

void main() {
  test('ProjectDetail.fromJson reads project envelope', () {
    final p = ProjectDetail.fromJson({
      'project': {'id': 'p1', 'title': 'Robot', 'boardType': 'arduino-uno', 'kind': 'robotics', 'description': 'hi', 'ownerId': 'u1'}
    });
    expect(p.id, 'p1');
    expect(p.title, 'Robot');
    expect(p.boardType, 'arduino-uno');
    expect(p.ownerId, 'u1');
  });

  test('ProjectDetail tolerates flat shape and missing fields', () {
    final p = ProjectDetail.fromJson({'id': 'p2', 'title': 'X'});
    expect(p.id, 'p2');
    expect(p.description, isNull);
    expect(p.boardType, '');
  });

  test('ProjectSummary parses owner + aiScoreData; null aiScoreData ok', () {
    final list = ProjectSummary.listFromTop({
      'projects': [
        {'id': 'a', 'title': 'A', 'kind': 'coding', 'aiScore': 90,
         'aiScoreData': {'usefulness': 1, 'innovation': 2, 'originality': 3, 'complexity': 4, 'overall': 90, 'summary': 's'},
         'owner': {'id': 'o1', 'displayName': 'Ada', 'avatarSeed': 'seed'}},
        {'id': 'b', 'title': 'B', 'owner': {'id': 'o2', 'displayName': 'Lee'}},
      ]
    });
    expect(list.length, 2);
    expect(list[0].aiScore, 90);
    expect(list[0].aiScoreData!.usefulness, 1);
    expect(list[0].ownerName, 'Ada');
    expect(list[1].aiScoreData, isNull);
  });

  test('listFromTop tolerates malformed input', () {
    expect(ProjectSummary.listFromTop(null), isEmpty);
    expect(ProjectSummary.listFromTop({'projects': 'x'}), isEmpty);
  });
}
```

- [ ] **Step 2: Run test to verify it fails**

`cd /Users/marimo/Dev/robocode/robocode-mobile && /Users/marimo/Dev/flutter/bin/flutter test test/project_models_test.dart` → FAIL (URI not found).

- [ ] **Step 3: Implement the models**

Create `lib/models/project.dart`:
```dart
int _int(dynamic v) => v is int ? v : (v is num ? v.toInt() : int.tryParse('$v') ?? 0);
String _s(dynamic v) => v?.toString() ?? '';

class AiScoreData {
  final int usefulness, innovation, originality, complexity, overall;
  final String summary;
  const AiScoreData({required this.usefulness, required this.innovation, required this.originality, required this.complexity, required this.overall, required this.summary});
  factory AiScoreData.fromJson(Map j) => AiScoreData(
        usefulness: _int(j['usefulness']), innovation: _int(j['innovation']),
        originality: _int(j['originality']), complexity: _int(j['complexity']),
        overall: _int(j['overall']), summary: _s(j['summary']));
}

class ProjectDetail {
  final String id, title, boardType;
  final String? kind, description, thumbnail, ownerId;
  const ProjectDetail({required this.id, required this.title, required this.boardType, this.kind, this.description, this.thumbnail, this.ownerId});
  factory ProjectDetail.fromJson(Map j) {
    final p = (j['project'] is Map) ? j['project'] as Map : j;
    return ProjectDetail(
      id: _s(p['id']), title: _s(p['title']), boardType: _s(p['boardType']),
      kind: p['kind']?.toString(), description: p['description']?.toString(),
      thumbnail: p['thumbnail']?.toString(), ownerId: p['ownerId']?.toString());
  }
}

class ProjectSummary {
  final String id, title;
  final String? description, kind, boardType, ownerId, ownerName, ownerSeed;
  final int? aiScore;
  final AiScoreData? aiScoreData;
  const ProjectSummary({required this.id, required this.title, this.description, this.kind, this.boardType, this.ownerId, this.ownerName, this.ownerSeed, this.aiScore, this.aiScoreData});
  factory ProjectSummary.fromJson(Map j) {
    final owner = (j['owner'] is Map) ? j['owner'] as Map : const {};
    return ProjectSummary(
      id: _s(j['id']), title: _s(j['title']),
      description: j['description']?.toString(), kind: j['kind']?.toString(),
      boardType: j['boardType']?.toString(),
      ownerId: owner['id']?.toString(), ownerName: owner['displayName']?.toString(),
      ownerSeed: owner['avatarSeed']?.toString(),
      aiScore: j['aiScore'] == null ? null : _int(j['aiScore']),
      aiScoreData: (j['aiScoreData'] is Map) ? AiScoreData.fromJson(j['aiScoreData'] as Map) : null);
  }
  static List<ProjectSummary> listFromTop(dynamic body) {
    if (body is! Map || body['projects'] is! List) return const [];
    return [for (final p in (body['projects'] as List)) if (p is Map) ProjectSummary.fromJson(p)];
  }
}
```

Create `lib/api/project_api.dart`:
```dart
import 'api_client.dart';
import '../models/project.dart';

class ProjectApi {
  ProjectApi._();
  static final ProjectApi instance = ProjectApi._();
  final ApiClient _api = ApiClient.instance;

  Future<ProjectDetail> detail(String id) async =>
      ProjectDetail.fromJson(await _api.get<Map<String, dynamic>>('/projects/$id'));

  Future<List<ProjectSummary>> top() async =>
      ProjectSummary.listFromTop(await _api.get<Map<String, dynamic>>('/projects/top'));
}
```

- [ ] **Step 4: Run test to verify it passes**

`flutter test test/project_models_test.dart` → PASS. Then `flutter analyze lib/models/project.dart lib/api/project_api.dart` → no issues.

- [ ] **Step 5: Commit**
```bash
git -C /Users/marimo/Dev/robocode/robocode-mobile add lib/models/project.dart lib/api/project_api.dart test/project_models_test.dart
git -C /Users/marimo/Dev/robocode/robocode-mobile commit -m "feat(projects): project detail + top-projects models and API"
```

---

### Task 2: Project detail screen + route + projects tap

**Files:**
- Create: `lib/screens/projects/project_detail_screen.dart`
- Modify: `lib/router.dart`, `lib/screens/projects_screen.dart`

**Interfaces:**
- Consumes: `ProjectApi.instance.detail(id)`; `SocialApi.instance.wall('project', id, cursor:)`, `.follow/.unfollow('project', id)`, `.followPreview('project', id)`; widgets `PostCard`, `PostComposer`, `FollowPreviewRow`, `AsyncView`, `BrandHeader`, `MiniChip`, `EmptyState`.

- [ ] **Step 1: Read the reusable APIs/widgets**

Read `lib/widgets/social_widgets.dart` (exact constructors of `PostCard`, `PostComposer`, `FollowPreviewRow`), `lib/api/social_api.dart` (`wall`, `follow`, `unfollow`, `followPreview` signatures + return types), `lib/models/social.dart` (`Wall`, `Post`, `FollowPreview`), and an existing social wall screen (e.g. `lib/screens/social/social_profile_screen.dart`) to copy the wall + composer + "Load more" pattern exactly.

- [ ] **Step 2: Implement `ProjectDetailScreen`**

Create `lib/screens/projects/project_detail_screen.dart`: a `StatefulWidget` taking `final String projectId`. Mirror the existing social-wall screen structure:
- Load `ProjectApi.instance.detail(projectId)` for the header (title, a `MiniChip` for kind/board, description) with an **Open in Studio** `FilledButton` → `context.push('/studio/$projectId')` and a **Follow/Following** toggle calling `SocialApi.instance.follow/unfollow('project', projectId)` (optimistic, mirror how the profile screen toggles follow).
- Below the header, render `FollowPreviewRow` from `SocialApi.instance.followPreview('project', projectId)`.
- Render the wall via `SocialApi.instance.wall('project', projectId, cursor: ...)`: a `PostComposer` (when `wall.canPost`) + a list of `PostCard`s with the same like/comment wiring the social wall screen uses, plus a "Load more" button when `nextCursor != null`.
- Use `AsyncView`/`EmptyState` for loading/empty, matching the app's pattern.
Keep the widget composition aligned with the real widget constructors you read in Step 1.

- [ ] **Step 3: Add the route + change the tap target**

In `lib/router.dart`, add to the top-level `_routes` list (near the `/studio/:id` line, and BEFORE any `/projects/:id` catch — `/projects/top` is added in Task 3):
```dart
GoRoute(path: '/projects/:id', builder: (c, s) => ProjectDetailScreen(projectId: s.pathParameters['id']!)),
```
Add the import for `ProjectDetailScreen`. In `lib/screens/projects_screen.dart`, change the two project-card taps (currently `context.push('/studio/$id')` at ~lines 187 and 216) to `context.push('/projects/$id')`. Leave the **create-new-project** flow (which pushes `/studio/$projectId` after POST) as-is — creating a project still opens the Studio directly.

- [ ] **Step 4: Verify**

`flutter analyze lib/screens/projects/project_detail_screen.dart lib/router.dart lib/screens/projects_screen.dart` → no issues. `flutter test` → suite green.

- [ ] **Step 5: Commit**
```bash
git -C /Users/marimo/Dev/robocode/robocode-mobile add lib/screens/projects/project_detail_screen.dart lib/router.dart lib/screens/projects_screen.dart
git -C /Users/marimo/Dev/robocode/robocode-mobile commit -m "feat(projects): project detail screen with social wall + follow"
```

---

### Task 3: Top Projects screen + route + entry point (widget test)

**Files:**
- Create: `lib/screens/projects/top_projects_screen.dart`
- Modify: `lib/router.dart`, `lib/screens/projects_screen.dart`
- Test: `test/top_projects_screen_test.dart`

**Interfaces:**
- Consumes: `ProjectApi.instance.top()` → `List<ProjectSummary>`; `SeedAvatar`, `MiniChip`, `BrandHeader`, `AsyncView`, `EmptyState`, `StatTile`.

- [ ] **Step 1: Write the failing widget test**

Create `test/top_projects_screen_test.dart` (hermetic — render the ranked-list builder from injected data, not a live fetch):
```dart
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:robocode_mobile/models/project.dart';
import 'package:robocode_mobile/screens/projects/top_projects_screen.dart';

void main() {
  testWidgets('renders a ranked list of projects', (tester) async {
    final items = [
      const ProjectSummary(id: 'a', title: 'Alpha', kind: 'coding', ownerName: 'Ada', aiScore: 95),
      const ProjectSummary(id: 'b', title: 'Beta', kind: 'robotics', ownerName: 'Lee', aiScore: 80),
    ];
    await tester.pumpWidget(MaterialApp(
      home: Scaffold(body: TopProjectsList(items: items)),
    ));
    await tester.pumpAndSettle();
    expect(find.text('Alpha'), findsOneWidget);
    expect(find.text('Beta'), findsOneWidget);
    expect(find.textContaining('95'), findsWidgets);
  });
}
```

- [ ] **Step 2: Run test to verify it fails**

`flutter test test/top_projects_screen_test.dart` → FAIL (URI/`TopProjectsList` not found).

- [ ] **Step 3: Implement**

Create `lib/screens/projects/top_projects_screen.dart` with:
- A public, hermetic-testable `TopProjectsList extends StatelessWidget { final List<ProjectSummary> items; }` that renders the ranked cards: rank number with medal color for 1/2/3 (`RoboTheme.accent`/grey/brown-ish via theme), kind icon (`Icons.code` / `Icons.memory`), title, owner row (`SeedAvatar(seed: ownerSeed, name: ownerName)` + name, tappable → `context.push('/social/users/${item.ownerId}')` when `ownerId != null`), the overall `aiScore` prominently, and a compact 4-dim breakdown when `aiScoreData != null` (e.g. four `StatTile`s or small labeled bars). An Open-in-Studio affordance per card → `context.push('/studio/${item.id}')`.
- `TopProjectsScreen extends StatefulWidget` that loads `ProjectApi.instance.top()` via `AsyncView` and renders `TopProjectsList(items: ...)` inside a `BrandHeader('Top Projects', ...)` scaffold; `EmptyState` when empty.

- [ ] **Step 4: Add route + entry point**

In `lib/router.dart` top-level `_routes`, add BEFORE the `/projects/:id` route from Task 2:
```dart
GoRoute(path: '/projects/top', builder: (c, s) => const TopProjectsScreen()),
```
(Add the import.) In `lib/screens/projects_screen.dart`, add a "Top Projects" action in the screen header/app-bar (e.g. an `IconButton(icon: Icon(Icons.emoji_events_outlined))` or a text button) → `context.push('/projects/top')`. Reuse the existing header layout.

- [ ] **Step 5: Verify**

`flutter test test/top_projects_screen_test.dart` → PASS. `flutter analyze lib/screens/projects/top_projects_screen.dart lib/router.dart lib/screens/projects_screen.dart` → no issues. `flutter test` → suite green.

- [ ] **Step 6: Commit**
```bash
git -C /Users/marimo/Dev/robocode/robocode-mobile add lib/screens/projects/top_projects_screen.dart lib/router.dart lib/screens/projects_screen.dart test/top_projects_screen_test.dart
git -C /Users/marimo/Dev/robocode/robocode-mobile commit -m "feat(projects): Top Projects (AI-ranked) screen"
```

---

### Task 4: AI-model settings section

**Files:**
- Modify: `lib/screens/settings_screen.dart`

**Interfaces:**
- Consumes: `ApiClient.instance.get('/ai/config')`, `ApiClient.instance.put('/ai/config', body: {...})`.

- [ ] **Step 1: Read the current settings screen**

Read `lib/screens/settings_screen.dart` fully — the `_load()` (`GET /account/settings`), the `_save()` pattern, the locale dropdown, and how sections are laid out — so the AI section matches the existing style and save/snackbar flow.

- [ ] **Step 2: Add the AI-config section**

In `settings_screen.dart`:
1. On load, also fetch `GET /ai/config` (run alongside the existing settings load, e.g. `Future.wait` or a second future). Parse: `canEdit` (bool), `config: {provider, baseUrl, model, hasKey}`, `effective: {provider, model, baseUrl}`, `defaultModel`, `schoolName`.
2. Add state: `_aiProvider` (default `config.provider ?? 'deepseek'`), `_aiModel` controller (initial `config.model ?? ''`), `_aiBaseUrl` controller (initial `config.baseUrl ?? ''`), `_aiKey` controller (empty).
3. Render a new "AI model" `SectionTitle` + card:
   - If `canEdit == false`: read-only — show "Managed by {schoolName}" with the `effective.provider` / `effective.model` displayed; no inputs.
   - Else: a provider `DropdownButtonFormField` (`deepseek`, `openai`, `custom`); a Model `TextField` (hint `defaultModel`); a Base URL `TextField` shown only when `_aiProvider == 'custom'`; an API key `TextField` (`obscureText: true`, hint = `config.hasKey ? 'saved — leave blank to keep' : 'Paste your API key'`); a **Save** button and a **Use platform default** button.
4. **Save** → `PUT /ai/config` with body `{ 'provider': _aiProvider, 'model': model, if (custom) 'baseUrl': baseUrl, if (key not blank) 'apiKey': key }` (omit `apiKey` when blank). **Use platform default** → `PUT /ai/config` body `{ 'clearKey': true }`, then reload. Show a success/error `SnackBar` like the existing `_save`.
5. Never prefill or display the stored key.

- [ ] **Step 3: Verify**

`flutter analyze lib/screens/settings_screen.dart` → no issues. `flutter test` → suite green. (Network round-trip is a manual check with a running backend.)

- [ ] **Step 4: Commit**
```bash
git -C /Users/marimo/Dev/robocode/robocode-mobile add lib/screens/settings_screen.dart
git -C /Users/marimo/Dev/robocode/robocode-mobile commit -m "feat(settings): AI model configuration (provider/model/baseUrl/apiKey)"
```

---

## Final verification (after all tasks)

- [ ] `cd /Users/marimo/Dev/robocode/robocode-mobile && /Users/marimo/Dev/flutter/bin/flutter analyze` → clean.
- [ ] `flutter test` → all tests pass (project_models, top_projects_screen, plus Phase 1 suite).
- [ ] Manual (needs seeded backend + running app): tapping a project opens the detail screen with its wall + follow + Open-in-Studio; "Top Projects" lists AI-ranked projects with scores and links to owners/studio; Settings shows the AI-model section and saving updates `/ai/config` (school-managed users see it read-only).

## Self-Review (coverage map)

- Spec §1 Project detail → Task 2 (+ Task 1 model/API). §2 Top Projects → Task 3 (+ Task 1). §3 AI settings → Task 4. Routing constraint (top-level, `/projects/top` before `/projects/:id`) honored in Tasks 2–3. Reuse of social widgets/`SocialApi` stated in Tasks 2. AI key safety in Task 4. Tests: Tasks 1 (models, TDD) + 3 (widget) + suite runs.
- Names consistent: `ProjectDetail`, `ProjectSummary`, `AiScoreData`, `ProjectApi.detail/top`, `TopProjectsScreen`/`TopProjectsList`, `ProjectDetailScreen`, routes `/projects/:id` and `/projects/top`.
