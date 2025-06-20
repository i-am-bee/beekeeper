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
    "The request involves creating a multi-day itinerary with specific activities and dining recommendations, which requires detailed planning.",
  problemDecomposer:
    "The problem is logically consistent and can be solved using the available tools. Each step in the process of planning the itinerary, including finding historical sites, sports events, and dining options, can be accomplished with the provided tools.",
  steps: [
    {
      no: 1,
      agentConfig:
        "The task involves finding historical sites in the Back Bay area of Boston, which aligns with the capabilities of the historical_sites_search_api tool. No existing agent config matches this task, so a new agent config is needed.",
      taskConfig:
        "There is no existing task config that matches the requirement to find historical sites in a specified location. Therefore, a new task config needs to be created.",
      taskRun: `The task config "find_historical_sites" exists and the input can be completed using the non-dependent field "location" provided in the task step.`,
    },
    {
      no: 2,
      agentConfig:
        "The task requires searching for sports events in Boston, which is different from finding historical sites. The existing agent config does not cover this task, and the tavily_search_api tool is available to perform web searches for sports events. Therefore, a new agent config is needed.",
      taskConfig:
        "There is no existing task config that matches the requirement to search for sports events in a specified location and duration. Therefore, a new task config needs to be created.",
      taskRun: `The task config "search_sports_events" exists, and the input can be completed using the non-dependent fields provided in the task step.`,
    },
    {
      no: 3,
      agentConfig:
        "The task requires searching for dining recommendations in Boston for specific cuisines, which aligns with the capabilities of the tavily_search_api. No existing agent config matches this task, so a new agent config is needed.",
      taskConfig:
        "There is no existing task config that matches the requirement to search for dining recommendations based on location and dining preferences. Therefore, a new task config needs to be created.",
      taskRun: `The task config for "search_dining_recommendations" exists, and the input can be completed using the non-dependent fields provided in the task step.`,
    },
    {
      no: 4,
      agentConfig:
        "The task requires compiling a 3-day itinerary using outputs from previous steps, which involves organizing and presenting information rather than searching or retrieving new data. This task can be handled by an LLM without the need for specific tools, as it involves synthesizing and formatting existing information into a coherent itinerary.",
      taskConfig:
        "The task of compiling a 3-day itinerary using historical sites, sports events, and dining recommendations matches the purpose and input requirements of the existing agent config for the itinerary_compiler. However, there is no existing task config for this specific task, so a new task config needs to be created.",
      taskRun: `The task config for "compile_itinerary" exists, and the input can be completed using non-dependent fields. The inputs for historical sites, sports events, and dining recommendations are marked as [from Step X], so they will be injected automatically by the runtime engine.`,
    },
    // {
    //   no: 1,
    //   agentConfig:
    //     `TBD`,
    //   taskConfig:
    //     `TBD`,
    //   taskRun: `TBD`,
    // },
  ],
} satisfies ChoiceExplanations;
const requestHandlerOutput = `{
  "requestType": "itinerary_planning",
  "primaryGoal": "Create a 3-day Boston itinerary with historical sites, sports events, and dining recommendations",
  "userParameters": {
    "location": "Boston",
    "stayArea": "Back Bay",
    "duration": "3 days",
    "interests": ["historical sites", "sports events", "dining"],
    "diningPreferences": ["Italian", "Chinese", "French"]
  },
  "requiredComponents": [
    "historical site visits",
    "sports event schedule and ticket information",
    "dining recommendation for Italian, Chinese, and French cuisine"
  ],
  "expectedDeliverables": "Complete 3-day itinerary with activities, sports events, and dining recommendations"
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
