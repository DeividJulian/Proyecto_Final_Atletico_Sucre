import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/server_status.dart';
import '../core/theme.dart';

/// "Conectando con el servidor…" while Render wakes up (shown above every screen).
class ServerBanner extends ConsumerWidget {
  const ServerBanner({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final status = ref.watch(serverStatusProvider);
    if (status != ServerStatus.waking && status != ServerStatus.offline) return const SizedBox.shrink();
    final waking = status == ServerStatus.waking;
    return Material(
      color: ClubColors.black,
      child: SafeArea(
        bottom: false,
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          decoration: BoxDecoration(
            border: Border(bottom: BorderSide(color: waking ? ClubColors.gold : ClubColors.red, width: 2)),
          ),
          child: Row(
            children: [
              if (waking)
                const SizedBox(
                  width: 18,
                  height: 18,
                  child: CircularProgressIndicator(strokeWidth: 2.5, color: ClubColors.gold),
                ),
              if (waking) const SizedBox(width: 12),
              Expanded(
                child: Text(
                  waking
                      ? 'Conectando con el servidor… La primera vez puede tardar hasta un minuto.'
                      : 'No pudimos conectar con el servidor.',
                  style: const TextStyle(color: Colors.white, fontSize: 13),
                ),
              ),
              if (!waking)
                TextButton(
                  onPressed: () => ref.read(serverStatusProvider.notifier).retry(),
                  child: const Text('Reintentar', style: TextStyle(color: ClubColors.goldLight)),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Error with a retry button.
class ErrorView extends StatelessWidget {
  const ErrorView({super.key, required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.cloud_off, size: 48, color: ClubColors.gray),
            const SizedBox(height: 12),
            Text(message, textAlign: TextAlign.center),
            const SizedBox(height: 16),
            OutlinedButton(onPressed: onRetry, child: const Text('Reintentar')),
          ],
        ),
      ),
    );
  }
}

/// Small coloured label (enrollment status, payment status…).
class StatusPill extends StatelessWidget {
  const StatusPill({super.key, required this.text, required this.tone});

  final String text;

  /// 'ok' | 'warn' | 'bad' | 'neutral'
  final String tone;

  @override
  Widget build(BuildContext context) {
    final (background, foreground) = switch (tone) {
      'ok' => (ClubColors.successSoft, ClubColors.success),
      'warn' => (ClubColors.goldSoft, const Color(0xFF7A5A00)),
      'bad' => (ClubColors.redSoft, ClubColors.redDark),
      _ => (const Color(0xFFEFEEEA), ClubColors.gray),
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
      decoration: BoxDecoration(color: background, borderRadius: BorderRadius.circular(999)),
      child: Text(text, style: TextStyle(color: foreground, fontWeight: FontWeight.w700, fontSize: 12)),
    );
  }
}

String enrollmentTone(String status) => switch (status) {
      'approved' => 'ok',
      'pending' => 'warn',
      'rejected' || 'inactive' => 'bad',
      _ => 'neutral',
    };

/// Label + value pair used in the player sheet.
class InfoRow extends StatelessWidget {
  const InfoRow({super.key, required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label.toUpperCase(),
              style: const TextStyle(fontSize: 11, color: ClubColors.gray, letterSpacing: 0.5)),
          const SizedBox(height: 2),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}
