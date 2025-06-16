import toolsFixtures from "./tools.js";
import agentsFixtures from "./agent-config.js";
import tasksFixtures from "./task-config.js";
import taskStepsFixtures from "./task-step.js";
import taskRunsFixtures from "./task-run.js";
import {
  ChoiceExplanations,
  WorkflowComposeFixture,
} from "../../../base/workflow-compose-fixtures.js";

const title = "Disaster Relief Supply Drop Coordination";
const prompt =
  "Coordinate an air drop of food and medicine to the flooded islands of Vavaʻu in Tonga. Use the latest imagery to find strips; if none are safe, switch to helicopters.";

const choiceExplanations = {
  requestHandler:
    "The request involves a complex, multi-step operation that requires coordination, planning, and potentially the use of various resources and tools. It is not a simple question that can be answered directly, nor is it a request that can be clarified with a simple question.",
  problemDecomposer: "The problem is logically consistent and can be solved using the available tools and resources. Each step required to achieve the primary goal has a corresponding tool or can be handled by LLM capabilities.",
  steps: [
    {
      no: 1,
      agentConfig: `TBD`,
      taskConfig: `TBD`,
    },
  ],
} satisfies ChoiceExplanations;

const requestHandlerOutput = `{
  "requestType": "Humanitarian Aid Coordination",
  "primaryGoal": "Deliver food and medicine to the flooded islands of Vavaʻu in Tonga.",
  "parameters": {
    "location": "Vavaʻu, Tonga",
    "resources": ["food", "medicine"],
    "transportationOptions": ["air drop", "helicopters"],
    "imagerySource": "latest satellite imagery"
  },
  "subTasks": [
    "Analyze latest satellite imagery to identify safe landing strips.",
    "Plan air drop routes if landing strips are available.",
    "Switch to helicopter delivery if no safe landing strips are found.",
    "Coordinate with local authorities for distribution logistics.",
    "Ensure compliance with international aid and aviation regulations."
  ],
  "expectedDeliverables": [
    "Safe and efficient delivery plan for food and medicine.",
    "Contingency plan for helicopter use if necessary.",
    "Coordination report with local authorities."
  ]
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
