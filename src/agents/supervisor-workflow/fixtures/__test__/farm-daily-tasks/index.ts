import { ChoiceExplanations, WorkflowComposeFixture } from "../../base/workflow-compose-fixtures.js";
import agentsFixtures from "./agent-config.js";
import tasksFixtures from "./task-config.js";
import taskStepsFixtures from "./task-step.js";
import toolsFixtures from "./tools.js";

const title = "Farm Daily Task Planning";
const prompt =
  "Plan today’s tasks for the farm using the latest equipment status, soil data, and weather.";

const choiceExplanations = {
  requestHandler: "The user requests a multi-step task planning for farm operations, integrating equipment status, soil data, and weather forecasts. This requires orchestration of multiple components to generate a comprehensive daily task plan.",
  problemDecomposer: "",
} satisfies ChoiceExplanations;

const requestHandlerOutput = `{
  "explanation": "Multi-faceted task requiring integration of equipment status, soil data, and weather forecasts",
  "response": "{
  "requestType": "farm_task_planning",
  "primaryGoal": "Optimize daily farm operations using current equipment, soil, and weather data",
  "userParameters": {
    "objective": "Efficient farm management"
  },
  "requiredComponents": [
    "retrieve latest equipment status and availability",
    "analyze soil data for nutrient levels and suitability",
    "fetch current and forecasted weather conditions",
    "prioritize tasks based on equipment, soil, and weather factors"
  ],
  "expectedDeliverables": "Detailed task plan with optimized sequence and resource allocation"
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
);

export default fixtures;
