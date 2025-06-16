import { createFixtures, FixtureName } from "../../base/fixtures.js";
import {
  createResourceFixtures,
  TaskStepWithVariousResource,
} from "../../base/resource-fixtures.js";
import agentsFixtures from "./agent-config.js";
import tasksFixtures from "./task-config.js";
import toolsFixtures from "./tools.js";
import taskRunsFixtures from "./task-run.js";

type ToolName = FixtureName<typeof toolsFixtures>;

const ENTRIES = [
  {
    no: 1,
    dependencies: [],
    inputOutput: "input: circuit name; output: historical performance stats",
    resource: createResourceFixtures(
      {
        tools: ["f1_race_api"] satisfies ToolName[],
        type: "tools",
      },
      {
        agent: agentsFixtures.get("track_performance_analyzer"),
        type: "agent",
      },
      { 
        task: tasksFixtures.get('analyze_driver_track_history'),
        type: "task",
      }
    ),
    step: "Collect historical driver performance data for the specific circuit",
  },
  {
    no: 2,
    dependencies: [],
    inputOutput: "input: recent race data; output: recent performance trends",
    resource: createResourceFixtures(
      {
        tools: ["f1_race_api"] satisfies ToolName[],
        type: "tools",
      },
      {
        agent: agentsFixtures.get("qualifying_performance_fetcher"),
        type: "agent",
      },
      // TODO: add task
    ),
    step: "Analyze recent qualifying and race results",
  },
  {
    no: 3,
    dependencies: [],
    inputOutput: "input: circuit location; output: weather predictions",
    resource: createResourceFixtures(
      {
        tools: ["weather_forecast_api", "f1_race_api"] satisfies ToolName[],
        type: "tools",
      },
      {
        agent: agentsFixtures.get("weather_impact_analyzer"),
        type: "agent",
      },
      // TODO: add task
    ),
    step: "Incorporate weather forecasts for the race day",
  },
  {
    no: 4,
    dependencies: [],
    inputOutput: "input: teams; output: pit stop reliability scores",
    resource: createResourceFixtures(
      {
        tools: ["pit_stop_stats"] satisfies ToolName[],
        type: "tools",
      },
      {
        agent: agentsFixtures.get("pit_stop_efficiency_analyzer"),
        type: "agent",
      },
      // TODO: add task
    ),
    step: "Evaluate team pit stop reliability statistics",
  },
  {
    no: 5,
    dependencies: [],
    inputOutput: "input: driver list; output: form and strategy insights",
    resource: createResourceFixtures(
      {
        tools: ["f1_race_api"] satisfies ToolName[],
        type: "tools",
      },
      {
        agent: agentsFixtures.get("driver_form_tracker"),
        type: "agent",
      },
      // TODO: add task
    ),

    step: "Identify trends in driver form and strategy",
  },
  // {
  //   no: 6,
  //   dependencies: [1, 2, 3, 4, 5],
  //   inputOutput:
  //     "input: outputs from Steps 1-5; output: predicted top 3 finishers with confidence scores",
  //   resource: {
  //     type: "llm",
  //   },

  //   step: "Aggregate and weigh all factors to generate a confidence-based prediction",
  // },
  // {
  //   no: 7,
  //   dependencies: [6],
  //   inputOutput:
  //     "input: aggregated data and reasoning from Step 6; output: detailed prediction explanation",
  //   resource: {
  //     type: "llm",
  //   },

  //   step: "Articulate reasoning behind the forecast",
  // },
] as const satisfies TaskStepWithVariousResource[];

const fixtures = createFixtures(ENTRIES, ({ step }) => step);

export default fixtures;
