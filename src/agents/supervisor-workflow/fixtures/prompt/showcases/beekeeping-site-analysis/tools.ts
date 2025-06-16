import { AgentAvailableTool } from "@/agents/supervisor-workflow/workflow-composer/task-initializer/agent-config-initializer/dto.js";
import { createFixtures } from "../../../base/fixtures.js";

const ENTRIES = [
  // Location Analysis Tools (each essential but incomplete)
  {
    toolName: "satellite_flora_scanner_api",
    description:
      "Scans location using satellite imagery to identify visible plant species. Provides species names but cannot determine nectar quality, bloom timing, or pollinator relationships.",
    toolInput: '{"location":"<string>"}',
  },
  {
    toolName: "ground_survey_validator_api",
    description:
      "Validates and enriches satellite data with ground-level plant health and density information. Requires species list from satellite scanning to focus the ground survey.",
    toolInput: '{"location":"<string>","target_species":["<string>"]}',
  },
  {
    toolName: "pollinator_database_lookup_api",
    description:
      "Looks up nectar production rates and butterfly host plant compatibility for identified species. Requires validated species list as input.",
    toolInput:
      '{"plant_species":["<string>"],"lookup_type":"nectar_production|host_compatibility|both"}',
  },
  // Reporting Tools (require multiple inputs)
  {
    toolName: "comparative_report_generator_api",
    description:
      "Generates structured comparison reports between locations. Requires suitability calculations from all analyzed locations.",
    toolInput:
      '{"location_suitability_scores":["<object>"],"report_format":"detailed","include_recommendations":true}',
  },
] as const satisfies AgentAvailableTool[];

export default createFixtures(ENTRIES, ({ toolName }) => toolName);
