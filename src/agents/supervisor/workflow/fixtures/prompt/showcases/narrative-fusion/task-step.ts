import { TaskStepMapper } from "@/agents/supervisor/workflow/workflow-composer/helpers/task-step/task-step-mapper.js";
import { createFixtures } from "../../../base/fixtures.js";
import {
  createResourceFixtures,
  TaskStepWithVariousResource,
} from "../../../base/resource-fixtures.js";
import agentsFixtures from "./agent-config.js";
import tasksFixtures from "./task-config.js";
import taskRunsFixtures from "./task-run.js";

// type ToolName = FixtureName<typeof toolsFixtures>;

const ENTRIES = [
  {
    no: 1,
    step: "Write a short story based on the concept of time travel",
    ...TaskStepMapper.parseInputOutput(
      'input: story concept "time travel"; output: short story',
    ),
    resource: createResourceFixtures(
      { type: "llm" },
      { type: "agent", agent: agentsFixtures.get("short_story_generator") },
      { type: "task", task: tasksFixtures.get("generate_short_story") },
      {
        type: "task_run",
        taskRun: taskRunsFixtures.get("generate_short_story_1"),
      },
    ),
  },
  {
    no: 2,
    step: "Write a short story based on the concept of bioluminescent fungi",
    ...TaskStepMapper.parseInputOutput(
      'input: story concept "bioluminescent fungi"; output: short story',
    ),
    resource: createResourceFixtures(
      { type: "llm" },
      { type: "agent", agent: agentsFixtures.get("short_story_generator") },
      { type: "task", task: tasksFixtures.get("generate_short_story") },
      {
        type: "task_run",
        taskRun: taskRunsFixtures.get("generate_short_story_2"),
      },
    ),
  },
  {
    no: 3,
    step: "Write a short story based on the concept of ancient desert rituals",
    ...TaskStepMapper.parseInputOutput(
      'input: story concept "ancient desert rituals"; output: short story',
    ),
    resource: createResourceFixtures(
      { type: "llm" },
      { type: "agent", agent: agentsFixtures.get("short_story_generator") },
      { type: "task", task: tasksFixtures.get("generate_short_story") },
      {
        type: "task_run",
        taskRun: taskRunsFixtures.get("generate_short_story_3"),
      },
    ),
  },
  {
    no: 4,
    step: "Write a short story based on the concept of urban foxes",
    ...TaskStepMapper.parseInputOutput(
      'input: story concept "urban foxes"; output: short story',
    ),
    resource: createResourceFixtures(
      { type: "llm" },
      { type: "agent", agent: agentsFixtures.get("short_story_generator") },
      { type: "task", task: tasksFixtures.get("generate_short_story") },
      {
        type: "task_run",
        taskRun: taskRunsFixtures.get("generate_short_story_4"),
      },
    ),
  },
  {
    no: 5,
    step: "Create a screenplay scene that merges all four stories",
    ...TaskStepMapper.parseInputOutput(
      "input: short story [from Steps 1], short story [from Steps 2], short story [from Steps 3], short story [from Steps 4]; output: screenplay scene",
    ),
    resource: createResourceFixtures(
      { type: "llm" },
      { type: "agent", agent: agentsFixtures.get("screenplay_scene_creator") },
      {
        type: "task",
        task: tasksFixtures.get("merge_short_stories_into_screenplay_scene"),
      },
      {
        type: "task_run",
        taskRun: taskRunsFixtures.get(
          "merge_short_stories_into_screenplay_scene_1",
        ),
      },
    ),
  },
  {
    no: 6,
    step: "Provide an analytical breakdown of how the narratives converge in the screenplay scene",
    ...TaskStepMapper.parseInputOutput(
      "input: screenplay scene [from Step 5]; output: analytical breakdown",
    ),
    resource: createResourceFixtures(
      { type: "llm" },
      { type: "agent", agent: agentsFixtures.get("screenplay_scene_analyst") },
      {
        type: "task",
        task: tasksFixtures.get("analyze_screenplay_scene_convergence"),
      },
      {
        type: "task_run",
        taskRun: taskRunsFixtures.get("analyze_screenplay_scene_convergence_1"),
      },
    ),
  },
] as const satisfies TaskStepWithVariousResource[];

const fixtures = createFixtures(ENTRIES, ({ step }) => step);
export default fixtures;
