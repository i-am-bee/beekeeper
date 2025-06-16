import { AgentAvailableTool } from "@/agents/supervisor-workflow/workflow-composer/task-initializer/agent-config-initializer/dto.js";
import { createFixtures } from "../../../base/fixtures.js";

const ENTRIES = [
  {
    toolName: "satellite_imagery_api",
    description:
      "Returns recent cloud-free imagery and detects potential landing zones.",
    toolInput:
      '{"areaBoundingBox":{"latMin":<number>,"latMax":<number>,"lonMin":<number>,"lonMax":<number>},"maxCloudPercent":<integer>}'
  },
  {
    toolName: "runway_checker_api",
    description:
      "Evaluates strips against aircraft requirements; returns usable flag.",
    toolInput:
      '{"stripIds":["<string>"],"aircraftType":"<string>"}'
  },
  {
    toolName: "cargo_route_planner_api",
    description:
      "Optimises multi-stop air route; returns waypoint list & ETAs.",
    toolInput:
      '{"origin":{"lat":<number>,"lon":<number>},"destinations":[{"lat":<number>,"lon":<number>}],"payloadKg":<number>,"aircraft":"<string>"}'
  },
  {
    toolName: "supply_manifest_optimizer_api",
    description:
      "Allocates relief goods within payload limit.",
    toolInput:
      '{"needs":[{"villageId":"<string>","items":[{"name":"<string>","qty":<number>}]}],"maxPayloadKg":<number>}'
  },
  {
    toolName: "weather_forecast_api",
    description:
      "Provides aviation-grade METAR/TAF and gridded forecasts for winds, visibility, and cloud bases.",
    toolInput:
      '{"areaBoundingBox":{"latMin":<number>,"latMax":<number>,"lonMin":<number>,"lonMax":<number>},"timeWindowHours":<integer>}'
  },
  {
    toolName: "notam_fetcher_api",
    description:
      "Retrieves current NOTAMs for specified FIRs and airports.",
    toolInput:
      '{"firCodes":["<string>"],"airportIcaos":["<string>"]}'
  },
  {
    toolName: "flight_clearance_manager_api",
    description:
      "Submits and tracks over-flight, landing, or drop-zone permits with aviation authorities.",
    toolInput:
      '{"countryCodes":["<string>"],"purpose":"<string>","flightPlan":{"route":"<string>","altitudes":[<number>],"times":["<ISO-datetime>"]}}'
  },
  {
    toolName: "aircraft_asset_locator_api",
    description:
      "Finds available fixed-wing or rotary aircraft matching payload, range, and runway/helipad constraints.",
    toolInput:
      '{"payloadKg":<number>,"runwayRequirementMeters":<number>,"helicopterCapable":<boolean>,"earliestStart":"<ISO-datetime>","durationHours":<number>}'
  },
  {
    toolName: "crew_scheduler_api",
    description:
      "Books pilots, loadmasters, and maintenance teams while observing duty-time limits.",
    toolInput:
      '{"aircraftId":"<string>","missionDays":["<YYYY-MM-DD>"]}'
  },
  {
    toolName: "fuel_and_support_planner_api",
    description:
      "Calculates fuel uplift, identifies refuel points, and generates ground-support logistics.",
    toolInput:
      '{"routeWaypoints":[{"lat":<number>,"lon":<number>}],"aircraftType":"<string>","reservePolicy":"<string>"}'
  },
  {
    toolName: "aeronautical_route_validator_api",
    description:
      "Checks terrain clearance, obstacles, and runway suitability, returning safety flags and mitigation notes.",
    toolInput:
      '{"plannedRoute":{"points":[{"lat":<number>,"lon":<number>}]},"aircraftPerformance":{"type":"<string>","weightKg":<number>},"stripIds":["<string>"]}'
  },
  {
    toolName: "contingency_matrix_builder_api",
    description:
      "Generates branch plans to switch delivery method based on triggers such as weather or strip flooding.",
    toolInput:
      '{"primaryPlanId":"<string>","triggers":["<string>"]}'
  }
] as const satisfies AgentAvailableTool[];

export default createFixtures(ENTRIES, ({ toolName }) => toolName);
