import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../state/auth.dart';
import '../../theme.dart';
import '../../widgets/common.dart';

/// Platform-admin hub. Super admins see everything; moderators see the
/// approval and moderation queues only.
class AdminHubScreen extends StatelessWidget {
  const AdminHubScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final role = context.watch<AuthState>().user?.role ?? '';
    final isSuper = role == 'super_admin';
    final all = <(IconData, String, String, String, Color, bool)>[
      (Icons.how_to_reg_rounded, 'Approvals', 'Pending users and schools', '/admin/approvals', RoboTheme.primary, true),
      (Icons.flag_rounded, 'Moderation', 'Reported content queue', '/admin/moderation', Colors.red, true),
      (Icons.people_alt_rounded, 'Users', 'All platform users', '/admin/users', RoboTheme.secondary, isSuper),
      (Icons.apartment_rounded, 'Schools', 'All schools / tenants', '/admin/tenants', RoboTheme.accent, isSuper),
      (Icons.library_books_rounded, 'Content', 'Courses and challenges', '/admin/content', Colors.deepPurple, isSuper),
      (Icons.monitor_heart_rounded, 'System', 'Platform metrics', '/admin/system', RoboTheme.ink, isSuper),
    ];
    final items = all.where((i) => i.$6).toList();
    return Scaffold(
      appBar: AppBar(title: const Text('Platform admin')),
      body: ListView(
        children: [
          const BrandHeader(
            title: 'Platform admin',
            subtitle: 'Govern the RoboCode platform',
            trailing: Icon(Icons.shield_rounded, color: Colors.white, size: 28),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                for (final (icon, title, subtitle, route, color, _) in items)
                  Card(
                    child: ListTile(
                      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                      leading: Container(
                        width: 48,
                        height: 48,
                        decoration: BoxDecoration(
                          color: color.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: Icon(icon, color: color),
                      ),
                      title: Text(title, style: const TextStyle(fontWeight: FontWeight.w600)),
                      subtitle: Text(subtitle),
                      trailing: const Icon(Icons.chevron_right),
                      onTap: () => context.push(route),
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
