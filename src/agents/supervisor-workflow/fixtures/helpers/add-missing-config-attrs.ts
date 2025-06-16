import { agentConfigIdToValue } from "@/agents/agent-id.js";
import { AgentConfig } from "@/agents/registry/dto.js";
import { AutomaticTaskRun, TaskConfig, TaskRun } from "@/tasks/manager/dto.js";
import { taskConfigIdToValue, taskRunIdToString } from "@/tasks/task-id.js";
import { updateDeepPartialObject } from "@/utils/objects.js";
import { AgentConfigTiny } from "../../workflow-composer/task-initializer/agent-config-initializer/dto.js";
import { TaskConfigMinimal } from "../../workflow-composer/task-initializer/task-config-initializer/dto.js";
import { TaskRunMinimal } from "../../workflow-composer/task-run-initializer/dto.js";

export type AgentConfigMissingAttrs = Omit<
  AgentConfig,
  keyof AgentConfigTiny | "agentConfigId"
>;

export function addAgentConfigMissingAttrs<
  T extends AgentConfigTiny,
  U extends AgentConfig & T,
>(
  configs: T,
  options?: {
    selected?: {
      agentType: T["agentType"];
      attrs: Partial<AgentConfigMissingAttrs>;
    }[];
    all?: Partial<AgentConfigMissingAttrs>;
  },
): U;
export function addAgentConfigMissingAttrs<
  T extends AgentConfigTiny,
  U extends AgentConfig & T,
>(
  configs: T[],
  options?: {
    selected?: {
      agentType: T["agentType"];
      attrs: Partial<AgentConfigMissingAttrs>;
    }[];
    all?: Partial<AgentConfigMissingAttrs>;
  },
): U[];
export function addAgentConfigMissingAttrs<T extends AgentConfigTiny>(
  configs: T | T[],
  options?: {
    selected?: {
      agentType: T["agentType"];
      attrs: Partial<AgentConfigMissingAttrs>;
    }[];
    all?: Partial<AgentConfigMissingAttrs>;
  },
) {
  const all = updateDeepPartialObject(
    {
      agentConfigVersion: 1,
      agentKind: "operator",
      autoPopulatePool: false,
      maxPoolSize: 5,
    } as AgentConfigMissingAttrs,
    options?.all,
  );

  const results = ((Array.isArray(configs) && configs) || [configs]).map(
    (config) => {
      const _selected = options?.selected?.find(
        (s) => s.agentType === config.agentType,
      );

      const merged = {
        ...config,
        ...updateDeepPartialObject(all, _selected?.attrs),
      };
      const agentConfigId = agentConfigIdToValue({
        agentKind: merged.agentKind,
        agentType: merged.agentType,
        agentConfigVersion: merged.agentConfigVersion,
      });

      return {
        ...merged,
        agentConfigId,
      } satisfies AgentConfig;
    },
  );

  return Array.isArray(configs) ? results : results[0];
}

export type TaskConfigMissingAttrs = Omit<
  TaskConfig,
  keyof TaskConfigMinimal | "taskConfigId"
>;

export function addTaskConfigMissingAttrs<
  T extends TaskConfigMinimal,
  U extends TaskConfig & T,
>(
  configs: T,
  options?: {
    selected?: {
      taskType: T["taskType"];
      attrs: Partial<TaskConfigMissingAttrs>;
    }[];
    all?: Partial<TaskConfigMissingAttrs>;
  },
): U;
export function addTaskConfigMissingAttrs<
  T extends TaskConfigMinimal,
  U extends TaskConfig & T,
>(
  configs: T[],
  options?: {
    selected?: {
      taskType: T["taskType"];
      attrs: Partial<TaskConfigMissingAttrs>;
    }[];
    all?: Partial<TaskConfigMissingAttrs>;
  },
): U[];
export function addTaskConfigMissingAttrs<T extends TaskConfigMinimal>(
  configs: T | T[],
  options?: {
    selected?: {
      taskType: T["taskType"];
      attrs: Partial<TaskConfigMissingAttrs>;
    }[];
    all?: Partial<TaskConfigMissingAttrs>;
  },
) {
  const all = updateDeepPartialObject(
    {
      taskConfigVersion: 1,
      taskKind: "operator",
      runImmediately: false,
      intervalMs: 0,
      agentConfigVersion: 1,
      agentKind: "operator",
      ownerAgentId: "",
      concurrencyMode: "EXCLUSIVE",
    } as TaskConfigMissingAttrs,
    options?.all,
  );

  const results = ((Array.isArray(configs) && configs) || [configs]).map(
    (config) => {
      const _selected = options?.selected?.find(
        (s) => s.taskType === config.taskType,
      );

      const merged = {
        ...config,
        ...updateDeepPartialObject(all, _selected?.attrs),
      };
      const taskConfigId = taskConfigIdToValue({
        taskKind: merged.taskKind,
        taskType: merged.taskType,
        taskConfigVersion: merged.taskConfigVersion,
      });

      return {
        ...merged,
        taskConfigId,
      } satisfies TaskConfig;
    },
  );

  return Array.isArray(configs) ? results : results[0];
}

export type TaskRunMissingAttrs = Omit<
  AutomaticTaskRun,
  keyof TaskRunMinimal | "taskRunId"
>;

export function addTaskRunMissingAttrs<
  T extends TaskRunMinimal,
  U extends AutomaticTaskRun & T,
>(
  configs: T,
  options?: {
    selected?: {
      taskType: T["taskType"];
      attrs: Partial<TaskRunMissingAttrs>;
    }[];
    all?: Partial<TaskRunMissingAttrs>;
  },
): U;
export function addTaskRunMissingAttrs<
  T extends TaskRunMinimal,
  U extends AutomaticTaskRun & T,
>(
  configs: T[],
  options?: {
    selected?: {
      taskType: T["taskType"];
      attrs: Partial<TaskRunMissingAttrs>;
    }[];
    all?: Partial<TaskRunMissingAttrs>;
  },
): U[];
export function addTaskRunMissingAttrs<T extends TaskRunMinimal>(
  configs: T | T[],
  options?: {
    selected?: {
      taskType: T["taskType"];
      attrs: Partial<TaskRunMissingAttrs>;
    }[];
    all?: Partial<TaskRunMissingAttrs>;
  },
) {
  const all = updateDeepPartialObject(
    {
      taskRunKind: "automatic",
      taskConfigVersion: 1,
      taskKind: "operator",
      ownerAgentId: "",
      status: "CREATED",
      originTaskRunId: "",
      config: {} as any,
      isOccupied: false,
      errorCount: 0,
      currentRetryAttempt: 0,
      completedRuns: 0,
      currentTrajectory: [],
      history: [],
      isDependent: false,
      blockedByTaskRunIds: [],
      blockingTaskRunIds: []
    } as TaskRunMissingAttrs,
    options?.all,
  );

  const results = ((Array.isArray(configs) && configs) || [configs]).map(
    (config) => {
      const _selected = options?.selected?.find(
        (s) => s.taskType === config.taskType,
      );

      const merged = {
        ...config,
        ...updateDeepPartialObject(all, _selected?.attrs),
      };
      const taskRunId = taskRunIdToString({
        taskKind: merged.taskKind,
        taskType: merged.taskType,
        taskConfigVersion: merged.taskConfigVersion,
        taskRunNum: merged.taskRunNum,
      });

      return {
        ...merged,
        taskRunId,        
      } satisfies TaskRun;
    },
  );

  return Array.isArray(configs) ? results : results[0];
}
