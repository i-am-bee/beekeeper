import { addAgentConfigMissingAttrs } from "@/agents/supervisor-workflow/fixtures/helpers/add-missing-config-attrs.js";
import { JSONToolOutput, Logger } from "beeai-framework";
import { vi } from "vitest";
import { SUPERVISOR_AGENT_ID } from "../../../../../__test__/defaults.js";
import { AgentConfigInitializer } from "../../agent-config-initializer.js";
import { AgentConfigTiny } from "../../dto.js";
import {
  AgentConfigInitializerTool,
  AgentConfigInitializerToolResult,
} from "../../tool.js";

export const getAgentConfigInitializerTool = (
  logger: Logger,
  actingAgentId = SUPERVISOR_AGENT_ID,
) => {
  vi.spyOn(
    AgentConfigInitializerTool.prototype as unknown as {
      _run: AgentConfigInitializerTool["_run"];
    },
    "_run",
  ).mockImplementation(async (input) => {
    if (input.method === "createAgentConfig") {
      const {
        agentKind,
        config: { agentType, description, tools, instructions },
      } = input;

      const data = addAgentConfigMissingAttrs(
        {
          agentType,
          description,
          tools,
          instructions,
        } satisfies AgentConfigTiny,
        {
          all: {
            agentKind,
          },
        },
      );

      return new JSONToolOutput({
        method: "createAgentConfig" as const,
        success: true,
        data,
      } satisfies AgentConfigInitializerToolResult);
    }

    throw new Error(`Unimplemented method mock: ${input.method}`);
  });

  return new AgentConfigInitializer(logger, actingAgentId);
};
