import {
  ChoiceExplanations,
  WorkflowComposeFixture,
} from "../../base/workflow-compose-fixtures.js";
import agentsFixtures from "./agent-config.js";
import tasksFixtures from "./task-config.js";
import taskStepsFixtures from "./task-step.js";
import toolsFixtures from "./tools.js";
import taskRunsFixtures from "./task-run.js";

const title = "Trip Planning for Boston Visit";
const prompt =
  "I'm heading to Boston next week and need help planning a simple 3-day itinerary. I’ll be staying in Back Bay and want to see historical sites, catch a hockey or basketball game, and enjoy great food. Can you recommend one dinner spot each night - Italian, Chinese, and French?";
const choiceExplanations = {
  requestHandler:
    "The request involves creating a multi-day itinerary with specific activities and dining preferences, which requires detailed planning.",
  problemDecomposer:
    "The problem is logically consistent and all required components can be addressed using the available tools. Each step, such as identifying historical sites, finding game schedules, and recommending restaurants, can be achieved with the tools provided. Therefore, a STEP_SEQUENCE can be generated.",
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
  "requestType": "travel_itinerary",
  "primaryGoal": "Create a 3-day itinerary for Boston visit in Back Bay",
  "userParameters": {
    "stayLocation": "Back Bay",
    "duration": "3 days",
    "interests": ["historical sites", "hockey/basketball game", "food"],
    "diningPreferences": ["Italian", "Chinese", "French"],
  },
  "requiredComponents": [
    "identify historical sites in Back Bay",
    "find upcoming hockey/basketball game schedules",
    "recommend Italian, Chinese, and French restaurants in Back Bay",
    "create a balanced daily schedule incorporating all preferences"
  ],
  "expectedDeliverables": "Detailed 3-day itinerary with historical site visits, game recommendations, and dining suggestions"
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
