import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../state/auth.dart';
import '../../theme.dart';

class PendingScreen extends StatelessWidget {
  const PendingScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthState>();
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  height: 72,
                  width: 72,
                  decoration: BoxDecoration(gradient: RoboTheme.brandGradient, borderRadius: BorderRadius.circular(20)),
                  child: const Icon(Icons.hourglass_top_rounded, color: Colors.white, size: 38),
                ),
                const SizedBox(height: 24),
                const Text('Awaiting approval', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
                const SizedBox(height: 10),
                Text(
                  'Your account is being reviewed by an administrator to keep RoboCode safe for everyone. '
                  "You'll be able to sign in once it's approved.",
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Theme.of(context).hintColor, height: 1.5),
                ),
                const SizedBox(height: 28),
                FilledButton.tonal(onPressed: () => auth.refreshUser(), child: const Text('Check again')),
                TextButton(
                  onPressed: () async {
                    await auth.logout();
                    if (context.mounted) context.go('/login');
                  },
                  child: const Text('Sign out'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
