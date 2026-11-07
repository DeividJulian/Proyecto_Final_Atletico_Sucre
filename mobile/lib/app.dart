import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'core/router.dart';
import 'core/server_status.dart';
import 'core/theme.dart';
import 'shared/widgets.dart';

class AtleticoSucreApp extends ConsumerWidget {
  const AtleticoSucreApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return MaterialApp.router(
      title: 'Atlético Sucre',
      debugShowCheckedModeBanner: false,
      theme: buildTheme(),
      routerConfig: ref.watch(routerProvider),
      locale: const Locale('es', 'CO'),
      supportedLocales: const [Locale('es', 'CO'), Locale('es')],
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      // The "Conectando con el servidor…" banner sits above every screen. While it is visible it already
      // covers the status bar, so the screen below must not add that space again.
      builder: (context, child) => Consumer(
        builder: (context, ref, _) {
          final status = ref.watch(serverStatusProvider);
          final bannerVisible = status == ServerStatus.waking || status == ServerStatus.offline;
          final page = child ?? const SizedBox.shrink();
          return Column(
            children: [
              const ServerBanner(),
              Expanded(
                child: bannerVisible ? MediaQuery.removePadding(context: context, removeTop: true, child: page) : page,
              ),
            ],
          );
        },
      ),
    );
  }
}
