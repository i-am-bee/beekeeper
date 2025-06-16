import { RetrySuccessResult } from "@/agents/supervisor-workflow/base/retry/types.js";
import { getChatLLM } from "@/helpers/llm.js";
import { DeepPartial } from "@/utils/types.js";
import { pb } from "@test/helpers/pattern-builder.js";
import { Logger } from "beeai-framework";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Resources } from "../../helpers/resources/dto.js";
import { TaskStepMapper } from "../../helpers/task-step/task-step-mapper.js";
import { getAgentConfigInitializerTool } from "./__tests__/helpers/mocks.js";
import { AgentConfigInitializerOutput } from "./dto.js";
import { SUPERVISOR_AGENT_ID } from "../../../__test__/defaults.js";
import boston_trip_fixtures from "../../../fixtures/__test__/boston-trip/index.js";
import { unwrapTaskStepWithToolsOrLLM } from "@/agents/supervisor-workflow/fixtures/helpers/unwrap-task-step.js";

const logger = Logger.root.child({ name: "agent-config-tests" });
const llm = getChatLLM("supervisor");
const agentId = SUPERVISOR_AGENT_ID;
const onUpdate = () => ({});

describe(`AgentConfigInitializer`, () => {

  describe(`Create`, () => {
    afterEach(() => {
      vi.restoreAllMocks(); // Clean up mocks after each test
    });

    it(`1. Identify historical sites in Back Bay`, async () => {
      const agentConfigInitializer = getAgentConfigInitializerTool(logger);
      const resources = {
        tools: boston_trip_fixtures.tools.values,
        agents: [],
        tasks: [],
        taskRuns: [],
      } satisfies Resources;

      
      const taskStep = unwrapTaskStepWithToolsOrLLM(boston_trip_fixtures.taskSteps.get('Identify historical sites in Back Bay'));
      const resp = await agentConfigInitializer.run(
        {
          data: {
            resources,
            previousSteps: [],
            taskStep,
          },
          userMessage: TaskStepMapper.format(taskStep),
        },
        { llm, actingAgentId: agentId, onUpdate },
      );

      expect(resp).toMatchObject({
        type: "SUCCESS",
        result: {
          agentType: expect.matchPattern(pb().all("historical", "site")),
          tools: expect.arrayContaining(["historical_sites_search_api"]),
          agentConfigVersion: expect.any(Number),
        },
        attempts: [],
      } satisfies DeepPartial<
        RetrySuccessResult<AgentConfigInitializerOutput>
      >);
    });

    // it(`2. Find upcoming hockey/basketball game schedules in Boston`, async () => {
    //   const agentConfigInitializer = getAgentConfigInitializerTool(logger);
    //   const resources = {
    //     tools,
    //     agents: [agentConfig("historical_sites_identifier")],
    //     tasks: [],
    //     taskRuns: [],
    //   } satisfies Resources;

    //   const taskStep = TaskStepMapper.parse(
    //     `Find upcoming hockey/basketball game schedules in Boston (input: sports, location; output: game list) [tools: tavily_search_api]`,
    //     2,
    //     resources,
    //   );
    //   const resp = await agentConfigInitializer.run(
    //     {
    //       data: {
    //         resources,
    //         previousSteps: [
    //           {
    //             no: 1,
    //             step: "Identify historical sites in Back Bay",
    //             inputOutput: "input: location; output: list of sites",
    //             resource: {
    //               type: "agent",
    //               agent: agentConfig("historical_sites_identifier"),
    //             },
                
    //           },
    //         ],
    //         taskStep,
    //       },
    //       userMessage: TaskStepMapper.format(taskStep),
    //     },
    //     { llm, agentId, onUpdate },
    //   );

    //   expect(resp).toMatchObject({
    //     type: "SUCCESS",
    //     result: {
    //       agentType: expect.matchPattern(
    //         pb().all("game", pb().alt("schedule", "search", "find")),
    //       ),
    //       tools: expect.arrayContaining(["tavily_search_api"]),
    //       agentConfigVersion: expect.any(Number),
    //     },
    //     attempts: [],
    //   } satisfies DeepPartial<
    //     RetrySuccessResult<AgentConfigInitializerOutput>
    //   >);
    // });

    // it(`3. Recommend Italian, Chinese, and French restaurants in Back Bay for each day`, async () => {
    //   const agentConfigInitializer = getAgentConfigInitializerTool(logger);
    //   const resources = {
    //     tools,
    //     agents: [
    //       agentConfig("historical_sites_identifier"),
    //       agentConfig("game_scheduler"),
    //     ],
    //     tasks: [],
    //     taskRuns: [],
    //   } satisfies Resources;
    //   const taskStep = TaskStepMapper.parse(
    //     `Recommend Italian, Chinese, and French restaurants in Back Bay for each day (input: dining preferences, location; output: restaurant list) [tools: tavily_search_api]`,
    //     3,
    //     resources,
    //   );
    //   const resp = await agentConfigInitializer.run(
    //     {
    //       data: {
    //         resources,
    //         previousSteps: [
    //           {
    //             no: 1,
    //             step: "Identify historical sites in Back Bay",
    //             inputOutput: "input: location; output: list of sites",
    //             resource: {
    //               type: "agent",
    //               agent: agentConfig("historical_sites_identifier"),
    //             },
                
    //           },
    //           {
    //             no: 2,
    //             step: "Find upcoming hockey/basketball game schedules in Boston",
    //             inputOutput: "input: sports, location; output: game list",
    //             resource: {
    //               type: "agent",
    //               agent: agentConfig("game_scheduler"),
    //             },
                
    //           },
    //         ],
    //         taskStep: taskStep,
    //       },
    //       userMessage: TaskStepMapper.format(taskStep),
    //     },
    //     { llm, agentId, onUpdate },
    //   );

    //   expect(resp).toMatchObject({
    //     type: "SUCCESS",
    //     result: {
    //       agentType: expect.matchPattern(pb().all("restaurant", "recommend")),
    //       tools: expect.arrayContaining(["tavily_search_api"]),
    //       agentConfigVersion: expect.any(Number),
    //     },
    //     attempts: [],
    //   } satisfies DeepPartial<
    //     RetrySuccessResult<AgentConfigInitializerOutput>
    //   >);
    // });

    // it(`4. Create a balanced 3-day itinerary incorporating historical sites, games, and dining suggestions`, async () => {
    //   const agentConfigInitializer = getAgentConfigInitializerTool(logger);
    //   const resources = {
    //     tools,
    //     agents: [
    //       agentConfig("historical_sites_identifier"),
    //       agentConfig("game_scheduler"),
    //       agentConfig("restaurant_recommender"),
    //     ],
    //     tasks: [],
    //     taskRuns: [],
    //   } satisfies Resources;

    //   const taskStep = TaskStepMapper.parse(
    //     `Create a balanced 3-day itinerary incorporating historical sites, games, and dining suggestions (input: outputs from Steps 1–3; output: detailed itinerary) [LLM]`,
    //     4,
    //     resources,
    //   );

    //   const resp = await agentConfigInitializer.run(
    //     {
    //       data: {
    //         resources,
    //         previousSteps: [
    //           {
    //             no: 1,
    //             step: "Identify historical sites in Back Bay",
    //             inputOutput: "input: location; output: list of sites",
    //             resource: {
    //               type: "agent",
    //               agent: agentConfig("historical_sites_identifier"),
    //             },
                
    //           },
    //           {
    //             no: 2,
    //             step: "Find upcoming hockey/basketball game schedules in Boston",
    //             inputOutput: "input: sports, location; output: game list",
    //             resource: {
    //               type: "agent",
    //               agent: agentConfig("game_scheduler"),
    //             },
                
    //           },
    //           {
    //             no: 3,
    //             step: `Recommend Italian, Chinese, and French restaurants in Back Bay for each day`,
    //             inputOutput:
    //               "input: dining preferences, location; output: restaurant list",
    //             resource: {
    //               type: "agent",
    //               agent: agentConfig("restaurant_recommender"),
    //             },
                
    //           },
    //         ],
    //         taskStep,
    //       },
    //       userMessage: TaskStepMapper.format(taskStep),
    //     },
    //     { llm, agentId, onUpdate },
    //   );

    //   expect(resp).toMatchObject({
    //     type: "SUCCESS",
    //     result: {
    //       agentType: expect.matchPattern(
    //         pb().all("itinerary", pb().alt("creat", "plan")),
    //       ),
    //       tools: [],
    //       agentConfigVersion: expect.any(Number),
    //     },
    //     attempts: [],
    //   } satisfies DeepPartial<
    //     RetrySuccessResult<AgentConfigInitializerOutput>
    //   >);
    // });
  });

  // describe(`Select`, () => {
  //   it(`1. Identify historical sites in Back Bay`, async () => {
  //     const agentConfigInitializer = getAgentConfigInitializerTool(logger);
  //     const resources = {
  //       tools,
  //       agents: [
  //         agentConfig("historical_sites_identifier"),
  //         agentConfig("game_scheduler"),
  //         agentConfig("restaurant_recommender"),
  //         agentConfig("itinerary_creator"),
  //       ],
  //       tasks: [],
  //       taskRuns: [],
  //     } satisfies Resources;
  //     const taskStep = TaskStepMapper.parse(
  //       `Identify historical sites in Back Bay (input: location; output: list of sites) [agent: historical_sites_identifier]`,
  //       1,
  //       resources,
  //     );
  //     const resp = await agentConfigInitializer.run(
  //       {
  //         data: {
  //           resources,
  //           previousSteps: [],
  //           selectOnly: true,
  //           taskStep,
  //         },
  //         userMessage: TaskStepMapper.format(taskStep),
  //       },
  //       { llm, agentId, onUpdate },
  //     );

  //     expect(resp).toMatchObject({
  //       type: "SUCCESS",
  //       result: {
  //         agentType:
  //           "historical_sites_identifier" as const satisfies AgentConfigType,
  //         tools: ["historical_sites_search_api" as const satisfies ToolName],
  //       },
  //       attempts: [],
  //     } satisfies DeepPartial<
  //       RetrySuccessResult<AgentConfigInitializerOutput>
  //     >);
  //   });

  //   it(`2. Find upcoming hockey/basketball game schedules in Boston`, async () => {
  //     const agentConfigInitializer = getAgentConfigInitializerTool(logger);
  //     const resources = {
  //       tools,
  //       agents: [
  //         agentConfig("historical_sites_identifier"),
  //         agentConfig("game_scheduler"),
  //         agentConfig("restaurant_recommender"),
  //         agentConfig("itinerary_creator"),
  //       ],
  //       tasks: [],
  //       taskRuns: [],
  //     } satisfies Resources;
  //     const taskStep = TaskStepMapper.parse(
  //       `Find upcoming hockey/basketball game schedules in Boston (input: sports, location; output: game list) [agent: game_scheduler]`,
  //       2,
  //       resources,
  //     );
  //     const resp = await agentConfigInitializer.run(
  //       {
  //         data: {
  //           resources,
  //           previousSteps: [
  //             {
  //               no: 1,
  //               step: "Identify historical sites in Back Bay",
  //               inputOutput: "input: location; output: list of sites",
  //               resource: {
  //                 type: "agent",
  //                 agent: agentConfig("historical_sites_identifier"),
  //               },
                
  //             },
  //           ],
  //           selectOnly: true,
  //           taskStep: taskStep,
  //         },
  //         userMessage: TaskStepMapper.format(taskStep),
  //       },
  //       { llm, agentId, onUpdate },
  //     );

  //     expect(resp).toMatchObject({
  //       type: "SUCCESS",
  //       result: {
  //         agentType: "game_scheduler" as const satisfies AgentConfigType,
  //         tools: ["tavily_search_api" as const satisfies ToolName],
  //       },
  //       attempts: [],
  //     } satisfies DeepPartial<
  //       RetrySuccessResult<AgentConfigInitializerOutput>
  //     >);
  //   });

  //   it(`3. Recommend Italian, Chinese, and French restaurants in Back Bay for each day`, async () => {
  //     const agentConfigInitializer = getAgentConfigInitializerTool(logger);
  //     const resources = {
  //       tools,
  //       agents: [
  //         agentConfig("historical_sites_identifier"),
  //         agentConfig("game_scheduler"),
  //         agentConfig("restaurant_recommender"),
  //         agentConfig("itinerary_creator"),
  //       ],
  //       tasks: [],
  //       taskRuns: [],
  //     } satisfies Resources;
  //     const taskStep = TaskStepMapper.parse(
  //       `Recommend Italian, Chinese, and French restaurants in Back Bay for each day (input: dining preferences, location; output: restaurant list) [agent: restaurant_recommender]`,
  //       3,
  //       resources,
  //     );
  //     const resp = await agentConfigInitializer.run(
  //       {
  //         data: {
  //           resources,
  //           previousSteps: [
  //             {
  //               no: 1,
  //               step: "Identify historical sites in Back Bay",
  //               inputOutput: "input: location; output: list of sites",
  //               resource: {
  //                 type: "agent",
  //                 agent: agentConfig("historical_sites_identifier"),
  //               },
                
  //             },
  //             {
  //               no: 2,
  //               step: "Find upcoming hockey/basketball game schedules in Boston",
  //               inputOutput: "input: sports, location; output: game list",
  //               resource: {
  //                 type: "agent",
  //                 agent: agentConfig("game_scheduler"),
  //               },
                
  //             },
  //           ],
  //           selectOnly: true,
  //           taskStep: taskStep,
  //         },
  //         userMessage: TaskStepMapper.format(taskStep),
  //       },
  //       { llm, agentId, onUpdate },
  //     );

  //     expect(resp).toMatchObject({
  //       type: "SUCCESS",
  //       result: {
  //         agentType:
  //           "restaurant_recommender" as const satisfies AgentConfigType,
  //         tools: ["tavily_search_api" as const satisfies ToolName],
  //       },
  //       attempts: [],
  //     } satisfies DeepPartial<
  //       RetrySuccessResult<AgentConfigInitializerOutput>
  //     >);
  //   });

  //   it(`4. Create a balanced 3-day itinerary incorporating historical sites, games, and dining suggestions`, async () => {
  //     const agentConfigInitializer = getAgentConfigInitializerTool(logger);
  //     const resources = {
  //       tools,
  //       agents: [
  //         agentConfig("historical_sites_identifier"),
  //         agentConfig("game_scheduler"),
  //         agentConfig("restaurant_recommender"),
  //         agentConfig("itinerary_creator"),
  //       ],
  //       tasks: [],
  //       taskRuns: [],
  //     } satisfies Resources;
  //     const taskStep = TaskStepMapper.parse(
  //       `Create a balanced 3-day itinerary incorporating historical sites, games, and dining suggestions (input: outputs from Steps 1–3; output: detailed itinerary) [agent: itinerary_creator]`,
  //       4,
  //       resources,
  //     );
  //     const resp = await agentConfigInitializer.run(
  //       {
  //         data: {
  //           resources,
  //           previousSteps: [
  //             {
  //               no: 1,
  //               step: "Identify historical sites in Back Bay",
  //               inputOutput: "input: location; output: list of sites",
  //               resource: {
  //                 type: "agent",
  //                 agent: agentConfig("historical_sites_identifier"),
  //               },
                
  //             },
  //             {
  //               no: 2,
  //               step: "Find upcoming hockey/basketball game schedules in Boston",
  //               inputOutput: "input: sports, location; output: game list",
  //               resource: {
  //                 type: "agent",
  //                 agent: agentConfig("game_scheduler"),
  //               },
                
  //             },
  //             {
  //               no: 3,
  //               step: `Recommend Italian, Chinese, and French restaurants in Back Bay for each day`,
  //               inputOutput:
  //                 "input: dining preferences, location; output: restaurant list",
  //               resource: {
  //                 type: "agent",
  //                 agent: agentConfig("restaurant_recommender"),
  //               },
                
  //             },
  //           ],
  //           selectOnly: true,
  //           taskStep: taskStep,
  //         },
  //         userMessage: TaskStepMapper.format(taskStep),
  //       },
  //       { llm, agentId, onUpdate },
  //     );

  //     expect(resp).toMatchObject({
  //       type: "SUCCESS",
  //       result: {
  //         agentType: "itinerary_creator" as const satisfies AgentConfigType,
  //         tools: [],
  //       },
  //       attempts: [],
  //     } satisfies DeepPartial<
  //       RetrySuccessResult<AgentConfigInitializerOutput>
  //     >);
  //   });
  // });
});
