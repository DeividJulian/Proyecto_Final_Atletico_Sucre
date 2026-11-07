import 'package:flutter/material.dart';

/// Club colours: red, black and gold (same tokens as the website).
class ClubColors {
  static const red = Color(0xFFE10600);
  static const redDark = Color(0xFFA30400);
  static const black = Color(0xFF111111);
  static const charcoal = Color(0xFF232323);
  static const gold = Color(0xFFD4A017);
  static const goldLight = Color(0xFFF5C842);
  static const goldSoft = Color(0xFFFBF3DC);
  static const background = Color(0xFFF7F6F3);
  static const gray = Color(0xFF6B6862);
  static const success = Color(0xFF15803D);
  static const successSoft = Color(0xFFE3F5EA);
  static const redSoft = Color(0xFFFDE8E7);
}

ThemeData buildTheme() {
  final scheme = ColorScheme.fromSeed(
    seedColor: ClubColors.red,
    primary: ClubColors.red,
    secondary: ClubColors.gold,
    surface: Colors.white,
  );
  final base = ThemeData(colorScheme: scheme, useMaterial3: true);
  return base.copyWith(
    scaffoldBackgroundColor: ClubColors.background,
    appBarTheme: const AppBarTheme(
      backgroundColor: ClubColors.black,
      foregroundColor: Colors.white,
      centerTitle: false,
      elevation: 0,
    ),
    cardTheme: CardThemeData(
      color: Colors.white,
      elevation: 0,
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(14),
        side: const BorderSide(color: Color(0xFFE2E0DA)),
      ),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: ClubColors.red,
        foregroundColor: Colors.white,
        minimumSize: const Size.fromHeight(50),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
        textStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: ClubColors.black,
        minimumSize: const Size.fromHeight(48),
        side: const BorderSide(color: ClubColors.black, width: 1.5),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
        textStyle: const TextStyle(fontWeight: FontWeight.w700),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: Colors.white,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: Color(0xFFE2E0DA), width: 1.5),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: ClubColors.gold, width: 2),
      ),
    ),
  );
}
