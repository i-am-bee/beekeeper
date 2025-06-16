import { TaskConfigMinimal } from "@/agents/supervisor-workflow/workflow-composer/task-initializer/task-config-initializer/dto.js";
import agentConfigFixtures from "./agent-config.js";
import { createFixtures, FixtureName } from "../../../base/fixtures.js";
import { addTaskConfigMissingAttrs } from "../../../helpers/add-missing-config-attrs.js";

type AgentType = FixtureName<typeof agentConfigFixtures>;

const ENTRIES = [
  // {
  //   taskType: "generate_short_story",
  //   agentType: "short_story_generator" satisfies AgentType,
  //   description:
  //     "Generate a short story based on a provided <story concept>. Ensure it has a clear beginning, middle, and end, creatively incorporating the concept.",
  //   taskConfigInput: `{"story_concept":"<concept or theme for the story>"}`,
  // },
] as const satisfies (TaskConfigMinimal & {
  agentType: AgentType;
})[];

export default createFixtures(
  addTaskConfigMissingAttrs(ENTRIES),
  ({ taskType }) => taskType,
);
