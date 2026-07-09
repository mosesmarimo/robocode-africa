import 'package:flutter/material.dart';

import '../../api/api_client.dart';
import '../../theme.dart';
import '../../widgets/common.dart';

/// Platform-admin schools/tenants: list with member counts + lifecycle actions.
/// Note: GET /admin/tenants returns a JSON array (not an object envelope).
class AdminTenantsScreen extends StatefulWidget {
  const AdminTenantsScreen({super.key});
  @override
  State<AdminTenantsScreen> createState() => _AdminTenantsScreenState();
}

class _AdminTenantsScreenState extends State<AdminTenantsScreen> {
  late Future<List<dynamic>> _future;
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<List<dynamic>> _load() =>
      ApiClient.instance.get<List<dynamic>>('/admin/tenants');

  void _reload() => setState(() => _future = _load());

  Future<void> _action(String tenantId, String action) async {
    setState(() => _busy = true);
    try {
      await ApiClient.instance.post<Map<String, dynamic>>('/admin/tenants/$tenantId/$action');
      if (!mounted) return;
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
      appBar: AppBar(title: const Text('Schools')),
      body: RefreshIndicator(
        onRefresh: () async => _reload(),
        child: AsyncView<List<dynamic>>(
          future: _future,
          onRetry: _reload,
          builder: (context, tenants) {
            if (tenants.isEmpty) {
              return ListView(children: const [SizedBox(height: 80), EmptyState(icon: Icons.apartment_outlined, message: 'No schools yet.')]);
            }
            return ListView(
              padding: const EdgeInsets.all(16),
              children: [for (final t in tenants) _card(t as Map)],
            );
          },
        ),
      ),
    );
  }

  Widget _card(Map t) {
    final id = t['id']?.toString();
    final name = t['name']?.toString() ?? 'School';
    final status = t['status']?.toString() ?? '';
    final members = ((t['_count'] as Map?)?['users'] as num?)?.toInt() ?? 0;
    final plan = ((t['subscription'] as Map?)?['plan'] as Map?)?['name']?.toString();
    return Card(
      child: ListTile(
        leading: Container(
          width: 44,
          height: 44,
          alignment: Alignment.center,
          decoration: BoxDecoration(gradient: RoboTheme.brandGradient, borderRadius: BorderRadius.circular(12)),
          child: const Icon(Icons.apartment_rounded, color: Colors.white),
        ),
        title: Text(name, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w600)),
        subtitle: Text('$members members · $status${plan == null ? '' : ' · $plan'}'),
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
                ],
              ),
      ),
    );
  }
}
