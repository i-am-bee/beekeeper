import { TaskRunMinimal } from "@/agents/supervisor/workflow/workflow-composer/task-run-initializer/dto.js";

import taskConfigFixtures from "./task-config.js";
import { FixtureName, createFixtures } from "../../base/fixtures.js";
import { addTaskRunMissingAttrs } from "../../helpers/add-missing-config-attrs.js";

type TaskType = FixtureName<typeof taskConfigFixtures>;

const ENTRIES = [
  {
    taskType: "find_historical_sites" satisfies TaskType,
    taskRunInput: `{"location": "Back Bay"}`,
    taskRunNum: 1,
  },
  {
    taskType: "search_sports_events" satisfies TaskType,
    taskRunInput: `{"location": "Boston", "duration": "3 days"}`,
    taskRunNum: 1,
  },
  {
    taskType: "search_dining_recommendations" satisfies TaskType,
    taskRunInput: `{"location": "Boston", "dining_preferences": ["Italian", "Chinese", "French"]}`,
    taskRunNum: 1,
  },
  {
    taskType: "compile_itinerary" satisfies TaskType,
    taskRunInput: ``,
    taskRunNum: 1,
  },
  // {
  //   taskType: "retrieve_field_metadata" satisfies TaskType,
  //   taskRunInput: `{ "field_identifier": "South Field" }`,
  //   taskRunNum: 1,
  // },
] as const satisfies TaskRunMinimal[];

export default createFixtures(
  addTaskRunMissingAttrs(ENTRIES),
  ({ taskType, taskRunNum }) => `${taskType}_${taskRunNum}`,
);
