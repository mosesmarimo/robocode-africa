import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../theme.dart';
import '../../widgets/common.dart';

/// School-admin hub: approvals, members, branding, reports, domain.
class SchoolHubScreen extends StatelessWidget {
  const SchoolHubScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final items = <(IconData, String, String, String, Color)>[
      (Icons.how_to_reg_rounded, 'Approvals', 'Approve or reject student sign-ups', '/school/approvals', RoboTheme.primary),
      (Icons.people_alt_rounded, 'Members', 'Students and teachers in your school', '/school/members', RoboTheme.secondary),
      (Icons.palette_rounded, 'Branding', 'Colours, logo and tagline', '/school/branding', RoboTheme.accent),
      (Icons.insights_rounded, 'Reports', 'Engagement and progress analytics', '/school/reports', Colors.deepPurple),
      (Icons.dns_rounded, 'Domain', 'Subdomain and custom domain', '/school/domain', RoboTheme.ink),
    ];
    return Scaffold(
      appBar: AppBar(title: const Text('School')),
      body: ListView(
        children: [
          const BrandHeader(
            title: 'School admin',
            subtitle: 'Manage your school portal',
            trailing: Icon(Icons.apartment_rounded, color: Colors.white, size: 28),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                for (final (icon, title, subtitle, route, color) in items)
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
