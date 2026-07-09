import 'package:flutter/material.dart';

import '../../api/api_client.dart';
import '../../widgets/common.dart';

/// Platform-admin content overview: courses + challenges counts and lists.
class AdminContentScreen extends StatefulWidget {
  const AdminContentScreen({super.key});
  @override
  State<AdminContentScreen> createState() => _AdminContentScreenState();
}

class _AdminContentScreenState extends State<AdminContentScreen> {
  late Future<Map<String, dynamic>> _future;

  @override
  void initState() {
    super.initState();
    _future = ApiClient.instance.get<Map<String, dynamic>>('/admin/content');
  }

  void _reload() => setState(() => _future = ApiClient.instance.get<Map<String, dynamic>>('/admin/content'));

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Content')),
      body: RefreshIndicator(
        onRefresh: () async => _reload(),
        child: AsyncView<Map<String, dynamic>>(
          future: _future,
          onRetry: _reload,
          builder: (context, data) {
            final courses = (data['courses'] as List?) ?? const [];
            final tasks = (data['tasks'] as List?) ?? const [];
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
                    StatTile(icon: Icons.menu_book_rounded, label: 'Courses', value: '${courses.length}'),
                    StatTile(icon: Icons.flag_rounded, label: 'Challenges', value: '${tasks.length}'),
                    StatTile(icon: Icons.list_alt_rounded, label: 'Lessons', value: '${(data['totalLessons'] as num?)?.toInt() ?? 0}'),
                    StatTile(icon: Icons.school_outlined, label: 'Enrollments', value: '${(data['totalEnrollments'] as num?)?.toInt() ?? 0}'),
                  ],
                ),
                const SizedBox(height: 24),
                const SectionTitle('Courses'),
                const SizedBox(height: 8),
                if (courses.isEmpty)
                  const HintCard('No courses.')
                else
                  for (final c in courses)
                    Card(
                      child: ListTile(
                        leading: const Icon(Icons.menu_book_outlined),
                        title: Text((c as Map)['title']?.toString() ?? 'Course', maxLines: 1, overflow: TextOverflow.ellipsis),
                        subtitle: Text(c['track']?.toString() ?? ''),
                      ),
                    ),
                const SizedBox(height: 24),
              ],
            );
          },
        ),
      ),
    );
  }
}
