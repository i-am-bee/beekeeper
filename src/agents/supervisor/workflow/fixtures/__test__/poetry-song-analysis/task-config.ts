import { TaskConfigMinimal } from "@/agents/supervisor/workflow/workflow-composer/task-initializer/task-config-initializer/dto.js";
import { createFixtures, FixtureName } from "../../base/fixtures.js";
import { addTaskConfigMissingAttrs } from "../../helpers/add-missing-config-attrs.js";
import agentConfigFixtures from "./agent-config.js";

type AgentType = FixtureName<typeof agentConfigFixtures>;

const ENTRIES = [
  // {
  //   taskType: "search_round_trip_flights",
  //   agentType: "flight_options_finder",
  //   description:
  //     "Task to search for round-trip flights between a specified origin and destination with given preferences, including departure and return dates and airline preferences.",
  //   taskConfigInput: `{"origin":"<origin>","destination":"<destination>","departureDate":"<departureDate>","returnDate":"<returnDate>","airlinePreferences":"<airlinePreferences>"}`,
  // },
] as const satisfies (TaskConfigMinimal & { agentType: AgentType })[];

export default createFixtures(
  addTaskConfigMissingAttrs(ENTRIES),
  ({ taskType }) => taskType,
);
