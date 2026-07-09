import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../api/api_client.dart';
import '../api/social_api.dart';
import '../models/social.dart';
import '../theme.dart';
import 'common.dart';

/// Shared snackbar helpers so every social screen surfaces errors identically
/// to the rest of the app.
void showSocialError(BuildContext context, Object error) {
  final msg = error is ApiException
      ? error.message
      : 'Could not reach the server. Check your connection.';
  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
}

void showSocialMessage(BuildContext context, String message) {
  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
}

/// A post card with author header, body, project attachments, like/comment
/// actions and an overflow menu (archive for authors/admins/staff, otherwise
/// report). Likes are toggled optimistically against the backend.
///
/// [showContext] renders the originating page chip (used in the global feed).
class PostCard extends StatefulWidget {
  final Post post;
  final bool showContext;

  /// Called after a successful archive so the host list can drop the post.
  final VoidCallback? onArchived;

  /// Called after a comment is added so the host can refresh the count.
  final VoidCallback? onChanged;

  const PostCard({
    super.key,
    required this.post,
    this.showContext = false,
    this.onArchived,
    this.onChanged,
  });

  @override
  State<PostCard> createState() => _PostCardState();
}

class _PostCardState extends State<PostCard> {
  late bool _liked;
  late int _likeCount;
  late int _commentCount;
  bool _likeBusy = false;

  @override
  void initState() {
    super.initState();
    _liked = widget.post.likedByMe;
    _likeCount = widget.post.likeCount;
    _commentCount = widget.post.commentCount;
  }

  Future<void> _toggleLike() async {
    if (_likeBusy) return;
    setState(() {
      _likeBusy = true;
      // Optimistic flip.
      _liked = !_liked;
      _likeCount += _liked ? 1 : -1;
    });
    try {
      final res = await SocialApi.instance.toggleLike(widget.post.id);
      if (!mounted) return;
      setState(() {
        _liked = res['liked'] == true;
        _likeCount = (res['likeCount'] as num?)?.toInt() ?? _likeCount;
      });
    } catch (e) {
      if (!mounted) return;
      // Roll back the optimistic update.
      setState(() {
        _liked = !_liked;
        _likeCount += _liked ? 1 : -1;
      });
      showSocialError(context, e);
    } finally {
      if (mounted) setState(() => _likeBusy = false);
    }
  }

  Future<void> _openComments() async {
    final added = await showCommentSheet(context, widget.post);
    if (added == true && mounted) {
      setState(() => _commentCount += 1);
      widget.onChanged?.call();
    }
  }

  Future<void> _archive() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Archive post?'),
        content: const Text(
            'Archiving hides this post from everyone. It is retained but can no longer be seen.'),
        actions: [
          TextButton(onPressed: () => Navigator.of(ctx).pop(false), child: const Text('Cancel')),
          FilledButton(onPressed: () => Navigator.of(ctx).pop(true), child: const Text('Archive')),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;
    try {
      await SocialApi.instance.archivePost(widget.post.id);
      if (!mounted) return;
      showSocialMessage(context, 'Post archived.');
      widget.onArchived?.call();
    } catch (e) {
      if (!mounted) return;
      showSocialError(context, e);
    }
  }

  Future<void> _report() => reportContent(context, targetType: 'post', targetId: widget.post.id);

  @override
  Widget build(BuildContext context) {
    final post = widget.post;
    final hint = Theme.of(context).hintColor;

    return Card(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(14, 12, 6, 8),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Author header.
            Row(
              children: [
                GestureDetector(
                  onTap: () => context.push('/social/users/${post.author.id}'),
                  child: SeedAvatar(seed: post.author.avatarSeed, name: post.author.displayName, size: 40),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Flexible(
                            child: GestureDetector(
                              onTap: () => context.push('/social/users/${post.author.id}'),
                              child: Text(
                                post.author.displayName,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
                              ),
                            ),
                          ),
                          if (post.status == 'blocked') ...[
                            const SizedBox(width: 6),
                            const MiniChip(icon: Icons.shield_outlined, label: 'Under review', color: RoboTheme.accent),
                          ],
                        ],
                      ),
                      Row(
                        children: [
                          if (post.createdAt != null)
                            Text(relativeTime(post.createdAt!), style: TextStyle(fontSize: 12, color: hint)),
                          if (widget.showContext && post.context != null) ...[
                            Text('  ·  ', style: TextStyle(fontSize: 12, color: hint)),
                            Flexible(
                              child: GestureDetector(
                                onTap: () => _openContext(context, post.context!),
                                child: Text(
                                  post.context!.name,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(
                                      fontSize: 12, color: RoboTheme.primary, fontWeight: FontWeight.w600),
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
                    ],
                  ),
                ),
                _overflowMenu(),
              ],
            ),
            if (post.body.trim().isNotEmpty) ...[
              const SizedBox(height: 10),
              Padding(
                padding: const EdgeInsets.only(right: 8),
                child: Text(post.body, style: const TextStyle(fontSize: 15, height: 1.4)),
              ),
            ],
            // Project attachments.
            for (final a in post.attachments) ...[
              const SizedBox(height: 10),
              _attachmentTile(context, a),
            ],
            const SizedBox(height: 4),
            // Action bar.
            Row(
              children: [
                _actionButton(
                  icon: _liked ? Icons.favorite_rounded : Icons.favorite_border_rounded,
                  label: _likeCount == 0 ? 'Like' : '$_likeCount',
                  color: _liked ? Colors.red.shade500 : hint,
                  onTap: _likeBusy ? null : _toggleLike,
                ),
                _actionButton(
                  icon: Icons.mode_comment_outlined,
                  label: _commentCount == 0 ? 'Comment' : '$_commentCount',
                  color: hint,
                  onTap: _openComments,
                ),
              ],
            ),
            // Inline recent comments preview.
            if (post.recentComments.isNotEmpty) ...[
              const Divider(height: 8),
              for (final c in post.recentComments.take(2)) _recentComment(context, c),
              if (_commentCount > post.recentComments.length || post.recentComments.length > 2)
                TextButton(
                  onPressed: _openComments,
                  style: TextButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 8)),
                  child: Text('View all $_commentCount comments'),
                ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _overflowMenu() {
    final canArchive = widget.post.canArchive;
    return PopupMenuButton<String>(
      icon: Icon(Icons.more_horiz_rounded, color: Theme.of(context).hintColor),
      onSelected: (v) {
        if (v == 'archive') _archive();
        if (v == 'report') _report();
      },
      itemBuilder: (_) => [
        if (canArchive)
          const PopupMenuItem(
            value: 'archive',
            child: ListTile(
              dense: true,
              contentPadding: EdgeInsets.zero,
              leading: Icon(Icons.archive_outlined),
              title: Text('Archive'),
            ),
          ),
        const PopupMenuItem(
          value: 'report',
          child: ListTile(
            dense: true,
            contentPadding: EdgeInsets.zero,
            leading: Icon(Icons.flag_outlined),
            title: Text('Report'),
          ),
        ),
      ],
    );
  }

  Widget _recentComment(BuildContext context, PostComment c) {
    return Padding(
      padding: const EdgeInsets.only(top: 6, right: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SeedAvatar(seed: c.author.avatarSeed, name: c.author.displayName, size: 26),
          const SizedBox(width: 8),
          Expanded(
            child: RichText(
              text: TextSpan(
                style: DefaultTextStyle.of(context).style.copyWith(fontSize: 13, height: 1.35),
                children: [
                  TextSpan(
                      text: '${c.author.displayName}  ',
                      style: const TextStyle(fontWeight: FontWeight.w700)),
                  TextSpan(text: c.body),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _openContext(BuildContext context, FeedContext ctx) {
    switch (ctx.type) {
      case 'group':
        context.push('/social/groups/${ctx.id}');
        break;
      case 'user':
        context.push('/social/users/${ctx.id}');
        break;
      case 'project':
        context.push('/studio/${ctx.id}');
        break;
    }
  }
}

Widget _attachmentTile(BuildContext context, PostAttachment a) {
  return InkWell(
    onTap: a.projectId.isEmpty ? null : () => context.push('/studio/${a.projectId}'),
    borderRadius: BorderRadius.circular(12),
    child: Container(
      padding: const EdgeInsets.all(12),
      margin: const EdgeInsets.only(right: 8),
      decoration: BoxDecoration(
        color: RoboTheme.secondary.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: RoboTheme.secondary.withValues(alpha: 0.2)),
      ),
      child: Row(
        children: [
          const Icon(Icons.memory_rounded, color: RoboTheme.secondary),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(a.title ?? 'Project',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontWeight: FontWeight.w600)),
                if (a.board != null && a.board!.trim().isNotEmpty)
                  Text(a.board!, style: TextStyle(fontSize: 12, color: Theme.of(context).hintColor)),
              ],
            ),
          ),
          Icon(Icons.chevron_right_rounded, color: Theme.of(context).hintColor),
        ],
      ),
    ),
  );
}

Widget _actionButton({
  required IconData icon,
  required String label,
  required Color color,
  required VoidCallback? onTap,
}) {
  return TextButton.icon(
    onPressed: onTap,
    style: TextButton.styleFrom(foregroundColor: color),
    icon: Icon(icon, size: 20, color: color),
    label: Text(label, style: TextStyle(color: color, fontWeight: FontWeight.w600)),
  );
}

/// Inline composer for creating a post on a wall. Calls back with the created
/// [Post]'s id is not needed — the host simply reloads the wall on success.
class PostComposer extends StatefulWidget {
  final String targetType;
  final String targetId;
  final String hintText;

  /// Called after a post is created (approved or held for review) so the host
  /// can reload its wall.
  final VoidCallback onPosted;

  const PostComposer({
    super.key,
    required this.targetType,
    required this.targetId,
    required this.onPosted,
    this.hintText = 'Share something…',
  });

  @override
  State<PostComposer> createState() => _PostComposerState();
}

class _PostComposerState extends State<PostComposer> {
  final _ctrl = TextEditingController();
  bool _busy = false;

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final body = _ctrl.text.trim();
    if (body.isEmpty || _busy) return;
    setState(() => _busy = true);
    try {
      final res = await SocialApi.instance.createPost(
        targetType: widget.targetType,
        targetId: widget.targetId,
        body: body,
      );
      if (!mounted) return;
      _ctrl.clear();
      FocusScope.of(context).unfocus();
      final status = res['status']?.toString();
      showSocialMessage(
        context,
        status == 'blocked'
            ? 'Your post was held for review by our safety filter.'
            : 'Posted!',
      );
      widget.onPosted();
    } catch (e) {
      if (!mounted) return;
      showSocialError(context, e);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(12, 10, 10, 10),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Expanded(
              child: TextField(
                controller: _ctrl,
                minLines: 1,
                maxLines: 5,
                textInputAction: TextInputAction.newline,
                decoration: InputDecoration(hintText: widget.hintText),
              ),
            ),
            const SizedBox(width: 8),
            SizedBox(
              height: 50,
              child: FilledButton(
                onPressed: _busy ? null : _submit,
                style: FilledButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 16)),
                child: _busy
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : const Icon(Icons.send_rounded),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Opens the comment sheet for [post]. Resolves to `true` if at least one
/// comment was added (so the caller can bump its comment count).
Future<bool?> showCommentSheet(BuildContext context, Post post) {
  return showModalBottomSheet<bool>(
    context: context,
    isScrollControlled: true,
    showDragHandle: true,
    builder: (_) => _CommentSheet(post: post),
  );
}

class _CommentSheet extends StatefulWidget {
  final Post post;
  const _CommentSheet({required this.post});

  @override
  State<_CommentSheet> createState() => _CommentSheetState();
}

class _CommentSheetState extends State<_CommentSheet> {
  final _ctrl = TextEditingController();
  final List<PostComment> _comments = [];
  String? _cursor;
  bool _loading = true;
  bool _loadingMore = false;
  bool _sending = false;
  bool _added = false;
  Object? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final page = await SocialApi.instance.comments(widget.post.id);
      if (!mounted) return;
      setState(() {
        _comments
          ..clear()
          ..addAll(page.comments);
        _cursor = page.nextCursor;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e;
        _loading = false;
      });
    }
  }

  Future<void> _loadMore() async {
    if (_loadingMore || _cursor == null) return;
    setState(() => _loadingMore = true);
    try {
      final page = await SocialApi.instance.comments(widget.post.id, cursor: _cursor);
      if (!mounted) return;
      setState(() {
        _comments.addAll(page.comments);
        _cursor = page.nextCursor;
        _loadingMore = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _loadingMore = false);
      showSocialError(context, e);
    }
  }

  Future<void> _send() async {
    final body = _ctrl.text.trim();
    if (body.isEmpty || _sending) return;
    setState(() => _sending = true);
    try {
      final res = await SocialApi.instance.addComment(widget.post.id, body);
      if (!mounted) return;
      _ctrl.clear();
      FocusScope.of(context).unfocus();
      _added = true;
      final status = res['status']?.toString();
      if (status == 'blocked') {
        showSocialMessage(context, 'Your comment was held for review by our safety filter.');
      } else {
        // Reload to show the newly added comment in order.
        await _load();
      }
    } catch (e) {
      if (!mounted) return;
      showSocialError(context, e);
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  Future<void> _archive(PostComment c) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Archive comment?'),
        content: const Text('Archiving hides this comment from everyone but retains it.'),
        actions: [
          TextButton(onPressed: () => Navigator.of(ctx).pop(false), child: const Text('Cancel')),
          FilledButton(onPressed: () => Navigator.of(ctx).pop(true), child: const Text('Archive')),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;
    try {
      await SocialApi.instance.archiveComment(c.id);
      if (!mounted) return;
      setState(() => _comments.removeWhere((x) => x.id == c.id));
      showSocialMessage(context, 'Comment archived.');
    } catch (e) {
      if (!mounted) return;
      showSocialError(context, e);
    }
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;
    // Hand back whether a comment was added when the sheet is dismissed (drag,
    // back gesture or scrim tap) so the host can bump its comment count.
    return PopScope<bool>(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) return;
        Navigator.of(context).pop(_added);
      },
      child: Padding(
        padding: EdgeInsets.only(bottom: bottomInset),
        child: SizedBox(
          height: MediaQuery.of(context).size.height * 0.8,
          child: Column(
            children: [
              const Padding(
                padding: EdgeInsets.fromLTRB(20, 0, 20, 8),
                child: Align(alignment: Alignment.centerLeft, child: SectionTitle('Comments')),
              ),
              const Divider(height: 1),
              Expanded(child: _body(context)),
              const Divider(height: 1),
              _composer(context),
            ],
          ),
        ),
      ),
    );
  }

  Widget _body(BuildContext context) {
    if (_loading) {
      return const Center(child: Padding(padding: EdgeInsets.all(40), child: CircularProgressIndicator()));
    }
    if (_error != null) {
      final msg = _error is ApiException ? (_error as ApiException).message : 'Something went wrong.';
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.cloud_off_rounded, size: 40, color: Colors.grey),
              const SizedBox(height: 12),
              Text(msg, textAlign: TextAlign.center),
              const SizedBox(height: 16),
              FilledButton.tonal(onPressed: _load, child: const Text('Retry')),
            ],
          ),
        ),
      );
    }
    if (_comments.isEmpty) {
      return const EmptyState(icon: Icons.mode_comment_outlined, message: 'No comments yet. Be the first!');
    }
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: _comments.length + (_cursor != null ? 1 : 0),
      separatorBuilder: (context, index) => const SizedBox(height: 14),
      itemBuilder: (context, i) {
        if (i >= _comments.length) {
          return Center(
            child: _loadingMore
                ? const Padding(padding: EdgeInsets.all(8), child: CircularProgressIndicator())
                : TextButton(onPressed: _loadMore, child: const Text('Load more')),
          );
        }
        return _commentRow(context, _comments[i]);
      },
    );
  }

  Widget _commentRow(BuildContext context, PostComment c) {
    final hint = Theme.of(context).hintColor;
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        GestureDetector(
          onTap: () => context.push('/social/users/${c.author.id}'),
          child: SeedAvatar(seed: c.author.avatarSeed, name: c.author.displayName, size: 34),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(c.author.displayName,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
                  ),
                  if (c.createdAt != null)
                    Text(relativeTime(c.createdAt!), style: TextStyle(fontSize: 11, color: hint)),
                  PopupMenuButton<String>(
                    padding: EdgeInsets.zero,
                    iconSize: 18,
                    icon: Icon(Icons.more_horiz_rounded, color: hint, size: 18),
                    onSelected: (v) {
                      if (v == 'archive') _archive(c);
                      if (v == 'report') {
                        reportContent(context, targetType: 'comment', targetId: c.id);
                      }
                    },
                    itemBuilder: (_) => [
                      if (c.canArchive)
                        const PopupMenuItem(value: 'archive', child: Text('Archive')),
                      const PopupMenuItem(value: 'report', child: Text('Report')),
                    ],
                  ),
                ],
              ),
              Text(c.body, style: const TextStyle(fontSize: 14, height: 1.35)),
            ],
          ),
        ),
      ],
    );
  }

  Widget _composer(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 10, 12, 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Expanded(
            child: TextField(
              controller: _ctrl,
              minLines: 1,
              maxLines: 4,
              textInputAction: TextInputAction.newline,
              decoration: const InputDecoration(hintText: 'Add a comment…'),
            ),
          ),
          const SizedBox(width: 8),
          SizedBox(
            height: 50,
            child: FilledButton(
              onPressed: _sending ? null : _send,
              style: FilledButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 16)),
              child: _sending
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : const Icon(Icons.send_rounded),
            ),
          ),
        ],
      ),
    );
  }
}

/// A tappable "Followed by …" preview row built from a screen's [FollowPreview].
///
/// Renders stacked avatars of the viewer's own friends who follow the target,
/// plus a phrase like "Followed by Ada and 3 others you know · 240 followers"
/// (falling back to just "240 followers" when no friends follow). Tapping opens
/// the full [showFollowersSheet] list. Renders nothing when [preview] is empty
/// (no followers) — hosts may also guard on `followerCount > 0`.
class FollowPreviewRow extends StatelessWidget {
  final String targetType; // user | project | group
  final String targetId;
  final FollowPreview preview;

  const FollowPreviewRow({
    super.key,
    required this.targetType,
    required this.targetId,
    required this.preview,
  });

  /// Builds the "Followed by {names} you know" phrase, or null when no friends
  /// follow the target. Mirrors the web frontend's wording exactly.
  String? _knownPhrase() {
    if (preview.friendFollowerCount <= 0) return null;
    final names = preview.friendFollowers.map((u) => u.displayName.split(' ').first).toList();
    final shown = names.take(2).toList();
    final extra = preview.friendFollowerCount - shown.length;
    final String list;
    if (extra > 0) {
      list = '${shown.join(', ')} and $extra other${extra == 1 ? '' : 's'}';
    } else if (shown.length == 2) {
      list = '${shown[0]} and ${shown[1]}';
    } else if (shown.isNotEmpty) {
      list = shown[0];
    } else {
      // friendFollowerCount > 0 but no sample avatars came back.
      list = '$extra other${extra == 1 ? '' : 's'}';
    }
    return 'Followed by $list you know';
  }

  @override
  Widget build(BuildContext context) {
    if (preview.followerCount <= 0) return const SizedBox.shrink();
    final hint = Theme.of(context).hintColor;
    final followerLabel =
        '${preview.followerCount} ${preview.followerCount == 1 ? 'follower' : 'followers'}';
    final knownPhrase = _knownPhrase();
    final avatars = preview.friendFollowers.take(4).toList();

    return InkWell(
      onTap: () => showFollowersSheet(context, targetType: targetType, targetId: targetId),
      borderRadius: BorderRadius.circular(12),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 6),
        child: Row(
          children: [
            if (avatars.isNotEmpty) ...[
              SizedBox(
                height: 28,
                width: 28.0 + (avatars.length - 1) * 18.0,
                child: Stack(
                  children: [
                    for (var i = 0; i < avatars.length; i++)
                      Positioned(
                        left: i * 18.0,
                        child: Container(
                          decoration: const BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.fromBorderSide(BorderSide(color: Colors.white, width: 2)),
                          ),
                          child: SeedAvatar(
                            seed: avatars[i].avatarSeed,
                            name: avatars[i].displayName,
                            size: 24,
                          ),
                        ),
                      ),
                  ],
                ),
              ),
              const SizedBox(width: 10),
            ],
            Expanded(
              child: knownPhrase != null
                  ? RichText(
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      text: TextSpan(
                        style: DefaultTextStyle.of(context).style.copyWith(fontSize: 13, height: 1.3),
                        children: [
                          TextSpan(text: knownPhrase, style: const TextStyle(fontWeight: FontWeight.w600)),
                          TextSpan(text: '  ·  $followerLabel', style: TextStyle(color: hint)),
                        ],
                      ),
                    )
                  : Text(followerLabel, style: TextStyle(fontSize: 13, color: hint)),
            ),
            Icon(Icons.chevron_right_rounded, size: 20, color: hint),
          ],
        ),
      ),
    );
  }
}

/// Opens the full followers list for [targetType]/[targetId] as a modal bottom
/// sheet. Friends are shown first under a "People you know" header (each with a
/// "Friend" chip), then everyone else. Each row taps through to the user's
/// profile and exposes the standard friend/follow actions.
Future<void> showFollowersSheet(
  BuildContext context, {
  required String targetType,
  required String targetId,
}) {
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    showDragHandle: true,
    builder: (_) => _FollowersSheet(targetType: targetType, targetId: targetId),
  );
}

class _FollowersSheet extends StatefulWidget {
  final String targetType;
  final String targetId;
  const _FollowersSheet({required this.targetType, required this.targetId});

  @override
  State<_FollowersSheet> createState() => _FollowersSheetState();
}

class _FollowersSheetState extends State<_FollowersSheet> {
  late Future<FollowersResult> _future;

  @override
  void initState() {
    super.initState();
    _future = SocialApi.instance.followersOf(widget.targetType, widget.targetId);
  }

  void _reload() {
    setState(() {
      _future = SocialApi.instance.followersOf(widget.targetType, widget.targetId);
    });
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: MediaQuery.of(context).size.height * 0.8,
      child: Column(
        children: [
          const Padding(
            padding: EdgeInsets.fromLTRB(20, 0, 20, 8),
            child: Align(alignment: Alignment.centerLeft, child: SectionTitle('Followers')),
          ),
          const Divider(height: 1),
          Expanded(
            child: AsyncView<FollowersResult>(
              future: _future,
              onRetry: _reload,
              builder: (context, data) {
                if (data.followers.isEmpty) {
                  return const EmptyState(icon: Icons.people_outline_rounded, message: 'No followers yet.');
                }
                final friends = data.followers.where((f) => f.isFriend).toList();
                final others = data.followers.where((f) => !f.isFriend).toList();
                return ListView(
                  padding: const EdgeInsets.fromLTRB(12, 8, 12, 24),
                  children: [
                    if (friends.isNotEmpty) ...[
                      const Padding(
                        padding: EdgeInsets.fromLTRB(4, 4, 4, 6),
                        child: SectionTitle('People you know'),
                      ),
                      ...friends.map((f) => _FollowerRow(entry: f, onChanged: _reload)),
                    ],
                    if (others.isNotEmpty) ...[
                      if (friends.isNotEmpty)
                        const Padding(
                          padding: EdgeInsets.fromLTRB(4, 16, 4, 6),
                          child: SectionTitle('Everyone else'),
                        ),
                      ...others.map((f) => _FollowerRow(entry: f, onChanged: _reload)),
                    ],
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

/// A single follower row inside [showFollowersSheet]: avatar + name (with a
/// "Friend" chip for mutuals), tapping the body opens the profile, and trailing
/// friend/follow actions mirror the rest of the social UI.
class _FollowerRow extends StatefulWidget {
  final FollowerEntry entry;

  /// Called after a friend-request action so the sheet can reload and re-bucket.
  final VoidCallback onChanged;

  const _FollowerRow({required this.entry, required this.onChanged});

  @override
  State<_FollowerRow> createState() => _FollowerRowState();
}

class _FollowerRowState extends State<_FollowerRow> {
  bool _busy = false;

  FollowerEntry get _e => widget.entry;

  Future<void> _addFriend() async {
    if (_busy) return;
    setState(() => _busy = true);
    try {
      await SocialApi.instance.sendFriendRequest(_e.user.id);
      if (!mounted) return;
      showSocialMessage(context, 'Friend request sent!');
      widget.onChanged();
    } catch (err) {
      if (!mounted) return;
      showSocialError(context, err);
      setState(() => _busy = false);
    }
  }

  Future<void> _toggleFollow() async {
    if (_busy) return;
    setState(() => _busy = true);
    try {
      if (_e.following) {
        await SocialApi.instance.unfollow('user', _e.user.id);
      } else {
        await SocialApi.instance.follow('user', _e.user.id);
      }
      if (!mounted) return;
      widget.onChanged();
    } catch (err) {
      if (!mounted) return;
      showSocialError(context, err);
      setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final e = _e;
    final hint = Theme.of(context).hintColor;
    final isSelf = e.friendStatus == 'self';
    final sub = [
      if (e.user.schoolName != null && e.user.schoolName!.isNotEmpty) e.user.schoolName! else 'RoboCode',
      'Level ${e.user.level}',
    ].join('  ·  ');

    return Card(
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
        leading: SeedAvatar(seed: e.user.avatarSeed, name: e.user.displayName, size: 44),
        title: Row(
          children: [
            Flexible(
              child: Text(e.user.displayName,
                  maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w600)),
            ),
            if (e.isFriend) ...[
              const SizedBox(width: 6),
              const MiniChip(icon: Icons.how_to_reg_rounded, label: 'Friend', color: RoboTheme.secondary),
            ],
          ],
        ),
        subtitle: Text(sub, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(color: hint)),
        trailing: isSelf ? null : _trailing(),
        onTap: () => context.push('/social/users/${e.user.id}'),
      ),
    );
  }

  Widget _trailing() {
    final e = _e;
    final children = <Widget>[];

    // Friend action (only meaningful for non-friends with no pending request).
    switch (e.friendStatus) {
      case 'none':
        children.add(IconButton.filledTonal(
          tooltip: 'Add friend',
          visualDensity: VisualDensity.compact,
          icon: const Icon(Icons.person_add_alt_1_rounded, size: 18),
          onPressed: _busy ? null : _addFriend,
        ));
        break;
      case 'outgoing':
        children.add(const MiniChip(icon: Icons.schedule_rounded, label: 'Requested', color: RoboTheme.accent));
        break;
      case 'incoming':
        children.add(TextButton(
          onPressed: () => context.push('/social/friends'),
          child: const Text('Respond'),
        ));
        break;
      // 'friends' and 'blocked' show no friend action here.
    }

    // Follow toggle.
    children.add(const SizedBox(width: 4));
    children.add(IconButton(
      tooltip: e.following ? 'Following' : 'Follow',
      visualDensity: VisualDensity.compact,
      color: e.following ? RoboTheme.primary : Theme.of(context).hintColor,
      icon: Icon(e.following ? Icons.notifications_active_rounded : Icons.notifications_none_rounded, size: 20),
      onPressed: _busy ? null : _toggleFollow,
    ));

    return Row(mainAxisSize: MainAxisSize.min, children: children);
  }
}

/// Shows a report dialog (reason picker) and submits a report for [targetType]/
/// [targetId]. Used by post/comment overflow menus and profile screens.
Future<void> reportContent(
  BuildContext context, {
  required String targetType,
  required String targetId,
}) async {
  const reasons = <String>[
    'Bullying or harassment',
    'Inappropriate content',
    'Spam',
    'Hate speech',
    'Something else',
  ];
  final reason = await showModalBottomSheet<String>(
    context: context,
    showDragHandle: true,
    builder: (ctx) => SafeArea(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Padding(
            padding: EdgeInsets.fromLTRB(20, 0, 20, 8),
            child: SectionTitle('Report'),
          ),
          for (final r in reasons)
            ListTile(
              leading: const Icon(Icons.flag_outlined),
              title: Text(r),
              onTap: () => Navigator.of(ctx).pop(r),
            ),
          const SizedBox(height: 8),
        ],
      ),
    ),
  );
  if (reason == null || !context.mounted) return;
  try {
    await SocialApi.instance.report(targetType: targetType, targetId: targetId, reason: reason);
    if (!context.mounted) return;
    showSocialMessage(context, 'Thanks — our team will review this.');
  } catch (e) {
    if (!context.mounted) return;
    showSocialError(context, e);
  }
}
