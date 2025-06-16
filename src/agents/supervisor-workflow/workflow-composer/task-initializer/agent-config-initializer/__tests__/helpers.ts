import { AgentAvailableTool } from "@/agents/supervisor-workflow/dto.js";
import { AgentConfigMinimal } from "../dto.js";
import { protocol } from "../protocol.js";
import * as laml from "@/laml/index.js";
import { generateMatrixTests } from "@test/test-matrix/generate-matrix-tests.js";
import { Logger } from "beeai-framework";
import { getChatLLM } from "@/helpers/llm.js";
import { AgentConfigInitializer } from "../agent-config-initializer.js";
import { TestMatrix } from "@test/test-matrix/test-matrix.js";
import { TestCase } from "@test/test-matrix/types.js";

export type AgentCase = TestCase<
  string,
  Partial<laml.ProtocolResult<typeof protocol>>,
  {
    availableTools?: AgentAvailableTool[];
    existingAgentConfigs?: AgentConfigMinimal[];
  },
  laml.ProtocolResult<typeof protocol>
>;

const logger = Logger.root.child({ name: "agent-config-tests" });
const llm = getChatLLM("supervisor");
const llmCall = new AgentConfigInitializer(logger);

export function runMatrix(matrix: TestMatrix<any, AgentCase>) {
  generateMatrixTests({
    matrix,
    llm,
    llmCall,
    mapCaseToInput: ({ input, data: meta }) => ({
      task: input,
      availableTools: meta?.availableTools ?? [],
      existingAgentConfigs: meta?.existingAgentConfigs ?? [],
    }),
  });
}
