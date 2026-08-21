import 'package:flutter/foundation.dart';

/// Stable FireOpsSim deep links with Career Road return handoff.
@immutable
class FireOpsSimLinks {
  const FireOpsSimLinks._();

  static const String host = 'fireopssim.com';
  static const String returnScheme = 'firepath';

  static const Set<String> _emsCerts = {
    'emt',
    'aemt',
    'paramedic',
    'bls',
    'acls',
    'pals',
  };

  static const Set<String> _icsCerts = {
    'ics_100',
    'ics_200',
    'ics_300',
    'ics_400',
    'is_700',
    'is_800',
  };

  static Uri careerReturnUri({
    required String path,
    Map<String, String>? query,
  }) =>
      Uri(
        scheme: returnScheme,
        path: path,
        queryParameters: query?.isEmpty ?? true ? null : query,
      );

  static Uri dailyFocusReturnUri() => careerReturnUri(path: '/daily-focus');

  static Uri taskDetailReturnUri({
    required String goalId,
    required String requirementId,
    required String taskId,
  }) =>
      careerReturnUri(
        path: '/return/task',
        query: {
          'goalId': goalId,
          'requirementId': requirementId,
          'taskId': taskId,
        },
      );

  static String schoolFinderPath(String certId) {
    if (_emsCerts.contains(certId)) return 'ems';
    if (_icsCerts.contains(certId)) return 'ics';
    return 'fire';
  }

  static String? focusLevelForCert(String? certId) {
    switch (certId) {
      case 'firefighter_1':
        return 'firefighter_1';
      case 'firefighter_2':
        return 'firefighter_2';
      case 'hazmat_awareness':
      case 'hazmat_operations':
      case 'hazmat_technician':
        return 'hazmat_ops';
      case 'driver_operator_pumper':
      case 'driver_operator_aerial':
        return 'driver_operator';
      case 'fire_officer_1':
      case 'fire_officer_2':
      case 'fire_officer_3':
      case 'fire_officer_4':
      case 'fire_inspector_1':
      case 'fire_inspector_2':
      case 'fire_investigator':
      case 'ics_100':
      case 'ics_200':
      case 'ics_300':
      case 'ics_400':
      case 'is_700':
      case 'is_800':
        return 'officer_1';
      case 'fire_instructor_1':
      case 'fire_instructor_2':
        return 'instructor_1';
      case 'emt':
      case 'aemt':
      case 'paramedic':
      case 'bls':
      case 'acls':
      case 'pals':
        return 'firefighter_2';
      default:
        return null;
    }
  }

  static String? focusLevelForRequirementName(String? name) {
    final n = (name ?? '').trim().toLowerCase();
    if (n.isEmpty) return null;
    if (n.contains('probation') || n.contains('academy') || n.contains('rookie')) {
      return 'probationary';
    }
    if (n.contains('firefighter ii') || n.contains('firefighter 2') || n == 'ff2') {
      return 'firefighter_2';
    }
    if (n.contains('firefighter i') || n.contains('firefighter 1') || n == 'ff1') {
      return 'firefighter_1';
    }
    if (n.contains('hazmat')) return 'hazmat_ops';
    if (n.contains('driver') || n.contains('operator') || n.contains('engineer')) {
      return 'driver_operator';
    }
    if (n.contains('instructor')) return 'instructor_1';
    if (n.contains('officer') || n.contains('lieutenant') || n.contains('captain')) {
      return 'officer_1';
    }
    return null;
  }

  static Map<String, String> _sharedQuery({
    String? returnUrl,
    String? stateCode,
    String? goal,
  }) {
    final state = stateCode?.trim().toUpperCase();
    return {
      'source': 'roadmap',
      if (returnUrl != null && returnUrl.isNotEmpty) 'return_url': returnUrl,
      if (state != null && state.isNotEmpty) 'state': state,
      if (goal != null && goal.isNotEmpty) 'goal': goal,
    };
  }

  static Uri taskbookResourcesUri({
    required String certId,
    String? taskId,
    String? stateCode,
    String? goal,
    String? returnUrl,
  }) {
    final q = {
      'cert': certId,
      ..._sharedQuery(returnUrl: returnUrl, stateCode: stateCode, goal: goal),
      if (taskId != null && taskId.isNotEmpty) 'task': taskId,
    };
    return Uri.https(host, '/taskbook-resources.html', q);
  }

  static Uri studyGuidesUri({
    required String certId,
    String? returnUrl,
  }) =>
      Uri.https(
        host,
        '/study-guides.html',
        {
          'cert': certId,
          ..._sharedQuery(returnUrl: returnUrl),
        },
      );

  static Uri schoolFinderUri({
    required String certId,
    String? stateCode,
    String? returnUrl,
  }) =>
      Uri.https(
        host,
        '/school-finder.html',
        {
          'cert': certId,
          'path': schoolFinderPath(certId),
          ..._sharedQuery(returnUrl: returnUrl, stateCode: stateCode),
        },
      );

  static Uri focusDrillsUri({
    String? level,
    String? topic,
    String? certId,
    String? goal,
    String? returnUrl,
  }) {
    final resolvedLevel =
        level ?? focusLevelForCert(certId) ?? focusLevelForRequirementName(topic);
    final q = {
      ..._sharedQuery(returnUrl: returnUrl, goal: goal),
      if (resolvedLevel != null && resolvedLevel.isNotEmpty) 'level': resolvedLevel,
      if (topic != null && topic.isNotEmpty) 'topic': topic,
      if (certId != null && certId.isNotEmpty) 'cert': certId,
    };
    return Uri.https(host, '/focus-drills.html', q);
  }
}
