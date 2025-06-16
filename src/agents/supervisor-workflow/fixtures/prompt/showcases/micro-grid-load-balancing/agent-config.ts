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
  //   {
  //   agentType: "TBD",
  //   description:
  //     "TBD",
  //   instructions: `TBD`,
  //   tools: [] as const satisfies ToolName[],
  // },
] as const satisfies AgentConfigTiny[];

export default createFixtures(
  addAgentConfigMissingAttrs(ENTRIES),
  ({ agentType }) => agentType,
);
