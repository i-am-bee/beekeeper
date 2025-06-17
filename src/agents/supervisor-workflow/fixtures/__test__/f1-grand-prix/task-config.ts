import { TaskConfigMinimal } from "@/agents/supervisor-workflow/workflow-composer/task-initializer/task-config-initializer/dto.js";
import agentConfigFixtures from "./agent-config.js";
import { FixtureName, createFixtures } from "../../base/fixtures.js";
import { addTaskConfigMissingAttrs } from "../../helpers/add-missing-config-attrs.js";

type AgentType = FixtureName<typeof agentConfigFixtures>;
const ENTRIES = [
  {
    taskType: `TBD`,
    agentType: `TBD` satisfies AgentType,
    description: `TBD`,
    taskConfigInput: `TBD`,
  },
  {
    taskType: `TBD`,
    agentType: `TBD` satisfies AgentType,
    description: `TBD`,
    taskConfigInput: `TBD`,
  },
  {
    taskType: `TBD`,
    agentType: `TBD` satisfies AgentType,
    description: `TBD`,
    taskConfigInput: `TBD`,
  },
] as const satisfies TaskConfigMinimal[];

export default createFixtures(
  addTaskConfigMissingAttrs(ENTRIES),
  ({ taskType }) => taskType,
);
