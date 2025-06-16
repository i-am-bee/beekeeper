import { createFixtures, FixtureName } from "../../base/fixtures.js";
import {
  createResourceFixtures,
  TaskStepWithVariousResource,
} from "../../base/resource-fixtures.js";
import toolsFixtures from "./tools.js";
import agentsFixtures from "./agent-config.js";
import tasksFixtures from "./task-config.js";
import taskRunsFixtures from "./task-run.js";

type ToolName = FixtureName<typeof toolsFixtures>;

const ENTRIES = [
  {
    no: 1,
    step: "Find historical sites in Boston, specifically in the Back Bay area",
    inputOutput: `input: location "Back Bay"; output: list of historical sites`,
    resource: createResourceFixtures(
      {
        type: "tools",
        tools: ["historical_sites_search_api"] as const satisfies ToolName[],
      },
      {
        type: "agent",
        agent: agentsFixtures.get("historical_sites_finder"),
      },
      {
        type: "task",
        task: tasksFixtures.get("find_historical_sites"),
      },
      {
        type: "task_run",
        taskRun: taskRunsFixtures.get("find_historical_sites_1"),
      },
    ),
  },
  {
    no: 2,
    step: "Search for sports events happening in Boston during the user's stay",
    inputOutput: `input: location "Boston", duration "3 days"; output: sports event schedule and ticket information`,
    resource: createResourceFixtures(
      {
        type: "tools",
        tools: ["tavily_search_api"] as const satisfies ToolName[],
      },
      {
        type: "agent",
        agent: agentsFixtures.get("sports_events_searcher"),
      },
      {
        type: "task",
        task: tasksFixtures.get("search_sports_events"),
      },
      {
        type: "task_run",
        taskRun: taskRunsFixtures.get("search_sports_events_1"),
      },
    ),
  },
  {
    no: 3,
    step: `Search for dining recommendations for Italian, Chinese, and French cuisine in Boston`,
    inputOutput: `input: location "Boston", dining preferences ["Italian", "Chinese", "French"]; output: dining recommendations`,
    resource: createResourceFixtures(
      {
        type: "tools",
        tools: ["tavily_search_api"] as const satisfies ToolName[],
      },
      {
        type: "agent",
        agent: agentsFixtures.get("dining_recommendations_searcher"),
      },
      {
        type: "task",
        task: tasksFixtures.get("search_dining_recommendations"),
      },
      {
        type: "task_run",
        taskRun: taskRunsFixtures.get("search_dining_recommendations_1"),
      },
    ),
  },
  {
    no: 4,
    step: `Compile a 3-day itinerary including historical site visits, sports events, and dining recommendations`,
    inputOutput: `input: historical sites [from Step 1], sports events [from Step 2], dining recommendations [from Step 3]; output: complete 3-day itinerary`,
    resource: createResourceFixtures(
      {
        type: "tools",
        tools: [] as const satisfies ToolName[],
      },
      {
        type: "agent",
        agent: agentsFixtures.get("itinerary_compiler"),
      },
      {
        type: "task",
        task: tasksFixtures.get("compile_itinerary"),
      },
      {
        type: "task_run",
        taskRun: taskRunsFixtures.get("compile_itinerary_1"),
      },
    ),
  },
] as const satisfies TaskStepWithVariousResource[];

const fixtures = createFixtures(ENTRIES, ({ step }) => step);

export default fixtures;
