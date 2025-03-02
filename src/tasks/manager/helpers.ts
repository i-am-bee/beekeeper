import { TaskRun } from "./dto.js";

export function taskRunOutput(taskRun: TaskRun) {
  const record = taskRun.history.at(-1);
  if (!record || record.terminalStatus !== "COMPLETED") {
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
