import { AgentAvailableTool } from "@/agents/supervisor/workflow/workflow-composer/task-initializer/agent-config-initializer/dto.js";
import { createFixtures } from "../../../base/fixtures.js";

const ENTRIES = [
  {
    toolName: "field_info_api",
    description:
      "Returns agronomic metadata and coordinates for a given field, such as crop type, area, and moisture constraints.",
    toolInput: '{"fieldId":"<string e.g. south-field>"}',
  },
  {
    toolName: "equipment_registry_api",
    description:
      "Lists all equipment units (harvesters, drones, dryers, etc.) assigned to a specific field or farm zone.",
    toolInput: '{"fieldId":"<string e.g. south-field>"}',
  },
  {
    toolName: "weather_forecast_api",
    description:
      "Returns hourly precipitation probability and wind speed for a geofence.",
    toolInput:
      '{"lat":<number>,"lon":<number>,"startISO":"<YYYY-MM-DDThh:mmZ>","hours":<integer>}',
  },
  {
    toolName: "equipment_status_api",
    description:
      "Checks operational readiness of harvesters, drones, and grain dryers.",
    toolInput: '{"equipmentIds":["<string>"],"detailLevel":"basic|full"}',
  },
  {
    toolName: "harvest_scheduler_api",
    description:
      "Creates an optimised field-order and time-block plan given machinery, forecast, and moisture limits.",
    toolInput:
      '{"fields":[{"id":"<string>","areaHa":<number>}],"availableEquipment":[{"equipmentId":"<string>"}],"weather":[/* output from weather_forecast_api */],"maxMoisturePercent":<number>}',
  },
  {
    toolName: "timeline_report_generator",
    description:
      "Generates a human-readable timeline with equipment assignments and contingency notes, based on the harvest schedule and weather outlook.",
    toolInput:
      '{"harvestSchedule":{/* output from harvest_scheduler_api */},"weatherForecast":{/* output from weather_forecast_api */}}',
  },
] as const satisfies AgentAvailableTool[];

export default createFixtures(ENTRIES, ({ toolName }) => toolName);
