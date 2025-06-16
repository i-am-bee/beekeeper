import { createFixtures, FixtureName } from "../../../base/fixtures.js";
import {
  createResourceFixtures,
  TaskStepWithVariousResource,
} from "../../../base/resource-fixtures.js";
import agentsFixtures from "./agent-config.js";
import toolsFixtures from "./tools.js";
import tasksFixtures from "./task-config.js";
import taskRunsFixtures from "./task-run.js";

type ToolName = FixtureName<typeof toolsFixtures>;
// { type: "agent", agent: agentsFixtures.get("TBD") },
// { type: "task", task: tasksFixtures.get("TBD") },
// {
//   type: "task_run",
//   taskRun: taskRunsFixtures.get("TBD"),
// },

const ENTRIES = [
  {
    no: 1,
    step: "Conduct basic sonar mapping to identify underwater terrain features in the Mariana Trench",
    inputOutput:
      'input: zone_name: "Mariana Trench", scan_resolution: "standard", depth_range: "full"; output: terrain sonar data',
    resource: createResourceFixtures(
      {
        type: "tools",
        tools: ["terrain_sonar_mapping_api"] as ToolName[],
      },
      { type: "agent", agent: agentsFixtures.get("underwater_terrain_mapper") },
      {
        type: "task",
        task: tasksFixtures.get("sonar_mapping_underwater_terrain"),
      },
      {
        type: "task_run",
        taskRun: taskRunsFixtures.get("sonar_mapping_underwater_terrain_1"),
      },
    ),
  },
  {
    no: 2,
    step: "Conduct basic sonar mapping to identify underwater terrain features in the Puerto Rico Trench",
    inputOutput:
      'input: zone_name: "Puerto Rico Trench", scan_resolution: "standard", depth_range: "full"; output: terrain sonar data',
    resource: createResourceFixtures(
      {
        type: "tools",
        tools: ["terrain_sonar_mapping_api"] as ToolName[],
      },
      { type: "agent", agent: agentsFixtures.get("underwater_terrain_mapper") },
      {
        type: "task",
        task: tasksFixtures.get("sonar_mapping_underwater_terrain"),
      },
      {
        type: "task_run",
        taskRun: taskRunsFixtures.get("sonar_mapping_underwater_terrain_2"),
      },
    ),
  },
  {
    no: 3,
    step: "Enhance sonar mapping by including marine life detection alongside terrain analysis at Mariana Trench",
    inputOutput:
      'input: zone_name: "Mariana Trench", scan_resolution: "standard", depth_range: "full", bio_frequency_range: "medium", organism_filter: "all"; output: integrated terrain and biological sonar data',
    resource: createResourceFixtures(
      {
        type: "tools",
        tools: [
          "terrain_sonar_mapping_api",
          "biological_sonar_detector_api",
        ] as ToolName[],
      },
      { type: "agent", agent: agentsFixtures.get("integrated_sonar_mapper") },
      { type: "task", task: tasksFixtures.get("integrated_sonar_mapping") },
      {
        type: "task_run",
        taskRun: taskRunsFixtures.get("integrated_sonar_mapping_1"),
      },
    ),
  },
  {
    no: 4,
    step: "Enhance sonar mapping by including marine life detection alongside terrain analysis at Puerto Rico Trench",
    inputOutput:
      'input: zone_name: "Puerto Rico Trench", scan_resolution: "standard", depth_range: "full", bio_frequency_range: "medium", organism_filter: "all"; output: integrated terrain and biological sonar data',
    resource: createResourceFixtures(
      {
        type: "tools",
        tools: [
          "terrain_sonar_mapping_api",
          "biological_sonar_detector_api",
        ] as ToolName[],
      },
      { type: "agent", agent: agentsFixtures.get("integrated_sonar_mapper") },
      { type: "task", task: tasksFixtures.get("integrated_sonar_mapping") },
      {
        type: "task_run",
        taskRun: taskRunsFixtures.get("integrated_sonar_mapping_2"),
      },
    ),
  },
  {
    no: 5,
    step: "Generate comprehensive comparison report for both zones",
    inputOutput:
      "input: terrain and biological sonar data [from Steps 3 and 4]; output: comprehensive exploration report",
    resource: createResourceFixtures(
      {
        type: "tools",
        tools: [
          "sonar_data_integrator_api",
          "zone_comparison_analyzer_api",
          "submarine_exploration_reporter_api",
        ] as ToolName[],
      },
      {
        type: "agent",
        agent: agentsFixtures.get("comprehensive_exploration_report_generator"),
      },
      {
        type: "task",
        task: tasksFixtures.get("generate_comprehensive_comparison_report"),
      },
      // {
      //   type: "task_run",
      //   taskRun: taskRunsFixtures.get("compare_trench_sonar_data_1"),
      // },
    ),
  },
] as const satisfies TaskStepWithVariousResource[];

const fixtures = createFixtures(ENTRIES, ({ step }) => step);
export default fixtures;
