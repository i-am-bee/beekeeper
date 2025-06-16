import { TaskConfigMinimal } from "@/agents/supervisor-workflow/workflow-composer/task-initializer/task-config-initializer/dto.js";
import agentConfigFixtures from "./agent-config.js";
import { createFixtures, FixtureName } from "../../../base/fixtures.js";
import { addTaskConfigMissingAttrs } from "../../../helpers/add-missing-config-attrs.js";

type AgentType = FixtureName<typeof agentConfigFixtures>;

const ENTRIES = [
  {
    taskType: "forecast_electricity_demand",
    agentType: "electricity_demand_forecaster" satisfies AgentType,
    description:
      "Forecast electricity demand for each specified city block starting from <start_time> for <number_of_periods> 15-minute intervals using the demand_forecast_api.",
    taskConfigInput: `{"blockIds": ["<blockId>", "..."], "start_time": "<start_time>", "periods": "<number_of_periods>"}`,
  },
  {
    taskType: "forecast_solar_battery",
    agentType: "solar_battery_forecaster" satisfies AgentType,
    description:
      "Forecast solar generation and battery state-of-charge for each specified site starting from <start_time> for <number_of_periods> 15-minute intervals using the solar_battery_forecast_api.",
    taskConfigInput: `{"siteIds": ["<siteId>", "..."], "start_time": "<start_time>", "periods": "<number_of_periods>"}`,
  },
  {
    taskType: "optimize_dispatch_schedule",
    agentType: "dispatch_schedule_optimizer" satisfies AgentType,
    description:
      "Generate an optimized dispatch schedule that meets the forecasted electricity demand using solar, battery, and EV resources while ensuring frequency deviation stays within the specified limits.`",
    taskConfigInput: `{"demand_forecast": "<demand_forecast>", "solar_battery_forecasts": "<solar_battery_forecasts>", "constraint": {"freqDeviationHz": "<frequency_deviation>"}}`,
  },
  {
    taskType: "send_control_vectors",
    agentType: "dispatch_command_sender" satisfies AgentType,
    description:
      "Send control vectors to implement the optimized dispatch schedule using the dispatch_command_api and receive an acknowledgement of dispatch as confirmation of successful implementation.`",
    taskConfigInput: `{"control_vectors": "<control_vectors>"}`,
  },
] as const satisfies (TaskConfigMinimal & {
  agentType: AgentType;
})[];

export default createFixtures(
  addTaskConfigMissingAttrs(ENTRIES),
  ({ taskType }) => taskType,
);
