import { createFixtures, FixtureName } from "../../../base/fixtures.js";
import { createResourceFixtures, TaskStepWithVariousResource } from "../../../base/resource-fixtures.js";
import toolsFixtures from "./tools.js";

type ToolName = FixtureName<typeof toolsFixtures>;

const ENTRIES = [
  {
    no: 1,
    step: "Forecast electricity demand for each city block between 18:00 and 21:00 on 2025-06-05",
    inputOutput:
      "input: blockIds, start time 2025-06-05T18:00Z, periods: 12; output: demand forecast in 15-min intervals",
    resource: createResourceFixtures({
      tools: ["demand_forecast_api"] as const satisfies ToolName[],
      type: "tools",
    }),
  },
  {
    no: 2,
    step: "Forecast solar generation and battery state-of-charge for each site between 18:00 and 21:00 on 2025-06-05",
    inputOutput:
      "input: siteIds, start time 2025-06-05T18:00Z, periods: 12; output: solar and battery forecasts",
    resource: createResourceFixtures({
      tools: ["solar_battery_forecast_api"] as const satisfies ToolName[],
      type: "tools",
    }),
  },
  {
    no: 3,
    step: "Generate an optimized dispatch schedule that meets forecasted demand using solar, battery, and EV resources, while staying within ±0.2 Hz frequency deviation",
    dependencies: [1, 2],
    inputOutput:
      "input: demand forecast [from Step 1], solar and battery forecasts [from Step 2], constraint: freqDeviationHz 0.2; output: control vectors and KPI report",
    resource: createResourceFixtures({
      tools: ["grid_load_optimizer_api"] as const satisfies ToolName[],
      type: "tools",
    }),
  },
  {
    no: 4,
    step: "Send control vectors to implement the optimized dispatch schedule",
    dependencies: [3],
    inputOutput:
      "input: control vectors [from Step 3]; output: acknowledgement of dispatch",
    resource: createResourceFixtures({
      tools: ["dispatch_command_api"] as const satisfies ToolName[],
      type: "tools",
    }),
  },
] as const satisfies TaskStepWithVariousResource[];

const fixtures = createFixtures(ENTRIES, ({ step }) => step);
export default fixtures;
