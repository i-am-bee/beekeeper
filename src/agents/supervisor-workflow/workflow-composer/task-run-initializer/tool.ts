import {
  ActingAgentIdValueSchema,
  TaskRun,
  TaskRunIdValueSchema,
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

export const TOOL_NAME = "task_run_initializer";

export interface TaskRunInitializerToolResult {
  method: "createTaskRun";
  success: true;
  data: TaskRun;
}

export const CreateTaskRunSchema = z
  .object({
    method: z.literal("createTaskRun"),
    taskType: TaskTypeValueSchema,
    actingAgentId: ActingAgentIdValueSchema,
    taskRunInput: z.string().describe(`Task input specific for the run.`),
    originTaskRunId: TaskRunIdValueSchema,
    blockedByTaskRunIds: z
      .array(TaskRunIdValueSchema)
      .describe(
        "IDs of task runs that blocks this task run and will whose outputs this task receive",
      ),
  })
  .describe("Creates a new task run from task configuration.");

export class TaskRunInitializerTool extends Tool<
  JSONToolOutput<TaskRunInitializerToolResult>
> {
  name = "task_manager";
  description =
    "The TaskRunInitializer provides functionalities to create a task run.";

  static {
    this.register();
  }

  public readonly emitter: ToolEmitter<
    ToolInput<this>,
    JSONToolOutput<TaskRunInitializerToolResult>
  > = Emitter.root.child({
    namespace: ["tool", TOOL_NAME],
    creator: this,
  });

  private get taskManager() {
    // Weak reference to the task manager
    return ServiceLocator.getInstance().get(TaskManager);
  }

  inputSchema() {
    return z.discriminatedUnion("method", [CreateTaskRunSchema]);
  }

  protected async _run(input: ToolInput<this>) {
    let data: TaskRun;
    switch (input.method) {
      case "createTaskRun": {
        const {
          actingAgentId,
          taskType,
          taskRunInput,
          originTaskRunId,
          blockedByTaskRunIds,
        } = input;
        data = this.taskManager.createTaskRun(
          "operator",
          taskType,
          "automatic",
          taskRunInput,
          actingAgentId,
          {
            originTaskRunId,
            blockedByTaskRunIds,
          },
        );
        break;
      }
    }
    return new JSONToolOutput({
      method: input.method,
      success: true,
      data,
    } satisfies TaskRunInitializerToolResult);
  }
}
