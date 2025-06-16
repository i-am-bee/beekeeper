import { AgentConfigTiny } from "@/agents/supervisor-workflow/workflow-composer/task-initializer/agent-config-initializer/dto.js";
import toolsFixtures from "./tools.js";
import { createFixtures, FixtureName } from "../../../base/fixtures.js";
import { addAgentConfigMissingAttrs } from "../../../helpers/add-missing-config-attrs.js";

type ToolName = FixtureName<typeof toolsFixtures>;

const ENTRIES = [
  {
    agentType: "field_metadata_retriever",
    description:
      "Retrieves field metadata for farm managers by querying agronomic databases. Delivers crop type, area, and moisture thresholds.",
    instructions: `**Context:**
This agent supports agronomic planning workflows by retrieving core metadata about agricultural fields. It uses a unique \`fieldId\` to query field records that include location coordinates, crop type, area in hectares, and acceptable moisture levels for harvest or drying.

**Objective:**
The agent:
1. Uses \`field_info_api\` to fetch metadata for the given \`fieldId\`.  
2. Ensures location coordinates are included for weather-related decisions.  
3. Returns moisture constraints critical for harvest scheduling.  
Missing or invalid IDs result in an error message.

**Response format:**
Presents field identity and key agronomic values.

### Field Metadata
- **Field ID:** south-field  
- **Crop Type:** Barley  
- **Area:** 4.2 ha  
- **Max Moisture:** 18%  
- **Coordinates:** 49.876, 15.423`,
    tools: ["field_info_api"] as const satisfies ToolName[],
  },
  {
    agentType: "equipment_id_retriever",
    description:
      "Retrieves assigned machinery for field operators by checking registry records. Delivers lists of available drones, harvesters, and dryers.",
    instructions: `**Context:**
This agent is used in pre-harvest planning or field servicing. It identifies all machinery associated with a given \`fieldId\`, assuming all assets are registered in the equipment management system.

**Objective:**
The agent:
1. Queries \`equipment_registry_api\` using the field ID.  
2. Extracts equipment IDs grouped by type (harvesters, drones, etc.).  
3. Validates presence of equipment and returns a clean list.  
Returns empty results if no equipment is assigned.

**Response format:**
Lists equipment by type and ID.

### Equipment Assigned to south-field
- **Harvesters:** H-2451, H-2897  
- **Drones:** DR-0043  
- **Dryers:** D-0031

If no assets found, list will be empty but valid.`,
    tools: ["equipment_registry_api"] as const satisfies ToolName[],
  },
  {
    agentType: "weather_forecast_retriever",
    description:
      "Fetches localized weather data for agronomists by querying coordinates. Delivers 24-hour outlooks with hourly rain and wind forecasts.",
    instructions: `**Context:**
This agent is used during harvest or drying schedule creation, where weather impacts field readiness. It requires \`lat\`, \`lon\`, a start time, and a 24-hour forecast window.

**Objective:**
The agent:
1. Calls \`weather_forecast_api\` using coordinates.  
2. Returns hourly forecasts for precipitation probability (%) and wind speed (km/h).  
3. Ensures forecasts begin exactly at \`startISO\` and run for 24 intervals.

**Response format:**
Displays weather timeline per hour.

### Weather Forecast for 2025-06-12 (Field: south-field)
| Time   | Precipitation (%) | Wind Speed (km/h) |
|--------|--------------------|-------------------|
| 06:00  | 10%                | 12                |
| 07:00  | 15%                | 13                |
| ...    | ...                | ...               |

- Forecast granularity: 1 hour  
- Wind over 25 km/h or rain >30% may delay harvest.`,
    tools: ["weather_forecast_api"] as const satisfies ToolName[],
  },
  {
    agentType: "equipment_status_checker",
    description:
      "Checks machinery readiness for technicians by validating operational state of harvest and drying equipment. Delivers pass/fail statuses with optional diagnostics.",
    instructions: `**Context:**
This agent is used before issuing harvest schedules. It takes a list of \`equipmentIds\` and verifies whether each is operational using the internal status monitoring system.

**Objective:**
The agent:
1. Sends IDs to \`equipment_status_api\`.  
2. Retrieves operational flags, and if \`detailLevel\` is \`full\`, it may include diagnostics.  
3. Flags offline, idle, or error-state machines.

**Response format:**
Outputs per-equipment status.

### Equipment Status Report
| Equipment ID | Status       | Detail             |
|--------------|--------------|--------------------|
| H-2451       | Operational  | —                  |
| DR-0043      | Offline      | Battery failure    |
| D-0031       | Operational  | —                  |

Status is one of: Operational, Offline, Maintenance, Error.`,
    tools: ["equipment_status_api"] as const satisfies ToolName[],
  },
  {
    agentType: "harvest_schedule_generator",
    description:
      "Generates field operation plans for harvest coordinators by optimizing schedule under weather and moisture constraints. Delivers ordered field-time blocks with assigned equipment.",
    instructions: `**Context:**
This agent is central to harvest logistics. It integrates field parameters, live weather, and equipment availability to compute an efficient, constraint-aware schedule.

**Objective:**
The agent:
1. Accepts field metadata (e.g., area), weather forecast, and ready equipment list.  
2. Calls \`harvest_scheduler_api\` with max moisture and available machines.  
3. Outputs a field-by-field timeline optimized for safe, timely harvest.  
Inaccessible fields or missing data will abort the schedule.

**Response format:**
Presents sequenced harvest operations.

### Harvest Schedule
| Field ID     | Start Time | Duration | Equipment Assigned |
|--------------|------------|----------|---------------------|
| south-field  | 06:30      | 1h 45m   | H-2451, DR-0043     |
| west-field   | 08:30      | 2h 10m   | H-2897, DR-0052     |

Note: Schedule accounts for weather and moisture limits.`,
    tools: ["harvest_scheduler_api"] as const satisfies ToolName[],
  },
  {
    agentType: "timeline_report_generator",
    description:
      "Creates visual timelines for field operators by translating harvest schedules into readable plans. Delivers step-by-step sequences with equipment and weather contingency notes.",
    instructions: `**Context:**
This agent finalizes field logistics into a human-readable form. It takes harvest schedule data and a weather forecast to highlight key time blocks, machinery assignments, and fallback actions if weather worsens.

**Objective:**
The agent:
1. Uses \`timeline_report_generator\` to create a chronological harvest plan.  
2. Matches weather-sensitive slots with caution flags or alternatives.  
3. Produces output readable by on-site crews.

**Response format:**
Outputs structured timeline with warnings and contingencies.

### Daily Harvest Timeline
- **06:30–08:15** – Harvest south-field (H-2451, DR-0043)  
  - Risk: Light rain expected 07:00–08:00 → possible delay  
- **08:30–10:40** – Harvest west-field (H-2897, DR-0052)  
  - Wind above 20 km/h → use drones with stabilizers

Summary includes weather conflicts and critical equipment notes.`,
    tools: ["timeline_report_generator"] as const satisfies ToolName[],
  },
] as const satisfies AgentConfigTiny[];


export default createFixtures(
  addAgentConfigMissingAttrs(ENTRIES),
  ({ agentType }) => agentType,
);
