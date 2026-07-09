import 'package:flutter/material.dart';

import '../../api/api_client.dart';
import '../../widgets/common.dart';

/// School-admin domain: subdomain + custom domain (add / verify).
class SchoolDomainScreen extends StatefulWidget {
  const SchoolDomainScreen({super.key});
  @override
  State<SchoolDomainScreen> createState() => _SchoolDomainScreenState();
}

class _SchoolDomainScreenState extends State<SchoolDomainScreen> {
  late Future<Map<String, dynamic>> _future;
  final _hostname = TextEditingController();
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  @override
  void dispose() {
    _hostname.dispose();
    super.dispose();
  }

  Future<Map<String, dynamic>> _load() =>
      ApiClient.instance.get<Map<String, dynamic>>('/school/domain');

  void _reload() => setState(() => _future = _load());

  Future<void> _addDomain() async {
    final host = _hostname.text.trim().toLowerCase();
    if (host.isEmpty) return;
    setState(() => _busy = true);
    try {
      await ApiClient.instance.post<Map<String, dynamic>>('/school/domains', body: {'hostname': host});
      if (!mounted) return;
      _hostname.clear();
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Domain added. Add the DNS record, then verify.')));
      _reload();
    } on ApiException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _verify(String domainId) async {
    setState(() => _busy = true);
    try {
      await ApiClient.instance.post<Map<String, dynamic>>('/school/domains/$domainId/verify');
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
      appBar: AppBar(title: const Text('Domain')),
      body: RefreshIndicator(
        onRefresh: () async => _reload(),
        child: AsyncView<Map<String, dynamic>>(
          future: _future,
          onRetry: _reload,
          builder: (context, data) {
            final subdomain = data['subdomain']?.toString() ?? '';
            final domains = (data['domains'] as List?) ?? const [];
            return ListView(
              padding: const EdgeInsets.all(16),
              children: [
                const SectionTitle('Your subdomain'),
                const SizedBox(height: 8),
                Card(
                  child: ListTile(
                    leading: const Icon(Icons.public_rounded),
                    title: Text(subdomain.isEmpty ? '—' : subdomain),
                    subtitle: const Text('Always available'),
                  ),
                ),
                const SizedBox(height: 24),
                const SectionTitle('Custom domains'),
                const SizedBox(height: 8),
                if (domains.where((d) => (d as Map)['type'] == 'custom').isEmpty)
                  const HintCard('No custom domain yet. Add one below.')
                else
                  for (final d in domains.where((d) => (d as Map)['type'] == 'custom'))
                    _domainTile(d as Map),
                const SizedBox(height: 16),
                TextField(
                  controller: _hostname,
                  keyboardType: TextInputType.url,
                  decoration: const InputDecoration(
                    labelText: 'Add custom domain',
                    hintText: 'robotics.yourschool.edu',
                    prefixIcon: Icon(Icons.dns_outlined),
                  ),
                ),
                const SizedBox(height: 12),
                FilledButton.icon(
                  onPressed: _busy ? null : _addDomain,
                  icon: const Icon(Icons.add),
                  label: const Text('Add domain'),
                ),
                const SizedBox(height: 24),
              ],
            );
          },
        ),
      ),
    );
  }

  Widget _domainTile(Map d) {
    final id = d['id']?.toString();
    final host = d['hostname']?.toString() ?? '';
    final verified = d['verified'] == true;
    return Card(
      child: ListTile(
        leading: Icon(verified ? Icons.verified_rounded : Icons.pending_outlined,
            color: verified ? Colors.green : Colors.orange),
        title: Text(host, maxLines: 1, overflow: TextOverflow.ellipsis),
        subtitle: Text(verified ? 'Verified' : 'Pending verification'),
        trailing: (!verified && id != null)
            ? TextButton(onPressed: _busy ? null : () => _verify(id), child: const Text('Verify'))
            : null,
      ),
    );
  }
}
