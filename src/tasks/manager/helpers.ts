import { TaskKindEnum, TaskRun } from "./dto.js";

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

const TASK_INPUT_DELIMITER = ">>> Input:";
const BLOCKING_TASKS_INPUT_DELIMITER = ">>> Data:";
const BLOCKING_TASK_OUTPUT_PLACEHOLDER = "${blocking_task_output}";

interface TaskRunInput {
  context: string;
  input?: string;
  options: {
    hasUnfinishedBlockingTasks: boolean;
    blockingTasksOutputs?: string;
  };
}

export function serializeTaskRunInput(
  {
    context,
    input,
    options: { hasUnfinishedBlockingTasks, blockingTasksOutputs },
  }: TaskRunInput,
  taskKind: TaskKindEnum = "operator",
): string {
  if (taskKind === "supervisor") {
    // Workflow receives plain input
    return input ?? "";
  }

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
  taskKind: TaskKindEnum = "operator",
) {
  const {
    context,
    input,
    options: { blockingTasksOutputs },
  } = deserializeTaskRunInput(existingTaskRunInput);

  return serializeTaskRunInput(
    {
      context,
      input,
      options: {
        hasUnfinishedBlockingTasks,
        blockingTasksOutputs: `${blockingTasksOutputs ? `${blockingTasksOutputs}\n\n` : ""}${blockingTaskRunOutput}`,
      },
    },
    taskKind,
  );
}
