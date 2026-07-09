import 'dart:math';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../api/api_client.dart';
import '../models/user.dart';
import '../state/auth.dart';
import '../widgets/common.dart';

const _localeOptions = <String, String>{
  'en': 'English',
  'sn': 'Shona',
  'nd': 'Ndebele',
  'sw': 'Swahili',
  'zu': 'Zulu',
  'fr': 'French',
  'pt': 'Portuguese',
};

const _aiProviders = <String>['glm', 'deepseek', 'openai', 'custom'];

// Preset endpoints/models per provider (mirrors the web AI-model form).
const _aiPresetBaseUrls = <String, String>{
  'glm': 'https://api.z.ai/api/paas/v4',
  'deepseek': 'https://api.deepseek.com',
  'openai': 'https://api.openai.com/v1',
};
const _aiPresetModels = <String, String>{
  'glm': 'glm-5.2',
  'deepseek': 'deepseek-v4-pro',
  'openai': 'gpt-4o-mini',
};

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});
  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  late Future<Map<String, dynamic>> _future;

  final _displayNameController = TextEditingController();
  String _locale = 'en';
  String? _avatarSeed;
  String _name = '';
  String _email = '';
  String _role = '';
  String? _schoolName;

  bool _initialized = false;
  bool _saving = false;
  Map<String, String>? _fieldErrors;

  // AI model config.
  final _aiModelController = TextEditingController();
  final _aiBaseUrlController = TextEditingController();
  final _aiKeyController = TextEditingController();
  bool _aiAvailable = false;
  bool _aiCanEdit = true;
  String _aiProvider = 'glm';
  bool _aiHasKey = false;
  String _aiDefaultModel = '';
  String _aiEffProvider = '';
  String _aiEffModel = '';
  String? _aiManagedBy;
  bool _aiSaving = false;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  @override
  void dispose() {
    _displayNameController.dispose();
    _aiModelController.dispose();
    _aiBaseUrlController.dispose();
    _aiKeyController.dispose();
    super.dispose();
  }

  Future<Map<String, dynamic>> _load() async {
    final results = await Future.wait([
      ApiClient.instance.get<Map<String, dynamic>>('/account/settings'),
      ApiClient.instance
          .get<Map<String, dynamic>>('/ai/config')
          .catchError((_) => <String, dynamic>{}),
    ]);
    return {...results[0], 'aiConfig': results[1]};
  }

  void _reload() {
    _initialized = false;
    setState(() => _future = _load());
  }

  void _hydrate(Map<String, dynamic> data) {
    if (_initialized) return;
    final user = (data['user'] as Map?)?.cast<String, dynamic>() ?? {};
    _name = user['displayName']?.toString() ?? '';
    _displayNameController.text = _name;
    final rawLocale = user['locale']?.toString();
    _locale = (rawLocale != null && _localeOptions.containsKey(rawLocale)) ? rawLocale : 'en';
    _avatarSeed = user['avatarSeed']?.toString();
    _email = user['email']?.toString() ?? '';
    _role = user['role']?.toString() ?? '';
    _schoolName = data['schoolName']?.toString();

    final ai = (data['aiConfig'] as Map?)?.cast<String, dynamic>() ?? {};
    _aiAvailable = ai.isNotEmpty;
    if (_aiAvailable) {
      _aiCanEdit = ai['canEdit'] != false;
      final cfg = (ai['config'] as Map?)?.cast<String, dynamic>() ?? {};
      final eff = (ai['effective'] as Map?)?.cast<String, dynamic>() ?? {};
      final prov = cfg['provider']?.toString() ?? '';
      _aiProvider = _aiProviders.contains(prov) ? prov : (prov.isEmpty ? 'glm' : 'custom');
      _aiModelController.text = cfg['model']?.toString() ?? '';
      _aiBaseUrlController.text = cfg['baseUrl']?.toString() ?? '';
      _aiHasKey = cfg['hasKey'] == true;
      _aiDefaultModel = ai['defaultModel']?.toString() ?? '';
      _aiEffProvider = eff['provider']?.toString() ?? '';
      _aiEffModel = eff['model']?.toString() ?? '';
      _aiManagedBy = ai['schoolName']?.toString();
    }
    _initialized = true;
  }

  Future<void> _saveAi({bool reset = false}) async {
    if (_aiSaving) return;
    setState(() => _aiSaving = true);
    try {
      final Map<String, dynamic> body = reset
          ? {'clearKey': true, 'provider': '', 'baseUrl': '', 'model': ''}
          : {
              'provider': _aiProvider,
              'model': _aiModelController.text.trim(),
              'baseUrl': _aiProvider == 'custom'
                  ? _aiBaseUrlController.text.trim()
                  : (_aiPresetBaseUrls[_aiProvider] ?? ''),
              if (_aiKeyController.text.trim().isNotEmpty) 'apiKey': _aiKeyController.text.trim(),
            };
      await ApiClient.instance.put<Map<String, dynamic>>('/ai/config', body: body);
      if (!mounted) return;
      _aiKeyController.clear();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(reset ? 'AI model reset to platform default.' : 'AI model saved.')),
      );
      _reload();
    } on ApiException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not reach the server. Check your connection.')),
      );
    } finally {
      if (mounted) setState(() => _aiSaving = false);
    }
  }

  void _shuffleAvatar() {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    final rng = Random();
    final seed = List.generate(8, (_) => chars[rng.nextInt(chars.length)]).join();
    setState(() => _avatarSeed = seed);
  }

  Future<void> _save() async {
    if (_saving) return;
    setState(() {
      _saving = true;
      _fieldErrors = null;
    });
    try {
      await ApiClient.instance.put<Map<String, dynamic>>('/account/profile', body: {
        'displayName': _displayNameController.text.trim(),
        'locale': _locale,
        'avatarSeed': _avatarSeed,
      });
      if (!mounted) return;
      await context.read<AuthState>().refreshUser();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Settings saved.')),
      );
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() => _fieldErrors = e.fieldErrors);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not reach the server. Check your connection.')),
      );
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  String get _roleLabel =>
      _role.isEmpty ? '—' : (AppUser.roleLabels[_role] ?? _role);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: AsyncView<Map<String, dynamic>>(
        future: _future,
        onRetry: _reload,
        builder: (context, data) {
          _hydrate(data);
          final hint = Theme.of(context).hintColor;

          return ListView(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 40),
            children: [
              // Avatar preview + shuffle.
              Center(
                child: Column(
                  children: [
                    SeedAvatar(seed: _avatarSeed, name: _name.isEmpty ? '?' : _name, size: 84),
                    const SizedBox(height: 12),
                    OutlinedButton.icon(
                      onPressed: _saving ? null : _shuffleAvatar,
                      icon: const Icon(Icons.casino_outlined, size: 18),
                      label: const Text('Shuffle avatar'),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Display name.
              const Text('Display name', style: TextStyle(fontWeight: FontWeight.w600)),
              const SizedBox(height: 8),
              TextField(
                controller: _displayNameController,
                textInputAction: TextInputAction.done,
                decoration: InputDecoration(
                  hintText: 'Your name',
                  prefixIcon: const Icon(Icons.person_outline),
                  errorText: _fieldErrors?['displayName'],
                ),
                onChanged: (v) => setState(() => _name = v),
              ),
              const SizedBox(height: 20),

              // Locale.
              const Text('Language', style: TextStyle(fontWeight: FontWeight.w600)),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.surfaceContainerHighest.withValues(alpha: 0.5),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    value: _locale,
                    isExpanded: true,
                    icon: const Icon(Icons.language),
                    items: _localeOptions.entries
                        .map((e) => DropdownMenuItem(value: e.key, child: Text(e.value)))
                        .toList(),
                    onChanged: _saving
                        ? null
                        : (v) {
                            if (v != null) setState(() => _locale = v);
                          },
                  ),
                ),
              ),
              if (_fieldErrors?['locale'] != null)
                Padding(
                  padding: const EdgeInsets.only(top: 6, left: 12),
                  child: Text(
                    _fieldErrors!['locale']!,
                    style: TextStyle(color: Theme.of(context).colorScheme.error, fontSize: 12),
                  ),
                ),
              const SizedBox(height: 24),

              // Save.
              FilledButton.icon(
                onPressed: _saving ? null : _save,
                icon: _saving
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : const Icon(Icons.save_outlined),
                label: Text(_saving ? 'Saving...' : 'Save changes'),
              ),
              const SizedBox(height: 28),

              // AI model configuration.
              if (_aiAvailable) ...[
                const Text('AI model', style: TextStyle(fontWeight: FontWeight.w600)),
                const SizedBox(height: 8),
                if (!_aiCanEdit)
                  Card(
                    child: ListTile(
                      leading: const Icon(Icons.lock_outline),
                      title: Text('Managed by ${_aiManagedBy ?? 'your school'}'),
                      subtitle: Text(
                          'Using ${_aiEffProvider.isEmpty ? '—' : _aiEffProvider} · ${_aiEffModel.isEmpty ? '—' : _aiEffModel}'),
                    ),
                  )
                else ...[
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    decoration: BoxDecoration(
                      color: Theme.of(context).colorScheme.surfaceContainerHighest.withValues(alpha: 0.5),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<String>(
                        value: _aiProvider,
                        isExpanded: true,
                        icon: const Icon(Icons.smart_toy_outlined),
                        items: _aiProviders
                            .map((p) => DropdownMenuItem(value: p, child: Text(p)))
                            .toList(),
                        onChanged: _aiSaving
                            ? null
                            : (v) {
                                if (v == null) return;
                                setState(() {
                                  _aiProvider = v;
                                  if (v != 'custom' && _aiModelController.text.trim().isEmpty) {
                                    _aiModelController.text = _aiPresetModels[v] ?? '';
                                  }
                                });
                              },
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _aiModelController,
                    decoration: InputDecoration(
                      labelText: 'Model',
                      hintText: _aiDefaultModel.isEmpty ? 'Model name' : _aiDefaultModel,
                      prefixIcon: const Icon(Icons.memory_outlined),
                    ),
                  ),
                  if (_aiProvider == 'custom') ...[
                    const SizedBox(height: 12),
                    TextField(
                      controller: _aiBaseUrlController,
                      keyboardType: TextInputType.url,
                      decoration: const InputDecoration(
                        labelText: 'Base URL',
                        hintText: 'https://api.example.com/v1',
                        prefixIcon: Icon(Icons.link),
                      ),
                    ),
                  ],
                  const SizedBox(height: 12),
                  TextField(
                    controller: _aiKeyController,
                    obscureText: true,
                    decoration: InputDecoration(
                      labelText: 'API key',
                      hintText: _aiHasKey ? 'saved — leave blank to keep' : 'Paste your API key',
                      prefixIcon: const Icon(Icons.key_outlined),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: FilledButton.icon(
                          onPressed: _aiSaving ? null : () => _saveAi(),
                          icon: _aiSaving
                              ? const SizedBox(
                                  width: 18, height: 18,
                                  child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                              : const Icon(Icons.save_outlined),
                          label: const Text('Save AI model'),
                        ),
                      ),
                      const SizedBox(width: 10),
                      OutlinedButton(
                        onPressed: _aiSaving ? null : () => _saveAi(reset: true),
                        child: const Text('Use default'),
                      ),
                    ],
                  ),
                ],
                const SizedBox(height: 28),
              ],

              // Read-only account info.
              const Text('Account', style: TextStyle(fontWeight: FontWeight.w600)),
              const SizedBox(height: 8),
              Card(
                child: Column(
                  children: [
                    ListTile(
                      leading: const Icon(Icons.email_outlined),
                      title: const Text('Email'),
                      subtitle: Text(_email.isEmpty ? '—' : _email),
                    ),
                    const Divider(height: 1),
                    ListTile(
                      leading: const Icon(Icons.badge_outlined),
                      title: const Text('Role'),
                      subtitle: Text(_roleLabel),
                    ),
                    if (_schoolName != null && _schoolName!.isNotEmpty) ...[
                      const Divider(height: 1),
                      ListTile(
                        leading: const Icon(Icons.school_outlined),
                        title: const Text('School'),
                        subtitle: Text(_schoolName!),
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Email and role are managed by your school administrator.',
                style: TextStyle(fontSize: 12, color: hint),
              ),
            ],
          );
        },
      ),
    );
  }
}
