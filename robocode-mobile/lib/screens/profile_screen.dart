import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../api/api_client.dart';
import '../state/auth.dart';
import '../theme.dart';
import '../widgets/common.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});
  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  late Future<Map<String, dynamic>> _future;

  @override
  void initState() {
    super.initState();
    _future = ApiClient.instance.get<Map<String, dynamic>>('/account/profile');
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthState>();
    final user = auth.user;
    return Scaffold(
      body: ListView(
        children: [
          BrandHeader(
            title: user?.displayName ?? 'Profile',
            subtitle: user?.roleLabel,
            trailing: SeedAvatar(seed: user?.avatarSeed, name: user?.displayName ?? '?', size: 52),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: AsyncView<Map<String, dynamic>>(
              future: _future,
              builder: (context, data) {
                final badges = (data['badges'] as List?) ?? [];
                final progress = (data['progress'] as Map?) ?? {};
                final passed = data['passedCount'] ?? 0;
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    GridView.count(
                      crossAxisCount: 2,
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      mainAxisSpacing: 12,
                      crossAxisSpacing: 12,
                      childAspectRatio: 1.6,
                      children: [
                        StatTile(icon: Icons.bolt, label: 'RoboPoints', value: '${user?.roboPoints ?? 0}', color: RoboTheme.accent),
                        StatTile(icon: Icons.trending_up, label: 'Level', value: '${progress['level'] ?? user?.level ?? 1}', color: RoboTheme.primary),
                        StatTile(icon: Icons.workspace_premium, label: 'Badges', value: '${badges.length}', color: RoboTheme.secondary),
                        StatTile(icon: Icons.task_alt, label: 'Challenges', value: '$passed', color: Colors.purple),
                      ],
                    ),
                    const SizedBox(height: 20),
                    Card(child: ListTile(leading: const Icon(Icons.workspace_premium_outlined), title: const Text('Badges'), trailing: const Icon(Icons.chevron_right), onTap: () => context.push('/badges'))),
                    Card(child: ListTile(leading: const Icon(Icons.notifications_outlined), title: const Text('Notifications'), trailing: const Icon(Icons.chevron_right), onTap: () => context.push('/notifications'))),
                    Card(child: ListTile(leading: const Icon(Icons.settings_outlined), title: const Text('Settings'), trailing: const Icon(Icons.chevron_right), onTap: () => context.push('/settings'))),
                    const SizedBox(height: 12),
                    OutlinedButton.icon(
                      onPressed: () async {
                        await auth.logout();
                        if (context.mounted) context.go('/login');
                      },
                      icon: const Icon(Icons.logout),
                      label: const Text('Sign out'),
                    ),
                  ],
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
