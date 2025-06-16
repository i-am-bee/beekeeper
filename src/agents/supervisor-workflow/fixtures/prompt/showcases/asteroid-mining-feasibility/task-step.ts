import { createFixtures, FixtureName } from "../../../base/fixtures.js";
import {
  createResourceFixtures,
  TaskStepWithVariousResource,
} from "../../../base/resource-fixtures.js";
import agentsFixtures from "./agent-config.js";
import toolsFixtures from "./tools.js";
import tasksFixtures from "./task-config.js";
import taskRunsFixtures from "./task-run.js";
import { TaskStepMapper } from "@/agents/supervisor-workflow/workflow-composer/helpers/task-step/task-step-mapper.js";

type ToolName = FixtureName<typeof toolsFixtures>;

const ENTRIES = [
  {
    no: 1,
    step: `Analyze the mineral composition data of Asteroid 433-Eros`,
    ...TaskStepMapper.parseInputOutput(
      `input: asteroid_id: "433-Eros", analysis_depth: "deep"; output: mineral composition data`,
    ),
    resource: createResourceFixtures(
      {
        type: "tools",
        tools: ["spectral_composition_analyzer_api"] as ToolName[],
      },
      {
        type: "agent",
        agent: agentsFixtures.get(`asteroid_mineral_composition_analyzer`),
      },
      {
        type: "task",
        task: tasksFixtures.get(`analyze_asteroid_mineral_composition`),
      },
      {
        type: "task_run",
        taskRun: taskRunsFixtures.get("analyze_asteroid_mineral_composition_1"),
      },
    ),
  },
  {
    no: 2,
    step: `Cross-reference the mineral composition findings with orbital mechanics calculations`,
    ...TaskStepMapper.parseInputOutput(
      `input: asteroid_id: "433-Eros", mineral_composition: mineral composition data [from Step 1]; output: cross-referenced data`,
    ),
    resource: createResourceFixtures(
      {
        type: "tools",
        tools: ["orbital_mechanics_calculator_api"] as ToolName[],
      },
      {
        type: "agent",
        agent: agentsFixtures.get(`asteroid_mission_planner`),
      },
      {
        type: "task",
        task: tasksFixtures.get(
          `cross_reference_mineral_composition_with_orbital_mechanics`,
        ),
      },
      {
        type: "task_run",
        taskRun: taskRunsFixtures.get(
          "cross_reference_mineral_composition_with_orbital_mechanics_1",
        ),
      },
    ),
  },
  {
    no: 3,
    step: `Compile a mining viability report that integrates the technical findings from the mineral analysis and orbital mechanics`,
    ...TaskStepMapper.parseInputOutput(
      `input: mineral composition data [from Step 1], cross-referenced data [from Step 2]; output: comprehensive mining viability report`,
    ),
    resource: createResourceFixtures(
      {
        type: "llm",
      },
      {
        type: "agent",
        agent: agentsFixtures.get(`mining_viability_report_compiler`),
      },
      {
        type: "task",
        task: tasksFixtures.get(`compile_mining_viability_report`),
      },
      {
        type: "task_run",
        taskRun: taskRunsFixtures.get("compile_mining_viability_report_1"),
      },
    ),
  },
] as const satisfies TaskStepWithVariousResource[];

const fixtures = createFixtures(ENTRIES, ({ step }) => step);
export default fixtures;
