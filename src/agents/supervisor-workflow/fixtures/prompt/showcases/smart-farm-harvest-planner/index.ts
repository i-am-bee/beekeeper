import toolsFixtures from "./tools.js";
import agentsFixtures from "./agent-config.js";
import tasksFixtures from "./task-config.js";
import taskStepsFixtures from "./task-step.js";
import taskRunsFixtures from "./task-run.js";
import {
  ChoiceExplanations,
  WorkflowComposeFixture,
} from "../../../base/workflow-compose-fixtures.js";

const title = "Smart-Farm “Rain-Contingency” Harvest Planner";
const prompt =
  "Tomorrow looks wet. Please plan the wheat harvest for our South Field using the latest weather and make sure all machines are ready; switch to grain-dryer mode if heavy rain is likely.";

const choiceExplanations = {
  requestHandler:
    "The user requests a multi-step harvest plan (weather, equipment, fallback workflow). This clearly requires downstream orchestration.",
  problemDecomposer:
    "All required components in the user's goal can be addressed using the provided tools. The problem is logically consistent, all necessary parameters are either provided or can be safely assumed, and every step has a matching tool. Therefore, a STEP_SEQUENCE can be generated.",
  steps: [
    {
      no: 1,
      agentConfig:
        "The task requires retrieving field metadata and agronomic details using the field_info_api tool. There is no existing agent config, so a new agent config needs to be created to handle this task.",
      taskConfig:
        "There are no existing task configs that match the requirement to retrieve field metadata and agronomic details. Therefore, a new task config needs to be created.",
      taskRun: `The task config "retrieve_field_metadata" exists and the input can be completed using the non-dependent field "field name or ID" provided in the task step.`,
    },
    {
      no: 2,
      agentConfig:
        "The task requires retrieving equipment IDs assigned to a specific field using the equipment_registry_api. This task aligns with the capabilities of an agent that can utilize the equipment_registry_api to fetch equipment details based on a field name or ID. No existing agent config matches this exact purpose, so a new agent config is needed.",
      taskConfig:
        "There is no existing task config that matches the requirement to retrieve equipment IDs for a specified field. Therefore, a new task config needs to be created.",
      taskRun: `The task config "retrieve_equipment_ids" exists, and the input can be completed using non-dependent fields. The field name or ID is marked as [from Step 1], so it will be injected automatically by the runtime engine.`,
    },
    {
      no: 3,
      agentConfig:
        "The task requires retrieving weather forecast data using the field coordinates, which aligns with the capabilities of the weather_forecast_api. No existing agent config matches this task, so a new agent config is needed.",
      taskConfig:
        "There is no existing task config for retrieving weather forecast data, and the agent type weather_forecast_retriever is available. Therefore, I will create a new task config.",
      taskRun: `The task config for "retrieve_weather_forecast" exists, and the input can be completed using non-dependent fields.`,
    },
    {
      no: 4,
      agentConfig:
        "The task requires checking the operational readiness of equipment using the equipment_status_api, which is not covered by any existing agent config. Therefore, a new agent config needs to be created to handle this task.",
      taskConfig:
        "The task of checking the operational readiness of equipment based on equipment IDs aligns with the purpose and input requirements of the existing agent config `equipment_status_checker`. There is no existing task config for this specific task, so a new task config needs to be created.",
      taskRun: `The task config "check_equipment_operational_status" exists, and the input can be completed using non-dependent fields. The input "equipment IDs" is marked as [from Step 2], so it will be automatically filled by the runtime engine.`,
    },
    {
      no: 5,
      agentConfig:
        "The task requires generating a harvest or drying schedule based on field details, weather forecast, and equipment status. This task aligns with the capabilities of the harvest_scheduler_api, which is available in the list of tools. No existing agent config matches this specific task, so a new agent config is needed.",
      taskConfig:
        "There is no existing task config that matches the requirement to generate a harvest or drying schedule considering field details, weather forecast, and equipment status. Therefore, a new task config needs to be created.",
      taskRun: `The task config for generating a harvest or drying schedule exists, and the input can be completed using non-dependent fields.`,
    },
    {
      no: 6,
      agentConfig:
        "The task requires generating a human-readable timeline with equipment assignments and contingency plans based on a harvest schedule and weather forecast. This task is distinct from existing agent configurations and relies on LLM capabilities to interpret and format the data into a coherent plan. No existing agent config matches this specific task, and the available tools do not cover this functionality.",
      taskConfig:
        "The task requires generating a human-readable timeline with equipment assignments and contingency plans based on a given harvest schedule and weather forecast. This aligns with the existing agent type `timeline_report_generator`, but there is no existing task config for this specific task. Therefore, a new task config needs to be created.",
      taskRun: `The task config for generating a harvest or drying schedule exists, and the input can be completed using non-dependent fields.`,
    },
  ],
} satisfies ChoiceExplanations;

const requestHandlerOutput = `{
  "requestType": "smart_farm_harvest_planning",
  "primaryGoal": "Create a wheat-harvest schedule for South Field that adapts to potential heavy rain",
  "userParameters": {
    "field": "South Field",
    "crop": "wheat",
    "timeframe": "tomorrow",
    "fallbackMode": "grain-dryer if rain > threshold"
  },
  "requiredComponents": [
    "retrieve 24-h weather forecast for field coordinates",
    "check operational readiness of harvesters, drones and grain dryers",
    "generate harvest or drying schedule that meets moisture limits",
    "produce human-readable timeline with equipment assignments"
  ],
  "expectedDeliverables": "Final harvest-day plan including timeline, equipment list, and rain contingency"
}`;

const fixtures = new WorkflowComposeFixture(
  title,
  prompt,
  choiceExplanations,
  requestHandlerOutput,
  taskStepsFixtures,
  toolsFixtures,
  agentsFixtures,
  tasksFixtures,
  taskRunsFixtures,
);

export default fixtures;
