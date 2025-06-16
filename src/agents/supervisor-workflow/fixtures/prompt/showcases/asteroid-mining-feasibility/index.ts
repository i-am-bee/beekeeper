import {
  ChoiceExplanations,
  WorkflowComposeFixture,
} from "../../../base/workflow-compose-fixtures.js";
import agentsFixtures from "./agent-config.js";
import tasksFixtures from "./task-config.js";
import taskStepsFixtures from "./task-step.js";
import taskRunsFixtures from "./task-run.js";
import toolsFixtures from "./tools.js";

const title = `Asteroid Mining Feasibility Study for Asteroid 433-Eros`;

const prompt = `For our space venture proposal, I want to streamline our asteroid assessment process for Asteroid 433-Eros - analyze mineral composition data, cross-reference orbital mechanics calculations, then have something compile a mining viability report that combines all the technical findings.`;

const choiceExplanations = {
  requestHandler: `The request involves a multi-step process that includes analyzing data, cross-referencing calculations, and compiling a report, which requires orchestration by downstream planning/execution modules.`,
  problemDecomposer: `The problem is logically consistent and can be solved using the available tools. Each subtask can be addressed with the provided tools, and the necessary inputs are either given or can be assumed.`,
  steps: [
    {
      no: 1,
      agentConfig: `The task requires analyzing the mineral composition of an asteroid using the spectral_composition_analyzer_api, which is available in the list of tools. There is no existing agent config, so a new agent config needs to be created to handle this task.`,
      taskConfig: `The task requires analyzing the mineral composition of an asteroid using spectroscopic data, which aligns with the capabilities of the existing agent config. Since there are no existing task configs, a new task config needs to be created.`,
      taskRun: `The task config "analyze_asteroid_mineral_composition" exists, and the input can be completed using the non-dependent fields provided in the task step.`,
    },
    {
      no: 2,
      agentConfig: `The task requires cross-referencing mineral composition data with orbital mechanics calculations, which aligns with the capabilities of the \`orbital_mechanics_calculator_api\`. This task does not fit the existing agent's purpose, which is focused solely on analyzing mineral composition. Therefore, a new agent config is needed to handle this specific cross-referencing task using the available tool.`,
      taskConfig: ` The task requires cross-referencing mineral composition data with orbital mechanics calculations, which aligns with the purpose of the existing agent config "asteroid_mission_planner". There is no existing task config for this specific task, so a new task config needs to be created.`,
      taskRun: `The task config for cross-referencing mineral composition with orbital mechanics exists, and the input can be completed using the non-dependent field "asteroid_id" provided in the task step.`,
    },
    {
      no: 3,
      agentConfig: `The task involves compiling a mining viability report by integrating technical findings from mineral analysis and orbital mechanics. This task can be accomplished using LLM capabilities for text processing, analysis, and report generation without the need for external tools.`,
      taskConfig: `The task requires compiling a mining viability report by integrating mineral composition data and cross-referenced orbital mechanics data. This matches the purpose of the existing agent type 'mining_viability_report_compiler', but there is no existing task config for this purpose. Therefore, a new task config needs to be created.`,
      taskRun: `The task config for "compile_mining_viability_report" exists, and the input can be completed using non-dependent fields. The inputs required for the task run are marked as [from Step X], which will be automatically filled by the runtime engine.`,
    },   
  ],
} satisfies ChoiceExplanations;

export const requestHandlerOutput = `{
  "requestType": "Asteroid Assessment Process",
  "primaryGoal": "Streamline the assessment process for Asteroid 433-Eros to determine mining viability.",
  "parameters": {
    "asteroid": "433-Eros"
  },
  "subTasks": [
    "Analyze the mineral composition data of Asteroid 433-Eros.",
    "Cross-reference the mineral composition findings with orbital mechanics calculations.",
    "Compile a mining viability report that integrates the technical findings from the mineral analysis and orbital mechanics."
  ],
  "expectedDeliverables": [
    "A detailed report on the mineral composition of Asteroid 433-Eros.",
    "A set of cross-referenced data between mineral composition and orbital mechanics.",
    "A comprehensive mining viability report for Asteroid 433-Eros."
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

