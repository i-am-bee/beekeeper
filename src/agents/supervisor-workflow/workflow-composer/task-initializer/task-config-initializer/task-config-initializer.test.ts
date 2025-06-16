import { RetrySuccessResult } from "@/agents/supervisor-workflow/base/retry/types.js";
import { getChatLLM } from "@/helpers/llm.js";
import { TaskConfig } from "@/tasks/manager/dto.js";
import { DeepPartial } from "@/utils/types.js";
import { pb } from "@test/helpers/pattern-builder.js";
import { JSONToolOutput, Logger } from "beeai-framework";
import { describe, expect, it, vi } from "vitest";
import { TaskStepMapper } from "../../task-step-mapper.js";
import { AgentConfigMinimal } from "../agent-config-initializer/dto.js";
import { TaskConfigInitializerOutput, TaskConfigMinimal } from "./dto.js";
import { TaskConfigInitializer } from "./task-config-initializer.js";
import {
  TaskConfigInitializerTool,
  TaskConfigInitializerToolResult,
} from "./tool.js";
import { TaskStep } from "../../dto.js";

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
  const existingAgentConfigs = [
    {
      agentType: "historical_sites_identifier",
      tools: ["tavily_search_api"],
      instructions: `Context: You are an agent specializing in identifying historical sites. You are activated by an external task and receive a location as input. You use the historical_sites_search_api tool to retrieve a list of historical sites.
Objective: Use the provided location to fetch a list of historical sites. Return the results in a structured format.
Response format: List each site with its name and a brief description.`,
      description:
        "Identifies historical sites in a given location using the historical_sites_search_api tool.",
      agentConfigVersion: 1,
      agentConfigId: "operator:historical_sites_identifier:1",
    },
    {
      agentType: "game_scheduler",
      tools: ["tavily_search_api"],
      instructions: `Context: You are a game scheduler agent. You are activated by an external task and receive sport type and location as input. You use the tavily_search_api tool to retrieve game schedules.

Objective: Use the provided sport type and location to fetch upcoming game schedules. Return the results in a structured format.

Response format: List each game with its date, time, and teams:

Upcoming [Sport] Games in Boston:
1. Date: [Date 1] — Time: [Time 1] — Teams: [Team A vs. Team B]
2. Date: [Date 2] — Time: [Time 2] — Teams: [Team C vs. Team D]`,
      description:
        "Schedules upcoming hockey and basketball games in Boston using tavily_search_api.",
      agentConfigVersion: 1,
      agentConfigId: "operator:game_scheduler:1",
    },
    {
      agentType: "multi_cuisine_restaurant_recommender",
      tools: ["tavily_search_api"],
      instructions: `Context: You are an agent specializing in recommending diverse cuisine restaurants. You are activated by an external task and receive dining preferences and location as input. You use the tavily_search_api tool to retrieve a list of restaurants.

Objective: Use the provided dining preferences and location to fetch a list of restaurants. Return the results in a structured format, listing one restaurant per cuine type per day.

Response format: Present the recommendations day by day with cuisine type and details:

Back Bay Restaurant Recommendations:
Day 1:
- Italian: [Restaurant Name 1] — Description: [Description 1]
- Chinese: [Restaurant Name 2] — Description: [Description 2]
- French: [Restaurant Name 3] — Description: [Description 3]
Day 2:
- Italian: [Restaurant Name 4] — Description: [Description 4]
- Chinese: [Restaurant Name 5] — Description: [Description 5]
- French: [Restaurant Name 6] — Description: [Description 6]`,
      description:
        "Recommends restaurants of multiple cuisines in a given location using tavily_search_api.",
      agentConfigVersion: 1,
      agentConfigId: "operator:multi_cuisine_restaurant_recommender:1",
    },
    {
      agentType: "itinerary_creator",
      tools: [],
      instructions: `Context: You are an itinerary creator agent. You are activated by an external task and receive input activities, locations, and preferences. You use LLM capabilities to generate a detailed itinerary.

Objective: Use the provided inputs to create a balanced 3-day itinerary. Return the results in a structured format.

Response format: Present the itinerary day by day with activities and details:

3-Day Itinerary:
Day 1:
- Activity: [Activity 1] — Details: [Details 1]
- Activity: [Activity 2] — Details: [Details 2]
Day 2:
- Activity: [Activity 3] — Details: [Details 3]
- Activity: [Activity 4] — Details: [Details 4]
Day 3:
- Activity: [Activity 5] — Details: [Details 5]
- Activity: [Activity 6] — Details: [Details 6]`,
      description:
        "Creates a balanced 3-day itinerary based on input activities, locations, and preferences.",
      agentConfigVersion: 1,
      agentConfigId: "operator:itinerary_creator:1",
    },
  ] satisfies AgentConfigMinimal[];

  it(`1. Identify historical sites in Back Bay`, async () => {
    const taskConfigInitializer = getTaskConfigInitializerTool();

    const taskStep = {
      step: "Identify historical sites in Back Bay",
      inputOutput: "input: location; output: list of sites",
      resource: {
        type: "agent",
        agentType: "historical_sites_identifier",
      },
    } as const;
    const request = TaskStepMapper.format(taskStep);
    const resp = await taskConfigInitializer.run(
      {
        userMessage: request,
        data: {
          previousSteps: [],
          existingTaskConfigs: [],
          taskStep,
          actingAgentId: SUPERVISOR_AGENT_ID,
          existingAgentConfigs,
        },
      },
      { llm, agentId, onUpdate },
    );

    expect(resp).toMatchObject({
      type: "SUCCESS",
      result: {
        agentType: "historical_sites_identifier",
        taskType: expect.matchPattern(pb().all("identif", "histor", "site")),
      },
      attempts: [],
    } satisfies DeepPartial<RetrySuccessResult<TaskConfigInitializerOutput>>);
  });

  it(`2. Find upcoming hockey/basketball game schedules in Boston`, async () => {
    const taskConfigInitializer = getTaskConfigInitializerTool();

    const taskStep = {
      step: "Find upcoming hockey/basketball game schedules in Boston",
      inputOutput: "input: sports, location; output: game list",
      resource: { type: "agent", agentType: "tavily_search_api" },
    } as const satisfies TaskStep;
    const request = TaskStepMapper.format(taskStep);
    const resp = await taskConfigInitializer.run(
      {
        userMessage: request,
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
          existingTaskConfigs: [
            {
              taskType: "identify_historical_sites",
              agentType: "historical_sites_identifier",
              taskConfigInput: `{"location":"<given location>"}`,
              description:
                "Task to identify historical sites in a given location.",
            } satisfies TaskConfigMinimal,
          ],
          taskStep,
          actingAgentId: SUPERVISOR_AGENT_ID,
          existingAgentConfigs,
        },
      },
      { llm, agentId, onUpdate },
    );

    expect(resp).toMatchObject({
      type: "SUCCESS",
      result: {
        agentType: "game_scheduler",
        taskType: expect.matchPattern(pb().all("find", "game")),
      },
      attempts: [],
    } satisfies DeepPartial<RetrySuccessResult<TaskConfigInitializerOutput>>);
  });

  it(`3. Recommend Italian, Chinese, and French restaurants in Back Bay for each day`, async () => {
    const taskConfigInitializer = getTaskConfigInitializerTool();

    const taskStep = {
      step: `Recommend Italian, Chinese, and French restaurants in Back Bay for each day`,
      inputOutput:
        "input: dining preferences, location; output: restaurant list",
      resource: { type: "agent", agentType: "tavily_search_api" },
    } as const satisfies TaskStep;
    const request = TaskStepMapper.format(taskStep);
    const resp = await taskConfigInitializer.run(
      {
        userMessage: request,
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
            {
              step: "Find upcoming hockey/basketball game schedules in Boston",
              inputOutput: "input: sports, location; output: game list",
              resource: { type: "agent", agentType: "tavily_search_api" },
            },
          ],
          existingTaskConfigs: [
            {
              taskType: "identify_historical_sites",
              agentType: "historical_sites_identifier",
              taskConfigInput: `{"location":"<given location>"}`,
              description:
                "Task to identify historical sites in a given location.",
            } satisfies TaskConfigMinimal,
            {
              taskType: "find_sports_game_schedules",
              agentType: "game_scheduler",
              taskConfigInput: `{"sport":"<choose sport: hockey | basketball>","location":"Boston"}`,
              description:
                "Task to find upcoming hockey and basketball game schedules in Boston.",
            } satisfies TaskConfigMinimal,
          ],
          taskStep,
          actingAgentId: SUPERVISOR_AGENT_ID,
          existingAgentConfigs,
        },
      },
      { llm, agentId, onUpdate },
    );

    expect(resp).toMatchObject({
      type: "SUCCESS",
      result: {
        agentType: "multi_cuisine_restaurant_recommender",
        taskType: expect.matchPattern(pb().all("recommend", "restaurant")),
      },
      attempts: [],
    } satisfies DeepPartial<RetrySuccessResult<TaskConfigInitializerOutput>>);
  });

  it(`4. Create a balanced 3-day itinerary incorporating historical sites, games, and dining suggestions`, async () => {
    const taskConfigInitializer = getTaskConfigInitializerTool();

    const taskStep = {
      step: `Create a balanced 3-day itinerary incorporating historical sites, games, and dining suggestions`,
      inputOutput: "input: outputs from Steps 1–3; output: detailed itinerary",
      resource: { type: "llm" },
    } as const satisfies TaskStep;
    const request = TaskStepMapper.format(taskStep);
    const resp = await taskConfigInitializer.run(
      {
        userMessage: request,
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
            {
              step: "Find upcoming hockey/basketball game schedules in Boston",
              inputOutput: "input: sports, location; output: game list",
              resource: { type: "agent", agentType: "tavily_search_api" },
            },
            {
              step: `Recommend Italian, Chinese, and French restaurants in Back Bay for each day`,
              inputOutput:
                "input: dining preferences, location; output: restaurant list",
              resource: { type: "agent", agentType: "tavily_search_api" },
            },
          ],
          existingTaskConfigs: [
            {
              taskType: "identify_historical_sites",
              agentType: "historical_sites_identifier",
              taskConfigInput: `{"location":"<given location>"}`,
              description:
                "Task to identify historical sites in a given location.",
            } satisfies TaskConfigMinimal,
            {
              taskType: "find_sports_game_schedules",
              agentType: "game_scheduler",
              taskConfigInput: `{"sport":"<choose sport: hockey | basketball>","location":"Boston"}`,
              description:
                "Task to find upcoming hockey and basketball game schedules in Boston.",
            } satisfies TaskConfigMinimal,
          ],
          taskStep,
          actingAgentId: SUPERVISOR_AGENT_ID,
          existingAgentConfigs,
        },
      },
      { llm, agentId, onUpdate },
    );

    expect(resp).toMatchObject({
      type: "SUCCESS",
      result: {
        agentType: "itinerary_creator",
        taskType: expect.matchPattern(
          pb().all("itinerary", pb().alt("3_day", "three_day")),
        ),
      },
      attempts: [],
    } satisfies DeepPartial<RetrySuccessResult<TaskConfigInitializerOutput>>);
  });
});
