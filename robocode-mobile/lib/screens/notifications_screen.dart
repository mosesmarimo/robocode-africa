import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../api/api_client.dart';
import '../theme.dart';
import '../widgets/common.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});
  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  late Future<Map<String, dynamic>> _future;
  bool _markingAll = false;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<Map<String, dynamic>> _load() =>
      ApiClient.instance.get<Map<String, dynamic>>('/notifications');

  void _reload() => setState(() => _future = _load());

  Future<void> _markAllRead() async {
    if (_markingAll) return;
    setState(() => _markingAll = true);
    try {
      await ApiClient.instance.post<Map<String, dynamic>>('/notifications/read-all');
      if (!mounted) return;
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
      if (mounted) setState(() => _markingAll = false);
    }
  }

  Future<void> _markRead(String id) async {
    try {
      await ApiClient.instance.post<Map<String, dynamic>>('/notifications/$id/read');
      if (!mounted) return;
      _reload();
    } on ApiException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not reach the server. Check your connection.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          TextButton.icon(
            onPressed: _markingAll ? null : _markAllRead,
            icon: _markingAll
                ? const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.done_all, size: 18),
            label: const Text('Mark all read'),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async => _reload(),
        child: AsyncView<Map<String, dynamic>>(
          future: _future,
          onRetry: _reload,
          builder: (context, data) {
            final notifications = (data['notifications'] as List?) ?? [];
            final unreadCount = (data['unreadCount'] as num?)?.toInt() ?? 0;

            if (notifications.isEmpty) {
              return ListView(
                children: const [
                  SizedBox(height: 80),
                  EmptyState(
                    icon: Icons.notifications_none_rounded,
                    message: "You're all caught up. No notifications yet.",
                  ),
                ],
              );
            }

            return ListView(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
              children: [
                if (unreadCount > 0)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Text(
                      '$unreadCount unread',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: RoboTheme.primary,
                      ),
                    ),
                  ),
                ...notifications.map(
                  (n) => _NotificationCard(
                    notification: n as Map<String, dynamic>,
                    onTapUnread: _markRead,
                  ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}

class _NotificationCard extends StatelessWidget {
  final Map<String, dynamic> notification;
  final Future<void> Function(String id) onTapUnread;
  const _NotificationCard({required this.notification, required this.onTapUnread});

  @override
  Widget build(BuildContext context) {
    final id = notification['id']?.toString() ?? '';
    final type = notification['type']?.toString() ?? '';
    final title = notification['title']?.toString() ?? 'Notification';
    final body = notification['body']?.toString();
    final createdAt = _formatWhen(notification['createdAt']?.toString());
    final isUnread = notification['readAt'] == null;

    final hint = Theme.of(context).hintColor;

    return Card(
      child: InkWell(
        onTap: isUnread && id.isNotEmpty ? () => onTapUnread(id) : null,
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: _typeColor(type).withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(_typeIcon(type), color: _typeColor(type), size: 20),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Text(
                            title,
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: isUnread ? FontWeight.bold : FontWeight.w500,
                            ),
                          ),
                        ),
                        if (isUnread) ...[
                          const SizedBox(width: 8),
                          Container(
                            margin: const EdgeInsets.only(top: 6),
                            width: 9,
                            height: 9,
                            decoration: const BoxDecoration(
                              color: RoboTheme.primary,
                              shape: BoxShape.circle,
                            ),
                          ),
                        ],
                      ],
                    ),
                    if (body != null && body.isNotEmpty) ...[
                      const SizedBox(height: 4),
                      Text(
                        body,
                        style: TextStyle(
                          fontSize: 13.5,
                          color: isUnread ? null : hint,
                        ),
                      ),
                    ],
                    if (createdAt != null) ...[
                      const SizedBox(height: 6),
                      Text(createdAt, style: TextStyle(fontSize: 12, color: hint)),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

IconData _typeIcon(String type) {
  switch (type) {
    case 'badge':
    case 'achievement':
      return Icons.workspace_premium_rounded;
    case 'challenge':
      return Icons.flag_rounded;
    case 'competition':
      return Icons.emoji_events_rounded;
    case 'team':
      return Icons.groups_rounded;
    case 'comment':
    case 'mention':
      return Icons.chat_bubble_rounded;
    default:
      return Icons.notifications_rounded;
  }
}

Color _typeColor(String type) {
  switch (type) {
    case 'badge':
    case 'achievement':
      return RoboTheme.accent;
    case 'competition':
      return Colors.purple;
    case 'challenge':
      return RoboTheme.secondary;
    default:
      return RoboTheme.primary;
  }
}

String? _formatWhen(String? iso) {
  if (iso == null || iso.isEmpty) return null;
  final dt = DateTime.tryParse(iso);
  if (dt == null) return null;
  final local = dt.toLocal();
  final now = DateTime.now();
  final diff = now.difference(local);
  if (diff.inSeconds < 60) return 'Just now';
  if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
  if (diff.inHours < 24) return '${diff.inHours}h ago';
  if (diff.inDays < 7) return '${diff.inDays}d ago';
  return DateFormat.yMMMd().add_jm().format(local);
}
