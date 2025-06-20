import { createFixtures, FixtureName } from "../../../base/fixtures.js";
import {
  createResourceFixtures,
  TaskStepWithVariousResource,
} from "../../../base/resource-fixtures.js";
import toolsFixtures from "./tools.js";
import agentsFixtures from "./agent-config.js";
import tasksFixtures from "./task-config.js";
import taskRunsFixtures from "./task-run.js";
import { TaskStepMapper } from "@/agents/supervisor/workflow/workflow-composer/helpers/task-step/task-step-mapper.js";

type ToolName = FixtureName<typeof toolsFixtures>;

const ENTRIES = [
  {
    no: 1,
    step: "Forecast electricity demand for each city block between 18:00 and 21:00 on 2025-06-05",
    ...TaskStepMapper.parseInputOutput(
      `input: blockIds ["block-central-2", "block-north-7"], start time 2025-06-05T18:00Z, periods: 12; output: demand forecast in 15-min intervals`,
    ),
    resource: createResourceFixtures(
      {
        type: "tools",
        tools: ["demand_forecast_api"] as const satisfies ToolName[],
      },
      {
        type: "agent",
        agent: agentsFixtures.get("electricity_demand_forecaster"),
      },
      {
        type: "task",
        task: tasksFixtures.get("forecast_electricity_demand"),
      },
      {
        type: "task_run",
        taskRun: taskRunsFixtures.get("forecast_electricity_demand_1"),
      },
    ),
  },
  {
    no: 2,
    step: "Forecast solar generation and battery state-of-charge for each site between 18:00 and 21:00 on 2025-06-05",
    ...TaskStepMapper.parseInputOutput(
      `input: siteIds ["site-solar-01", "site-battery-02"], start time 2025-06-05T18:00Z, periods: 12; output: solar and battery forecasts`,
    ),
    resource: createResourceFixtures(
      {
        tools: ["solar_battery_forecast_api"] as const satisfies ToolName[],
        type: "tools",
      },
      {
        type: "agent",
        agent: agentsFixtures.get("solar_battery_forecaster"),
      },
      {
        type: "task",
        task: tasksFixtures.get("forecast_solar_battery"),
      },
      {
        type: "task_run",
        taskRun: taskRunsFixtures.get("forecast_solar_battery_1"),
      },
    ),
  },
  {
    no: 3,
    step: "Generate an optimized dispatch schedule that meets forecasted demand using solar, battery, and EV resources, while staying within ±0.2 Hz frequency deviation",
    ...TaskStepMapper.parseInputOutput(
      "input: demand forecast [from Step 1], solar and battery forecasts [from Step 2], constraint: freqDeviationHz 0.2; output: control vectors and KPI report",
    ),
    resource: createResourceFixtures(
      {
        tools: ["grid_load_optimizer_api"] as const satisfies ToolName[],
        type: "tools",
      },
      {
        type: "agent",
        agent: agentsFixtures.get("dispatch_schedule_optimizer"),
      },
      {
        type: "task",
        task: tasksFixtures.get("optimize_dispatch_schedule"),
      },
      {
        type: "task_run",
        taskRun: taskRunsFixtures.get("optimize_dispatch_schedule_1"),
      },
    ),
  },
  {
    no: 4,
    step: "Send control vectors to implement the optimized dispatch schedule",
    ...TaskStepMapper.parseInputOutput(
      "input: control vectors [from Step 3]; output: acknowledgement of dispatch",
    ),
    resource: createResourceFixtures(
      {
        tools: ["dispatch_command_api"] as const satisfies ToolName[],
        type: "tools",
      },
      {
        type: "agent",
        agent: agentsFixtures.get("dispatch_command_sender"),
      },
      {
        type: "task",
        task: tasksFixtures.get("send_control_vectors"),
      },
      {
        type: "task_run",
        taskRun: taskRunsFixtures.get("send_control_vectors_1"),
      },
    ),
  },
] as const satisfies TaskStepWithVariousResource[];

const fixtures = createFixtures(ENTRIES, ({ step }) => step);
export default fixtures;
