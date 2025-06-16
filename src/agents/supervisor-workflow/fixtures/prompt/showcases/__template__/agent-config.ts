import { AgentConfigTiny } from "@/agents/supervisor-workflow/workflow-composer/task-initializer/agent-config-initializer/dto.js";
import { createFixtures, FixtureName } from "../../../base/fixtures.js";
import { addAgentConfigMissingAttrs } from "../../../helpers/add-missing-config-attrs.js";

import toolsFixtures from "./tools.js";
type ToolName = FixtureName<typeof toolsFixtures>;

const ENTRIES = [
  {
    agentType: `TBD`,
    description: `TBD`,
    instructions: `TBD`,
    tools: [] as const satisfies ToolName[],
  },
  {
    agentType: `TBD`,
    description: `TBD`,
    instructions: `TBD`,
    tools: [] as const satisfies ToolName[],
  },
  {
    agentType: `TBD`,
    description: `TBD`,
    instructions: `TBD`,
    tools: [] as const satisfies ToolName[],
  },
] as const satisfies AgentConfigTiny[];

export default createFixtures(
  addAgentConfigMissingAttrs(ENTRIES),
  ({ agentType }) => agentType,
);
