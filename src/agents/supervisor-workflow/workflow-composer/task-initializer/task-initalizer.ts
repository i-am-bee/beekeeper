import { AgentRegistry } from "@/agents/registry/registry.js";
import { TaskManager } from "@/tasks/manager/manager.js";
import { ServiceLocator } from "@/utils/service-locator.js";
import { Logger } from "beeai-framework";
import { Context } from "../../base/context.js";
import { Runnable } from "../../base/runnable.js";
import { AgentConfigInitializer } from "./agent-config-initializer/agent-config-initializer.js";
import { TaskInitializerOutput } from "./dto.js";
import { TaskConfigInitializer } from "./task-config-initializer/task-config-initializer.js";

export interface TaskInitializerRun {
  task: string;
}

export class TaskInitializer extends Runnable<
  TaskInitializerRun,
  TaskInitializerOutput
> {
  protected agentConfigInitialized: AgentConfigInitializer;
  protected taskConfigInitialized: TaskConfigInitializer;
  protected agentRegistry: AgentRegistry<unknown>;
  protected taskManager: TaskManager;

  constructor(logger: Logger) {
    super(logger);
    this.agentConfigInitialized = new AgentConfigInitializer(logger);
    this.taskConfigInitialized = new TaskConfigInitializer(logger);
    this.agentRegistry = ServiceLocator.getInstance().get(AgentRegistry);
    this.taskManager = ServiceLocator.getInstance().get(TaskManager);
  }

  async run(
    { task }: TaskInitializerRun,
    ctx: Context,
  ): Promise<TaskInitializerOutput> {
    const { supervisorAgentId } = ctx;

    // Agent config
    const availableTools = Array.from(
      this.agentRegistry.getToolsFactory("operator").availableTools.values(),
    );
    const existingAgentConfigs = this.agentRegistry.getAgentConfigs({
      kind: "operator",
    });

    const { output: agentConfigOutput } = await this.agentConfigInitialized.run(
      {
        userMessage: task,
        systemPrompt: {
          availableTools,
          existingAgentConfigs,
          task: task,
        },
      },
      ctx,
    );
    if (agentConfigOutput.type === "ERROR") {
      return agentConfigOutput;
    }
    const agentConfig = agentConfigOutput.result;

    // Task config
    const existingTaskConfigs = this.taskManager.getAllTaskConfigs(
      supervisorAgentId,
      { kind: "operator" },
    );
    const { output: taskConfigOutput } = await this.taskConfigInitialized.run(
      {
        userMessage: task,
        systemPrompt: {
          existingTaskConfigs,
          actingAgentId: supervisorAgentId,
          existingAgentConfigs: [agentConfig],
          task,
        },
      },
      ctx,
    );

    if (taskConfigOutput.type === "ERROR") {
      return taskConfigOutput;
    }

    const taskConfig = this.taskManager.getTaskConfig(
      "operator",
      taskConfigOutput.result.taskType,
      supervisorAgentId,
    );

    return {
      type: "SUCCESS",
      result: taskConfig,
    };
  }
}
