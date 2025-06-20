import { TaskRunMinimal } from "@/agents/supervisor/workflow/workflow-composer/task-run-initializer/dto.js";
import { createFixtures, FixtureName } from "../../../base/fixtures.js";
import { addTaskRunMissingAttrs } from "../../../helpers/add-missing-config-attrs.js";
import taskConfigFixtures from "./task-config.js";

type TaskType = FixtureName<typeof taskConfigFixtures>;
const ENTRIES = [
  {
    taskType: `TBD` satisfies TaskType,
    taskRunInput: `TBD`,
    taskRunNum: 1,
  },
  {
    taskType: `TBD` satisfies TaskType,
    taskRunInput: `TBD`,
    taskRunNum: 2,
  },
  {
    taskType: `TBD` satisfies TaskType,
    taskRunInput: `TBD`,
    taskRunNum: 3,
  },
  {
    taskType: `TBD` satisfies TaskType,
    taskRunInput: `TBD`,
    taskRunNum: 4,
  },
  {
    taskType: `TBD` satisfies TaskType,
    taskRunInput: `TBD`,
    taskRunNum: 1,
  },
  {
    taskType: `TBD` satisfies TaskType,
    taskRunInput: `TBD`,
    taskRunNum: 1,
  },
] as const satisfies TaskRunMinimal[];

export default createFixtures(
  addTaskRunMissingAttrs(ENTRIES),
  ({ taskType, taskRunNum }) => `${taskType}_${taskRunNum}`,
);
