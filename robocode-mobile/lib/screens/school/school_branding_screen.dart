import 'package:flutter/material.dart';

import '../../api/api_client.dart';
import '../../widgets/common.dart';

/// School-admin branding: colours, tagline and logo URL.
class SchoolBrandingScreen extends StatefulWidget {
  const SchoolBrandingScreen({super.key});
  @override
  State<SchoolBrandingScreen> createState() => _SchoolBrandingScreenState();
}

class _SchoolBrandingScreenState extends State<SchoolBrandingScreen> {
  late Future<Map<String, dynamic>> _future;
  final _primary = TextEditingController();
  final _secondary = TextEditingController();
  final _accent = TextEditingController();
  final _tagline = TextEditingController();
  final _logoUrl = TextEditingController();
  bool _initialized = false;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _future = ApiClient.instance.get<Map<String, dynamic>>('/school/branding');
  }

  @override
  void dispose() {
    _primary.dispose();
    _secondary.dispose();
    _accent.dispose();
    _tagline.dispose();
    _logoUrl.dispose();
    super.dispose();
  }

  void _hydrate(Map<String, dynamic> data) {
    if (_initialized) return;
    final b = (data['initial'] as Map?) ?? (data['branding'] as Map?) ?? const {};
    _primary.text = b['primary']?.toString() ?? '';
    _secondary.text = b['secondary']?.toString() ?? '';
    _accent.text = b['accent']?.toString() ?? '';
    _tagline.text = b['tagline']?.toString() ?? '';
    _logoUrl.text = b['logoUrl']?.toString() ?? '';
    _initialized = true;
  }

  Color? _parseColor(String hex) {
    var h = hex.trim().replaceAll('#', '');
    if (h.length == 6) h = 'FF$h';
    if (h.length != 8) return null;
    final v = int.tryParse(h, radix: 16);
    return v == null ? null : Color(v);
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    try {
      await ApiClient.instance.post<Map<String, dynamic>>('/school/branding', body: {
        'primary': _primary.text.trim(),
        'secondary': _secondary.text.trim(),
        'accent': _accent.text.trim(),
        'tagline': _tagline.text.trim(),
        if (_logoUrl.text.trim().isNotEmpty) 'logoUrl': _logoUrl.text.trim(),
      });
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Branding saved.')));
    } on ApiException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Branding')),
      body: AsyncView<Map<String, dynamic>>(
        future: _future,
        builder: (context, data) {
          _hydrate(data);
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              _colorField('Primary colour', _primary),
              const SizedBox(height: 12),
              _colorField('Secondary colour', _secondary),
              const SizedBox(height: 12),
              _colorField('Accent colour', _accent),
              const SizedBox(height: 12),
              TextField(controller: _tagline, decoration: const InputDecoration(labelText: 'Tagline')),
              const SizedBox(height: 12),
              TextField(
                controller: _logoUrl,
                keyboardType: TextInputType.url,
                decoration: const InputDecoration(labelText: 'Logo URL (optional)', hintText: 'https://…'),
              ),
              const SizedBox(height: 20),
              FilledButton.icon(
                onPressed: _saving ? null : _save,
                icon: const Icon(Icons.save_outlined),
                label: Text(_saving ? 'Saving…' : 'Save branding'),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _colorField(String label, TextEditingController c) {
    return Row(
      children: [
        Expanded(
          child: TextField(
            controller: c,
            decoration: InputDecoration(labelText: label, hintText: '#2563FF'),
            onChanged: (_) => setState(() {}),
          ),
        ),
        const SizedBox(width: 12),
        Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: _parseColor(c.text) ?? Colors.transparent,
            border: Border.all(color: Theme.of(context).dividerColor),
            borderRadius: BorderRadius.circular(8),
          ),
        ),
      ],
    );
  }
}
