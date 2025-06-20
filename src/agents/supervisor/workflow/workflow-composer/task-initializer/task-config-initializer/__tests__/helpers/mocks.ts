import { addTaskConfigMissingAttrs } from "@/agents/supervisor/workflow/fixtures/helpers/add-missing-config-attrs.js";
import { JSONToolOutput, Logger } from "beeai-framework";
import { vi } from "vitest";
import { SUPERVISOR_AGENT_ID } from "../../../../../__test__/defaults.js";
import { TaskConfigMinimal } from "../../dto.js";
import { TaskConfigInitializer } from "../../task-config-initializer.js";
import {
  TaskConfigInitializerTool,
  TaskConfigInitializerToolResult,
} from "../../tool.js";

export const getTaskConfigInitializerTool = (
  logger: Logger,
  actingAgentId = SUPERVISOR_AGENT_ID,
) => {
  vi.spyOn(
    TaskConfigInitializerTool.prototype as unknown as {
      _run: TaskConfigInitializerTool["_run"];
    },
    "_run",
  ).mockImplementation(async (input) => {
    if (input.method === "createTaskConfig") {
      const {
        taskKind,
        taskType,
        agentKind,
        agentType,
        taskConfigInput,
        description,
      } = input.config;

      const data = addTaskConfigMissingAttrs(
        {
          taskType,
          taskConfigInput,
          description,
          agentType,
        } satisfies TaskConfigMinimal,
        {
          all: {
            taskKind,
            agentKind,
          },
        },
      );

      // Mocking the response for the agent config creation
      return new JSONToolOutput({
        method: "createTaskConfig" as const,
        success: true,
        data,
      } satisfies TaskConfigInitializerToolResult);
    }

    throw new Error(`Unexpected method: ${input.method}`);
  });

  return new TaskConfigInitializer(logger, actingAgentId);
};
