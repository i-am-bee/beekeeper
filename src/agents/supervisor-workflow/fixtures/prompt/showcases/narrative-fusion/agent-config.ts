import { AgentConfigTiny } from "@/agents/supervisor-workflow/workflow-composer/task-initializer/agent-config-initializer/dto.js";
import { createFixtures, FixtureName } from "../../../base/fixtures.js";
import { addAgentConfigMissingAttrs } from "../../../helpers/add-missing-config-attrs.js";

import toolsFixtures from "./tools.js";

type ToolName = FixtureName<typeof toolsFixtures>;

const ENTRIES = [
  {
    agentType: "short_story_generator",
    description:
      "This agent generates short stories based on provided concepts or themes.",
    instructions: `Context: The agent receives a story concept or theme as input and generates a short story based on it.
Objective: Create a coherent and engaging short story that aligns with the given concept or theme.
Response format: The output should be a well-structured short story with a clear beginning, middle, and end, incorporating the provided concept or theme creatively.`,
    tools: [] as const satisfies ToolName[],
  },
  {
    agentType: "screenplay_scene_creator",
    description:
      "This agent creates screenplay scenes by merging multiple short stories into a cohesive narrative.",
    instructions: `Context: The agent receives multiple short stories as input and generates a screenplay scene that creatively merges elements from each story.
Objective: Create a coherent and engaging screenplay scene that incorporates key elements from the provided short stories.
Response format: The output should be a well-structured screenplay scene with dialogue and action descriptions, creatively integrating the themes and characters from the input stories.`,
    tools: [] as const satisfies ToolName[],
  },
  {
    agentType: "screenplay_scene_analyst",
    description:
      "This agent provides analytical breakdowns of screenplay scenes, focusing on narrative convergence and thematic elements.",
    instructions: `Context: The agent receives a screenplay scene as input and analyzes how different narratives and themes converge within it.
Objective: Provide a detailed analytical breakdown that highlights the integration of narratives, character interactions, and thematic elements in the screenplay scene.
Response format: The output should be a structured analysis that discusses the convergence of narratives, character dynamics, and thematic coherence within the screenplay scene.`,
    tools: [] as const satisfies ToolName[],
  },
] as const satisfies AgentConfigTiny[];

export default createFixtures(
  addAgentConfigMissingAttrs(ENTRIES),
  ({ agentType }) => agentType,
);
