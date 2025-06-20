import { AgentAvailableTool } from "@/agents/supervisor/workflow/workflow-composer/task-initializer/agent-config-initializer/dto.js";
import { createFixtures } from "../../../base/fixtures.js";

const ENTRIES = [
  // Asteroid Analysis Tools (each essential but incomplete)
  {
    toolName: "spectral_composition_analyzer_api",
    description:
      "Analyzes asteroid mineral composition using spectroscopic data. Provides raw element percentages and mineral identification but cannot assess mining difficulty or economic viability.",
    toolInput: '{"asteroid_id":"<string>","analysis_depth":"surface|deep"}',
  },
  {
    toolName: "orbital_mechanics_calculator_api",
    description:
      "Calculates orbital parameters, approach windows, and delta-v requirements for asteroid missions. Uses asteroid ID to compute trajectory data and cross-references with mineral composition for mission planning.",
    toolInput: '{"asteroid_id":"<string>","mineral_composition":"<object>"}',
  },
] as const satisfies AgentAvailableTool[];

export default createFixtures(ENTRIES, ({ toolName }) => toolName);
