import { AssistantMessage, ToolMessage } from "beeai-framework/backend/message";
import { TaskRun, TaskRunTrajectoryEntry } from "./dto.js";
import { v4 as uuidv4 } from "uuid";

export function taskRunOutput(taskRun: TaskRun, checkTerminalStatus = true) {
  const record = taskRun.history.at(-1);
  if (
    !record ||
    (checkTerminalStatus && record.terminalStatus !== "COMPLETED")
  ) {
    throw new Error(
      `Missing completed record of taskRunId:${taskRun.taskRunId}`,
    );
  }
  const output = record.output;
  if (!output) {
    throw new Error(
      `Missing output on completed record of taskRunId:${taskRun.taskRunId}`,
    );
  }
  return String(output);
}

export function taskRunInteractionResponse(taskRun: TaskRun) {
  if (taskRun.taskRunKind != "interaction") {
    throw new Error(
      `Can't get interaction response from \`${taskRun.taskRunKind}\` kind of task run: ${taskRun.taskRunId} `,
    );
  }

  if (taskRun.interactionStatus != "COMPLETED") {
    throw new Error(
      `Can't get interaction response from uncompleted task run: ${taskRun.taskRunId} `,
    );
  }

  const response = taskRun.response;
  if (!response) {
    throw new Error(
      `Missing response on completed task run interaction:${taskRun.taskRunId}`,
    );
  }

  return String(taskRun.response);
}

export function taskRunError(taskRun: TaskRun) {
  const record = taskRun.history.at(-1);
  if (!record || record.terminalStatus !== "FAILED") {
    throw new Error(`Missing failed record of taskRunId:${taskRun.taskRunId}`);
  }
  const error = record.error;
  if (!error) {
    throw new Error(
      `Missing error on failed record of taskRunId:${taskRun.taskRunId}`,
    );
  }
  return error;
}

const TASK_INPUT_DELIMITER = "This is your input for this task:";
const BLOCKING_TASKS_INPUT_DELIMITER =
  "This is the output from blocking tasks:";
const BLOCKING_TASK_OUTPUT_PLACEHOLDER = "${blocking_task_output}";

interface TaskRunInput {
  context: string;
  input?: string;
  options: {
    hasUnfinishedBlockingTasks: boolean;
    blockingTasksOutputs?: string;
  };
}

export function serializeTaskRunInput({
  context,
  input,
  options: { hasUnfinishedBlockingTasks, blockingTasksOutputs },
}: TaskRunInput): string {
  let inputPart = "";
  if (input?.length) {
    inputPart += `\n\n${TASK_INPUT_DELIMITER}\n${input}`;
  }

  let blockingPart = "";
  if (hasUnfinishedBlockingTasks || blockingTasksOutputs) {
    blockingPart += `\n\n${BLOCKING_TASKS_INPUT_DELIMITER}\n`;
    if (blockingTasksOutputs) {
      blockingPart += blockingTasksOutputs;
    }
    if (hasUnfinishedBlockingTasks) {
      blockingPart += `${blockingTasksOutputs ? "\n\n" : ""}${BLOCKING_TASK_OUTPUT_PLACEHOLDER}`;
    }
  }

  return `${context}${inputPart}${blockingPart}`;
}

export function deserializeTaskRunInput(input: string): TaskRunInput {
  const hasInput = input.includes(TASK_INPUT_DELIMITER);
  const hasBlockingTaskInput = input.includes(BLOCKING_TASKS_INPUT_DELIMITER);

  if (!hasInput && !hasBlockingTaskInput) {
    return {
      context: input,
      options: {
        hasUnfinishedBlockingTasks: false,
      },
    };
  }

  if (hasInput) {
    const [context, ...rest] = input.split(TASK_INPUT_DELIMITER);
    const sanitized = rest.join("").trim();

    if (!hasBlockingTaskInput) {
      return {
        context: context.trim(),
        input: sanitized.length ? sanitized : undefined,
        options: {
          hasUnfinishedBlockingTasks: false,
        },
      };
    } else {
      // Continue
    }
  }

  if (hasBlockingTaskInput) {
    const [context, ...rest] = input.split(BLOCKING_TASKS_INPUT_DELIMITER);
    let sanitized = rest.join("").trim();
    const hasUnfinishedBlockingTasks = sanitized.endsWith(
      BLOCKING_TASK_OUTPUT_PLACEHOLDER,
    );
    if (hasUnfinishedBlockingTasks) {
      sanitized = sanitized.split(BLOCKING_TASK_OUTPUT_PLACEHOLDER)[0].trim();
    }

    const options = {
      hasUnfinishedBlockingTasks,
    } as TaskRunInput["options"];
    if (sanitized.length) {
      options.blockingTasksOutputs = sanitized;
    }

    if (!hasInput) {
      return {
        context: context.trim(),
        options,
      };
    } else {
      const [realContext, ...rest] = context.split(TASK_INPUT_DELIMITER);
      const sanitizedInput = rest.join("").trim();
      return {
        context: realContext.trim(),
        input: sanitizedInput.length ? sanitizedInput : undefined,
        options,
      };
    }
  }

  throw new Error(`Unreachable combination`);
}

export function extendBlockingTaskRunOutput(
  existingTaskRunInput: string,
  blockingTaskRunOutput: string,
  hasUnfinishedBlockingTasks: boolean,
) {
  const {
    context,
    input,
    options: { blockingTasksOutputs },
  } = deserializeTaskRunInput(existingTaskRunInput);

  return serializeTaskRunInput({
    context,
    input,
    options: {
      hasUnfinishedBlockingTasks,
      blockingTasksOutputs: `${blockingTasksOutputs ? `${blockingTasksOutputs}\n\n` : ""}${blockingTaskRunOutput}`,
    },
  });
}

interface TextPart {
  type: "text";
  /**
The text content.
   */
  text: string;
}

/**
Tool call content part of a prompt. It contains a tool call (usually generated by the AI model).
 */
interface ToolCallPart {
  type: "tool-call";
  /**
ID of the tool call. This ID is used to match the tool call with the tool result.
 */
  toolCallId: string;
  /**
Name of the tool that is being called.
 */
  toolName: string;
  /**
Arguments of the tool call. This is a JSON-serializable object that matches the tool's input schema.
   */
  args: unknown;
}

/**
Tool result content part of a prompt. It contains the result of the tool call with the matching ID.
 */
interface ToolResultPart {
  type: "tool-result";
  /**
  ID of the tool call that this result is associated with.
   */
  toolCallId: string;
  /**
  Name of the tool that generated this result.
    */
  toolName: string;
  /**
  Result of the tool call. This is a JSON-serializable object.
     */
  result: unknown;
  /**
  Optional flag if the result is an error or an error message.
     */
  isError?: boolean;
}

/**
 * Aggregates trajectory entries into AssistantMessage or ToolMessage objects
 * @param entries Array of trajectory entries to aggregate
 * @returns Array of assembled messages (AssistantMessage or ToolMessage)
 */
export function aggregateTrajectoryEntries(
  entries: (TaskRunTrajectoryEntry | { key: string; value: string })[],
): (AssistantMessage | ToolMessage)[] {
  if (!entries.length) {
    return [];
  }

  const messages: (AssistantMessage | ToolMessage)[] = [];

  // We'll use these variables to track the current message being built
  let currentAssistantContent: (TextPart | ToolCallPart)[] = [];

  // Track all pending tool calls that need responses
  const pendingToolCalls = new Map<
    string,
    { toolName: string; toolCallId: string }
  >();

  // Process entries in sequence
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const nextEntry = i + 1 < entries.length ? entries[i + 1] : null;

    switch (entry.key) {
      case "thought": {
        // Thoughts are text parts in assistant messages
        if (currentAssistantContent.length === 0 || i === 0) {
          // Start a new assistant message if needed
          currentAssistantContent = [];
        }

        const textPart = { type: "text", text: entry.value } satisfies TextPart;
        currentAssistantContent.push(textPart);
        break;
      }

      case "tool_name": {
        // A tool name indicates the start of a tool call
        // Just store it for now, we'll use it when we see tool_input
        const toolCallId = uuidv4(); // Generate a new ID for this tool call
        pendingToolCalls.set(toolCallId, {
          toolName: entry.value,
          toolCallId,
        });
        break;
      }

      case "tool_input": {
        // Process tool_input with a lookahead for tool_output
        const isFollowedByToolOutput =
          nextEntry && nextEntry.key === "tool_output";

        // Get the most recent pending tool call
        const pendingIds = Array.from(pendingToolCalls.keys());
        if (pendingIds.length === 0) {
          break;
        }

        const toolCallId = pendingIds[pendingIds.length - 1];
        const pendingCall = pendingToolCalls.get(toolCallId);

        if (!pendingCall) {
          break;
        }

        // Parse tool input
        let toolInputJson: unknown;
        try {
          toolInputJson = JSON.parse(entry.value);
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (e) {
          // If parsing fails, use the raw string
          toolInputJson = entry.value;
        }

        // Create a tool call part
        const toolCallPart = {
          type: "tool-call",
          toolCallId: pendingCall.toolCallId,
          toolName: pendingCall.toolName,
          args: toolInputJson,
        } satisfies ToolCallPart;

        if (currentAssistantContent.length === 0) {
          // Start a new assistant message if needed
          currentAssistantContent = [];
        }

        currentAssistantContent.push(toolCallPart);

        // IMPORTANT: Don't finalize the assistant message yet if there's a tool_output coming next
        if (!isFollowedByToolOutput) {
          if (currentAssistantContent.length > 0) {
            messages.push(new AssistantMessage(currentAssistantContent));
            currentAssistantContent = [];
          }
        }
        break;
      }

      case "tool_output": {
        // First, ensure the assistant message with the tool call is finalized
        if (
          currentAssistantContent.some((part) => part.type === "tool-call") &&
          currentAssistantContent.length > 0
        ) {
          messages.push(new AssistantMessage(currentAssistantContent));
          currentAssistantContent = [];
        }

        // Find the matching tool call for this output
        const pendingIds = Array.from(pendingToolCalls.keys());
        if (pendingIds.length === 0) {
          // No pending tool calls, skip
          break;
        }

        // Get the oldest pending call (FIFO)
        const toolCallId = pendingIds[0];
        const pendingCall = pendingToolCalls.get(toolCallId);

        if (!pendingCall) {
          break;
        }

        // Parse tool output
        let outputValue: unknown;
        try {
          outputValue = JSON.parse(entry.value);
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (e) {
          // If parsing fails, use the raw string
          outputValue = entry.value;
        }

        // Create a tool result part
        const toolResultPart = {
          type: "tool-result",
          toolCallId: pendingCall.toolCallId,
          toolName: pendingCall.toolName,
          result: outputValue,
        } satisfies ToolResultPart;

        // Create a tool message
        const toolMessage = new ToolMessage(toolResultPart);
        messages.push(toolMessage);

        // Remove this call from pending
        pendingToolCalls.delete(toolCallId);
        break;
      }

      case "response":
      case "final_answer": {
        // First check if we have pending tool calls that need to be finalized
        if (
          currentAssistantContent.some((part) => part.type === "tool-call") &&
          currentAssistantContent.length > 0
        ) {
          messages.push(new AssistantMessage(currentAssistantContent));
          currentAssistantContent = [];
        }

        // Final answer is a text part in an assistant message
        const textPart = { type: "text", text: entry.value } satisfies TextPart;

        if (currentAssistantContent.length === 0) {
          // Start a new assistant message if needed
          currentAssistantContent = [];
        }

        currentAssistantContent.push(textPart);

        // Finish the assistant message
        if (currentAssistantContent.length > 0) {
          messages.push(new AssistantMessage(currentAssistantContent));
          currentAssistantContent = [];
        }
        break;
      }
    }
  }

  // Handle any remaining assistant content
  if (currentAssistantContent.length > 0) {
    messages.push(new AssistantMessage(currentAssistantContent));
  }

  // Log warning if there are still pending tool calls without responses
  if (pendingToolCalls.size > 0) {
    console.warn(
      `Warning: ${pendingToolCalls.size} tool calls did not have matching tool outputs`,
    );
  }

  return messages;
}
