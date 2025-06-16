import {
  ChoiceExplanations,
  WorkflowComposeFixture,
} from "../../../base/workflow-compose-fixtures.js";
import agentsFixtures from "./agent-config.js";
import tasksFixtures from "./task-config.js";
import taskStepsFixtures from "./task-step.js";
import taskRunsFixtures from "./task-run.js";
import toolsFixtures from "./tools.js";

const title = `Beekeeping and Butterfly Farming Site Analysis`;

const prompt =
  "Evaluate 2 potential beekeeping locations: Sunnybrook Farm, Meadowland Reserve. For each site, conduct thorough flora analysis for nectar sources including species identification, quality assessment, and environmental suitability factors. After completing the beekeeping analysis, also evaluate these same 2 locations for butterfly farming suitability using thorough analysis adapted for butterfly host plants and habitat requirements. Present results of both analyses in a structured report format, highlighting key findings and recommendations.";

const choiceExplanations = {
  requestHandler: "The request involves a multi-step analysis of two locations for both beekeeping and butterfly farming, requiring detailed evaluation of local flora and structured reporting. This complexity necessitates a composed workflow.",
  problemDecomposer: "The problem is logically consistent and solvable using available tools. The user defined 5 explicit subtasks, and each one is addressed by exactly one composed step that integrates the necessary tools.",
  steps: [
    {
      no: 1,
      agentConfig: "The task requires analyzing local flora for nectar sources suitable for beekeeping using specific tools. No existing agent config is available, so a new agent config needs to be created using the specified tools.",
      taskConfig: "There are no existing task configs that match the requirements, and the agent type is valid. Therefore, a new task config needs to be created.",
      taskRun: `The task config "analyze_flora_for_nectar_sources" exists, and the input can be completed using the non-dependent field "location" provided in the task step.`,
    },
    {
      no: 2,
      agentConfig: `The existing agent config "flora_nectar_analysis" already covers the task of analyzing local flora for nectar sources suitable for beekeeping using the specified tools: satellite_flora_scanner_api, ground_survey_validator_api, and pollinator_database_lookup_api. The task structure and tool requirements match the existing agent's capabilities, so no changes are needed.`,
      taskConfig: `The existing task config \`analyze_flora_for_nectar_sources\` already satisfies the user need to analyze local flora for nectar sources suitable for beekeeping. The task config input and description match the requirements of the new task.`,
      taskRun: `The task config "analyze_flora_for_nectar_sources" exists, and the input can be completed using the non-dependent field "location" provided in the task step.`,
    },
    {
      no: 3,
      agentConfig: `The existing agent config "flora_nectar_analysis" is focused on analyzing nectar sources for beekeeping, not specifically for butterfly host compatibility. The task requires analyzing local flora for butterfly host compatibility, which is a different objective. Therefore, a new agent config is needed to address this specific task using the specified tools.`,
      taskConfig: `There is no existing task config that analyzes local flora for nectar sources suitable for butterfly host plants. The existing task config focuses on nectar sources for beekeeping, which is a different purpose. Therefore, a new task config needs to be created.`,
      taskRun: `The task config "analyze_flora_for_nectar_sources" exists, and the input can be completed using the non-dependent field "location" provided in the task step.`,
    },
    {
      no: 4,
      agentConfig: `The task of evaluating Meadowland Reserve for butterfly farming suitability by analyzing local flora for butterfly host plants aligns with the existing agent config "flora_butterfly_host_analysis". The tools specified in the task (satellite_flora_scanner_api, ground_survey_validator_api, pollinator_database_lookup_api) are already part of this agent's toolset, and the output format matches the agent's purpose.`,
      taskConfig: `The task of analyzing local flora for butterfly host plants at Meadowland Reserve matches the existing task config for analyzing flora for butterfly host plants. The task config input and purpose align with the requested task.`,
      taskRun: `The task config "analyze_flora_for_butterfly_host_plants" exists, and the input can be completed using the non-dependent field "location" provided in the task step.`,
    },
    {
      no: 5,
      agentConfig: `The task requires compiling findings into a structured report using existing data from previous steps. The \`comparative_report_generator_api\` tool is available and suitable for generating structured comparison reports, which aligns with the task's requirements. No existing agent config directly matches this task, and the task involves a specific tool not currently associated with any existing agent. Therefore, creating a new agent config is appropriate.`,
      taskConfig: `The task requires compiling findings into a structured report using existing data from previous analyses. The agent type matches an existing agent config, but there is no existing task config for this specific task. Therefore, a new task config needs to be created.`,
      taskRun: `The task config for "compile_farming_suitability_report" exists, and the input parameters are entirely dependent on previous steps, which will be automatically injected by the runtime engine.`,
    },
    {
      no: 6,
      agentConfig: `TBD`,
      taskConfig: `TBD`,
      taskRun: `TBD`,
    },
  ],
} satisfies ChoiceExplanations;

export const requestHandlerOutput = `{
  "requestType": "Location Suitability Analysis",
  "primaryGoal": "Evaluate Sunnybrook Farm and Meadowland Reserve for beekeeping and butterfly farming suitability.",
  "parameters": {
    "locations": ["Sunnybrook Farm", "Meadowland Reserve"],
    "criteria": ["local flora for nectar sources", "local flora for butterfly host plants"]
  },
  "subTasks": [
    "Analyze local flora at Sunnybrook Farm for nectar sources suitable for beekeeping.",
    "Analyze local flora at Meadowland Reserve for nectar sources suitable for beekeeping.",
    "Evaluate Sunnybrook Farm for butterfly farming suitability by analyzing local flora for butterfly host plants.",
    "Evaluate Meadowland Reserve for butterfly farming suitability by analyzing local flora for butterfly host plants.",
    "Compile findings into a structured report, highlighting key findings and recommendations for beekeeping and butterfly farming at each site."
  ],
  "expectedDeliverables": [
    "Structured report with key findings and recommendations for beekeeping at Sunnybrook Farm and Meadowland Reserve.",
    "Structured report with key findings and recommendations for butterfly farming at Sunnybrook Farm and Meadowland Reserve."
  ]
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
