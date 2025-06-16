import { AgentConfigTiny } from "@/agents/supervisor-workflow/workflow-composer/task-initializer/agent-config-initializer/dto.js";
// import toolsFixtures from "./tools.js";
import { createFixtures } from "../../../base/fixtures.js";
import { addAgentConfigMissingAttrs } from "../../../helpers/add-missing-config-attrs.js";

// type ToolName = FixtureName<typeof toolsFixtures>;

const ENTRIES = [
    //   {
  //   agentType: "TBD",
  //   description:
  //     "TBD",
  //   instructions: `TBD`,
  //   tools: [] as const satisfies ToolName[],
  // },
] as const satisfies AgentConfigTiny[];

export default createFixtures(
  addAgentConfigMissingAttrs(ENTRIES),
  ({ agentType }) => agentType,
);
