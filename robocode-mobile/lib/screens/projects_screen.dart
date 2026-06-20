import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../api/api_client.dart';
import '../theme.dart';
import '../widgets/common.dart';

class ProjectsScreen extends StatefulWidget {
  const ProjectsScreen({super.key});
  @override
  State<ProjectsScreen> createState() => _ProjectsScreenState();
}

class _ProjectsScreenState extends State<ProjectsScreen> {
  late Future<Map<String, dynamic>> _future;
  bool _creating = false;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<Map<String, dynamic>> _load() =>
      ApiClient.instance.get<Map<String, dynamic>>('/projects');

  void _reload() => setState(() => _future = _load());

  Future<void> _createProject() async {
    if (_creating) return;
    setState(() => _creating = true);
    try {
      final res = await ApiClient.instance.post<Map<String, dynamic>>('/projects', body: {
        'title': 'Untitled Project',
        'board': 'arduino-uno',
        'diagram': {'parts': [], 'wires': []},
        'files': [
          {'name': 'sketch.ino', 'language': 'arduino', 'content': ''},
        ],
      });
      if (!mounted) return;
      final projectId = res['projectId']?.toString();
      if (projectId == null || projectId.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not create project.')),
        );
        return;
      }
      context.push('/studio/$projectId');
    } on ApiException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not reach the server. Check your connection.')),
      );
    } finally {
      if (mounted) setState(() => _creating = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: RefreshIndicator(
        onRefresh: () async => _reload(),
        child: AsyncView<Map<String, dynamic>>(
          future: _future,
          onRetry: _reload,
          builder: (context, data) {
            final projects = (data['projects'] as List?) ?? [];
            final templates = (data['templates'] as List?) ?? [];
            return ListView(
              children: [
                BrandHeader(
                  title: 'Projects',
                  subtitle: projects.isEmpty
                      ? 'Build your first circuit'
                      : '${projects.length} ${projects.length == 1 ? 'project' : 'projects'}',
                  trailing: const Icon(Icons.memory_rounded, color: Colors.white, size: 28),
                ),
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Your projects',
                          style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 8),
                      if (projects.isEmpty)
                        const EmptyState(
                          icon: Icons.memory_outlined,
                          message: 'No projects yet. Tap "New project" to start building.',
                        )
                      else
                        ...projects.map((p) => _ProjectCard(project: p as Map<String, dynamic>)),
                      const SizedBox(height: 24),
                      const Text('Templates',
                          style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 4),
                      Text('Start from a ready-made circuit',
                          style: TextStyle(fontSize: 12, color: Theme.of(context).hintColor)),
                      const SizedBox(height: 8),
                      if (templates.isEmpty)
                        const EmptyState(
                          icon: Icons.dashboard_customize_outlined,
                          message: 'No templates available right now.',
                        )
                      else
                        ...templates.map((t) => _TemplateCard(template: t as Map<String, dynamic>)),
                      const SizedBox(height: 80),
                    ],
                  ),
                ),
              ],
            );
          },
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _creating ? null : _createProject,
        icon: _creating
            ? const SizedBox(
                width: 18,
                height: 18,
                child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
              )
            : const Icon(Icons.add),
        label: const Text('New project'),
      ),
    );
  }
}

class _ProjectCard extends StatelessWidget {
  final Map<String, dynamic> project;
  const _ProjectCard({required this.project});

  @override
  Widget build(BuildContext context) {
    final id = project['id']?.toString();
    final title = project['title']?.toString() ?? 'Untitled Project';
    final boardType = project['boardType']?.toString() ?? '';
    final visibility = project['visibility']?.toString() ?? '';
    final updatedAt = _formatUpdated(project['updatedAt']?.toString());
    final isPublic = visibility.toLowerCase() == 'public';

    return Card(
      child: ListTile(
        leading: Container(
          width: 44,
          height: 44,
          decoration: BoxDecoration(
            color: RoboTheme.secondary.withValues(alpha: 0.12),
            borderRadius: BorderRadius.circular(12),
          ),
          child: const Icon(Icons.memory_rounded, color: RoboTheme.secondary),
        ),
        title: Text(title, maxLines: 1, overflow: TextOverflow.ellipsis),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 4),
            Wrap(
              spacing: 6,
              runSpacing: 4,
              crossAxisAlignment: WrapCrossAlignment.center,
              children: [
                if (boardType.isNotEmpty)
                  _MiniChip(icon: Icons.developer_board, label: boardType),
                if (visibility.isNotEmpty)
                  _MiniChip(
                    icon: isPublic ? Icons.public : Icons.lock_outline,
                    label: visibility,
                  ),
                if (updatedAt != null)
                  Text('Updated $updatedAt',
                      style: TextStyle(fontSize: 12, color: Theme.of(context).hintColor)),
              ],
            ),
          ],
        ),
        isThreeLine: false,
        trailing: const Icon(Icons.chevron_right),
        onTap: id == null ? null : () => context.push('/studio/$id'),
      ),
    );
  }
}

class _TemplateCard extends StatelessWidget {
  final Map<String, dynamic> template;
  const _TemplateCard({required this.template});

  @override
  Widget build(BuildContext context) {
    final id = template['id']?.toString();
    final title = template['title']?.toString() ?? 'Template';
    final boardType = template['boardType']?.toString() ?? '';
    return Card(
      child: ListTile(
        leading: Container(
          width: 44,
          height: 44,
          decoration: BoxDecoration(
            color: RoboTheme.accent.withValues(alpha: 0.14),
            borderRadius: BorderRadius.circular(12),
          ),
          child: const Icon(Icons.dashboard_customize_rounded, color: RoboTheme.accent),
        ),
        title: Text(title, maxLines: 1, overflow: TextOverflow.ellipsis),
        subtitle: boardType.isEmpty ? null : Text(boardType),
        trailing: const Icon(Icons.chevron_right),
        onTap: id == null ? null : () => context.push('/studio/$id'),
      ),
    );
  }
}

class _MiniChip extends StatelessWidget {
  final IconData icon;
  final String label;
  const _MiniChip({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    final c = Theme.of(context).hintColor;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: c.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 13, color: c),
          const SizedBox(width: 4),
          Text(label, style: TextStyle(fontSize: 12, color: c)),
        ],
      ),
    );
  }
}

String? _formatUpdated(String? iso) {
  if (iso == null || iso.isEmpty) return null;
  final dt = DateTime.tryParse(iso);
  if (dt == null) return null;
  return DateFormat.yMMMd().format(dt.toLocal());
}
