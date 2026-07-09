import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../api/api_client.dart';
import '../../theme.dart';
import '../../widgets/common.dart';

/// Teacher classes: list classes with join codes + create a new class.
class ClassesScreen extends StatefulWidget {
  const ClassesScreen({super.key});
  @override
  State<ClassesScreen> createState() => _ClassesScreenState();
}

class _ClassesScreenState extends State<ClassesScreen> {
  late Future<Map<String, dynamic>> _future;
  bool _creating = false;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<Map<String, dynamic>> _load() =>
      ApiClient.instance.get<Map<String, dynamic>>('/teacher/classes');

  void _reload() => setState(() => _future = _load());

  Future<void> _createClass() async {
    final controller = TextEditingController();
    final name = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('New class'),
        content: TextField(
          controller: controller,
          autofocus: true,
          decoration: const InputDecoration(labelText: 'Class name', hintText: 'e.g. Grade 8 Robotics'),
          onSubmitted: (v) => Navigator.of(ctx).pop(v.trim()),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.of(ctx).pop(), child: const Text('Cancel')),
          FilledButton(onPressed: () => Navigator.of(ctx).pop(controller.text.trim()), child: const Text('Create')),
        ],
      ),
    );
    controller.dispose();
    if (name == null || name.isEmpty) return;
    setState(() => _creating = true);
    try {
      await ApiClient.instance.post<Map<String, dynamic>>('/teacher/classes', body: {'name': name});
      if (!mounted) return;
      _reload();
    } on ApiException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } finally {
      if (mounted) setState(() => _creating = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('My Classes')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _creating ? null : _createClass,
        icon: const Icon(Icons.add),
        label: const Text('New class'),
      ),
      body: RefreshIndicator(
        onRefresh: () async => _reload(),
        child: AsyncView<Map<String, dynamic>>(
          future: _future,
          onRetry: _reload,
          builder: (context, data) {
            final classes = (data['classes'] as List?) ?? const [];
            if (classes.isEmpty) {
              return ListView(
                children: const [
                  SizedBox(height: 80),
                  EmptyState(icon: Icons.class_outlined, message: 'No classes yet. Tap "New class" to start.'),
                ],
              );
            }
            return ListView(
              padding: const EdgeInsets.all(16),
              children: [
                for (final c in classes) _classCard(context, c as Map),
                const SizedBox(height: 80),
              ],
            );
          },
        ),
      ),
    );
  }

  Widget _classCard(BuildContext context, Map c) {
    final id = c['id']?.toString();
    final name = c['name']?.toString() ?? 'Class';
    final joinCode = c['joinCode']?.toString() ?? '';
    final count = ((c['_count'] as Map?)?['members'] as num?)?.toInt() ?? 0;
    return Card(
      child: ListTile(
        leading: Container(
          width: 44,
          height: 44,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            gradient: RoboTheme.brandGradient,
            borderRadius: BorderRadius.circular(12),
          ),
          child: const Icon(Icons.class_rounded, color: Colors.white),
        ),
        title: Text(name, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w600)),
        subtitle: Row(
          children: [
            const Icon(Icons.people_alt_outlined, size: 14),
            const SizedBox(width: 4),
            Text('$count'),
            if (joinCode.isNotEmpty) ...[
              const SizedBox(width: 12),
              const Icon(Icons.vpn_key_outlined, size: 14),
              const SizedBox(width: 4),
              Text(joinCode, style: const TextStyle(fontFamily: 'monospace', letterSpacing: 1)),
            ],
          ],
        ),
        trailing: const Icon(Icons.chevron_right),
        onTap: id == null ? null : () => context.push('/teacher/classes/$id'),
      ),
    );
  }
}
