/// Same rules and Spanish messages as the backend (schemas.py) and the website.
class Validators {
  static final _name = RegExp(r"^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' .-]+$");
  static final _email = RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$');

  static String? required(String? value) =>
      (value == null || value.trim().isEmpty) ? 'Este campo es obligatorio.' : null;

  static String? email(String? value) {
    final empty = required(value);
    if (empty != null) return empty;
    return _email.hasMatch(value!.trim()) ? null : 'Escribe un correo válido.';
  }

  static String? personName(String? value, {int min = 2}) {
    final empty = required(value);
    if (empty != null) return empty;
    final text = value!.trim();
    if (text.length < min) return 'Debe tener al menos $min caracteres.';
    return _name.hasMatch(text) ? null : 'Solo letras, espacios, apóstrofo y guion.';
  }

  /// "321 854 3957", "+57 3218543957" → "3218543957"
  static String normalizePhone(String raw) {
    var digits = raw.replaceAll(RegExp(r'[\s\-().]'), '');
    if (digits.startsWith('+57')) {
      digits = digits.substring(3);
    } else if (digits.startsWith('57') && digits.length == 12) {
      digits = digits.substring(2);
    }
    return digits;
  }

  static String? phone(String? value, {bool optional = false}) {
    if (value == null || value.trim().isEmpty) return optional ? null : 'Este campo es obligatorio.';
    return RegExp(r'^3\d{9}$').hasMatch(normalizePhone(value))
        ? null
        : 'Celular colombiano de 10 dígitos que empiece por 3.';
  }

  static String normalizeDocument(String raw) => raw.replaceAll(RegExp(r'[\s.\-]'), '').toUpperCase();

  static String? document(String? value) {
    final empty = required(value);
    if (empty != null) return empty;
    return RegExp(r'^[A-Z0-9]{5,15}$').hasMatch(normalizeDocument(value!))
        ? null
        : 'Entre 5 y 15 letras o números, sin puntos ni espacios.';
  }

  static String? password(String? value) {
    if (value == null || value.isEmpty) return 'Este campo es obligatorio.';
    if (value.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
    final mixed = RegExp(r'[A-Za-z]').hasMatch(value) && RegExp(r'\d').hasMatch(value);
    return mixed ? null : 'La contraseña debe tener letras y números.';
  }

  /// Player birth date: in the past, between 3 and 20 years ago.
  static String? birthDate(DateTime? value, {DateTime? today}) {
    if (value == null) return 'Este campo es obligatorio.';
    final now = today ?? DateTime.now();
    if (!value.isBefore(DateTime(now.year, now.month, now.day))) return 'La fecha debe ser anterior a hoy.';
    final years = now.year - value.year;
    if (years < 3) return 'El deportista debe tener al menos 3 años.';
    if (years > 20) return 'Revisa la fecha: el club forma deportistas de 4 a 16 años.';
    return null;
  }
}
