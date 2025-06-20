import { TaskRunMinimal } from "@/agents/supervisor/workflow/workflow-composer/task-run-initializer/dto.js";
import { createFixtures, FixtureName } from "../../../base/fixtures.js";
import { addTaskRunMissingAttrs } from "../../../helpers/add-missing-config-attrs.js";
import taskConfigFixtures from "./task-config.js";

type TaskType = FixtureName<typeof taskConfigFixtures>;
const ENTRIES = [
  {
    taskType: `analyze_asteroid_mineral_composition` satisfies TaskType,
    taskRunInput: `{ "asteroid_id": "433-Eros", "analysis_depth": "deep" }`,
    taskRunNum: 1,
  },
  {
    taskType:
      `cross_reference_mineral_composition_with_orbital_mechanics` satisfies TaskType,
    taskRunInput: `{ "asteroid_id": "433-Eros" }`,
    taskRunNum: 1,
  },
  {
    taskType: `compile_mining_viability_report` satisfies TaskType,
    taskRunInput: ``,
    taskRunNum: 1,
  },
] as const satisfies TaskRunMinimal[];

export default createFixtures(
  addTaskRunMissingAttrs(ENTRIES),
  ({ taskType, taskRunNum }) => `${taskType}_${taskRunNum}`,
);
