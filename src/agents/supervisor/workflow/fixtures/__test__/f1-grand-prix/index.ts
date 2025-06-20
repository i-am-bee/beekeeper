import agentsFixtures from "./agent-config.js";
import tasksFixtures from "./task-config.js";
import taskStepsFixtures from "./task-step.js";
import taskRunsFixtures from "./task-run.js";
import toolsFixtures from "./tools.js";
import {
  ChoiceExplanations,
  WorkflowComposeFixture,
} from "../../base/workflow-compose-fixtures.js";

const title = `List Last 2 Grands Prix of Last F1 Season`;

const prompt = `Can you list last 2 grands prix of last F1 season?`;

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

export const requestHandlerOutput = `{
    "requestType": "sports_info",
    "primaryGoal": "List the last 2 Grands Prix of the last F1 season",
    "userParameters": {
        "sport": "F1",
        "season": "Last",
        "events": "last 2 Grands Prix"
    },
    "requiredComponents": [
        "identify the last F1 season",
        "retrieve the schedule of the last F1 season",
        "extract the last 2 Grands Prix"
    ],
    "expectedDeliverables": "Names and dates of the last 2 Grands Prix of the last F1 season"
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
