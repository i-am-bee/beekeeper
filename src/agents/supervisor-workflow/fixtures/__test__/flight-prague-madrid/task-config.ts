import { TaskConfigMinimal } from "@/agents/supervisor-workflow/workflow-composer/task-initializer/task-config-initializer/dto.js";
import { createFixtures, FixtureName } from "../../base/fixtures.js";
import { addTaskConfigMissingAttrs } from "../../helpers/add-missing-config-attrs.js";
import agentConfigFixtures from "./agent-config.js";

type AgentType = FixtureName<typeof agentConfigFixtures>;

const ENTRIES = [
  {
    taskType: "search_round_trip_flights",
    agentType: "flight_options_finder",
    description:
      "Task to search for round-trip flights between a specified origin and destination with given preferences, including departure and return dates and airline preferences.",
    taskConfigInput: `{"origin":"<origin>","destination":"<destination>","departureDate":"<departureDate>","returnDate":"<returnDate>","airlinePreferences":"<airlinePreferences>"}`,
  },
  {
    taskType: "search_hotels_with_preferences",
    agentType: "hotel_preference_searcher",
    description:
      "Task to search for hotels in a given destination with specific preferences such as star rating, proximity to city center, and amenities like reliable Wi-Fi.",
    taskConfigInput: `{"destination":"<destination>","hotelPreferences":"<hotelPreferences>"}`,
  },
  {
    taskType: "evaluate_combined_cost",
    agentType: "combined_cost_evaluator_agent",
    description:
      "Task to evaluate the combined cost of selected flight and hotel options to ensure it remains within a specified budget.",
    taskConfigInput: `{"flightOptions":"<flight options>","hotelOptions":"<hotel options>","budget":"<user budget>"}`,
  },
  {
    taskType: "compile_booking_options",
    agentType: "booking_options_compiler",
    description:
      "Task to compile a list of booking options for flights and hotels that match user criteria, including total price and direct booking links.",
    taskConfigInput: `{"optionsWithinBudget":"<options within budget>"}`,
  },
] as const satisfies (TaskConfigMinimal & { agentType: AgentType })[];

export default createFixtures(
  addTaskConfigMissingAttrs(ENTRIES),
  ({ taskType }) => taskType,
);
