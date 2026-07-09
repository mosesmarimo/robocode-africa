import 'dart:async';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../api/api_client.dart';
import '../../api/social_api.dart';
import '../../models/social.dart';
import '../../theme.dart';
import '../../widgets/common.dart';
import '../../widgets/social_widgets.dart';

/// Friends hub with three tabs: my friends, pending requests, and people search.
class FriendsScreen extends StatefulWidget {
  const FriendsScreen({super.key});
  @override
  State<FriendsScreen> createState() => _FriendsScreenState();
}

class _FriendsScreenState extends State<FriendsScreen> with SingleTickerProviderStateMixin {
  late final TabController _tabs;
  late Future<FriendsList> _future;

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 3, vsync: this);
    _future = SocialApi.instance.friends();
  }

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  void _reload() => setState(() => _future = SocialApi.instance.friends());

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Friends'),
        bottom: TabBar(
          controller: _tabs,
          tabs: const [
            Tab(text: 'Friends'),
            Tab(text: 'Requests'),
            Tab(text: 'Find people'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabs,
        children: [
          _FriendsTab(future: _future, onChanged: _reload),
          _RequestsTab(future: _future, onChanged: _reload),
          _FindPeopleTab(onChanged: _reload),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Tab 1: my friends
// ---------------------------------------------------------------------------

class _FriendsTab extends StatelessWidget {
  final Future<FriendsList> future;
  final VoidCallback onChanged;
  const _FriendsTab({required this.future, required this.onChanged});

  Future<void> _unfriend(BuildContext context, UserCard user) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Remove ${user.displayName}?'),
        content: const Text('You will no longer be friends. You can send a new request later.'),
        actions: [
          TextButton(onPressed: () => Navigator.of(ctx).pop(false), child: const Text('Cancel')),
          FilledButton(onPressed: () => Navigator.of(ctx).pop(true), child: const Text('Remove')),
        ],
      ),
    );
    if (confirmed != true) return;
    try {
      await SocialApi.instance.unfriend(user.id);
      if (!context.mounted) return;
      showSocialMessage(context, 'Removed ${user.displayName}.');
      onChanged();
    } catch (e) {
      if (!context.mounted) return;
      showSocialError(context, e);
    }
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: () async => onChanged(),
      child: AsyncView<FriendsList>(
        future: future,
        onRetry: onChanged,
        builder: (context, data) {
          if (data.friends.isEmpty) {
            return ListView(children: const [
              EmptyState(
                icon: Icons.people_outline_rounded,
                message: "You haven't added any friends yet. Use Find people to connect!",
              ),
            ]);
          }
          return ListView.builder(
            padding: const EdgeInsets.all(12),
            itemCount: data.friends.length,
            itemBuilder: (context, i) {
              final u = data.friends[i];
              return UserListCard(
                user: u,
                trailing: PopupMenuButton<String>(
                  icon: Icon(Icons.more_horiz_rounded, color: Theme.of(context).hintColor),
                  onSelected: (v) {
                    if (v == 'unfriend') _unfriend(context, u);
                    if (v == 'report') reportContent(context, targetType: 'user', targetId: u.id);
                  },
                  itemBuilder: (_) => const [
                    PopupMenuItem(value: 'unfriend', child: Text('Remove friend')),
                    PopupMenuItem(value: 'report', child: Text('Report')),
                  ],
                ),
              );
            },
          );
        },
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Tab 2: pending requests (incoming + outgoing)
// ---------------------------------------------------------------------------

class _RequestsTab extends StatelessWidget {
  final Future<FriendsList> future;
  final VoidCallback onChanged;
  const _RequestsTab({required this.future, required this.onChanged});

  Future<void> _run(BuildContext context, Future<void> Function() op, String done) async {
    try {
      await op();
      if (!context.mounted) return;
      showSocialMessage(context, done);
      onChanged();
    } catch (e) {
      if (!context.mounted) return;
      showSocialError(context, e);
    }
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: () async => onChanged(),
      child: AsyncView<FriendsList>(
        future: future,
        onRetry: onChanged,
        builder: (context, data) {
          if (data.incoming.isEmpty && data.outgoing.isEmpty) {
            return ListView(children: const [
              EmptyState(icon: Icons.inbox_outlined, message: 'No pending friend requests.'),
            ]);
          }
          return ListView(
            padding: const EdgeInsets.all(12),
            children: [
              if (data.incoming.isNotEmpty) ...[
                const Padding(
                  padding: EdgeInsets.fromLTRB(4, 4, 4, 8),
                  child: SectionTitle('Incoming'),
                ),
                ...data.incoming.map((r) => UserListCard(
                      user: r.user,
                      subtitle: r.createdAt != null ? 'Sent ${relativeTime(r.createdAt!)}' : null,
                      trailing: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          IconButton.filledTonal(
                            tooltip: 'Accept',
                            icon: const Icon(Icons.check_rounded),
                            onPressed: () => _run(context,
                                () => SocialApi.instance.acceptFriendRequest(r.id), 'Friend added!'),
                          ),
                          const SizedBox(width: 6),
                          IconButton(
                            tooltip: 'Decline',
                            icon: const Icon(Icons.close_rounded),
                            onPressed: () => _run(context,
                                () => SocialApi.instance.declineFriendRequest(r.id), 'Request declined.'),
                          ),
                        ],
                      ),
                    )),
                const SizedBox(height: 16),
              ],
              if (data.outgoing.isNotEmpty) ...[
                const Padding(
                  padding: EdgeInsets.fromLTRB(4, 4, 4, 8),
                  child: SectionTitle('Sent'),
                ),
                ...data.outgoing.map((r) => UserListCard(
                      user: r.user,
                      subtitle: r.createdAt != null ? 'Sent ${relativeTime(r.createdAt!)}' : null,
                      trailing: OutlinedButton(
                        onPressed: () => _run(context,
                            () => SocialApi.instance.cancelFriendRequest(r.id), 'Request cancelled.'),
                        child: const Text('Cancel'),
                      ),
                    )),
              ],
            ],
          );
        },
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Tab 3: find people (debounced search)
// ---------------------------------------------------------------------------

class _FindPeopleTab extends StatefulWidget {
  final VoidCallback onChanged;
  const _FindPeopleTab({required this.onChanged});
  @override
  State<_FindPeopleTab> createState() => _FindPeopleTabState();
}

class _FindPeopleTabState extends State<_FindPeopleTab> {
  final _ctrl = TextEditingController();
  Timer? _debounce;
  List<PersonResult> _results = [];
  bool _loading = false;
  bool _searched = false;
  Object? _error;

  @override
  void dispose() {
    _debounce?.cancel();
    _ctrl.dispose();
    super.dispose();
  }

  void _onChanged(String q) {
    _debounce?.cancel();
    final query = q.trim();
    if (query.isEmpty) {
      setState(() {
        _results = [];
        _searched = false;
        _error = null;
      });
      return;
    }
    _debounce = Timer(const Duration(milliseconds: 350), () => _search(query));
  }

  Future<void> _search(String query) async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final results = await SocialApi.instance.searchPeople(query);
      if (!mounted) return;
      setState(() {
        _results = results;
        _searched = true;
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

  /// Runs [op], then refreshes the local row's friend status and bubbles a
  /// reload up so the Friends/Requests tabs stay in sync.
  Future<void> _act(int index, Future<void> Function() op, FriendStatus newStatus, String done) async {
    try {
      await op();
      if (!mounted) return;
      setState(() {
        final r = _results[index];
        _results[index] = PersonResult(user: r.user, friendStatus: newStatus, following: r.following);
      });
      showSocialMessage(context, done);
      widget.onChanged();
    } catch (e) {
      if (!mounted) return;
      showSocialError(context, e);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(12),
          child: TextField(
            controller: _ctrl,
            textInputAction: TextInputAction.search,
            decoration: InputDecoration(
              hintText: 'Search by name…',
              prefixIcon: const Icon(Icons.search_rounded),
              suffixIcon: _ctrl.text.isEmpty
                  ? null
                  : IconButton(
                      icon: const Icon(Icons.clear_rounded),
                      onPressed: () {
                        _ctrl.clear();
                        _onChanged('');
                      },
                    ),
            ),
            onChanged: (v) {
              setState(() {}); // refresh suffix icon
              _onChanged(v);
            },
          ),
        ),
        Expanded(child: _body(context)),
      ],
    );
  }

  Widget _body(BuildContext context) {
    if (_loading) {
      return const Center(child: Padding(padding: EdgeInsets.all(40), child: CircularProgressIndicator()));
    }
    if (_error != null) {
      final msg = _error is ApiException ? (_error as ApiException).message : 'Something went wrong.';
      return Center(child: Padding(padding: const EdgeInsets.all(32), child: Text(msg)));
    }
    if (!_searched) {
      return const EmptyState(
        icon: Icons.search_rounded,
        message: 'Search for classmates and friends across RoboCode.',
      );
    }
    if (_results.isEmpty) {
      return const EmptyState(icon: Icons.person_search_outlined, message: 'No people found. Try another name.');
    }
    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 12),
      itemCount: _results.length,
      itemBuilder: (context, i) => UserListCard(
        user: _results[i].user,
        trailing: _trailingFor(i, _results[i]),
      ),
    );
  }

  Widget _trailingFor(int index, PersonResult r) {
    switch (r.friendStatus) {
      case 'friends':
        return const MiniChip(icon: Icons.check_rounded, label: 'Friends', color: RoboTheme.secondary);
      case 'incoming':
        // Accepting needs the request id, which search results don't carry.
        // Point the student at the Requests tab to respond.
        return TextButton(
          onPressed: () => showSocialMessage(context, 'Respond from the Requests tab.'),
          child: const Text('Respond'),
        );
      case 'outgoing':
        return const MiniChip(icon: Icons.schedule_rounded, label: 'Requested', color: RoboTheme.accent);
      case 'blocked':
        return const MiniChip(icon: Icons.block_rounded, label: 'Blocked');
      case 'self':
        return const SizedBox.shrink();
      default:
        return FilledButton.tonal(
          onPressed: () => _act(
            index,
            () => SocialApi.instance.sendFriendRequest(r.user.id),
            'outgoing',
            'Friend request sent!',
          ),
          child: const Text('Add'),
        );
    }
  }
}

/// A compact tappable user row used across the social tabs. Tapping the body
/// opens the user's profile.
class UserListCard extends StatelessWidget {
  final UserCard user;
  final String? subtitle;
  final Widget? trailing;
  const UserListCard({super.key, required this.user, this.subtitle, this.trailing});

  @override
  Widget build(BuildContext context) {
    final hint = Theme.of(context).hintColor;
    final sub = subtitle ??
        [
          if (user.schoolName != null && user.schoolName!.isNotEmpty) user.schoolName!,
          'Level ${user.level}',
        ].join('  ·  ');
    return Card(
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
        leading: SeedAvatar(seed: user.avatarSeed, name: user.displayName, size: 44),
        title: Text(user.displayName,
            maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w600)),
        subtitle: Text(sub, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(color: hint)),
        trailing: trailing,
        onTap: () => context.push('/social/users/${user.id}'),
      ),
    );
  }
}
