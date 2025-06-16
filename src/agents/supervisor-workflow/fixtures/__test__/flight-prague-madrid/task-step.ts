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
    step: "Search for round-trip flights from Prague to Madrid with specified preferences",
    dependencies: [],
    inputOutput:
      "input: origin, destination, departureDate, returnDate, airlinePreferences; output: list of flight options with prices and booking links",

    resource: createResourceFixtures(
      {
        tools: ["flight_search_api"] as const satisfies ToolName[],
        type: "tools",
      },
      {
        agent: agentsFixtures.get("flight_options_finder"),
        type: "agent",
      },
      {
        task: tasksFixtures.get("search_round_trip_flights"),
        type: "task",
      },
    ),
  },
  {
    no: 2,
    step: "Search for 4-star hotels in Madrid within 10 minutes from the city center with reliable Wi-Fi",
    dependencies: [],
    inputOutput:
      "input: destination, hotelPreferences; output: list of hotel options with prices and booking links",
    resource: createResourceFixtures(
      {
        tools: ["hotel_search_api"] as const satisfies ToolName[],
        type: "tools",
      },
      {
        agent: agentsFixtures.get("hotel_preference_searcher"),
        type: "agent",
      },
      {
        task: tasksFixtures.get("search_hotels_with_preferences"),
        type: "task",
      },
    ),
  },
  {
    no: 3,
    step: "Evaluate the combined cost of selected flight and hotel options to ensure it remains under €2500",
    dependencies: [1, 2],
    inputOutput:
      "input: flight options [from Step 1], hotel options [from Step 2], budget; output: list of options within budget",

    resource: createResourceFixtures(
      {
        tools: ["combined_cost_evaluator"] as const satisfies ToolName[],
        type: "tools",
      },
      {
        agent: agentsFixtures.get("combined_cost_evaluator_agent"),
        type: "agent",
      },
      {
        task: tasksFixtures.get("evaluate_combined_cost"),
        type: "task",
      },
    ),
  },
  {
    no: 4,
    step: "Compile a list of booking options for flights and hotels that match user criteria with total price and direct booking links",
    dependencies: [3],
    inputOutput:
      "input: options within budget [from Step 3]; output: final list of booking options",
    resource: createResourceFixtures(
      {
        type: "llm",
      },
      {
        agent: agentsFixtures.get("booking_options_compiler"),
        type: "agent",
      },
      {
        task: tasksFixtures.get("compile_booking_options"),
        type: "task",
      },
    ),
  },
] as const satisfies TaskStepWithVariousResource[];

const fixtures = createFixtures(ENTRIES, ({ step }) => step);
export default fixtures;
