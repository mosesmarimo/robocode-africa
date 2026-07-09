import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../api/social_api.dart';
import '../../models/social.dart';
import '../../state/auth.dart';
import '../../theme.dart';
import '../../widgets/common.dart';
import '../../widgets/social_widgets.dart';

/// Another user's social profile: header with avatar/stats, friend & follow
/// actions, badges, projects and their wall.
class SocialProfileScreen extends StatefulWidget {
  final String userId;
  const SocialProfileScreen({super.key, required this.userId});
  @override
  State<SocialProfileScreen> createState() => _SocialProfileScreenState();
}

class _SocialProfileScreenState extends State<SocialProfileScreen> {
  late Future<SocialProfile> _future;

  final List<Post> _posts = [];
  String? _wallCursor;
  bool _wallLoading = false;
  bool _wallLoadedOnce = false;
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    _future = _loadProfile();
  }

  Future<SocialProfile> _loadProfile() async {
    final profile = await SocialApi.instance.profile(widget.userId);
    if (profile.me.canViewWall) {
      _loadWall(reset: true);
    }
    return profile;
  }

  void _reload() {
    _wallLoadedOnce = false;
    _posts.clear();
    _wallCursor = null;
    setState(() => _future = _loadProfile());
  }

  Future<void> _loadWall({bool reset = false}) async {
    if (_wallLoading) return;
    if (!reset && _wallCursor == null) return; // no more pages — avoid re-loading page 1
    setState(() => _wallLoading = true);
    try {
      final wall = await SocialApi.instance.wall('user', widget.userId, cursor: reset ? null : _wallCursor);
      if (!mounted) return;
      setState(() {
        if (reset) _posts.clear();
        _posts.addAll(wall.posts);
        _wallCursor = wall.nextCursor;
        _wallLoadedOnce = true;
        _wallLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _wallLoading = false);
      showSocialError(context, e);
    }
  }

  Future<void> _run(Future<void> Function() op, String done) async {
    if (_busy) return;
    setState(() => _busy = true);
    try {
      await op();
      if (!mounted) return;
      showSocialMessage(context, done);
      _reload();
    } catch (e) {
      if (!mounted) return;
      showSocialError(context, e);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _toggleFollow(SocialProfile p) async {
    if (_busy) return;
    setState(() => _busy = true);
    try {
      if (p.me.following) {
        await SocialApi.instance.unfollow('user', p.user.id);
      } else {
        await SocialApi.instance.follow('user', p.user.id);
      }
      if (!mounted) return;
      _reload();
    } catch (e) {
      if (!mounted) return;
      showSocialError(context, e);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _block(SocialProfile p) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Block ${p.user.displayName}?'),
        content: const Text('They will no longer be able to interact with you. This also removes any friendship.'),
        actions: [
          TextButton(onPressed: () => Navigator.of(ctx).pop(false), child: const Text('Cancel')),
          FilledButton(onPressed: () => Navigator.of(ctx).pop(true), child: const Text('Block')),
        ],
      ),
    );
    if (confirmed != true) return;
    await _run(() => SocialApi.instance.blockUser(p.user.id), 'User blocked.');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Profile'),
        actions: [
          FutureBuilder<SocialProfile>(
            future: _future,
            builder: (context, snap) {
              final p = snap.data;
              if (p == null || p.me.isSelf) return const SizedBox.shrink();
              return PopupMenuButton<String>(
                onSelected: (v) {
                  if (v == 'block') _block(p);
                  if (v == 'report') reportContent(context, targetType: 'user', targetId: p.user.id);
                },
                itemBuilder: (_) => const [
                  PopupMenuItem(value: 'block', child: Text('Block')),
                  PopupMenuItem(value: 'report', child: Text('Report')),
                ],
              );
            },
          ),
        ],
      ),
      body: AsyncView<SocialProfile>(
        future: _future,
        onRetry: _reload,
        builder: (context, p) {
          return RefreshIndicator(
            onRefresh: () async => _reload(),
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                _header(context, p),
                const SizedBox(height: 16),
                if (!p.me.isSelf) _relationshipActions(context, p),
                if (p.followPreview.followerCount > 0) ...[
                  const SizedBox(height: 12),
                  FollowPreviewRow(
                    targetType: 'user',
                    targetId: p.user.id,
                    preview: p.followPreview,
                  ),
                ],
                const SizedBox(height: 20),
                _stats(context, p),
                if (p.bio != null && p.bio!.trim().isNotEmpty) ...[
                  const SizedBox(height: 20),
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Text(p.bio!, style: const TextStyle(fontSize: 14, height: 1.45)),
                    ),
                  ),
                ],
                if (p.badges.isNotEmpty) ...[
                  const SizedBox(height: 24),
                  const SectionTitle('Badges'),
                  const SizedBox(height: 10),
                  _badges(context, p),
                ],
                if (p.projects.isNotEmpty) ...[
                  const SizedBox(height: 24),
                  const SectionTitle('Projects'),
                  const SizedBox(height: 10),
                  ...p.projects.map((proj) => _projectCard(context, proj)),
                ],
                const SizedBox(height: 24),
                _wallSection(context, p),
                const SizedBox(height: 24),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _header(BuildContext context, SocialProfile p) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: RoboTheme.brandGradient,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        children: [
          SeedAvatar(seed: p.user.avatarSeed, name: p.user.displayName, size: 60),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(p.user.displayName,
                    style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold)),
                if (p.user.tagline != null && p.user.tagline!.trim().isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text(p.user.tagline!,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(color: Colors.white.withValues(alpha: 0.9), fontSize: 13)),
                ],
                const SizedBox(height: 6),
                Text(
                  [
                    if (p.user.schoolName != null && p.user.schoolName!.isNotEmpty) p.user.schoolName!,
                    'Level ${p.progress.level}',
                  ].join('  ·  '),
                  style: TextStyle(color: Colors.white.withValues(alpha: 0.85), fontSize: 12),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _relationshipActions(BuildContext context, SocialProfile p) {
    return Row(
      children: [
        Expanded(child: _friendButton(context, p)),
        const SizedBox(width: 10),
        Expanded(
          child: OutlinedButton.icon(
            onPressed: _busy ? null : () => _toggleFollow(p),
            icon: Icon(p.me.following ? Icons.notifications_active_rounded : Icons.notifications_none_rounded, size: 18),
            label: Text(p.me.following ? 'Following' : 'Follow'),
          ),
        ),
      ],
    );
  }

  Widget _friendButton(BuildContext context, SocialProfile p) {
    switch (p.me.friendStatus) {
      case 'friends':
        return FilledButton.tonalIcon(
          onPressed: _busy ? null : () => _run(() => SocialApi.instance.unfriend(p.user.id), 'Friend removed.'),
          icon: const Icon(Icons.how_to_reg_rounded, size: 18),
          label: const Text('Friends'),
        );
      case 'outgoing':
        // Cancelling needs the friendship request id, which the profile payload
        // doesn't carry; manage it from the Friends hub instead.
        return OutlinedButton.icon(
          onPressed: () => context.push('/social/friends'),
          icon: const Icon(Icons.schedule_rounded, size: 18),
          label: const Text('Requested'),
        );
      case 'incoming':
        // Accepting needs the request id, which the profile payload doesn't
        // carry; respond from the Friends hub.
        return FilledButton.icon(
          onPressed: () => context.push('/social/friends'),
          icon: const Icon(Icons.person_add_alt_1_rounded, size: 18),
          label: const Text('Respond'),
        );
      case 'blocked':
        return OutlinedButton.icon(
          onPressed: null,
          icon: const Icon(Icons.block_rounded, size: 18),
          label: const Text('Blocked'),
        );
      default:
        return FilledButton.icon(
          onPressed: _busy ? null : () => _run(() => SocialApi.instance.sendFriendRequest(p.user.id), 'Friend request sent!'),
          icon: const Icon(Icons.person_add_alt_1_rounded, size: 18),
          label: const Text('Add friend'),
        );
    }
  }

  Widget _stats(BuildContext context, SocialProfile p) {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 12,
      crossAxisSpacing: 12,
      childAspectRatio: 1.6,
      children: [
        StatTile(icon: Icons.bolt, label: 'RoboPoints', value: '${p.user.roboPoints}', color: RoboTheme.accent),
        StatTile(icon: Icons.people_alt_rounded, label: 'Friends', value: '${p.stats.friends}', color: RoboTheme.primary),
        StatTile(icon: Icons.favorite_rounded, label: 'Followers', value: '${p.stats.followers}', color: RoboTheme.secondary),
        StatTile(icon: Icons.memory_rounded, label: 'Projects', value: '${p.stats.projects}', color: Colors.purple),
      ],
    );
  }

  Widget _badges(BuildContext context, SocialProfile p) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: p.badges
          .map((b) => Chip(
                avatar: const Icon(Icons.workspace_premium_rounded, size: 18, color: RoboTheme.accent),
                label: Text(b.name),
              ))
          .toList(),
    );
  }

  Widget _projectCard(BuildContext context, ProfileProject proj) {
    return Card(
      child: ListTile(
        leading: Container(
          width: 40,
          height: 40,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: RoboTheme.secondary.withValues(alpha: 0.12),
            borderRadius: BorderRadius.circular(10),
          ),
          child: const Icon(Icons.memory_rounded, color: RoboTheme.secondary),
        ),
        title: Text(proj.title, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w600)),
        subtitle: Text(proj.boardType),
        trailing: const Icon(Icons.chevron_right_rounded),
        onTap: proj.id.isEmpty ? null : () => context.push('/studio/${proj.id}'),
      ),
    );
  }

  Widget _wallSection(BuildContext context, SocialProfile p) {
    final auth = context.read<AuthState>();
    final isSelf = p.me.isSelf || auth.user?.id == p.user.id;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SectionTitle('Wall'),
        const SizedBox(height: 10),
        if (!p.me.canViewWall)
          const HintCard('Become friends to see this wall.')
        else ...[
          // The viewer can post on their own wall.
          if (isSelf) ...[
            PostComposer(
              targetType: 'user',
              targetId: p.user.id,
              hintText: "What's on your mind?",
              onPosted: () => _loadWall(reset: true),
            ),
            const SizedBox(height: 12),
          ],
          if (!_wallLoadedOnce && _wallLoading)
            const Padding(padding: EdgeInsets.all(24), child: Center(child: CircularProgressIndicator()))
          else if (_posts.isEmpty)
            const HintCard('No posts yet.')
          else ...[
            ..._posts.map((post) => PostCard(
                  key: ValueKey(post.id),
                  post: post,
                  onArchived: () => setState(() => _posts.removeWhere((x) => x.id == post.id)),
                )),
            if (_wallCursor != null)
              Center(
                child: _wallLoading
                    ? const Padding(padding: EdgeInsets.all(12), child: CircularProgressIndicator())
                    : TextButton(onPressed: () => _loadWall(), child: const Text('Load more')),
              ),
          ],
        ],
      ],
    );
  }
}
