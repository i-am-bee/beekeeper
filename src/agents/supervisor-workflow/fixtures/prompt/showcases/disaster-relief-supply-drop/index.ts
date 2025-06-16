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
  "Coordinate an air drop of food and medicine to our three flooded islands. Use the latest imagery to find strips; if none are safe, switch to helicopters.";

const choiceExplanations = {
  requestHandler:
    "Request involves multi-step humanitarian logistics (imagery analysis, air-strip assessment, flight planning, contingency switch to helicopters) that must be delegated to a planner.",
  problemDecomposer:
    "The user’s disaster relief coordination request is logically consistent and all requested components are achievable using the available tools. Each required step—such as imagery analysis, landing strip evaluation, route planning, manifest preparation, asset scheduling, and contingency planning—has tool support. Therefore, a complete, solvable step sequence can be generated.",
  steps: [
    {
      stepNo: 1,
      agentConfig:
        "The task requires acquiring and analyzing satellite imagery to assess landing zones. No existing agent config is present, and the required tool `satellite_imagery_api` is available. This is a suitable case for creating a new agent config.",
      taskConfig:
        "No existing task config matches yet, and this request aligns with the agent's capabilities but introduces a new reusable mission template requiring satellite analysis over island areas.",
    },
  ],
} satisfies ChoiceExplanations;

const requestHandlerOutput = `{
  "requestType": "disaster_relief_coordination",
  "primaryGoal": "Deliver food and medicine to three flooded islands using the safest available air or helicopter method",
  "userParameters": {
    "numberOfIslands": 3,
    "cargo": ["food", "medicine"],
    "transportPreference": "fixed-wing air-drop if safe landing/drop strips exist; otherwise helicopters"
  },
  "requiredComponents": [
    "Acquire and analyze the latest high-resolution satellite or aerial imagery for each island",
    "Identify and evaluate potential landing or drop strips for fixed-wing aircraft (length, surface, obstacles, flood status)",
    "Determine viability of air-drops versus helicopter insertion per island and compile a decision matrix",
    "Plan safe flight routes, approach patterns, drop zones or landing zones, including altitude and timing windows",
    "Prepare detailed cargo manifest with packaging suited to selected delivery method (parachute-rigged bundles or sling loads)",
    "Secure appropriate aircraft/helicopter assets, crews, fuel logistics, and maintenance support",
    "Obtain weather forecasts, NOTAMs, and flight clearances; establish communication protocols with ground teams",
    "Draft contingency and safety plans for rapid method switch or abort criteria"
  ],
  "expectedDeliverables": [
    "Imagery assessment report with annotated maps of viable strips or landing zones",
    "Recommended delivery method for each island with justification",
    "Detailed flight/air-drop plans and schedules",
    "Cargo loading and rigging instructions",
    "Comprehensive operations brief with contingency procedures"
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
