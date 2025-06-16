import { AgentAvailableTool } from "@/agents/supervisor-workflow/workflow-composer/task-initializer/agent-config-initializer/dto.js";
import { createFixtures } from "../../../base/fixtures.js";

const ENTRIES = [
    {
        toolName: `TBD`,
        description: `TBD`,
        toolInput: `TBD`
    },
    {
        toolName: `TBD`,
        description: `TBD`,
        toolInput: `TBD`
    },   
] as const satisfies AgentAvailableTool[];

export default createFixtures(ENTRIES, ({ toolName }) => toolName);
