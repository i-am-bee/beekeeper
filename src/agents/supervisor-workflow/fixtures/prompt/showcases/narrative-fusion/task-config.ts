import { TaskConfigMinimal } from "@/agents/supervisor-workflow/workflow-composer/task-initializer/task-config-initializer/dto.js";
import { createFixtures, FixtureName } from "../../../base/fixtures.js";
import { addTaskConfigMissingAttrs } from "../../../helpers/add-missing-config-attrs.js";
import agentConfigFixtures from "./agent-config.js";

type AgentType = FixtureName<typeof agentConfigFixtures>;

const ENTRIES = [
  {
    taskType: "generate_short_story",
    agentType: "short_story_generator" satisfies AgentType,
    description:
      "Task to generate a short story based on a given concept or theme.",
    taskConfigInput: `{"story_concept":"<concept or theme for the story>"}`,
  },
  {
    taskType: "merge_short_stories_into_screenplay_scene",
    agentType: "screenplay_scene_creator" satisfies AgentType,
    description:
      "Task to create a screenplay scene by merging elements from multiple short stories into a cohesive narrative.",
    taskConfigInput: `{"short_stories":["<short story 1>", "<short story 2>", "<short story 3>", "<short story 4>"]}`,
  },
  {
    taskType: "analyze_screenplay_scene_convergence",
    agentType: "screenplay_scene_analyst" satisfies AgentType,
    description:
      "Task to provide a detailed analytical breakdown of how different narratives and themes converge within a given screenplay scene, focusing on narrative integration, character interactions, and thematic coherence.",
    taskConfigInput: `{"screenplay_scene":"<screenplay scene to analyze>"}`,
  },
] as const satisfies TaskConfigMinimal[];

export default createFixtures(
  addTaskConfigMissingAttrs(ENTRIES),
  ({ taskType }) => taskType,
);
