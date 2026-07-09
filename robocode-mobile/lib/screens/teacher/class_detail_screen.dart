import 'package:flutter/material.dart';

import '../../api/api_client.dart';
import '../../widgets/common.dart';

/// Teacher class detail: join code, roster, add-student, assignments.
class ClassDetailScreen extends StatefulWidget {
  final String classId;
  const ClassDetailScreen({super.key, required this.classId});
  @override
  State<ClassDetailScreen> createState() => _ClassDetailScreenState();
}

class _ClassDetailScreenState extends State<ClassDetailScreen> {
  late Future<Map<String, dynamic>> _future;
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<Map<String, dynamic>> _load() =>
      ApiClient.instance.get<Map<String, dynamic>>('/teacher/classes/${widget.classId}');

  void _reload() => setState(() => _future = _load());

  Future<void> _addStudent() async {
    final controller = TextEditingController();
    final email = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Add student'),
        content: TextField(
          controller: controller,
          autofocus: true,
          keyboardType: TextInputType.emailAddress,
          decoration: const InputDecoration(labelText: 'Student email', hintText: 'name@school.example'),
          onSubmitted: (v) => Navigator.of(ctx).pop(v.trim()),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.of(ctx).pop(), child: const Text('Cancel')),
          FilledButton(onPressed: () => Navigator.of(ctx).pop(controller.text.trim()), child: const Text('Add')),
        ],
      ),
    );
    controller.dispose();
    if (email == null || email.isEmpty) return;
    setState(() => _busy = true);
    try {
      await ApiClient.instance
          .post<Map<String, dynamic>>('/teacher/classes/${widget.classId}/students', body: {'email': email});
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Student added.')));
      _reload();
    } on ApiException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Class')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _busy ? null : _addStudent,
        icon: const Icon(Icons.person_add_alt_1),
        label: const Text('Add student'),
      ),
      body: RefreshIndicator(
        onRefresh: () async => _reload(),
        child: AsyncView<Map<String, dynamic>>(
          future: _future,
          onRetry: _reload,
          builder: (context, data) {
            final cls = (data['cls'] as Map?) ?? const {};
            final members = (cls['members'] as List?) ?? const [];
            final assignments = (cls['assignments'] as List?) ?? const [];
            final joinCode = cls['joinCode']?.toString() ?? '';
            return ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Text(cls['name']?.toString() ?? 'Class',
                    style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
                if (joinCode.isNotEmpty) ...[
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      const Icon(Icons.vpn_key_outlined, size: 16),
                      const SizedBox(width: 6),
                      Text('Join code: ', style: TextStyle(color: Theme.of(context).hintColor)),
                      Text(joinCode, style: const TextStyle(fontFamily: 'monospace', fontWeight: FontWeight.bold, letterSpacing: 1)),
                    ],
                  ),
                ],
                const SizedBox(height: 20),
                SectionTitle('Students (${members.length})'),
                const SizedBox(height: 8),
                if (members.isEmpty)
                  const HintCard('No students yet. Add one with their email or share the join code.')
                else
                  for (final m in members) _studentTile(m as Map),
                const SizedBox(height: 24),
                SectionTitle('Assignments (${assignments.length})'),
                const SizedBox(height: 8),
                if (assignments.isEmpty)
                  const HintCard('No assignments for this class yet.')
                else
                  for (final a in assignments) _assignmentTile(a as Map),
                const SizedBox(height: 80),
              ],
            );
          },
        ),
      ),
    );
  }

  Widget _studentTile(Map m) {
    final user = (m['user'] as Map?) ?? const {};
    final name = user['displayName']?.toString() ?? 'Student';
    final email = user['email']?.toString() ?? '';
    return Card(
      child: ListTile(
        leading: SeedAvatar(seed: user['avatarSeed']?.toString(), name: name, size: 38),
        title: Text(name, maxLines: 1, overflow: TextOverflow.ellipsis),
        subtitle: email.isEmpty ? null : Text(email, maxLines: 1, overflow: TextOverflow.ellipsis),
      ),
    );
  }

  Widget _assignmentTile(Map a) {
    final title = a['title']?.toString() ?? 'Assignment';
    final due = a['dueAt']?.toString();
    return Card(
      child: ListTile(
        leading: const Icon(Icons.assignment_outlined),
        title: Text(title, maxLines: 1, overflow: TextOverflow.ellipsis),
        subtitle: (due == null || due.isEmpty) ? null : Text('Due ${dueDateLabel(due)}'),
      ),
    );
  }
}
