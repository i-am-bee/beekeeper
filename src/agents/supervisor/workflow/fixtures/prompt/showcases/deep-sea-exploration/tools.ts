import { AgentAvailableTool } from "@/agents/supervisor/workflow/workflow-composer/task-initializer/agent-config-initializer/dto.js";
import { createFixtures } from "../../../base/fixtures.js";

const ENTRIES = [
  // Initial Tool (terrain mapping only)
  {
    toolName: "terrain_sonar_mapping_api",
    description:
      "Maps underwater terrain features using standard sonar pulses. Identifies depth contours, geological formations, seafloor topology, and underwater obstacles. Cannot detect biological entities or marine life.",
    toolInput:
      '{"zone_name":"<string>","scan_resolution":"standard|high","depth_range":"shallow|deep|full"}',
  },

  // Extension Tool (biological detection)
  {
    toolName: "biological_sonar_detector_api",
    description:
      "Detects and tracks marine life using specialized bio-acoustic sonar frequencies. Identifies fish schools, marine mammals, and other living organisms. Designed to work alongside terrain mapping for comprehensive zone analysis.",
    toolInput:
      '{"zone_name":"<string>","bio_frequency_range":"low|medium|high","organism_filter":"fish|mammals|all"}',
  },

  // Data Integration Tools
  {
    toolName: "sonar_data_integrator_api",
    description:
      "Integrates terrain and biological sonar data into unified underwater maps. Combines geological and biological information to create comprehensive zone profiles.",
    toolInput:
      '{"terrain_sonar_data":"<object>","biological_sonar_data":"<object>","integration_detail":"basic|comprehensive"}',
  },

  {
    toolName: "zone_comparison_analyzer_api",
    description:
      "Compares multiple exploration zones across terrain and biological characteristics. Analyzes integrated sonar data to rank zones for exploration suitability.",
    toolInput:
      '{"zone_analyses":["<object>"],"comparison_criteria":"terrain|biology|combined","ranking_priority":"exploration_value"}',
  },

  // Reporting Tools
  {
    toolName: "submarine_exploration_reporter_api",
    description:
      "Generates structured exploration reports from integrated sonar analysis. Creates documentation suitable for mission planning and scientific review.",
    toolInput:
      '{"integrated_analysis":"<object>","comparison_data":"<object>","report_type":"mission_brief|scientific|comprehensive"}',
  },
] as const satisfies AgentAvailableTool[];

export default createFixtures(ENTRIES, ({ toolName }) => toolName);
