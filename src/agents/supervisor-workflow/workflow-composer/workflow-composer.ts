import { AgentIdValue } from "@/agents/registry/dto.js";
import { AgentRegistry } from "@/agents/registry/registry.js";
import { TaskManager } from "@/tasks/manager/manager.js";
import { ServiceLocator } from "@/utils/service-locator.js";
import { Logger } from "beeai-framework";
import { Context } from "../base/context.js";
import { Runnable } from "../base/runnable.js";
import {
  TaskStep,
  WorkflowComposerInput,
  WorkflowComposerOutput,
} from "./dto.js";
import { ProblemDecomposer } from "./problem-decomposer/problem-decomposer.js";
import { TaskInitializer } from "./task-initializer/task-initalizer.js";
import { TaskConfig } from "@/tasks/manager/dto.js";
import { FnResult } from "../base/retry/types.js";

export class WorkflowComposer extends Runnable<
  WorkflowComposerInput,
  FnResult<WorkflowComposerOutput>
> {
  protected agentRegistry: AgentRegistry<unknown>;
  protected taskManager: TaskManager;
  protected problemDecomposer: ProblemDecomposer;
  protected taskInitializer: TaskInitializer;

  constructor(logger: Logger, agentId: AgentIdValue) {
    super(logger, agentId);
    this.agentRegistry = ServiceLocator.getInstance().get(AgentRegistry);
    this.taskManager = ServiceLocator.getInstance().get(TaskManager);
    this.problemDecomposer = new ProblemDecomposer(logger, agentId);
    this.taskInitializer = new TaskInitializer(logger, agentId);
  }

  async run(
    input: WorkflowComposerInput,
    ctx: Context,
  ): Promise<FnResult<WorkflowComposerOutput>> {
    const { onUpdate } = ctx;

    const availableTools = Array.from(
      this.agentRegistry.getToolsFactory("operator").availableTools.values(),
    );
    const existingAgents = this.agentRegistry.getAgentConfigs({
      kind: "operator",
    });

    const problemDecomposerRunResult =
      await this.problemDecomposer.run(
        {
          userMessage: input.input,
          data: {
            availableTools,
            existingAgents,
            request: input.input,
          },
        },
        ctx,
      );

    if (problemDecomposerRunResult.type === "ERROR") {
      this.handleOnUpdate(
        onUpdate,
        `Problem decomposition failed: ${problemDecomposerRunResult.explanation}`,
      );
      return {
        type: "ERROR",
        explanation: `Problem decomposition failed: ${problemDecomposerRunResult.explanation}`,
      };
    }
    const { result: problemDecomposerResult } = problemDecomposerRunResult;

    this.handleOnUpdate(onUpdate, `Initializing tasks`);

    const taskRuns: TaskConfig[] = [];
    const previousSteps: TaskStep[] = [];
    for (const taskStep of problemDecomposerResult) {
      const taskInitializerOutput = await this.taskInitializer.run(
        { taskStep, previousSteps },
        ctx,
      );

      if (taskInitializerOutput.type === "ERROR") {
        return taskInitializerOutput;
      }

      const taskConfig = taskInitializerOutput.result.taskConfig;
      const taskStepWithAgent = taskInitializerOutput.result.taskStep;
      taskRuns.push(taskConfig);
      previousSteps.push(taskStepWithAgent);
      this.handleOnUpdate(
        onUpdate,
        `Task \`${taskConfig.taskType}\` initialized`,
      );
      this.handleOnUpdate(onUpdate, JSON.stringify(taskConfig, null, " "));
    }

    return {
      type: "SUCCESS",
      result: taskRuns,
    };
  }
}
