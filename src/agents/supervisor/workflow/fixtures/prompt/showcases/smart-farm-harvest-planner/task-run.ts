import { TaskRunMinimal } from "@/agents/supervisor/workflow/workflow-composer/task-run-initializer/dto.js";
import { createFixtures, FixtureName } from "../../../base/fixtures.js";
import { addTaskRunMissingAttrs } from "../../../helpers/add-missing-config-attrs.js";
import taskConfigFixtures from "./task-config.js";

type TaskType = FixtureName<typeof taskConfigFixtures>;

const ENTRIES = [
  {
    taskType: "retrieve_field_metadata" satisfies TaskType,
    taskRunInput: `{ "field_identifier": "South Field" }`,
    taskRunNum: 1,
  },
  {
    taskType: "retrieve_equipment_ids" satisfies TaskType,
    taskRunInput: ``,
    taskRunNum: 1,
  },
  {
    taskType: "retrieve_weather_forecast" satisfies TaskType,
    taskRunInput: ``,
    taskRunNum: 1,
  },
  {
    taskType: "check_equipment_operational_status" satisfies TaskType,
    taskRunInput: ``,
    taskRunNum: 1,
  },
  {
    taskType: "generate_harvest_schedule" satisfies TaskType,
    taskRunInput: ``,
    taskRunNum: 1,
  },
  {
    taskType: "generate_harvest_timeline" satisfies TaskType,
    taskRunInput: ``,
    taskRunNum: 1,
  },
] as const satisfies TaskRunMinimal[];

export default createFixtures(
  addTaskRunMissingAttrs(ENTRIES),
  ({ taskType, taskRunNum }) => `${taskType}_${taskRunNum}`,
);
