/// User of /auth/login and /auth/me.
class SessionUser {
  const SessionUser({
    required this.id,
    required this.email,
    required this.role,
    required this.isAdmin,
    required this.mustChangePassword,
    required this.displayName,
  });

  final int id;
  final String email;
  final String role;
  final bool isAdmin;
  final bool mustChangePassword;
  final String displayName;

  bool get isParent => role == 'parent';

  String get firstName => displayName.split(' ').first;

  factory SessionUser.fromJson(Map<String, dynamic> json) => SessionUser(
        id: json['id'] as int,
        email: json['email'] as String,
        role: json['role'] as String,
        isAdmin: json['is_admin'] as bool? ?? false,
        mustChangePassword: json['must_change_password'] as bool? ?? false,
        displayName: json['display_name'] as String? ?? '',
      );
}
