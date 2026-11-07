import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/api_client.dart';
import '../../core/server_status.dart';
import '../../data/models/session_user.dart';
import '../../data/repositories/auth_repository.dart';

const parentsOnlyMessage =
    'Esta app es para padres de familia. Profesores y administradores ingresan desde la página web.';

/// Session state: null = signed out. The router redirects according to it.
class AuthController extends AsyncNotifier<SessionUser?> {
  @override
  Future<SessionUser?> build() async {
    final api = ref.read(apiClientProvider);
    // An expired token on any call signs the parent out
    api.onUnauthorized = () {
      if (state.valueOrNull != null) _signOut();
    };
    try {
      final user = await ref.read(authRepositoryProvider).restore();
      if (user != null && !user.isParent) {
        await ref.read(authRepositoryProvider).logout();
        return null;
      }
      return user;
    } catch (_) {
      // No connection on start: show the login; the saved token stays for the next try
      return null;
    }
  }

  Future<void> login(String email, String password) async {
    await ref.read(serverStatusProvider.notifier).ensureAwake();
    final user = await ref.read(authRepositoryProvider).login(email, password);
    if (!user.isParent) {
      await ref.read(authRepositoryProvider).logout();
      throw ApiException(parentsOnlyMessage);
    }
    state = AsyncData(user);
  }

  Future<void> register(Map<String, dynamic> payload) async {
    await ref.read(serverStatusProvider.notifier).ensureAwake();
    final user = await ref.read(authRepositoryProvider).register(payload);
    state = AsyncData(user);
  }

  Future<void> logout() => _signOut();

  Future<void> _signOut() async {
    await ref.read(authRepositoryProvider).logout();
    state = const AsyncData(null);
  }
}

final authControllerProvider = AsyncNotifierProvider<AuthController, SessionUser?>(AuthController.new);
