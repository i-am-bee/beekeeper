import { createFixtures, FixtureName } from "../../base/fixtures.js";
import { addTaskConfigMissingAttrs } from "../../helpers/add-missing-config-attrs.js";
import agentConfigFixtures from "./agent-config.js";
import { TaskConfigMinimal } from "@/agents/supervisor/workflow/workflow-composer/task-initializer/task-config-initializer/dto.js";

type AgentType = FixtureName<typeof agentConfigFixtures>;

const ENTRIES = [
  {
    taskType: "find_historical_sites",
    agentType: "historical_sites_finder" as const satisfies AgentType,
    taskConfigInput: `{ "location": "<specified location>" }`,
    description:
      "Find historical sites in the given <specified location> using the historical_sites_search_api and return a list of historical sites, including their names, significance, and any available coordinates or jurisdiction details.",
  },
  {
    taskType: "search_sports_events",
    agentType: "sports_events_searcher" as const satisfies AgentType,
    taskConfigInput: `{ "location": "<specified location>", "duration": "<specified duration>" }`,
    description:
      "Search for sports events happening in the given <specified location> during the specified <duration> using the tavily_search_api and return a list of sports events, including their schedule and ticket purchasing details.`",
  },
  {
    taskType: "search_dining_recommendations",
    agentType: "dining_recommendations_searcher" as const satisfies AgentType,
    taskConfigInput: `{ "location": "<specified location>", "dining_preferences": ["<cuisine type>", "..."] }`,
    description:
      "Search for dining recommendations in the given <specified location> based on the provided <dining preferences> using the tavily_search_api and return a list of dining options, including restaurant names, cuisine types, and any available ratings or reviews.`",
  },
  {
    taskType: "compile_itinerary",
    agentType: "itinerary_compiler" as const satisfies AgentType,
    taskConfigInput: `{ "historical_sites": ["<site>", "..."], "sports_events": ["<event>", "..."], "dining_recommendations": ["<recommendation>", "..."] }`,
    description:
      "Compile a 3-day itinerary including visits to historical sites, attendance at sports events, and dining at recommended restaurants. Organize the information into a structured schedule, ensuring a balanced and enjoyable experience.`",
  },
  // {
  //   taskType: `TBD`,
  //   agentType: `TBD` as const satisfies AgentType,
  //   taskConfigInput: `TBD`,
  //   description:
  //     `TBD`,
  // },
] as const satisfies TaskConfigMinimal[];

export default createFixtures(
  addTaskConfigMissingAttrs(ENTRIES),
  ({ taskType }) => taskType,
);
