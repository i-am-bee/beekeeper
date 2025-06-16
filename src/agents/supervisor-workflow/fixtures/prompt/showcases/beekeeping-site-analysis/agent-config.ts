import { AgentConfigTiny } from "@/agents/supervisor-workflow/workflow-composer/task-initializer/agent-config-initializer/dto.js";
import { createFixtures, FixtureName } from "../../../base/fixtures.js";
import { addAgentConfigMissingAttrs } from "../../../helpers/add-missing-config-attrs.js";

import toolsFixtures from "./tools.js";
type ToolName = FixtureName<typeof toolsFixtures>;

const ENTRIES = [
  {
    agentType: "flora_nectar_analysis",
    description:
      "Assesses nectar suitability for beekeepers by analyzing local flora using satellite and ground survey data. Delivers a list of validated nectar-producing species and their productivity ratings.",
    instructions: `**Context:**
This agent operates in ecological and agricultural environments where beekeepers assess new field sites for nectar potential. It starts by identifying plant species via satellite imagery, followed by validation through localized ground surveys. It then uses a pollinator database to evaluate the nectar production capability of the confirmed species. Inputs must include a valid location string.

**Objective:**
The agent executes a three-phase workflow:  
1. Identify visible flora via \`satellite_flora_scanner_api\`.  
2. Confirm plant presence and health using \`ground_survey_validator_api\`.  
3. Analyze nectar yield using \`pollinator_database_lookup_api\`.  
The agent filters out low-productivity or rare plants and ensures species names match pollinator data formats.

**Response format:**
Summarizes location status and presents a ranked list of nectar producers.

### Summary
- **Location:** Sunnybrook Farm  
- **Suitable species found:** 6  
- **Dominant nectar source:** Trifolium pratense (Red Clover)

### Validated Nectar-Producing Species
| Species               | Nectar Yield | Ground Health Index | Notes                        |
|-----------------------|--------------|----------------------|------------------------------|
| Trifolium pratense    | High         | 0.92                 | Widely distributed           |
| Brassica napus        | Medium       | 0.84                 | Seasonal bloom               |
| Salvia officinalis    | Medium       | 0.73                 | Patchy coverage              |

- Species with yield below threshold (e.g., < 0.3) are excluded
- Yield scale: High (≥0.7), Medium (0.4–0.69), Low (<0.4)`,
    tools: [
      "ground_survey_validator_api",
      "pollinator_database_lookup_api",
      "satellite_flora_scanner_api",
    ] as const satisfies ToolName[],
  },
  {
    agentType: "flora_butterfly_host_analysis",
    description:
      "Assesses butterfly habitat potential for conservationists by evaluating host plant compatibility in local flora. Delivers a list of validated host species and suitability indicators.",
    instructions: `**Context:**
This agent functions in biodiversity, conservation, or butterfly farming contexts where field suitability for butterfly reproduction is being evaluated. It identifies local plant species using satellite imaging and validates the results through ground-level surveys. Then, it checks each species against a host plant database for compatibility with regional butterfly species.

**Objective:**
The workflow involves:
1. Scan flora using \`satellite_flora_scanner_api\`.  
2. Validate plant density and health with \`ground_survey_validator_api\`.  
3. Run host plant compatibility checks using \`pollinator_database_lookup_api\` with lookup type set to "host_compatibility".  
The agent filters species that are not suitable for larval hosting and highlights ones with dual nectar-host roles.

**Response format:**
Provides an ecosystem suitability snapshot followed by compatibility details.

### Summary
- **Location:** Butterfly Meadow West  
- **Host-compatible species detected:** 5  
- **Top host species:** Asclepias syriaca (Common Milkweed)

### Validated Host Plants for Butterflies
| Species             | Host Status | Suitability Score | Known Butterfly Partners     |
|---------------------|-------------|-------------------|------------------------------|
| Asclepias syriaca   | Confirmed   | 0.88              | Monarch, Queen               |
| Helianthus annuus   | Probable    | 0.69              | Painted Lady                 |
| Verbena bonariensis | Confirmed   | 0.75              | Gulf Fritillary              |

- Suitability score is derived from known pairings and field density
- Host status: Confirmed (DB match), Probable (low evidence), Unsupported`,
    tools: [
      "ground_survey_validator_api",
      "pollinator_database_lookup_api",
      "satellite_flora_scanner_api",
    ] as const satisfies ToolName[],
  },
  {
    agentType: "report_compiler_for_farming_suitability",
    description:
      "Compiles ecological insights for land planners by comparing beekeeping and butterfly farming potential across sites. Delivers structured reports with findings and site-specific recommendations.",
    instructions: `**Context:**
This agent compiles final reports using results from previous nectar and butterfly host suitability analyses. It assumes precomputed location-level scores or insights are available. Input includes structured suitability scores per site, derived from earlier agents.

**Objective:**
The agent:
1. Aggregates structured input data for each site.  
2. Uses \`comparative_report_generator_api\` to generate a detailed comparative summary.  
3. Highlights top-performing locations, critical constraints, and actionable advice for farmers or conservationists.  
The output includes site rankings and grouped insights, maintaining clarity for non-technical stakeholders.

**Response format:**
Starts with key recommendations, followed by a comparative table of locations.

### Summary
- **Sites evaluated:** 3  
- **Top recommendation:** Meadowland Reserve  
- **Key factors:** Abundant red clover, low slope, high host-plant density

### Suitability Comparison Table
| Location            | Beekeeping Suitability | Butterfly Farming Suitability | Recommended Action          |
|---------------------|------------------------|-------------------------------|-----------------------------|
| Meadowland Reserve  | High                   | High                          | Proceed with dual farming   |
| Willow Field North  | Medium                 | Low                           | Nectar-only optimization    |
| Sunnybrook Farm     | Low                    | Medium                        | Improve host plant density  |

- Suitability grades: High, Medium, Low
- Recommendations include planting advice and timing windows

Raw JSON output (optional):
\`\`\`json
{
  "top_location": "Meadowland Reserve",
  "recommendations": [
    "Prioritize Meadowland Reserve for dual farming",
    "Introduce butterfly-compatible species in Sunnybrook Farm"
  ]
}
\`\`\``,
    tools: ["comparative_report_generator_api"] as const satisfies ToolName[],
  },
] as const satisfies AgentConfigTiny[];

export default createFixtures(
  addAgentConfigMissingAttrs(ENTRIES),
  ({ agentType }) => agentType,
);
