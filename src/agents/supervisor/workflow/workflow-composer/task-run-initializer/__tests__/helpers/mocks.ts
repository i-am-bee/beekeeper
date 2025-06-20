import { addTaskRunMissingAttrs } from "@/agents/supervisor/workflow/fixtures/helpers/add-missing-config-attrs.js";
import { JSONToolOutput, Logger } from "beeai-framework";
import { vi } from "vitest";
import { TaskRunMinimal } from "../../dto.js";
import {
  TaskRunInitializerTool,
  TaskRunInitializerToolResult,
} from "../../tool.js";
import { SUPERVISOR_AGENT_ID } from "@/agents/supervisor/workflow/__test__/defaults.js";
import { TaskRunInitializer } from "../../task-run-initializer.js";

export const getTaskRunInitializerTool = (
  logger: Logger,
  actingAgentId = SUPERVISOR_AGENT_ID,
) => {
  vi.spyOn(
    TaskRunInitializerTool.prototype as unknown as {
      _run: TaskRunInitializerTool["_run"];
    },
    "_run",
  ).mockImplementation(async (input) => {
    if (input.method === "createTaskRun") {
      const {
        taskRunInput,
        taskType,
        actingAgentId,
        originTaskRunId,
        blockedByTaskRunIds,
      } = input;

      const data = addTaskRunMissingAttrs(
        {
          taskType,
          taskRunInput,
          taskRunNum: 1,
        } satisfies TaskRunMinimal,
        {
          all: {
            taskKind: "operator",
            ownerAgentId: actingAgentId,
            originTaskRunId,
            blockedByTaskRunIds,
          },
        },
      );

      // Mocking the response for the agent config creation
      return new JSONToolOutput({
        method: "createTaskRun" as const,
        success: true,
        data,
      } satisfies TaskRunInitializerToolResult);
    }

    throw new Error(`Unexpected method: ${input.method}`);
  });

  return new TaskRunInitializer(logger, actingAgentId);
};
