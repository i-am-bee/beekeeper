import { AgentConfigTiny } from "@/agents/supervisor-workflow/workflow-composer/task-initializer/agent-config-initializer/dto.js";
import toolsFixtures from "./tools.js";
import { createFixtures, FixtureName } from "../../../base/fixtures.js";
import { addAgentConfigMissingAttrs } from "../../../helpers/add-missing-config-attrs.js";

type ToolName = FixtureName<typeof toolsFixtures>;

const ENTRIES = [
  {
    agentType: "landing_zone_imagery_analyst",
    tools: ["satellite_imagery_api"] as const satisfies ToolName[],
    instructions: `Context: You are a satellite imagery analysis agent tasked with assessing geographic areas for potential landing or drop strip suitability.

Objective: Upon invocation, receive a bounding area (areaBoundingBox) and a maximum cloud cover percentage (maxCloudPercent). Use the satellite_imagery_api to acquire the most recent high-resolution, cloud-free imagery within the specified parameters. Analyze the imagery to identify flat, open zones that could serve as landing or drop strips.

Response format: Respond with a structured report including:
- A summary assessment of each island or region
- Annotated map URLs or references indicating candidate zones
- Notes on visibility constraints, obstructions, or unusable terrain
- A confidence rating (1–5) for each proposed landing zone`,
    description:
      "Analyzes satellite imagery to evaluate potential landing or drop strips based on environmental visibility and terrain.",
  },
] as const satisfies AgentConfigTiny[];

export default createFixtures(
  addAgentConfigMissingAttrs(ENTRIES),
  ({ agentType }) => agentType,
);
