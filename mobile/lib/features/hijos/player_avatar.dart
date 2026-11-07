import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme.dart';
import '../../data/models/player.dart';
import 'children_providers.dart';

/// Round photo of the child, or their initials when there is no photo.
class PlayerAvatar extends ConsumerWidget {
  const PlayerAvatar({super.key, required this.player, this.size = 64});

  final Player player;
  final double size;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final initials = Text(
      player.initials,
      style: TextStyle(color: ClubColors.goldLight, fontWeight: FontWeight.w800, fontSize: size * 0.32),
    );
    final photo = player.hasPhoto ? ref.watch(childPhotoProvider(player.id)).valueOrNull : null;
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: ClubColors.black,
        border: Border.all(color: ClubColors.gold, width: 3),
        image: photo == null ? null : DecorationImage(image: MemoryImage(photo), fit: BoxFit.cover),
      ),
      alignment: Alignment.center,
      child: photo == null ? initials : null,
    );
  }
}
