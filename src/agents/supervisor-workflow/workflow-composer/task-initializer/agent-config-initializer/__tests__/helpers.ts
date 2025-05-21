import { getChatLLM } from "@/helpers/llm.js";
import * as laml from "@/laml/index.js";
import { generateMatrixTests } from "@test/test-matrix/generate-matrix-tests.js";
import { TestMatrix } from "@test/test-matrix/test-matrix.js";
import { TestCase } from "@test/test-matrix/types.js";
import { Logger } from "beeai-framework";
import { AgentConfigInitializer } from "../agent-config-initializer.js";
import { AgentAvailableTool, AgentConfigMinimal } from "../dto.js";
import { protocol } from "../protocol.js";

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
const llmCall = new AgentConfigInitializer(logger, "supervisor:boss[1]:1");

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
