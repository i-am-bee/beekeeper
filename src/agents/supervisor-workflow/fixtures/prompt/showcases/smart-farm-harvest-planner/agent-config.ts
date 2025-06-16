import { AgentConfigTiny } from "@/agents/supervisor-workflow/workflow-composer/task-initializer/agent-config-initializer/dto.js";
import toolsFixtures from "./tools.js";
import { createFixtures, FixtureName } from "../../../base/fixtures.js";
import { addAgentConfigMissingAttrs } from "../../../helpers/add-missing-config-attrs.js";

type ToolName = FixtureName<typeof toolsFixtures>;

const ENTRIES = [
  {
    agentType: "field_metadata_retriever",
    description:
      "This agent retrieves field metadata and agronomic details such as location, crop type, and moisture limits using the field_info_api.",
    instructions: `Context: The agent is designed to fetch and return detailed metadata for a specified field.
Objective: Given a field name or ID, the agent will use the field_info_api to obtain and return the field's location, crop type, and moisture constraints.
Response format: The agent will output the field details in a structured format, including location, crop type, and moisture limits.`,
    tools: ["field_info_api"] as const satisfies ToolName[],
  },
  {
    agentType: "equipment_id_retriever",
    description:
      "This agent retrieves a list of equipment IDs assigned to a specified field using the equipment_registry_api.",
    instructions: `Context: The agent is designed to fetch and return equipment IDs for a specified field.
Objective: Given a field name or ID, the agent will use the equipment_registry_api to obtain and return the list of equipment IDs, including harvesters, drones, and dryers.
Response format: The agent will output the equipment IDs in a structured format.`,
    tools: ["equipment_registry_api"] as const satisfies ToolName[],
  },
  {
    agentType: "weather_forecast_retriever",
    description:
      "This agent retrieves a 24-hour weather forecast for specified field coordinates using the weather_forecast_api.",
    instructions: `Context: The agent is designed to fetch and return weather forecast data for a given set of field coordinates.
    Objective: Given field coordinates, the agent will use the weather_forecast_api to obtain and return the 24-hour weather forecast data.
    Response format: The agent will output the weather forecast data in a structured format.`,
    tools: ["weather_forecast_api"] as const satisfies ToolName[],
  },
  {
    agentType: "equipment_status_checker",
    description:
      "This agent checks the operational readiness of specified equipment such as harvesters, drones, and grain dryers using the equipment_status_api.",
    instructions: `Context: The agent is designed to verify and return the operational status of equipment based on provided equipment IDs.
Objective: Given a list of equipment IDs, the agent will use the equipment_status_api to obtain and return the operational status of each piece of equipment.
Response format: The agent will output the equipment status in a structured format, indicating whether each piece of equipment is operational or not.`,
    tools: ["equipment_status_api"] as const satisfies ToolName[],
  },
  {
    agentType: "harvest_schedule_generator",
    description:
      "This agent generates an optimized harvest or drying schedule that meets moisture limits by considering field details, weather forecast, and equipment status.",
    instructions: `Context: The agent is designed to create a harvest or drying schedule that optimizes field operations while adhering to moisture constraints.
Objective: Given field details, a weather forecast, and equipment status, the agent will use the harvest_scheduler_api to generate a schedule that meets moisture limits and optimizes the use of available equipment.
Response format: The agent will output the harvest schedule in a structured format, detailing the field order and time blocks for operations.`,
    tools: ["harvest_scheduler_api"] as const satisfies ToolName[],
  },
  {
    agentType: "timeline_report_generator",
    description:
      "This agent generates a human-readable timeline with equipment assignments and contingency plans based on a given harvest schedule and weather forecast.",
    instructions: `Context: The agent is designed to produce a detailed timeline for harvest operations, incorporating equipment assignments and weather-related contingency plans.
Objective: Given a harvest schedule and weather forecast, the agent will generate a final harvest-day plan that includes equipment assignments and contingency notes.
Response format: The agent will output the timeline in a structured, human-readable format, detailing the sequence of operations, equipment usage, and any necessary adjustments due to weather conditions.`,
    tools: ["timeline_report_generator"] as const satisfies ToolName[],
  },
] as const satisfies AgentConfigTiny[];

export default createFixtures(
  addAgentConfigMissingAttrs(ENTRIES),
  ({ agentType }) => agentType,
);
