import { createFixtures, FixtureName } from "../../../base/fixtures.js";
import {
  createResourceFixtures,
  TaskStepWithVariousResource,
} from "../../../base/resource-fixtures.js";

import toolsFixtures from "./tools.js";
import agentsFixtures from "./agent-config.js";
import tasksFixtures from "./task-config.js";
import taskRunsFixtures from "./task-run.js";

type ToolName = FixtureName<typeof toolsFixtures>;

const ENTRIES = [
  {
    no: 1,
    step: "Analyze the latest satellite imagery to identify potential safe landing strips on the three flooded islands",
    inputOutput:
      "input: areaBoundingBox for each island, maxCloudPercent: 0; output: list of potential landing strips",
    resource: createResourceFixtures({
      type: "tools",
      tools: ["satellite_imagery_api"] as const satisfies ToolName[],
    }),
  },
  {
    no: 2,
    step: `Evaluate the identified landing strips against aircraft requirements to determine usability`,
    inputOutput: `input: stripIds [from Step 1], aircraftType: "fixed-wing"; output: usable landing strips`,
    resource: createResourceFixtures({
      type: "tools",
      tools: ["runway_checker_api"] as const satisfies ToolName[],
    }),
  },
  {
    no: 3,
    step: `Plan air drop routes if safe landing strips are available`,
    inputOutput: `input: origin coordinates, destinations [from Step 2], payloadKg: total weight of food and medicine, aircraft: "fixed-wing"; output: waypoint list & ETAs`,
    resource: createResourceFixtures({
      type: "tools",
      tools: ["cargo_route_planner_api"] as const satisfies ToolName[],
    }),
  },
  {
    no: 4,
    step: `If no safe landing strips are found, locate available helicopters for delivery`,
    inputOutput: `input: payloadKg: total weight of food and medicine, runwayRequirementMeters: 0, helicopterCapable: true, earliestStart: current date, durationHours: estimated mission time; output: available helicopters`,
    resource: createResourceFixtures({
      type: "tools",
      tools: ["aircraft_asset_locator_api"] as const satisfies ToolName[],
    }),
  },
  // {
  //   no: 1,
  //   step: `TBD`,
  //   inputOutput:
  //     `TBD`,
  //   resource: createResourceFixtures(
  //     {
  //       type: "tools",
  //       tools: [`TBD`] as const satisfies ToolName[],
  //     },
  //   ),
  // },
  // {
  //   no: 1,
  //   step: `TBD`,
  //   inputOutput:
  //     `TBD`,
  //   resource: createResourceFixtures(
  //     {
  //       type: "tools",
  //       tools: [`TBD`] as const satisfies ToolName[],
  //     },
  //   ),
  // },
] as const satisfies TaskStepWithVariousResource[];

const fixtures = createFixtures(ENTRIES, ({ step }) => step);
export default fixtures;
