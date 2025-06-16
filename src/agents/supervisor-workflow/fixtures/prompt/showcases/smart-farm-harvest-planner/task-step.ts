import { createFixtures, FixtureName } from "../../../base/fixtures.js";
import { createResourceFixtures, TaskStepWithVariousResource } from "../../../base/resource-fixtures.js";

import toolsFixtures from "./tools.js";

type ToolName = FixtureName<typeof toolsFixtures>;

const ENTRIES = [
  {
    no: 1,
    step: "Retrieve field metadata and agronomic details for South Field",
    inputOutput:
      "input: field name or ID; output: field details (location, crop, moisture limits, etc.)",
    resource: createResourceFixtures({
      tools: ["field_info_api"] as const satisfies ToolName[],
      type: "tools",
    }),
  },
  {
    no: 2,
    step: "Retrieve the list of equipment IDs assigned to South Field",
    dependencies: [1],
    inputOutput:
      "input: field name or ID [from Step 1]; output: equipment IDs (harvesters, drones, dryers)",
    resource: createResourceFixtures({
      tools: ["equipment_registry_api"] as const satisfies ToolName[],
      type: "tools",
    }),
  },
  {
    no: 3,
    step: "Retrieve the 24-hour weather forecast for the coordinates of South Field",
    dependencies: [1],
    inputOutput:
      "input: field coordinates [from Step 1]; output: weather forecast data",
    resource: createResourceFixtures({
      tools: ["weather_forecast_api"] as const satisfies ToolName[],
      type: "tools",
    }),
  },
  {
    no: 4,
    step: "Check the operational readiness of harvesters, drones, and grain dryers",
    dependencies: [2],
    inputOutput:
      "input: equipment IDs [from Step 2]; output: equipment status",
    resource: createResourceFixtures({
      tools: ["equipment_status_api"] as const satisfies ToolName[],
      type: "tools",
    }),
  },
  {
    no: 5,
    step: "Generate a harvest or drying schedule that meets moisture limits, considering weather and equipment status",
    dependencies: [1, 3, 4],
    inputOutput:
      "input: field details [from Step 1], weather forecast [from Step 3], equipment status [from Step 4]; output: harvest schedule",
    resource: createResourceFixtures({
      tools: ["harvest_scheduler_api"] as const satisfies ToolName[],
      type: "tools",
    }),
  },
  {
    no: 6,
    step: "Produce a human-readable timeline with equipment assignments and rain contingency plans",
    dependencies: [3, 5],
    inputOutput:
      "input: harvest schedule [from Step 5], weather forecast [from Step 3]; output: final harvest-day plan",
    resource: createResourceFixtures({
      type: "llm",
    }),
  },
] as const satisfies TaskStepWithVariousResource[];

const fixtures = createFixtures(ENTRIES, ({ step }) => step);
export default fixtures;
