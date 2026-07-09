import 'package:flutter/material.dart';

import '../theme.dart';

/// Shown while auth state is being resolved on cold start, so protected screens
/// don't mount (and fire failing API calls) before we know who the user is.
class SplashScreen extends StatelessWidget {
  const SplashScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(gradient: RoboTheme.brandGradient),
        child: const Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.memory_rounded, color: Colors.white, size: 56),
              SizedBox(height: 20),
              SizedBox(
                width: 26,
                height: 26,
                child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
