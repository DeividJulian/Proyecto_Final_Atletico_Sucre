import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/labels.dart';
import '../../core/theme.dart';
import '../../data/models/player.dart';
import '../../shared/widgets.dart';
import 'children_providers.dart';
import 'player_avatar.dart';

/// Sheet of one child: schedule and venue of their shift, and their data.
/// Attendance, payments and coach notes arrive in part 2 as more tabs.
class ChildDetailScreen extends ConsumerWidget {
  const ChildDetailScreen({super.key, required this.playerId});

  final int playerId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final detail = ref.watch(childDetailProvider(playerId));
    return Scaffold(
      appBar: AppBar(title: Text(detail.valueOrNull?.player.firstNames ?? 'Deportista')),
      body: detail.when(
        loading: () => const Center(child: CircularProgressIndicator(color: ClubColors.red)),
        error: (error, _) => ErrorView(
          message: error.toString(),
          onRetry: () => ref.invalidate(childDetailProvider(playerId)),
        ),
        data: (data) => RefreshIndicator(
          color: ClubColors.red,
          onRefresh: () => ref.refresh(childDetailProvider(playerId).future),
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              _Header(player: data.player),
              const SizedBox(height: 16),
              _ScheduleCard(detail: data),
              const SizedBox(height: 16),
              _DataCard(detail: data),
            ],
          ),
        ),
      ),
    );
  }
}

class _Header extends StatelessWidget {
  const _Header({required this.player});

  final Player player;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            PlayerAvatar(player: player, size: 84),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(player.fullName, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900)),
                  const SizedBox(height: 6),
                  StatusPill(text: Labels.enrollment(player.enrollmentStatus), tone: enrollmentTone(player.enrollmentStatus)),
                  const SizedBox(height: 8),
                  Text(player.category?.name ?? 'Categoría por asignar',
                      style: const TextStyle(fontWeight: FontWeight.w600)),
                  Text(
                    'Dorsal ${player.jerseyNumber ?? '–'} · ${Labels.position(player.position)}',
                    style: const TextStyle(color: ClubColors.gray),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ScheduleCard extends StatelessWidget {
  const _ScheduleCard({required this.detail});

  final PlayerDetail detail;

  @override
  Widget build(BuildContext context) {
    final player = detail.player;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('HORARIO Y SEDE', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16)),
            const SizedBox(height: 10),
            if (detail.schedule.isEmpty)
              const Text('El horario aparecerá cuando se asigne la categoría.',
                  style: TextStyle(color: ClubColors.gray)),
            for (final slot in detail.schedule)
              Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(color: ClubColors.background, borderRadius: BorderRadius.circular(10)),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                            child: Text(slot.weekdayName, style: const TextStyle(fontWeight: FontWeight.w700))),
                        Text(
                          '${Formats.time(slot.startTime)} – ${Formats.time(slot.endTime)}',
                          style: const TextStyle(color: ClubColors.red, fontWeight: FontWeight.w800),
                        ),
                      ],
                    ),
                    const SizedBox(height: 2),
                    Text('📍 ${slot.venueName}', style: const TextStyle(color: ClubColors.gray, fontSize: 13)),
                  ],
                ),
              ),
            if (detail.schedule.isNotEmpty)
              Text(
                'Entrena en ${Labels.trainingShift(player.trainingShift).toLowerCase()} '
                '(colegio en la ${Labels.schoolShift(player.schoolShift).toLowerCase()}).',
                style: const TextStyle(color: ClubColors.gray, fontSize: 13),
              ),
          ],
        ),
      ),
    );
  }
}

class _DataCard extends StatelessWidget {
  const _DataCard({required this.detail});

  final PlayerDetail detail;

  @override
  Widget build(BuildContext context) {
    final player = detail.player;
    final health = detail.health;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('DATOS DEL DEPORTISTA', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16)),
            const SizedBox(height: 6),
            InfoRow(label: 'Documento', value: '${player.documentType} ${player.documentNumber}'),
            InfoRow(label: 'Nacimiento', value: '${Formats.date(player.birthDate)} (${player.age} años)'),
            InfoRow(label: 'Colegio', value: player.schoolName),
            InfoRow(label: 'EPS / RH', value: '${health.eps} · ${health.bloodType ?? '—'}'),
            InfoRow(label: 'Alergias', value: health.allergies ?? 'Ninguna registrada'),
            InfoRow(
              label: 'Contacto de emergencia',
              value: '${health.emergencyName} · ${Formats.phone(health.emergencyPhone)}',
            ),
          ],
        ),
      ),
    );
  }
}
