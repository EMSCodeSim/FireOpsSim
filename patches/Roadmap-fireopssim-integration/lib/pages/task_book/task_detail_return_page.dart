import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import 'package:firepath/models/requirement.dart';
import 'package:firepath/models/task_book.dart';
import 'package:firepath/nav.dart';
import 'package:firepath/pages/task_book/task_detail_page.dart';
import 'package:firepath/services/task_book_library.dart';
import 'package:firepath/state/app_state.dart';

/// Opens a Task Book task from a FireOpsSim `firepath://return/task` handoff.
class TaskDetailReturnPage extends StatelessWidget {
  final Map<String, String> query;
  const TaskDetailReturnPage({super.key, required this.query});

  @override
  Widget build(BuildContext context) {
    final goalId = query['goalId']?.trim() ?? '';
    final requirementId = query['requirementId']?.trim() ?? '';
    final taskId = query['taskId']?.trim() ?? '';

    if (goalId.isEmpty || requirementId.isEmpty || taskId.isEmpty) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (context.mounted) context.go(AppRoutes.dailyFocus);
      });
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    final state = context.watch<AppState>();
    final roadmap = state.roadmap;
    Requirement? requirement;
    String? qualificationName;
    if (roadmap != null) {
      for (final item in roadmap.included) {
        if (item.requirement.id == requirementId) {
          requirement = item.requirement;
          qualificationName = item.requirement.name;
          break;
        }
      }
    }

    TaskBookTaskDefinition? task;
    if (requirement != null) {
      final tasks = <TaskBookTaskDefinition>[
        ...TaskBookLibrary.tasksForRequirement(requirement),
        ...state.customTasksFor(goalId: goalId, requirementId: requirementId),
      ];
      for (final candidate in tasks) {
        if (candidate.id == taskId) {
          task = candidate;
          break;
        }
      }
    }

    if (task == null || requirement == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Return to Career Road')),
        body: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text(
                'We could not reopen that exact preparation task. Your Career Road progress is still saved.',
              ),
              const SizedBox(height: 16),
              FilledButton(
                onPressed: () => context.go(AppRoutes.dailyFocus),
                child: const Text('Open Daily Focus'),
              ),
              const SizedBox(height: 8),
              OutlinedButton(
                onPressed: () => context.go(AppRoutes.myPath),
                child: const Text('Open Task Book'),
              ),
            ],
          ),
        ),
      );
    }

    return TaskDetailPage(
      extra: {
        'goalId': goalId,
        'requirementId': requirementId,
        'qualificationName': qualificationName,
        'task': task,
      },
    );
  }
}
