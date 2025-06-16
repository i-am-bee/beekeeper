import toolsFixtures from "./tools.js";
import agentsFixtures from "./agent-config.js";
import tasksFixtures from "./task-config.js";
import taskStepsFixtures from "./task-step.js";
import {
  ChoiceExplanations,
  WorkflowComposeFixture,
} from "../../../base/workflow-compose-fixtures.js";

const title = "Smart-Farm “Rain-Contingency” Harvest Planner";
const prompt =
  "Tomorrow looks wet. Please plan the wheat harvest for our South Field using the latest weather and make sure all machines are ready; switch to grain-dryer mode if heavy rain is likely.";

const choiceExplanations = {
  requestHandler:
    "The user requests a multi-step harvest plan (weather, equipment, fallback workflow). This clearly requires downstream orchestration.",
  problemDecomposer: "All required components in the user's goal can be addressed using the provided tools. The problem is logically consistent, all necessary parameters are either provided or can be safely assumed, and every step has a matching tool. Therefore, a STEP_SEQUENCE can be generated.",
} satisfies ChoiceExplanations;

const requestHandlerOutput = `{
  "requestType": "smart_farm_harvest_planning",
  "primaryGoal": "Create a wheat-harvest schedule for South Field that adapts to potential heavy rain",
  "userParameters": {
    "field": "South Field",
    "crop": "wheat",
    "timeframe": "tomorrow",
    "fallbackMode": "grain-dryer if rain > threshold"
  },
  "requiredComponents": [
    "retrieve 24-h weather forecast for field coordinates",
    "check operational readiness of harvesters, drones and grain dryers",
    "generate harvest or drying schedule that meets moisture limits",
    "produce human-readable timeline with equipment assignments"
  ],
  "expectedDeliverables": "Final harvest-day plan including timeline, equipment list, and rain contingency"
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
