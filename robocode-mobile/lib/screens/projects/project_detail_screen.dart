import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../api/api_client.dart';
import '../../api/project_api.dart';
import '../../api/social_api.dart';
import '../../models/project.dart';
import '../../models/social.dart';
import '../../state/auth.dart';
import '../../theme.dart';
import '../../widgets/common.dart';
import '../../widgets/social_widgets.dart';

/// Project detail: header (title, kind/board, description), Open-in-Studio and
/// follow actions, follower preview, and the project's social wall.
class ProjectDetailScreen extends StatefulWidget {
  final String projectId;
  const ProjectDetailScreen({super.key, required this.projectId});
  @override
  State<ProjectDetailScreen> createState() => _ProjectDetailScreenState();
}

class _ProjectDetailScreenState extends State<ProjectDetailScreen> {
  late Future<ProjectDetail> _future;

  final List<Post> _posts = [];
  String? _wallCursor;
  bool _wallLoading = false;
  bool _wallLoadedOnce = false;
  bool _canPost = false;
  bool _following = false;
  bool _busy = false;
  bool _remixing = false;
  FollowPreview? _preview;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<ProjectDetail> _load() {
    // Fire the preview + wall requests immediately — they don't depend on the
    // project detail response, so waiting for it first only serialized three
    // round-trips that can run concurrently.
    _loadPreview();
    _loadWall(reset: true);
    return ProjectApi.instance.detail(widget.projectId);
  }

  void _reload() {
    _wallLoadedOnce = false;
    _posts.clear();
    _wallCursor = null;
    setState(() => _future = _load());
  }

  Future<void> _loadPreview() async {
    try {
      final p = await SocialApi.instance.followPreview('project', widget.projectId);
      if (!mounted) return;
      setState(() => _preview = p);
    } catch (_) {
      // preview is non-critical; ignore failures
    }
  }

  Future<void> _loadWall({bool reset = false}) async {
    if (_wallLoading) return;
    if (!reset && _wallCursor == null) return; // no more pages
    setState(() => _wallLoading = true);
    try {
      final wall = await SocialApi.instance.wall('project', widget.projectId, cursor: reset ? null : _wallCursor);
      if (!mounted) return;
      setState(() {
        if (reset) _posts.clear();
        _posts.addAll(wall.posts);
        _wallCursor = wall.nextCursor;
        _canPost = wall.canPost;
        if (wall.following != null) _following = wall.following!;
        _wallLoadedOnce = true;
        _wallLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _wallLoading = false);
      showSocialError(context, e);
    }
  }

  Future<void> _toggleFollow() async {
    if (_busy) return;
    final wasFollowing = _following;
    setState(() {
      _busy = true;
      _following = !wasFollowing; // optimistic
    });
    try {
      if (wasFollowing) {
        await SocialApi.instance.unfollow('project', widget.projectId);
      } else {
        await SocialApi.instance.follow('project', widget.projectId);
      }
      _loadPreview();
    } catch (e) {
      if (!mounted) return;
      setState(() => _following = wasFollowing); // revert
      showSocialError(context, e);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  /// Clones this project into the caller's own account, then opens the copy
  /// straight in the Studio so they can start editing it.
  Future<void> _remix() async {
    if (_remixing) return;
    setState(() => _remixing = true);
    try {
      final newId = await ProjectApi.instance.remix(widget.projectId);
      if (!mounted) return;
      context.push('/studio/$newId');
    } on ApiException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not reach the server. Check your connection.')),
      );
    } finally {
      if (mounted) setState(() => _remixing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Project')),
      body: AsyncView<ProjectDetail>(
        future: _future,
        onRetry: _reload,
        builder: (context, p) {
          return RefreshIndicator(
            onRefresh: () async => _reload(),
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                _header(context, p),
                const SizedBox(height: 14),
                _actions(context, p),
                if (_preview != null && _preview!.followerCount > 0) ...[
                  const SizedBox(height: 12),
                  FollowPreviewRow(
                    targetType: 'project',
                    targetId: widget.projectId,
                    preview: _preview!,
                  ),
                ],
                const SizedBox(height: 24),
                _wallSection(context),
                const SizedBox(height: 24),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _header(BuildContext context, ProjectDetail p) {
    final isCoding = (p.kind ?? '') == 'coding';
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: RoboTheme.brandGradient,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(isCoding ? Icons.code_rounded : Icons.memory_rounded, color: Colors.white, size: 28),
              const SizedBox(width: 10),
              Expanded(
                child: Text(p.title,
                    style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            [isCoding ? 'Coding' : 'Robotics', if (p.boardType.isNotEmpty) p.boardType].join('  ·  '),
            style: TextStyle(color: Colors.white.withValues(alpha: 0.85), fontSize: 12),
          ),
          if (p.description != null && p.description!.trim().isNotEmpty) ...[
            const SizedBox(height: 12),
            Text(p.description!,
                style: TextStyle(color: Colors.white.withValues(alpha: 0.92), fontSize: 13.5, height: 1.45)),
          ],
        ],
      ),
    );
  }

  Widget _actions(BuildContext context, ProjectDetail p) {
    final myId = context.watch<AuthState>().user?.id;
    // Remixing your own project is a no-op from the reader's point of view —
    // you already have full edit access via "Open in Studio" — so only offer
    // it for projects owned by someone else.
    final canRemix = p.ownerId != null && p.ownerId != myId;
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: FilledButton.icon(
                onPressed: () => context.push('/studio/${widget.projectId}'),
                icon: const Icon(Icons.open_in_new_rounded, size: 18),
                label: const Text('Open in Studio'),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: OutlinedButton.icon(
                onPressed: _busy ? null : _toggleFollow,
                icon: Icon(_following ? Icons.notifications_active_rounded : Icons.notifications_none_rounded, size: 18),
                label: Text(_following ? 'Following' : 'Follow'),
              ),
            ),
          ],
        ),
        if (canRemix) ...[
          const SizedBox(height: 10),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: _remixing ? null : _remix,
              icon: _remixing
                  ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
                  : const Icon(Icons.fork_right_rounded, size: 18),
              label: Text(_remixing ? 'Remixing…' : 'Remix into my projects'),
            ),
          ),
        ],
      ],
    );
  }

  Widget _wallSection(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SectionTitle('Wall'),
        const SizedBox(height: 10),
        if (_canPost) ...[
          PostComposer(
            targetType: 'project',
            targetId: widget.projectId,
            hintText: 'Share something about this project…',
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
    );
  }
}
