// Children of the parent (/me/players and /me/players/{id}). Field names follow the API.

class CategoryBrief {
  const CategoryBrief({required this.id, required this.name, required this.yearFrom, required this.yearTo});

  final int id;
  final String name;
  final int yearFrom;
  final int yearTo;

  factory CategoryBrief.fromJson(Map<String, dynamic> json) => CategoryBrief(
        id: json['id'] as int,
        name: json['name'] as String,
        yearFrom: json['birth_year_from'] as int,
        yearTo: json['birth_year_to'] as int,
      );
}

class Player {
  const Player({
    required this.id,
    required this.firstNames,
    required this.lastNames,
    required this.fullName,
    required this.documentType,
    required this.documentNumber,
    required this.birthDate,
    required this.age,
    required this.sex,
    required this.category,
    required this.hasPhoto,
    required this.jerseyNumber,
    required this.position,
    required this.schoolName,
    required this.schoolShift,
    required this.trainingShift,
    required this.enrollmentStatus,
    required this.rejectionReason,
    required this.monthlyFee,
  });

  final int id;
  final String firstNames;
  final String lastNames;
  final String fullName;
  final String documentType;
  final String documentNumber;
  final DateTime birthDate;
  final int age;
  final String sex;
  final CategoryBrief? category;
  final bool hasPhoto;
  final int? jerseyNumber;
  final String? position;
  final String schoolName;
  final String schoolShift;
  final String trainingShift;
  final String enrollmentStatus;
  final String? rejectionReason;
  final int monthlyFee;

  bool get isApproved => enrollmentStatus == 'approved';

  String get initials =>
      '${firstNames.isNotEmpty ? firstNames[0] : ''}${lastNames.isNotEmpty ? lastNames[0] : ''}';

  factory Player.fromJson(Map<String, dynamic> json) => Player(
        id: json['id'] as int,
        firstNames: json['first_names'] as String,
        lastNames: json['last_names'] as String,
        fullName: json['full_name'] as String,
        documentType: json['document_type'] as String,
        documentNumber: json['document_number'] as String,
        birthDate: DateTime.parse(json['birth_date'] as String),
        age: json['age'] as int,
        sex: json['sex'] as String,
        category: json['category'] == null ? null : CategoryBrief.fromJson(json['category'] as Map<String, dynamic>),
        hasPhoto: json['has_photo'] as bool? ?? false,
        jerseyNumber: json['jersey_number'] as int?,
        position: json['position'] as String?,
        schoolName: json['school_name'] as String,
        schoolShift: json['school_shift'] as String,
        trainingShift: json['training_shift'] as String,
        enrollmentStatus: json['enrollment_status'] as String,
        rejectionReason: json['rejection_reason'] as String?,
        monthlyFee: json['monthly_fee'] as int,
      );
}

class ScheduleItem {
  const ScheduleItem({
    required this.sessionId,
    required this.weekday,
    required this.weekdayName,
    required this.startTime,
    required this.endTime,
    required this.venueName,
    required this.shift,
  });

  final int sessionId;
  final int weekday;
  final String weekdayName;

  /// "HH:MM:SS"
  final String startTime;
  final String endTime;
  final String venueName;
  final String shift;

  factory ScheduleItem.fromJson(Map<String, dynamic> json) => ScheduleItem(
        sessionId: json['session_id'] as int,
        weekday: json['weekday'] as int,
        weekdayName: json['weekday_name'] as String,
        startTime: json['start_time'] as String,
        endTime: json['end_time'] as String,
        venueName: json['venue_name'] as String,
        shift: json['shift'] as String,
      );
}

class PlayerHealth {
  const PlayerHealth({
    required this.eps,
    required this.bloodType,
    required this.allergies,
    required this.medicalNotes,
    required this.emergencyName,
    required this.emergencyPhone,
  });

  final String eps;
  final String? bloodType;
  final String? allergies;
  final String? medicalNotes;
  final String emergencyName;
  final String emergencyPhone;

  factory PlayerHealth.fromJson(Map<String, dynamic> json) => PlayerHealth(
        eps: json['eps'] as String,
        bloodType: json['blood_type'] as String?,
        allergies: json['allergies'] as String?,
        medicalNotes: json['medical_notes'] as String?,
        emergencyName: json['emergency_contact_name'] as String,
        emergencyPhone: json['emergency_contact_phone'] as String,
      );
}

class PlayerDetail {
  const PlayerDetail({required this.player, required this.health, required this.schedule});

  final Player player;
  final PlayerHealth health;
  final List<ScheduleItem> schedule;

  factory PlayerDetail.fromJson(Map<String, dynamic> json) => PlayerDetail(
        player: Player.fromJson(json),
        health: PlayerHealth.fromJson(json['health'] as Map<String, dynamic>),
        schedule: (json['schedule'] as List<dynamic>)
            .map((item) => ScheduleItem.fromJson(item as Map<String, dynamic>))
            .toList(),
      );
}
