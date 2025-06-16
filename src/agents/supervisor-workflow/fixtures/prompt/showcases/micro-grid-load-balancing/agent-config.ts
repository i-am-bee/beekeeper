import { AgentConfigTiny } from "@/agents/supervisor-workflow/workflow-composer/task-initializer/agent-config-initializer/dto.js";
import toolsFixtures from "./tools.js";
import { createFixtures, FixtureName } from "../../../base/fixtures.js";
import { addAgentConfigMissingAttrs } from "../../../helpers/add-missing-config-attrs.js";

type ToolName = FixtureName<typeof toolsFixtures>;

const ENTRIES = [
  {
    agentType: "electricity_demand_forecaster",
    description:
      "This agent forecasts electricity demand for specified city blocks in 15-minute intervals using the demand_forecast_api.",
    instructions: `Context: The agent receives a list of city block IDs and a time range to forecast electricity demand.
Objective: Use the demand_forecast_api to predict electricity demand for each specified city block in 15-minute intervals.
Response format: Return the demand forecast as a structured list or array, with each entry corresponding to a 15-minute interval.`,
    tools: ["demand_forecast_api"] as const satisfies ToolName[],
  },
  {
    agentType: "solar_battery_forecaster",
    description:
      "This agent forecasts solar generation and battery state-of-charge for specified sites in 15-minute intervals using the solar_battery_forecast_api.",
    instructions: `Context: The agent receives a list of site IDs and a time range to forecast solar generation and battery state-of-charge.
Objective: Use the solar_battery_forecast_api to predict solar output and battery state-of-charge for each specified site in 15-minute intervals.
Response format: Return the solar and battery forecasts as a structured list or array, with each entry corresponding to a 15-minute interval.`,
    tools: ["solar_battery_forecast_api"] as const satisfies ToolName[],
  },
  {
    agentType:
      "dispatch_schedule_optimizer",
    description:
      "This agent generates an optimized dispatch schedule to meet forecasted electricity demand using solar, battery, and EV resources while maintaining frequency stability.",
    instructions: `Context: The agent receives demand forecasts, solar and battery forecasts, and a frequency deviation constraint to generate an optimized dispatch schedule.
Objective: Use the grid_load_optimizer_api to calculate control vectors that meet the forecasted demand while ensuring frequency deviation stays within the specified limits.
Response format: Return the control vectors and a KPI report as a structured output, detailing the optimization results and performance metrics.`,
    tools: ["grid_load_optimizer_api"] as const satisfies ToolName[],
  },
    {
    agentType: "dispatch_command_sender",
    description:
      "This agent sends control vectors to implement an optimized dispatch schedule and receives acknowledgements of dispatch.",
    instructions: `Context: The agent receives control vectors that need to be sent to implement an optimized dispatch schedule.
Objective: Use the dispatch_command_api to send the control vectors and receive an acknowledgement of dispatch.
Response format: Return the acknowledgement of dispatch as a confirmation of successful implementation.`,
    tools: ['dispatch_command_api'] as const satisfies ToolName[],
  },
] as const satisfies AgentConfigTiny[];

export default createFixtures(
  addAgentConfigMissingAttrs(ENTRIES),
  ({ agentType }) => agentType,
);
