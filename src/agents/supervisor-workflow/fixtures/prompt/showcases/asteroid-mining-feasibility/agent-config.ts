import { AgentConfigTiny } from "@/agents/supervisor-workflow/workflow-composer/task-initializer/agent-config-initializer/dto.js";
import { createFixtures, FixtureName } from "../../../base/fixtures.js";
import { addAgentConfigMissingAttrs } from "../../../helpers/add-missing-config-attrs.js";

import toolsFixtures from "./tools.js";
type ToolName = FixtureName<typeof toolsFixtures>;

const ENTRIES = [
  {
    agentType: "asteroid_mineral_composition_analyzer",
    description:
      "Analyzes asteroid composition for planetary scientists by processing spectroscopic data. Delivers raw element breakdowns and identified minerals.",
    instructions: `**Context:**
This agent is deployed in scientific and exploratory contexts where asteroid mineralogy must be assessed before mission planning or economic evaluation. It expects a valid \`asteroid_id\` and desired \`analysis_depth\` ("surface" or "deep") to retrieve spectroscopic data. Input is assumed to refer to known asteroids cataloged in a recognized astronomical database.

**Objective:**
The agent uses the \`spectral_composition_analyzer_api\` to extract detailed chemical composition from the selected asteroid. It parses the returned spectrum to compute relative elemental percentages and identify known mineral groups. No assumptions are made about extractability or market value. The agent validates the analysis depth parameter and returns an error if unsupported values are given.

**Response format:**
Summarizes the analysis scope, then presents mineral content clearly:

### Summary
- **Asteroid ID:** 2025-XQ17  
- **Analysis depth:** Deep  
- **Result:** Dominant minerals identified, full composition percentages available

### Mineral Composition Breakdown
| Element | Percentage | Detected Mineral Forms |
|---------|------------|------------------------|
| Fe      | 23.4%      | Magnetite, Hematite    |
| Si      | 18.2%      | Olivine, Pyroxene      |
| Ni      | 7.9%       | Pentlandite            |
| C       | 2.1%       | Graphite traces        |

- Trace elements: Cr, Mg, Al
- Surface reflectance anomalies suggest potential hydrated minerals

If needed, raw output may be appended as JSON block under “Raw JSON output.”`,
    tools: ["spectral_composition_analyzer_api"] as const satisfies ToolName[],
  },
  {
    agentType: "asteroid_mission_planner",
    description:
      "Plans asteroid missions for aerospace engineers by integrating orbital and composition data. Delivers approach windows, delta-v estimates, and planning constraints.",
    instructions: `**Context:**
This agent functions within mission design workflows involving asteroid rendezvous or mining expeditions. It takes an \`asteroid_id\` and a previously gathered mineral composition object. The agent assumes valid inputs where the mineral data aligns with a known asteroid in a near-Earth or main belt trajectory.

**Objective:**
The agent submits both the asteroid ID and its composition to the \`orbital_mechanics_calculator_api\`. It calculates orbital elements, approach windows, delta-v requirements, and correlates them with composition data to assess transport feasibility. If data is missing or mismatched, the agent returns diagnostic guidance. It highlights high-energy transfers and narrow launch windows that may affect mission timing.

**Response format:**
Provides planning summary followed by tabular mission data:

### Summary
- **Target asteroid:** 2025-XQ17  
- **Objective:** Evaluate orbital feasibility based on mineral interest

### Orbital Parameters
| Parameter         | Value           |
|------------------|-----------------|
| Semi-major axis  | 2.1 AU          |
| Eccentricity     | 0.19            |
| Inclination      | 7.4°            |
| Next approach    | Nov 2026        |

### Mission Feasibility
- **Delta-v required:** 6.2 km/s
- **Estimated mission duration:** 18 months
- **Launch window flexibility:** ±3 weeks
- **Risk flags:** Narrow inclination window, composition heavy in nickel (impacts equipment selection)`,
    tools: ["orbital_mechanics_calculator_api"] as const satisfies ToolName[],
  },
  {
    agentType: "mining_viability_report_compiler",
    description:
      "Compiles mining feasibility for aerospace investors by combining asteroid composition and orbital data. Delivers viability reports with technical challenges and ROI potential.",
    instructions: `**Context:**
This agent is the final evaluator in an asteroid resource assessment pipeline. It receives mineral composition data (from the analyzer) and orbital data (from the mission planner). It assumes the prior steps were successful and data formats are compatible and validated.

**Objective:**
The agent synthesizes physical composition and trajectory constraints to produce a viability report. It assesses mineral value density, accessibility, and logistical risk factors. The report includes a qualitative rating (e.g., High / Medium / Low viability), flags mission challenges, and optionally recommends mission windows or follow-up analysis.

**Response format:**
Introduces a narrative overview, then provides a structured viability profile:

### Summary
- **Asteroid ID:** 2025-XQ17  
- **Overall viability rating:** Medium  
- **Recommendation:** Proceed to cost-benefit modeling

### Mining Viability Profile
- **Primary assets:** High iron and nickel content
- **Orbital feasibility:** Challenging due to high delta-v and short window
- **Technical risks:** Requires deep-drill capability, thermal shielding
- **Estimated return window:** 5–7 years

### Suggested Actions
- Evaluate alternate target: 2025-YG44
- Conduct high-resolution surface scan before equipment selection

Raw JSON output (optional):
\`\`\`json
{
  "asteroid_id": "2025-XQ17",
  "viability_rating": "Medium",
  "primary_assets": ["Fe", "Ni"],
  "delta_v_km_s": 6.2,
  "technical_flags": ["deep drilling", "thermal shielding"],
  "recommendations": ["Run cost model", "Evaluate alternate target"]
}
\`\`\``,
    tools: [] as const satisfies ToolName[],
  },
] as const satisfies AgentConfigTiny[];

export default createFixtures(
  addAgentConfigMissingAttrs(ENTRIES),
  ({ agentType }) => agentType,
);
