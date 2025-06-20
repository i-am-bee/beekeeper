import { TaskConfigMinimal } from "@/agents/supervisor/workflow/workflow-composer/task-initializer/task-config-initializer/dto.js";
import { createFixtures, FixtureName } from "../../../base/fixtures.js";
import { addTaskConfigMissingAttrs } from "../../../helpers/add-missing-config-attrs.js";
import agentConfigFixtures from "./agent-config.js";

type AgentType = FixtureName<typeof agentConfigFixtures>;
const ENTRIES = [
  {
    taskType: `load_customer_feedback_dataset`,
    agentType: `customer_feedback_loader` satisfies AgentType,
    description: `Load the customer feedback dataset using the provided <datasetId> and return an array of feedback texts.`,
    taskConfigInput: `{"datasetId": "<datasetId>"}`,
  },
  {
    taskType: `perform_sentiment_analysis`,
    agentType: `sentiment_analysis_agent` satisfies AgentType,
    description: `Perform sentiment analysis on the provided array of feedback texts and return sentiment scores for each text.`,
    taskConfigInput: `{"texts": ["<text>", "..."]}`,
  },
  {
    taskType: `aggregate_sentiment_scores`,
    agentType: `sentiment_aggregator` satisfies AgentType,
    description: `Aggregate the provided sentiment scores to generate a comprehensive sentiment report, summarizing key trends and insights.`,
    taskConfigInput: `{"sentimentScores": ["<score>", "..."]}`,
  },
] as const satisfies TaskConfigMinimal[];

export default createFixtures(
  addTaskConfigMissingAttrs(ENTRIES),
  ({ taskType }) => taskType,
);
