import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'api_client.dart';

/// - checking: first ping to /health (no banner, it is usually fast)
/// - waking: the server is taking long → Render's free plan is starting it
/// - online / offline
enum ServerStatus { checking, waking, online, offline }

/// Same behaviour as the website: show "Conectando con el servidor…" while Render wakes up.
class ServerStatusNotifier extends Notifier<ServerStatus> {
  static const slowAfter = Duration(seconds: 2);
  static const maxWait = Duration(seconds: 120);
  static const retryEvery = Duration(seconds: 3);

  Future<void>? _pending;

  @override
  ServerStatus build() => ServerStatus.checking;

  /// Completes when /health answers. Several callers share one ping.
  Future<void> ensureAwake() {
    if (state == ServerStatus.online) return Future.value();
    return _pending ??= _wait().whenComplete(() => _pending = null);
  }

  Future<void> retry() {
    state = ServerStatus.checking;
    return ensureAwake();
  }

  Future<void> _wait() async {
    final api = ref.read(apiClientProvider);
    final started = DateTime.now();
    final slowTimer = Timer(slowAfter, () {
      if (state == ServerStatus.checking) state = ServerStatus.waking;
    });
    try {
      while (DateTime.now().difference(started) < maxWait) {
        try {
          await api.get('/health', auth: false);
          state = ServerStatus.online;
          return;
        } catch (_) {
          if (state == ServerStatus.checking) state = ServerStatus.waking;
          await Future<void>.delayed(retryEvery);
        }
      }
      state = ServerStatus.offline;
      throw ApiException('No pudimos conectar con el servidor. Revisa tu internet e intenta de nuevo.');
    } finally {
      slowTimer.cancel();
    }
  }
}

final serverStatusProvider = NotifierProvider<ServerStatusNotifier, ServerStatus>(ServerStatusNotifier.new);
