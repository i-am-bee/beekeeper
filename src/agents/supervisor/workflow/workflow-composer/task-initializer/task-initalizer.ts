import { AgentIdValue } from "@/agents/registry/dto.js";
import { AgentRegistry } from "@/agents/registry/registry.js";
import { TaskManager } from "@/tasks/manager/manager.js";
import { ServiceLocator } from "@/utils/service-locator.js";
import { Logger } from "beeai-framework";
import { Context } from "../../base/context.js";
import { FnResult } from "../../base/retry/types.js";
import { Runnable } from "../../base/runnable.js";
import { TaskStepMapper } from "../helpers/task-step/task-step-mapper.js";
import { AgentConfigInitializer } from "./agent-config-initializer/agent-config-initializer.js";
import { TaskInitializerInput, TaskInitializerOutput } from "./dto.js";
import { TaskConfigInitializer } from "./task-config-initializer/task-config-initializer.js";

export class TaskInitializer extends Runnable<
  TaskInitializerInput,
  FnResult<TaskInitializerOutput>
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
    { taskStep, previousSteps, resources }: TaskInitializerInput,
    ctx: Context,
  ): Promise<FnResult<TaskInitializerOutput>> {
    const { actingAgentId, onUpdate } = ctx;
    this.handleOnUpdate(
      onUpdate,
      `Initializing task step: \`${TaskStepMapper.format(taskStep)}\``,
    );

    const task = TaskStepMapper.format(taskStep);

    // this.handleOnUpdate(onUpdate, `Initializing agent config for \`${task}\``);
    // this.handleOnUpdate(onUpdate, JSON.stringify(agentData, null, " "));

    const agentConfigOutput = await this.agentConfigInitialized.run(
      {
        userMessage: task,
        data: {
          previousSteps,
          taskStep,
          resources,
        },
      },
      ctx,
    );
    if (agentConfigOutput.type === "ERROR") {
      return agentConfigOutput;
    }

    const {
      result: { taskStep: taskStepWithAgent, resources: resourcesWithAgent },
    } = agentConfigOutput;

    // this.handleOnUpdate(onUpdate, `Initializing task config for \`${task}\``);
    // this.handleOnUpdate(onUpdate, JSON.stringify(taskData, null, " "));

    const taskConfigOutput = await this.taskConfigInitialized.run(
      {
        userMessage: TaskStepMapper.format(taskStepWithAgent),
        data: {
          resources: resourcesWithAgent,
          previousSteps,
          taskStep: taskStepWithAgent,
          actingAgentId,
        },
      },
      ctx,
    );

    if (taskConfigOutput.type === "ERROR") {
      return taskConfigOutput;
    }

    const {
      result: { taskStep: taskStepWithTask, resources: resourcesWithTask },
    } = taskConfigOutput;

    return {
      type: "SUCCESS",
      result: {
        resources: resourcesWithTask,
        taskStep: taskStepWithTask,
      },
    };
  }
}
