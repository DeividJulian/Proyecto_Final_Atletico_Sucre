import 'package:intl/intl.dart';

/// Spanish labels for the values the API stores in English, and small formatters.
class Labels {
  static const _enrollment = {
    'pending': 'Pendiente de aprobación',
    'approved': 'Aprobada',
    'rejected': 'No aprobada',
    'inactive': 'Inactiva',
  };
  static const _trainingShift = {'morning': 'Jornada mañana', 'afternoon': 'Jornada tarde', 'all': 'Ambas jornadas'};
  static const _schoolShift = {'morning': 'Mañana', 'afternoon': 'Tarde', 'full_day': 'Jornada única'};
  static const _position = {
    'goalkeeper': 'Portero',
    'defender': 'Defensa',
    'midfielder': 'Mediocampista',
    'forward': 'Delantero',
  };

  static String enrollment(String value) => _enrollment[value] ?? value;
  static String trainingShift(String value) => _trainingShift[value] ?? value;
  static String schoolShift(String value) => _schoolShift[value] ?? value;
  static String position(String? value) => value == null ? 'Sin definir' : (_position[value] ?? value);
}

class Formats {
  static final _cop = NumberFormat.decimalPattern('es_CO');

  /// 65000 → "$ 65.000"
  static String cop(int value) => '\$ ${_cop.format(value).replaceAll(',', '.')}';

  /// "14:30:00" → "2:30 p. m."
  static String time(String value) {
    final parts = value.split(':');
    final hours = int.parse(parts[0]);
    final minutes = parts.length > 1 ? parts[1] : '00';
    final suffix = hours < 12 ? 'a. m.' : 'p. m.';
    final hour12 = hours % 12 == 0 ? 12 : hours % 12;
    return '$hour12:$minutes $suffix';
  }

  /// "3218543957" → "321 854 3957"
  static String phone(String value) {
    final digits = value.replaceAll(RegExp(r'\D'), '').replaceFirst(RegExp(r'^57(?=3\d{9}$)'), '');
    if (digits.length != 10) return value;
    return '${digits.substring(0, 3)} ${digits.substring(3, 6)} ${digits.substring(6)}';
  }

  static String date(DateTime value) => DateFormat("d 'de' MMMM 'de' y", 'es').format(value);
}
