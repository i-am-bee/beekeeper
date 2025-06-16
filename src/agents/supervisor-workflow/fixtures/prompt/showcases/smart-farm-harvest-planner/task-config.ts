import { TaskConfigMinimal } from "@/agents/supervisor-workflow/workflow-composer/task-initializer/task-config-initializer/dto.js";
import agentConfigFixtures from "./agent-config.js";
import { createFixtures, FixtureName } from "../../../base/fixtures.js";
import { addTaskConfigMissingAttrs } from "../../../helpers/add-missing-config-attrs.js";

type AgentType = FixtureName<typeof agentConfigFixtures>;

const ENTRIES = [
  {
    taskType: "retrieve_field_metadata",
    agentType: "field_metadata_retriever" satisfies AgentType,
    description:
      "Retrieve detailed metadata for a specified field using the field_info_api. The output should include the field's location, crop type, and moisture constraints.",
    taskConfigInput: `{ "field_identifier": "<field name or ID>" }`,
  },
  {
    taskType: "retrieve_equipment_ids",
    agentType: "equipment_id_retriever" satisfies AgentType,
    description:
      "Retrieve a list of equipment IDs assigned to a specified field using the equipment_registry_api. The output should include IDs for harvesters, drones, and dryers.",
    taskConfigInput: `{ "field_identifier": "<field name or ID>" }`,
  },
  {
    taskType: "retrieve_weather_forecast",
    agentType: "weather_forecast_retriever" satisfies AgentType,
    description:
      "Retrieve a 24-hour weather forecast for specified field coordinates using the weather_forecast_api. The output should include weather forecast data in a structured format.",
    taskConfigInput: `{ "field_coordinates": "<field coordinates>" }`,
  },
  {
    taskType: "check_equipment_operational_status",
    agentType: "equipment_status_checker" satisfies AgentType,
    description:
      "Verify and return the operational status of specified equipment such as harvesters, drones, and grain dryers using the equipment_status_api. The input should be a list of equipment IDs, and the output should indicate whether each piece of equipment is operational or not.",
    taskConfigInput: `{ "equipment_ids": ["<equipment ID>", "..."] }`,
  },
  {
    taskType: "generate_harvest_schedule",
    agentType: "harvest_schedule_generator" satisfies AgentType,
    description:
      "Generate a harvest or drying schedule that optimizes field operations while adhering to moisture constraints. Use the provided field details, weather forecast, and equipment status to create a schedule that meets moisture limits and optimizes the use of available equipment.",
    taskConfigInput: `{ "field_details": "<field details>", "weather_forecast": "<weather forecast>", "equipment_status": "<equipment status>" }`,
  },
  {
    taskType: "generate_harvest_timeline",
    agentType: "timeline_report_generator" satisfies AgentType,
    description:
      "Produce a detailed timeline for harvest operations, incorporating equipment assignments and weather-related contingency plans. Use the provided harvest schedule and weather forecast to generate a final harvest-day plan that includes equipment assignments and contingency notes.",
    taskConfigInput: `{ "harvest_schedule": "<harvest schedule>", "weather_forecast": "<weather forecast>" }`,
  },
] as const satisfies TaskConfigMinimal[];

export default createFixtures(
  addTaskConfigMissingAttrs(ENTRIES),
  ({ taskType }) => taskType,
);
