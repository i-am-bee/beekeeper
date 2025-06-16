import { TaskRunMinimal } from "@/agents/supervisor-workflow/workflow-composer/task-run-initializer/dto.js";
import { createFixtures, FixtureName } from "../../../base/fixtures.js";
import { addTaskRunMissingAttrs } from "../../../helpers/add-missing-config-attrs.js";
import taskConfigFixtures from "./task-config.js";

type TaskType = FixtureName<typeof taskConfigFixtures>;
const ENTRIES = [
  {
    taskType: `sonar_mapping_underwater_terrain` satisfies TaskType,
    taskRunInput: `{ "zone_name": "Mariana Trench", "scan_resolution": "standard", "depth_range": "full" }`,
    taskRunNum: 1,
  },
  {
    taskType: `sonar_mapping_underwater_terrain` satisfies TaskType,
    taskRunInput: `{ "zone_name": "Puerto Rico Trench", "scan_resolution": "standard", "depth_range": "full" }`,
    taskRunNum: 2,
  },
  {
    taskType: `integrated_sonar_mapping` satisfies TaskType,
    taskRunInput: `{ "zone_name": "Mariana Trench", "scan_resolution": "standard", "depth_range": "full", "bio_frequency_range": "medium", "organism_filter": "all" }`,
    taskRunNum: 1,
  },
  {
    taskType: `integrated_sonar_mapping` satisfies TaskType,
    taskRunInput: `{ "zone_name": "Puerto Rico Trench", "scan_resolution": "standard", "depth_range": "full", "bio_frequency_range": "medium", "organism_filter": "all" }`,
    taskRunNum: 2,
  },
  {
    taskType: `generate_comprehensive_comparison_report` satisfies TaskType,
    taskRunInput: ``,
    taskRunNum: 1,
  },
] as const satisfies TaskRunMinimal[];

export default createFixtures(
  addTaskRunMissingAttrs(ENTRIES),
  ({ taskType, taskRunNum }) => `${taskType}_${taskRunNum}`,
);
