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
      "Generate a short story based on a provided <story concept>. Ensure it has a clear beginning, middle, and end, creatively incorporating the concept.",
    taskConfigInput: `{"story_concept":"<concept or theme for the story>"}`,
  },
  {
    taskType: "merge_short_stories_into_screenplay_scene",
    agentType: "screenplay_scene_creator" satisfies AgentType,
    description:
      "Create a screenplay scene that creatively merges elements from multiple provided short stories. Ensure the scene is coherent and engaging, with well-structured dialogue and action descriptions that integrate the themes and characters from the input stories.",
    taskConfigInput: `{"short_stories":["<short story>", "..."]}`,
  },
  {
    taskType: "analyze_screenplay_scene_convergence",
    agentType: "screenplay_scene_analyst" satisfies AgentType,
    description:
      "Provide a detailed analytical breakdown of how different narratives and themes converge within a provided <screenplay scene>. Highlight the integration of narratives, character interactions, and thematic elements.",
    taskConfigInput: `{"screenplay_scene":"<screenplay scene to analyze>"}`,
  },
] as const satisfies TaskConfigMinimal[];

export default createFixtures(
  addTaskConfigMissingAttrs(ENTRIES),
  ({ taskType }) => taskType,
);
