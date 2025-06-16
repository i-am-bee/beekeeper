import {
  ActingAgentIdValueSchema,
  TaskConfig,
  TaskConfigSchema,
  TaskKindEnumSchema,
  TaskTypeValueSchema,
} from "@/tasks/manager/dto.js";
import { TaskManager } from "@/tasks/manager/manager.js";
import { ServiceLocator } from "@/utils/service-locator.js";
import { Emitter } from "beeai-framework/emitter/emitter";
import {
  JSONToolOutput,
  Tool,
  ToolEmitter,
  ToolInput,
} from "beeai-framework/tools/base";
import { z } from "zod";

export const TOOL_NAME = "task_config_initializer";

export interface TaskConfigInitializerToolResult {
  method: "createTaskConfig" | "updateTaskConfig";
  success: true;
  data: TaskConfig;
}

export const CreateTaskConfigSchema = z
  .object({
    method: z.literal("createTaskConfig"),
    config: TaskConfigSchema.omit({
      concurrencyMode: true,
      taskConfigId: true,
      taskConfigVersion: true,
      ownerAgentId: true,
      runImmediately: true,
      intervalMs: true,
      agentConfigVersion: true,
    }),
    actingAgentId: ActingAgentIdValueSchema,
  })
  .describe("Creates a new task configuration.");

export const UpdateTaskConfigSchema = z
  .object({
    method: z.literal("updateTaskConfig"),
    taskKind: TaskKindEnumSchema,
    taskType: TaskTypeValueSchema,
    config: TaskConfigSchema.partial().pick({
      taskConfigInput: true,
      description: true,
      intervalMs: true,
      runImmediately: true,
      maxRepeats: true,
      maxRetries: true,
      retryDelayMs: true,
      concurrencyMode: true,
    }),
    actingAgentId: ActingAgentIdValueSchema,
  })
  .describe("Update an existing task configuration.");

export class TaskConfigInitializerTool extends Tool<
  JSONToolOutput<TaskConfigInitializerToolResult>
> {
  name = "task_manager";
  description =
    "The TaskConfigInitializer provides functionalities to create a task config.";

  static {
    this.register();
  }

  public readonly emitter: ToolEmitter<
    ToolInput<this>,
    JSONToolOutput<TaskConfigInitializerToolResult>
  > = Emitter.root.child({
    namespace: ["tool", "task_manager"],
    creator: this,
  });

  private get taskManager() {
    // Weak reference to the task manager
    return ServiceLocator.getInstance().get(TaskManager);
  }

  inputSchema() {
    return z.discriminatedUnion("method", [
      CreateTaskConfigSchema,
      UpdateTaskConfigSchema,
    ]);
  }

  protected async _run(input: ToolInput<this>) {
    let data: TaskConfig;
    switch (input.method) {
      case "createTaskConfig": {
        const { actingAgentId, config: taskConfig } = input;
        data = this.taskManager.createTaskConfig(
          {
            ...taskConfig,
            runImmediately: false,
            concurrencyMode: "PARALLEL",
            intervalMs: 0,
            agentConfigVersion: 0,
          },
          actingAgentId,
          actingAgentId,
        );
        break;
      }

      case "updateTaskConfig": {
        const { config: config, taskKind, taskType, actingAgentId } = input;
        data = this.taskManager.updateTaskConfig(
          { ...config, taskKind, taskType },
          actingAgentId,
        );
        break;
      }
    }
    return new JSONToolOutput({
      method: input.method,
      success: true,
      data,
    } satisfies TaskConfigInitializerToolResult);
  }
}
