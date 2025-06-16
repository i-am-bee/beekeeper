import {
  ChoiceExplanations,
  WorkflowComposeFixture,
} from "../../../base/workflow-compose-fixtures.js";
import agentsFixtures from "./agent-config.js";
import tasksFixtures from "./task-config.js";
import taskStepsFixtures from "./task-step.js";
import taskRunsFixtures from "./task-run.js";
import toolsFixtures from "./tools.js";

const title = `Feedback Sentiment Analysis`;

const prompt = `Please analyze the sentiment of all customer feedback contained in dataset ‘cust‑feedback‑2025‑06’ and give me the sentiment scores.`;

const choiceExplanations = {
  requestHandler: `The request involves analyzing a dataset for sentiment, which is a multi-step process requiring data handling and analysis.`,
  problemDecomposer: `The problem is logically consistent and can be solved using the available tools. Each step in the process of loading the dataset, performing sentiment analysis, and aggregating the results can be accomplished with the provided tools.`,
  steps: [
    {
      no: 1,
      agentConfig: `The task requires loading a customer feedback dataset using the \`customer_feedback_dataset_api\` tool. There is no existing agent config, so a new agent config needs to be created to utilize this tool for the specified task.`,
      taskConfig: `The task requires loading a customer feedback dataset using a dataset ID and returning an array of feedback texts. There is no existing task config that matches this requirement, and the agent type 'customer_feedback_loader' is available. Therefore, a new task config needs to be created.`,
      taskRun: `The task config "load_customer_feedback_dataset" exists, and the input can be completed using the non-dependent field "datasetId" provided in the task step.`,
    },
    {
      no: 2,
      agentConfig: `The task requires performing sentiment analysis on an array of feedback texts using the sentiment_analysis_api, which is available in the list of tools. No existing agent config matches this task, so a new agent config needs to be created.`,
      taskConfig: `The task requires performing sentiment analysis on an array of feedback texts, which aligns with the capabilities of the existing \`sentiment_analysis_agent\`. There is no existing task config for sentiment analysis, so a new task config needs to be created.`,
      taskRun: `The task config for "perform_sentiment_analysis" exists, and the input can be completed using the non-dependent field "outputFormat" provided in the task step.`,
    },
    {
      no: 3,
      agentConfig: `The task involves aggregating sentiment scores into a report, which can be accomplished using LLM capabilities for text processing and analysis. No external tools are required for this task.`,
      taskConfig: `The task of aggregating sentiment scores into a report aligns with the capabilities of the existing \`sentiment_aggregator\` agent. However, there is no existing task config for this operation, so a new task config needs to be created.`,
      taskRun: `The task config "aggregate_sentiment_scores" exists, and the input can be completed using non-dependent fields. The input only contains dependent fields marked [from Step X], so the task_run_input will be left empty.`,
    },
    {
      no: 4,
      agentConfig: `TBD`,
      taskConfig: `TBD`,
      taskRun: `TBD`,
    },
    {
      no: 5,
      agentConfig: `TBD`,
      taskConfig: `TBD`,
      taskRun: `TBD`,
    },
    {
      no: 6,
      agentConfig: `TBD`,
      taskConfig: `TBD`,
      taskRun: `TBD`,
    },
  ],
} satisfies ChoiceExplanations;

export const requestHandlerOutput = `{
  "requestType": "sentiment_analysis",
  "primaryGoal": "Analyze sentiment in 'cust-feedback-2025-06' dataset",
  "userParameters": {
    "dataset": "cust-feedback-2025-06"
  },
  "requiredComponents": [
    "load dataset 'cust-feedback-2025-06'",
    "perform sentiment analysis on text data",
    "aggregate sentiment scores"
  ],
  "expectedDeliverables": "A report with sentiment scores for each piece of feedback in the dataset"
}`;

const fixtures = new WorkflowComposeFixture(
  title,
  prompt,
  choiceExplanations,
  requestHandlerOutput,
  taskStepsFixtures,
  toolsFixtures,
  agentsFixtures,
  tasksFixtures,
  taskRunsFixtures,
);

export default fixtures;
