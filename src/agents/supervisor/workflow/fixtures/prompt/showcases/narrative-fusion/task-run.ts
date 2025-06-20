import { TaskRunMinimal } from "@/agents/supervisor/workflow/workflow-composer/task-run-initializer/dto.js";
import { createFixtures, FixtureName } from "../../../base/fixtures.js";
import { addTaskRunMissingAttrs } from "../../../helpers/add-missing-config-attrs.js";
import taskConfigFixtures from "./task-config.js";

type TaskType = FixtureName<typeof taskConfigFixtures>;

const ENTRIES = [
  {
    taskType: "generate_short_story" satisfies TaskType,
    taskRunInput: `{"story_concept":"time travel"}`,
    taskRunNum: 1,
  },
  {
    taskType: "generate_short_story" satisfies TaskType,
    taskRunInput: `{"story_concept":"bioluminescent fungi"}`,
    taskRunNum: 2,
  },
  {
    taskType: "generate_short_story" satisfies TaskType,
    taskRunInput: `{"story_concept":"ancient desert rituals"}`,
    taskRunNum: 3,
  },
  {
    taskType: "generate_short_story" satisfies TaskType,
    taskRunInput: `{"story_concept":"urban foxes"}`,
    taskRunNum: 4,
  },
  {
    taskType: "merge_short_stories_into_screenplay_scene" satisfies TaskType,
    taskRunInput: ``,
    taskRunNum: 1,
  },
  {
    taskType: "analyze_screenplay_scene_convergence" satisfies TaskType,
    taskRunInput: `TBD`,
    taskRunNum: 1,
  },
] as const satisfies TaskRunMinimal[];

export default createFixtures(
  addTaskRunMissingAttrs(ENTRIES),
  ({ taskType, taskRunNum }) => `${taskType}_${taskRunNum}`,
);
