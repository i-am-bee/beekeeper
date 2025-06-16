import {
  ChoiceExplanations,
  WorkflowComposeFixture,
} from "../../../base/workflow-compose-fixtures.js";
import agentsFixtures from "./agent-config.js";
import tasksFixtures from "./task-config.js";
import taskRunsFixtures from "./task-run.js";
import taskStepsFixtures from "./task-step.js";
import toolsFixtures from "./tools.js";

const title = "Micro-grid Dispatch Planning Workflow";
const prompt =
  "Plan a cost-efficient dispatch schedule for tonight’s 6–9 pm micro-grid load across block-central-2 and block-north-7, using resources from site-solar-01, site-battery-02, and site-ev-fleet-03. Stay within ±0.2 Hz frequency limits.";

const choiceExplanations = {
  requestHandler:
    "The task is multi-step (forecasting, optimization, real-time control, alerting) and needs orchestration, so a workflow is appropriate.",
  problemDecomposer:
    "All required subtasks are explicitly listed and each has a matching tool available. The problem is logically sound, fully specified, and solvable using the provided tools. A clear and ordered sequence of steps can achieve the user's stated goal of balancing microgrid load using solar, battery, and EV fleets within a defined time window.",
  steps: [
    {
      no: 1,
      agentConfig:
        "The task requires forecasting electricity demand for city blocks using the demand_forecast_api tool, which is available in the list of tools. No existing agent config is available, so a new agent config needs to be created.",
      taskConfig:
        "There are no existing task configs, and the task requires forecasting electricity demand for city blocks using the electricity_demand_forecaster agent. Therefore, a new task config needs to be created.",
      taskRun: `The task config "forecast_electricity_demand" exists, and the input can be completed using non-dependent fields provided in the task step.`,
    },
    {
      no: 2,
      agentConfig:
        "The task requires forecasting solar generation and battery state-of-charge, which aligns with the capabilities of the solar_battery_forecast_api tool. No existing agent config matches this specific task, so a new agent config is needed.",
      taskConfig:
        "The task of forecasting solar generation and battery state-of-charge is not covered by any existing task config. Therefore, a new task config needs to be created to accommodate this requirement.",
      taskRun: `The task config "forecast_solar_battery" exists, and the input can be completed using non-dependent fields provided in the task step.`,
    },
    {
      no: 3,
      agentConfig:
        "The task requires generating an optimized dispatch schedule using the grid_load_optimizer_api, which is available in the list of tools. No existing agent config matches this task, so a new agent config is needed.",
      taskConfig: `The task requires generating an optimized dispatch schedule using demand forecasts, solar and battery forecasts, and a frequency deviation constraint. This aligns with the purpose of the existing agent config \`dispatch_schedule_optimizer\`, but there is no existing task config for this specific task. Therefore, a new task config needs to be created.`,
      taskRun: `The task config "optimize_dispatch_schedule" exists, and the input can be completed using the non-dependent field "constraint: freqDeviationHz 0.2".`,
    },
    {
      no: 4,
      agentConfig:
        "The task requires sending control vectors to implement an optimized dispatch schedule, which aligns with the functionality provided by the dispatch_command_api. No existing agent config matches this task, so a new agent config is needed.",
      taskConfig:
        "There is no existing task config that matches the requirement to send control vectors using the dispatch_command_sender agent. Therefore, a new task config needs to be created.",
      taskRun: `The task config "send_control_vectors" exists, and the input can be completed using non-dependent fields. The input "control vectors" is marked as [from Step 3], so it will be injected automatically by the runtime engine.`,
    },
  ],
} satisfies ChoiceExplanations;

const requestHandlerOutput = `{
  "requestType": "microgrid_load_balancing",
  "primaryGoal": "Plan a dispatch schedule for tonight’s 18:00–21:00 load using solar, battery storage, and EV fleets, while minimizing cost and staying within ±0.2 Hz frequency deviation",
  "userParameters": {
    "timeWindow": "2025-06-05T18:00Z to 2025-06-05T21:00Z",
    "resources": ["solar", "battery", "EV fleets"],
    "frequencyThresholdHz": 0.2,
    "blocks": ["block-central-2", "block-north-7"],
    "sites": ["site-solar-01", "site-battery-02", "site-ev-fleet-03"]
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
