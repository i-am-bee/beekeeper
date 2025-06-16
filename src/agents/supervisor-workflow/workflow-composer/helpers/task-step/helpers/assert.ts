import { TaskStepAssignedResourceEnum, TaskStep } from "../dto.js";
import { TaskStepResourceAssignError } from "../task-step-mapper.js";

export function assertTaskStepResourceType<
  T extends TaskStepAssignedResourceEnum,
>(
  taskStep: TaskStep,
  expectedType: T,
): asserts taskStep is TaskStep & {
  resource: Extract<TaskStep["resource"], { type: T }>;
} {
  if (taskStep.resource.type !== expectedType) {
    throw new Error(
      `Expected task step to have resource type "${expectedType}", but got "${taskStep.resource.type}".`,
    );
  }
}

export function assertTaskSteps(
  input: (TaskStep | TaskStepResourceAssignError)[],
): asserts input is TaskStep[] {
  for (const it of input) {
    if (it instanceof TaskStepResourceAssignError) {
      throw new Error(`Task step resource assignment error: ${it.message}`);
    }
  }
}
