import toolsFixtures from "./tools.js";
import agentsFixtures from "./agent-config.js";
import tasksFixtures from "./task-config.js";
import taskStepsFixtures from "./task-step.js";
import taskRunsFixtures from "./task-run.js";
import {
  ChoiceExplanations,
  WorkflowComposeFixture,
} from "../../../base/workflow-compose-fixtures.js";

const title = "Micro-grid Dispatch Planning Workflow";
const prompt =
  "Plan a cost-efficient dispatch schedule for tonight’s 6–9 pm micro-grid load using solar, battery, and EV fleets. Stay within ±0.2 Hz frequency limits.";

const choiceExplanations = {
  requestHandler:
    "The task is multi-step (forecasting, optimization, real-time control, alerting) and needs orchestration, so a workflow is appropriate.",
  problemDecomposer:
    "All required subtasks are explicitly listed and each has a matching tool available. The problem is logically sound, fully specified, and solvable using the provided tools. A clear and ordered sequence of steps can achieve the user's stated goal of balancing microgrid load using solar, battery, and EV fleets within a defined time window.",
  steps: [
    {
      stepNo: 1,
      agentConfig:
        "The task requires forecasting electricity demand for city blocks using the demand_forecast_api tool, which is available in the list of tools. No existing agent config is available, so a new agent config needs to be created.",
      taskConfig:
        "There are no existing task configs, and the task requires forecasting electricity demand for city blocks using the electricity_demand_forecaster agent. Therefore, a new task config needs to be created.",
      taskRun: `TBD`,
    },
    // {
    //   stepNo: 1,
    //   agentConfig:
    //     "TBD",
    //   taskConfig:
    //     "TBD",
    //   taskRun: `TBD`,
    // },
  ],
} satisfies ChoiceExplanations;

const requestHandlerOutput = `{
  "requestType": "microgrid_load_balancing",
  "primaryGoal": "Plan a dispatch schedule for tonight’s 18:00–21:00 load using solar, battery storage, and EV fleets, while minimizing cost and staying within ±0.2 Hz frequency deviation",
  "userParameters": {
    "timeWindow": "2025-06-05T18:00Z to 2025-06-05T21:00Z",
    "resources": ["solar", "battery", "EV fleets"],
    "frequencyThresholdHz": 0.2
  },
  "requiredComponents": [
    "forecast evening load profile for each city block",
    "forecast available solar generation and battery charge during timeWindow",
    "generate optimized dispatch plan to match net load within frequency constraint",
    "apply inverter control vectors to enforce dispatch plan"
  ],
  "expectedDeliverables": "Optimized dispatch schedule and control vectors ready to be sent for execution"
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
