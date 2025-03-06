import "dotenv/config";
import { FrameworkError } from "beeai-framework";
import { createConsoleReader } from "./helpers/reader.js";
import { createRuntime } from "@/runtime/factory.js";
import { RuntimeOutputMethod } from "@/runtime/runtime.js";
import { ChatMonitor } from "./ui/chat-monitor/monitor.js";

async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const workspace = args[0] && args[0].length ? args[0] : undefined;
  const restoreWorkspace = !!workspace;
  const useChatMonitor = args.includes("--chat") || args.includes("-c");

  // Create abort controller with a long timeout
  const abortController = new AbortController();
  setTimeout(() => abortController.abort(), 30_000_000);

  // Create runtime
  const runtime = await createRuntime({
    workspace,
    switches: {
      agentRegistry: { restoration: restoreWorkspace },
      taskManager: { restoration: restoreWorkspace },
    },
    outputDirPath: "./output",
    signal: abortController.signal,
  });

  // Use chat monitor UI if specified
  if (useChatMonitor) {
    const chatMonitor = new ChatMonitor(
      { title: "Runtime Chat Interface" },
      runtime,
    );
    await chatMonitor.start();
  } else {
    // Otherwise use the console-based interface
    const reader = createConsoleReader({
      fallback: "What is the current weather in Las Vegas?",
    });

    const output: RuntimeOutputMethod = async (output) => {
      let role;
      if (output.agent) {
        role = `🤖 [${output.agent.agentId}] `;
      } else {
        role = `📋 [${output.taskRun.taskRunId}] `;
      }
      reader.write(role, output.text);
    };

    for await (const { prompt } of reader) {
      try {
        await runtime.run(prompt, output);
      } catch (error) {
        reader.write(`Error`, FrameworkError.ensure(error).dump());
      }
    }
  }
}

// Handle uncaught errors
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

// Run the application
main().catch((error) => {
  console.error("Application error:", error);
  process.exit(1);
});
