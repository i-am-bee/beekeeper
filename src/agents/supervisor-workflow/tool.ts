import { OperationResult } from "@/base/dto.js";
import {
  ActingAgentIdValueSchema,
  TaskRunIdValueSchema,
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

export const TOOL_NAME = "task_run_starter";

export interface TaskRunStarterToolResult {
  method: "scheduleStartInteractionBlockingTaskRuns";
  success: true;
  data: OperationResult[];
}

export const ScheduleStartInteractionBlockingTaskRunsSchema = z
  .object({
    method: z.literal("scheduleStartInteractionBlockingTaskRuns"),
    interactionTaskRunId: TaskRunIdValueSchema.describe(
      `The interaction task run ID`,
    ),
    actingAgentId: ActingAgentIdValueSchema,
  })
  .describe(
    "Schedules starts of all blocking task runs that are blocked by the the interaction task run simultaneously.",
  );

export class TaskRunStarterTool extends Tool<
  JSONToolOutput<TaskRunStarterToolResult>
> {
  name = TOOL_NAME;
  description = `The ${TOOL_NAME} provides functionalities to schedule start of a task run.`;

  static {
    this.register();
  }

  public readonly emitter: ToolEmitter<
    ToolInput<this>,
    JSONToolOutput<TaskRunStarterToolResult>
  > = Emitter.root.child({
    namespace: ["tool", TOOL_NAME],
    creator: this,
  });

  private get taskManager() {
    // Weak reference to the task manager
    return ServiceLocator.getInstance().get(TaskManager);
  }

  inputSchema() {
    return z.discriminatedUnion("method", [
      ScheduleStartInteractionBlockingTaskRunsSchema,
    ]);
  }

  protected async _run(input: ToolInput<this>) {
    let data: OperationResult[];
    switch (input.method) {
      case "scheduleStartInteractionBlockingTaskRuns": {
        const { interactionTaskRunId, actingAgentId } = input;
        data = this.taskManager.scheduleStartInteractionBlockingTaskRuns(
          interactionTaskRunId,
          actingAgentId,
        );
        break;
      }
    }
    return new JSONToolOutput({
      method: input.method,
      success: true,
      data,
    } satisfies TaskRunStarterToolResult);
  }
}
