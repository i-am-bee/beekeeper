import "dotenv/config";
import { FrameworkError } from "beeai-framework";
import { createConsoleReader } from "./helpers/reader.js";
import { createBeeSupervisor } from "./index.js";

const args = process.argv.slice(2);
const workspace = args[0] && args[0].length ? args[0] : undefined;
const restoreWorkspace = !!workspace;

const reader = createConsoleReader({
  fallback: "What is the current weather in Las Vegas?",
});
const supervisorAgent = await createBeeSupervisor({
  workspace,
  switches: {
    agentRegistry: { restoration: restoreWorkspace },
    taskManager: { restoration: restoreWorkspace },
  },
  outputDirPath: "./output",
});
for await (const { prompt } of reader) {
  try {
    const response = await supervisorAgent
      .run(
        {
          prompt,
        },
        {
          execution: {
            maxIterations: 100,
            maxRetriesPerStep: 2,
            totalMaxRetries: 10,
          },
        },
      )
      .observe((emitter) => {
        emitter.on("update", (data, meta) => {
          reader.write(
            `${(meta.creator as any).input.meta.name} 🤖 (${data.update.key}) :`,
            data.update.value,
          );
        });
      });

    reader.write(`Agent 🤖 :`, response.result.text);
  } catch (error) {
    reader.write(`Error`, FrameworkError.ensure(error).dump());
  }
}
