import { TaskStepMapper } from "@/agents/supervisor/workflow/workflow-composer/helpers/task-step/task-step-mapper.js";
import { createFixtures, FixtureName } from "../../../base/fixtures.js";
import {
  createResourceFixtures,
  TaskStepWithVariousResource,
} from "../../../base/resource-fixtures.js";
import agentsFixtures from "./agent-config.js";
import tasksFixtures from "./task-config.js";
import taskRunsFixtures from "./task-run.js";
import toolsFixtures from "./tools.js";

type ToolName = FixtureName<typeof toolsFixtures>;

const ENTRIES = [
  {
    no: 1,
    step: `Load the customer feedback dataset`,
    ...TaskStepMapper.parseInputOutput(
      `input: datasetId: "cust-feedback-2025-06"; output: array of feedback texts`,
    ),
    resource: createResourceFixtures(
      { type: "tools", tools: ["customer_feedback_dataset_api"] as ToolName[] },
      {
        type: "agent",
        agent: agentsFixtures.get(`customer_feedback_loader`),
      },
      {
        type: "task",
        task: tasksFixtures.get(`load_customer_feedback_dataset`),
      },
      {
        type: "task_run",
        taskRun: taskRunsFixtures.get("load_customer_feedback_dataset_1"),
      },
    ),
  },
  {
    no: 2,
    step: `Perform sentiment analysis on the feedback texts`,
    ...TaskStepMapper.parseInputOutput(
      `input: texts [from Step 1]; output: sentiment scores for each text`,
    ),
    resource: createResourceFixtures(
      { type: "tools", tools: ["sentiment_analysis_api"] as ToolName[] },
      { type: "agent", agent: agentsFixtures.get(`sentiment_analysis_agent`) },
      { type: "task", task: tasksFixtures.get(`perform_sentiment_analysis`) },
      {
        type: "task_run",
        taskRun: taskRunsFixtures.get("perform_sentiment_analysis_1"),
      },
    ),
  },
  {
    no: 3,
    step: `Aggregate sentiment scores`,
    ...TaskStepMapper.parseInputOutput(
      `input: sentiment scores [from Step 2]; output: aggregated sentiment report`,
    ),
    resource: createResourceFixtures(
      { type: "llm" },
      { type: "agent", agent: agentsFixtures.get(`sentiment_aggregator`) },
      { type: "task", task: tasksFixtures.get(`aggregate_sentiment_scores`) },
      {
        type: "task_run",
        taskRun: taskRunsFixtures.get("aggregate_sentiment_scores_1"),
      },
    ),
  },
] as const satisfies TaskStepWithVariousResource[];

const fixtures = createFixtures(ENTRIES, ({ step }) => step);
export default fixtures;
