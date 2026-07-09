import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../state/auth.dart';
import '../theme.dart';
import '../widgets/common.dart';

class CommunityScreen extends StatelessWidget {
  const CommunityScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthState>().user;
    final subtitle = user == null
        ? 'Compete, team up and climb the ranks'
        : 'Hi ${user.firstName} — compete, team up and climb the ranks';

    final items = <_CommunityItem>[
      const _CommunityItem(
        icon: Icons.dynamic_feed_rounded,
        title: 'Feed',
        subtitle: 'Posts from friends, groups and follows',
        route: '/social/feed',
        color: RoboTheme.primary,
      ),
      const _CommunityItem(
        icon: Icons.people_alt_rounded,
        title: 'Friends',
        subtitle: 'Connect with builders across RoboCode',
        route: '/social/friends',
        color: RoboTheme.secondary,
      ),
      const _CommunityItem(
        icon: Icons.groups_2_rounded,
        title: 'Groups',
        subtitle: 'Join communities and share your work',
        route: '/social/groups',
        color: Colors.deepPurple,
      ),
      const _CommunityItem(
        icon: Icons.emoji_events_rounded,
        title: 'Competitions',
        subtitle: 'Enter robotics challenges and win',
        route: '/competitions',
        color: RoboTheme.accent,
      ),
      const _CommunityItem(
        icon: Icons.groups_rounded,
        title: 'Teams',
        subtitle: 'Build robots together',
        route: '/teams',
        color: RoboTheme.primary,
      ),
      const _CommunityItem(
        icon: Icons.leaderboard_rounded,
        title: 'Leaderboard',
        subtitle: 'See who tops the RoboPoints chart',
        route: '/leaderboard',
        color: RoboTheme.secondary,
      ),
      const _CommunityItem(
        icon: Icons.workspace_premium_rounded,
        title: 'Badges',
        subtitle: 'Collect achievements as you learn',
        route: '/badges',
        color: Colors.purple,
      ),
    ];

    final role = user?.role ?? '';
    if (const ['super_admin', 'moderator'].contains(role)) {
      items.insert(
        0,
        const _CommunityItem(
          icon: Icons.shield_rounded,
          title: 'Platform admin',
          subtitle: 'Approvals, users, schools, moderation',
          route: '/admin',
          color: RoboTheme.ink,
        ),
      );
    }
    if (const ['school_admin', 'super_admin'].contains(role)) {
      items.insert(
        0,
        const _CommunityItem(
          icon: Icons.apartment_rounded,
          title: 'School admin',
          subtitle: 'Approvals, members, branding, reports',
          route: '/school',
          color: RoboTheme.ink,
        ),
      );
    }
    if (const ['teacher', 'school_admin', 'super_admin'].contains(role)) {
      items.insert(
        0,
        const _CommunityItem(
          icon: Icons.school_rounded,
          title: 'Teaching',
          subtitle: 'Classes, assignments and grading',
          route: '/teacher',
          color: RoboTheme.ink,
        ),
      );
    }

    return Scaffold(
      body: ListView(
        children: [
          BrandHeader(
            title: 'Community',
            subtitle: subtitle,
            trailing: const Icon(Icons.diversity_3_rounded, color: Colors.white, size: 28),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                for (final item in items) _CommunityCard(item: item),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _CommunityItem {
  final IconData icon;
  final String title;
  final String subtitle;
  final String route;
  final Color color;
  const _CommunityItem({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.route,
    required this.color,
  });
}

class _CommunityCard extends StatelessWidget {
  final _CommunityItem item;
  const _CommunityCard({required this.item});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        leading: Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            color: item.color.withValues(alpha: 0.12),
            borderRadius: BorderRadius.circular(14),
          ),
          child: Icon(item.icon, color: item.color),
        ),
        title: Text(item.title, style: const TextStyle(fontWeight: FontWeight.w600)),
        subtitle: Text(item.subtitle),
        trailing: const Icon(Icons.chevron_right),
        onTap: () => context.push(item.route),
      ),
    );
  }
}
