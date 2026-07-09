import 'package:flutter/material.dart';

import '../../api/api_client.dart';
import '../../widgets/common.dart';

/// Teacher grading: review and score student submissions.
class GradingScreen extends StatefulWidget {
  const GradingScreen({super.key});
  @override
  State<GradingScreen> createState() => _GradingScreenState();
}

class _GradingScreenState extends State<GradingScreen> {
  late Future<Map<String, dynamic>> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<Map<String, dynamic>> _load() =>
      ApiClient.instance.get<Map<String, dynamic>>('/teacher/grading');

  void _reload() => setState(() => _future = _load());

  Future<void> _grade(Map sub) async {
    final id = sub['id']?.toString();
    if (id == null) return;
    final user = (sub['user'] as Map?) ?? const {};
    final task = (sub['task'] as Map?) ?? const {};
    final result = await showDialog<bool>(
      context: context,
      builder: (ctx) => _GradeDialog(
        submissionId: id,
        studentName: user['displayName']?.toString() ?? 'Student',
        taskTitle: task['title']?.toString() ?? 'Task',
        existingScore: (sub['score'] as num?)?.toInt(),
        existingFeedback: sub['feedback']?.toString(),
      ),
    );
    if (result == true) _reload();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Grading')),
      body: RefreshIndicator(
        onRefresh: () async => _reload(),
        child: AsyncView<Map<String, dynamic>>(
          future: _future,
          onRetry: _reload,
          builder: (context, data) {
            final subs = (data['submissions'] as List?) ?? const [];
            if (subs.isEmpty) {
              return ListView(
                children: const [
                  SizedBox(height: 80),
                  EmptyState(icon: Icons.grading_outlined, message: 'No submissions to grade.'),
                ],
              );
            }
            return ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: subs.length,
              itemBuilder: (context, i) => _card(subs[i] as Map),
            );
          },
        ),
      ),
    );
  }

  Widget _card(Map sub) {
    final user = (sub['user'] as Map?) ?? const {};
    final task = (sub['task'] as Map?) ?? const {};
    final status = sub['status']?.toString() ?? '';
    final score = (sub['score'] as num?)?.toInt();
    return Card(
      child: ListTile(
        leading: SeedAvatar(seed: user['avatarSeed']?.toString(), name: user['displayName']?.toString() ?? '?', size: 40),
        title: Text(user['displayName']?.toString() ?? 'Student',
            maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w600)),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(task['title']?.toString() ?? 'Task', maxLines: 1, overflow: TextOverflow.ellipsis),
            Row(
              children: [
                MiniChip(icon: Icons.flag_outlined, label: status.isEmpty ? '—' : status),
                if (score != null) ...[
                  const SizedBox(width: 8),
                  MiniChip(icon: Icons.star_outline, label: '$score/100'),
                ],
              ],
            ),
          ],
        ),
        isThreeLine: true,
        trailing: TextButton(onPressed: () => _grade(sub), child: const Text('Grade')),
      ),
    );
  }
}

class _GradeDialog extends StatefulWidget {
  final String submissionId;
  final String studentName;
  final String taskTitle;
  final int? existingScore;
  final String? existingFeedback;
  const _GradeDialog({
    required this.submissionId,
    required this.studentName,
    required this.taskTitle,
    this.existingScore,
    this.existingFeedback,
  });
  @override
  State<_GradeDialog> createState() => _GradeDialogState();
}

class _GradeDialogState extends State<_GradeDialog> {
  late final TextEditingController _score =
      TextEditingController(text: widget.existingScore?.toString() ?? '');
  late final TextEditingController _feedback =
      TextEditingController(text: widget.existingFeedback ?? '');
  bool _saving = false;
  String? _error;

  @override
  void dispose() {
    _score.dispose();
    _feedback.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final score = int.tryParse(_score.text.trim());
    if (score == null || score < 0 || score > 100) {
      setState(() => _error = 'Score must be 0–100.');
      return;
    }
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      await ApiClient.instance.post<Map<String, dynamic>>(
        '/teacher/submissions/${widget.submissionId}/grade',
        body: {
          'score': score,
          if (_feedback.text.trim().isNotEmpty) 'feedback': _feedback.text.trim(),
        },
      );
      if (!mounted) return;
      Navigator.of(context).pop(true);
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _saving = false;
        _error = e.message;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _saving = false;
        _error = 'Could not reach the server.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text('Grade ${widget.studentName}'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(widget.taskTitle, style: TextStyle(color: Theme.of(context).hintColor, fontSize: 12)),
          const SizedBox(height: 12),
          TextField(
            controller: _score,
            keyboardType: TextInputType.number,
            decoration: InputDecoration(labelText: 'Score (0–100)', errorText: _error),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _feedback,
            maxLines: 3,
            decoration: const InputDecoration(labelText: 'Feedback (optional)'),
          ),
        ],
      ),
      actions: [
        TextButton(onPressed: () => Navigator.of(context).pop(), child: const Text('Cancel')),
        FilledButton(onPressed: _saving ? null : _submit, child: Text(_saving ? 'Saving…' : 'Save grade')),
      ],
    );
  }
}
