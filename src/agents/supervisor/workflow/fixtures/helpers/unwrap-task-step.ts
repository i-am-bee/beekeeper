import {
  TaskStepAgentResource,
  TaskStepLLMResource,
  TaskStepResource,
  TaskStepRunResource,
  TaskStepTaskResource,
  TaskStepToolsResource,
} from "../../workflow-composer/helpers/task-step/dto.js";
import { TaskStepWithVariousResource } from "../base/resource-fixtures.js";

type ResourceOf<T extends TaskStepResource["type"]> = Extract<
  TaskStepResource,
  { type: T }
>;

export function unwrapTaskStepWithToolsOrLLM(
  step: TaskStepWithVariousResource,
): Omit<TaskStepWithVariousResource, "resource"> & {
  resource: TaskStepLLMResource | TaskStepToolsResource;
} {
  if (step.resource.values.some((r) => r.type === "llm")) {
    return unwrapTaskStep(step, "llm");
  }
  return unwrapTaskStepWithTools(step);
}

export function unwrapTaskStepWithTools(
  step: TaskStepWithVariousResource,
): Omit<TaskStepWithVariousResource, "resource"> & {
  resource: TaskStepToolsResource;
} {
  return unwrapTaskStep(step, "tools");
}
export function unwrapTaskStepWithLLM(step: TaskStepWithVariousResource): Omit<
  TaskStepWithVariousResource,
  "resource"
> & {
  resource: TaskStepLLMResource;
} {
  return unwrapTaskStep(step, "llm");
}

export function unwrapTaskStepWithAgent(
  step: TaskStepWithVariousResource,
): Omit<TaskStepWithVariousResource, "resource"> & {
  resource: TaskStepAgentResource;
} {
  return unwrapTaskStep(step, "agent");
}
export function unwrapTaskStepWithTask(step: TaskStepWithVariousResource): Omit<
  TaskStepWithVariousResource,
  "resource"
> & {
  resource: TaskStepTaskResource;
} {
  return unwrapTaskStep(step, "task");
}
export function unwrapTaskStepWithTaskRun(
  step: TaskStepWithVariousResource,
): Omit<TaskStepWithVariousResource, "resource"> & {
  resource: TaskStepRunResource;
} {
  return unwrapTaskStep(step, "task_run");
}
export function unwrapTaskStep<K extends TaskStepResource["type"]>(
  step: TaskStepWithVariousResource,
  key: K,
): Omit<TaskStepWithVariousResource, "resource"> & { resource: ResourceOf<K> } {
  const res = step.resource.get(key as K) as ResourceOf<K>;

  if (!res) {
    throw new Error(
      `Task step "${step.step}" does not contain a resource of type "${key}"`,
    );
  }
  return { ...step, resource: res };
}
