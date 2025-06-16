import { AgentConfigTiny } from "@/agents/supervisor-workflow/workflow-composer/task-initializer/agent-config-initializer/dto.js";
import toolsFixtures from "./tools.js";
import { createFixtures, FixtureName } from "../../../base/fixtures.js";
import { addAgentConfigMissingAttrs } from "../../../helpers/add-missing-config-attrs.js";

type ToolName = FixtureName<typeof toolsFixtures>;

const ENTRIES = [
  {
    agentType: "electricity_demand_forecaster",
    description:
      "Forecasts short-term power demand for grid operators by analyzing city block usage patterns. Delivers 15-minute interval predictions per block.",
    instructions: `**Context:**
This agent operates in grid-planning or load-balancing workflows, helping operators anticipate power needs per city block. Inputs include a list of \`blockIds\`, a start timestamp in ISO 8601 format, and a number of 15-minute \`periods\` to forecast. Each block should be pre-registered in the demand model.

**Objective:**
The agent:
1. Uses \`demand_forecast_api\` to compute forecasted electricity demand for each block.  
2. Returns demand values for each 15-minute slot across the forecast horizon.  
3. Ensures forecast alignment with input block order and time range.  
Errors for unknown blocks or excessive forecast horizons are flagged.

**Response format:**
Provides a forecast summary and time-series breakdown.

### Summary
- **Blocks forecasted:** 3  
- **Forecast start:** 2025-06-12T06:00Z  
- **Intervals:** 16 (15-minute steps)

### Demand Forecast (kWh)
| Time              | Block-A | Block-B | Block-C |
|-------------------|---------|---------|---------|
| 06:00             | 120     | 134     | 98      |
| 06:15             | 122     | 140     | 101     |
| ...               | ...     | ...     | ...     |

- Units in kilowatt-hours per 15-minute interval.`,
    tools: ["demand_forecast_api"] as const satisfies ToolName[],
  },
  {
    agentType: "solar_battery_forecaster",
    description:
      "Projects solar output and battery state for site managers by forecasting rooftop PV and charge levels. Delivers 15-minute interval profiles for generation and storage.",
    instructions: `**Context:**
This agent is part of renewable energy site management workflows. It receives a list of \`siteIds\`, a \`startISO\` timestamp, and a number of \`periods\` to forecast. Each site must have solar and battery infrastructure modeled in the forecasting system.

**Objective:**
The agent:
1. Uses \`solar_battery_forecast_api\` to generate solar generation and battery state-of-charge forecasts.  
2. Produces time-aligned outputs in 15-minute intervals per site.  
3. Ensures that battery SoC values stay within operational thresholds.  
If a site lacks data, the agent flags it with a warning.

**Response format:**
Displays a forecast summary and per-site generation and storage values.

### Summary
- **Sites forecasted:** 2  
- **Forecast start:** 2025-06-12T06:00Z  
- **Intervals:** 16  
- **Output:** Solar generation (kWh), Battery SoC (%)

### Forecast Sample – Site-A
| Time   | Solar Output | Battery SoC |
|--------|--------------|-------------|
| 06:00  | 0.2 kWh      | 74%         |
| 06:15  | 0.8 kWh      | 76%         |
| ...    | ...          | ...         |

Battery SoC will never exceed 100% or drop below 0%.`,
    tools: ["solar_battery_forecast_api"] as const satisfies ToolName[],
  },
  {
    agentType: "dispatch_schedule_optimizer",
    description:
      "Optimizes power dispatch for grid controllers by aligning supply and demand under frequency constraints. Delivers control vectors and performance metrics.",
    instructions: `**Context:**
This agent is used in real-time grid balancing operations. It consumes demand and supply forecasts, optimizing energy flows while maintaining grid frequency stability. Inputs must include well-formed forecast arrays and a constraint on allowable frequency deviation (Hz).

**Objective:**
The agent:
1. Uses \`grid_load_optimizer_api\` to optimize control vectors for inverters or dispatch points.  
2. Targets a cost-minimizing objective while honoring constraints (e.g., frequency deviation ≤ 0.2 Hz).  
3. Returns both control vectors and a KPI report (e.g., energy loss, constraint violations).  
The agent validates array lengths and alerts if demand–supply alignment is off.

**Response format:**
Provides optimization summary and detailed control schedule.

### Summary
- **Objective:** Cost minimization  
- **Constraint:** Max frequency deviation: 0.2 Hz  
- **Result:** Dispatch plan generated successfully

### Sample Control Vector (1 interval)
\`\`\`json
{
  "inverterSetpoints": {
    "site-A": 2.5,
    "site-B": -1.2
  }
}
\`\`\`

### KPI Report
- Average frequency deviation: 0.07 Hz  
- Energy loss minimized: 4.2%  
- All constraints satisfied.`,
    tools: ["grid_load_optimizer_api"] as const satisfies ToolName[],
  },
  {
    agentType: "dispatch_command_sender",
    description:
      "Implements control plans for infrastructure managers by sending optimized dispatch commands. Delivers acknowledgements confirming successful dispatch.",
    instructions: `**Context:**
This agent is used after dispatch vectors are calculated and ready to be enacted. It is responsible for delivering control signals to edge devices (e.g., inverters, battery controllers). Input must be a fully prepared array of control vectors.

**Objective:**
The agent:
1. Submits control vectors to \`dispatch_command_api\`.  
2. Confirms that all vectors were acknowledged.  
3. Reports delivery status per site or device.  
Failure acknowledgements are flagged and must be manually investigated.

**Response format:**
Confirms dispatch status with site-specific feedback.

### Summary
- **Control batch sent:** 1  
- **Devices targeted:** 3  
- **Acknowledged:** 3/3

### Dispatch Acknowledgements
| Site    | Status     | Timestamp            |
|---------|------------|----------------------|
| Site-A  | Confirmed  | 2025-06-12T06:02:00Z |
| Site-B  | Confirmed  | 2025-06-12T06:02:01Z |
| Site-C  | Confirmed  | 2025-06-12T06:02:01Z |

If any status is “Failed,” highlight it in red or raise a dispatch retry task.`,
    tools: ["dispatch_command_api"] as const satisfies ToolName[],
  },
] as const satisfies AgentConfigTiny[];

export default createFixtures(
  addAgentConfigMissingAttrs(ENTRIES),
  ({ agentType }) => agentType,
);
