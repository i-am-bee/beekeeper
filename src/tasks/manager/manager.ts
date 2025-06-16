import {
  FULL_ACCESS,
  READ_EXECUTE_ACCESS,
  READ_ONLY_ACCESS,
  READ_WRITE_ACCESS,
  ResourcesAccessControl,
  WRITE_ONLY_ACCESS,
} from "@/access-control/resources-access-control.js";
import { agentSomeIdToTypeValue } from "@/agents/agent-id.js";
import {
  AgentConfigVersionValue,
  AgentIdValue,
  AgentKindEnum,
  AgentTypeValue,
} from "@/agents/registry/dto.js";
import { OperationResult } from "@/base/dto.js";
import { AbortScope } from "@/utils/abort-scope.js";
import { updateDeepPartialObject } from "@/utils/objects.js";
import { AgentStateLogger } from "@agents/state/logger.js";
import { TaskStateLogger } from "@tasks/state/logger.js";
import { WorkspaceResource } from "@workspaces/manager/index.js";
import { WorkspaceRestorable } from "@workspaces/restore/index.js";
import { AbortError, Logger } from "beeai-framework";
import { AssistantMessage, ToolMessage } from "beeai-framework/backend/message";
import EventEmitter from "events";
import { clone, difference, isNonNullish, omit } from "remeda";
import {
  taskConfigIdToValue,
  taskRunIdToString,
  taskSomeIdToTypeValue,
} from "../task-id.js";
import {
  AutomaticTaskRun,
  BaseTaskRun,
  CreateTaskConfig,
  FinalStatus,
  InteractionTaskRun,
  isTaskRunActiveStatus,
  isTaskRunTerminationStatus,
  TaskConfig,
  TaskConfigIdValue,
  TaskConfigOwnedResource,
  TaskConfigOwnedResourceSchema,
  TaskConfigPoolStats,
  TaskConfigVersionValue,
  TaskKindEnum,
  TaskKindEnumSchema,
  TaskKindValue,
  TaskRun,
  TaskRunHistoryEntry,
  TaskRunIdValue,
  TaskRunKindEnum,
  TaskRunKindEnumSchema,
  TaskRunStatusEnum,
  TaskRunStatusEnumSchema,
  TaskRunTerminalStatusEnum,
  TaskTypeValue,
} from "./dto.js";
import {
  extendBlockingTaskRunOutput,
  serializeTaskRunInput,
  taskRunError,
  taskRunOutput,
} from "./helpers.js";

export type TaskRunRuntime = TaskRun & {
  intervalId: NodeJS.Timeout | null;
  abortScope: AbortScope;
};

const TASK_MANAGER_RESOURCE = "task_manager";
const TASK_MANAGER_USER = "task_manager_user";
const TASK_MANAGER_CONFIG_PATH = ["configs", "task_manager.jsonl"] as const;

const MAX_POOL_SIZE = 100;

export interface TaskManagerSwitches {
  restoration: boolean;
}

export interface TaskMangerOptions {
  errorHandler?: (error: Error, taskRunId: TaskRunIdValue) => void;
  occupancyTimeoutMs?: number;
  adminIds?: string[];
  maxHistoryEntries?: number;
}

export type OnTaskStart = (
  taskRun: TaskRunRuntime,
  taskManager: TaskManager,
  callbacks: {
    onAwaitingAgentAcquired: (
      taskRunId: TaskRunIdValue,
      taskManage: TaskManager,
    ) => void;
    onAgentAcquired: (
      taskRunId: TaskRunIdValue,
      agentId: AgentIdValue,
      taskManage: TaskManager,
    ) => void;
    onAgentUpdate: (
      key: string,
      value: string,
      taskRunId: TaskRunIdValue,
      agentId: AgentIdValue,
      taskManage: TaskManager,
    ) => void;
    onAgentComplete: (
      output: string,
      taskRunId: TaskRunIdValue,
      agentId: AgentIdValue,
      taskManage: TaskManager,
    ) => void;
    onAgentError: (
      err: Error,
      taskRunId: TaskRunIdValue,
      agentId: AgentIdValue,
      taskManage: TaskManager,
    ) => void;
  },
  addToMemory?: (AssistantMessage | ToolMessage)[],
) => Promise<unknown>;

interface TaskManagerEvents {
  "task_run:start": (taskRun: TaskRun) => void;
  "task_run:trajectory_update": (taskRun: TaskRun) => void;
  "task_run:complete": (taskRun: TaskRun) => void;
  "task_run:error": (taskRun: TaskRun) => void;
}

export interface TaskManagerConfig {
  onTaskStart: OnTaskStart;
  options?: TaskMangerOptions;
  switches?: TaskManagerSwitches;
  signal?: AbortSignal;
  logger: Logger;
}

export class TaskManager extends WorkspaceRestorable {
  /** Map of registered task type and their configurations */
  private _taskConfigs: Map<
    TaskKindEnum,
    Map<TaskTypeValue, TaskConfig[]>
  > | null;
  private _taskRuns: Map<TaskRunIdValue, TaskRunRuntime> | null;
  /** Map of task run pools by task config and task run IDs */
  private _taskPools: Map<
    TaskKindEnum,
    Map<TaskTypeValue, [TaskConfigVersionValue, Set<TaskConfigIdValue>][]>
  > | null;
  private _scheduledTasksToStart:
    | {
        taskRunId: TaskRunIdValue;
        actingAgentId: AgentIdValue;
      }[]
    | null;
  private isTaskProcessingActive = false;
  private _awaitingTasksForAgents:
    | {
        taskRunId: TaskRunIdValue;
        agentTypeId: string;
      }[]
    | null;
  private _registeredAgentTypes: Map<AgentKindEnum, AgentTypeValue[]> | null;
  private _ac: ResourcesAccessControl | null;
  private _stateLogger: TaskStateLogger | null;
  private _agentStateLogger: AgentStateLogger | null;
  private _onTaskStart: OnTaskStart | null;
  private _options: TaskMangerOptions | null;
  private _switches: TaskManagerSwitches;
  private _emitter: EventEmitter | null;
  private _abortScope: AbortScope | null;

  private get taskConfigs() {
    if (!this._taskConfigs) {
      throw new Error("Task configs are missing");
    }
    return this._taskConfigs;
  }

  private get taskRuns() {
    if (!this._taskRuns) {
      throw new Error("Task runs are missing");
    }
    return this._taskRuns;
  }

  private get taskPools() {
    if (!this._taskPools) {
      throw new Error("Task pools are missing");
    }
    return this._taskPools;
  }

  private get scheduledTasksToStart() {
    if (!this._scheduledTasksToStart) {
      throw new Error("Scheduled tasks to start are missing");
    }
    return this._scheduledTasksToStart;
  }

  private get awaitingTasksForAgents() {
    if (!this._awaitingTasksForAgents) {
      throw new Error("Awaiting tasks for agents are missing");
    }
    return this._awaitingTasksForAgents;
  }

  private get registeredAgentTypes() {
    if (!this._registeredAgentTypes) {
      throw new Error("Registered agent types are missing");
    }
    return this._registeredAgentTypes;
  }

  private get ac() {
    if (!this._ac) {
      throw new Error("Access control is missing");
    }
    return this._ac;
  }

  private get stateLogger() {
    if (!this._stateLogger) {
      throw new Error("Task state logger is missing");
    }
    return this._stateLogger;
  }

  private get agentStateLogger() {
    if (!this._agentStateLogger) {
      throw new Error("Agent state logger is missing");
    }
    return this._agentStateLogger;
  }

  private get onTaskStart() {
    if (!this._onTaskStart) {
      throw new Error("onTaskStart callback is missing");
    }
    return this._onTaskStart;
  }

  private get options() {
    if (!this._options) {
      throw new Error("Options are missing");
    }
    return this._options;
  }

  private get emitter() {
    if (!this._emitter) {
      throw new Error("Emitter is missing");
    }
    return this._emitter;
  }

  private get abortScope() {
    if (!this._abortScope) {
      throw new Error("Abort scope is missing");
    }
    return this._abortScope;
  }

  constructor({
    onTaskStart,
    options,
    switches,
    signal,
    logger,
  }: TaskManagerConfig) {
    super(TASK_MANAGER_CONFIG_PATH, TASK_MANAGER_USER, logger);
    this.logger.info("Initializing TaskManager");
    this._stateLogger = TaskStateLogger.getInstance();
    this._agentStateLogger = AgentStateLogger.getInstance();
    this._registeredAgentTypes = new Map();
    this._awaitingTasksForAgents = [];
    this._scheduledTasksToStart = [];
    this._taskRuns = new Map();

    this._emitter = new EventEmitter();

    const self = this;
    this._abortScope = new AbortScope({
      parentSignal: signal,
      onAbort() {
        self.isTaskProcessingActive = false;
        self.abortScope.reset();
      },
    });

    this._onTaskStart = onTaskStart;

    this._options = {
      errorHandler: (error: Error, taskRunId: TaskRunIdValue) => {
        this.logger.error({ taskRunId, error }, "Task error occurred");
      },
      occupancyTimeoutMs: 30 * 60 * 1000,
      adminIds: [],
      maxHistoryEntries: 100, // Default to keeping last 100 entries
      ...(options || {}),
    };

    this._ac = new ResourcesAccessControl(
      this.constructor.name,
      [TASK_MANAGER_USER].concat(
        this.options.adminIds ? this.options.adminIds : [],
      ),
      logger,
    );
    this._ac.createResource(
      TASK_MANAGER_RESOURCE,
      TASK_MANAGER_USER,
      TASK_MANAGER_USER,
    );

    // Initialize task pools for all task kinds
    this._taskConfigs = new Map(
      TaskKindEnumSchema.options.map((kind) => [kind, new Map()]),
    );
    this._taskPools = new Map(
      TaskKindEnumSchema.options.map((kind) => [kind, new Map()]),
    );
    this._switches = { restoration: true, ...clone(switches) };
  }

  startTaskProcessing(): void {
    // Don't start if already processing
    if (this.isTaskProcessingActive) {
      this.logger.debug("Task processing already active");
      return;
    }

    this.logger.debug("Starting task processing");
    this.isTaskProcessingActive = true;

    // Start new interval using the abort scope
    this.abortScope.setInterval(async () => {
      try {
        // The interval won't run if the scope is aborted
        await this.processNextStartTask();
      } catch (err) {
        if (err instanceof AbortError) {
          this.logger.info("Task processing aborted");
          this.stopTaskProcessing();
        } else {
          this.logger.error(err, "Process next start task error");
        }
      }
    }, 100);
  }

  async processNextStartTask() {
    // Check if aborted before proceeding
    this.abortScope.checkIsAborted();

    if (!this.scheduledTasksToStart.length) {
      return;
    }

    const { taskRunId, actingAgentId } = this.scheduledTasksToStart.shift()!;

    this.logger.info(
      { taskRunId, actingAgentId },
      "Starting scheduled task run",
    );

    const taskRun = this.getTaskRun(taskRunId, actingAgentId, FULL_ACCESS);
    if (taskRun.status === "EXECUTING") {
      this.logger.warn({ taskRunId }, "Task is already executing");
      throw new Error(`Task ${taskRunId} is already executing`);
    }

    try {
      if (taskRun.config.runImmediately || !taskRun.config.intervalMs) {
        this.logger.debug({ taskRunId }, "Executing task immediately");
        await this.executeTask(taskRunId, actingAgentId);
      }

      if (
        taskRun.config.intervalMs &&
        (taskRun.config.maxRepeats == null ||
          taskRun.completedRuns < taskRun.config.maxRepeats)
      ) {
        this.logger.debug(
          {
            taskRunId,
            intervalMs: taskRun.config.intervalMs,
          },
          "Setting up task interval",
        );

        // Use the task scope to create the interval
        taskRun.intervalId = taskRun.abortScope.setInterval(async () => {
          try {
            await this.executeTask(taskRunId, actingAgentId);
          } catch (err) {
            this.logger.error(
              { err, taskRunId, actingAgentId },
              "Error executing scheduled task",
            );
          }
        }, taskRun.config.intervalMs);

        // Update task status
        this._updateTaskRun(taskRunId, taskRun, {
          status: "PENDING",
          nextRunAt: new Date(Date.now() + taskRun.config.intervalMs),
        });
      }

      this.logger.info({ taskRunId }, "Task started successfully");
    } catch (err) {
      if (err instanceof AbortError) {
        this.logger.info({ taskRunId }, "Task start aborted");

        // Make sure we clean up properly even on abort
        if (taskRun.intervalId) {
          clearInterval(taskRun.intervalId);
          taskRun.intervalId = null;
        }

        if (taskRun.abortScope) {
          taskRun.abortScope.dispose();
        }

        // Update status to aborted
        this._updateTaskRun(taskRunId, taskRun, {
          status: "ABORTED",
          nextRunAt: undefined,
        });

        // Add history entry for the abortion
        this.addHistoryEntry(taskRunId, actingAgentId, {
          timestamp: new Date(),
          terminalStatus: "ABORTED",
          runNumber: taskRun.completedRuns,
          maxRuns: taskRun.config.maxRepeats,
          retryAttempt: taskRun.currentRetryAttempt,
          maxRepeats: taskRun.config.maxRepeats,
          agentId: actingAgentId,
          trajectory: clone(taskRun.currentTrajectory),
          executionTimeMs: taskRun.startRunAt
            ? Date.now() - taskRun.startRunAt?.getTime()
            : -1,
        });
      } else {
        this.logger.error(
          { err, taskRunId, actingAgentId },
          "Failed to start task",
        );

        // Clean up on error
        if (taskRun.abortScope) {
          taskRun.abortScope.reset();
        }
      }

      throw err;
    }
  }

  stopTaskProcessing(): void {
    if (this.isTaskProcessingActive) {
      this.logger.debug("Stopping task processing");
      this.isTaskProcessingActive = false;

      // No need to call dispose() here as that would remove the parent signal listener
      // Just abort the current operations, but keep the abortScope alive
      this.abortScope.abort({ manualAbort: true });
    }
  }

  public addAdmin(adminId: string) {
    this.ac.addAdmin(adminId);
  }

  public on<K extends keyof TaskManagerEvents>(
    event: K,
    listener: TaskManagerEvents[K],
  ): typeof this.emitter {
    return this.emitter.on(event, listener);
  }

  public off<K extends keyof TaskManagerEvents>(
    event: K,
    listener: TaskManagerEvents[K],
  ): typeof this.emitter {
    return this.emitter.off(event, listener);
  }

  public emit<K extends keyof TaskManagerEvents>(
    event: K,
    ...args: Parameters<TaskManagerEvents[K]>
  ): boolean {
    return this.emitter.emit(event, ...args);
  }

  get switches() {
    return clone(this._switches);
  }

  switchSignal(signal: AbortSignal) {
    this.abortScope.switchSignal(signal);
  }

  restore(actingAgentId: AgentIdValue): void {
    // Check if aborted
    this.abortScope.checkIsAborted();

    if (this.switches.restoration === false) {
      this.logger.warn(`Skipping restoration`);
      return;
    }
    super.restore(actingAgentId);
  }

  protected restoreEntity(
    resource: WorkspaceResource,
    line: string,
    actingAgentId: AgentIdValue,
  ): void {
    this.logger.info(`Restoring previous state from ${resource.path}`);
    // Check if aborted
    this.abortScope.checkIsAborted();

    let parsed;
    try {
      parsed = JSON.parse(line);
    } catch (e) {
      this.logger.error(e);
      throw new Error(`Failed to parse JSON: ${line}`);
    }

    const taskConfigResult = TaskConfigOwnedResourceSchema.safeParse(parsed);
    if (taskConfigResult.success) {
      this.createTaskConfig(
        taskConfigResult.data.taskConfig,
        taskConfigResult.data.ownerId,
        actingAgentId,
        false,
      );
      return;
    }

    this.logger.error(taskConfigResult, `Can't restore task config`);
    throw new Error(`Can't restore`);
  }

  protected getSerializedEntities(): string {
    return Array.from(this.taskConfigs.entries())
      .map(([taskKind, typeMap]) =>
        Array.from(typeMap.entries()).map(([taskType, versions]) => {
          const taskConfig = versions.at(-1);
          if (!taskConfig) {
            throw new Error(
              `Task ${taskSomeIdToTypeValue({ taskKind, taskType })} has no version to serialize`,
            );
          }
          const { ownerId } = this.ac.getResourcePermissionsByAdmin(
            taskConfig.taskConfigId,
            TASK_MANAGER_USER,
          )!;
          const config = {
            ownerId,
            taskConfig,
          } satisfies TaskConfigOwnedResource;
          return JSON.stringify(config);
        }),
      )
      .flat()
      .join("\n");
  }

  registerAdminAgent(agentId: AgentIdValue) {
    this.ac.createPermissions(
      TASK_MANAGER_RESOURCE,
      agentId,
      FULL_ACCESS,
      TASK_MANAGER_USER,
    );
  }

  registerAgentType(agentKind: AgentKindEnum, agentType: string): void {
    let types = this.registeredAgentTypes.get(agentKind);
    if (!types) {
      types = [agentType];
      this.registeredAgentTypes.set(agentKind, types);
    } else {
      if (types.includes(agentType)) {
        throw new Error(
          `Agent type duplicity for agentKind:${agentKind}, agentType:${agentType}`,
        );
      }
      types.push(agentType);
    }
    this.stateLogger.logAgentTypeRegister({
      agentTypeId: agentSomeIdToTypeValue({ agentKind, agentType }),
    });
  }

  getTaskRun(
    taskRunId: TaskRunIdValue,
    actingAgentId: AgentIdValue,
    permissions = READ_ONLY_ACCESS,
  ): TaskRunRuntime {
    this.logger.trace({ taskRunId }, "Getting task run by ID");
    this.ac.checkPermission(taskRunId, actingAgentId, permissions);

    const taskRun = this.taskRuns.get(taskRunId);
    if (!taskRun) {
      this.logger.error({ taskRunId }, "Task run not found");
      throw new Error(`Task run with ID '${taskRunId}' not found`);
    }
    return taskRun;
  }

  getPoolStats(
    taskKind: TaskKindEnum,
    taskType: TaskTypeValue,
    actingAgentId: AgentIdValue,
  ): [TaskConfigPoolStats, [number, TaskConfigPoolStats][]] {
    this.logger.trace(
      { taskKind, taskType, actingAgentId },
      "Getting pool statistics",
    );

    this.ac.checkPermission(
      TASK_MANAGER_RESOURCE,
      actingAgentId,
      READ_ONLY_ACCESS,
    );

    const pool = this.getTaskTypeVersionSetsArray(taskKind, taskType, false);
    if (!pool) {
      return [
        {
          poolSize: 0,
          created: 0,
          running: 0,
          pending: 0,
          awaiting_agent: 0,
          stopped: 0,
          failed: 0,
          aborted: 0,
          completed: 0,
          terminated: 0,
          active: 0,
          total: 0,
        },
        [],
      ];
    }

    const versionedTaskRuns = pool.map(
      ([version, set]) =>
        [
          version,
          Array.from(set)
            .map((t) => {
              if (this.ac.hasPermission(t, actingAgentId, READ_ONLY_ACCESS)) {
                return this.getTaskRun(t, actingAgentId, READ_ONLY_ACCESS);
              }
            })
            .filter(isNonNullish),
        ] as const,
    );
    const versions = versionedTaskRuns.map(([version, taskRuns]) => {
      const config = this.getTaskConfig(
        taskKind,
        taskType,
        actingAgentId,
        version,
      );
      const stats = {
        poolSize: config.concurrencyMode === "EXCLUSIVE" ? 1 : MAX_POOL_SIZE,
        active: taskRuns.filter((t) => isTaskRunActiveStatus(t.status)).length,
        terminated: taskRuns.filter((t) => isTaskRunTerminationStatus(t.status))
          .length,
        completed: taskRuns.filter((t) => t.status === "COMPLETED").length,
        running: taskRuns.filter((t) => t.status === "EXECUTING").length,
        failed: taskRuns.filter((t) => t.status === "FAILED").length,
        aborted: taskRuns.filter((t) => t.status === "ABORTED").length,
        stopped: taskRuns.filter((t) => t.status === "STOPPED").length,
        pending: taskRuns.filter((t) => t.status === "PENDING").length,
        awaiting_agent: taskRuns.filter((t) => t.status === "AWAITING_AGENT")
          .length,
        created: taskRuns.filter((t) => t.status === "CREATED").length,
        total: taskRuns.length,
      } satisfies TaskConfigPoolStats;
      return [version, stats] as [number, TaskConfigPoolStats];
    });

    const stats = versions.reduce(
      (prev, [, curr]) => {
        const sum = {
          poolSize: curr.poolSize + prev.poolSize,
          active: curr.active + prev.active,
          terminated: curr.terminated + prev.terminated,
          completed: curr.completed + prev.completed,
          running: curr.running + prev.running,
          failed: curr.failed + prev.failed,
          aborted: curr.aborted + prev.aborted,
          stopped: curr.stopped + prev.stopped,
          pending: curr.pending + prev.pending,
          awaiting_agent: curr.awaiting_agent + prev.awaiting_agent,
          created: curr.created + prev.created,
          total: curr.total + prev.total,
        } satisfies TaskConfigPoolStats;
        return sum;
      },
      {
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
      } satisfies TaskConfigPoolStats,
    );

    this.logger.trace({ taskType: taskType, ...stats }, "Pool statistics");
    return [stats, versions];
  }

  private getPoolStatsByVersion(
    taskKind: TaskKindEnum,
    taskType: TaskTypeValue,
    taskConfigVersion: number,
    actingAgentId: AgentIdValue,
  ) {
    // FIXME Unoptimized
    const [, versions] = this.getPoolStats(taskKind, taskType, actingAgentId);
    const found = versions.find(
      ([currVersion]) => currVersion === taskConfigVersion,
    );
    if (!found) {
      return {
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
      } satisfies TaskConfigPoolStats;
    }
    const [, versionStats] = found;
    return versionStats;
  }

  private getTaskKindPoolMap(taskKind: TaskKindEnum) {
    const poolKind = this.taskPools.get(taskKind);
    if (!poolKind) {
      throw new Error(`There is missing pool for task taskKind:${taskKind}`);
    }
    return poolKind;
  }

  private getTaskTypeVersionSetsArray(
    taskKind: TaskKindEnum,
    taskType: AgentTypeValue,
    throwError = true,
  ) {
    const poolKind = this.getTaskKindPoolMap(taskKind);
    const pool = poolKind.get(taskType);
    if (!pool && throwError) {
      throw new Error(
        `There is missing pool version sets array for agent agentKind:${taskKind} agentType:${taskType}`,
      );
    }
    return pool;
  }

  private getTaskTypeVersionSet(
    taskKind: TaskKindEnum,
    taskType: TaskTypeValue,
    taskConfigVersion: number,
  ) {
    const poolVersionSetsArray = this.getTaskTypeVersionSetsArray(
      taskKind,
      taskType,
    )!;
    const poolVersionSet = poolVersionSetsArray.find(
      (it) => it[0] === taskConfigVersion,
    );
    if (!poolVersionSet) {
      throw new Error(
        `There is missing pool version set for task taskKind:${taskKind} taskType:${taskType} version:${taskConfigVersion}`,
      );
    }
    return poolVersionSet[1];
  }

  createTaskConfig(
    config: CreateTaskConfig,
    ownerAgentId: string,
    actingAgentId: AgentIdValue,
    persist = true,
  ): TaskConfig {
    const { taskKind, taskType, maxRepeats: maxRuns } = config;
    this.logger.info(
      {
        taskKind,
        taskType,
        maxRuns,
      },
      "Create new task config",
    );
    this.ac.checkPermission(
      TASK_MANAGER_RESOURCE,
      actingAgentId,
      WRITE_ONLY_ACCESS,
    );

    const taskTypesMap = this.getTaskConfigMap(taskKind);
    if (taskTypesMap.has(taskType)) {
      this.logger.error({ taskType }, "Task type already registered");
      throw new Error(`Task type '${taskType}' is already registered`);
    }

    if (
      !this.registeredAgentTypes
        .get(config.agentKind)
        ?.includes(config.agentType)
    ) {
      throw new Error(
        `Agent kind: ${config.agentKind} type: ${config.agentType} wasn't yet registered`,
      );
    }

    const taskConfigVersion = 1;
    const taskConfigId = taskConfigIdToValue({
      ...config,
      taskConfigVersion,
    });
    const configVersioned = {
      ...config,
      taskConfigId,
      ownerAgentId,
      taskConfigVersion,
    } satisfies TaskConfig;
    taskTypesMap.set(taskType, [configVersioned]);

    // Permissions
    this.ac.createResource(taskConfigId, ownerAgentId, actingAgentId);
    this.ac.createPermissions(
      taskConfigId,
      ownerAgentId,
      READ_EXECUTE_ACCESS,
      actingAgentId,
    );

    this.stateLogger.logTaskConfigCreate({
      taskConfigId,
      taskType: taskSomeIdToTypeValue(configVersioned),
      config: configVersioned,
    });

    this.initializeTaskPool(taskKind, taskType, taskConfigVersion);

    if (persist) {
      this.persist();
    }

    return configVersioned;
  }

  private initializeTaskPool(
    taskKind: TaskKindEnum,
    taskType: TaskTypeValue,
    version: number,
  ) {
    this.logger.debug(
      {
        taskKind,
        taskType,
        version,
      },
      "Initializing task pool",
    );

    const kindPool = this.getTaskKindPoolMap(taskKind);
    let typePool = kindPool.get(taskType);
    if (!typePool) {
      typePool = [];
      kindPool.set(taskType, typePool);
    }
    typePool.push([version, new Set([])]);
  }

  private getTaskConfigMap(taskKind: TaskKindEnum) {
    const typesMap = this.taskConfigs.get(taskKind);
    if (!typesMap) {
      throw new Error(
        `There is missing types map for task taskKind:${taskKind}`,
      );
    }
    return typesMap;
  }

  private getTaskConfigTypeMap(
    taskKind: TaskKindEnum,
    taskType: TaskTypeValue,
  ) {
    const taskConfigTypeMap = this.getTaskConfigMap(taskKind);
    const taskConfigVersions = taskConfigTypeMap.get(taskType);
    if (!taskConfigVersions) {
      this.logger.error(
        { taskKind, taskType },
        "Task config type map was not found",
      );
      throw new Error(
        `Task kind '${taskKind}' type '${taskType}' was not found`,
      );
    }
    return taskConfigVersions;
  }

  findTaskConfig(...args: Parameters<typeof this.getTaskConfig>) {
    let taskConfig;
    try {
      taskConfig = this.getTaskConfig(...args);
    } catch {
      // PASS
    }

    return taskConfig;
  }

  getTaskConfig(
    taskKind: TaskKindEnum,
    taskType: TaskTypeValue,
    actingAgentId: AgentIdValue,
    taskConfigVersion?: number,
    permissions = READ_ONLY_ACCESS,
  ): TaskConfig {
    const configVersions = this.getTaskConfigMap(taskKind).get(taskType);
    if (!configVersions) {
      this.logger.error({ taskKind, taskType }, "Task config not found");
      throw new Error(
        `Task kind '${taskKind}' type '${taskType}' was not found`,
      );
    }

    let result;
    if (taskConfigVersion != null) {
      const configVersion = configVersions.find(
        (c) => c.taskConfigVersion === taskConfigVersion,
      );
      if (!configVersion) {
        this.logger.error(
          { taskKind, taskType, taskConfigVersion },
          "Task config version not found",
        );
        throw new Error(
          `Task kind '${taskKind}' type '${taskType}' version '${taskConfigVersion}' was not found`,
        );
      }
      result = configVersion;
    }

    const lastConfigVersion = configVersions.at(-1);
    if (lastConfigVersion == null) {
      this.logger.error(
        { taskKind, taskType, taskConfigVersion },
        "Task config last version was not found",
      );
      throw new Error(
        `Task kind '${taskKind}' type '${taskType}' last version was not found`,
      );
    }
    result = lastConfigVersion;
    this.ac.checkPermission(
      lastConfigVersion.taskConfigId,
      actingAgentId,
      permissions,
    );
    return result;
  }

  updateTaskConfig(
    update: Pick<TaskConfig, "taskKind" | "taskType"> &
      Partial<
        Pick<
          TaskConfig,
          | "description"
          | "intervalMs"
          | "taskConfigInput"
          | "runImmediately"
          | "maxRepeats"
          | "maxRetries"
          | "retryDelayMs"
          | "concurrencyMode"
        >
      >,
    actingAgentId: AgentIdValue,
  ) {
    const { taskKind, taskType } = update;
    this.logger.info(
      {
        taskKind,
        taskType,
        actingAgentId,
      },
      "Update task config",
    );

    const config = this.getTaskConfig(
      taskKind,
      taskType,
      actingAgentId,
      undefined,
      READ_WRITE_ACCESS,
    );

    const newConfigVersion = clone(config);

    const taskConfigVersion = config.taskConfigVersion + 1;
    const taskConfigId = taskConfigIdToValue({
      ...config,
      taskConfigVersion,
    });
    updateDeepPartialObject(newConfigVersion, {
      ...update,
      taskConfigId,
      taskConfigVersion,
    });
    const configVersions = this.getTaskConfigTypeMap(taskKind, taskType);
    configVersions.push(newConfigVersion);

    this.ac.createResource(taskConfigId, config.ownerAgentId, actingAgentId);
    this.ac.createPermissions(
      taskConfigId,
      config.ownerAgentId,
      READ_EXECUTE_ACCESS,
      actingAgentId,
    );

    this.stateLogger.logTaskConfigUpdate({
      taskType: taskSomeIdToTypeValue(newConfigVersion),
      taskConfigId: newConfigVersion.taskConfigId,
      config: newConfigVersion,
    });

    this.persist();
    return newConfigVersion;
  }

  destroyTaskConfig(
    taskKind: TaskKindEnum,
    taskType: TaskTypeValue,
    actingAgentId: AgentIdValue,
  ): void {
    this.logger.info(
      { taskKind, taskType, actingAgentId },
      "Destroying agent configuration",
    );

    const configVersions = this.getTaskConfigMap(taskKind).get(taskType);
    if (!configVersions) {
      this.logger.error(
        { taskKind, taskType },
        "Task config versions was not found",
      );
      throw new Error(
        `Task kind '${taskKind}' type '${taskType}' config versions was not found`,
      );
    }

    let index = 0;
    for (const { taskConfigVersion, taskConfigId } of configVersions) {
      this.ac.checkPermission(taskConfigId, actingAgentId, READ_WRITE_ACCESS);
      const stats = this.getPoolStatsByVersion(
        taskKind,
        taskType,
        taskConfigVersion,
        actingAgentId,
      );
      if (stats.active) {
        this.logger.error(
          { taskKind, taskType, stats },
          "Task config can't be destroyed while it is still has active runs",
        );
        throw new Error(
          `Task config kind '${taskKind}' type '${taskType}' version '${taskConfigVersion}' can't be destroyed while it is still has active runs.`,
        );
      }
      configVersions.splice(index, 1)[0];
      this.logger.info(
        {
          taskConfigId,
          taskKind,
          taskType,
          taskConfigVersion,
        },
        "Task config destroyed successfully",
      );

      this.stateLogger.logTaskConfigDestroy({
        taskConfigId,
        taskType,
      });

      this.ac.removeResource(taskConfigId, actingAgentId);

      const [poolStats, versions] = this.getPoolStats(
        taskKind,
        taskType,
        actingAgentId,
      );
      this.stateLogger.logPoolChange({
        taskTypeId: taskSomeIdToTypeValue({ taskKind, taskType }),
        poolStats,
        versions,
      });

      index++;
    }

    if (!configVersions.length) {
      this.getTaskConfigMap(taskKind).delete(taskType);
      this.ac.removeResource(
        taskSomeIdToTypeValue({ taskKind, taskType }),
        actingAgentId,
      );
    }

    if (!this.getTaskConfigMap(taskKind).size) {
      this.taskConfigs.delete(taskKind);
    }

    this.persist();
  }

  getTaskConfigs(actingAgentId: AgentIdValue, filter?: { kind: TaskKindEnum }) {
    this.logger.info({ actingAgentId }, "Getting all task configs");

    const all = Array.from(this.taskConfigs.values())
      .map((taskKindConfig) => Array.from(taskKindConfig.values()))
      .flat(2)
      .filter((taskConfig) =>
        this.ac.hasPermission(
          taskConfig.taskConfigId,
          actingAgentId,
          READ_ONLY_ACCESS,
        ),
      );

    if (filter) {
      return all.filter((t) => t.taskKind === filter.kind);
    }

    return all;
  }

  createTaskRun(
    taskKind: TaskKindEnum,
    taskType: TaskTypeValue,
    taskRunKind: TaskRunKindEnum,
    taskRunInput: string,
    actingAgentId: AgentIdValue,
    options?: {
      signal?: AbortSignal;
      originTaskRunId?: TaskRunIdValue;
      blockedByTaskRunIds?: TaskRunIdValue[];
    },
  ): TaskRun {
    this.logger.debug(
      {
        taskKind,
        taskType,
        actingAgentId,
      },
      "Creating new task run",
    );

    const config = this.getTaskConfig(
      taskKind,
      taskType,
      actingAgentId,
      undefined,
      READ_EXECUTE_ACCESS,
    );

    this.ac.checkPermission(
      config.taskConfigId,
      actingAgentId,
      READ_EXECUTE_ACCESS,
    );

    const { taskConfigVersion } = config;
    const versionPoolStats = this.getPoolStatsByVersion(
      taskKind,
      taskType,
      taskConfigVersion,
      actingAgentId,
    );
    const taskRunNum = versionPoolStats.total + 1;
    const taskRunId = taskRunIdToString({
      taskKind,
      taskType,
      taskRunNum,
      taskConfigVersion,
    });

    const types = this.registeredAgentTypes.get(config.agentKind);
    if (!types || !types.includes(config.agentType)) {
      throw new Error(
        `Unregistered task type for task.agentKind:${config.agentKind} task.agentType: ${config.agentType}`,
      );
    }

    // Hack: Automatically set originTaskRun as blocked if there is no other blocked by task run to prevent stuck
    const blockedByTaskRunIds = options?.blockedByTaskRunIds?.length
      ? options.blockedByTaskRunIds
      : options?.originTaskRunId
        ? [options?.originTaskRunId]
        : [];

    if (blockedByTaskRunIds?.length) {
      const notFoundTaskRuns = blockedByTaskRunIds.filter(
        (taskRunId) => this.taskRuns.get(taskRunId) == null,
      );
      if (notFoundTaskRuns.length) {
        throw new Error(
          `Undefined task run ids: ${notFoundTaskRuns.join(",")}`,
        );
      }
    }

    const hasUnfinishedBlockingTasks = !!blockedByTaskRunIds.filter(
      (id) => (options?.originTaskRunId ?? taskRunId) !== id,
    ).length;
    const input = serializeTaskRunInput(
      {
        context: `You are acting on behalf of task \`${taskRunId}\`:\n${config.description}`,
        input: taskRunInput,
        options: {
          hasUnfinishedBlockingTasks,
        },
      },
      taskKind,
    );

    const originTaskRunId = options?.originTaskRunId ?? taskRunId;
    const baseTaskRun: BaseTaskRun = {
      taskKind,
      taskType,
      taskRunId,
      originTaskRunId,
      taskConfigVersion: config.taskConfigVersion,
      taskRunNum,
      taskRunInput: input,
      config: clone(config),
      status: "CREATED",
      currentRetryAttempt: 0,
      isOccupied: false,
      errorCount: 0,
      ownerAgentId: config.ownerAgentId,
      completedRuns: 0,
      currentTrajectory: [],
      history: [],
      isDependent: false,
      blockedByTaskRunIds,
      blockingTaskRunIds: [],
    };

    let taskRun: InteractionTaskRun | AutomaticTaskRun;
    if (taskRunKind === "interaction") {
      const interactionTaskRun: InteractionTaskRun = {
        ...baseTaskRun,
        taskRunKind: "interaction",
        interactionStatus: "PENDING",
      };
      taskRun = interactionTaskRun;
    } else {
      const automaticTaskRun: AutomaticTaskRun = {
        ...baseTaskRun,
        taskRunKind: "automatic",
      };
      taskRun = automaticTaskRun;
    }

    this.taskRuns.set(taskRunId, {
      abortScope: new AbortScope({
        parentSignal: options?.signal,
        onAbort: () => {
          this.logger.info(
            { taskRunId, actingAgentId },
            "Aborting task interval",
          );
          this.abortTaskRun(taskRunId);
        },
      }),
      intervalId: null,
      ...taskRun,
    });

    this.stateLogger.logTaskRunCreate({
      taskConfigId: baseTaskRun.config.taskConfigId,
      taskRunId,
      taskRun,
    });

    if (!this.ac.hasResource(taskRunId, actingAgentId, actingAgentId)) {
      this.ac.createResource(taskRunId, actingAgentId, actingAgentId);
    }

    if (blockedByTaskRunIds) {
      for (const blockedByTaskRunId of blockedByTaskRunIds) {
        const blockedByTaskRun = this.getTaskRun(
          blockedByTaskRunId,
          actingAgentId,
          WRITE_ONLY_ACCESS,
        );
        this._updateTaskRun(blockedByTaskRunId, blockedByTaskRun, {
          blockingTaskRunIds: [taskRunId],
        });
      }
    }

    const pool = this.getTaskTypeVersionSetsArray(taskKind, taskType)!;
    let poolVersionSetArrayItem = pool.find((p) => p[0] === taskConfigVersion);
    if (!poolVersionSetArrayItem) {
      poolVersionSetArrayItem = [taskConfigVersion, new Set([])];
      pool.push(poolVersionSetArrayItem);
    }
    poolVersionSetArrayItem[1].add(taskRunId);
    this.logger.trace(
      { taskKind, taskType, taskConfigVersion, taskRunId },
      "Added task to pool",
    );

    const [poolStats, versions] = this.getPoolStats(
      taskKind,
      taskType,
      actingAgentId,
    );
    this.stateLogger.logPoolChange({
      taskTypeId: taskSomeIdToTypeValue({ taskKind, taskType }),
      poolStats,
      versions,
    });

    if (config.runImmediately) {
      this.scheduleStartTaskRun(taskRunId, actingAgentId, {
        initiatingTaskRunId: originTaskRunId,
      });
    }

    return taskRun;
  }

  scheduleStartInteractionBlockingTaskRuns(
    interactionTaskRunId: TaskRunIdValue,
    actingAgentId: string,
    options?: {
      signal?: AbortSignal;
      manualStart?: boolean;
    },
  ) {
    this.logger.info(
      { interactionTaskRunId },
      "Schedule interaction blocking task runs start",
    );

    const interactionTaskRun = this.getTaskRun(
      interactionTaskRunId,
      actingAgentId,
    );

    return this.scheduleStartTaskRuns(
      interactionTaskRun.blockingTaskRunIds,
      actingAgentId,
      {
        ...options,
        initiatingTaskRunId: interactionTaskRunId,
      },
    );
  }

  scheduleStartTaskRuns(
    taskRunIds: TaskRunIdValue[],
    actingAgentId: string,
    options?: {
      initiatingTaskRunId?: TaskRunIdValue;
      signal?: AbortSignal;
      manualStart?: boolean;
    },
  ): OperationResult[] {
    return taskRunIds.map((taskRunId) =>
      this.scheduleStartTaskRun(taskRunId, actingAgentId, options),
    );
  }

  /**
   * Schedule task to start as soon as possible.
   * Only owners and admins can start/stop tasks.
   */
  scheduleStartTaskRun(
    taskRunId: TaskRunIdValue,
    actingAgentId: AgentIdValue,
    options?: {
      initiatingTaskRunId?: TaskRunIdValue;
      signal?: AbortSignal;
      manualStart?: boolean;
    },
  ): OperationResult {
    this.logger.info({ taskRunId, actingAgentId }, "Schedule task run start");
    this.ac.checkPermission(taskRunId, actingAgentId, FULL_ACCESS);

    let initiatingTaskRunId = options?.initiatingTaskRunId;

    const taskRun = this.getTaskRun(taskRunId, TASK_MANAGER_USER);
    // Validate initial task run
    if (taskRun.taskRunKind === "automatic") {
      if (!initiatingTaskRunId) {
        throw new Error(
          `Automatic task runs require a specified 'initiatingTaskRunId' attribute`,
        );
      } else {
        // Check initial task run kind
        const initiatingTaskRun = this.getTaskRun(
          initiatingTaskRunId,
          TASK_MANAGER_USER,
        );
        if (initiatingTaskRun.taskRunKind !== "interaction") {
          throw new Error(
            `Invalid initiating task run kind '${initiatingTaskRun.taskRunKind}'. Initiating task run must be '${TaskRunKindEnumSchema.Values.interaction}'`,
          );
        }
      }
    } else {
      initiatingTaskRunId = taskRun.taskRunId;
    }

    if (options?.manualStart) {
      const blockedTaskRuns = this.collectBlockedTaskRuns(
        taskRun.blockedByTaskRunIds,
      );
      if (blockedTaskRuns.length) {
        this.logger.error(
          { taskRunId, blockedTaskRuns },
          "Start blocking task attempt error",
        );
        throw new Error(
          `Start depending task attempt error. The task run is blocked by ${JSON.stringify(blockedTaskRuns)}`,
        );
      }
    }

    const { taskKind, taskType, taskConfigVersion } = taskRun;

    const versionPoolStats = this.getPoolStatsByVersion(
      taskKind,
      taskType,
      taskConfigVersion,
      actingAgentId,
    );

    if (versionPoolStats.active >= versionPoolStats.poolSize) {
      this.logger.trace(
        { taskKind, taskType, taskConfigVersion },
        "Task pool population is full",
      );
      return {
        relatedId: taskRunId,
        success: false,
        errorMessage:
          "Task pool population is full you have to wait until running task is finished.",
      };
    }

    this._updateTaskRun(taskRunId, taskRun, {
      status: "SCHEDULED",
      initiatingTaskRunId,
    });
    if (options?.signal) {
      taskRun.abortScope.switchSignal(options.signal);
    }

    this.scheduledTasksToStart.push({
      taskRunId,
      actingAgentId,
    });
    this.startTaskProcessing();

    return {
      relatedId: taskRunId,
      success: true,
    };
  }

  private collectBlockedTaskRuns(
    blockedTaskRunIds: TaskRunIdValue[],
    visited: TaskRunIdValue[] = [],
  ) {
    const result: {
      taskRunId: TaskRunIdValue;
      status: TaskRunStatusEnum;
      blocking: TaskRunIdValue[];
    }[] = [];
    for (const blockedTaskRunId of blockedTaskRunIds) {
      if (visited.includes(blockedTaskRunId)) {
        // Skip visited
        continue;
      }

      const blockedByTaskRun = this.getTaskRun(
        blockedTaskRunId,
        TASK_MANAGER_USER,
      );
      visited.push(blockedTaskRunId);

      if (
        blockedByTaskRun.status === "CREATED" &&
        blockedByTaskRun.blockedByTaskRunIds.length
      ) {
        result.push(
          ...this.collectBlockedTaskRuns(
            blockedByTaskRun.blockedByTaskRunIds,
            visited,
          ),
        );
      } else {
        result.push({
          taskRunId: blockedByTaskRun.taskRunId,
          status: blockedByTaskRun.status,
          blocking: clone(visited),
        });
      }
    }
    return result;
  }

  stopTaskRun(
    taskRunId: TaskRunIdValue,
    actingAgentId: AgentIdValue,
    finalStatus: FinalStatus = "STOPPED",
  ): OperationResult {
    this.logger.info(
      { taskRunId, actingAgentId, finalStatus },
      "Stopping task",
    );
    this.ac.checkPermission(taskRunId, actingAgentId, READ_WRITE_ACCESS);

    const taskRun = this.getTaskRun(taskRunId, actingAgentId);
    if (taskRun.status === "STOPPED") {
      this.logger.debug({ taskRunId }, "Task is already stopped");
      return {
        relatedId: taskRunId,
        success: false,
        errorMessage: "Task is already stopped",
      };
    }

    // Use the task's abortScope to handle interval clearing
    if (taskRun.abortScope) {
      this.logger.debug({ taskRunId }, "Aborting task via AbortScope");
      taskRun.abortScope.clean(false);
    } else if (taskRun.intervalId) {
      // Fallback for tasks that don't have abortScope
      this.logger.debug({ taskRunId }, "Clearing task interval");
      clearInterval(taskRun.intervalId);
      taskRun.intervalId = null;
    }

    if (taskRun.isOccupied) {
      this.logger.debug({ taskRunId }, "Releasing task occupancy before stop");
      this.releaseTaskRunOccupancy(taskRunId, actingAgentId);
    }

    const closeInteraction = (
      interactionTaskRunId: TaskRunIdValue,
      finalStatus: FinalStatus,
    ) => {
      // Close interaction
      const interactionTaskRun = this.getTaskRun(
        interactionTaskRunId,
        TASK_MANAGER_USER,
      );
      if (!interactionTaskRun) {
        throw new Error(
          `Interaction task run \`${interactionTaskRun}\` is missing`,
        );
      }
      if (interactionTaskRun.taskRunKind != "interaction") {
        throw new Error(
          `Task run \`${interactionTaskRun}\` is not an interaction`,
        );
      }

      const hasFailed = finalStatus === "FAILED";

      const interactionChildrenTaskRuns =
        this._findInteractionChildrenTaskRuns(interactionTaskRunId);
      const hasUnfinishedChildrenTasks = !!interactionChildrenTaskRuns.filter(
        (childTaskRun) => !isTaskRunTerminationStatus(childTaskRun.status),
      ).length;

      if (hasFailed || !hasUnfinishedChildrenTasks) {
        let response;
        if (!hasFailed) {
          // Find last tasks in the hierarchy and collect their outputs
          const lastTasks = interactionChildrenTaskRuns.filter(
            (taskRun) => taskRun.blockingTaskRunIds.length === 0,
          );
          if (lastTasks.length) {
            response = lastTasks
              .map((taskRun) => taskRunOutput(taskRun, false))
              .join("\n\n");
          } else {
            response = taskRunOutput(interactionTaskRun);
          }
        } else {
          response = taskRunError(taskRun);
        }

        this._updateTaskRun(interactionTaskRun.taskRunId, interactionTaskRun, {
          interactionStatus: hasFailed ? "FAILED" : "COMPLETED",
          response,
        });
      }
    };

    let shouldCloseInteraction = false;
    let interactionTaskRunId;
    if (taskRun.taskRunKind === "interaction") {
      const interactionChildrenTaskRuns =
        this._findInteractionChildrenTaskRuns(taskRunId);
      if (finalStatus === "STOPPED" && interactionChildrenTaskRuns.length) {
        // Stopping children tasks
        for (const childTask of interactionChildrenTaskRuns) {
          this.stopTaskRun(childTask.taskRunId, actingAgentId, finalStatus);
        }
      } else {
        shouldCloseInteraction = true;
        interactionTaskRunId = taskRunId;
      }
    } else if (taskRun.taskRunKind === "automatic") {
      // Process blocking tasks
      if (taskRun.blockingTaskRunIds.length > 0) {
        for (const blockingTaskRunId of taskRun.blockingTaskRunIds) {
          const hasOtherUnfinishedBlockedTaskRuns =
            this.hasOtherUnfinishedBlockedTaskRuns(
              blockingTaskRunId,
              taskRunId,
            );

          const blockingTaskRun = this.getTaskRun(
            blockingTaskRunId,
            TASK_MANAGER_USER,
          );

          if (finalStatus === "FAILED") {
            // Abort blocking task runs when failed
            blockingTaskRun.abortScope?.abort();
          } else {
            // Pass output into blocking task input
            this._updateTaskRun(blockingTaskRunId, blockingTaskRun, {
              taskRunInput: extendBlockingTaskRunOutput(
                blockingTaskRun.taskRunInput,
                taskRunOutput(taskRun, false),
                hasOtherUnfinishedBlockedTaskRuns,
                taskRun.taskKind,
              ),
              originTaskRunId: taskRun.originTaskRunId,
            });

            if (!hasOtherUnfinishedBlockedTaskRuns) {
              if (!taskRun.initiatingTaskRunId) {
                throw new Error(
                  `Task run requires a specified 'initiatingTaskRunId' attribute`,
                );
              }

              // Task doesn't wait to any unfinished blocked task so we can start it
              this.scheduleStartTaskRun(blockingTaskRunId, TASK_MANAGER_USER, {
                initiatingTaskRunId: taskRun.initiatingTaskRunId,
                signal: taskRun.abortScope.signal,
              });
            }
          }
        }
      } else {
        shouldCloseInteraction = true;
        interactionTaskRunId = taskRun.initiatingTaskRunId! /* FIXME */;
      }
    }

    this._updateTaskRun(taskRunId, taskRun, {
      status: finalStatus,
      nextRunAt: undefined,
    });

    if (shouldCloseInteraction) {
      if (!interactionTaskRunId) {
        throw new Error(`Missing interaction task run ID`);
      }
      closeInteraction(interactionTaskRunId, finalStatus);
    }

    this.logger.info({ taskRunId, finalStatus }, "Task stopped successfully");

    return {
      relatedId: taskRunId,
      success: true,
    };
  }

  private hasOtherUnfinishedBlockedTaskRuns(
    taskRunId: TaskRunIdValue,
    currentBlockedTaskRunId: TaskRunIdValue,
  ) {
    const taskRun = this.getTaskRun(taskRunId, TASK_MANAGER_USER);
    for (const blockedTaskRunId of difference(taskRun.blockedByTaskRunIds, [
      currentBlockedTaskRunId,
    ])) {
      const blockedTaskRun = this.getTaskRun(
        blockedTaskRunId,
        TASK_MANAGER_USER,
      );
      if (!["COMPLETED", "STOPPED"].includes(blockedTaskRun.status)) {
        return true;
      }
    }

    return false;
  }

  destroyTaskRun(taskRunId: TaskRunIdValue, actingAgentId: AgentIdValue): void {
    this.logger.info(
      { taskRunId, actingAgentId },
      "Attempting to destroy task run",
    );
    this.ac.checkPermission(taskRunId, actingAgentId, WRITE_ONLY_ACCESS);

    const taskRun = this.taskRuns.get(taskRunId);
    if (!taskRun) {
      this.logger.error({ taskRunId }, "Task run not found for destruction");
      throw new Error(`Task run with ID '${taskRunId}' not found`);
    }

    if (taskRun.status === "EXECUTING") {
      this.logger.debug(
        { taskRunId },
        "Stopping executing task before removal",
      );
      this.stopTaskRun(taskRunId, actingAgentId);
    }

    if (taskRun.isOccupied) {
      this.logger.debug(
        { taskRunId },
        "Releasing task occupancy before removal",
      );
      this.releaseTaskRunOccupancy(taskRunId, actingAgentId);
    }

    if (taskRun.abortScope) {
      this.logger.debug({ taskRunId }, "Disposing task abort scope");
      taskRun.abortScope.dispose();
    }

    const {
      config: { taskKind, taskType, taskConfigVersion },
    } = taskRun;

    // Remove from pool if it's in one
    const poolSet = this.getTaskTypeVersionSet(
      taskKind,
      taskType,
      taskConfigVersion,
    );
    if (poolSet) {
      poolSet.delete(taskRunId);
      this.logger.trace(
        {
          taskRunId,
          taskKind,
          taskType,
          taskConfigVersion,
        },
        "Removed task run from pool",
      );
    } else {
      throw new Error(`Missing pool`);
    }

    if (!poolSet.size) {
      // Remove pool version array set item
      const poolVersionSetsArray = this.getTaskTypeVersionSetsArray(
        taskKind,
        taskType,
      )!;
      const poolVersionSet = poolVersionSetsArray.findIndex(
        (it) => it[0] === taskConfigVersion,
      );
      poolVersionSetsArray.splice(poolVersionSet, 1);
    }

    this.taskRuns.delete(taskRunId);
    this.logger.info(
      {
        taskKind,
        taskType,
        taskConfigVersion,
      },
      "Task run destroyed successfully",
    );

    this.stateLogger.logTaskRunDestroy({
      taskRunId,
    });

    const [poolStats, versions] = this.getPoolStats(
      taskKind,
      taskType,
      actingAgentId,
    );
    this.stateLogger.logPoolChange({
      taskTypeId: taskSomeIdToTypeValue(taskRun),
      poolStats,
      versions,
    });
  }

  private findTaskRunsOwnedBy(
    agentId: AgentIdValue,
    actingAgentId: AgentIdValue,
  ) {
    this.logger.info(
      { agentId, actingAgentId },
      "Looking for running tasks owned by agent",
    );
    const result = [];
    for (const task of this.taskRuns.values()) {
      if (task.ownerAgentId === agentId) {
        this.ac.checkPermission(
          task.taskRunId,
          actingAgentId,
          READ_ONLY_ACCESS,
        );
        result.push(clone(task));
      }
    }

    return result;
  }

  findInteractionChildrenTaskRuns(
    interactionTaskRunId: TaskRunIdValue,
    actingAgentId: AgentIdValue,
  ) {
    this.ac.checkPermission(
      interactionTaskRunId,
      actingAgentId,
      READ_ONLY_ACCESS,
    );
    return this._findInteractionChildrenTaskRuns(interactionTaskRunId);
  }

  private _findInteractionChildrenTaskRuns(
    interactionTaskRunId: TaskRunIdValue,
  ) {
    this.logger.info(
      { interactionTaskRunId },
      `Looking for task runs initiate by interaction task run`,
    );
    const result = [];
    for (const taskRun of this.taskRuns.values()) {
      if (
        taskRun.initiatingTaskRunId === interactionTaskRunId &&
        taskRun.taskRunId !== interactionTaskRunId
      ) {
        result.push(taskRun);
      }
    }

    return result;
  }

  private abortTaskRun(
    taskRunId: TaskRunIdValue,
    actingAgentId?: AgentIdValue,
  ) {
    this.logger.info({ taskRunId, actingAgentId }, "Task execution aborted");

    const taskRun = this.getTaskRun(taskRunId, TASK_MANAGER_USER);

    // Update task status to reflect abortion
    this._updateTaskRun(taskRunId, taskRun, {
      status: TaskRunStatusEnumSchema.enum.ABORTED,
      nextRunAt: undefined,
    });

    if (actingAgentId) {
      // Record abortion in task history
      this.addHistoryEntry(taskRunId, actingAgentId, {
        timestamp: new Date(),
        terminalStatus: "ABORTED",
        error: "Task execution aborted",
        runNumber: taskRun.completedRuns,
        maxRuns: taskRun.config.maxRepeats,
        retryAttempt: taskRun.currentRetryAttempt,
        maxRepeats: taskRun.config.maxRepeats,
        agentId: actingAgentId,
        trajectory: clone(taskRun.currentTrajectory || []),
        executionTimeMs: taskRun.startRunAt
          ? Date.now() - taskRun.startRunAt?.getTime()
          : -1,
      });

      // Release any resources
      if (taskRun.isOccupied) {
        this.releaseTaskRunOccupancy(taskRunId, actingAgentId);
      }
    }
  }

  private setTaskRunAwaitingAgent(taskRunId: TaskRunIdValue) {
    this.logger.info({ taskRunId }, "Setting task run awaiting agent");

    const taskRun = this.getTaskRun(taskRunId, TASK_MANAGER_USER);
    if (taskRun.status === TaskRunStatusEnumSchema.enum.AWAITING_AGENT) {
      this.logger.debug({ taskRunId }, "It's already awaiting - skip");
      return;
    }

    this._updateTaskRun(taskRunId, taskRun, {
      status: TaskRunStatusEnumSchema.enum.AWAITING_AGENT,
    });

    this.awaitingTasksForAgents.push({
      taskRunId,
      agentTypeId: agentSomeIdToTypeValue({
        agentKind: taskRun.config.agentKind,
        agentType: taskRun.config.agentType,
        agentConfigVersion: taskRun.config.agentConfigVersion,
      }),
    });
  }

  /**
   * Sets task as occupied.
   * Only authorized agents can occupy tasks.
   */
  private setTaskRunOccupied(
    taskRunId: TaskRunIdValue,
    actingAgentId: AgentIdValue,
  ): boolean {
    this.logger.info(
      { taskRunId, agentId: actingAgentId },
      "Setting task run as occupied",
    );
    this.ac.createPermissions(
      taskRunId,
      actingAgentId,
      FULL_ACCESS,
      TASK_MANAGER_USER,
    );

    const taskRun = this.getTaskRun(taskRunId, actingAgentId);
    if (taskRun.isOccupied) {
      this.logger.debug(
        {
          taskRunId,
          exists: !!taskRun,
        },
        "Task not available for occupancy",
      );
      return false;
    }

    const occupiedSince = new Date();
    this._updateTaskRun(taskRunId, taskRun, {
      isOccupied: true,
      occupiedSince,
      currentAgentId: actingAgentId,
    });

    const assignment = clone(omit(taskRun, ["intervalId"]));

    this.agentStateLogger.logTaskAssigned({
      agentId: actingAgentId,
      assignment,
      assignmentId: taskRunId,
      assignedSince: occupiedSince,
    });

    if (this.options.occupancyTimeoutMs) {
      this.logger.debug(
        {
          taskRunId,
          timeoutMs: this.options.occupancyTimeoutMs,
        },
        "Setting occupancy timeout",
      );

      // Use the task's abort scope for the timeout
      taskRun.abortScope?.setTimeout(() => {
        this.releaseTaskRunOccupancy(taskRunId, TASK_MANAGER_USER);
      }, this.options.occupancyTimeoutMs);
    }

    this.logger.info(
      { taskRunId, actingAgentId },
      "Task occupied successfully",
    );
    return true;
  }

  /**
   * Releases task run occupancy.
   * Only the current agent or owners can release occupancy.
   */
  private releaseTaskRunOccupancy(
    taskRunId: TaskRunIdValue,
    actingAgentId: AgentIdValue,
  ): boolean {
    this.logger.info(
      { taskRunId, agentId: actingAgentId },
      "Releasing task occupancy",
    );

    const taskRun = this.getTaskRun(taskRunId, actingAgentId);
    if (!taskRun || !taskRun.isOccupied) {
      this.logger.debug(
        { taskRunId, exists: !!taskRun },
        "Task not available for release",
      );
      return false;
    }

    const unassignedAt = new Date();
    this._updateTaskRun(taskRunId, taskRun, {
      isOccupied: false,
      occupiedSince: null,
      currentAgentId: null,
    });

    this.ac.removePermissions(taskRunId, actingAgentId, TASK_MANAGER_USER);

    this.agentStateLogger.logTaskUnassigned({
      agentId: actingAgentId,
      assignmentId: taskRunId,
      unassignedAt,
    });

    this.logger.info({ taskRunId }, "Task occupancy released successfully");
    return true;
  }

  agentAvailable(
    agentKind: AgentKindEnum,
    agentType: AgentTypeValue,
    agentConfigVersion: AgentConfigVersionValue,
    availableCount: number,
  ) {
    if (!this.agentAvailable.length) {
      return;
    }
    let rest = availableCount;
    let index = 0;
    const awaitingTasks = clone(this.awaitingTasksForAgents);
    for (const { taskRunId, agentTypeId } of awaitingTasks) {
      if (
        agentTypeId !==
        agentSomeIdToTypeValue({ agentKind, agentType, agentConfigVersion })
      ) {
        index++;
        continue;
      }

      this.awaitingTasksForAgents.splice(index, 1);

      const taskRun = this.getTaskRun(taskRunId, TASK_MANAGER_USER);
      this.scheduleStartTaskRun(taskRunId, TASK_MANAGER_USER, {
        initiatingTaskRunId: taskRun.initiatingTaskRunId,
      });
      rest--;
      if (!rest) {
        return;
      }
      index++;
    }
  }

  addBlockingTaskRuns(
    taskRunId: TaskRunIdValue,
    blockingTaskRunIds: TaskRunIdValue[],
    actingAgentId: AgentIdValue,
  ) {
    this.logger.info(
      { taskRunId, actingAgentId, blockingTaskRunIds },
      "Add blocking task run",
    );

    for (const blockingTaskRunId of blockingTaskRunIds) {
      const blockingTaskRun = this.getTaskRun(
        blockingTaskRunId,
        actingAgentId,
        WRITE_ONLY_ACCESS,
      );
      this._updateTaskRun(blockingTaskRunId, blockingTaskRun, {
        blockedByTaskRunIds: [taskRunId],
      });
    }

    const taskRun = this.getTaskRun(
      taskRunId,
      actingAgentId,
      WRITE_ONLY_ACCESS,
    );

    return this._updateTaskRun(taskRunId, taskRun, {
      blockingTaskRunIds,
    });
  }

  /**
   * Update task status
   */
  updateTaskRun(
    taskRunId: TaskRunIdValue,
    update: Partial<Pick<TaskRun, "taskRunInput">>,
    actingAgentId: AgentIdValue,
  ) {
    this.logger.info(
      { taskRunId, actingAgentId, update },
      "Updating task status",
    );
    const taskRun = this.getTaskRun(
      taskRunId,
      actingAgentId,
      WRITE_ONLY_ACCESS,
    );
    return this._updateTaskRun(taskRunId, taskRun, update);
  }

  private _updateTaskRun(
    taskRunId: TaskRunIdValue,
    taskRun: TaskRun,
    update: Partial<TaskRun>,
  ): TaskRun {
    const modifiedUpdate = clone(update);
    if (modifiedUpdate.currentTrajectory) {
      modifiedUpdate.currentTrajectory = taskRun.currentTrajectory.concat(
        modifiedUpdate.currentTrajectory,
      );
    }
    if (modifiedUpdate.blockedByTaskRunIds) {
      modifiedUpdate.blockedByTaskRunIds = taskRun.blockedByTaskRunIds.concat(
        modifiedUpdate.blockedByTaskRunIds,
      );

      if (modifiedUpdate.blockedByTaskRunIds.length) {
        modifiedUpdate.isDependent = true;
      }
    }

    if (modifiedUpdate.blockingTaskRunIds) {
      modifiedUpdate.blockingTaskRunIds = taskRun.blockingTaskRunIds.concat(
        modifiedUpdate.blockingTaskRunIds,
      );
    }
    updateDeepPartialObject(taskRun, modifiedUpdate);
    this.stateLogger.logTaskRunUpdate({ taskRunId, taskRun: update });
    if (update.status) {
      const { taskKind, taskType } = taskRun;
      const [poolStats, versions] = this.getPoolStats(
        taskKind,
        taskType,
        TASK_MANAGER_USER,
      );
      this.stateLogger.logPoolChange({
        taskTypeId: taskSomeIdToTypeValue({ taskKind, taskType }),
        poolStats,
        versions,
      });
    }
    return taskRun;
  }

  /**
   * Gets all task runs visible to the agent.
   */
  getTaskRuns(
    agentId: AgentIdValue,
    filter?: { taskKind: TaskKindValue; taskType?: TaskTypeValue },
  ): TaskRun[] {
    this.logger.info({ agentId }, "Getting all task runs");

    const taskRuns = Array.from(this.taskRuns.values()).filter((taskRun) => {
      // First check permission
      const hasPermission = this.ac.hasPermission(
        taskRun.taskRunId,
        agentId,
        READ_ONLY_ACCESS,
      );

      if (!hasPermission) {
        return false;
      }

      // Then apply additional filters if they exist
      if (filter) {
        // Always filter by taskKind
        if (taskRun.taskKind !== filter.taskKind) {
          return false;
        }

        // Optionally filter by taskType if provided
        if (filter.taskType && taskRun.taskType !== filter.taskType) {
          return false;
        }
      }

      return true;
    });

    this.logger.debug(
      { agentId, count: taskRuns.length },
      "Retrieved task runs",
    );
    return taskRuns;
  }

  /**
   * Checks if a task is currently occupied.
   */
  isTaskRunOccupied(taskRunId: TaskRunIdValue, agentId: AgentIdValue): boolean {
    this.logger.debug({ taskRunId, agentId }, "Checking task occupancy");
    this.ac.checkPermission(taskRunId, agentId, READ_ONLY_ACCESS);

    const task = this.taskRuns.get(taskRunId);
    if (!task) {
      this.logger.error({ taskRunId }, "Task not found");
      throw new Error(`Undefined taskRunId: ${taskRunId}`);
    }

    return task.isOccupied;
  }

  /**
   * Executes a task with retry logic and records history.
   * @private
   */
  private async executeTask(
    taskRunId: TaskRunIdValue,
    actingAgentId: AgentIdValue,
  ): Promise<void> {
    this.logger.info({ taskRunId, agentId: actingAgentId }, "Executing task");
    this.ac.checkPermission(taskRunId, actingAgentId, READ_EXECUTE_ACCESS);

    const taskRun = this.getTaskRun(taskRunId, actingAgentId);

    // Check if the task's abort scope is already aborted
    if (taskRun.abortScope?.isAborted()) {
      this.logger.info({ taskRunId }, "Task execution aborted before start");
      return;
    }

    const retryAttempt = taskRun.currentRetryAttempt;
    if (retryAttempt > 0) {
      this.logger.debug(
        { retryAttempt, maxRetries: taskRun.config.maxRetries },
        "Retry attempt",
      );
      if (
        !!taskRun.config.maxRetries &&
        retryAttempt >= taskRun.config.maxRetries
      ) {
        this.logger.warn({ taskRunId }, "Last retry attempt");
      }
    }

    if (taskRun.status === "COMPLETED" || taskRun.isOccupied) {
      this.logger.debug(
        {
          taskRunId,
          reason: taskRun.status === "COMPLETED" ? "completed" : "occupied",
        },
        "Skipping task execution",
      );
      return;
    }

    const executionController =
      taskRun.abortScope?.createChildController() || new AbortController();
    const executionSignal = executionController.signal;

    const startAt = new Date();
    const startTime = startAt.getTime();

    try {
      this._updateTaskRun(taskRunId, taskRun, {
        status: "EXECUTING",
        startRunAt: startAt,
        lastRunAt: startAt,
        nextRunAt:
          taskRun.config.maxRepeats != null &&
          taskRun.completedRuns < taskRun.config.maxRepeats
            ? new Date(Date.now() + taskRun.config.intervalMs)
            : undefined,
      });

      this.emit("task_run:start", clone(taskRun));

      this.logger.debug(
        {
          taskRunId,
          lastRunAt: taskRun.lastRunAt,
          nextRunAt: taskRun.nextRunAt,
        },
        "Executing task callback",
      );

      const emit = this.emit.bind(this);

      // Check for abortion before proceeding
      if (executionSignal.aborted) {
        throw new AbortError();
      }

      // Add last interaction output to the agent memory
      let addToMemory: (AssistantMessage | ToolMessage)[] | undefined =
        undefined;
      if (taskRun.taskRunKind === "interaction") {
        const allTerminatedInteractionTaskRuns = this.getTaskRuns(
          TASK_MANAGER_USER,
          {
            taskKind: taskRun.taskKind,
            taskType: taskRun.taskType,
          },
        ).filter((taskRun) =>
          isTaskRunTerminationStatus(taskRun.status),
        ) as InteractionTaskRun[];
        const lastTaskRun = allTerminatedInteractionTaskRuns.length
          ? allTerminatedInteractionTaskRuns.at(-1)
          : null;
        if (lastTaskRun?.response) {
          addToMemory = [
            new AssistantMessage(
              `The full final response of the previous interaction task \`${lastTaskRun.taskRunId}\` (NOTE: This message is the result of different tool calls that are not provided before this message to save costs):\n${lastTaskRun.response}`,
            ),
          ];
        }
      }

      const logger = this.logger;
      // Wrap the onTaskStart call with abort handling
      await Promise.race([
        this.onTaskStart(
          taskRun,
          this,
          {
            onAwaitingAgentAcquired(taskRunId, taskManager) {
              logger.debug({ taskRunId }, "Awaiting to agent acquired");
              // Check if aborted before making state changes
              if (executionSignal.aborted) {
                return;
              }
              taskManager.setTaskRunAwaitingAgent(taskRunId);
            },
            onAgentAcquired(taskRunId, agentId, taskManager) {
              logger.debug({ taskRunId, agentId }, "Agent acquired");
              // Check if aborted before making state changes
              if (executionSignal.aborted) {
                return;
              }
              taskManager.setTaskRunOccupied(taskRunId, agentId);
            },
            onAgentUpdate(key, value, taskRunId, agentId, taskManager) {
              logger.debug({ key, value, taskRunId, agentId }, "Agent update");
              // Check if aborted before making state changes
              if (executionSignal.aborted) {
                return;
              }
              const taskRun = taskManager.getTaskRun(
                taskRunId,
                agentId,
                READ_WRITE_ACCESS,
              );
              taskManager._updateTaskRun(taskRunId, taskRun, {
                currentTrajectory: [
                  { timestamp: new Date(), agentId, key, value },
                ],
              });
              emit("task_run:trajectory_update", clone(taskRun));
            },
            onAgentComplete(output, taskRunId, agentId, taskManager) {
              logger.debug({ taskRunId, agentId }, "Agent complete");
              // Check if aborted before making state changes
              if (executionSignal.aborted) {
                return;
              }

              const taskRun = taskManager.getTaskRun(
                taskRunId,
                agentId,
                READ_WRITE_ACCESS,
              );
              const trajectory = clone(taskRun.currentTrajectory);
              taskManager._updateTaskRun(taskRunId, taskRun, {
                completedRuns: taskRun.completedRuns + 1,
                currentTrajectory: [],
              });

              // Record history entry
              taskManager.addHistoryEntry(taskRunId, agentId, {
                timestamp: new Date(),
                terminalStatus: "COMPLETED",
                output,
                runNumber: taskRun.completedRuns,
                maxRuns: taskRun.config.maxRepeats,
                retryAttempt: taskRun.currentRetryAttempt,
                maxRepeats: taskRun.config.maxRepeats,
                agentId: agentId,
                trajectory,
                executionTimeMs: Date.now() - startTime,
              });

              emit("task_run:complete", clone(taskRun));

              taskManager.logger.debug(
                {
                  taskRunId,
                  completedRuns: taskRun.completedRuns,
                  maxRuns: taskRun.config.maxRepeats,
                },
                "Task executed successfully",
              );

              // Check if we've reached maxRuns
              if (
                !taskRun.config.maxRepeats ||
                (taskRun.config.maxRepeats &&
                  taskRun.completedRuns >= taskRun.config.maxRepeats)
              ) {
                taskManager.stopTaskRun(taskRunId, agentId, "COMPLETED");
                taskManager.logger.info(
                  {
                    taskRunId,
                    completedRuns: taskRun.completedRuns,
                    maxRuns: taskRun.config.maxRepeats,
                  },
                  "Task reached maximum runs and has been stopped",
                );
              } else {
                taskManager.releaseTaskRunOccupancy(taskRunId, agentId);
              }
            },
            async onAgentError(err, taskRunId, agentId, taskManager) {
              logger.debug({ taskRunId, agentId, err }, "Agent error");
              // Check if aborted before making state changes
              if (executionSignal.aborted) {
                return;
              }

              const error = err instanceof Error ? err.message : String(err);
              const taskRun = taskManager.getTaskRun(taskRunId, agentId);
              const trajectory = clone(taskRun.currentTrajectory);

              taskManager._updateTaskRun(taskRunId, taskRun, {
                errorCount: taskRun.errorCount + 1,
                completedRuns: taskRun.completedRuns + 1,
                currentTrajectory: [],
              });
              const retryAttempt = taskRun.currentRetryAttempt;

              // Record history entry
              taskManager.addHistoryEntry(taskRunId, agentId, {
                timestamp: new Date(),
                terminalStatus: "FAILED",
                error,
                runNumber: taskRun.completedRuns,
                maxRuns: taskRun.config.maxRepeats,
                retryAttempt,
                maxRepeats: taskRun.config.maxRepeats,
                agentId: agentId,
                trajectory,
                executionTimeMs: Date.now() - startTime,
              });

              emit("task_run:error", clone(taskRun));

              taskManager.logger.error(
                {
                  taskRunId,
                  runNumber: taskRun.completedRuns,
                  maxRuns: taskRun.config.maxRepeats,
                  retryAttempt,
                  maxRepeats: taskRun.config.maxRepeats,
                  errorCount: taskRun.errorCount,
                  error,
                },
                `Task execution failed ${error}`,
              );

              if (taskManager.options.errorHandler) {
                taskManager.options.errorHandler(err as Error, taskRunId);
              }

              taskManager.logger.debug(
                { taskRunId },
                "Releasing task occupancy before removal",
              );

              if (retryAttempt >= (taskRun.config.maxRetries || 2)) {
                taskManager.stopTaskRun(taskRunId, agentId, "FAILED");
              } else {
                taskManager.releaseTaskRunOccupancy(taskRunId, agentId);
                taskManager._updateTaskRun(taskRunId, taskRun, {
                  currentRetryAttempt: retryAttempt + 1,
                  status: "FAILED",
                });

                taskManager.scheduleStartTaskRun(
                  taskRunId,
                  taskRun.config.ownerAgentId,
                  {
                    initiatingTaskRunId: taskRun.initiatingTaskRunId!,
                  },
                );
              }
            },
          },
          addToMemory,
        ),
        // Create a promise that rejects when the abort signal is triggered
        new Promise<never>((_, reject) => {
          executionSignal.addEventListener(
            "abort",
            () => {
              reject(new AbortError("Task execution was aborted"));
            },
            { once: true },
          );
        }),
      ]);
    } catch (err) {
      if (err instanceof AbortError) {
        this.abortTaskRun(taskRunId, actingAgentId);
      } else {
        // Forward error to error handler
        if (this.options.errorHandler) {
          this.options.errorHandler(err as Error, taskRunId);
        }

        // Log the error
        this.logger.error(
          { err, taskRunId, actingAgentId },
          "Unexpected error during task execution",
        );
      }

      // Rethrow for upstream handlers
      throw err;
    } finally {
      // No manual cleanup needed - the child controller will be properly
      // garbage collected once this function exits, and if we need to
      // abort it explicitly, that's already handled in the catch blocks
    }
  }

  /**
   * Add a history entry for a task
   * @private
   */
  private addHistoryEntry(
    taskRunId: TaskRunIdValue,
    actingAgentId: AgentIdValue,
    entry: TaskRunHistoryEntry,
  ): void {
    const taskRun = this.getTaskRun(taskRunId, actingAgentId);
    taskRun.history.push(entry);
    this.stateLogger.logTaskHistoryEntryCreate({ taskRunId, entry });
    this.agentStateLogger.logTaskHistoryEntry({
      agentId: actingAgentId,
      entry,
      assignmentId: taskRunId,
    });

    // Trim history if it exceeds maximum entries
    const maxEntries =
      taskRun.maxHistoryEntries ?? this.options.maxHistoryEntries;
    if (maxEntries && taskRun.history.length > maxEntries) {
      taskRun.history = taskRun.history.slice(-maxEntries);
    }
  }

  /**
   * Gets task history entries
   * Agents can only view history for their authorized tasks
   */
  getTaskRunHistory(
    taskRunId: TaskRunIdValue,
    actingAgentId: AgentIdValue,
    options: {
      limit?: number;
      startDate?: Date;
      endDate?: Date;
      status?: TaskRunTerminalStatusEnum;
    } = {},
  ): TaskRunHistoryEntry[] {
    this.logger.trace(
      {
        taskRunId,
        agentId: actingAgentId,
        options,
      },
      "Getting task history",
    );
    this.ac.checkPermission(taskRunId, actingAgentId, READ_ONLY_ACCESS);

    const taskRun = this.getTaskRun(taskRunId, actingAgentId);
    let history = taskRun.history;

    // Apply filters
    if (options.startDate) {
      history = history.filter(
        (entry) => entry.timestamp >= options.startDate!,
      );
    }
    if (options.endDate) {
      history = history.filter((entry) => entry.timestamp <= options.endDate!);
    }
    if (options.status) {
      history = history.filter((entry) => entry.terminalStatus === status);
    }
    if (options.limit) {
      history = history.slice(-options.limit);
    }

    return history;
  }

  dispose() {
    this.logger.debug("Disposing TaskManager");
    if (this.disposed) {
      return;
    }

    // Stop task processing first
    this.stopTaskProcessing();

    // Clean up all task-specific abort scopes
    for (const taskRun of this.taskRuns.values()) {
      if (taskRun.abortScope) {
        taskRun.abortScope.dispose();
      }
    }

    this.emitter.removeAllListeners();
    this._emitter = null;

    this.abortScope.dispose();
    this._abortScope = null;

    this.options.errorHandler = undefined;
    this._options = null;

    this._stateLogger = null;
    this._agentStateLogger = null;

    this.ac.dispose();
    this._ac = null;

    this.registeredAgentTypes.clear();
    this._registeredAgentTypes = null;

    this.awaitingTasksForAgents.splice(0);
    this._awaitingTasksForAgents = null;

    this.scheduledTasksToStart.splice(0);
    this._scheduledTasksToStart = null;

    this.taskPools.forEach((kindMap) => {
      kindMap.forEach((typeArray) => {
        typeArray.forEach((t) => {
          t[1].clear();
        });
        typeArray.splice(0);
      });
      kindMap.clear();
    });
    this.taskPools.clear();
    this._taskPools = null;

    this.taskRuns.forEach((r) => {
      r.abortScope.dispose();
      if (r.intervalId) {
        clearInterval(r.intervalId);
      }
      r.intervalId = null;
    });
    this.taskRuns.clear();
    this._taskRuns = null;

    this.taskConfigs.forEach((k) => {
      k.forEach((c) => c.splice(0));
      k.clear();
    });
    this.taskConfigs.clear();
    this._taskConfigs = null;

    super.dispose();
  }
}
