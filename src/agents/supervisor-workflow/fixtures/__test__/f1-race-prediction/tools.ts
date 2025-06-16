import { AgentAvailableTool } from "@/agents/supervisor-workflow/workflow-composer/task-initializer/agent-config-initializer/dto.js";
import { createFixtures } from "../../base/fixtures.js";

const ENTRIES = [
  {
    toolName: "driver_stats_api",
    description:
      "Returns driver-specific statistics across seasons, including finishes, qualifying positions, overtakes, DNFs, and more.",
  },
  {
    toolName: "f1_race_api",
    description:
      "Fetches structured Formula 1 data for prediction workflows. Supports queries for upcoming race schedules, historical results by driver/team/track, qualifying results, season standings, and circuit metadata. Designed for use in multi-agent systems that analyze performance trends, simulate outcomes, or generate predictions based on race-specific context.",
  },
  {
    toolName: "pit_stop_stats",
    description:
      "Provides average pit stop times, errors, and penalties for each team. Useful for strategy prediction.",
  },
  {
    toolName: "race_strategy_simulator",
    description:
      "Runs simulation scenarios for upcoming F1 races based on weather, tire strategy, and car setup. Returns probable outcomes for key drivers.",
  },
  {
    toolName: "social_sentiment_api",
    description:
      "Analyzes fan sentiment around drivers and teams using social media posts and forum data. Returns tone, volume, and trending topics.",
  },
  {
    toolName: "team_performance_api",
    description:
      "Delivers team-wide performance metrics per race or season — includes car reliability, strategy effectiveness, and consistency scores.",
  },
  {
    toolName: "weather_forecast_api",
    description:
      "Get upcoming weather forecasts for specific race tracks or cities. Returns temperature, precipitation, wind, and condition likelihoods.",
  },
] as const satisfies AgentAvailableTool[];

export default createFixtures(ENTRIES, ({ toolName }) => toolName);
