import { createRuntime } from "@/runtime/factory.js";
import { RuntimeOutputMethod } from "@/runtime/runtime.js";
import { FrameworkError, Logger, LoggerLevelType } from "beeai-framework";
import "dotenv/config";
import path from "node:path";
import { parse } from "ts-command-line-args";
import { createConsoleReader } from "./helpers/reader.js";
import { ChatMonitor } from "./ui/chat-monitor/chat-monitor.js";
import { createWriteStream } from "node:fs";
import { ensureDirectoryExistsSafe } from "./utils/file.js";
import { getEnv } from "beeai-framework/internals/env";

// Parse command line arguments
const { chat: useChatMonitor, workspace } = parse<CLIArguments>({
  chat: { type: Boolean, alias: "c", optional: true },
  workspace: { type: String, alias: "w", optional: true },
});
const restoreWorkspace = !!workspace;

const OUTPUT_DIR = "./output";

const logger = useChatMonitor
  ? new Logger(
      {
        name: "app",
        level: (getEnv("BEE_FRAMEWORK_LOG_LEVEL") as LoggerLevelType) || "info",
      },
      Logger.createRaw(
        {},
        createWriteStream(
          path.join(
            ensureDirectoryExistsSafe(".", path.join(OUTPUT_DIR, "logs")),
            "app.log",
          ),
          {
            flags: "w",
          },
        ),
      ),
    )
  : Logger.root.child({ name: "app" });

let abortController: AbortController;

interface CLIArguments {
  workspace?: string;
  chat?: boolean;
}

async function shutdown(signal?: string) {
  logger.info(
    `\nReceived ${signal || "shutdown"} signal. Starting graceful shutdown...`,
  );

  // Set a timeout to force exit if graceful shutdown takes too long
  const forceExitTimeout = setTimeout(() => {
    logger.error("Forcing exit after timeout");
    process.exit(1);
  }, 60 * 1000); // 1 minute

  try {
    // Abort any ongoing operations
    if (abortController && !abortController.signal.aborted) {
      abortController.abort("shutdown requested");
      logger.info("Aborted ongoing operations");
    }

    clearTimeout(forceExitTimeout);
    logger.info("Graceful shutdown completed");
    process.exit(0);
  } catch (error) {
    logger.error("Error during graceful shutdown:", error);
    clearTimeout(forceExitTimeout);
    process.exit(1);
  }
}

async function main() {
  // Create abort controller with a long timeout
  abortController = new AbortController();

  // Create runtime
  const runtime = await createRuntime({
    workspace,
    switches: {
      agentRegistry: { restoration: restoreWorkspace },
      taskManager: { restoration: restoreWorkspace },
    },
    outputDirPath: OUTPUT_DIR,
    signal: abortController.signal,
    logger,
  });

  // Use chat monitor UI if specified
  if (useChatMonitor) {
    // Create a write stream to a log file
    const chatMonitor = new ChatMonitor(
      { kind: "screen", title: "Runtime Chat Interface" },
      runtime,
      logger,
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
        await runtime.run(prompt, output, abortController.signal);
      } catch (error) {
        reader.write(`Error`, FrameworkError.ensure(error).dump());
      }
    }
  }
}

process.on("SIGINT", () => shutdown("SIGINT")); // Ctrl+C
process.on("SIGTERM", () => shutdown("SIGTERM")); // Docker stop, etc.

// Handle uncaught errors
process.on("uncaughtException", (error) => {
  logger.error(error, "Uncaught Exception:");
  shutdown("UncaughtException");
});

process.on("unhandledRejection", (error) => {
  logger.error(error, "Unhandled rejection:");
  shutdown("UnhandledRejection");
});

// Override console.error to filter out unwanted messages in console-based UI
console.error = (...args) => {
  const error = args.join(" ");
  // Call original console.error for other messages
  logger.error(error, "Consoler error:");
};

// Run the application
main().catch((error) => {
  logger.error(error, "Application error:");
  process.exit(1);
});
