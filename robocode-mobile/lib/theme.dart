import 'package:flutter/material.dart';

/// RoboCode.Africa brand palette + Material 3 theme.
class RoboTheme {
  static const Color primary = Color(0xFF2563FF); // electric blue
  static const Color secondary = Color(0xFF16C79A); // teal-green
  static const Color accent = Color(0xFFFFB020); // amber
  static const Color ink = Color(0xFF0D1426); // deep navy
  static const Color surfaceMuted = Color(0xFFF4F6FB);

  static const LinearGradient brandGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [primary, secondary],
  );

  static ThemeData light() {
    final scheme = ColorScheme.fromSeed(
      seedColor: primary,
      primary: primary,
      secondary: secondary,
      tertiary: accent,
      brightness: Brightness.light,
    );
    return _build(scheme, const Color(0xFFFBFCFF));
  }

  static ThemeData dark() {
    final scheme = ColorScheme.fromSeed(
      seedColor: primary,
      primary: primary,
      secondary: secondary,
      tertiary: accent,
      brightness: Brightness.dark,
    );
    return _build(scheme, ink);
  }

  static ThemeData _build(ColorScheme scheme, Color scaffold) {
    final base = ThemeData(colorScheme: scheme, useMaterial3: true);
    return base.copyWith(
      scaffoldBackgroundColor: scaffold,
      appBarTheme: const AppBarTheme(centerTitle: false, elevation: 0, scrolledUnderElevation: 0.5),
      cardTheme: CardThemeData(
        elevation: 0,
        clipBehavior: Clip.antiAlias,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(18),
          side: BorderSide(color: scheme.outlineVariant.withValues(alpha: 0.6)),
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
          textStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      ),
      chipTheme: base.chipTheme.copyWith(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      ),
    );
  }
}
