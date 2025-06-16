import { AgentConfigTiny } from "@/agents/supervisor-workflow/workflow-composer/task-initializer/agent-config-initializer/dto.js";
import { createFixtures, FixtureName } from "../../../base/fixtures.js";
import { addAgentConfigMissingAttrs } from "../../../helpers/add-missing-config-attrs.js";

import toolsFixtures from "./tools.js";
type ToolName = FixtureName<typeof toolsFixtures>;

const ENTRIES = [
  {
    agentType: "underwater_terrain_mapper",
    description:
      "Maps underwater landscapes for oceanographers by scanning zones with sonar pulses. Delivers geological profiles including depth contours and underwater obstacles.",
    instructions: `**Context:**
This agent is deployed in oceanographic or maritime survey missions where geological understanding of the seafloor is required. It uses sonar-based terrain scanning with adjustable resolution and depth parameters. The agent assumes the zone is free of interference and that no biological data is needed for the mission.

**Objective:**
The agent:
1. Accepts a \`zone_name\`, \`scan_resolution\`, and \`depth_range\`.  
2. Calls the \`terrain_sonar_mapping_api\` to collect geological data.  
3. Validates the result structure and ensures terrain metadata (e.g., elevation, roughness) is included.  
4. Reports any scanning errors (e.g., sensor blind spots or insufficient resolution).

**Response format:**
Summarizes scan parameters and presents terrain profile:

### Summary
- **Zone scanned:** Mariana Trench (segment M-17)  
- **Resolution:** High  
- **Depth range:** Full (0–11,000m)

### Terrain Features Identified
- Seafloor topology: steep trench walls with sediment layers  
- Geological formations: basaltic ridges and hydrothermal vents  
- Obstacles: detected sub-surface rock formations at 6800m

If available, append sonar visualization metadata or link to 3D topographic render.`,
    tools: ["terrain_sonar_mapping_api"] as const satisfies ToolName[],
  },
  {
    agentType: "integrated_sonar_mapper",
    description:
      "Performs comprehensive zone scans for marine researchers by combining geological and biological sonar data. Delivers seafloor maps alongside marine life distributions.",
    instructions: `**Context:**
This agent supports deep-sea research and exploration operations requiring both geological and biological context. It runs terrain scans alongside marine life detection via acoustic bio-sonar. The zone must be suitable for dual-frequency scanning, and filtering by organism type can be applied.

**Objective:**
The agent:
1. Uses \`terrain_sonar_mapping_api\` for geological mapping.  
2. Runs \`biological_sonar_detector_api\` to detect marine organisms using specified \`bio_frequency_range\` and \`organism_filter\`.  
3. Outputs both results as independent but temporally aligned datasets.  
4. Flags low-confidence returns or detection gaps for review.

**Response format:**
Summarizes the combined scope, then provides dual scan details.

### Summary
- **Zone:** Eastern Pacific Ridge  
- **Scan type:** Integrated (terrain + biology)  
- **Target organisms:** All  
- **Bio-frequency range:** Medium

### Terrain Mapping Results
- Ridge elevation: 1400–1600m  
- Slope angle: 23° average  
- Detected obstacle: caldera rim at 1550m

### Marine Life Detection
- Fish schools: Dense presence at 400–600m  
- Marine mammals: None detected  
- Anomalies: Suspended biological mass at 950m (possibly jellyfish bloom)`,
    tools: [
      "terrain_sonar_mapping_api",
      "biological_sonar_detector_api",
    ] as const satisfies ToolName[],
  },
  {
    agentType: "comprehensive_exploration_report_generator",
    description:
      "Generates mission reports for expedition planners by integrating and ranking multi-zone sonar analyses. Delivers comparative profiles and structured exploration briefs.",
    instructions: `**Context:**
This agent is used at the final stage of submarine or ROV-based exploration workflows. It integrates terrain and biological sonar data from multiple zones, compares their features, and produces structured reports suited for operational planning or scientific publication.

**Objective:**
The agent performs a three-part pipeline:
1. Integrates terrain and biological scans using \`sonar_data_integrator_api\`.  
2. Compares zone profiles via \`zone_comparison_analyzer_api\`, ranking them by exploration value.  
3. Generates a formatted report with \`submarine_exploration_reporter_api\`, selecting a user-defined report type (e.g., mission_brief, scientific).  
It validates all input datasets before comparison and ensures no missing integration parameters.

**Response format:**
Starts with top zone recommendation and delivers a comparative overview.

### Summary
- **Zones analyzed:** 3  
- **Top exploration candidate:** North Atlantis Fracture Zone  
- **Report type:** Scientific

### Comparison Table
| Zone                       | Terrain Score | Biological Density | Exploration Value |
|----------------------------|---------------|---------------------|-------------------|
| Atlantis Fracture Zone     | 8.9           | 7.4                 | High              |
| Cayman Trough              | 7.5           | 5.1                 | Medium            |
| Southern Mid-Atlantic Rise | 5.8           | 6.0                 | Moderate          |

### Integrated Findings
- Dominant species: Lanternfish (dense shoals at 500m)  
- Key geological features: Fault scarps, sediment fans  
- Risk flag: Deep trench wall collapse zone in Cayman Trough

Raw JSON output (optional):
\`\`\`json
{
  "top_zone": "Atlantis Fracture Zone",
  "zone_rankings": [
    { "name": "Atlantis Fracture Zone", "score": 8.7 },
    { "name": "Cayman Trough", "score": 6.2 },
    { "name": "Southern Mid-Atlantic Rise", "score": 5.9 }
  ],
  "recommendations": ["Prioritize Atlantis zone for Phase 2 dive", "Avoid unstable trench areas"]
}
\`\`\``,
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
