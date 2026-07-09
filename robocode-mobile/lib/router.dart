import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'state/auth.dart';
import 'screens/splash_screen.dart';
import 'screens/app_shell.dart';
import 'screens/auth/login_screen.dart';
import 'screens/auth/signup_screen.dart';
import 'screens/auth/pending_screen.dart';
import 'screens/dashboard_screen.dart';
import 'screens/learn/learn_screen.dart';
import 'screens/learn/course_screen.dart';
import 'screens/learn/lesson_screen.dart';
import 'screens/projects_screen.dart';
import 'screens/projects/project_detail_screen.dart';
import 'screens/projects/top_projects_screen.dart';
import 'screens/teacher/teacher_hub_screen.dart';
import 'screens/teacher/classes_screen.dart';
import 'screens/teacher/class_detail_screen.dart';
import 'screens/teacher/assignments_screen.dart';
import 'screens/teacher/grading_screen.dart';
import 'screens/school/school_hub_screen.dart';
import 'screens/school/school_approvals_screen.dart';
import 'screens/school/school_members_screen.dart';
import 'screens/school/school_branding_screen.dart';
import 'screens/school/school_reports_screen.dart';
import 'screens/school/school_domain_screen.dart';
import 'screens/admin/admin_hub_screen.dart';
import 'screens/admin/admin_approvals_screen.dart';
import 'screens/admin/admin_users_screen.dart';
import 'screens/admin/admin_tenants_screen.dart';
import 'screens/admin/admin_moderation_screen.dart';
import 'screens/admin/admin_content_screen.dart';
import 'screens/admin/admin_system_screen.dart';
import 'screens/studio_screen.dart';
import 'screens/community_screen.dart';
import 'screens/challenges/challenges_screen.dart';
import 'screens/challenges/challenge_screen.dart';
import 'screens/competitions/competitions_screen.dart';
import 'screens/competitions/competition_screen.dart';
import 'screens/teams/teams_screen.dart';
import 'screens/teams/team_screen.dart';
import 'screens/leaderboard_screen.dart';
import 'screens/leaderboards/leaderboards_screen.dart';
import 'screens/tracks/tracks_screen.dart';
import 'screens/tracks/track_detail_screen.dart';
import 'screens/badges_screen.dart';
import 'screens/notifications_screen.dart';
import 'screens/profile_screen.dart';
import 'screens/settings_screen.dart';
import 'screens/invite/invite_screen.dart';
import 'screens/social/feed_screen.dart';
import 'screens/social/friends_screen.dart';
import 'screens/social/groups_screen.dart';
import 'screens/social/group_detail_screen.dart';
import 'screens/social/social_profile_screen.dart';

/// Wraps a [GoRouter] configured with auth-aware redirects.
class RoboRouter {
  final AuthState auth;
  late final GoRouter config;

  RoboRouter(this.auth) {
    config = GoRouter(
      initialLocation: '/app',
      refreshListenable: auth,
      redirect: _redirect,
      routes: _routes,
    );
  }

  String? _redirect(BuildContext context, GoRouterState state) {
    final loc = state.matchedLocation;
    final onAuthPage = loc == '/login' || loc == '/signup';
    final onPending = loc == '/pending';
    final onSplash = loc == '/splash';

    // Until bootstrap resolves, hold everything on the splash so protected
    // screens never mount (and fire failing requests) before auth is known.
    if (auth.status == AuthStatus.unknown) return onSplash ? null : '/splash';

    if (!auth.isSignedIn) {
      return onAuthPage ? null : '/login';
    }
    // Signed in:
    final active = auth.user?.isActive ?? false;
    if (!active) return onPending ? null : '/pending';
    if (onAuthPage || onPending || onSplash) return '/app';
    return null;
  }

  List<RouteBase> get _routes => [
        GoRoute(path: '/splash', builder: (c, s) => const SplashScreen()),
        GoRoute(path: '/login', builder: (c, s) => const LoginScreen()),
        GoRoute(path: '/signup', builder: (c, s) => const SignupScreen()),
        GoRoute(path: '/pending', builder: (c, s) => const PendingScreen()),

        // Full-screen detail routes (no bottom nav).
        GoRoute(path: '/learn/:slug', builder: (c, s) => CourseScreen(slug: s.pathParameters['slug']!)),
        GoRoute(
          path: '/learn/:slug/:lessonSlug',
          builder: (c, s) => LessonScreen(slug: s.pathParameters['slug']!, lessonSlug: s.pathParameters['lessonSlug']!),
        ),
        GoRoute(path: '/teacher', builder: (c, s) => const TeacherHubScreen()),
        GoRoute(path: '/teacher/classes', builder: (c, s) => const ClassesScreen()),
        GoRoute(path: '/teacher/classes/:id', builder: (c, s) => ClassDetailScreen(classId: s.pathParameters['id']!)),
        GoRoute(path: '/teacher/assignments', builder: (c, s) => const AssignmentsScreen()),
        GoRoute(path: '/teacher/grading', builder: (c, s) => const GradingScreen()),
        GoRoute(path: '/school', builder: (c, s) => const SchoolHubScreen()),
        GoRoute(path: '/school/approvals', builder: (c, s) => const SchoolApprovalsScreen()),
        GoRoute(path: '/school/members', builder: (c, s) => const SchoolMembersScreen()),
        GoRoute(path: '/school/branding', builder: (c, s) => const SchoolBrandingScreen()),
        GoRoute(path: '/school/reports', builder: (c, s) => const SchoolReportsScreen()),
        GoRoute(path: '/school/domain', builder: (c, s) => const SchoolDomainScreen()),
        GoRoute(path: '/admin', builder: (c, s) => const AdminHubScreen()),
        GoRoute(path: '/admin/approvals', builder: (c, s) => const AdminApprovalsScreen()),
        GoRoute(path: '/admin/users', builder: (c, s) => const AdminUsersScreen()),
        GoRoute(path: '/admin/tenants', builder: (c, s) => const AdminTenantsScreen()),
        GoRoute(path: '/admin/moderation', builder: (c, s) => const AdminModerationScreen()),
        GoRoute(path: '/admin/content', builder: (c, s) => const AdminContentScreen()),
        GoRoute(path: '/admin/system', builder: (c, s) => const AdminSystemScreen()),
        GoRoute(path: '/projects/top', builder: (c, s) => const TopProjectsScreen()),
        GoRoute(path: '/projects/:id', builder: (c, s) => ProjectDetailScreen(projectId: s.pathParameters['id']!)),
        GoRoute(path: '/studio/:id', builder: (c, s) => StudioScreen(projectId: s.pathParameters['id']!)),
        GoRoute(
          path: '/studio-open',
          builder: (c, s) => StudioScreen.launch(s.extra as String? ?? 'studio/new'),
        ),
        GoRoute(path: '/challenges', builder: (c, s) => const ChallengesScreen()),
        GoRoute(path: '/challenges/:slug', builder: (c, s) => ChallengeScreen(slug: s.pathParameters['slug']!)),
        GoRoute(path: '/tracks', builder: (c, s) => const TracksScreen()),
        GoRoute(path: '/tracks/:slug', builder: (c, s) => TrackDetailScreen(slug: s.pathParameters['slug']!)),
        GoRoute(path: '/competitions', builder: (c, s) => const CompetitionsScreen()),
        GoRoute(path: '/competitions/:slug', builder: (c, s) => CompetitionScreen(slug: s.pathParameters['slug']!)),
        GoRoute(path: '/teams', builder: (c, s) => const TeamsScreen()),
        GoRoute(path: '/teams/:id', builder: (c, s) => TeamScreen(teamId: s.pathParameters['id']!)),
        GoRoute(path: '/leaderboard', builder: (c, s) => const LeaderboardScreen()),
        GoRoute(path: '/leaderboards', builder: (c, s) => const LeaderboardsScreen()),
        GoRoute(path: '/badges', builder: (c, s) => const BadgesScreen()),
        GoRoute(path: '/invite', builder: (c, s) => const InviteScreen()),
        GoRoute(path: '/notifications', builder: (c, s) => const NotificationsScreen()),
        GoRoute(path: '/settings', builder: (c, s) => const SettingsScreen()),

        // Social: feed, friends, groups + detail/profile routes.
        GoRoute(path: '/social/feed', builder: (c, s) => const FeedScreen()),
        GoRoute(path: '/social/friends', builder: (c, s) => const FriendsScreen()),
        GoRoute(path: '/social/groups', builder: (c, s) => const GroupsScreen()),
        GoRoute(
          path: '/social/groups/:id',
          builder: (c, s) => GroupDetailScreen(groupId: s.pathParameters['id']!),
        ),
        GoRoute(
          path: '/social/users/:id',
          builder: (c, s) => SocialProfileScreen(userId: s.pathParameters['id']!),
        ),

        // Bottom-nav shell with 5 tabs.
        StatefulShellRoute.indexedStack(
          builder: (c, s, navShell) => AppShell(navigationShell: navShell),
          branches: [
            StatefulShellBranch(routes: [GoRoute(path: '/app', builder: (c, s) => const DashboardScreen())]),
            StatefulShellBranch(routes: [GoRoute(path: '/learn', builder: (c, s) => const LearnScreen())]),
            StatefulShellBranch(routes: [GoRoute(path: '/projects', builder: (c, s) => const ProjectsScreen())]),
            StatefulShellBranch(routes: [GoRoute(path: '/community', builder: (c, s) => const CommunityScreen())]),
            StatefulShellBranch(routes: [GoRoute(path: '/profile', builder: (c, s) => const ProfileScreen())]),
          ],
        ),
      ];
}
