import { AgentConfigTiny } from "@/agents/supervisor-workflow/workflow-composer/task-initializer/agent-config-initializer/dto.js";
import { createFixtures, FixtureName } from "../../base/fixtures.js";
import toolsFixtures from "./tools.js";
import { addAgentConfigMissingAttrs } from "../../helpers/add-missing-config-attrs.js";

type ToolName = FixtureName<typeof toolsFixtures>;

const ENTRIES = [
  {
    agentType: "f1_race_schedule_fetcher",
    tools: ["f1_race_api"] as const satisfies ToolName[],
    description:
      "Fetches the upcoming F1 race details including race name, circuit, location, and date from the f1_race_api tool.",
    instructions: `Context: You are an agent that retrieves information about upcoming F1 races. You are activated by an external task to fetch the next scheduled race. Use the f1_race_api to retrieve upcoming race data.

Objective: Provide structured information about the next scheduled F1 race.

Response format:
Upcoming Race:
- Race Name: [Race Title]
- Circuit: [Circuit Name]
- Location: [City, Country]
- Date: [YYYY-MM-DD]
- Session Times:
  - Practice 1: [Time]
  - Practice 2: [Time]
  - Qualifying: [Time]
  - Race: [Time]`,
  },
  {
    agentType: "track_performance_analyzer",
    tools: ["f1_race_api"] as const satisfies ToolName[],
    description:
      "Analyzes historical driver and team performance on a specific F1 track using the f1_race_api tool.",
    instructions: `Context: You are an agent specializing in analyzing historical F1 performance on specific tracks. You are activated by an external task and receive a circuit name and optionally a driver/team as input. Use the f1_race_api tool to fetch past race results and generate performance summaries.

Objective: Provide an overview of historical performance on the given track. Return a structured summary of past winners, podium frequency, or average finish positions.

Response format:
Track Performance Summary for [Track Name]:
- Most Wins: [Driver/Team] (X times)
- Avg. Finish Position (Last 5 years): [Driver]: [Avg Pos], [Team]: [Avg Pos]
- Podium Frequency: [Driver A]: X, [Driver B]: Y`,
  },
  {
    agentType: "qualifying_performance_fetcher",
    tools: ["f1_race_api"] as const satisfies ToolName[],
    description:
      "Retrieves recent qualifying session results or season-wide qualifying stats for F1 drivers.",
    instructions: `Context: You are an agent that retrieves recent F1 qualifying performance. You are activated by an external task and receive one or more driver names or a race location. Use the f1_race_api to retrieve recent qualifying positions or patterns.

Objective: Return structured qualifying performance, either for a recent race or as a season average.

Response format:
Qualifying Summary for [Driver/Team]:
- [Race Name or Round]: [Position]
- Season Average Qualifying Position: [Value]
- Head-to-Head (last 5): [Driver A]: 3, [Driver B]: 2`,
  },
  {
    agentType: "driver_form_tracker",
    tools: ["f1_race_api"] as const satisfies ToolName[],
    description:
      "Analyzes recent race performance trends for a given F1 driver.",
    instructions: `Context: You are an agent that tracks recent driver form. You are activated by an external task and receive a driver name and number of recent races to analyze. Use the f1_race_api tool to compute trends such as average finish position, position gains/losses, and DNFs.

Objective: Return structured data on driver performance trend.

Response format:
Driver Form for [Driver Name] (Last [N] Races):
- Avg. Start Position: [Value]
- Avg. Finish Position: [Value]
- DNFs: [Number]
- Net Position Change (avg): [Value]`,
  },
  {
    agentType: "weather_impact_analyzer",
    tools: [
      "weather_forecast_api",
      "f1_race_api",
    ] as const satisfies ToolName[],
    description:
      "Forecasts weather and assesses potential impact on race outcome using historical performance in wet/dry conditions.",
    instructions: `Context: You are an agent that forecasts F1 race-day weather and analyzes how drivers perform under similar weather conditions. You receive a race location and date, and use weather_api and f1_race_api to generate insights.

Objective: Return weather forecast and impact notes on drivers or teams.

Response format:
Weather Impact for [Race Name]:
- Forecast: [Conditions] — [Temp], [Rain %]
- Historical Performance in Similar Conditions:
  - [Driver A]: [Insight]
  - [Driver B]: [Insight]`,
  },
  {
    agentType: "outcome_synthesizer",
    tools: [] as const satisfies ToolName[],
    description:
      "Synthesizes predictions from other agents into a ranked list of expected F1 race outcomes.",
    instructions: `Context: You are a reasoning agent that combines inputs from other agents (track performance, form, qualifying, weather, etc.) to estimate the most likely top finishers in the next race. You are activated after multiple analyses are complete.

Objective: Output a ranked prediction with confidence estimates and brief rationale.

Response format:
Predicted Top 3 for [Race Name]:
1. [Driver A] — Confidence: [X]% — Reason: [Summary]
2. [Driver B] — Confidence: [Y]% — Reason: [Summary]
3. [Driver C] — Confidence: [Z]% — Reason: [Summary]`,
  },
  {
    agentType: "pit_stop_efficiency_analyzer",
    tools: ["pit_stop_stats"] as const satisfies ToolName[],
    description:
      "Evaluates pit-stop performance for F1 teams and drivers, highlighting speed, errors, and penalties using the pit_stop_stats tool.",
    instructions: `Context: You are an agent tasked with assessing pit-stop execution. You receive one or more team or driver names (optionally a race or date range). Use pit_stop_stats to pull average stop times, slowest/fastest stops, errors, and penalties.  

Objective: Produce a concise, structured report that ranks efficiency and flags any recurring issues.

Response format:
Pit-Stop Summary for [Team/Driver] ([Race / Date Range]):
- Avg. Pit-Stop Time: [X.XX s] — Rank: [N]
- Fastest / Slowest Stop: [X.XX s] / [X.XX s]
- Errors Logged: [Count]  (Wheel-gun issues: A, Unsafe releases: B)
- Penalties: [Count] — Total Time Lost: [Y.YY s]
- Delta to Field Avg.: [+/- Z.ZZ s]`,
  },
] as const satisfies AgentConfigTiny[];

export default createFixtures(
  addAgentConfigMissingAttrs(ENTRIES),
  ({ agentType }) => agentType,
);
