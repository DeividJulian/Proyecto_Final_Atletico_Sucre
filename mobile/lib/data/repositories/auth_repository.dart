import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/api_client.dart';
import '../../core/token_storage.dart';
import '../models/session_user.dart';

/// Repository pattern: the screens never build HTTP calls; they use these methods.
class AuthRepository {
  AuthRepository(this._api, this._tokens);

  final ApiClient _api;
  final TokenStorage _tokens;

  Future<SessionUser> login(String email, String password) async {
    final answer = await _api.post(
      '/auth/login',
      {'email': email.trim().toLowerCase(), 'password': password},
      auth: false,
    ) as Map<String, dynamic>;
    return _start(answer);
  }

  /// Sign-up of the parent with their children (same JSON as the website). Returns the session.
  Future<SessionUser> register(Map<String, dynamic> payload) async {
    final answer = await _api.post('/auth/register', payload, auth: false) as Map<String, dynamic>;
    return _start(answer);
  }

  /// The saved session, checked with the server. Null when there is none or it expired.
  Future<SessionUser?> restore() async {
    if (await _tokens.read() == null) return null;
    try {
      final me = await _api.get('/auth/me') as Map<String, dynamic>;
      return SessionUser.fromJson(me);
    } on ApiException catch (error) {
      if (error.isUnauthorized) {
        await _tokens.clear();
        return null;
      }
      rethrow;
    }
  }

  Future<void> forgotPassword(String email) =>
      _api.post('/auth/password/forgot', {'email': email.trim().toLowerCase()}, auth: false);

  Future<void> resetPassword(String email, String code, String newPassword) => _api.post(
        '/auth/password/reset',
        {'email': email.trim().toLowerCase(), 'code': code, 'new_password': newPassword},
        auth: false,
      );

  Future<void> logout() => _tokens.clear();

  Future<SessionUser> _start(Map<String, dynamic> answer) async {
    await _tokens.write(answer['access_token'] as String);
    return SessionUser.fromJson(answer['user'] as Map<String, dynamic>);
  }
}

final authRepositoryProvider = Provider<AuthRepository>(
  (ref) => AuthRepository(ref.watch(apiClientProvider), ref.watch(tokenStorageProvider)),
);
