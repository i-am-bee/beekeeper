import { createFixtures, FixtureName } from "../../../base/fixtures.js";
import {
  createResourceFixtures,
  TaskStepWithVariousResource,
} from "../../../base/resource-fixtures.js";
import agentsFixtures from "./agent-config.js";
import toolsFixtures from "./tools.js";
import tasksFixtures from "./task-config.js";
import taskRunsFixtures from "./task-run.js";
import { TaskStepMapper } from "@/agents/supervisor/workflow/workflow-composer/helpers/task-step/task-step-mapper.js";

type ToolName = FixtureName<typeof toolsFixtures>;

const ENTRIES = [
  {
    no: 1,
    step: `Analyze local flora at Sunnybrook Farm for nectar sources suitable for beekeeping`,
    ...TaskStepMapper.parseInputOutput(
      `input: location: "Sunnybrook Farm"; output: nectar suitability data`,
    ),
    resource: createResourceFixtures(
      {
        type: "tools",
        tools: [
          "satellite_flora_scanner_api",
          "ground_survey_validator_api",
          "pollinator_database_lookup_api",
        ] as ToolName[],
      },
      { type: "agent", agent: agentsFixtures.get("flora_nectar_analysis") },
      {
        type: "task",
        task: tasksFixtures.get("analyze_flora_for_nectar_sources"),
      },
      {
        type: "task_run",
        taskRun: taskRunsFixtures.get("analyze_flora_for_nectar_sources_1"),
      },
    ),
  },
  {
    no: 2,
    step: "Analyze local flora at Meadowland Reserve for nectar sources suitable for beekeeping",
    ...TaskStepMapper.parseInputOutput(
      `input: location: "Meadowland Reserve"; output: nectar suitability data`,
    ),
    resource: createResourceFixtures(
      {
        type: "tools",
        tools: [
          "satellite_flora_scanner_api",
          "ground_survey_validator_api",
          "pollinator_database_lookup_api",
        ] as ToolName[],
      },
      { type: "agent", agent: agentsFixtures.get("flora_nectar_analysis") },
      {
        type: "task",
        task: tasksFixtures.get("analyze_flora_for_nectar_sources"),
      },
      {
        type: "task_run",
        taskRun: taskRunsFixtures.get("analyze_flora_for_nectar_sources_2"),
      },
    ),
  },
  {
    no: 3,
    step: `Analyze local flora at Sunnybrook Farm for nectar sources suitable for butterfly host plants`,
    ...TaskStepMapper.parseInputOutput(
      `input: location: "Sunnybrook Farm"; output: butterfly host compatibility data`,
    ),
    resource: createResourceFixtures(
      {
        type: "tools",
        tools: [
          "satellite_flora_scanner_api",
          "ground_survey_validator_api",
          "pollinator_database_lookup_api",
        ] as ToolName[],
      },
      {
        type: "agent",
        agent: agentsFixtures.get("flora_butterfly_host_analysis"),
      },
      {
        type: "task",
        task: tasksFixtures.get(`analyze_flora_for_butterfly_host_plants`),
      },
      {
        type: "task_run",
        taskRun: taskRunsFixtures.get(
          "analyze_flora_for_butterfly_host_plants_1",
        ),
      },
    ),
  },
  {
    no: 4,
    step: "Analyze local flora at Meadowland Reserve for nectar sources suitable for butterfly host plants",
    ...TaskStepMapper.parseInputOutput(
      `input: location: "Meadowland Reserve"; output: butterfly host compatibility data`,
    ),
    resource: createResourceFixtures(
      {
        type: "tools",
        tools: [
          "satellite_flora_scanner_api",
          "ground_survey_validator_api",
          "pollinator_database_lookup_api",
        ] as ToolName[],
      },
      {
        type: "agent",
        agent: agentsFixtures.get(`flora_butterfly_host_analysis`),
      },
      {
        type: "task",
        task: tasksFixtures.get(`analyze_flora_for_butterfly_host_plants`),
      },
      {
        type: "task_run",
        taskRun: taskRunsFixtures.get(
          "analyze_flora_for_butterfly_host_plants_2",
        ),
      },
    ),
  },
  {
    no: 5,
    step: "Compile findings into a structured report, highlighting key findings and recommendations for beekeeping and butterfly farming at each site",
    ...TaskStepMapper.parseInputOutput(
      "input: nectar suitability data [from Steps 1–2], butterfly host compatibility data [from Steps 3–4]; output: structured report",
    ),
    resource: createResourceFixtures(
      {
        type: "tools",
        tools: ["comparative_report_generator_api"] as ToolName[],
      },
      {
        type: "agent",
        agent: agentsFixtures.get(`report_compiler_for_farming_suitability`),
      },
      {
        type: "task",
        task: tasksFixtures.get(`compile_farming_suitability_report`),
      },
      {
        type: "task_run",
        taskRun: taskRunsFixtures.get("compile_farming_suitability_report_1"),
      },
    ),
  },
  // {
  //   no: 2,
  //   step: `TBD`,
  //   ...TaskStepMapper.parseInputOutput(`TBD`,
  //   resource: createResourceFixtures(
  //     { type: "llm" },
  //     { type: "agent", agent: agentsFixtures.get(`TBD`) },
  //     { type: "task", task: tasksFixtures.get(`TBD`) },
  //     {
  //       type: "task_run",
  //       taskRun: taskRunsFixtures.get("TBD_1"),
  //     },
  //   ),
  // },
] as const satisfies TaskStepWithVariousResource[];

const fixtures = createFixtures(ENTRIES, ({ step }) => step);
export default fixtures;
