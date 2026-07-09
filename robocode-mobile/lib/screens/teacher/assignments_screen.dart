import 'package:flutter/material.dart';

import '../../api/api_client.dart';
import '../../widgets/common.dart';

/// Teacher assignments: list grouped by class + create a new assignment.
class AssignmentsScreen extends StatefulWidget {
  const AssignmentsScreen({super.key});
  @override
  State<AssignmentsScreen> createState() => _AssignmentsScreenState();
}

class _AssignmentsScreenState extends State<AssignmentsScreen> {
  late Future<Map<String, dynamic>> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<Map<String, dynamic>> _load() =>
      ApiClient.instance.get<Map<String, dynamic>>('/teacher/assignments');

  void _reload() => setState(() => _future = _load());

  Future<void> _create(List classes, List tasks) async {
    if (classes.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Create a class first.')),
      );
      return;
    }
    final created = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom),
        child: _NewAssignmentSheet(classes: classes, tasks: tasks),
      ),
    );
    if (created == true) _reload();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Assignments')),
      body: RefreshIndicator(
        onRefresh: () async => _reload(),
        child: AsyncView<Map<String, dynamic>>(
          future: _future,
          onRetry: _reload,
          builder: (context, data) {
            final assignments = (data['assignments'] as List?) ?? const [];
            final classes = (data['classes'] as List?) ?? const [];
            final tasks = (data['tasks'] as List?) ?? const [];
            final classNames = {
              for (final c in classes) (c as Map)['id']?.toString(): c['name']?.toString() ?? 'Class'
            };
            return Stack(
              children: [
                ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    if (assignments.isEmpty)
                      const Padding(
                        padding: EdgeInsets.only(top: 60),
                        child: EmptyState(icon: Icons.assignment_outlined, message: 'No assignments yet.'),
                      )
                    else
                      for (final a in assignments) _card(a as Map, classNames),
                    const SizedBox(height: 90),
                  ],
                ),
                Positioned(
                  right: 16,
                  bottom: 24,
                  child: FloatingActionButton.extended(
                    onPressed: () => _create(classes, tasks),
                    icon: const Icon(Icons.add),
                    label: const Text('New assignment'),
                  ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }

  Widget _card(Map a, Map<String?, String> classNames) {
    final title = a['title']?.toString() ?? 'Assignment';
    final className = classNames[a['classId']?.toString()] ?? '';
    final task = a['task'] as Map?;
    final due = a['dueAt']?.toString();
    return Card(
      child: ListTile(
        leading: const Icon(Icons.assignment_rounded),
        title: Text(title, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w600)),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (className.isNotEmpty) Text(className),
            if (task != null) Text('Task: ${task['title']}', style: const TextStyle(fontSize: 12)),
            if (due != null && due.isNotEmpty) Text('Due ${dueDateLabel(due)}', style: const TextStyle(fontSize: 12)),
          ],
        ),
        isThreeLine: task != null || (due != null && due.isNotEmpty),
      ),
    );
  }
}

class _NewAssignmentSheet extends StatefulWidget {
  final List classes;
  final List tasks;
  const _NewAssignmentSheet({required this.classes, required this.tasks});
  @override
  State<_NewAssignmentSheet> createState() => _NewAssignmentSheetState();
}

class _NewAssignmentSheetState extends State<_NewAssignmentSheet> {
  final _title = TextEditingController();
  final _instructions = TextEditingController();
  String? _classId;
  String? _taskId;
  DateTime? _dueAt;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _classId = widget.classes.isNotEmpty ? (widget.classes.first as Map)['id']?.toString() : null;
  }

  @override
  void dispose() {
    _title.dispose();
    _instructions.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final title = _title.text.trim();
    if (_classId == null || title.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Class and title are required.')));
      return;
    }
    setState(() => _saving = true);
    try {
      await ApiClient.instance.post<Map<String, dynamic>>('/teacher/assignments', body: {
        'classId': _classId,
        'title': title,
        if (_taskId != null) 'taskId': _taskId,
        if (_instructions.text.trim().isNotEmpty) 'instructions': _instructions.text.trim(),
        // Send UTC midnight of the picked calendar date (not `.toUtc()` of
        // local midnight, which shifts the date backward for any positive
        // UTC offset — e.g. Harare, UTC+2 — making every due date render a
        // day early).
        if (_dueAt != null) 'dueAt': DateTime.utc(_dueAt!.year, _dueAt!.month, _dueAt!.day).toIso8601String(),
      });
      if (!mounted) return;
      Navigator.of(context).pop(true);
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() => _saving = false);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } catch (_) {
      if (!mounted) return;
      setState(() => _saving = false);
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Could not reach the server.')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 20, 16, 20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('New assignment', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 16),
          DropdownButtonFormField<String>(
            initialValue: _classId,
            decoration: const InputDecoration(labelText: 'Class'),
            items: [
              for (final c in widget.classes)
                DropdownMenuItem(
                  value: (c as Map)['id']?.toString(),
                  child: Text(c['name']?.toString() ?? 'Class'),
                ),
            ],
            onChanged: (v) => setState(() => _classId = v),
          ),
          const SizedBox(height: 12),
          TextField(controller: _title, decoration: const InputDecoration(labelText: 'Title')),
          const SizedBox(height: 12),
          TextField(
            controller: _instructions,
            maxLines: 3,
            decoration: const InputDecoration(labelText: 'Instructions (optional)'),
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            initialValue: _taskId,
            decoration: const InputDecoration(labelText: 'Linked challenge (optional)'),
            items: [
              const DropdownMenuItem(value: null, child: Text('None')),
              for (final t in widget.tasks)
                DropdownMenuItem(
                  value: (t as Map)['id']?.toString(),
                  child: Text(t['title']?.toString() ?? 'Task', overflow: TextOverflow.ellipsis),
                ),
            ],
            onChanged: (v) => setState(() => _taskId = v),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: Text(_dueAt == null
                    ? 'No due date'
                    : 'Due ${_dueAt!.toIso8601String().split('T').first}'),
              ),
              TextButton.icon(
                onPressed: () async {
                  final now = DateTime.now();
                  final picked = await showDatePicker(
                    context: context,
                    initialDate: now,
                    firstDate: now,
                    lastDate: DateTime(now.year + 2),
                  );
                  if (picked != null) setState(() => _dueAt = picked);
                },
                icon: const Icon(Icons.event),
                label: const Text('Pick date'),
              ),
            ],
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: FilledButton(
              onPressed: _saving ? null : _submit,
              child: Text(_saving ? 'Creating…' : 'Create assignment'),
            ),
          ),
        ],
      ),
    );
  }
}
