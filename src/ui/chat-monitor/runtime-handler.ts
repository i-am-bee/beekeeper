import { RuntimeOutput } from "@/runtime/index.js";
import { Runtime, RuntimeOutputMethod } from "@/runtime/runtime.js";
import * as st from "../config.js";

export enum MessageTypeEnum {
  INPUT = "input",
  PROGRESS = "progress",
  FINAL = "final",
  ERROR = "error",
  ABORT = "abort",
  SYSTEM = "system",
}

/**
 * A handler class for runtime operations in the chat monitor
 */
export class ChatRuntimeHandler {
  private runtime: Runtime;

  // Callback for handling messages
  private onMessageCallback: (
    role: string,
    content: string,
    type: MessageTypeEnum,
  ) => void;
  // Callback for status updates
  private onStatusCallback: (status: string) => void;
  // Callback for state changes
  private onStateChangeCallback: (isProcessing: boolean) => void;
  private abortController: AbortController;

  get isRunning() {
    return this.runtime.isRunning;
  }

  constructor(
    runtime: Runtime,
    {
      onMessage,
      onStatus,
      onStateChange,
    }: {
      onMessage: (role: string, content: string, type: MessageTypeEnum) => void;
      onStatus: (status: string) => void;
      onStateChange: (isProcessing: boolean) => void;
    },
    abortController?: AbortController,
  ) {
    this.runtime = runtime;
    this.abortController = abortController ?? new AbortController();

    this.onMessageCallback = onMessage;
    this.onStatusCallback = onStatus;
    this.onStateChangeCallback = onStateChange;
  }

  /**
   * Send a message to the runtime
   */
  public async sendMessage(message: string): Promise<void> {
    // Signal state change
    this.onStateChangeCallback(true);

    try {
      // Update status
      this.onStatusCallback("Sending message to runtime...");

      // Define output method to handle runtime responses
      const outputMethod: RuntimeOutputMethod = async (
        output: RuntimeOutput,
      ) => {
        const prefix = output.agent
          ? st.agentId(output.agent)
          : st.taskRunId(output.taskRun);
        if (output.kind === "progress") {
          this.onMessageCallback(prefix, output.text, MessageTypeEnum.PROGRESS);
        } else if (output.kind === "final") {
          this.onMessageCallback(prefix, output.text, MessageTypeEnum.FINAL);
          this.onStatusCallback("Response complete");
        }
      };

      // Run the runtime with the user message
      await this.runtime.run(message, outputMethod);
    } catch (error) {
      if (error instanceof Error) {
        this.onStatusCallback(`Error: ${error.message}`);
      } else {
        this.onStatusCallback(`Unknown error occurred`);
      }
    } finally {
      // Signal state change back
      this.onStateChangeCallback(false);
    }
  }

  /**
   * Abort the current operation
   */
  public abort(): void {
    this.abortController.abort();
    this.onStatusCallback("Operation aborted by user");
  }
}
