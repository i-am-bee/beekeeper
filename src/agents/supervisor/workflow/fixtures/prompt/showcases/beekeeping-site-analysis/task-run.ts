import { TaskRunMinimal } from "@/agents/supervisor/workflow/workflow-composer/task-run-initializer/dto.js";
import { createFixtures, FixtureName } from "../../../base/fixtures.js";
import { addTaskRunMissingAttrs } from "../../../helpers/add-missing-config-attrs.js";
import taskConfigFixtures from "./task-config.js";

type TaskType = FixtureName<typeof taskConfigFixtures>;
const ENTRIES = [
  {
    taskType: "analyze_flora_for_nectar_sources" satisfies TaskType,
    taskRunInput: `{"location": "Sunnybrook Farm"}`,
    taskRunNum: 1,
  },
  {
    taskType: "analyze_flora_for_nectar_sources" satisfies TaskType,
    taskRunInput: `{"location": "Meadowland Reserve"}`,
    taskRunNum: 2,
  },
  {
    taskType: `analyze_flora_for_butterfly_host_plants` satisfies TaskType,
    taskRunInput: `{"location": "Sunnybrook Farm"}`,
    taskRunNum: 1,
  },
  {
    taskType: `analyze_flora_for_butterfly_host_plants` satisfies TaskType,
    taskRunInput: `{"location": "Meadowland Reserve"}`,
    taskRunNum: 2,
  },
  {
    taskType: `compile_farming_suitability_report` satisfies TaskType,
    taskRunInput: ``,
    taskRunNum: 1,
  },
] as const satisfies TaskRunMinimal[];

export default createFixtures(
  addTaskRunMissingAttrs(ENTRIES),
  ({ taskType, taskRunNum }) => `${taskType}_${taskRunNum}`,
);
