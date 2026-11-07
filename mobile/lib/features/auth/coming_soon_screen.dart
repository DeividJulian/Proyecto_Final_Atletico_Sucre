import 'package:flutter/material.dart';

import '../../core/theme.dart';

/// Temporary screen for sign-up and password recovery (part 2 of the app).
class ComingSoonScreen extends StatelessWidget {
  const ComingSoonScreen({super.key, required this.title});

  final String title;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: const Center(
        child: Padding(
          padding: EdgeInsets.all(24),
          child: Text(
            'Esta sección llega en la próxima versión de la app.\n'
            'Mientras tanto puedes hacerlo desde la página web del club.',
            textAlign: TextAlign.center,
            style: TextStyle(color: ClubColors.gray, fontSize: 16),
          ),
        ),
      ),
    );
  }
}
