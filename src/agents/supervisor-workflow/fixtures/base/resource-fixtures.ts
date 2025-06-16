import {
  TaskStep,
  TaskStepResource,
} from "../../workflow-composer/helpers/task-step/dto.js";
import { createFixtures } from "./fixtures.js";

export function createResourceFixtures(...entries: TaskStepResource[]) {
  return createFixtures(entries, ({ type }) => type);
}

export type TaskStepWithVariousResource = Omit<TaskStep, "resource"> & {
  resource: ReturnType<typeof createResourceFixtures>;
};
