import 'package:flutter/material.dart';

import '../../api/api_client.dart';
import '../../widgets/common.dart';

/// Platform/moderator moderation: reported content queue with resolve/dismiss.
class AdminModerationScreen extends StatefulWidget {
  const AdminModerationScreen({super.key});
  @override
  State<AdminModerationScreen> createState() => _AdminModerationScreenState();
}

class _AdminModerationScreenState extends State<AdminModerationScreen> {
  late Future<Map<String, dynamic>> _future;
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<Map<String, dynamic>> _load() =>
      ApiClient.instance.get<Map<String, dynamic>>('/admin/moderation');

  void _reload() => setState(() => _future = _load());

  Future<void> _resolve(String caseId, String action) async {
    setState(() => _busy = true);
    try {
      await ApiClient.instance
          .post<Map<String, dynamic>>('/admin/moderation/$caseId/resolve', body: {'action': action});
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
      appBar: AppBar(title: const Text('Moderation')),
      body: RefreshIndicator(
        onRefresh: () async => _reload(),
        child: AsyncView<Map<String, dynamic>>(
          future: _future,
          onRetry: _reload,
          builder: (context, data) {
            final open = (data['openCases'] as List?) ?? const [];
            final reviewing = (data['reviewingCases'] as List?) ?? const [];
            final cases = [...open, ...reviewing];
            // Index 0 = stat header, then one item per case (or a single empty
            // hint when there are none). Lazy-builds the unbounded case list.
            final header = Padding(
              padding: const EdgeInsets.only(bottom: 20),
              child: Row(
                children: [
                  Expanded(child: StatTile(icon: Icons.report_outlined, label: 'Open', value: '${open.length}')),
                  const SizedBox(width: 8),
                  Expanded(child: StatTile(icon: Icons.hourglass_bottom, label: 'Reviewing', value: '${reviewing.length}')),
                  const SizedBox(width: 8),
                  Expanded(child: StatTile(icon: Icons.check_circle_outline, label: 'Resolved', value: '${(data['resolvedCount'] as num?)?.toInt() ?? 0}')),
                ],
              ),
            );
            return ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: 1 + (cases.isEmpty ? 1 : cases.length),
              itemBuilder: (context, i) {
                if (i == 0) return header;
                if (cases.isEmpty) {
                  return const HintCard('No open reports. Nice and quiet.');
                }
                return _caseCard(cases[i - 1] as Map);
              },
            );
          },
        ),
      ),
    );
  }

  Widget _caseCard(Map c) {
    final id = c['id']?.toString();
    final targetType = c['targetType']?.toString() ?? 'content';
    final reason = c['reason']?.toString() ?? '';
    final reporter = ((c['reporter'] as Map?)?['displayName'])?.toString() ?? 'Someone';
    final status = c['status']?.toString() ?? '';
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                MiniChip(icon: Icons.label_outline, label: targetType),
                const SizedBox(width: 8),
                if (status.isNotEmpty) MiniChip(icon: Icons.flag_outlined, label: status),
              ],
            ),
            const SizedBox(height: 8),
            Text('Reported by $reporter', style: TextStyle(fontSize: 12, color: Theme.of(context).hintColor)),
            if (reason.isNotEmpty) ...[
              const SizedBox(height: 4),
              Text(reason),
            ],
            const SizedBox(height: 8),
            if (id != null)
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  TextButton(onPressed: _busy ? null : () => _resolve(id, 'dismissed'), child: const Text('Dismiss')),
                  const SizedBox(width: 8),
                  FilledButton(onPressed: _busy ? null : () => _resolve(id, 'resolved'), child: const Text('Resolve')),
                ],
              ),
          ],
        ),
      ),
    );
  }
}
