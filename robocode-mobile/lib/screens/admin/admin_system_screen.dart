import 'package:flutter/material.dart';

import '../../api/api_client.dart';
import '../../widgets/common.dart';

/// Platform-admin system metrics (read-only).
class AdminSystemScreen extends StatefulWidget {
  const AdminSystemScreen({super.key});
  @override
  State<AdminSystemScreen> createState() => _AdminSystemScreenState();
}

class _AdminSystemScreenState extends State<AdminSystemScreen> {
  late Future<Map<String, dynamic>> _future;

  @override
  void initState() {
    super.initState();
    _future = ApiClient.instance.get<Map<String, dynamic>>('/admin/system');
  }

  void _reload() => setState(() => _future = ApiClient.instance.get<Map<String, dynamic>>('/admin/system'));

  @override
  Widget build(BuildContext context) {
    // Known numeric metrics → label. Unknown keys are ignored gracefully.
    const metricLabels = <String, (String, IconData)>{
      'activeTenants': ('Active schools', Icons.apartment_rounded),
      'activeStudents': ('Active students', Icons.people_alt_rounded),
      'students': ('Students', Icons.people_alt_rounded),
      'activeTeachers': ('Active teachers', Icons.school_rounded),
      'teachers': ('Teachers', Icons.school_rounded),
      'pendingApprovals': ('Pending approvals', Icons.hourglass_empty),
      'openCases': ('Open reports', Icons.flag_rounded),
      'totalProjects': ('Projects', Icons.memory_rounded),
    };
    return Scaffold(
      appBar: AppBar(title: const Text('System')),
      body: RefreshIndicator(
        onRefresh: () async => _reload(),
        child: AsyncView<Map<String, dynamic>>(
          future: _future,
          onRetry: _reload,
          builder: (context, data) {
            final tiles = <Widget>[
              for (final e in metricLabels.entries)
                if (data[e.key] is num)
                  StatTile(icon: e.value.$2, label: e.value.$1, value: '${(data[e.key] as num).toInt()}'),
            ];
            final recentUsers = (data['recentUsers'] as List?) ?? const [];
            return ListView(
              padding: const EdgeInsets.all(16),
              children: [
                if (data['version'] != null || data['uptime'] != null)
                  Card(
                    child: ListTile(
                      leading: const Icon(Icons.info_outline),
                      title: Text('Version ${data['version'] ?? '—'}'),
                      subtitle: data['uptime'] == null ? null : Text('Uptime: ${data['uptime']}'),
                    ),
                  ),
                if (tiles.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  GridView.count(
                    crossAxisCount: 2,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    mainAxisSpacing: 12,
                    crossAxisSpacing: 12,
                    childAspectRatio: 1.7,
                    children: tiles,
                  ),
                ],
                if (recentUsers.isNotEmpty) ...[
                  const SizedBox(height: 24),
                  const SectionTitle('Recent sign-ups'),
                  const SizedBox(height: 8),
                  for (final u in recentUsers)
                    Card(
                      child: ListTile(
                        leading: SeedAvatar(seed: (u as Map)['avatarSeed']?.toString(), name: u['displayName']?.toString() ?? '?', size: 36),
                        title: Text(u['displayName']?.toString() ?? 'User', maxLines: 1, overflow: TextOverflow.ellipsis),
                        subtitle: Text('${u['role'] ?? ''} · ${u['status'] ?? ''}'),
                      ),
                    ),
                ],
                if (tiles.isEmpty && recentUsers.isEmpty)
                  const Padding(padding: EdgeInsets.only(top: 60), child: EmptyState(icon: Icons.monitor_heart_outlined, message: 'No metrics available.')),
                const SizedBox(height: 24),
              ],
            );
          },
        ),
      ),
    );
  }
}
