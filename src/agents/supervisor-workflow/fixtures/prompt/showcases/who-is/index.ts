import {
  ChoiceExplanations,
  WorkflowComposeFixture,
} from "../../../base/workflow-compose-fixtures.js";
import agentsFixtures from "./agent-config.js";
import tasksFixtures from "./task-config.js";
import taskStepsFixtures from "./task-step.js";
import taskRunsFixtures from "./task-run.js";
import toolsFixtures from "./tools.js";

const title = `TBD`;

const prompt = `TBD`;

const choiceExplanations = {
  requestHandler: `TBD`,
  problemDecomposer: `TBD`,
  steps: [
    {
      no: 1,
      agentConfig: `TBD`,
      taskConfig: `TBD`,
      taskRun: `TBD`,
    },
    {
      no: 2,
      agentConfig: `TBD`,
      taskConfig: `TBD`,
      taskRun: `TBD`,
    },
    {
      no: 3,
      agentConfig: `TBD`,
      taskConfig: `TBD`,
      taskRun: `TBD`,
    },
    {
      no: 4,
      agentConfig: `TBD`,
      taskConfig: `TBD`,
      taskRun: `TBD`,
    },
    {
      no: 5,
      agentConfig: `TBD`,
      taskConfig: `TBD`,
      taskRun: `TBD`,
    },
    {
      no: 6,
      agentConfig: `TBD`,
      taskConfig: `TBD`,
      taskRun: `TBD`,
    },
  ],
} satisfies ChoiceExplanations;

export const requestHandlerOutput = `TBD`;

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

