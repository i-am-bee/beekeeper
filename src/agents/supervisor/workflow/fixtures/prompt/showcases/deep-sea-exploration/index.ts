import {
  ChoiceExplanations,
  WorkflowComposeFixture,
} from "../../../base/workflow-compose-fixtures.js";
import agentsFixtures from "./agent-config.js";
import tasksFixtures from "./task-config.js";
import taskStepsFixtures from "./task-step.js";
import taskRunsFixtures from "./task-run.js";
import toolsFixtures from "./tools.js";

const title = "Deep-Sea Exploration and Marine Life Detection";

const prompt = `Evaluate 2 potential deep-sea exploration zones: Mariana Trench and Puerto Rico Trench. For each zone, conduct basic sonar mapping to identify underwater terrain features. After completing the terrain mapping, also evaluate these same 2 zones for marine life detection by conducting comprehensive sonar analysis that combines both terrain mapping and biological sonar capabilities. Generate an integrated comparison report with recommendations for deep-sea exploration priorities.`;

const choiceExplanations = {
  requestHandler: `The request involves an evolutionary workflow where basic sonar mapping capabilities are extended with biological detection, requiring the same sonar operator to gain additional tools and updated task parameters for comprehensive underwater analysis.`,
  problemDecomposer: `The problem is logically consistent and can be solved using the available tools. The task naturally evolves from basic terrain mapping to comprehensive sonar operations that combine terrain and biological detection capabilities.`,
  steps: [
    {
      no: 1,
      agentConfig: `The task requires conducting basic sonar mapping using the terrain_sonar_mapping_api tool, which is available in the list of tools. No existing agent config is available, so a new agent config needs to be created to handle this task.`,
      taskConfig: `There are no existing task configs that match the requirements for conducting sonar mapping in the Mariana Trench. Therefore, a new task config needs to be created.`,
      taskRun: `The task config "sonar_mapping_underwater_terrain" exists, and the input can be completed using the non-dependent fields provided in the task step.`,
    },
    {
      no: 2,
      agentConfig: `The existing agent config "underwater_terrain_mapper" already satisfies the new task as it is designed to conduct sonar mapping to identify underwater terrain features using the terrain_sonar_mapping_api. The input parameters and output structure match the agent's current capabilities, and no changes are needed.`,
      taskConfig: `The existing task config \`sonar_mapping_underwater_terrain\` already satisfies the requirements for conducting sonar mapping in the Puerto Rico Trench with the specified input parameters.`,
      taskRun: `The task config "sonar_mapping_underwater_terrain" exists, and the input can be completed using non-dependent fields provided in the task step.`,
    },
    {
      no: 3,
      agentConfig: `The task requires both terrain mapping and marine life detection, which involves using two tools: terrain_sonar_mapping_api and biological_sonar_detector_api. No existing agent config currently combines these functionalities, necessitating the creation of a new agent config.`,
      taskConfig: `The task of enhancing sonar mapping by including marine life detection alongside terrain analysis is not covered by any existing task config. The existing task config "sonar_mapping_underwater_terrain" only covers terrain analysis. Therefore, a new task config needs to be created to accommodate this requirement using the "integrated_sonar_mapper" agent.`,
      taskRun: `The task config "integrated_sonar_mapping" exists, and the input can be completed using non-dependent fields provided in the task step.`,
    },
    {
      no: 4,
      agentConfig: `The task of enhancing sonar mapping by including marine life detection alongside terrain analysis at the Puerto Rico Trench is identical in structure and tool requirements to the existing task handled by the \`integrated_sonar_mapper\` agent. This agent already uses both the \`terrain_sonar_mapping_api\` and \`biological_sonar_detector_api\` to perform comprehensive sonar mapping, which includes both terrain and biological analysis. Therefore, no changes are needed to the existing agent configuration.`,
      taskConfig: `The task of enhancing sonar mapping by including marine life detection alongside terrain analysis at the Puerto Rico Trench matches the existing task config for integrated sonar mapping. The task config input and description already cover the requirements for this task.`,
      taskRun: `The task config "integrated_sonar_mapping" exists, and the input can be completed using non-dependent fields provided in the task step.`,
    },
    {
      no: 5,
      agentConfig: `The task requires generating a comprehensive exploration report by integrating terrain and biological sonar data, comparing zones, and creating a structured report. This involves using multiple tools: sonar_data_integrator_api, zone_comparison_analyzer_api, and submarine_exploration_reporter_api. No existing agent config matches this specific combination of tools and task requirements, necessitating the creation of a new agent config.`,
      taskConfig: `The task requires generating a comprehensive comparison report using terrain and biological sonar data from multiple zones. The agent type "comprehensive_exploration_report_generator" is available, but there is no existing task config that matches this requirement. Therefore, a new task config needs to be created.`,
      taskRun: `The task config "generate_comprehensive_comparison_report" exists, and the input can be completed using non-dependent fields. The input "terrain and biological sonar data" is marked as [from Steps 3 and 4], so it will be automatically injected by the runtime engine.`,
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
  "requestType": "Deep-sea Exploration and Mapping",
  "primaryGoal": "Conduct comprehensive sonar operations combining terrain mapping and marine life detection in the Mariana Trench and Puerto Rico Trench.",
  "parameters": {
    "locations": ["Mariana Trench", "Puerto Rico Trench"],
    "technologies": ["terrain sonar mapping", "biological sonar detection", "integrated analysis"]
  },
  "subTasks": [
    "Conduct basic sonar mapping to identify underwater terrain features in the Mariana Trench.",
    "Conduct basic sonar mapping to identify underwater terrain features in the Puerto Rico Trench.",
    "Conduct comprehensive sonar analysis with marine life detection at Mariana Trench using both terrain and biological sonar capabilities.",
    "Conduct comprehensive sonar analysis with marine life detection at Puerto Rico Trench using both terrain and biological sonar capabilities.",
    "Generate comprehensive comparison report integrating terrain and biological data from both zones."
  ],
  "expectedDeliverables": [
    "Basic terrain sonar maps for both exploration zones.",
    "Comprehensive sonar analysis combining terrain and marine life data for both zones.",
    "Integrated comparison report with recommendations for deep-sea exploration priorities."
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
