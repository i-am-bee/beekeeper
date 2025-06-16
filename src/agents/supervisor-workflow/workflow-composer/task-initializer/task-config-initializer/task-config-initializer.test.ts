import farm_daily_fixtures from "@/agents/supervisor-workflow/fixtures/__test__/farm-daily-tasks/index.js";
import { getChatLLM } from "@/helpers/llm.js";
import { TaskConfig } from "@/tasks/manager/dto.js";
import { JSONToolOutput, Logger } from "beeai-framework";
import { describe, expect, it, vi } from "vitest";
import { Resources } from "../../helpers/resources/dto.js";
import { TaskStep } from "../../helpers/task-step/dto.js";
import { TaskStepMapper } from "../../helpers/task-step/task-step-mapper.js";
import { TaskConfigInitializer } from "./task-config-initializer.js";
import {
  TaskConfigInitializerTool,
  TaskConfigInitializerToolResult,
} from "./tool.js";

const SUPERVISOR_AGENT_ID = "supervisor:boss[1]:1";
const logger = Logger.root.child({ name: "agent-config-tests" });
const llm = getChatLLM("supervisor");
const agentId = "supervisor:boss[1]:1";
const onUpdate = () => ({});
const getTaskConfigInitializerTool = (actingAgentId = SUPERVISOR_AGENT_ID) => {
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
      // Mocking the response for the agent config creation
      return new JSONToolOutput({
        method: "createTaskConfig" as const,
        success: true,
        data: {
          taskKind,
          taskType,
          taskConfigId: "operator:historical_sites:1",
          taskConfigVersion: 1,
          taskConfigInput,
          description,
          agentType,
          agentKind,
          agentConfigVersion: 1,
          intervalMs: 0,
          runImmediately: false,
          ownerAgentId: actingAgentId,
          concurrencyMode: "EXCLUSIVE",
        } satisfies TaskConfig,
      } satisfies TaskConfigInitializerToolResult);
    }

    throw new Error(`Unexpected method: ${input.method}`);
  });

  return new TaskConfigInitializer(logger, actingAgentId);
};

describe("TaskConfigInitializer", () => {
  // const tools = [
  //   tool("historical_sites_search_api"),
  //   tool("tavily_search_api"),
  //   tool("tavily_page_extract"),
  // ] satisfies AvailableTool[];

  // const agents = [
  //   agentConfig("historical_sites_identifier"),
  //   agentConfig("game_scheduler"),
  //   agentConfig("restaurant_recommender"),
  //   agentConfig("itinerary_creator"),
  // ] satisfies AgentConfig[];

  // it(`1. Identify historical sites in Back Bay`, async () => {
  //   const taskConfigInitializer = getTaskConfigInitializerTool();
  //   const resources = {
  //     tools,
  //     agents,
  //     tasks: [], // No existing tasks for this test
  //     taskRuns: [], // No existing task runs for this test
  //   } satisfies Resources;

  //   const taskStep = {
  //     step: "Identify historical sites in Back Bay",
  //     inputOutput: "input: location; output: list of sites",
  //     resource: {
  //       type: "agent",
  //       agent: agentConfig("historical_sites_identifier"),
  //     },
  //   } satisfies TaskStep;
  //   const request = TaskStepMapper.format(taskStep);
  //   const resp = await taskConfigInitializer.run(
  //     {
  //       userMessage: request,
  //       data: {
  //         previousSteps: [],
  //         existingTaskConfigs: [],
  //         taskStep,
  //         actingAgentId: SUPERVISOR_AGENT_ID,
  //         existingAgentConfigs: agents,
  //       },
  //     },
  //     { llm, agentId, onUpdate },
  //   );

  //   expect(resp).toMatchObject({
  //     type: "SUCCESS",
  //     result: {
  //       agentType: "historical_sites_identifier",
  //       taskType: expect.matchPattern(pb().all("identif", "histor", "site")),
  //     },
  //     attempts: [],
  //   } satisfies DeepPartial<RetrySuccessResult<TaskConfigInitializerOutput>>);
  // });

  // it(`2. Find upcoming hockey/basketball game schedules in Boston`, async () => {
  //   const taskConfigInitializer = getTaskConfigInitializerTool();

  //   const taskStep = {
  //     step: "Find upcoming hockey/basketball game schedules in Boston",
  //     inputOutput: "input: sports, location; output: game list",
  //     resource: { type: "agent", agentType: "tavily_search_api" },
  //   } as const satisfies TaskStep;
  //   const request = TaskStepMapper.format(taskStep);
  //   const resp = await taskConfigInitializer.run(
  //     {
  //       userMessage: request,
  //       data: {
  //         previousSteps: [
  //           {
  //             step: "Identify historical sites in Back Bay",
  //             inputOutput: "input: location; output: list of sites",
  //             resource: {
  //               type: "agent",
  //               agentType: "historical_sites_identifier",
  //             },
  //           },
  //         ],
  //         existingTaskConfigs: [
  //           {
  //             taskType: "identify_historical_sites",
  //             agentType: "historical_sites_identifier",
  //             taskConfigInput: `{"location":"<given location>"}`,
  //             description:
  //               "Task to identify historical sites in a given location.",
  //           } satisfies TaskConfigMinimal,
  //         ],
  //         taskStep,
  //         actingAgentId: SUPERVISOR_AGENT_ID,
  //         existingAgentConfigs: agents,
  //       },
  //     },
  //     { llm, agentId, onUpdate },
  //   );

  //   expect(resp).toMatchObject({
  //     type: "SUCCESS",
  //     result: {
  //       agentType: "game_scheduler",
  //       taskType: expect.matchPattern(pb().all("find", "game")),
  //     },
  //     attempts: [],
  //   } satisfies DeepPartial<RetrySuccessResult<TaskConfigInitializerOutput>>);
  // });

  // it(`3. Recommend Italian, Chinese, and French restaurants in Back Bay for each day`, async () => {
  //   const taskConfigInitializer = getTaskConfigInitializerTool();

  //   const taskStep = {
  //     step: `Recommend Italian, Chinese, and French restaurants in Back Bay for each day`,
  //     inputOutput:
  //       "input: dining preferences, location; output: restaurant list",
  //     resource: { type: "agent", agentType: "tavily_search_api" },
  //   } as const satisfies TaskStep;
  //   const request = TaskStepMapper.format(taskStep);
  //   const resp = await taskConfigInitializer.run(
  //     {
  //       userMessage: request,
  //       data: {
  //         previousSteps: [
  //           {
  //             step: "Identify historical sites in Back Bay",
  //             inputOutput: "input: location; output: list of sites",
  //             resource: {
  //               type: "agent",
  //               agentType: "historical_sites_identifier",
  //             },
  //           },
  //           {
  //             step: "Find upcoming hockey/basketball game schedules in Boston",
  //             inputOutput: "input: sports, location; output: game list",
  //             resource: { type: "agent", agentType: "tavily_search_api" },
  //           },
  //         ],
  //         existingTaskConfigs: [
  //           {
  //             taskType: "identify_historical_sites",
  //             agentType: "historical_sites_identifier",
  //             taskConfigInput: `{"location":"<given location>"}`,
  //             description:
  //               "Task to identify historical sites in a given location.",
  //           } satisfies TaskConfigMinimal,
  //           {
  //             taskType: "find_sports_game_schedules",
  //             agentType: "game_scheduler",
  //             taskConfigInput: `{"sport":"<choose sport: hockey | basketball>","location":"Boston"}`,
  //             description:
  //               "Task to find upcoming hockey and basketball game schedules in Boston.",
  //           } satisfies TaskConfigMinimal,
  //         ],
  //         taskStep,
  //         actingAgentId: SUPERVISOR_AGENT_ID,
  //         existingAgentConfigs: agents,
  //       },
  //     },
  //     { llm, agentId, onUpdate },
  //   );

  //   expect(resp).toBe({});

  //   expect(resp).toMatchObject({
  //     type: "SUCCESS",
  //     result: {
  //       agentType: "restaurant_recommender",
  //       taskType: expect.matchPattern(pb().all("recommend", "restaurant")),
  //     },
  //     attempts: [],
  //   } satisfies DeepPartial<RetrySuccessResult<TaskConfigInitializerOutput>>);
  // });

  // it(`4. Create a balanced 3-day itinerary incorporating historical sites, games, and dining suggestions`, async () => {
  //   const taskConfigInitializer = getTaskConfigInitializerTool();

  //   const taskStep = {
  //     step: `Create a balanced 3-day itinerary incorporating historical sites, games, and dining suggestions`,
  //     inputOutput: "input: outputs from Steps 1–3; output: detailed itinerary",
  //     resource: { type: "llm" },
  //   } as const satisfies TaskStep;
  //   const request = TaskStepMapper.format(taskStep);
  //   const resp = await taskConfigInitializer.run(
  //     {
  //       userMessage: request,
  //       data: {
  //         previousSteps: [
  //           {
  //             step: "Identify historical sites in Back Bay",
  //             inputOutput: "input: location; output: list of sites",
  //             resource: {
  //               type: "agent",
  //               agentType: "historical_sites_identifier",
  //             },
  //           },
  //           {
  //             step: "Find upcoming hockey/basketball game schedules in Boston",
  //             inputOutput: "input: sports, location; output: game list",
  //             resource: { type: "agent", agentType: "tavily_search_api" },
  //           },
  //           {
  //             step: `Recommend Italian, Chinese, and French restaurants in Back Bay for each day`,
  //             inputOutput:
  //               "input: dining preferences, location; output: restaurant list",
  //             resource: { type: "agent", agentType: "tavily_search_api" },
  //           },
  //         ],
  //         existingTaskConfigs: [
  //           {
  //             taskType: "identify_historical_sites",
  //             agentType: "historical_sites_identifier",
  //             taskConfigInput: `{"location":"<given location>"}`,
  //             description:
  //               "Task to identify historical sites in a given location.",
  //           } satisfies TaskConfigMinimal,
  //           {
  //             taskType: "find_sports_game_schedules",
  //             agentType: "game_scheduler",
  //             taskConfigInput: `{"sport":"<choose sport: hockey | basketball>","location":"Boston"}`,
  //             description:
  //               "Task to find upcoming hockey and basketball game schedules in Boston.",
  //           } satisfies TaskConfigMinimal,
  //           {
  //             taskType: "recommend_restaurants",
  //             agentType: "restaurant_recommender",
  //             taskConfigInput: `{"diningPreferences":"Italian, Chinese, French","location":"Back Bay"}`,
  //             description:
  //               "Task to recommend Italian, Chinese, and French restaurants in Back Bay for each day.",
  //           } satisfies TaskConfigMinimal,
  //         ],
  //         taskStep,
  //         actingAgentId: SUPERVISOR_AGENT_ID,
  //         existingAgentConfigs: agents,
  //       },
  //     },
  //     { llm, agentId, onUpdate },
  //   );

  //   expect(resp).toBe({});
  //   expect(resp).toMatchObject({
  //     type: "SUCCESS",
  //     result: {
  //       agentType: "itinerary_creator",
  //       taskType: expect.matchPattern(
  //         pb().all("itinerary", pb().alt("3_day", "three_day")),
  //       ),
  //     },
  //     attempts: [],
  //   } satisfies DeepPartial<RetrySuccessResult<TaskConfigInitializerOutput>>);
  // });

  describe(`farm daily tasks`, () => {
    it(`1. Retrieve the latest status and availability of farm equipment`, async () => {
      const taskConfigInitializer = getTaskConfigInitializerTool();
      const resources = {
        tools: farm_daily_fixtures.tools.values,
        agents: [],
        tasks: [], // No existing tasks for this test
        taskRuns: [], // No existing task runs for this test
      } satisfies Resources;

      const taskStep = farm_daily_fixtures.taskSteps.get(
        "Retrieve the latest status and availability of farm equipment",
      ) satisfies TaskStep;
      const request = TaskStepMapper.format(taskStep);
      const resp = await taskConfigInitializer.run(
        {
          userMessage: request,
          data: {
            previousSteps: [],
            resources,
            taskStep,
            actingAgentId: SUPERVISOR_AGENT_ID,
          },
        },
        { llm, actingAgentId: agentId, onUpdate },
      );

      expect(resp).toBe({});
    });
  });
});
