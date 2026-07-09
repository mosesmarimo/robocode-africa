import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:share_plus/share_plus.dart';
import 'package:url_launcher/url_launcher.dart';

import '../api/api_client.dart';
import '../api/tracks_api.dart';
import '../models/tracks.dart';
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
  late Future<List<CertificateModel>> _certsFuture;

  @override
  void initState() {
    super.initState();
    _future = _load();
    _certsFuture = TracksApi.instance.myCertificates();
  }

  Future<Map<String, dynamic>> _load() =>
      ApiClient.instance.get<Map<String, dynamic>>('/account/profile');

  void _reload() => setState(() {
        _future = _load();
        _certsFuture = TracksApi.instance.myCertificates();
      });

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthState>();
    final user = auth.user;
    return Scaffold(
      body: RefreshIndicator(
        onRefresh: () async => _reload(),
        child: ListView(
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
              onRetry: _reload,
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
                    Card(child: ListTile(leading: const Icon(Icons.route_outlined), title: const Text('Learning Tracks'), subtitle: const Text('Curated paths that end in a certificate'), trailing: const Icon(Icons.chevron_right), onTap: () => context.push('/tracks'))),
                    Card(child: ListTile(leading: const Icon(Icons.leaderboard_outlined), title: const Text('Leaderboards'), subtitle: const Text('Rank by language & track'), trailing: const Icon(Icons.chevron_right), onTap: () => context.push('/leaderboards'))),
                    Card(child: ListTile(leading: const Icon(Icons.card_giftcard_outlined), title: const Text('Invite friends'), subtitle: const Text('Earn RoboPoints for every friend who joins'), trailing: const Icon(Icons.chevron_right), onTap: () => context.push('/invite'))),
                    Card(child: ListTile(leading: const Icon(Icons.notifications_outlined), title: const Text('Notifications'), trailing: const Icon(Icons.chevron_right), onTap: () => context.push('/notifications'))),
                    Card(child: ListTile(leading: const Icon(Icons.settings_outlined), title: const Text('Settings'), trailing: const Icon(Icons.chevron_right), onTap: () => context.push('/settings'))),
                    _certificatesSection(context),
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
      ),
    );
  }

  /// "My Certificates" — earned by completing every step of a Learning
  /// Track. Hidden entirely while loading, on error, or when empty (per the
  /// brief: only shown once the user has earned at least one).
  Widget _certificatesSection(BuildContext context) {
    return FutureBuilder<List<CertificateModel>>(
      future: _certsFuture,
      builder: (context, snap) {
        final certs = snap.data;
        if (certs == null || certs.isEmpty) return const SizedBox.shrink();
        return Padding(
          padding: const EdgeInsets.only(top: 8),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SectionTitle('My Certificates'),
              const SizedBox(height: 10),
              ...certs.map((c) => _CertificateCard(cert: c)),
            ],
          ),
        );
      },
    );
  }
}

class _CertificateCard extends StatelessWidget {
  final CertificateModel cert;
  const _CertificateCard({required this.cert});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        onTap: () => launchUrl(Uri.parse(cert.shareUrl), mode: LaunchMode.externalApplication),
        leading: Container(
          width: 44,
          height: 44,
          alignment: Alignment.center,
          decoration: const BoxDecoration(gradient: RoboTheme.brandGradient, shape: BoxShape.circle),
          child: const Text('🎓', style: TextStyle(fontSize: 20)),
        ),
        title: Text(cert.title, style: const TextStyle(fontWeight: FontWeight.w600)),
        subtitle: Text('Issued ${DateFormat.yMMMd().format(cert.issuedAt.toLocal())}'),
        trailing: IconButton(
          tooltip: 'Share certificate',
          icon: const Icon(Icons.share_rounded, color: RoboTheme.primary),
          onPressed: () => SharePlus.instance.share(ShareParams(text: cert.shareUrl)),
        ),
      ),
    );
  }
}
