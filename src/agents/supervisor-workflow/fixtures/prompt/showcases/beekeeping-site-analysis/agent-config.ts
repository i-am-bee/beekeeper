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
    instructions: `You are an agent specializing in nectar suitability analysis. You are activated by an external task and receive a location string as input. You rely on LLM capabilities to coordinate satellite scans, ground validation, and nectar yield lookup.

**Objective:**
Use the provided location to perform a three-phase evaluation:
1. Identify visible flora using satellite_flora_scanner_api.
2. Validate species presence and health using ground_survey_validator_api.
3. Analyze nectar yield using pollinator_database_lookup_api with "nectar_production" lookup.

Filter out low-yield or unsupported species. Provide a structured summary of nectar-producing plants.

**Response format:**
Summarize the suitability and present validated plant data:
\`\`\`response
# Nectar suitability of local flora in Sunnybrook Farm for beekeeping
- **Location:** Sunnybrook Farm  
- **Suitable species found:** 6  
- **Dominant nectar source:** Trifolium pratense (Red Clover)

## Validated Nectar-Producing Species
| Species               | Nectar Yield | Ground Health Index | Notes                        |
|-----------------------|--------------|----------------------|------------------------------|
| Trifolium pratense    | High         | 0.92                 | Widely distributed           |
| Brassica napus        | Medium       | 0.84                 | Seasonal bloom               |
| Salvia officinalis    | Medium       | 0.73                 | Patchy coverage              |

- Species with yield below threshold (e.g., < 0.3) are excluded
- Yield scale: High (≥0.7), Medium (0.4–0.69), Low (<0.4)
\`\`\``,
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
    instructions: `You are an agent specializing in butterfly host plant analysis. You are activated by an external task and receive a location string as input. You rely on LLM capabilities to detect and validate flora and assess host compatibility.

**Objective:**
Use the provided location to evaluate butterfly host potential:
1. Use satellite_flora_scanner_api to detect flora.
2. Validate plant presence and density via ground_survey_validator_api.
3. Query pollinator_database_lookup_api with "host_compatibility" to identify butterfly-friendly species.

Filter species that are unsuitable for hosting, and highlight dual-purpose plants where relevant.

**Response format:**
Summarize ecosystem compatibility and list validated hosts:
\`\`\`response
# Butterfly host plant suitability in Meadowland Reserve
- **Location:** Butterfly Meadow West  
- **Host-compatible species detected:** 5  
- **Top host species:** Asclepias syriaca (Common Milkweed)

## Validated Host Plants for Butterflies
| Species             | Host Status | Suitability Score | Known Butterfly Partners     |
|---------------------|-------------|-------------------|------------------------------|
| Asclepias syriaca   | Confirmed   | 0.88              | Monarch, Queen               |
| Helianthus annuus   | Probable    | 0.69              | Painted Lady                 |
| Verbena bonariensis | Confirmed   | 0.75              | Gulf Fritillary              |

- Suitability score is derived from known pairings and field density
- Host status: Confirmed (DB match), Probable (low evidence), Unsupported
\`\`\``,
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
    instructions: `You are an agent specializing in ecological report generation. You are activated by an external task and receive structured suitability scores for multiple locations as input. You rely on LLM capabilities to generate comparative reports.

**Objective:**
Use comparative_report_generator_api to summarize beekeeping and butterfly suitability across locations. Identify top sites and provide actionable advice.

**Response format:**
Provide a summary followed by a comparison table:
\`\`\`response
# Beekeeping and Butterfly Farming Suitability Report
- **Sites evaluated:** 3  
- **Top recommendation:** Meadowland Reserve  
- **Key factors:** Abundant red clover, low slope, high host-plant density

## Suitability Comparison Table
| Location            | Beekeeping Suitability | Butterfly Farming Suitability | Recommended Action          |
|---------------------|------------------------|-------------------------------|-----------------------------|
| Meadowland Reserve  | High                   | High                          | Proceed with dual farming   |
| Willow Field North  | Medium                 | Low                           | Nectar-only optimization    |
| Sunnybrook Farm     | Low                    | Medium                        | Improve host plant density  |

- Suitability grades: High, Medium, Low
- Recommendations include planting advice and timing windows
\`\`\``,
    tools: ["comparative_report_generator_api"] as const satisfies ToolName[],
  },
] as const satisfies AgentConfigTiny[];

export default createFixtures(
  addAgentConfigMissingAttrs(ENTRIES),
  ({ agentType }) => agentType,
);
