import 'package:flutter/material.dart';

import '../../api/api_client.dart';
import '../../widgets/common.dart';

/// Platform-admin approvals: pending user requests + pending school applications.
class AdminApprovalsScreen extends StatefulWidget {
  const AdminApprovalsScreen({super.key});
  @override
  State<AdminApprovalsScreen> createState() => _AdminApprovalsScreenState();
}

class _AdminApprovalsScreenState extends State<AdminApprovalsScreen> {
  late Future<Map<String, dynamic>> _future;
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<Map<String, dynamic>> _load() =>
      ApiClient.instance.get<Map<String, dynamic>>('/admin/approvals');

  void _reload() => setState(() => _future = _load());

  Future<void> _post(String path, {String? reason}) async {
    setState(() => _busy = true);
    try {
      await ApiClient.instance.post<Map<String, dynamic>>(path, body: reason == null ? null : {'reason': reason});
      if (!mounted) return;
      _reload();
    } on ApiException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _rejectUser(String userId, String name) async {
    final controller = TextEditingController();
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Reject $name?'),
        content: TextField(controller: controller, decoration: const InputDecoration(labelText: 'Reason (optional)')),
        actions: [
          TextButton(onPressed: () => Navigator.of(ctx).pop(false), child: const Text('Cancel')),
          FilledButton(onPressed: () => Navigator.of(ctx).pop(true), child: const Text('Reject')),
        ],
      ),
    );
    final reason = controller.text.trim();
    controller.dispose();
    if (ok == true) {
      await _post('/admin/users/$userId/reject', reason: reason.isEmpty ? null : reason);
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
            final users = (data['pendingRequests'] as List?) ?? const [];
            final tenants = (data['pendingTenants'] as List?) ?? const [];
            return ListView(
              padding: const EdgeInsets.all(16),
              children: [
                SectionTitle('Pending users (${users.length})'),
                const SizedBox(height: 8),
                if (users.isEmpty)
                  const HintCard('No pending user requests.')
                else
                  for (final r in users) _userCard(r as Map),
                const SizedBox(height: 24),
                SectionTitle('Pending schools (${tenants.length})'),
                const SizedBox(height: 8),
                if (tenants.isEmpty)
                  const HintCard('No pending school applications.')
                else
                  for (final t in tenants) _tenantCard(t as Map),
                const SizedBox(height: 24),
              ],
            );
          },
        ),
      ),
    );
  }

  Widget _userCard(Map r) {
    final user = (r['user'] as Map?) ?? r;
    final id = user['id']?.toString();
    final name = user['displayName']?.toString() ?? 'User';
    final email = user['email']?.toString() ?? '';
    final role = user['role']?.toString() ?? '';
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(name, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w600)),
                  Text('$email${role.isEmpty ? '' : ' · $role'}',
                      maxLines: 1, overflow: TextOverflow.ellipsis,
                      style: TextStyle(fontSize: 12, color: Theme.of(context).hintColor)),
                ],
              ),
            ),
            if (id != null) ...[
              IconButton(
                tooltip: 'Reject',
                onPressed: _busy ? null : () => _rejectUser(id, name),
                icon: const Icon(Icons.close_rounded, color: Colors.red),
              ),
              FilledButton(onPressed: _busy ? null : () => _post('/admin/users/$id/approve'), child: const Text('Approve')),
            ],
          ],
        ),
      ),
    );
  }

  Widget _tenantCard(Map t) {
    final id = t['id']?.toString();
    final name = t['name']?.toString() ?? 'School';
    return Card(
      child: ListTile(
        leading: const Icon(Icons.apartment_rounded),
        title: Text(name, maxLines: 1, overflow: TextOverflow.ellipsis),
        subtitle: Text(t['slug']?.toString() ?? ''),
        trailing: id == null
            ? null
            : FilledButton(onPressed: _busy ? null : () => _post('/admin/tenants/$id/approve'), child: const Text('Approve')),
      ),
    );
  }
}
