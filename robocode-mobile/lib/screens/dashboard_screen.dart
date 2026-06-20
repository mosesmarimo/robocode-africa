import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../api/api_client.dart';
import '../state/auth.dart';
import '../theme.dart';
import '../widgets/common.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});
  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  late Future<Map<String, dynamic>> _future;

  @override
  void initState() {
    super.initState();
    _future = ApiClient.instance.get<Map<String, dynamic>>('/dashboard');
  }

  void _reload() => setState(() => _future = ApiClient.instance.get<Map<String, dynamic>>('/dashboard'));

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthState>().user;
    return Scaffold(
      body: RefreshIndicator(
        onRefresh: () async => _reload(),
        child: AsyncView<Map<String, dynamic>>(
          future: _future,
          onRetry: _reload,
          builder: (context, data) {
            final isStudent = data['kind'] == 'student';
            return ListView(
              children: [
                BrandHeader(
                  title: 'Hi, ${data['firstName'] ?? user?.firstName ?? ''} 👋',
                  subtitle: isStudent ? 'Keep building, keep learning' : (data['tenantName']?.toString() ?? 'RoboCode.Africa'),
                  trailing: IconButton(
                    onPressed: () => context.push('/notifications'),
                    icon: const Icon(Icons.notifications_outlined, color: Colors.white),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: isStudent ? _student(context, data) : _staff(context, data),
                ),
              ],
            );
          },
        ),
      ),
    );
  }

  Widget _student(BuildContext context, Map<String, dynamic> d) {
    final stats = (d['stats'] as Map?) ?? {};
    final progress = (d['progress'] as Map?) ?? {};
    final projects = (d['projects'] as List?) ?? [];
    final enrollments = (d['enrollments'] as List?) ?? [];
    final pct = ((progress['pct'] as num?)?.toDouble() ?? 0) / 100.0;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
          childAspectRatio: 1.5,
          children: [
            StatTile(icon: Icons.bolt, label: 'RoboPoints', value: '${stats['roboPoints'] ?? 0}', color: RoboTheme.accent),
            StatTile(icon: Icons.trending_up, label: 'Level', value: '${stats['level'] ?? 1}', color: RoboTheme.primary),
            StatTile(icon: Icons.workspace_premium, label: 'Badges', value: '${stats['badges'] ?? 0}', color: RoboTheme.secondary),
            StatTile(icon: Icons.leaderboard, label: 'Rank', value: stats['rank'] == null ? '—' : '#${stats['rank']}', color: Colors.purple),
          ],
        ),
        const SizedBox(height: 20),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('Level ${progress['level'] ?? 1} progress', style: const TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 10),
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: LinearProgressIndicator(value: pct.clamp(0, 1), minHeight: 10),
              ),
              const SizedBox(height: 6),
              Text('${progress['into'] ?? 0} / ${progress['span'] ?? 0} XP to next level', style: TextStyle(fontSize: 12, color: Theme.of(context).hintColor)),
            ]),
          ),
        ),
        const SizedBox(height: 20),
        _sectionHeader(context, 'Continue learning', '/learn'),
        if (enrollments.isEmpty)
          _hint('Enroll in a course to start learning.')
        else
          ...enrollments.take(3).map((e) {
            final course = (e['course'] as Map?) ?? {};
            return Card(
              child: ListTile(
                leading: const Icon(Icons.menu_book_rounded, color: RoboTheme.primary),
                title: Text(course['title']?.toString() ?? 'Course'),
                subtitle: Text('${e['progress'] ?? 0}% complete'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => course['slug'] != null ? context.push('/learn/${course['slug']}') : null,
              ),
            );
          }),
        const SizedBox(height: 20),
        _sectionHeader(context, 'Your projects', '/projects'),
        if (projects.isEmpty)
          _hint('Open the Studio to build your first circuit.')
        else
          ...projects.take(3).map((p) => Card(
                child: ListTile(
                  leading: const Icon(Icons.memory_rounded, color: RoboTheme.secondary),
                  title: Text(p['title']?.toString() ?? 'Project'),
                  subtitle: Text(p['boardType']?.toString() ?? ''),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () => p['id'] != null ? context.push('/studio/${p['id']}') : null,
                ),
              )),
      ],
    );
  }

  Widget _staff(BuildContext context, Map<String, dynamic> d) {
    final stats = (d['stats'] as Map?) ?? {};
    final canApprove = d['canApprove'] == true;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
          childAspectRatio: 1.5,
          children: [
            StatTile(icon: Icons.how_to_reg, label: 'Pending', value: '${stats['pending'] ?? 0}', color: RoboTheme.accent),
            StatTile(icon: Icons.groups, label: 'Members', value: '${stats['members'] ?? 0}', color: RoboTheme.primary),
            StatTile(icon: Icons.memory, label: 'Projects', value: '${stats['projects'] ?? 0}', color: RoboTheme.secondary),
            StatTile(icon: Icons.emoji_events, label: 'Competitions', value: '${stats['competitions'] ?? 0}', color: Colors.purple),
          ],
        ),
        const SizedBox(height: 20),
        if (canApprove)
          Card(
            child: ListTile(
              leading: const Icon(Icons.verified_user_outlined, color: RoboTheme.primary),
              title: const Text('Review pending approvals'),
              subtitle: const Text('Keep your community safe'),
              trailing: const Icon(Icons.chevron_right),
              onTap: () => context.push('/community'),
            ),
          ),
        const SizedBox(height: 8),
        _sectionHeader(context, 'Explore', '/learn'),
        Card(child: ListTile(leading: const Icon(Icons.school_rounded), title: const Text('Courses & lessons'), trailing: const Icon(Icons.chevron_right), onTap: () => context.go('/learn'))),
        Card(child: ListTile(leading: const Icon(Icons.leaderboard_rounded), title: const Text('Leaderboard'), trailing: const Icon(Icons.chevron_right), onTap: () => context.push('/leaderboard'))),
      ],
    );
  }

  Widget _sectionHeader(BuildContext context, String title, String route) => Padding(
        padding: const EdgeInsets.only(bottom: 8, top: 4),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(title, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold)),
            TextButton(onPressed: () => context.go(route), child: const Text('See all')),
          ],
        ),
      );

  Widget _hint(String text) => Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Text(text, style: TextStyle(color: Theme.of(context).hintColor)),
        ),
      );
}
