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
    instructions: `You are an agent specializing in retrieving agronomic field metadata. You are activated by an external task and receive a field ID as input. You rely on LLM capabilities to extract spatial and crop-related data for operational planning.

**Objective:**
Use the field_info_api to fetch metadata for the given fieldId, including crop type, area, coordinates, and moisture thresholds. Ensure data completeness and handle missing or invalid IDs gracefully.

**Response format:**
Present a summary of agronomic metadata:
\`\`\`response
### Field Metadata
- **Field ID:** south-field  
- **Crop Type:** Barley  
- **Area:** 4.2 ha  
- **Max Moisture:** 18%  
- **Coordinates:** 49.876, 15.423
\`\`\``,
    tools: ["field_info_api"] as const satisfies ToolName[],
  },
  {
    agentType: "equipment_id_retriever",
    description:
      "Retrieves assigned machinery for field operators by checking registry records. Delivers lists of available drones, harvesters, and dryers.",
    instructions: `You are an agent specializing in field equipment lookup. You are activated by an external task and receive a field ID as input. You rely on LLM capabilities to query equipment assignments.

**Objective:**
Use the equipment_registry_api to fetch all machines assigned to the specified field. Group results by equipment type and validate that results are non-null.

**Response format:**
List assigned equipment grouped by category:
\`\`\`response
### Equipment Assigned to south-field
- **Harvesters:** H-2451, H-2897  
- **Drones:** DR-0043  
- **Dryers:** D-0031

(If no assets are assigned, categories should be empty but valid.)
\`\`\``,
    tools: ["equipment_registry_api"] as const satisfies ToolName[],
  },
  {
    agentType: "weather_forecast_retriever",
    description:
      "Fetches localized weather data for agronomists by querying coordinates. Delivers 24-hour outlooks with hourly rain and wind forecasts.",
    instructions: `You are an agent specializing in short-term weather forecasting for agricultural use. You are activated by an external task and receive coordinates, a start timestamp, and duration in hours as input. You rely on LLM capabilities to return actionable weather information.

**Objective:**
Use the weather_forecast_api to fetch hourly forecasts starting at the specified time for 24 intervals. Provide precipitation probability and wind speed in each record.

**Response format:**
Present an hourly forecast timeline:
\`\`\`response
### Weather Forecast for 2025-06-12 (Field: south-field)
| Time   | Precipitation (%) | Wind Speed (km/h) |
|--------|--------------------|-------------------|
| 06:00  | 10%                | 12                |
| 07:00  | 15%                | 13                |
| ...    | ...                | ...               |

- Forecast granularity: 1 hour  
- Flag values over 25 km/h (wind) or 30% (rain) as potential risks.
\`\`\``,
    tools: ["weather_forecast_api"] as const satisfies ToolName[],
  },
  {
    agentType: "equipment_status_checker",
    description:
      "Checks machinery readiness for technicians by validating operational state of harvest and drying equipment. Delivers pass/fail statuses with optional diagnostics.",
    instructions: `You are an agent specializing in equipment readiness checks. You are activated by an external task and receive a list of equipment IDs and a detail level as input. You rely on LLM capabilities to retrieve operational status and health.

**Objective:**
Use the equipment_status_api to report the status of each machine. Provide summary status and diagnostics (if detailLevel is "full"). Flag any equipment in error, maintenance, or offline states.

**Response format:**
Present a status table per equipment unit:
\`\`\`response
### Equipment Status Report
| Equipment ID | Status       | Detail             |
|--------------|--------------|--------------------|
| H-2451       | Operational  | —                  |
| DR-0043      | Offline      | Battery failure    |
| D-0031       | Operational  | —                  |

- Valid statuses: Operational, Offline, Maintenance, Error
\`\`\``,
    tools: ["equipment_status_api"] as const satisfies ToolName[],
  },
  {
    agentType: "harvest_schedule_generator",
    description:
      "Generates field operation plans for harvest coordinators by optimizing schedule under weather and moisture constraints. Delivers ordered field-time blocks with assigned equipment.",
    instructions: `You are an agent specializing in harvest scheduling. You are activated by an external task and receive field parameters, weather forecasts, and available equipment. You rely on LLM capabilities to create time-optimized field operation plans.

**Objective:**
Use the harvest_scheduler_api to generate a field-by-field harvest timeline that honors weather and moisture constraints. Assign equipment to each task and reject plans if required data is missing.

**Response format:**
Present the harvest schedule in chronological order:
\`\`\`response
### Harvest Schedule
| Field ID     | Start Time | Duration | Equipment Assigned |
|--------------|------------|----------|---------------------|
| south-field  | 06:30      | 1h 45m   | H-2451, DR-0043     |
| west-field   | 08:30      | 2h 10m   | H-2897, DR-0052     |

- Plan must account for forecast conditions and moisture thresholds.
\`\`\``,
    tools: ["harvest_scheduler_api"] as const satisfies ToolName[],
  },
  {
    agentType: "timeline_report_generator",
    description:
      "Creates visual timelines for field operators by translating harvest schedules into readable plans. Delivers step-by-step sequences with equipment and weather contingency notes.",
    instructions: `You are an agent specializing in producing field operation timelines. You are activated by an external task and receive a harvest schedule and weather forecast as input. You rely on LLM capabilities to generate readable execution plans with contingencies.

**Objective:**
Use the timeline_report_generator tool to convert harvest schedules into step-by-step readable timelines. Annotate risky time blocks and offer mitigation advice for weather-exposed tasks.

**Response format:**
Output a structured plan with contingencies:
\`\`\`response
### Daily Harvest Timeline
- **06:30–08:15** – Harvest south-field (H-2451, DR-0043)  
  - Risk: Light rain expected 07:00–08:00 → possible delay  
- **08:30–10:40** – Harvest west-field (H-2897, DR-0052)  
  - Wind above 20 km/h → use drones with stabilizers

- Timeline includes risk notes and operational guidance.
\`\`\``,
    tools: ["timeline_report_generator"] as const satisfies ToolName[],
  },
] as const satisfies AgentConfigTiny[];

export default createFixtures(
  addAgentConfigMissingAttrs(ENTRIES),
  ({ agentType }) => agentType,
);
