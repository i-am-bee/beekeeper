import { TaskRunMinimal } from "@/agents/supervisor/workflow/workflow-composer/task-run-initializer/dto.js";
import { createFixtures, FixtureName } from "../../../base/fixtures.js";
import { addTaskRunMissingAttrs } from "../../../helpers/add-missing-config-attrs.js";
import taskConfigFixtures from "./task-config.js";

type TaskType = FixtureName<typeof taskConfigFixtures>;

const ENTRIES = [
  {
    taskType: "forecast_electricity_demand" satisfies TaskType,
    taskRunInput: `{"blockIds": ["block-central-2", "block-north-7"], "start_time": "2025-06-05T18:00Z", "periods": "12"}`,
    taskRunNum: 1,
  },
  {
    taskType: "forecast_solar_battery" satisfies TaskType,
    taskRunInput: `{"siteIds": ["site-solar-01", "site-battery-02"], "start_time": "2025-06-05T18:00Z", "periods": "12"}`,
    taskRunNum: 1,
  },
  {
    taskType: "optimize_dispatch_schedule" satisfies TaskType,
    taskRunInput: `{ "constraint": { "freqDeviationHz": "0.2" } }`,
    taskRunNum: 1,
  },
  {
    taskType: "send_control_vectors" satisfies TaskType,
    taskRunInput: ``,
    taskRunNum: 1,
  },
] as const satisfies TaskRunMinimal[];

export default createFixtures(
  addTaskRunMissingAttrs(ENTRIES),
  ({ taskType, taskRunNum }) => `${taskType}_${taskRunNum}`,
);
