import "dotenv/config";
import { FrameworkError } from "beeai-framework";
import { createConsoleReader } from "./helpers/reader.js";
import { createRuntime } from "@/runtime/factory.js";
import { RuntimeOutputMethod } from "@/runtime/runtime.js";

const args = process.argv.slice(2);
const workspace = args[0] && args[0].length ? args[0] : undefined;
const restoreWorkspace = !!workspace;

const reader = createConsoleReader({
  fallback: "What is the current weather in Las Vegas?",
});
const runtime = await createRuntime({
  workspace,
  switches: {
    agentRegistry: { restoration: restoreWorkspace },
    taskManager: { restoration: restoreWorkspace },
  },
  outputDirPath: "./output",
});

const output: RuntimeOutputMethod = async (output) => {
  let role;
  if (output.agent) {
    role = `🤖 [${output.agent.agentId}] `;
  } else {
    role = `📋 [${output.taskRun.taskRunId}] `;
  }

  // reader.write(`Agent 🤖 :`, response.result.text);
  reader.write(role, output.text);
};

for await (const { prompt } of reader) {
  try {
    await runtime.run(prompt, output);
  } catch (error) {
    reader.write(`Error`, FrameworkError.ensure(error).dump());
  }
}
