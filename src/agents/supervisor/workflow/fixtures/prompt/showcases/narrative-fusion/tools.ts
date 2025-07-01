import { AgentAvailableTool } from "@/agents/supervisor/workflow/workflow-composer/helpers/resources/dto.js";
import { createFixtures } from "../../../base/fixtures.js";

const ENTRIES = [] as const satisfies AgentAvailableTool[];

export default createFixtures(ENTRIES, ({ toolName }) => toolName);
