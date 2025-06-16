import { TaskConfigMinimal } from "@/agents/supervisor-workflow/workflow-composer/task-initializer/task-config-initializer/dto.js";
import { createFixtures, FixtureName } from "../../../base/fixtures.js";
import { addTaskConfigMissingAttrs } from "../../../helpers/add-missing-config-attrs.js";
import agentConfigFixtures from "./agent-config.js";

type AgentType = FixtureName<typeof agentConfigFixtures>;
const ENTRIES = [
  {
    taskType: "analyze_flora_for_nectar_sources",
    agentType: "flora_nectar_analysis" satisfies AgentType,
    description:
      "Analyze local flora at a specified <location> to determine nectar sources suitable for beekeeping. Utilize satellite imagery and ground survey data to identify plant species, validate their presence and health, and assess their nectar production suitability.",
    taskConfigInput: `{"location": "<location>"}`,
  },
  {
    taskType: "analyze_flora_for_butterfly_host_plants",
    agentType: "flora_butterfly_host_analysis" satisfies AgentType,
    description:
      "Analyze local flora at a specified <location> to determine nectar sources suitable for butterfly host plants. Utilize satellite imagery and ground survey data to identify plant species, validate their presence and health, and assess their compatibility as host plants for butterflies.",
    taskConfigInput: `{"location": "<location>"}`,
  },
  {
    taskType: `compile_farming_suitability_report`,
    agentType: `report_compiler_for_farming_suitability` satisfies AgentType,
    description: `Compile findings from nectar suitability and butterfly host compatibility analyses into a structured report. Highlight key findings and provide recommendations for beekeeping and butterfly farming at each analyzed site.`,
    taskConfigInput: `{"nectar_suitability_data": ["<data>", "..."], "butterfly_host_compatibility_data": ["<data>", "..."]}`,
  },
] as const satisfies TaskConfigMinimal[];

export default createFixtures(
  addTaskConfigMissingAttrs(ENTRIES),
  ({ taskType }) => taskType,
);
