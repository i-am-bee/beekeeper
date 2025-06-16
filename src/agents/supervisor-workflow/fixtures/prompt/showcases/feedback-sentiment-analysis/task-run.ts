import { TaskRunMinimal } from "@/agents/supervisor-workflow/workflow-composer/task-run-initializer/dto.js";
import { createFixtures, FixtureName } from "../../../base/fixtures.js";
import { addTaskRunMissingAttrs } from "../../../helpers/add-missing-config-attrs.js";
import taskConfigFixtures from "./task-config.js";

type TaskType = FixtureName<typeof taskConfigFixtures>;
const ENTRIES = [
  {
    taskType: `load_customer_feedback_dataset` satisfies TaskType,
    taskRunInput: `{"datasetId": "cust-feedback-2025-06"}`,
    taskRunNum: 1,
  },
  {
    taskType: `perform_sentiment_analysis` satisfies TaskType,
    taskRunInput: ``,
    taskRunNum: 1,
  },
  {
    taskType: `aggregate_sentiment_scores` satisfies TaskType,
    taskRunInput: ``,
    taskRunNum: 1,
  },
] as const satisfies TaskRunMinimal[];

export default createFixtures(
  addTaskRunMissingAttrs(ENTRIES),
  ({ taskType, taskRunNum }) => `${taskType}_${taskRunNum}`,
);
