import { createFixtures, FixtureName } from "../../base/fixtures.js";
import { addTaskConfigMissingAttrs } from "../../helpers/add-missing-config-attrs.js";
import agentConfigFixtures from "./agent-config.js";
import { TaskConfigMinimal } from "@/agents/supervisor-workflow/workflow-composer/task-initializer/task-config-initializer/dto.js";

type AgentType = FixtureName<typeof agentConfigFixtures>;

const ENTRIES = [
  {
    taskType: "create_3_day_itinerary",
    agentType: "itinerary_creator" as const satisfies AgentType,
    taskConfigInput: `{"historical_sites":"<list of historical sites>","games":"<list of games>","restaurants":"<list of restaurants>"}`,
    description:
      "Task to create a balanced 3-day itinerary incorporating historical sites, game schedules, and dining suggestions.",
  },
  {
    taskType: "find_sports_game_schedules",
    agentType: "game_scheduler" as const satisfies AgentType,
    taskConfigInput: `{"sport":"<choose sport: hockey | basketball>","location":"<given location>"}`,
    description:
      "Task to find upcoming hockey and basketball game schedules in a given location.",
  },
  {
    taskType: "identify_historical_sites",
    agentType: "historical_sites_identifier" as const satisfies AgentType,
    taskConfigInput: `{"location":"<given location>"}`,
    description: "Task to identify historical sites in a given location.",
  },
  {
    taskType: "recommend_restaurants",
    agentType: "restaurant_recommender" as const satisfies AgentType,
    taskConfigInput: `{"dining_preferences":"<preferences such as cuisine, dietary restrictions, or other preferences>","location":"<given location>", "days":"<list of days>"}`,
    description:
      "Task to recommend restaurants for each day based on user-defined preferences, location and list of the days.",
  },
] as const satisfies TaskConfigMinimal[];

export default createFixtures(
  addTaskConfigMissingAttrs(ENTRIES),
  ({ taskType }) => taskType,
);
