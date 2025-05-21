import { TaskConfig } from "@/tasks/manager/dto.js";
import { Logger } from "beeai-framework";
import { Context } from "../base/context.js";
import { Runnable } from "../base/runnable.js";
import { WorkflowComposerInput, WorkflowComposerOutput } from "./dto.js";
import { ProblemDecomposer } from "./problem-decomposer/problem-decomposer.js";
import { TaskInitializer } from "./task-initializer/task-initalizer.js";
import { AgentIdValue } from "@/agents/registry/dto.js";
import { AgentRegistry } from "@/agents/registry/registry.js";
import { ServiceLocator } from "@/utils/service-locator.js";
import { TaskManager } from "@/tasks/manager/manager.js";

export class WorkflowComposer extends Runnable<
  WorkflowComposerInput,
  WorkflowComposerOutput
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
  ): Promise<WorkflowComposerOutput> {
    const { onUpdate } = ctx;

    const availableTools = Array.from(
      this.agentRegistry.getToolsFactory("operator").availableTools.values(),
    );
    const existingAgents = this.agentRegistry.getAgentConfigs({
      kind: "operator",
    });

    this.handleOnUpdate(onUpdate, `Decomposing problem`);

    const { output: problemDecomposerOutput } =
      await this.problemDecomposer.run(
        {
          userMessage: input.input,
          data: {
            input: input.input,
            availableTools,
            existingAgents,
          },
        },
        ctx,
      );
    if (problemDecomposerOutput.type === "ERROR") {
      return problemDecomposerOutput;
    }

    this.handleOnUpdate(onUpdate, `Initializing tasks`);

    const taskRuns: TaskConfig[] = [];
    for (const task of problemDecomposerOutput.result) {
      const taskInitializerOutput = await this.taskInitializer.run(
        { task },
        ctx,
      );

      if (taskInitializerOutput.type === "ERROR") {
        return taskInitializerOutput;
      }

      taskRuns.push(taskInitializerOutput.result);
    }

    return {
      type: "SUCCESS",
      result: taskRuns,
    };
  }
}
