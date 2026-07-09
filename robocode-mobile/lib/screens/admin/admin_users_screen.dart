import 'package:flutter/material.dart';

import '../../api/api_client.dart';
import '../../widgets/common.dart';

/// Platform-admin users: searchable list with approve/suspend/reinstate/reset.
class AdminUsersScreen extends StatefulWidget {
  const AdminUsersScreen({super.key});
  @override
  State<AdminUsersScreen> createState() => _AdminUsersScreenState();
}

class _AdminUsersScreenState extends State<AdminUsersScreen> {
  late Future<Map<String, dynamic>> _future;
  final _search = TextEditingController();
  String _q = '';
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  Future<Map<String, dynamic>> _load() => ApiClient.instance
      .get<Map<String, dynamic>>('/admin/users', query: _q.isEmpty ? null : {'q': _q});

  void _reload() => setState(() => _future = _load());

  Future<void> _action(String userId, String action) async {
    setState(() => _busy = true);
    try {
      if (action == 'reset-password') {
        final res = await ApiClient.instance.post<Map<String, dynamic>>('/admin/users/$userId/reset-password');
        if (!mounted) return;
        final temp = res['temporaryPassword']?.toString();
        if (temp != null && temp.isNotEmpty) {
          await showDialog<void>(
            context: context,
            builder: (ctx) => AlertDialog(
              title: const Text('Temporary password'),
              content: SelectableText(temp, style: const TextStyle(fontFamily: 'monospace', fontSize: 18)),
              actions: [TextButton(onPressed: () => Navigator.of(ctx).pop(), child: const Text('Done'))],
            ),
          );
        }
      } else {
        await ApiClient.instance.post<Map<String, dynamic>>('/admin/users/$userId/$action');
        if (!mounted) return;
        _reload();
      }
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
      appBar: AppBar(title: const Text('Users')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: TextField(
              controller: _search,
              decoration: InputDecoration(
                hintText: 'Search by name or email',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: IconButton(icon: const Icon(Icons.arrow_forward), onPressed: () { _q = _search.text.trim(); _reload(); }),
              ),
              textInputAction: TextInputAction.search,
              onSubmitted: (v) { _q = v.trim(); _reload(); },
            ),
          ),
          Expanded(
            child: RefreshIndicator(
              onRefresh: () async => _reload(),
              child: AsyncView<Map<String, dynamic>>(
                future: _future,
                onRetry: _reload,
                builder: (context, data) {
                  final users = (data['users'] as List?) ?? const [];
                  if (users.isEmpty) {
                    return ListView(children: const [SizedBox(height: 80), EmptyState(icon: Icons.person_off_outlined, message: 'No users found.')]);
                  }
                  return ListView.builder(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                    itemCount: users.length,
                    itemBuilder: (context, i) => _card(users[i] as Map),
                  );
                },
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _card(Map u) {
    final id = u['id']?.toString();
    final name = u['displayName']?.toString() ?? 'User';
    final status = u['status']?.toString() ?? '';
    final role = u['role']?.toString() ?? '';
    return Card(
      child: ListTile(
        leading: SeedAvatar(seed: u['avatarSeed']?.toString(), name: name, size: 38),
        title: Text(name, maxLines: 1, overflow: TextOverflow.ellipsis),
        subtitle: Text('$role · $status'),
        trailing: id == null
            ? null
            : PopupMenuButton<String>(
                enabled: !_busy,
                onSelected: (v) => _action(id, v),
                itemBuilder: (_) => [
                  if (status == 'pending') const PopupMenuItem(value: 'approve', child: Text('Approve')),
                  if (status == 'suspended')
                    const PopupMenuItem(value: 'reinstate', child: Text('Reinstate'))
                  else
                    const PopupMenuItem(value: 'suspend', child: Text('Suspend')),
                  const PopupMenuItem(value: 'reset-password', child: Text('Reset password')),
                ],
              ),
      ),
    );
  }
}
