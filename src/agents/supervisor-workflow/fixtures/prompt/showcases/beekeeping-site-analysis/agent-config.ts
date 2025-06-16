import { AgentConfigTiny } from "@/agents/supervisor-workflow/workflow-composer/task-initializer/agent-config-initializer/dto.js";
import { createFixtures, FixtureName } from "../../../base/fixtures.js";
import { addAgentConfigMissingAttrs } from "../../../helpers/add-missing-config-attrs.js";

import toolsFixtures from "./tools.js";
type ToolName = FixtureName<typeof toolsFixtures>;

const ENTRIES = [
  {
    agentType: "flora_nectar_analysis",
    description:
      "Analyzes local flora to identify and validate nectar sources suitable for beekeeping using satellite and ground survey data.",
    instructions: `Context: The agent is designed to analyze local flora at a specified location to determine nectar sources suitable for beekeeping.
Objective: Utilize satellite imagery and ground survey data to identify plant species, validate their presence and health, and assess their nectar production suitability for beekeeping.
Response format: The agent will output nectar suitability data based on the analysis of identified plant species.`,
    tools: [
      "ground_survey_validator_api",
      "pollinator_database_lookup_api",
      "satellite_flora_scanner_api",
    ] as const satisfies ToolName[],
  },
  {
    agentType: "flora_butterfly_host_analysis",
    description:
      "Analyzes local flora to identify and validate nectar sources suitable for butterfly host plants using satellite and ground survey data.",
    instructions: `Context: The agent is designed to analyze local flora at a specified location to determine nectar sources suitable for butterfly host plants.
Objective: Utilize satellite imagery and ground survey data to identify plant species, validate their presence and health, and assess their compatibility as host plants for butterflies.
Response format: The agent will output butterfly host compatibility data based on the analysis of identified plant species.`,
    tools: [
      "ground_survey_validator_api",
      "pollinator_database_lookup_api",
      "satellite_flora_scanner_api",
    ] as const satisfies ToolName[],
  },
  {
    agentType: `report_compiler_for_farming_suitability`,
    description: `Compiles findings into a structured report, highlighting key findings and recommendations for beekeeping and butterfly farming at specified sites.`,
    instructions: `Context: The agent is designed to compile and structure findings from nectar suitability and butterfly host compatibility analyses into a comprehensive report.
Objective: Utilize the comparative_report_generator_api to generate a detailed report that includes key findings and recommendations for beekeeping and butterfly farming at each analyzed site.
Response format: The agent will output a structured report that highlights the suitability of each site for beekeeping and butterfly farming, including recommendations based on the compiled data.`,
    tools: ["comparative_report_generator_api"] as const satisfies ToolName[],
  },
] as const satisfies AgentConfigTiny[];

export default createFixtures(
  addAgentConfigMissingAttrs(ENTRIES),
  ({ agentType }) => agentType,
);
