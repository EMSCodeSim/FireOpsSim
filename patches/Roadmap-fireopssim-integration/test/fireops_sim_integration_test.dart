import 'package:flutter_test/flutter_test.dart';

import 'package:firepath/models/requirement.dart';
import 'package:firepath/services/fireops_sim_links.dart';
import 'package:firepath/services/task_book_library.dart';

Requirement _certRequirement({
  required String id,
  required String name,
  required String certificationDefinitionId,
}) {
  final now = DateTime(2026, 8, 20);
  return Requirement(
    id: id,
    name: name,
    category: 'Certification',
    priority: RequirementPriority.core,
    description: name,
    type: RequirementType.certification,
    requirementSource: RequirementSource.commonlyRequired,
    defaultRequired: true,
    stateDependent: false,
    departmentDependent: false,
    completed: false,
    progressCurrent: null,
    progressRequired: null,
    progressUnit: null,
    experienceValue: null,
    experienceUnit: null,
    certificationReference: name,
    certificationDefinitionId: certificationDefinitionId,
    allowExpiredCertification: false,
    prerequisiteRequirementIds: const [],
    resourceIds: const [],
    resourceLinks: const [],
    sortOrder: 10,
    estimatedDurationDays: null,
    recommendedLeadTimeDays: null,
    canRunConcurrent: true,
    timelineCategory: TimelineCategory.certification,
    suggestedStartDate: null,
    suggestedCompletionDate: null,
    createdAt: now,
    updatedAt: now,
  );
}

void main() {
  test('FireOpsSim taskbook links include return_url and source=roadmap', () {
    final uri = FireOpsSimLinks.taskbookResourcesUri(
      certId: 'driver_operator_pumper',
      taskId: 'do_pumper_hydrant_ops',
      stateCode: 'CO',
      goal: 'Engineer',
      returnUrl:
          'firepath:///return/task?goalId=g1&requirementId=r1&taskId=do_pumper_hydrant_ops',
    );
    expect(uri.host, 'fireopssim.com');
    expect(uri.queryParameters['source'], 'roadmap');
    expect(uri.queryParameters['cert'], 'driver_operator_pumper');
    expect(uri.queryParameters['task'], 'do_pumper_hydrant_ops');
    expect(uri.queryParameters['state'], 'CO');
    expect(uri.queryParameters['return_url'], startsWith('firepath://'));
  });

  test('school finder uses ICS path for ICS certifications', () {
    final uri = FireOpsSimLinks.schoolFinderUri(certId: 'ics_100');
    expect(uri.queryParameters['path'], 'ics');
    expect(uri.queryParameters['cert'], 'ics_100');
  });

  test('focus drills map certification to training level', () {
    final uri = FireOpsSimLinks.focusDrillsUri(
      certId: 'hazmat_operations',
      topic: 'Isolation and zones',
      returnUrl: FireOpsSimLinks.dailyFocusReturnUri().toString(),
    );
    expect(uri.path, '/focus-drills.html');
    expect(uri.queryParameters['level'], 'hazmat_ops');
    expect(uri.queryParameters['source'], 'roadmap');
    expect(uri.queryParameters['return_url'], startsWith('firepath://'));
  });

  test('TaskBookLibrary serves expanded certification prep tasks', () {
    final req = _certRequirement(
      id: 'req_ff1',
      name: 'Firefighter I',
      certificationDefinitionId: 'firefighter_1',
    );
    final tasks = TaskBookLibrary.tasksForRequirement(req);
    expect(tasks.length, greaterThanOrEqualTo(3));
    expect(tasks.map((t) => t.id), contains('ff1_ppe_scba'));
  });

  test('investigator tasks use FireOpsSim-aligned task IDs', () {
    final req = _certRequirement(
      id: 'req_inv',
      name: 'Fire Investigator',
      certificationDefinitionId: 'fire_investigator',
    );
    final tasks = TaskBookLibrary.tasksForRequirement(req);
    expect(tasks.map((t) => t.id), containsAll(['inv_cert', 'inv_oc', 'inv_evidence']));
  });
}
