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
  // {
  //   taskType: "TBD",
  //   agentType: "TBD" satisfies AgentType,
  //   description:
  //     "TBD",
  //   taskConfigInput: `TBD`,
  // },
] as const satisfies (TaskConfigMinimal & {
  agentType: AgentType;
})[];

export default createFixtures(
  addTaskConfigMissingAttrs(ENTRIES),
  ({ taskType }) => taskType,
);
