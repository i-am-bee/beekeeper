import { RuntimeOutput } from "@/runtime/index.js";
import { Runtime, RuntimeOutputMethod } from "@/runtime/runtime.js";

/**
 * A handler class for runtime operations in the chat monitor
 */
export class ChatRuntimeHandler {
  private runtime: Runtime;
  private abortController: AbortController;

  // Callback for handling messages
  private onMessageCallback: (role: string, content: string) => void;
  // Callback for status updates
  private onStatusCallback: (status: string) => void;
  // Callback for state changes
  private onStateChangeCallback: (isProcessing: boolean) => void;

  constructor(
    runtime: Runtime,
    {
      onMessage,
      onStatus,
      onStateChange,
    }: {
      onMessage: (role: string, content: string) => void;
      onStatus: (status: string) => void;
      onStateChange: (isProcessing: boolean) => void;
    },
  ) {
    this.runtime = runtime;
    this.abortController = new AbortController();

    this.onMessageCallback = onMessage;
    this.onStatusCallback = onStatus;
    this.onStateChangeCallback = onStateChange;
  }

  /**
   * Send a message to the runtime
   */
  public async sendMessage(message: string): Promise<void> {
    // Create a new AbortController for this operation
    this.abortController = new AbortController();

    // Signal state change
    this.onStateChangeCallback(true);

    try {
      // Update status
      this.onStatusCallback("Sending message to runtime...");

      // Define output method to handle runtime responses
      const outputMethod: RuntimeOutputMethod = async (
        output: RuntimeOutput,
      ) => {
        if (output.kind === "progress") {
          const prefix = output.agent
            ? `🤖 [${output.agent.agentId}]`
            : `📋 [${output.taskRun.taskRunId}]`;

          this.onMessageCallback(prefix, output.text);
        } else if (output.kind === "final") {
          const prefix = output.agent
            ? `🤖 [${output.agent.agentId}]`
            : `📋 [${output.taskRun.taskRunId}]`;

          this.onMessageCallback(prefix, output.text);
          this.onStatusCallback("Response complete");
        }
      };

      // Run the runtime with the user message
      await this.runtime.run(
        message,
        outputMethod,
        this.abortController.signal,
      );
    } catch (error) {
      if (error instanceof Error) {
        this.onStatusCallback(`Error: ${error.message}`);
        this.onMessageCallback("System", `Error: ${error.message}`);
      } else {
        this.onStatusCallback(`Unknown error occurred`);
        this.onMessageCallback("System", "An unknown error occurred");
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
    this.onMessageCallback("System", "Operation aborted by user");
  }
}
