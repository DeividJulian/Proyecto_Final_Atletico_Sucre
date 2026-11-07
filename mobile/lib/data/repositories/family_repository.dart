import 'dart:typed_data';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/api_client.dart';
import '../models/player.dart';

/// Parent data (/me/*). The backend checks on every call that the child belongs to this parent.
class FamilyRepository {
  FamilyRepository(this._api);

  final ApiClient _api;

  Future<List<Player>> players() async {
    final list = await _api.get('/me/players') as List<dynamic>;
    return list.map((item) => Player.fromJson(item as Map<String, dynamic>)).toList();
  }

  Future<PlayerDetail> player(int id) async {
    final json = await _api.get('/me/players/$id') as Map<String, dynamic>;
    return PlayerDetail.fromJson(json);
  }

  Future<Uint8List?> photo(int id) => _api.getBytes('/me/players/$id/photo');
}

final familyRepositoryProvider = Provider<FamilyRepository>((ref) => FamilyRepository(ref.watch(apiClientProvider)));
