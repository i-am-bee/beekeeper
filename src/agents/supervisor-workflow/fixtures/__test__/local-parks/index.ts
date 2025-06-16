import {
  ChoiceExplanations,
  WorkflowComposeFixture,
} from "../../base/workflow-compose-fixtures.js";
import toolsFixtures from "./tools.js";
import agentsFixtures from "./agent-config.js";
import tasksFixtures from "./task-config.js";
import taskStepsFixtures from "./task-step.js";

const title = "Local Parks and Nature Reserves Search";

const prompt =
  "Find parks or nature reserves within 20 km of Kutna Hora. Please categorize them by type (e.g., national park, nature reserve, etc.) and provide details such as size, accessibility, and any notable features. If possible, include links to official websites or maps for each location.";

const choiceExplanations = {
  requestHandler: "",
  problemDecomposer: "All required information can be obtained by chaining the available tools: map_api for geospatial discovery, web_search to locate official pages, and web_page_extract to scrape detailed data.",
} satisfies ChoiceExplanations;

export const requestHandlerOutput = `{
  "requestType": "location_search",
  "primaryGoal": "Identify and categorize parks and nature reserves near Kutna Hora",
  "userParameters": {
    "location": "Kutna Hora",
    "radius": "20 km"
  },
  "requiredComponents": [
    "search for parks and nature reserves within specified radius",
    "categorize each by type (e.g., national park, nature reserve)",
    "gather details on size, accessibility, and notable features",
    "find and include links to official websites or maps"
  ],
  "expectedDeliverables": "List of parks and nature reserves with categories, details, and links"
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
