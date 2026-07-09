import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../api/api_client.dart';
import '../../api/social_api.dart';
import '../../models/social.dart';
import '../../widgets/common.dart';
import '../../widgets/social_widgets.dart';

/// The personalised social feed: posts from friends, followed users/projects
/// and the user's groups. Cursor-paginated with infinite scroll.
class FeedScreen extends StatefulWidget {
  const FeedScreen({super.key});
  @override
  State<FeedScreen> createState() => _FeedScreenState();
}

class _FeedScreenState extends State<FeedScreen> {
  final _scroll = ScrollController();
  final List<Post> _posts = [];
  String? _cursor;
  bool _loading = true;
  bool _loadingMore = false;
  bool _hasMore = true;
  Object? _error;

  @override
  void initState() {
    super.initState();
    _scroll.addListener(_onScroll);
    _load(reset: true);
  }

  @override
  void dispose() {
    _scroll.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scroll.position.pixels >= _scroll.position.maxScrollExtent - 400) {
      _loadMore();
    }
  }

  Future<void> _load({bool reset = false}) async {
    if (reset) {
      setState(() {
        _loading = true;
        _error = null;
      });
    }
    try {
      final feed = await SocialApi.instance.feed();
      if (!mounted) return;
      setState(() {
        _posts
          ..clear()
          ..addAll(feed.posts);
        _cursor = feed.nextCursor;
        _hasMore = feed.nextCursor != null;
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
    if (_loadingMore || !_hasMore || _cursor == null || _loading) return;
    setState(() => _loadingMore = true);
    try {
      final feed = await SocialApi.instance.feed(cursor: _cursor);
      if (!mounted) return;
      setState(() {
        _posts.addAll(feed.posts);
        _cursor = feed.nextCursor;
        _hasMore = feed.nextCursor != null;
        _loadingMore = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _loadingMore = false);
      showSocialError(context, e);
    }
  }

  void _removePost(String id) => setState(() => _posts.removeWhere((p) => p.id == id));

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: RefreshIndicator(
        onRefresh: () => _load(reset: true),
        child: CustomScrollView(
          controller: _scroll,
          slivers: [
            SliverToBoxAdapter(
              child: BrandHeader(
                title: 'Feed',
                subtitle: 'See what your friends and groups are building',
                trailing: IconButton(
                  onPressed: () => context.push('/social/friends'),
                  icon: const Icon(Icons.person_add_alt_1_outlined, color: Colors.white),
                  tooltip: 'Find people',
                ),
              ),
            ),
            ..._content(),
          ],
        ),
      ),
    );
  }

  List<Widget> _content() {
    if (_loading) {
      return const [
        SliverFillRemaining(
          hasScrollBody: false,
          child: Center(child: Padding(padding: EdgeInsets.all(48), child: CircularProgressIndicator())),
        ),
      ];
    }
    if (_error != null) {
      final msg = _error is ApiException ? (_error as ApiException).message : 'Something went wrong.';
      return [
        SliverFillRemaining(
          hasScrollBody: false,
          child: Center(
            child: Padding(
              padding: const EdgeInsets.all(32),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.cloud_off_rounded, size: 40, color: Colors.grey),
                  const SizedBox(height: 12),
                  Text(msg, textAlign: TextAlign.center),
                  const SizedBox(height: 16),
                  FilledButton.tonal(onPressed: () => _load(reset: true), child: const Text('Retry')),
                ],
              ),
            ),
          ),
        ),
      ];
    }
    if (_posts.isEmpty) {
      return const [
        SliverFillRemaining(
          hasScrollBody: false,
          child: EmptyState(
            icon: Icons.dynamic_feed_outlined,
            message: 'Your feed is quiet. Add friends, follow projects or join a group to fill it up!',
          ),
        ),
      ];
    }
    return [
      SliverPadding(
        padding: const EdgeInsets.fromLTRB(12, 12, 12, 0),
        sliver: SliverList(
          delegate: SliverChildBuilderDelegate(
            (context, i) {
              if (i >= _posts.length) {
                return Padding(
                  padding: const EdgeInsets.all(16),
                  child: Center(
                    child: _loadingMore
                        ? const CircularProgressIndicator()
                        : const SizedBox.shrink(),
                  ),
                );
              }
              final post = _posts[i];
              return PostCard(
                key: ValueKey(post.id),
                post: post,
                showContext: true,
                onArchived: () => _removePost(post.id),
              );
            },
            childCount: _posts.length + (_hasMore ? 1 : 0),
          ),
        ),
      ),
      const SliverToBoxAdapter(child: SizedBox(height: 24)),
    ];
  }
}
