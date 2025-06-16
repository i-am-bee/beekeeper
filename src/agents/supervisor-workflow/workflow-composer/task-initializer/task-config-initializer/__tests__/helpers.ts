// import { getChatLLM } from "@/helpers/llm.js";
// import * as laml from "@/laml/index.js";
// import { generateMatrixTests } from "@test/test-matrix/generate-matrix-tests.js";
// import { TestMatrix, TestMatrixCell } from "@test/test-matrix/test-matrix.js";
// import { Logger } from "beeai-framework";
// import { ExistingTaskConfig } from "../dto.js";
// import { protocol } from "../protocol.js";
// import { TaskConfigInitializer } from "../task-config-initializer.js";
// import { ExistingAgentConfig } from "../../agent-config-initializer/dto.js";

// export type TaskCase = TestMatrixCell<
//   string,
//   Partial<laml.ProtocolResult<typeof protocol>>,
//   {
//     existingAgentConfigs?: ExistingAgentConfig[];
//     existingTaskConfigs?: ExistingTaskConfig[];
//   }
// >;

// const logger = Logger.root.child({ name: "task-config-tests" });
// const llm = getChatLLM("supervisor");
// const llmCall = new TaskConfigInitializer(logger);

// export function runMatrix(matrix: TestMatrix<TaskCase>) {
//   generateMatrixTests({
//     matrix,
//     llm,
//     llmCall,
//     mapCaseToInput: ({ input, data: meta }) => ({
//       task: input,
//       existingAgentConfigs: meta?.existingAgentConfigs ?? [],
//       existingTaskConfigs: meta?.existingTaskConfigs ?? [],
//     }),
//   });
// }
