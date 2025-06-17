import agentsFixtures from "./agent-config.js";
import toolsFixtures from "./tools.js";
import tasksFixtures from "./task-config.js";
import taskRunsFixtures from "./task-run.js";
import { TaskStepMapper } from "@/agents/supervisor-workflow/workflow-composer/helpers/task-step/task-step-mapper.js";
import { FixtureName, createFixtures } from "../../base/fixtures.js";
import {
  createResourceFixtures,
  TaskStepWithVariousResource,
} from "../../base/resource-fixtures.js";

type ToolName = FixtureName<typeof toolsFixtures>;

const ENTRIES = [
  {
    no: 1,
    step: `TBD`,
    ...TaskStepMapper.parseInputOutput(`input: TBD; output: TBD`),
    resource: createResourceFixtures(
      { type: "tools", tools: ["TBD"] as ToolName[] },
      { type: "agent", agent: agentsFixtures.get(`TBD`) },
      { type: "task", task: tasksFixtures.get(`TBD`) },
      {
        type: "task_run",
        taskRun: taskRunsFixtures.get("TBD_1"),
      },
    ),
  },
  {
    no: 2,
    step: `TBD`,
    ...TaskStepMapper.parseInputOutput(`input: TBD; output: TBD`),
    resource: createResourceFixtures(
      { type: "llm" },
      { type: "agent", agent: agentsFixtures.get(`TBD`) },
      { type: "task", task: tasksFixtures.get(`TBD`) },
      {
        type: "task_run",
        taskRun: taskRunsFixtures.get("TBD_1"),
      },
    ),
  },
] as const satisfies TaskStepWithVariousResource[];

const fixtures = createFixtures(ENTRIES, ({ step }) => step);
export default fixtures;
