import { createFixtures, FixtureName } from "../../../base/fixtures.js";
import {
  createResourceFixtures,
  TaskStepWithVariousResource,
} from "../../../base/resource-fixtures.js";

import toolsFixtures from "./tools.js";
import agentsFixtures from "./agent-config.js";
import tasksFixtures from "./task-config.js";
import taskRunsFixtures from "./task-run.js";
import { TaskStepMapper } from "@/agents/supervisor/workflow/workflow-composer/helpers/task-step/task-step-mapper.js";

type ToolName = FixtureName<typeof toolsFixtures>;

const ENTRIES = [
  {
    no: 1,
    step: "Retrieve field metadata and agronomic details for South Field",
    ...TaskStepMapper.parseInputOutput(
      "input: field name or ID; output: field details (location, crop, moisture limits, etc.)",
    ),
    resource: createResourceFixtures(
      {
        type: "tools",
        tools: ["field_info_api"] as const satisfies ToolName[],
      },
      {
        type: "agent",
        agent: agentsFixtures.get("field_metadata_retriever"),
      },
      {
        type: "task",
        task: tasksFixtures.get("retrieve_field_metadata"),
      },
      {
        type: "task_run",
        taskRun: taskRunsFixtures.get("retrieve_field_metadata_1"),
      },
    ),
  },
  {
    no: 2,
    step: "Retrieve the list of equipment IDs assigned to South Field",
    ...TaskStepMapper.parseInputOutput(
      "input: field name or ID [from Step 1]; output: equipment IDs (harvesters, drones, dryers)",
    ),
    resource: createResourceFixtures(
      {
        type: "tools",
        tools: ["equipment_registry_api"] as const satisfies ToolName[],
      },
      {
        type: "agent",
        agent: agentsFixtures.get("equipment_id_retriever"),
      },
      {
        type: "task",
        task: tasksFixtures.get("retrieve_equipment_ids"),
      },
      {
        type: "task_run",
        taskRun: taskRunsFixtures.get("retrieve_equipment_ids_1"),
      },
    ),
  },
  {
    no: 3,
    step: "Retrieve the 24-hour weather forecast for the coordinates of South Field",
    ...TaskStepMapper.parseInputOutput(
      "input: field coordinates [from Step 1]; output: weather forecast data",
    ),
    resource: createResourceFixtures(
      {
        type: "tools",
        tools: ["weather_forecast_api"] as const satisfies ToolName[],
      },
      {
        type: "agent",
        agent: agentsFixtures.get("weather_forecast_retriever"),
      },
      {
        type: "task",
        task: tasksFixtures.get("retrieve_weather_forecast"),
      },
      {
        type: "task_run",
        taskRun: taskRunsFixtures.get("retrieve_weather_forecast_1"),
      },
    ),
  },
  {
    no: 4,
    step: "Check the operational readiness of harvesters, drones, and grain dryers",
    ...TaskStepMapper.parseInputOutput(
      "input: equipment IDs [from Step 2]; output: equipment status",
    ),
    resource: createResourceFixtures(
      {
        type: "tools",
        tools: ["equipment_status_api"] as const satisfies ToolName[],
      },
      {
        type: "agent",
        agent: agentsFixtures.get("equipment_status_checker"),
      },
      {
        type: "task",
        task: tasksFixtures.get("check_equipment_operational_status"),
      },
      {
        type: "task_run",
        taskRun: taskRunsFixtures.get("check_equipment_operational_status_1"),
      },
    ),
  },
  {
    no: 5,
    step: "Generate a harvest or drying schedule that meets moisture limits, considering weather and equipment status",
    ...TaskStepMapper.parseInputOutput(
      "input: field details [from Step 1], weather forecast [from Step 3], equipment status [from Step 4]; output: harvest schedule",
    ),
    resource: createResourceFixtures(
      {
        tools: ["harvest_scheduler_api"] as const satisfies ToolName[],
        type: "tools",
      },
      {
        type: "agent",
        agent: agentsFixtures.get("harvest_schedule_generator"),
      },
      {
        type: "task",
        task: tasksFixtures.get("generate_harvest_schedule"),
      },
      {
        type: "task_run",
        taskRun: taskRunsFixtures.get("generate_harvest_schedule_1"),
      },
    ),
  },
  {
    no: 6,
    step: "Produce a human-readable timeline with equipment assignments and rain contingency plans",
    ...TaskStepMapper.parseInputOutput(
      "input: harvest schedule [from Step 5], weather forecast [from Step 3]; output: final harvest-day plan",
    ),
    resource: createResourceFixtures(
      {
        type: "llm",
      },
      {
        type: "agent",
        agent: agentsFixtures.get("timeline_report_generator"),
      },
      {
        type: "task",
        task: tasksFixtures.get("generate_harvest_timeline"),
      },
      {
        type: "task_run",
        taskRun: taskRunsFixtures.get("generate_harvest_timeline_1"),
      },
    ),
  },
] as const satisfies TaskStepWithVariousResource[];

const fixtures = createFixtures(ENTRIES, ({ step }) => step);
export default fixtures;
