import { AgentConfig } from "@/agents/registry/dto.js";
import {
  RetrySuccessResult
} from "@/agents/supervisor-workflow/base/retry/types.js";
import { getChatLLM } from "@/helpers/llm.js";
import { DeepPartial } from "@/utils/types.js";
import { pb } from "@test/helpers/pattern-builder.js";
import { JSONToolOutput, Logger } from "beeai-framework";
import { describe, expect, it, vi } from "vitest";
import { tool } from "./__tests__/__fixtures__/tools.js";
import { AgentConfigInitializer } from "./agent-config-initializer.js";
import {
  AgentConfigInitializerInput,
  AgentConfigInitializerOutput,
} from "./dto.js";
import {
  AgentConfigCreatorToolResult,
  AgentConfigInitializerTool,
} from "./tool.js";

const logger = Logger.root.child({ name: "agent-config-tests" });
const llm = getChatLLM("supervisor");
const agentId = "supervisor:boss[1]:1";
const onUpdate = () => ({});

describe(`AgentConfigInitializer`, () => {
  describe(`Plan a trip to Boston`, () => {
    const availableTools = [
      tool("tavily_search_api"),
      tool("tavily_page_extract"),
    ] satisfies AgentConfigInitializerInput["availableTools"];

    it(`1. Identify historical sites in Back Bay`, async () => {
      const agentConfigInitializer = new AgentConfigInitializer(
        logger,
        "supervisor:boss[1]:1",
      );

      vi.spyOn(
        AgentConfigInitializerTool.prototype as unknown as {
          _run: AgentConfigInitializerTool["_run"];
        },
        "_run",
      ).mockImplementation(async (input) => {
        if (input.method !== "createAgentConfig") {
          throw new Error(`Unexpected method: ${input.method}`);
        }

        // Mocking the response for the agent config creation
        return new JSONToolOutput({
          method: "createAgentConfig" as const,
          success: true,
          data: {
            agentKind: input.agentKind,
            agentType: input.config.agentType,
            agentConfigId: `operator:${input.config.agentType}:1`,
            agentConfigVersion: 1,
            autoPopulatePool: true,
            maxPoolSize: 5,
            description: input.config.description,
            tools: input.config.tools,
            instructions: input.config.instructions,
          } satisfies AgentConfig,
        } satisfies AgentConfigCreatorToolResult);
      });

      const request = `Identify historical sites in Back Bay (input: location; output: list of sites) [tool: historical_sites_search_api]`;
      const resp = await agentConfigInitializer.run(
        {
          data: {
            previousSteps: [],
            availableTools,
            existingAgentConfigs: [],
            task: request,
          },
          userMessage: request,
        },
        { llm, agentId, onUpdate },
      );

      if (resp.type !== "SUCCESS") {
        expect(resp.type).toBe("SUCCESS");
        return;
      }

      const { result } = resp;
      expect(result).toMatchObject({
        agentType: expect.matchPattern(pb().all("historical", "site")),
        tools: expect.arrayContaining(["historical_sites_search_apsi"]),
        agentConfigVersion: expect.any(Number),
      } satisfies Partial<AgentConfigInitializerOutput>);
    });

    it(`2. Find upcoming hockey/basketball game schedules in Boston`, async () => {
      const agentConfigInitializer = new AgentConfigInitializer(
        logger,
        "supervisor:boss[1]:1",
      );

      const request = `Find upcoming hockey/basketball game schedules in Boston (input: sports, location; output: game list) [tavily_api]`;
      const resp = await agentConfigInitializer.run(
        {
          data: {
            previousSteps: [
              {
                step: "Identify historical sites in Back Bay",
                inputOutput: "input: location; output: list of sites",
                resource: {
                  type: "agent",
                  agentType: "historical_sites_identifier",
                },
              },
            ],
            availableTools,
            existingAgentConfigs: [],
            task: request,
          },
          userMessage: request,
        },
        { llm, agentId, onUpdate },
      );

      expect(resp).toMatchObject({
        type: "SUCCESS",
        result: {
          agentType: expect.matchPattern(pb().all("historical", "site")),
          tools: expect.arrayContaining(["historical_sites_search_apsi"]),
          agentConfigVersion: expect.any(Number),
        },
        attempts: [],
      } satisfies DeepPartial<RetrySuccessResult<AgentConfigInitializerOutput>>);
    });

    it(`3. Recommend Italian, Chinese, and French restaurants in Back Bay for each day`, async () => {
      const agentConfigInitializer = new AgentConfigInitializer(
        logger,
        "supervisor:boss[1]:1",
      );

      const request = `Recommend Italian, Chinese, and French restaurants in Back Bay for each day (input: dining preferences, location; output: restaurant list) [tavily_api]`;
      const resp = await agentConfigInitializer.run(
        {
          data: {
            previousSteps: [
              {
                step: "Identify historical sites in Back Bay",
                inputOutput: "input: location; output: list of sites",
                resource: {
                  type: "agent",
                  agentType: "historical_sites_search_api",
                },
              },
              {
                step: "Find upcoming hockey/basketball game schedules in Boston",
                inputOutput: "input: sports, location; output: game list",
                resource: { type: "agent", agentType: "tavily_api" },
              },
            ],
            availableTools,
            existingAgentConfigs: [],
            task: request,
          },
          userMessage: request,
        },
        { llm, agentId, onUpdate },
      );

      expect(resp).toEqual({
        description: "Mocked description",
        tools: ["mocked_tool_1", "mocked_tool_2"],
        instructions: "Mocked instructions",
        agentConfigId: "mocked_agent_config_id",
        agentConfigVersion: 1,
        agentType: "mocked_agent_type",
      });
    });
  });
});
