import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'state/auth.dart';
import 'screens/app_shell.dart';
import 'screens/auth/login_screen.dart';
import 'screens/auth/signup_screen.dart';
import 'screens/auth/pending_screen.dart';
import 'screens/dashboard_screen.dart';
import 'screens/learn/learn_screen.dart';
import 'screens/learn/course_screen.dart';
import 'screens/learn/lesson_screen.dart';
import 'screens/projects_screen.dart';
import 'screens/studio_screen.dart';
import 'screens/community_screen.dart';
import 'screens/challenges/challenges_screen.dart';
import 'screens/challenges/challenge_screen.dart';
import 'screens/competitions/competitions_screen.dart';
import 'screens/competitions/competition_screen.dart';
import 'screens/teams/teams_screen.dart';
import 'screens/teams/team_screen.dart';
import 'screens/leaderboard_screen.dart';
import 'screens/badges_screen.dart';
import 'screens/notifications_screen.dart';
import 'screens/profile_screen.dart';
import 'screens/settings_screen.dart';

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

    if (auth.status == AuthStatus.unknown) return null; // wait for bootstrap

    if (!auth.isSignedIn) {
      return (onAuthPage) ? null : '/login';
    }
    // Signed in:
    final active = auth.user?.isActive ?? false;
    if (!active) return onPending ? null : '/pending';
    if (onAuthPage || onPending) return '/app';
    return null;
  }

  List<RouteBase> get _routes => [
        GoRoute(path: '/login', builder: (c, s) => const LoginScreen()),
        GoRoute(path: '/signup', builder: (c, s) => const SignupScreen()),
        GoRoute(path: '/pending', builder: (c, s) => const PendingScreen()),

        // Full-screen detail routes (no bottom nav).
        GoRoute(path: '/learn/:slug', builder: (c, s) => CourseScreen(slug: s.pathParameters['slug']!)),
        GoRoute(
          path: '/learn/:slug/:lessonSlug',
          builder: (c, s) => LessonScreen(slug: s.pathParameters['slug']!, lessonSlug: s.pathParameters['lessonSlug']!),
        ),
        GoRoute(path: '/studio/:id', builder: (c, s) => StudioScreen(projectId: s.pathParameters['id']!)),
        GoRoute(path: '/challenges', builder: (c, s) => const ChallengesScreen()),
        GoRoute(path: '/challenges/:slug', builder: (c, s) => ChallengeScreen(slug: s.pathParameters['slug']!)),
        GoRoute(path: '/competitions', builder: (c, s) => const CompetitionsScreen()),
        GoRoute(path: '/competitions/:slug', builder: (c, s) => CompetitionScreen(slug: s.pathParameters['slug']!)),
        GoRoute(path: '/teams', builder: (c, s) => const TeamsScreen()),
        GoRoute(path: '/teams/:id', builder: (c, s) => TeamScreen(teamId: s.pathParameters['id']!)),
        GoRoute(path: '/leaderboard', builder: (c, s) => const LeaderboardScreen()),
        GoRoute(path: '/badges', builder: (c, s) => const BadgesScreen()),
        GoRoute(path: '/notifications', builder: (c, s) => const NotificationsScreen()),
        GoRoute(path: '/settings', builder: (c, s) => const SettingsScreen()),

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
