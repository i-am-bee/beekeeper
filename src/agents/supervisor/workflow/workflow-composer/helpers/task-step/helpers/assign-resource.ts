import { TaskStepWithVariousResource } from "@/agents/supervisor/workflow/fixtures/base/resource-fixtures.js";
import { TaskStep, TaskStepResource } from "../dto.js";
import { clone } from "remeda";

export function assignResource<R extends TaskStepResource>(
  step: TaskStep,
  resource: R,
): Omit<TaskStepWithVariousResource, "resource"> & { resource: R } {
  return clone({
    ...step,
    resource,
  });
}
