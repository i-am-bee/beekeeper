import { AgentConfigTiny } from "@/agents/supervisor-workflow/workflow-composer/task-initializer/agent-config-initializer/dto.js";
import { createFixtures, FixtureName } from "../../../base/fixtures.js";
import { addAgentConfigMissingAttrs } from "../../../helpers/add-missing-config-attrs.js";

import toolsFixtures from "./tools.js";
type ToolName = FixtureName<typeof toolsFixtures>;

const ENTRIES = [
  {
    agentType: `underwater_terrain_mapper`,
    description: `This agent conducts sonar mapping to identify underwater terrain features using the terrain_sonar_mapping_api.`,
    instructions: `Context: The agent is designed to perform sonar mapping of underwater zones to identify terrain features.
  Objective: Use the terrain_sonar_mapping_api to map underwater terrain features based on the provided input parameters.
  Response format: Return the terrain sonar data as output after conducting the mapping.`,
    tools: ["terrain_sonar_mapping_api"] as const satisfies ToolName[],
  },
  {
    agentType: `integrated_sonar_mapper`,
    description: `This agent conducts integrated sonar mapping to identify both underwater terrain features and marine life using the terrain_sonar_mapping_api and biological_sonar_detector_api.`,
    instructions: `Context: The agent is designed to perform comprehensive sonar mapping of underwater zones to identify both terrain features and marine life.
Objective: Use the terrain_sonar_mapping_api to map underwater terrain features and the biological_sonar_detector_api to detect marine life based on the provided input parameters.
Response format: Return the integrated terrain and biological sonar data as output after conducting the mapping.`,
    tools: [
      "terrain_sonar_mapping_api",
      "biological_sonar_detector_api",
    ] as const satisfies ToolName[],
  },
  {
    agentType: `comprehensive_exploration_report_generator`,
    description: `This agent generates comprehensive exploration reports by integrating and comparing terrain and biological sonar data from multiple zones.`,
    instructions: `Context: The agent is designed to create detailed exploration reports by integrating sonar data and analyzing multiple zones.
Objective: Use the sonar_data_integrator_api to combine terrain and biological sonar data, the zone_comparison_analyzer_api to compare zones, and the submarine_exploration_reporter_api to generate a structured exploration report.
Response format: Return a comprehensive exploration report as output after processing the input data.`,
    tools: [
      "sonar_data_integrator_api",
      "submarine_exploration_reporter_api",
      "zone_comparison_analyzer_api",
    ] as const satisfies ToolName[],
  },
] as const satisfies AgentConfigTiny[];

export default createFixtures(
  addAgentConfigMissingAttrs(ENTRIES),
  ({ agentType }) => agentType,
);
