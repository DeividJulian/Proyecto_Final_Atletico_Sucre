import 'package:flutter/foundation.dart';

/// Where the app finds the backend.
///
/// - Release (APK for the families): the Render API.
/// - Debug: your PC on the same Wi-Fi, passed when running:
///   `flutter run --dart-define=API_URL=http://192.168.1.50:8000`
///   Without it, the Android emulator's alias of your PC (10.0.2.2) is used.
class AppConfig {
  static const String _fromDefine = String.fromEnvironment('API_URL');
  static const String productionUrl = 'https://proyecto-final-atletico-sucre.onrender.com';
  static const String emulatorUrl = 'http://10.0.2.2:8000';

  static String get apiUrl {
    final url = _fromDefine.isNotEmpty ? _fromDefine : (kReleaseMode ? productionUrl : emulatorUrl);
    return url.endsWith('/') ? url.substring(0, url.length - 1) : url;
  }

  /// Club WhatsApp (also comes from /public/club; this is the fallback).
  static const String whatsapp = '573218543957';
}
