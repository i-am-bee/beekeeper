import { createFixtures, FixtureName } from "../../base/fixtures.js";
import {
  createResourceFixtures,
  TaskStepWithVariousResource,
} from "../../base/resource-fixtures.js";
import toolsFixtures from "./tools.js";
import agentsFixtures from "./agent-config.js";

type ToolName = FixtureName<typeof toolsFixtures>;

const ENTRIES = [
  {
    no: 1,
    inputOutput: "input: none; output: equipment list with status and location",
    dependencies: [],
    resource: createResourceFixtures(
      {
        tools: ["equipment_status_api"] as const satisfies ToolName[],
        type: "tools",
      },
      {
        agent: agentsFixtures.get("equipment_status_checker"),
        type: "agent",
      },
    ),
    step: "Retrieve the latest status and availability of farm equipment",
  },
  {
    no: 2,
    inputOutput:
      "input: none; output: soil quality assessment with recommendations",
    dependencies: [],
    resource: createResourceFixtures(
      {
        tools: ["soil_analysis_api"] as const satisfies ToolName[],
        type: "tools",
      },
      {
        agent: agentsFixtures.get("soil_quality_analyzer"),
        type: "agent",
      },
    ),
    step: "Analyze soil data for nutrient levels and suitability for planned operations",
  },
  {
    no: 3,
    inputOutput:
      "input: none; output: detailed weather data including conditions, temperature, precipitation, and wind",
    dependencies: [],
    resource: createResourceFixtures(
      {
        tools: ["weather_forecast_api"] as const satisfies ToolName[],
        type: "tools",
      },
      {
        agent: agentsFixtures.get("farm_weather_forecaster"),
        type: "agent",
      },
    ),
    step: "Fetch current and forecasted weather conditions for the farm location",
  },
  {
    no: 4,
    inputOutput:
      "input: equipment list [from Step 1], soil quality assessment [from Step 2], weather data [from Step 3]; output: prioritized task list with recommended time windows, equipment requirements, and weather constraints",
    dependencies: [1, 2, 3],
    resource: createResourceFixtures(
      {
        tools: ["farm_task_planning_api"] as const satisfies ToolName[],
        type: "tools",
      },
      {
        agent: agentsFixtures.get("farm_task_planner"),
        type: "agent",
      },
    ),
    step: "Generate an optimized task plan based on equipment availability, soil quality, and weather forecast",
  },
] as const satisfies TaskStepWithVariousResource[];

const fixtures = createFixtures(ENTRIES, ({ step }) => step);

export default fixtures;
