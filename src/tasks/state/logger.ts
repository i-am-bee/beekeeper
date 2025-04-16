import { BaseStateLogger } from "../../base/state/base-state-logger.js";
import {
  AgentTypeRegisterEvent,
  TaskConfigCreateEvent,
  TaskConfigDestroyEvent,
  TaskConfigUpdateEvent,
  TaskEventKindEnum,
  TaskHistoryEntryCreateEvent,
  TaskPoolChangeEvent,
  TaskRunCreateEvent,
  TaskRunDestroyEvent,
  TaskRunUpdateEvent,
  TaskStateDataTypeSchema,
} from "./dto.js";

export const DEFAULT_NAME = "task_state";
export const DEFAULT_PATH = ["state"] as readonly string[];

export class TaskStateLogger extends BaseStateLogger<
  typeof TaskStateDataTypeSchema
> {
  private static instance?: TaskStateLogger;

  static init(logPath?: string) {
    if (this.instance) {
      throw new Error(`Task state logger is already initialized`);
    }
    this.instance = new TaskStateLogger(logPath);
    return this.instance;
  }

  static getInstance() {
    if (!this.instance) {
      throw new Error(`Task state logger wasn't initialized yet`);
    }
    return this.instance;
  }

  static dispose() {
    if (!this.instance) {
      throw new Error(
        `Task state logger doesn't exists there is nothing to dispose`,
      );
    }
    this.instance = undefined;
  }

  constructor(logPath?: string) {
    super(DEFAULT_PATH, DEFAULT_NAME, logPath);
  }

  public logAgentTypeRegister(data: Omit<AgentTypeRegisterEvent, "kind">) {
    this.logUpdate({
      data: {
        kind: TaskEventKindEnum.Values.agent_type_register,
        ...data,
      },
    });
  }

  public logTaskConfigCreate(data: Omit<TaskConfigCreateEvent, "kind">) {
    this.logUpdate({
      data: {
        kind: TaskEventKindEnum.Values.task_config_create,
        ...data,
      },
    });
  }

  public logTaskConfigUpdate(data: Omit<TaskConfigUpdateEvent, "kind">) {
    this.logUpdate({
      data: {
        kind: TaskEventKindEnum.Values.task_config_update,
        ...data,
      },
    });
  }

  public logTaskConfigDestroy(data: Omit<TaskConfigDestroyEvent, "kind">) {
    this.logUpdate({
      data: {
        kind: TaskEventKindEnum.Values.task_config_destroy,
        ...data,
      },
    });
  }

  public logTaskRunCreate(data: Omit<TaskRunCreateEvent, "kind">) {
    this.logUpdate({
      data: {
        kind: TaskEventKindEnum.Values.task_run_create,
        ...data,
      },
    });
  }

  public logTaskRunUpdate(data: Omit<TaskRunUpdateEvent, "kind">) {
    this.logUpdate({
      data: {
        kind: TaskEventKindEnum.Values.task_run_update,
        ...data,
      },
    });
  }

  public logTaskRunDestroy(data: Omit<TaskRunDestroyEvent, "kind">) {
    this.logUpdate({
      data: {
        kind: TaskEventKindEnum.Values.task_run_destroy,
        ...data,
      },
    });
  }

  public logTaskHistoryEntryCreate(
    data: Omit<TaskHistoryEntryCreateEvent, "kind">,
  ) {
    this.logUpdate({
      data: {
        kind: TaskEventKindEnum.Values.history_entry_create,
        ...data,
      },
    });
  }

  public logPoolChange(data: Omit<TaskPoolChangeEvent, "kind">) {
    this.logUpdate({
      data: {
        kind: TaskEventKindEnum.Values.pool_change,
        ...data,
      },
    });
  }
}

export function init() {
  return TaskStateLogger.init();
}

export function instance() {
  return TaskStateLogger.getInstance();
}
