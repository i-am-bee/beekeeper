import { AgentRegistry } from "@/agents/registry/registry.js";
import { TaskManager } from "@/tasks/manager/manager.js";
import { ServiceLocator } from "@/utils/service-locator.js";
import { Logger } from "beeai-framework";
import { Context } from "../../base/context.js";
import { Runnable } from "../../base/runnable.js";
import { AgentConfigInitializer } from "./agent-config-initializer/agent-config-initializer.js";
import { TaskInitializerOutput } from "./dto.js";
import { TaskConfigInitializer } from "./task-config-initializer/task-config-initializer.js";
import { AgentIdValue } from "@/agents/registry/dto.js";

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

  constructor(logger: Logger, agentId: AgentIdValue) {
    super(logger, agentId);
    this.agentConfigInitialized = new AgentConfigInitializer(logger, agentId);
    this.taskConfigInitialized = new TaskConfigInitializer(logger, agentId);
    this.agentRegistry = ServiceLocator.getInstance().get(AgentRegistry);
    this.taskManager = ServiceLocator.getInstance().get(TaskManager);
  }

  async run(
    { task }: TaskInitializerRun,
    ctx: Context,
  ): Promise<TaskInitializerOutput> {
    const { agentId: supervisorAgentId, onUpdate } = ctx;

    // Agent config
    const availableTools = Array.from(
      this.agentRegistry.getToolsFactory("operator").availableTools.values(),
    );
    const existingAgentConfigs = this.agentRegistry.getAgentConfigs({
      kind: "operator",
    });

    const agentData = {
      availableTools,
      existingAgentConfigs,
      task: task,
    };

    this.handleOnUpdate(onUpdate, `Initializing agent config for \`${task}\``);
    this.handleOnUpdate(onUpdate, JSON.stringify(agentData, null, " "));

    const { output: agentConfigOutput } = await this.agentConfigInitialized.run(
      {
        userMessage: task,
        data: agentData,
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

    const taskData = {
      existingTaskConfigs,
      actingAgentId: supervisorAgentId,
      existingAgentConfigs: [agentConfig],
      task,
    };

    this.handleOnUpdate(onUpdate, `Initializing task config for \`${task}\``);
    this.handleOnUpdate(onUpdate, JSON.stringify(taskData, null, " "));

    const { output: taskConfigOutput } = await this.taskConfigInitialized.run(
      {
        userMessage: task,
        data: taskData,
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
