import { createFixtures, FixtureName } from "../../base/fixtures.js";
import { addTaskConfigMissingAttrs } from "../../helpers/add-missing-config-attrs.js";
import agentConfigFixtures from "./agent-config.js";
import { TaskConfigMinimal } from "@/agents/supervisor-workflow/workflow-composer/task-initializer/task-config-initializer/dto.js";

type AgentType = FixtureName<typeof agentConfigFixtures>;

const ENTRIES = [
  {
    taskType: "fetch_upcoming_f1_race",
    agentType: "f1_race_schedule_fetcher" satisfies AgentType,
    description:
      "Get details of the next F1 race including location, date, and start time.",
    taskConfigInput: "",
  },
  {
    taskType: "analyze_driver_track_history",
    agentType: "track_performance_analyzer" as const satisfies AgentType,
    description:
      "Analyze how a specific F1 driver has historically performed on the upcoming race track.",
    taskConfigInput: JSON.stringify({
      driver: "<driver_name>",
      track: "<track_name>",
      race_window: "last_5_years",
    }),
  },
  {
    taskType: "get_driver_form",
    agentType: "driver_form_tracker" as const satisfies AgentType,
    description:
      "Track recent form of a driver across the last N races, including position changes and reliability.",
    taskConfigInput: JSON.stringify({
      driver: "<driver_name>",
      recent_races: 5,
    }),
  },
  {
    taskType: "weather_impact_analysis",
    agentType: "weather_impact_analyzer" as const satisfies AgentType,
    description:
      "Predict the impact of forecast weather on the next F1 race and identify drivers who typically perform well in those conditions.",
    taskConfigInput: JSON.stringify({
      track_location: "<track_location>",
      race_day: "<YYYY-MM-DD>",
    }),
  },
  {
    taskType: "generate_f1_podium_prediction",
    agentType: "outcome_synthesizer" as const satisfies AgentType,
    description:
      "Generate a prediction for the next race's podium based on recent data, track stats, and forecasted conditions.",
    taskConfigInput: JSON.stringify({
      include_weather: true,
      include_driver_form: true,
      include_team_stats: true,
    }),
  },
] as const satisfies TaskConfigMinimal[];

export default createFixtures(
  addTaskConfigMissingAttrs(ENTRIES),
  ({ taskType }) => taskType,
);
