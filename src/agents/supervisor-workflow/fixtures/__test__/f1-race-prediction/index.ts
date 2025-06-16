import {
  ChoiceExplanations,
  WorkflowComposeFixture,
} from "../../base/workflow-compose-fixtures.js";
import agentsFixtures from "./agent-config.js";
import tasksFixtures from "./task-config.js";
import taskStepsFixtures from "./task-step.js";
import toolsFixtures from "./tools.js";
import taskRunsFixtures from "./task-run.js";

const name = "Formula 1 Grand Prix Prediction";
const prompt =
  "I want to predict the outcome of the next Formula 1 Grand Prix. Use all relevant data such as historical driver performance on that circuit, recent qualifying and race results, weather forecasts, team pit stop reliability, and any trends in driver form or strategy. Combine these to produce a confidence-based prediction of the top 3 finishers, along with the reasoning behind the forecast.";

const choiceExplanations = {
  requestHandler: `TBD`,
  problemDecomposer:
    "All required subtasks are explicitly listed and each has a matching tool available. The problem is logically sound, fully specified, and solvable using the provided tools. A clear and ordered sequence of steps can achieve the user's stated goal of balancing microgrid load using solar, battery, and EV fleets within a defined time window.",
  steps: [
    // {
    //   stepNo: 1,
    //   agentConfig:
    //     "The task requires retrieving field metadata and agronomic details using the field_info_api tool. There is no existing agent config, so a new agent config needs to be created to handle this task.",
    //   taskConfig:
    //     "There are no existing task configs that match the requirement to retrieve field metadata and agronomic details. Therefore, a new task config needs to be created.",
    //   taskRun: `The task config "retrieve_field_metadata" exists and the input can be completed using the non-dependent field "field name or ID" provided in the task step.`,
    // },
  ],
} satisfies ChoiceExplanations;

const requestHandlerOutput = `{
  "requestType": "sports_prediction",
  "primaryGoal": "Predict top 3 finishers of the next Formula 1 Grand Prix",
  "userParameters": {
    "sport": "Formula 1",
    "event": "Grand Prix",
    "dataPoints": [
      "historical driver performance on circuit",
      "recent qualifying and race results",
      "weather forecasts",
      "team pit stop reliability",
      "trends in driver form or strategy"
    ]
  },
  "requiredComponents": [
    "collect historical driver performance data for the specific circuit",
    "analyze recent qualifying and race results",
    "incorporate weather forecasts for the race day",
    "evaluate team pit stop reliability statistics",
    "identify trends in driver form and strategy",
    "aggregate and weigh all factors to generate a confidence-based prediction",
    "articulate reasoning behind the forecast"
  ],
  "expectedDeliverables": "A list of predicted top 3 finishers with detailed reasoning based on the analyzed data"
}`;

const fixtures = new WorkflowComposeFixture(
  name,
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
