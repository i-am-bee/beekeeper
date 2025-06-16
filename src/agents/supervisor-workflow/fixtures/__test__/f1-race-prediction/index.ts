import { WorkflowComposeFixture } from "../../base/workflow-compose-fixtures.js";
import agentsFixtures from "./agent-config.js";
import tasksFixtures from "./task-config.js";
import taskStepsFixtures from "./task-step.js";
import toolsFixtures from "./tools.js";

const name = "Formula 1 Grand Prix Prediction";
const prompt =
  "I want to predict the outcome of the next Formula 1 Grand Prix. Use all relevant data such as historical driver performance on that circuit, recent qualifying and race results, weather forecasts, team pit stop reliability, and any trends in driver form or strategy. Combine these to produce a confidence-based prediction of the top 3 finishers, along with the reasoning behind the forecast.";
const requestHandlerChoiceExplanation = "TBD";
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
  requestHandlerChoiceExplanation,
  requestHandlerOutput,
  taskStepsFixtures,
  toolsFixtures,
  agentsFixtures,
  tasksFixtures,
);

export default fixtures;
