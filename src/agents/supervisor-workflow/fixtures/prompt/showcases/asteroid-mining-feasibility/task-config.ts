import { TaskConfigMinimal } from "@/agents/supervisor-workflow/workflow-composer/task-initializer/task-config-initializer/dto.js";
import { createFixtures, FixtureName } from "../../../base/fixtures.js";
import { addTaskConfigMissingAttrs } from "../../../helpers/add-missing-config-attrs.js";
import agentConfigFixtures from "./agent-config.js";

type AgentType = FixtureName<typeof agentConfigFixtures>;
const ENTRIES = [
  {
    taskType: `analyze_asteroid_mineral_composition`,
    agentType: `asteroid_mineral_composition_analyzer` satisfies AgentType,
    description: `Analyze the mineral composition of a specified asteroid using its ID and the desired analysis depth. Utilize spectroscopic data to provide raw element percentages and mineral identification.`,
    taskConfigInput: `{"asteroid_id": "<asteroid_id>", "analysis_depth": "<analysis_depth>"}`,
  },
  {
    taskType: `cross_reference_mineral_composition_with_orbital_mechanics`,
    agentType: `asteroid_mission_planner` satisfies AgentType,
    description: `Cross-reference the provided mineral composition data of a specified asteroid with its orbital mechanics calculations to assist in comprehensive mission planning.`,
    taskConfigInput: `{"asteroid_id": "<asteroid_id>", "mineral_composition": "<mineral_composition>"}`,
  },
  {
    taskType: `compile_mining_viability_report`,
    agentType: `mining_viability_report_compiler` satisfies AgentType,
    description: `Compile a comprehensive mining viability report by integrating the provided mineral composition data and cross-referenced orbital mechanics data. Analyze and synthesize the information to produce a detailed report that includes an assessment of the mining potential, technical challenges, and recommendations based on the integrated data.`,
    taskConfigInput: `{"mineral_composition_data": "<mineral_composition_data>", "cross_referenced_data": "<cross_referenced_data>"}`,
  },
] as const satisfies TaskConfigMinimal[];

export default createFixtures(
  addTaskConfigMissingAttrs(ENTRIES),
  ({ taskType }) => taskType,
);
