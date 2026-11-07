import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../features/auth/auth_controller.dart';
import '../features/auth/coming_soon_screen.dart';
import '../features/auth/login_screen.dart';
import '../features/hijos/child_detail_screen.dart';
import '../features/hijos/children_screen.dart';
import 'theme.dart';

const _publicPaths = {'/login', '/registro', '/recuperar-clave'};

/// Navigation with redirect by session: without a session only the public screens; with one, "Mis hijos".
final routerProvider = Provider<GoRouter>((ref) {
  final refresh = ValueNotifier<int>(0);
  ref.listen(authControllerProvider, (_, __) => refresh.value++);
  ref.onDispose(refresh.dispose);

  return GoRouter(
    initialLocation: '/hijos',
    refreshListenable: refresh,
    redirect: (context, state) {
      final auth = ref.read(authControllerProvider);
      final path = state.matchedLocation;
      if (auth.isLoading && !auth.hasValue) return path == '/inicio' ? null : '/inicio';
      final signedIn = auth.valueOrNull != null;
      if (!signedIn) return _publicPaths.contains(path) ? null : '/login';
      if (_publicPaths.contains(path) || path == '/inicio') return '/hijos';
      return null;
    },
    routes: [
      GoRoute(path: '/inicio', builder: (_, __) => const _SplashScreen()),
      GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
      GoRoute(path: '/registro', builder: (_, __) => const ComingSoonScreen(title: 'Inscribe a tu hijo')),
      GoRoute(path: '/recuperar-clave', builder: (_, __) => const ComingSoonScreen(title: 'Recuperar contraseña')),
      GoRoute(path: '/hijos', builder: (_, __) => const ChildrenScreen()),
      GoRoute(
        path: '/hijos/:id',
        builder: (_, state) => ChildDetailScreen(playerId: int.parse(state.pathParameters['id']!)),
      ),
    ],
  );
});

class _SplashScreen extends StatelessWidget {
  const _SplashScreen();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: ClubColors.black,
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Image.asset('assets/escudo.png', width: 120, height: 120),
            const SizedBox(height: 20),
            const CircularProgressIndicator(color: ClubColors.gold),
          ],
        ),
      ),
    );
  }
}
