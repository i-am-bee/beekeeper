import { AgentConfig } from "@/agents/registry/dto.js";
import { RetrySuccessResult } from "@/agents/supervisor-workflow/base/retry/types.js";
import { getChatLLM } from "@/helpers/llm.js";
import { DeepPartial } from "@/utils/types.js";
import { pb } from "@test/helpers/pattern-builder.js";
import { JSONToolOutput, Logger } from "beeai-framework";
import { afterEach, describe, expect, it, vi } from "vitest";
import { tool } from "./__tests__/__fixtures__/tools.js";
import { AgentConfigInitializer } from "./agent-config-initializer.js";
import {
  AgentConfigInitializerInput,
  AgentConfigInitializerOutput,
  AgentConfigMinimal,
} from "./dto.js";
import {
  AgentConfigInitializerToolResult,
  AgentConfigInitializerTool,
} from "./tool.js";

const logger = Logger.root.child({ name: "agent-config-tests" });
const llm = getChatLLM("supervisor");
const agentId = "supervisor:boss[1]:1";
const onUpdate = () => ({});
const getAgentConfigInitializerTool = (
  actingAgentId = "supervisor:boss[1]:1",
) => {
  vi.spyOn(
    AgentConfigInitializerTool.prototype as unknown as {
      _run: AgentConfigInitializerTool["_run"];
    },
    "_run",
  ).mockImplementation(async (input) => {
    if (input.method === "createAgentConfig") {
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
      } satisfies AgentConfigInitializerToolResult);
    }

    throw new Error(`Unimplemented method mock: ${input.method}`);
  });

  return new AgentConfigInitializer(logger, actingAgentId);
};

const availableTools = [
  tool("tavily_search_api"),
  tool("tavily_page_extract"),
] satisfies AgentConfigInitializerInput["availableTools"];

const existingAgentConfigs = [
  {
    agentType: "historical_sites_identifier",
    tools: ["tavily_search_api"],
    instructions: `Identifies historical sites in a given location using the tavily_search_api tool.
  instructions: Context: You are an agent specializing in identifying historical sites. You are activated by an external task and receive a location as input. You use the tavily_search_api tool to retrieve a list of historical sites.

Objective: Use the provided location to fetch a list of historical sites. Return the results in a structured format.

Response format: List each site with its name and a brief description:

Historical Sites in Back Bay:
1. Name: [Site Name 1] — Description: [Description 1]
2. Name: [Site Name 2] — Description: [Description 2]`,
    description:
      "Identifies historical sites in a given location using the tavily_search_api tool.",
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
    instructions: `Context: You are an agent specializing in creating customized itineraries. You are activated by an external task and receive outputs from Steps 1–3 as input. You use the itinerary_creator tool to generate a detailed itinerary.

Objective: Use the provided historical sites, game schedules, and dining suggestions to create a balanced 3-day itinerary. Ensure each day includes a mix of activities, and provide specific times for games and dining.

Response format: Present the itinerary day by day with activities, times, and details:

3-Day Customized Itinerary:
Day 1:
- Morning: Visit [Historical Site 1] (from Step 1)
- Lunch: Dine at [Italian Restaurant 1] (from Step 2)
- Afternoon: Attend [Hockey Game] (from Step 1)
- Evening: Dinner at [Chinese Restaurant 1] (from Step 2)
Day 2:
- Morning: Explore [Historical Site 2] (from Step 1)
- Lunch: Enjoy a meal at [French Restaurant 1] (from Step 2)
- Afternoon: Watch [Basketball Game] (from Step 1)
- Evening: Dine at [Italian Restaurant 2] (from Step 2)
Day 3:
- Morning: Discover [Historical Site 3] (from Step 1)
- Lunch: Lunch at [Chinese Restaurant 2] (from Step 2)
- Afternoon: Free time for personal interests or additional exploration
- Evening: Farewell dinner at [French Restaurant 2] (from Step 2)`,
    description:
      "Creates a balanced 3-day itinerary incorporating historical sites, game schedules, and dining suggestions based on user-provided outputs from Steps 1–3.",
    agentConfigVersion: 1,
    agentConfigId: "operator:itinerary_creator:1",
  },
] satisfies AgentConfigMinimal[];

describe(`AgentConfigInitializer > Create`, () => {
  afterEach(() => {
    vi.restoreAllMocks(); // Clean up mocks after each test
  });

  it(`1. Identify historical sites in Back Bay`, async () => {
    const agentConfigInitializer = getAgentConfigInitializerTool();
    const request = `Identify historical sites in Back Bay (input: location; output: list of sites) [tool: tavily_search_api]`;
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

    expect(resp).toMatchObject({
      type: "SUCCESS",
      result: {
        agentType: expect.matchPattern(pb().all("historical", "site")),
        tools: expect.arrayContaining(["tavily_search_api"]),
        agentConfigVersion: expect.any(Number),
      },
      attempts: [],
    } satisfies DeepPartial<RetrySuccessResult<AgentConfigInitializerOutput>>);
  });

  it(`2. Find upcoming hockey/basketball game schedules in Boston`, async () => {
    const agentConfigInitializer = getAgentConfigInitializerTool();
    const request = `Find upcoming hockey/basketball game schedules in Boston (input: sports, location; output: game list) [tools: tavily_search_api]`;
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
          existingAgentConfigs: existingAgentConfigs.slice(0, 1),
          task: request,
        },
        userMessage: request,
      },
      { llm, agentId, onUpdate },
    );

    expect(resp).toMatchObject({
      type: "SUCCESS",
      result: {
        agentType: expect.matchPattern(
          pb().all("game", pb().alt("schedule", "search", "find")),
        ),
        tools: expect.arrayContaining(["tavily_search_api"]),
        agentConfigVersion: expect.any(Number),
      },
      attempts: [],
    } satisfies DeepPartial<RetrySuccessResult<AgentConfigInitializerOutput>>);
  });

  it(`3. Recommend Italian, Chinese, and French restaurants in Back Bay for each day`, async () => {
    const agentConfigInitializer = getAgentConfigInitializerTool();
    const request = `Recommend Italian, Chinese, and French restaurants in Back Bay for each day (input: dining preferences, location; output: restaurant list) [tools: tavily_search_api]`;
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
            {
              step: "Find upcoming hockey/basketball game schedules in Boston",
              inputOutput: "input: sports, location; output: game list",
              resource: { type: "agent", agentType: "tavily_search_api" },
            },
          ],
          availableTools,
          existingAgentConfigs: existingAgentConfigs.slice(0, 2),
          task: request,
        },
        userMessage: request,
      },
      { llm, agentId, onUpdate },
    );

    expect(resp).toMatchObject({
      type: "SUCCESS",
      result: {
        agentType: expect.matchPattern(pb().all("restaurant", "recommend")),
        tools: expect.arrayContaining(["tavily_search_api"]),
        agentConfigVersion: expect.any(Number),
      },
      attempts: [],
    } satisfies DeepPartial<RetrySuccessResult<AgentConfigInitializerOutput>>);
  });

  it(`4. Create a balanced 3-day itinerary incorporating historical sites, games, and dining suggestions`, async () => {
    const agentConfigInitializer = getAgentConfigInitializerTool();
    const request = `Create a balanced 3-day itinerary incorporating historical sites, games, and dining suggestions (input: outputs from Steps 1–3; output: detailed itinerary) [LLM]`;
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
          availableTools,
          existingAgentConfigs: existingAgentConfigs.slice(0, 3),
          task: request,
        },
        userMessage: request,
      },
      { llm, agentId, onUpdate },
    );

    expect(resp).toMatchObject({
      type: "SUCCESS",
      result: {
        agentType: expect.matchPattern(
          pb().all("itinerary", pb().alt("creat", "plan")),
        ),
        tools: [],
        agentConfigVersion: expect.any(Number),
      },
      attempts: [],
    } satisfies DeepPartial<RetrySuccessResult<AgentConfigInitializerOutput>>);
  });
});

describe(`AgentConfigInitializer > Select`, () => {
  it(`1. Identify historical sites in Back Bay`, async () => {
    const agentConfigInitializer = getAgentConfigInitializerTool();
    const request = `Identify historical sites in Back Bay (input: location; output: list of sites) [agent: historical_sites_identifier]`;
    const resp = await agentConfigInitializer.run(
      {
        data: {
          previousSteps: [],
          availableTools,
          existingAgentConfigs,
          selectOnly: true,
          task: request,
        },
        userMessage: request,
      },
      { llm, agentId, onUpdate },
    );

    expect(resp).toMatchObject({
      type: "SUCCESS",
      result: {
        agentType: "historical_sites_identifier",
        tools: ["tavily_search_api"],
        agentConfigVersion: 1,
      },
      attempts: [],
    } satisfies DeepPartial<RetrySuccessResult<AgentConfigInitializerOutput>>);
  });

  it(`2. Find upcoming hockey/basketball game schedules in Boston`, async () => {
    const agentConfigInitializer = getAgentConfigInitializerTool();
    const request = `Find upcoming hockey/basketball game schedules in Boston (input: sports, location; output: game list) [agent: game_scheduler]`;
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
          existingAgentConfigs,
          selectOnly: true,
          task: request,
        },
        userMessage: request,
      },
      { llm, agentId, onUpdate },
    );

    expect(resp).toMatchObject({
      type: "SUCCESS",
      result: {
        agentType: "game_scheduler",
        tools: ["tavily_search_api"],
        agentConfigVersion: 1,
      },
      attempts: [],
    } satisfies DeepPartial<RetrySuccessResult<AgentConfigInitializerOutput>>);
  });

  it(`3. Recommend Italian, Chinese, and French restaurants in Back Bay for each day`, async () => {
    const agentConfigInitializer = getAgentConfigInitializerTool();
    const request = `Recommend Italian, Chinese, and French restaurants in Back Bay for each day (input: dining preferences, location; output: restaurant list) [agent: multi_cuisine_restaurant_recommender]`;
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
            {
              step: "Find upcoming hockey/basketball game schedules in Boston",
              inputOutput: "input: sports, location; output: game list",
              resource: { type: "agent", agentType: "tavily_search_api" },
            },
          ],
          availableTools,
          existingAgentConfigs,
          selectOnly: true,
          task: request,
        },
        userMessage: request,
      },
      { llm, agentId, onUpdate },
    );

    expect(resp).toMatchObject({
      type: "SUCCESS",
      result: {
        agentType: "multi_cuisine_restaurant_recommender",
        tools: ["tavily_search_api"],
        agentConfigVersion: 1,
      },
      attempts: [],
    } satisfies DeepPartial<RetrySuccessResult<AgentConfigInitializerOutput>>);
  });

  it(`4. Create a balanced 3-day itinerary incorporating historical sites, games, and dining suggestions`, async () => {
    const agentConfigInitializer = getAgentConfigInitializerTool();
    const request = `Create a balanced 3-day itinerary incorporating historical sites, games, and dining suggestions (input: outputs from Steps 1–3; output: detailed itinerary) [agent: itinerary_creator]`;
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
          availableTools,
          existingAgentConfigs,
          selectOnly: true,
          task: request,
        },
        userMessage: request,
      },
      { llm, agentId, onUpdate },
    );

    expect(resp).toMatchObject({
      type: "SUCCESS",
      result: {
        agentType: "itinerary_creator",
        tools: [],
        agentConfigVersion: 1,
      },
      attempts: [],
    } satisfies DeepPartial<RetrySuccessResult<AgentConfigInitializerOutput>>);
  });
});
