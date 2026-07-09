import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../api/api_client.dart';
import '../theme.dart';

/// Loads [future] and renders [builder], with consistent loading/error states.
class AsyncView<T> extends StatelessWidget {
  final Future<T> future;
  final Widget Function(BuildContext, T) builder;
  final VoidCallback? onRetry;
  const AsyncView({super.key, required this.future, required this.builder, this.onRetry});

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<T>(
      future: future,
      builder: (context, snap) {
        if (snap.connectionState == ConnectionState.waiting) {
          return const Center(child: Padding(padding: EdgeInsets.all(48), child: CircularProgressIndicator()));
        }
        if (snap.hasError) {
          final msg = snap.error is ApiException ? (snap.error as ApiException).message : 'Something went wrong.';
          return Center(
            child: Padding(
              padding: const EdgeInsets.all(32),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.cloud_off_rounded, size: 40, color: Colors.grey),
                  const SizedBox(height: 12),
                  Text(msg, textAlign: TextAlign.center),
                  if (onRetry != null) ...[
                    const SizedBox(height: 16),
                    FilledButton.tonal(onPressed: onRetry, child: const Text('Retry')),
                  ],
                ],
              ),
            ),
          );
        }
        return builder(context, snap.data as T);
      },
    );
  }
}

/// Daily-streak flame (🔥 + day count), meant for a [BrandHeader]'s `trailing`
/// slot — a translucent white pill readable on the brand gradient. Callers
/// should only render this once the streak is worth celebrating (see
/// `AppUser.hasVisibleStreak`).
///
/// When [embers] > 0, a small shield indicator (🛡 + count) renders alongside
/// the flame — the forgiving-streak "embers" that absorb a missed day. When
/// [frozen] is true, a tiny snowflake renders too, for an active milestone
/// freeze. Both are kept subtle: same pill, smaller/dimmer text.
class StreakFlame extends StatelessWidget {
  final int count;
  final int embers;
  final bool frozen;
  const StreakFlame({super.key, required this.count, this.embers = 0, this.frozen = false});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.18),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Text('🔥', style: TextStyle(fontSize: 14)),
          const SizedBox(width: 4),
          Text('$count', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
          if (embers > 0) ...[
            const SizedBox(width: 6),
            Text('🛡', style: TextStyle(fontSize: 11, color: Colors.white.withValues(alpha: 0.85))),
            const SizedBox(width: 2),
            Text('$embers', style: TextStyle(color: Colors.white.withValues(alpha: 0.85), fontWeight: FontWeight.w600, fontSize: 11)),
          ],
          if (frozen) ...[
            const SizedBox(width: 4),
            Text('❄', style: TextStyle(fontSize: 11, color: Colors.white.withValues(alpha: 0.85))),
          ],
        ],
      ),
    );
  }
}

/// A rounded gradient banner used at the top of major screens.
class BrandHeader extends StatelessWidget {
  final String title;
  final String? subtitle;
  final Widget? trailing;
  const BrandHeader({super.key, required this.title, this.subtitle, this.trailing});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(20, 22, 20, 24),
      decoration: const BoxDecoration(
        gradient: RoboTheme.brandGradient,
        borderRadius: BorderRadius.only(bottomLeft: Radius.circular(24), bottomRight: Radius.circular(24)),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title,
                    style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold)),
                if (subtitle != null) ...[
                  const SizedBox(height: 4),
                  Text(subtitle!, style: TextStyle(color: Colors.white.withValues(alpha: 0.85))),
                ],
              ],
            ),
          ),
          ?trailing,
        ],
      ),
    );
  }
}

/// Small labelled metric pill.
class StatTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color? color;
  const StatTile({super.key, required this.icon, required this.label, required this.value, this.color});

  @override
  Widget build(BuildContext context) {
    final c = color ?? RoboTheme.primary;
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: c.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: c.withValues(alpha: 0.18)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: c, size: 22),
          const SizedBox(height: 10),
          Text(value, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
          Text(label, style: TextStyle(fontSize: 12, color: Theme.of(context).hintColor)),
        ],
      ),
    );
  }
}

/// A simple avatar bubble derived from a seed/name.
class SeedAvatar extends StatelessWidget {
  final String? seed;
  final String name;
  final double size;
  const SeedAvatar({super.key, this.seed, required this.name, this.size = 40});

  @override
  Widget build(BuildContext context) {
    final initials = name.trim().isEmpty
        ? '?'
        : name.trim().split(RegExp(r'\s+')).take(2).map((w) => w[0].toUpperCase()).join();
    final hash = (seed ?? name).codeUnits.fold<int>(0, (a, b) => a + b);
    final hue = (hash * 37) % 360;
    return Container(
      width: size,
      height: size,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: LinearGradient(
          colors: [HSLColor.fromAHSL(1, hue.toDouble(), 0.6, 0.55).toColor(), RoboTheme.secondary],
        ),
      ),
      child: Text(initials, style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: size * 0.36)),
    );
  }
}

/// Bold section heading used above lists/cards across screens.
class SectionTitle extends StatelessWidget {
  final String title;
  const SectionTitle(this.title, {super.key});
  @override
  Widget build(BuildContext context) =>
      Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold));
}

/// A muted card holding a short hint/empty message inline within a list.
class HintCard extends StatelessWidget {
  final String text;
  const HintCard(this.text, {super.key});
  @override
  Widget build(BuildContext context) => Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Text(text, style: TextStyle(color: Theme.of(context).hintColor)),
        ),
      );
}

/// A small icon + label pill. When [color] is null it uses a muted hint tone
/// (no border); when set it tints fill, border and text with that colour.
class MiniChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color? color;
  const MiniChip({super.key, required this.icon, required this.label, this.color});

  @override
  Widget build(BuildContext context) {
    final c = color ?? Theme.of(context).hintColor;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: c.withValues(alpha: color == null ? 0.08 : 0.10),
        borderRadius: BorderRadius.circular(8),
        border: color == null ? null : Border.all(color: c.withValues(alpha: 0.20)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 13, color: c),
          const SizedBox(width: 4),
          Text(label,
              style: TextStyle(
                  fontSize: 12,
                  fontWeight: color == null ? FontWeight.normal : FontWeight.w600,
                  color: c)),
        ],
      ),
    );
  }
}

/// Format an ISO-8601 due-date string as its local calendar date
/// (`YYYY-MM-DD`). `dueAt` is sent/stored as UTC midnight of the intended
/// calendar day (see `assignments_screen._submit`); converting to local
/// before reading the date avoids the naive `due.split('T').first` showing
/// every date a day early for viewers ahead of UTC (e.g. Harare, UTC+2).
String dueDateLabel(String iso) {
  final local = DateTime.parse(iso).toLocal();
  String two(int n) => n.toString().padLeft(2, '0');
  return '${local.year}-${two(local.month)}-${two(local.day)}';
}

/// Shared "just now / Nm ago / Nh ago / Nd ago" relative-time ladder, falling
/// back to an absolute date once older than a week.
String relativeTime(DateTime dt, {bool withTime = false}) {
  final local = dt.toLocal();
  final diff = DateTime.now().difference(local);
  if (diff.inSeconds < 60) return 'just now';
  if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
  if (diff.inHours < 24) return '${diff.inHours}h ago';
  if (diff.inDays < 7) return '${diff.inDays}d ago';
  return withTime
      ? DateFormat.yMMMd().add_jm().format(local)
      : DateFormat.yMMMd().format(local);
}

/// Empty-state placeholder.
class EmptyState extends StatelessWidget {
  final IconData icon;
  final String message;
  const EmptyState({super.key, required this.icon, required this.message});
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 44, color: Colors.grey),
            const SizedBox(height: 12),
            Text(message, textAlign: TextAlign.center, style: TextStyle(color: Theme.of(context).hintColor)),
          ],
        ),
      ),
    );
  }
}
