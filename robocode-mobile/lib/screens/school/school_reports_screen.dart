import 'package:flutter/material.dart';

import '../../api/api_client.dart';
import '../../widgets/common.dart';

/// School-admin reports: engagement and progress analytics (read-only).
class SchoolReportsScreen extends StatefulWidget {
  const SchoolReportsScreen({super.key});
  @override
  State<SchoolReportsScreen> createState() => _SchoolReportsScreenState();
}

class _SchoolReportsScreenState extends State<SchoolReportsScreen> {
  late Future<Map<String, dynamic>> _future;

  @override
  void initState() {
    super.initState();
    _future = ApiClient.instance.get<Map<String, dynamic>>('/school/reports');
  }

  void _reload() => setState(() => _future = ApiClient.instance.get<Map<String, dynamic>>('/school/reports'));

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Reports')),
      body: RefreshIndicator(
        onRefresh: () async => _reload(),
        child: AsyncView<Map<String, dynamic>>(
          future: _future,
          onRetry: _reload,
          builder: (context, data) {
            int n(String k) => (data[k] as num?)?.toInt() ?? 0;
            final topStudents = (data['topStudents'] as List?) ?? const [];
            final byTrack = (data['byTrack'] as Map?) ?? const {};
            return ListView(
              padding: const EdgeInsets.all(16),
              children: [
                GridView.count(
                  crossAxisCount: 2,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  mainAxisSpacing: 12,
                  crossAxisSpacing: 12,
                  childAspectRatio: 1.7,
                  children: [
                    StatTile(icon: Icons.people_alt_rounded, label: 'Active students', value: '${n('activeStudents')}'),
                    StatTile(icon: Icons.memory_rounded, label: 'Projects', value: '${n('projectsCreated')}'),
                    StatTile(icon: Icons.menu_book_rounded, label: 'Lessons done', value: '${n('lessonsCompleted')}'),
                    StatTile(icon: Icons.check_circle_outline, label: 'Pass rate', value: '${n('passRate')}%'),
                    StatTile(icon: Icons.assignment_turned_in_outlined, label: 'Submissions', value: '${n('totalSubmissions')}'),
                    StatTile(icon: Icons.school_outlined, label: 'Enrollments', value: '${n('totalEnrollments')}'),
                  ],
                ),
                if (byTrack.isNotEmpty) ...[
                  const SizedBox(height: 24),
                  const SectionTitle('Enrollments by track'),
                  const SizedBox(height: 10),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      for (final e in byTrack.entries)
                        MiniChip(icon: Icons.category_outlined, label: '${e.key}: ${e.value}'),
                    ],
                  ),
                ],
                if (topStudents.isNotEmpty) ...[
                  const SizedBox(height: 24),
                  const SectionTitle('Top students'),
                  const SizedBox(height: 10),
                  for (var i = 0; i < topStudents.length; i++) _topStudent(i + 1, topStudents[i] as Map),
                ],
                const SizedBox(height: 24),
              ],
            );
          },
        ),
      ),
    );
  }

  Widget _topStudent(int rank, Map s) {
    return Card(
      child: ListTile(
        leading: CircleAvatar(child: Text('$rank')),
        title: Text(s['displayName']?.toString() ?? 'Student', maxLines: 1, overflow: TextOverflow.ellipsis),
        subtitle: Text('Level ${(s['level'] as num?)?.toInt() ?? 0}'),
        trailing: Text('${(s['roboPoints'] as num?)?.toInt() ?? 0} pts', style: const TextStyle(fontWeight: FontWeight.bold)),
      ),
    );
  }
}
