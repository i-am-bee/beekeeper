import { AgentKindEnum, AgentTypeValue } from "@/agents/registry/dto.js";
import { BaseStateBuilder } from "@/base/state/base-state-builder.js";
import {
  AgentTypeRegisterEvent,
  TaskConfigCreateEvent,
  TaskConfigDestroyEvent,
  TaskConfigUpdateEvent,
  TaskHistoryEntryCreateEvent,
  TaskPoolChangeEvent,
  TaskRunCreateEvent,
  TaskRunDestroyEvent,
  TaskRunUpdateEvent,
  TaskStateDataType,
  TaskStateDataTypeSchema,
} from "./dto.js";
import { stringToAgentType } from "@/agents/agent-id.js";
import {
  TaskConfigIdValue,
  TaskConfig,
  TaskTypeValue,
  TaskConfigPoolStats,
  TaskKindEnum,
  TaskRunIdValue,
  TaskRun,
} from "../manager/dto.js";
import {
  stringToTaskConfig,
  stringToTaskType,
  taskSomeIdToKindValue,
} from "../task-id.js";
import { clone } from "remeda";
import { updateDeepPartialObject } from "@/utils/objects.js";

// Define update types as const to ensure type safety
export const StateUpdateType = {
  AGENT_TYPE: "agent_type",
  TASK_CONFIG: "task_config",
  TASK_RUN: "task_config",
  POOL: "pool",
  HISTORY_ENTRY: "history_entry",
  FULL: "full",
} as const;

// Define the type for the update types
export type StateUpdateType =
  (typeof StateUpdateType)[keyof typeof StateUpdateType];

export interface TaskRunInfo {
  taskRunId: string;
  taskConfigId: string;
  taskConfigVersion: number;
  taskRun: TaskRun;
  isDestroyed: boolean;
}

export interface TaskPool {
  taskType: TaskTypeValue;
  poolStats: TaskConfigPoolStats;
  versions: [number, TaskConfigPoolStats][];
}

export interface TaskState {
  registeredAgentTypes: Map<AgentKindEnum, Set<AgentTypeValue>>;
  taskConfigs: Map<TaskConfigIdValue, TaskConfig[]>;
  taskRunPools: Map<TaskKindEnum, Map<TaskTypeValue, TaskPool>>;
  taskRuns: Map<TaskRunIdValue, TaskRunInfo>;
}

export class TaskStateBuilder extends BaseStateBuilder<
  typeof TaskStateDataTypeSchema,
  TaskState
> {
  constructor() {
    super(TaskStateDataTypeSchema, {
      registeredAgentTypes: new Map(),
      taskConfigs: new Map(),
      taskRunPools: new Map(),
      taskRuns: new Map(),
    });
  }

  protected processStateUpdate(data: TaskStateDataType): void {
    switch (data.kind) {
      case "agent_type_register":
        this.handleAgentTypeRegister(data);
        this.emit("state:updated", {
          type: StateUpdateType.AGENT_TYPE,
          ids: [data.agentTypeId],
        });
        break;
      case "task_config_create":
        this.handleTaskConfigCreate(data);
        this.emit("state:updated", {
          type: StateUpdateType.TASK_CONFIG,
          ids: [data.taskConfigId, data.taskType],
        });
        break;
      case "task_config_update":
        this.handleTaskConfigUpdate(data);
        this.emit("state:updated", {
          type: StateUpdateType.TASK_CONFIG,
          ids: [data.taskConfigId, data.taskType],
        });
        break;
      case "task_config_destroy":
        this.handleTaskConfigDestroy(data);
        this.emit("state:updated", {
          type: StateUpdateType.TASK_CONFIG,
          ids: [data.taskConfigId, data.taskType],
        });
        break;
      case "pool_change":
        this.handlePoolChange(data);
        this.emit("state:updated", {
          type: StateUpdateType.POOL,
          ids: [data.taskTypeId],
        });
        break;
      case "task_run_create":
      case "task_run_update":
      case "task_run_destroy":
        this.handleTaskRunLifecycle(data);
        this.emit("state:updated", {
          type: StateUpdateType.TASK_RUN,
          ids: [data.taskRunId],
        });
        break;
      case "history_entry_create":
        this.handleHistoryEntryCreate(data);
        this.emit("state:updated", {
          type: StateUpdateType.HISTORY_ENTRY,
          ids: [data.taskRunId],
        });
        break;
    }
  }
  handleHistoryEntryCreate(data: TaskHistoryEntryCreateEvent) {
    const { taskRunId, entry } = data;
    const taskRun = this.state.taskRuns.get(taskRunId);
    if (!taskRun) {
      throw new Error(`Task run ${taskRunId} was not found`);
    }

    taskRun.taskRun.history.push(entry);
  }

  private handleTaskRunLifecycle(
    data: TaskRunCreateEvent | TaskRunUpdateEvent | TaskRunDestroyEvent,
  ): void {
    const { taskRunId } = data;

    switch (data.kind) {
      case "task_run_create": {
        if (this.state.taskRuns.has(taskRunId)) {
          throw new Error(`Task run ${taskRunId} already exists`);
        }

        const taskConfigId = stringToTaskConfig(data.taskConfigId);

        this.state.taskRuns.set(taskRunId, {
          taskRunId,
          taskConfigId: data.taskConfigId,
          taskConfigVersion: taskConfigId.taskConfigVersion,
          taskRun: clone(data.taskRun),
          isDestroyed: false,
        });
        break;
      }
      case "task_run_update": {
        const taskRunInfo = this.state.taskRuns.get(taskRunId);
        if (!taskRunInfo) {
          throw new Error(
            `Task run info ${taskRunId} doesn't exist for update`,
          );
        }

        const modifiedUpdate = clone(data.taskRun);
        if (modifiedUpdate.currentTrajectory) {
          modifiedUpdate.currentTrajectory =
            taskRunInfo.taskRun.currentTrajectory.concat(
              modifiedUpdate.currentTrajectory,
            );
        }
        if (modifiedUpdate.blockedByTaskRunIds) {
          modifiedUpdate.blockedByTaskRunIds =
            taskRunInfo.taskRun.blockedByTaskRunIds.concat(
              modifiedUpdate.blockedByTaskRunIds,
            );
        }

        updateDeepPartialObject(taskRunInfo.taskRun, modifiedUpdate);
        break;
      }
      case "task_run_destroy": {
        const taskRunInfo = this.state.taskRuns.get(taskRunId);
        if (!taskRunInfo) {
          throw new Error(
            `Task run info ${taskRunId} doesn't exist for destroy`,
          );
        }
        taskRunInfo.isDestroyed = true;
        break;
      }
    }
  }

  handlePoolChange(data: TaskPoolChangeEvent) {
    const taskTypeId = stringToTaskType(data.taskTypeId);
    const pool = this.state.taskRunPools.get(
      taskSomeIdToKindValue(taskTypeId) as TaskKindEnum,
    );
    if (!pool) {
      throw new Error(`Missing pool for type: ${data.taskTypeId}`);
    }

    const poolType = pool.get(taskTypeId.taskType);
    if (!poolType) {
      throw new Error(`Missing pool type: ${data.taskTypeId}`);
    }

    poolType.poolStats = data.poolStats;
    poolType.versions = data.versions;
  }

  handleTaskConfigDestroy(data: TaskConfigDestroyEvent) {
    const { taskConfigId: taskConfigIdStr, taskType } = data;

    // Remove the config
    if (!this.state.taskConfigs.has(taskConfigIdStr)) {
      throw new Error(`Task config not found for task pool type: ${taskType}`);
    }
    this.state.taskConfigs.delete(taskConfigIdStr);
    const taskConfigId = stringToTaskConfig(taskConfigIdStr);

    // Clean up related pool
    const taskKindPool = this.state.taskRunPools.get(taskConfigId.taskKind);
    if (taskKindPool) {
      taskKindPool.delete(taskConfigId.taskType);
      if (taskKindPool.size === 0) {
        this.state.taskRunPools.delete(taskConfigId.taskKind);
      }
    }
  }
  handleTaskConfigUpdate(data: TaskConfigUpdateEvent) {
    const { config, taskConfigId, taskType: taskTypeId } = data;

    // Update existing config
    const taskConfigsVersions = this.state.taskConfigs.get(taskConfigId);
    if (!taskConfigsVersions) {
      throw new Error(
        `Task config versions not found for task type: ${taskTypeId}`,
      );
    }
    taskConfigsVersions.push(config);
  }
  handleTaskConfigCreate(data: TaskConfigCreateEvent) {
    const { config, taskType } = data;

    // Store the config
    this.state.taskConfigs.set(taskType, [config]);

    // Initialize the pool if needed
    let pool = this.state.taskRunPools.get(config.taskKind);
    if (!pool) {
      pool = new Map();
      this.state.taskRunPools.set(config.taskKind, pool);
    }

    const poolType: TaskPool = {
      taskType,
      poolStats: {
        poolSize: 0,
        active: 0,
        terminated: 0,
        completed: 0,
        running: 0,
        failed: 0,
        aborted: 0,
        stopped: 0,
        pending: 0,
        awaiting_agent: 0,
        created: 0,
        total: 0,
      },
      versions: [],
    };

    pool.set(config.taskType, poolType);
  }
  handleAgentTypeRegister(data: AgentTypeRegisterEvent) {
    const agentTypeId = stringToAgentType(data.agentTypeId);
    let kindSet = this.state.registeredAgentTypes.get(agentTypeId.agentKind);
    if (!kindSet) {
      kindSet = new Set();
      this.state.registeredAgentTypes.set(agentTypeId.agentKind, kindSet);
    }
    kindSet.add(agentTypeId.agentType);
  }
  protected reset(): void {
    this.state.registeredAgentTypes.clear();
    this.state.taskConfigs.clear();
    this.state.taskRunPools.clear();
    this.state.taskRuns.clear();
  }

  getAllTaskRuns(): TaskRunInfo[] {
    return Array.from(this.state.taskRuns.values());
  }

  getTaskConfig(
    taskTypeId: string,
    taskConfigVersion?: number,
  ): TaskConfig | undefined {
    const versions = this.state.taskConfigs.get(taskTypeId);
    if (!versions) {
      throw new Error(`Task config versions not found for '${taskTypeId}'`);
    }
    if (taskConfigVersion != null) {
      return versions.find((v) => v.taskConfigVersion === taskConfigVersion);
    }
    return versions.at(-1);
  }

  private getTaskPoolsMap(
    agentKindId: TaskKindEnum,
  ): Map<string, TaskPool> | undefined {
    return this.state.taskRunPools.get(agentKindId);
  }

  getTaskPool(
    agentKind: TaskKindEnum,
    agentType: string,
  ): TaskPool | undefined {
    const map = this.getTaskPoolsMap(agentKind);
    return map?.get(agentType);
  }
}
