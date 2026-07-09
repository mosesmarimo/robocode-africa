import 'package:flutter/material.dart';

import '../../api/api_client.dart';
import '../../widgets/common.dart';

/// School-admin approvals: approve or reject pending student sign-ups.
class SchoolApprovalsScreen extends StatefulWidget {
  const SchoolApprovalsScreen({super.key});
  @override
  State<SchoolApprovalsScreen> createState() => _SchoolApprovalsScreenState();
}

class _SchoolApprovalsScreenState extends State<SchoolApprovalsScreen> {
  late Future<Map<String, dynamic>> _future;
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<Map<String, dynamic>> _load() =>
      ApiClient.instance.get<Map<String, dynamic>>('/school/approvals');

  void _reload() => setState(() => _future = _load());

  Future<void> _act(String userId, String action, {String? reason}) async {
    setState(() => _busy = true);
    try {
      await ApiClient.instance.post<Map<String, dynamic>>(
        '/school/students/$userId/$action',
        body: reason == null ? null : {'reason': reason},
      );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Student ${action}d.')));
      _reload();
    } on ApiException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _reject(String userId, String name) async {
    final controller = TextEditingController();
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Reject $name?'),
        content: TextField(
          controller: controller,
          decoration: const InputDecoration(labelText: 'Reason (optional)'),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.of(ctx).pop(false), child: const Text('Cancel')),
          FilledButton(onPressed: () => Navigator.of(ctx).pop(true), child: const Text('Reject')),
        ],
      ),
    );
    final reason = controller.text.trim();
    controller.dispose();
    if (confirmed == true) {
      await _act(userId, 'reject', reason: reason.isEmpty ? null : reason);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Approvals')),
      body: RefreshIndicator(
        onRefresh: () async => _reload(),
        child: AsyncView<Map<String, dynamic>>(
          future: _future,
          onRetry: _reload,
          builder: (context, data) {
            final pending = (data['pendingUsers'] as List?) ?? const [];
            if (pending.isEmpty) {
              return ListView(
                children: const [
                  SizedBox(height: 80),
                  EmptyState(icon: Icons.how_to_reg_outlined, message: 'No pending sign-ups right now.'),
                ],
              );
            }
            return ListView(
              padding: const EdgeInsets.all(16),
              children: [for (final u in pending) _card(u as Map)],
            );
          },
        ),
      ),
    );
  }

  Widget _card(Map u) {
    final id = u['id']?.toString();
    final name = u['displayName']?.toString() ?? 'Student';
    final email = u['email']?.toString() ?? '';
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            SeedAvatar(seed: u['avatarSeed']?.toString(), name: name, size: 40),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(name, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w600)),
                  if (email.isNotEmpty)
                    Text(email, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 12, color: Theme.of(context).hintColor)),
                ],
              ),
            ),
            if (id != null) ...[
              IconButton(
                tooltip: 'Reject',
                onPressed: _busy ? null : () => _reject(id, name),
                icon: const Icon(Icons.close_rounded, color: Colors.red),
              ),
              FilledButton(
                onPressed: _busy ? null : () => _act(id, 'approve'),
                child: const Text('Approve'),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
