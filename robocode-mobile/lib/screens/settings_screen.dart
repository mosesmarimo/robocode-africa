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

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  @override
  void dispose() {
    _displayNameController.dispose();
    super.dispose();
  }

  Future<Map<String, dynamic>> _load() =>
      ApiClient.instance.get<Map<String, dynamic>>('/account/settings');

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
    _initialized = true;
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
