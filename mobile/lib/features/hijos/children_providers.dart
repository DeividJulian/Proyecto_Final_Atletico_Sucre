import 'dart:typed_data';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/server_status.dart';
import '../../data/models/player.dart';
import '../../data/repositories/family_repository.dart';

/// My children. Waits for the server first (Render may be asleep).
final childrenProvider = FutureProvider.autoDispose<List<Player>>((ref) async {
  await ref.read(serverStatusProvider.notifier).ensureAwake();
  return ref.read(familyRepositoryProvider).players();
});

/// One child with health data and the schedule of their shift.
final childDetailProvider = FutureProvider.autoDispose.family<PlayerDetail, int>((ref, id) async {
  await ref.read(serverStatusProvider.notifier).ensureAwake();
  return ref.read(familyRepositoryProvider).player(id);
});

/// Private photo (needs the session), null when the child has none.
final childPhotoProvider = FutureProvider.autoDispose.family<Uint8List?, int>((ref, id) {
  return ref.read(familyRepositoryProvider).photo(id);
});
