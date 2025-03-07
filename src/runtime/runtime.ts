import { AgentWithInstance } from "@/agents/registry/dto.js";
import { AgentRegistry } from "@/agents/registry/registry.js";
import { PROCESS_AND_PLAN_TASK_NAME } from "@/agents/supervisor.js";
import { isTaskRunTerminationStatus, TaskRun } from "@/tasks/manager/dto.js";
import {
  taskRunInteractionResponse as taskRunInteractionResponse,
  taskRunError,
  taskRunOutput,
} from "@/tasks/manager/helpers.js";
import { TaskManager } from "@/tasks/manager/manager.js";
import { Logger } from "beeai-framework";
import { BeeAgent } from "beeai-framework/agents/bee/agent";
import { RuntimeOutput } from "@/runtime/dto.js";
import { AbortError, AbortScope } from "@/utils/abort-scope.js";

export const RUNTIME_USER = "runtime_user";
export type RuntimeOutputMethod = (output: RuntimeOutput) => Promise<void>;

export interface RuntimeConfig {
  pollingIntervalMs: number;
  timeoutMs: number;

  agentRegistry: AgentRegistry<unknown>;
  taskManager: TaskManager;
  supervisor: AgentWithInstance<BeeAgent>;
}

export class Runtime {
  protected readonly logger: Logger;

  private pollingIntervalMs: number;
  private timeoutMs: number;

  private agentRegistry: AgentRegistry<unknown>;
  private taskManager: TaskManager;
  private supervisor: AgentWithInstance<BeeAgent>;
  private _isRunning = false;
  private abortScope: AbortScope | null = null;

  get isRunning() {
    return this._isRunning;
  }

  constructor({
    agentRegistry,
    taskManager,
    supervisor,
    pollingIntervalMs,
    timeoutMs,
  }: RuntimeConfig) {
    this.logger = Logger.root.child({ name: this.constructor.name });

    this.agentRegistry = agentRegistry;
    this.pollingIntervalMs = pollingIntervalMs;
    this.timeoutMs = timeoutMs;
    this.taskManager = taskManager;
    this.supervisor = supervisor;

    this.taskManager.addAdmin(RUNTIME_USER);
  }

  async run(input: string, output: RuntimeOutputMethod, signal?: AbortSignal) {
    this.logger.info("Try to start runtime process...");
    if (this._isRunning) {
      throw new Error(`Runtime is already running`);
    }

    // Create the AbortScope for this run
    this.abortScope = new AbortScope(signal);

    try {
      this._isRunning = true;
      this.logger.info("Starting runtime process...");
      const response = await this.waitUntilTaskRunFinish(input, output);
      this.logger.info("Process completed successfully");
      return response;
    } catch (error) {
      if (error instanceof AbortError) {
        this.logger.info("Runtime process aborted");
      } else {
        this.logger.error(error, "Error in runtime process:");
      }
      throw error;
    } finally {
      // Clean up the abort scope
      if (this.abortScope) {
        this.abortScope.dispose();
        this.abortScope = null;
      }
      this._isRunning = false;
    }
  }

  private async waitUntilTaskRunFinish(...args: Parameters<typeof this.run>) {
    // Make sure we have an abort scope
    if (!this.abortScope) {
      throw new Error("AbortScope not initialized. Call run() first.");
    }
    this.abortScope.checkIsAborted();

    const [input, outputMethod] = args;
    const start = new Date();
    const timeout = new Date(start.getTime() + this.timeoutMs);
    const timeoutTime = timeout.getTime();

    this.logger.info(
      { input, start, timeout, timeoutMs: this.timeoutMs },
      "Starting processing finish task run"
    );

    const getAgent = (taskRun: TaskRun) => {
      const agentId = taskRun.currentAgentId;
      if (!agentId) {
        throw new Error(
          `Missing current agent id on taskRun:${taskRun.taskRunId}`
        );
      }
      return this.agentRegistry.getAgent(agentId);
    };

    const onTaskRunStart = (taskRun: TaskRun) => {
      this.abortScope?.checkIsAborted();
      outputMethod({
        kind: "progress",
        taskRun,
        text: `Starting task \`${taskRun.taskType}\`\n- ${taskRun.config.description}`,
      });
    };
    this.taskManager.on("task_run:start", onTaskRunStart);

    const onTaskRunTrajectoryUpdate = (taskRun: TaskRun) => {
      this.abortScope?.checkIsAborted();
      outputMethod({
        kind: "progress",
        taskRun,
        text: taskRun.currentTrajectory.at(-1)?.value || "",
      });
    };
    this.taskManager.on(
      "task_run:trajectory_update",
      onTaskRunTrajectoryUpdate
    );

    const onTaskRunError = (taskRun: TaskRun) => {
      this.abortScope?.checkIsAborted();
      const agent = getAgent(taskRun);
      outputMethod({
        kind: "progress",
        taskRun,
        agent,
        text: taskRunError(taskRun),
      });
    };
    this.taskManager.on("task_run:error", onTaskRunError);

    const onTaskRunComplete = (taskRun: TaskRun) => {
      this.abortScope?.checkIsAborted();
      const agent = getAgent(taskRun);
      outputMethod({
        kind: "progress",
        taskRun,
        agent,
        text: taskRunOutput(taskRun),
      });
    };
    this.taskManager.on("task_run:complete", onTaskRunComplete);

    try {
      let taskRunId;
      while (true) {
        this.abortScope.checkIsAborted();

        if (!taskRunId) {
          const taskRun = this.taskManager.createTaskRun(
            "supervisor",
            PROCESS_AND_PLAN_TASK_NAME,
            "interaction",
            input,
            this.supervisor.agentId
          );
          taskRunId = taskRun.taskRunId;
        }
        const restMs = timeoutTime - Date.now();
        // Check if we've exceeded the timeout
        if (restMs <= 0) {
          this.logger.error(
            { taskRunId },
            "Timeout waiting for finish supervisor run"
          );
          throw new Error(
            `Timeout waiting for finish supervisor run ${taskRunId}`
          );
        }

        const runningTaskRuns = this.taskManager.findTaskRunsOwnedBy(
          this.supervisor.agentId,
          this.supervisor.agentId
        );
        const unfinished = runningTaskRuns.filter(
          (tr) => !isTaskRunTerminationStatus(tr.status)
        );
        if (!unfinished.length) {
          this.logger.debug(
            `There are ${unfinished.length} unfinished task. Closing loop.`
          );
          const taskRun = this.taskManager.getTaskRun(taskRunId, RUNTIME_USER);
          const response = taskRunInteractionResponse(taskRun);
          outputMethod({
            kind: "final",
            taskRun,
            agent: this.supervisor,
            text: response,
          });
          return response;
        } else {
          this.logger.debug(
            `There are ${unfinished.length} unfinished tasks. Keeping loop...`
          );
        }

        //Sleep for polling
        await this.abortScope.sleep(this.pollingIntervalMs);
      }
    } finally {
      this.taskManager.off("task_run:start", onTaskRunStart);
      this.taskManager.off("task_run:error", onTaskRunError);
      this.taskManager.off("task_run:complete", onTaskRunComplete);
      this.taskManager.off(
        "task_run:trajectory_update",
        onTaskRunTrajectoryUpdate
      );
    }
  }
}
