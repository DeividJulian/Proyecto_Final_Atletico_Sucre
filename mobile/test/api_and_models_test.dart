import 'dart:convert';

import 'package:atletico_sucre/core/api_client.dart';
import 'package:atletico_sucre/core/token_storage.dart';
import 'package:atletico_sucre/data/models/player.dart';
import 'package:atletico_sucre/data/repositories/auth_repository.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';

const _base = 'https://api.test';

Map<String, dynamic> _playerJson({int id = 1, String status = 'approved'}) => {
      'id': id,
      'first_names': 'Mateo',
      'last_names': 'Prueba Uno',
      'full_name': 'Mateo Prueba Uno',
      'document_type': 'TI',
      'document_number': '1000000001',
      'birth_date': '2015-03-14',
      'age': 11,
      'sex': 'M',
      'category': {'id': 4, 'name': 'Categoría 2014-2015', 'birth_year_from': 2014, 'birth_year_to': 2015, 'gender': 'mixed'},
      'has_photo': false,
      'jersey_number': 10,
      'position': 'forward',
      'school_name': 'Colegio',
      'school_shift': 'morning',
      'training_shift': 'afternoon',
      'enrollment_status': status,
      'rejection_reason': null,
      'monthly_fee': 65000,
      'enrolled_at': '2026-11-06',
    };

http.Response _json(Object body, [int status = 200]) =>
    http.Response.bytes(utf8.encode(jsonEncode(body)), status, headers: {'content-type': 'application/json'});

void main() {
  group('models', () {
    test('Player and PlayerDetail parse the API answer', () {
      final detail = PlayerDetail.fromJson({
        ..._playerJson(),
        'health': {
          'eps': 'Nueva EPS',
          'blood_type': 'O+',
          'allergies': null,
          'medical_notes': null,
          'emergency_contact_name': 'Laura',
          'emergency_contact_phone': '3001112233',
        },
        'guardian': {'id': 1, 'full_name': 'Andrea', 'phone': '3000000001', 'relationship_to_player': 'mother'},
        'schedule': [
          {
            'session_id': 3, 'category_id': 4, 'category_name': 'Categoría 2014-2015', 'venue_id': 1,
            'venue_name': 'Cancha Grupo Cabal', 'weekday': 2, 'weekday_name': 'Martes',
            'start_time': '14:30:00', 'end_time': '17:30:00', 'shift': 'afternoon',
          },
        ],
      });
      expect(detail.player.fullName, 'Mateo Prueba Uno');
      expect(detail.player.category?.name, 'Categoría 2014-2015');
      expect(detail.player.isApproved, isTrue);
      expect(detail.player.initials, 'MP');
      expect(detail.health.allergies, isNull);
      expect(detail.schedule.single.venueName, 'Cancha Grupo Cabal');
    });
  });

  group('ApiClient', () {
    test('sends the token and decodes UTF-8 (tildes)', () async {
      final tokens = MemoryTokenStorage();
      await tokens.write('abc');
      late http.Request seen;
      final api = ApiClient(tokens, baseUrl: _base, client: MockClient((request) async {
        seen = request;
        return _json([_playerJson()]);
      }));
      final list = await api.get('/me/players') as List<dynamic>;
      expect(seen.headers['Authorization'], 'Bearer abc');
      expect((list.first as Map)['full_name'], 'Mateo Prueba Uno');
    });

    test('turns {"detail": ...} into a Spanish ApiException and reports 401', () async {
      var expired = false;
      final api = ApiClient(MemoryTokenStorage(), baseUrl: _base, client: MockClient((_) async {
        return _json({'detail': 'Tu sesión no es válida o expiró. Inicia sesión de nuevo.'}, 401);
      }))
        ..onUnauthorized = () => expired = true;
      await expectLater(
        api.get('/me/players'),
        throwsA(isA<ApiException>().having((e) => e.message, 'message', contains('expiró'))),
      );
      expect(expired, isTrue);
    });
  });

  group('AuthRepository', () {
    test('login stores the token; restore clears it when it expired', () async {
      final tokens = MemoryTokenStorage();
      final api = ApiClient(tokens, baseUrl: _base, client: MockClient((request) async {
        if (request.url.path == '/auth/login') {
          return _json({
            'access_token': 'jwt-1',
            'token_type': 'bearer',
            'user': {
              'id': 7, 'email': 'padre@test.com', 'role': 'parent', 'is_admin': false, 'is_active': true,
              'must_change_password': false, 'display_name': 'Andrea Gómez',
            },
          });
        }
        return _json({'detail': 'Tu sesión expiró'}, 401);
      }));
      final repository = AuthRepository(api, tokens);

      final user = await repository.login(' Padre@Test.com ', 'Clave2026');
      expect(user.isParent, isTrue);
      expect(user.firstName, 'Andrea');
      expect(await tokens.read(), 'jwt-1');

      expect(await repository.restore(), isNull);
      expect(await tokens.read(), isNull);
    });
  });
}
