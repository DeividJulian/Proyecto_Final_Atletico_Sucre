import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/labels.dart';
import '../../core/theme.dart';
import '../../data/models/player.dart';
import '../../shared/widgets.dart';
import '../auth/auth_controller.dart';
import 'children_providers.dart';
import 'player_avatar.dart';

class ChildrenScreen extends ConsumerWidget {
  const ChildrenScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authControllerProvider).valueOrNull;
    final children = ref.watch(childrenProvider);

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Image.asset('assets/escudo.png', width: 34, height: 34),
            const SizedBox(width: 10),
            const Text('Mis hijos', style: TextStyle(fontWeight: FontWeight.w800)),
          ],
        ),
        actions: [
          IconButton(
            tooltip: 'Cerrar sesión',
            icon: const Icon(Icons.logout),
            onPressed: () => ref.read(authControllerProvider.notifier).logout(),
          ),
        ],
      ),
      body: RefreshIndicator(
        color: ClubColors.red,
        onRefresh: () => ref.refresh(childrenProvider.future),
        child: children.when(
          loading: () => const Center(child: CircularProgressIndicator(color: ClubColors.red)),
          error: (error, _) => ListView(children: [
            const SizedBox(height: 80),
            ErrorView(message: error.toString(), onRetry: () => ref.invalidate(childrenProvider)),
          ]),
          data: (list) => ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Text('Hola, ${user?.firstName ?? ''}',
                  style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w900)),
              const Text('Toca a tu hijo para ver su horario, sede y más.',
                  style: TextStyle(color: ClubColors.gray)),
              const SizedBox(height: 16),
              if (list.isEmpty)
                const Card(
                  child: Padding(
                    padding: EdgeInsets.all(24),
                    child: Text('Todavía no tienes hijos inscritos.', textAlign: TextAlign.center),
                  ),
                ),
              for (final player in list) ...[
                _ChildCard(player: player),
                const SizedBox(height: 12),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _ChildCard extends StatelessWidget {
  const _ChildCard({required this.player});

  final Player player;

  @override
  Widget build(BuildContext context) {
    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => context.push('/hijos/${player.id}'),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  PlayerAvatar(player: player),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(player.fullName, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
                        const SizedBox(height: 4),
                        StatusPill(
                          text: Labels.enrollment(player.enrollmentStatus),
                          tone: enrollmentTone(player.enrollmentStatus),
                        ),
                      ],
                    ),
                  ),
                  const Icon(Icons.chevron_right, color: ClubColors.gray),
                ],
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 24,
                runSpacing: 4,
                children: [
                  InfoRow(label: 'Categoría', value: player.category?.name ?? 'Por asignar'),
                  InfoRow(label: 'Edad', value: '${player.age} años'),
                  InfoRow(label: 'Entrena en', value: Labels.trainingShift(player.trainingShift)),
                  InfoRow(label: 'Mensualidad', value: Formats.cop(player.monthlyFee)),
                ],
              ),
              if (player.enrollmentStatus == 'pending')
                const Padding(
                  padding: EdgeInsets.only(top: 8),
                  child: Text(
                    'El club está revisando la inscripción. Te avisaremos por correo cuando sea aprobada.',
                    style: TextStyle(color: Color(0xFF7A5A00), fontSize: 13),
                  ),
                ),
              if (player.enrollmentStatus == 'rejected' && player.rejectionReason != null)
                Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: Text('Motivo: ${player.rejectionReason}',
                      style: const TextStyle(color: ClubColors.redDark, fontSize: 13)),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
