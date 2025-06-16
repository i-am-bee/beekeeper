import { AgentConfigTiny } from "@/agents/supervisor-workflow/workflow-composer/task-initializer/agent-config-initializer/dto.js";
import { createFixtures, FixtureName } from "../../base/fixtures.js";
import toolsFixtures from "./tools.js";
import { addAgentConfigMissingAttrs } from "../../helpers/add-missing-config-attrs.js";

type ToolName = FixtureName<typeof toolsFixtures>;

const ENTRIES = [
  {
    agentType: "historical_sites_finder",
    tools: ["historical_sites_search_api"] as const satisfies ToolName[],
    instructions: `Context: The agent receives a location as input and searches for historical sites within that area.
Objective: Use the historical_sites_search_api to find and list historical sites in the specified location.
Response format: Return a list of historical sites, including their names, significance, and any available coordinates or jurisdiction details.`,
    description:
      "This agent identifies historical sites in a specified location using the historical_sites_search_api.",
  },
  {
    agentType: "sports_events_searcher",
    tools: ["tavily_search_api"] as const satisfies ToolName[],
    instructions: `Context: The agent receives a location and duration as input and searches for sports events happening during that time.
Objective: Use the tavily_search_api to find and list sports events, including their schedule and ticket information, in the specified location and duration.
Response format: Return a list of sports events, including event names, dates, venues, and ticket purchasing details.`,
    description:
      "This agent searches for sports events happening in a specified location and duration using the tavily_search_api.",
  },
  {
    agentType: "dining_recommendations_searcher",
    tools: ["tavily_search_api"] as const satisfies ToolName[],
    instructions: `Context: The agent receives a location and a list of dining preferences as input and searches for dining recommendations that match these criteria.
Objective: Use the tavily_search_api to find and list dining options, including restaurant names, cuisine types, and any available ratings or reviews, in the specified location.
Response format: Return a list of dining recommendations, including restaurant names, cuisine types, and any available ratings or reviews.`,
    description:
      "This agent searches for dining recommendations based on specified location and cuisine preferences using the tavily_search_api.",
  },
  {
    agentType: "itinerary_compiler",
    tools: [] as const satisfies ToolName[],
    instructions: `Context: The agent receives lists of historical sites, sports events, and dining recommendations as input.
Objective: Organize the provided information into a structured itinerary for a specified number of days.
Response format: Return a day-by-day itinerary, including suggested times for visits, events, and meals, ensuring a balanced and enjoyable schedule.`,
    description:
      "This agent compiles a multi-day itinerary based on provided historical sites, sports events, and dining recommendations.",
  },
  // {
  //   agentType: `TBD`,
  //   tools: [`TBD`] as const satisfies ToolName[],
  //   instructions: `TBD`,
  //   description:
  //     `TBD`,
  // },
] as const satisfies AgentConfigTiny[];

export default createFixtures(
  addAgentConfigMissingAttrs(ENTRIES),
  ({ agentType }) => agentType,
);
