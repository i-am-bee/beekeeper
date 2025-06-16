import { AgentAvailableTool } from "@/agents/supervisor-workflow/workflow-composer/task-initializer/agent-config-initializer/dto.js";
import { createFixtures } from "../../base/fixtures.js";

const ENTRIES = [
  {
    toolName: "equipment_status_api",
    description:
      "Queries a farm’s fleet-management system (or on-board diagnostics) to retrieve real-time health and operational data for automated equipment. Returns ID, equipment type/model, last-heartbeat timestamp, current state (Operational | Idle | Offline | Maintenance), location, battery/fuel level, active error codes, cumulative uptime, and a short suggested action if status is not Operational.",
    toolInput:
      '{"equipmentIds":["string"],"includeTelemetry":true,"timeWindowHours":24,"units":"metric|imperial|auto"}',
  },
  {
    toolName: "soil_analysis_api",
    description:
      "Analyzes one or more soil-sample payloads (lab results or in-field sensor readings) and returns a structured soil-quality assessment: pH, electrical conductivity, organic-matter %, macronutrients (N P K), secondary nutrients (Ca Mg S), selectable micronutrients, texture class, water-holding capacity, an overall rating, and 2–4 crop-specific recommendations.",
    toolInput:
      '{"samples":[{"fieldId":"string","sampleDate":"YYYY-MM-DD","coordinates":{"lat":0.0,"lng":0.0},"ph":0.0,"electricalConductivity":0.0,"organicMatterPercent":0.0,"nutrients":{"N":0.0,"P":0.0,"K":0.0,"Ca":0.0,"Mg":0.0,"S":0.0,"Fe":0.0,"Zn":0.0,"Mn":0.0,"B":0.0},"texture":"sand|silt|clay|loam|sandy_loam|clay_loam|silty_loam","cropType":"string (optional)"}],"units":"metric|imperial|auto"}',
  },
  {
    toolName: "farm_task_planning_api",
    description:
      "Generates an optimized schedule of field operations for a specified planning horizon by analysing field conditions, equipment availability, and weather data. Returns an ordered list of tasks with recommended time windows, field/crop details, required equipment, duration, priority, and weather-related constraints or prerequisites.",
    toolInput: `{
  "planningDate": "YYYY-MM-DD",
  "horizonHours": 24,
  "fields": [
    {
      "fieldId": "string",
      "cropType": "string",
      "growthStage": "string",
      "areaHa": 0.0,
      "soilMoisturePercent": 0.0,
      "conditions": {
        "pests": "string",
        "diseaseRisk": "string",
        "trafficability": "Good|Fair|Poor"
      }
    }
  ],
  "equipment": [
    {
      "equipmentId": "string",
      "type": "string",
      "model": "string",
      "state": "Operational|Idle|Offline|Maintenance",
      "availableFrom": "HH:MM",
      "availableTo": "HH:MM",
      "capabilities": [
        "planting",
        "spraying",
        "harvesting",
        "scouting",
        "maintenance"
      ]
    }
  ],
  "weather": {
    "location": { "lat": 0.0, "lng": 0.0 },
    "forecast": [
      {
        "date": "YYYY-MM-DD",
        "hour": "HH",
        "tempC": 0.0,
        "precipProb": 0,
        "windKph": 0,
        "conditions": "string"
      }
    ]
  },
  "objectives": {
    "targetYieldPercent": 0,
    "harvestDueDays": 0
  },
  "units": "metric|imperial|auto"
}`,
  },
  {
    toolName: "weather_forecast_api",
    description:
      "Retrieves short- to medium-range weather forecasts for a specific location. Returns daily and optional hourly data: conditions summary, min/max temperature, precipitation probability/amount, wind speed & direction, humidity, sunrise/sunset times, and any active weather alerts.",
    toolInput:
      '{"location":{"lat":0.0,"lng":0.0,"name":"string (optional)"},"startDate":"YYYY-MM-DD","days":7,"includeHourly":false,"units":"metric|imperial|auto"}',
  },
] as const satisfies AgentAvailableTool[];

export default createFixtures(ENTRIES, ({ toolName }) => toolName);
