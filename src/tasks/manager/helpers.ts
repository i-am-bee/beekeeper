import { TaskRun } from "./dto.js";

export function taskRunOutput(taskRun: TaskRun, checkTerminalStatus = true) {
  const record = taskRun.history.at(-1);
  if (
    !record ||
    (checkTerminalStatus && record.terminalStatus !== "COMPLETED")
  ) {
    throw new Error(
      `Missing completed record of taskRunId:${taskRun.taskRunId}`
    );
  }
  const output = record.output;
  if (!output) {
    throw new Error(
      `Missing output on completed record of taskRunId:${taskRun.taskRunId}`
    );
  }
  return String(output);
}

export function taskRunInteractionResponse(taskRun: TaskRun) {
  if (taskRun.taskRunKind != "interaction") {
    throw new Error(
      `Can't get interaction response from \`${taskRun.taskRunKind}\` kind of task run: ${taskRun.taskRunId} `
    );
  }

  if (taskRun.interactionStatus != "COMPLETED") {
    throw new Error(
      `Can't get interaction response from uncompleted task run: ${taskRun.taskRunId} `
    );
  }

  const response = taskRun.response;
  if (!response) {
    throw new Error(
      `Missing response on completed task run interaction:${taskRun.taskRunId}`
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
      `Missing error on failed record of taskRunId:${taskRun.taskRunId}`
    );
  }
  return error;
}
