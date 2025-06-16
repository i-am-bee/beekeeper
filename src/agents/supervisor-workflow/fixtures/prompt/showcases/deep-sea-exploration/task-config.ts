import { TaskConfigMinimal } from "@/agents/supervisor-workflow/workflow-composer/task-initializer/task-config-initializer/dto.js";
import { createFixtures, FixtureName } from "../../../base/fixtures.js";
import { addTaskConfigMissingAttrs } from "../../../helpers/add-missing-config-attrs.js";
import agentConfigFixtures from "./agent-config.js";

type AgentType = FixtureName<typeof agentConfigFixtures>;
const ENTRIES = [
  {
    taskType: `sonar_mapping_underwater_terrain`,
    agentType: `underwater_terrain_mapper` satisfies AgentType,
    description: `Conduct sonar mapping to identify underwater terrain features in the specified <zone_name> using the given <scan_resolution> and <depth_range>. Return the terrain sonar data as output.`,
    taskConfigInput: `{"zone_name": "<zone_name>", "scan_resolution": "<scan_resolution>", "depth_range": "<depth_range>"}`,
  },
  {
    taskType: `integrated_sonar_mapping`,
    agentType: `integrated_sonar_mapper` satisfies AgentType,
    description: `Conduct integrated sonar mapping to identify both underwater terrain features and marine life in the specified <zone_name> using the given <scan_resolution>, <depth_range>, <bio_frequency_range>, and <organism_filter>. Return the integrated terrain and biological sonar data as output.`,
    taskConfigInput: `{"zone_name": "<zone_name>", "scan_resolution": "<scan_resolution>", "depth_range": "<depth_range>", "bio_frequency_range": "<bio_frequency_range>", "organism_filter": "<organism_filter>"}`,
  },
  {
    taskType: `generate_comprehensive_comparison_report`,
    agentType: `comprehensive_exploration_report_generator` satisfies AgentType,
    description: `Generate a comprehensive exploration report by integrating and comparing terrain and biological sonar data from multiple zones. Use the provided sonar data to analyze and compare the zones, and return a structured exploration report as output.`,
    taskConfigInput: `{"sonar_data": ["<terrain and biological sonar data>", "..."]}`,
  },
] as const satisfies TaskConfigMinimal[];

export default createFixtures(
  addTaskConfigMissingAttrs(ENTRIES),
  ({ taskType }) => taskType,
);
