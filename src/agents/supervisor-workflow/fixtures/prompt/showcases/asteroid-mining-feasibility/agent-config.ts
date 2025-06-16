import { AgentConfigTiny } from "@/agents/supervisor-workflow/workflow-composer/task-initializer/agent-config-initializer/dto.js";
import { createFixtures, FixtureName } from "../../../base/fixtures.js";
import { addAgentConfigMissingAttrs } from "../../../helpers/add-missing-config-attrs.js";

import toolsFixtures from "./tools.js";
type ToolName = FixtureName<typeof toolsFixtures>;

const ENTRIES = [
  {
    agentType: `asteroid_mineral_composition_analyzer`,
    description: `Analyzes the mineral composition of asteroids using spectroscopic data to provide raw element percentages and mineral identification.`,
    instructions: `Context: This agent is designed to analyze the mineral composition of asteroids using spectroscopic data.
Objective: Upon receiving an asteroid ID and analysis depth, the agent will utilize the spectral_composition_analyzer_api to retrieve and return the mineral composition data.
Response format: The agent will output the mineral composition data, including raw element percentages and mineral identification, based on the specified analysis depth.`,
    tools: ["spectral_composition_analyzer_api"] as const satisfies ToolName[],
  },
  {
    agentType: `asteroid_mission_planner`,
    description: `Cross-references asteroid mineral composition data with orbital mechanics calculations to assist in mission planning.`,
    instructions: `Context: This agent is designed to assist in planning asteroid missions by cross-referencing mineral composition data with orbital mechanics calculations.
Objective: Upon receiving an asteroid ID and its mineral composition data, the agent will utilize the orbital_mechanics_calculator_api to compute trajectory data and cross-reference it with the mineral composition for comprehensive mission planning.
Response format: The agent will output cross-referenced data that includes both mineral composition and relevant orbital mechanics information.`,
    tools: ["orbital_mechanics_calculator_api"] as const satisfies ToolName[],
  },
  {
    agentType: `mining_viability_report_compiler`,
    description: `Compiles a comprehensive mining viability report by integrating mineral composition data and orbital mechanics findings.`,
    instructions: `Context: This agent is designed to compile a mining viability report by integrating technical findings from mineral analysis and orbital mechanics.
Objective: Upon receiving mineral composition data and cross-referenced orbital mechanics data, the agent will analyze and synthesize the information to produce a comprehensive mining viability report.
Response format: The agent will output a detailed report that includes an assessment of the mining potential, technical challenges, and recommendations based on the integrated data.`,
    tools: [] as const satisfies ToolName[],
  },
] as const satisfies AgentConfigTiny[];

export default createFixtures(
  addAgentConfigMissingAttrs(ENTRIES),
  ({ agentType }) => agentType,
);
