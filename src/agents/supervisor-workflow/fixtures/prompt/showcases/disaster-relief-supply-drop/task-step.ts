import { createFixtures, FixtureName } from "../../../base/fixtures.js";
import {
  createResourceFixtures,
  TaskStepWithVariousResource,
} from "../../../base/resource-fixtures.js";

import toolsFixtures from "./tools.js";
import agentsFixtures from "./agent-config.js";

type ToolName = FixtureName<typeof toolsFixtures>;

const ENTRIES = [
  {
    no: 1,
    step: "Acquire and analyze the latest high-resolution satellite imagery for each island to identify potential landing or drop strips",
    inputOutput:
      "input: areaBoundingBox for each island, maxCloudPercent; output: imagery assessment report with annotated maps",
    resource: createResourceFixtures(
      {
        type: "tools",
        tools: ["satellite_imagery_api"] as const satisfies ToolName[],
      },
      {
        type: "agent",
        agent: agentsFixtures.get("landing_zone_imagery_analyst"),
      },
    ),
  },
  {
    no: 2,
    step: "Evaluate potential landing or drop strips for fixed-wing aircraft, considering length, surface, obstacles, and flood status",
    dependencies: [1],
    inputOutput:
      "input: imagery assessment report [from Step 1], aircraftType; output: evaluation report of viable strips",
    resource: createResourceFixtures({
      tools: ["runway_checker_api"] as const satisfies ToolName[],
      type: "tools",
    }),
  },
  {
    no: 3,
    step: "Determine the viability of air-drops versus helicopter insertion for each island and compile a decision matrix",
    dependencies: [2],
    inputOutput:
      "input: evaluation report [from Step 2]; output: decision matrix with recommended delivery method",
    resource: createResourceFixtures({
      tools: ["aeronautical_route_validator_api"] as const satisfies ToolName[],
      type: "tools",
    }),
  },
  {
    no: 4,
    step: "Plan safe flight routes, approach patterns, drop zones or landing zones, including altitude and timing windows",
    dependencies: [3],
    inputOutput:
      "input: decision matrix [from Step 3]; output: detailed flight/air-drop plans and schedules",
    resource: createResourceFixtures({
      tools: ["cargo_route_planner_api"] as const satisfies ToolName[],
      type: "tools",
    }),
  },
  {
    no: 5,
    step: "Prepare a detailed cargo manifest with packaging suited to the selected delivery method",
    dependencies: [3],
    inputOutput:
      "input: cargo list [from user parameters], delivery method [from Step 3]; output: cargo loading and rigging instructions",
    resource: createResourceFixtures({
      tools: ["supply_manifest_optimizer_api"] as const satisfies ToolName[],
      type: "tools",
    }),
  },
  {
    no: 6,
    step: "Secure appropriate aircraft/helicopter assets, crews, fuel logistics, and maintenance support",
    dependencies: [3, 4],
    inputOutput:
      "input: delivery method [from Step 3], flight plans [from Step 4]; output: aircraft assignments, crew schedule, refueling and support logistics",
    resource: createResourceFixtures({
      tools: [
        "aircraft_asset_locator_api",
        "crew_scheduler_api",
        "fuel_and_support_planner_api",
      ] as const satisfies ToolName[],
      type: "tools",
    }),
  },
  {
    no: 7,
    step: "Obtain weather forecasts, NOTAMs, and flight clearances; establish communication protocols with ground teams",
    dependencies: [4],
    inputOutput:
      "input: flight plans [from Step 4]; output: weather forecasts, NOTAMs, flight clearances, communication protocols",
    resource: createResourceFixtures({
      tools: [
        "weather_forecast_api",
        "notam_fetcher_api",
        "flight_clearance_manager_api",
      ] as const satisfies ToolName[],
      type: "tools",
    }),
  },
  {
    no: 8,
    step: "Compile all mission components into a comprehensive operations brief with contingency procedures",
    dependencies: [1, 2, 3, 4, 5, 6, 7],
    inputOutput:
      "input: imagery assessment report [from Steps 1], evaluation report [from Step 2], decision matrix [from Step 3], detailed flight/air-drop plans and schedules [from Step 4], cargo loading and rigging instructions [from Step 5], `aircraft assignments, crew schedule, refueling and support logistics` [from Step 6], `weather forecasts, NOTAMs, flight clearances, communication protocols` [from Step 7] ; output: final operations brief with all attachments and contingency procedures",
    resource: createResourceFixtures({
      tools: ["contingency_matrix_builder_api"] as const satisfies ToolName[],
      type: "tools",
    }),
  },
] as const satisfies TaskStepWithVariousResource[];

const fixtures = createFixtures(ENTRIES, ({ step }) => step);
export default fixtures;
