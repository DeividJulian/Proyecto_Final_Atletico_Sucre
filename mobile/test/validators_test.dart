import 'package:atletico_sucre/core/labels.dart';
import 'package:atletico_sucre/core/validators.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('Validators (same rules as the API)', () {
    test('Colombian mobile numbers', () {
      expect(Validators.phone('321 854 3957'), isNull);
      expect(Validators.phone('+57 321-854-3957'), isNull);
      expect(Validators.phone('6017771234'), isNotNull);
      expect(Validators.phone('', optional: true), isNull);
      expect(Validators.normalizePhone('+57 321 854 3957'), '3218543957');
    });

    test('documents, names, email and password', () {
      expect(Validators.document('1.085.333.444'), isNull);
      expect(Validators.document('12'), isNotNull);
      expect(Validators.personName('María José Ñañez'), isNull);
      expect(Validators.personName('Juan123'), 'Solo letras, espacios, apóstrofo y guion.');
      expect(Validators.email('padre@club.co'), isNull);
      expect(Validators.email('padre@'), 'Escribe un correo válido.');
      expect(Validators.password('corta1'), 'La contraseña debe tener al menos 8 caracteres.');
      expect(Validators.password('solamenteletras'), 'La contraseña debe tener letras y números.');
      expect(Validators.password('Clave2026'), isNull);
    });

    test('player birth date', () {
      final today = DateTime(2026, 11, 7);
      expect(Validators.birthDate(DateTime(2015, 5, 10), today: today), isNull);
      expect(Validators.birthDate(DateTime(2027, 1, 1), today: today), 'La fecha debe ser anterior a hoy.');
      expect(Validators.birthDate(DateTime(2025, 1, 1), today: today), 'El deportista debe tener al menos 3 años.');
      expect(Validators.birthDate(null), 'Este campo es obligatorio.');
    });
  });

  group('Formats', () {
    test('time, money and phone', () {
      expect(Formats.time('08:00:00'), '8:00 a. m.');
      expect(Formats.time('14:30:00'), '2:30 p. m.');
      expect(Formats.time('12:30:00'), '12:30 p. m.');
      expect(Formats.cop(65000), '\$ 65.000');
      expect(Formats.phone('573218543957'), '321 854 3957');
    });

    test('labels in Spanish', () {
      expect(Labels.enrollment('pending'), 'Pendiente de aprobación');
      expect(Labels.trainingShift('afternoon'), 'Jornada tarde');
      expect(Labels.position(null), 'Sin definir');
    });
  });
}
