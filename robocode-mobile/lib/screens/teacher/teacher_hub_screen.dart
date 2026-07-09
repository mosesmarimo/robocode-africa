import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../theme.dart';
import '../../widgets/common.dart';

/// Teacher hub: entry points for classes, assignments and grading.
class TeacherHubScreen extends StatelessWidget {
  const TeacherHubScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final items = <_TeachItem>[
      const _TeachItem(
        icon: Icons.class_rounded,
        title: 'Classes',
        subtitle: 'Manage your classes and rosters',
        route: '/teacher/classes',
        color: RoboTheme.primary,
      ),
      const _TeachItem(
        icon: Icons.assignment_rounded,
        title: 'Assignments',
        subtitle: 'Create and track assignments',
        route: '/teacher/assignments',
        color: RoboTheme.secondary,
      ),
      const _TeachItem(
        icon: Icons.grading_rounded,
        title: 'Grading',
        subtitle: 'Review and grade submissions',
        route: '/teacher/grading',
        color: RoboTheme.accent,
      ),
    ];
    return Scaffold(
      appBar: AppBar(title: const Text('Teaching')),
      body: ListView(
        children: [
          const BrandHeader(
            title: 'Teaching',
            subtitle: 'Classes, assignments and grading',
            trailing: Icon(Icons.school_rounded, color: Colors.white, size: 28),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                for (final item in items)
                  Card(
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
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _TeachItem {
  final IconData icon;
  final String title;
  final String subtitle;
  final String route;
  final Color color;
  const _TeachItem({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.route,
    required this.color,
  });
}
