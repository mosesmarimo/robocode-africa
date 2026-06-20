import 'package:flutter/material.dart';

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
