import { AgentWithInstance } from "@/agents/registry/dto.js";
import { AgentRegistry } from "@/agents/registry/registry.js";
import { PROCESS_AND_PLAN_TASK_NAME } from "@/agents/supervisor.js";
import { RuntimeOutput } from "@/runtime/dto.js";
import {
  isTaskRunActiveStatus,
  TaskRun,
  TaskRunIdValue,
} from "@/tasks/manager/dto.js";
import {
  taskRunError,
  taskRunInteractionResponse,
  taskRunOutput,
} from "@/tasks/manager/helpers.js";
import { TaskManager } from "@/tasks/manager/manager.js";
import { AbortError, AbortScope } from "@/utils/abort-scope.js";
import { Logger } from "beeai-framework";
import { BeeAgent } from "beeai-framework/agents/bee/agent";

export const RUNTIME_USER = "runtime_user";
export type RuntimeOutputMethod = (output: RuntimeOutput) => Promise<void>;

export interface RuntimeConfig {
  pollingIntervalMs: number;
  timeoutMs: number;
  agentRegistry: AgentRegistry<unknown>;
  taskManager: TaskManager;
  supervisor: AgentWithInstance<BeeAgent>;
  logger: Logger;
}

export class Runtime {
  protected readonly logger: Logger;

  private pollingIntervalMs: number;
  private timeoutMs: number;

  private agentRegistry: AgentRegistry<unknown>;
  private taskManager: TaskManager;
  private supervisor: AgentWithInstance<BeeAgent>;
  private _isRunning = false;
  private abortScope: AbortScope;

  get isRunning() {
    return this._isRunning;
  }

  constructor({
    agentRegistry,
    taskManager,
    supervisor,
    pollingIntervalMs,
    timeoutMs,
    logger,
  }: RuntimeConfig) {
    this.logger = logger.child({
      name: this.constructor.name,
    });

    this.agentRegistry = agentRegistry;
    this.pollingIntervalMs = pollingIntervalMs;
    this.timeoutMs = timeoutMs;
    this.taskManager = taskManager;
    this.supervisor = supervisor;
    this.abortScope = new AbortScope();

    this.taskManager.addAdmin(RUNTIME_USER);
  }

  async run(input: string, output: RuntimeOutputMethod) {
    this.logger.info("Try to start runtime process...");
    if (this._isRunning) {
      throw new Error(`Runtime is already running`);
    }

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
      this._isRunning = false;
    }
  }

  private async waitUntilTaskRunFinish(...args: Parameters<typeof this.run>) {
    const [input, outputMethod] = args;
    const start = new Date();
    const timeout = new Date(start.getTime() + this.timeoutMs);
    const timeoutTime = timeout.getTime();

    this.logger.info(
      { input, start, timeout, timeoutMs: this.timeoutMs },
      "Starting processing finish task run",
    );

    const getAgent = (taskRun: TaskRun) => {
      const agentId = taskRun.currentAgentId;
      if (!agentId) {
        throw new Error(
          `Missing current agent id on taskRun:${taskRun.taskRunId}`,
        );
      }
      return this.agentRegistry.getAgent(agentId);
    };

    const onTaskRunStart = (taskRun: TaskRun) => {
      this.logger.debug({ taskRunId: taskRun.taskRunId }, "Task run started");
      outputMethod({
        kind: "progress",
        taskRun,
        text: `Starting task \`${taskRun.taskType}\`\n- ${taskRun.config.description}`,
      });
    };
    this.taskManager.on("task_run:start", onTaskRunStart);

    const onTaskRunTrajectoryUpdate = (taskRun: TaskRun) => {
      this.logger.debug(
        { taskRunId: taskRun.taskRunId },
        "Task run trajectory updated",
      );
      outputMethod({
        kind: "progress",
        taskRun,
        text: taskRun.currentTrajectory.at(-1)?.value || "",
      });
    };
    this.taskManager.on(
      "task_run:trajectory_update",
      onTaskRunTrajectoryUpdate,
    );

    const onTaskRunError = (taskRun: TaskRun) => {
      this.logger.debug({ taskRunId: taskRun.taskRunId }, "Task run failed");
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
      this.logger.debug({ taskRunId: taskRun.taskRunId }, "Task run completed");
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
      let taskRunId: TaskRunIdValue | null = null;
      while (true) {
        this.logger.debug(`waiting...`);

        if (!taskRunId) {
          const taskRun = this.taskManager.createTaskRun(
            "supervisor",
            PROCESS_AND_PLAN_TASK_NAME,
            "interaction",
            input,
            this.supervisor.agentId,
          );
          taskRunId = taskRun.taskRunId;
        }
        const restMs = timeoutTime - Date.now();
        // Check if we've exceeded the timeout
        if (restMs <= 0) {
          this.logger.error(
            { taskRunId },
            "Timeout waiting for finish supervisor run",
          );
          throw new Error(
            `Timeout waiting for finish supervisor run ${taskRunId}`,
          );
        }

        const runningTaskRuns = this.taskManager.findTaskRunsOwnedBy(
          this.supervisor.agentId,
          this.supervisor.agentId,
        );
        const taskRun = runningTaskRuns.find((t) => t.taskRunId === taskRunId);
        if (!taskRun) {
          throw new Error(`Can't find taskRunId:${taskRunId}`);
        }

        const active = runningTaskRuns.filter((tr) =>
          isTaskRunActiveStatus(tr.status),
        );
        if (!active.length) {
          this.logger.debug(
            `There are ${active.length} unfinished task. Closing loop.`,
          );
          const taskRun = this.taskManager.getTaskRun(taskRunId, RUNTIME_USER);
          if (taskRun.status === "ABORTED") {
            return `Task was aborted`;
          } else if (taskRun.status === "FAILED") {
            return `Task was failed`;
          }

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
            `There are ${active.length} active tasks. Keeping loop...`,
          );
        }

        //Sleep for polling
        await this.abortScope.sleep(this.pollingIntervalMs);
      }
    } catch (err) {
      this.logger.error(err);
      throw err;
    } finally {
      this.abortScope.reset();
      this.taskManager.off("task_run:start", onTaskRunStart);
      this.taskManager.off("task_run:error", onTaskRunError);
      this.taskManager.off("task_run:complete", onTaskRunComplete);
      this.taskManager.off(
        "task_run:trajectory_update",
        onTaskRunTrajectoryUpdate,
      );
    }
  }
}
