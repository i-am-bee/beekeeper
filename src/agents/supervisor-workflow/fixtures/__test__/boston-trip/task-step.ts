import { createFixtures, FixtureName } from "../../base/fixtures.js";
import {
  createResourceFixtures,
  TaskStepWithVariousResource,
} from "../../base/resource-fixtures.js";
import toolsFixtures from "./tools.js";
import agentsFixtures from "./agent-config.js";
import tasksFixtures from "./task-config.js";

type ToolName = FixtureName<typeof toolsFixtures>;

const ENTRIES = [
  {
    no: 1,
    step: "Identify historical sites in Back Bay",
    inputOutput: "input: location; output: list of sites",
    resource: createResourceFixtures(
      {
        tools: ["historical_sites_search_api"] as const satisfies ToolName[],
        type: "tools",
      },
      {
        agent: agentsFixtures.get("historical_sites_identifier"),
        type: "agent",
      },
      {
        task: tasksFixtures.get("identify_historical_sites"),
        type: "task",
      },
    ),
  },
  {
    no: 2,
    step: "Find upcoming hockey/basketball game schedules in a given location",
    inputOutput: "input: sport, location; output: game list",
    resource: createResourceFixtures(
      {
        tools: ["tavily_search_api"] as const satisfies ToolName[],
        type: "tools",
      },
      {
        agent: agentsFixtures.get("game_scheduler"),
        type: "agent",
      },
      {
        task: tasksFixtures.get("find_sports_game_schedules"),
        type: "task",
      },
    ),
  },
  {
    no: 3,
    step: "Recommend Italian, Chinese, and French restaurants in Back Bay for each day",
    inputOutput:
      "input: dining preferences, location, days; output: restaurant list",
    resource: createResourceFixtures(
      {
        tools: ["tavily_search_api"] as const satisfies ToolName[],
        type: "tools",
      },
      {
        agent: agentsFixtures.get("restaurant_recommender"),
        type: "agent",
      },
      {
        task: tasksFixtures.get("recommend_restaurants"),
        type: "task",
      },
    ),
  },
  {
    no: 4,
    dependencies: [1, 2, 3],
    step: "Create a balanced 3-day itinerary incorporating historical sites, games, and dining suggestions",
    inputOutput:
      "input: historical sites [from Step 1], games [from Step 2], restaurants [from Step 3]; output: detailed itinerary",
    resource: createResourceFixtures(
      {
        tools: [],
        type: "tools",
      },
      {
        agent: agentsFixtures.get("itinerary_creator"),
        type: "agent",
      },
      {
        task: tasksFixtures.get("create_3_day_itinerary"),
        type: "task",
      },
    ),
  },
] as const satisfies TaskStepWithVariousResource[];

const fixtures = createFixtures(ENTRIES, ({ step }) => step);

export default fixtures;
