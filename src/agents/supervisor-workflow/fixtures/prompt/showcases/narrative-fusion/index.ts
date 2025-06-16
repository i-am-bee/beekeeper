import {
  ChoiceExplanations,
  WorkflowComposeFixture,
} from "../../../base/workflow-compose-fixtures.js";
import agentsFixtures from "./agent-config.js";
import tasksFixtures from "./task-config.js";
import taskStepsFixtures from "./task-step.js";
import taskRunsFixtures from "./task-run.js";
import toolsFixtures from "./tools.js";

const title = "Poetry and Hip-Hop Song Analysis";

const prompt =
  "Compose four unique short stories, each centered on a different concept: time travel, bioluminescent fungi, ancient desert rituals, and urban foxes. Then, using narrative motifs, settings, and character traits from each story, write a screenplay scene that merges these distinct worlds into a single coherent cinematic moment. Finally, provide an analytical breakdown showing how specific details from each original story were woven into the screenplay, illustrating narrative convergence and the benefits of modular creative generation.";

const choiceExplanations = {
  requestHandler:
    "The request involves creating multiple short stories and a screenplay, which is a complex, multi-step creative task.",
  problemDecomposer:
    "The problem involves creative writing tasks that can be handled by general LLM capabilities. Each component, such as writing short stories and creating a screenplay scene, can be achieved using LLM. Therefore, a STEP_SEQUENCE can be generated.",
  steps: [
    {
      stepNo: 1,
      agentConfig:
        "The task requires creating a short story based on a concept, which can be handled by leveraging the capabilities of a language model (LLM). There are no existing agent configs or tools available, so a new agent config needs to be created to handle this type of task.",
      taskConfig:
        "No existing task config matches the request; a new task config is required.",
      taskRun: `The task config "generate_short_story" exists and the input can be completed using the non-dependent field provided in the task step.`,
    },
    {
      stepNo: 2,
      agentConfig: `The task requires generating a short story based on a concept, which aligns with the existing agent's purpose of creating short stories from given concepts or themes. The current agent config for \`short_story_generator\` already satisfies this task without any need for structural edits or additional tools.`,
      taskConfig: `The existing task config "generate_short_story" already satisfies the requirement to write a short story based on a given concept, such as "bioluminescent fungi."`,
      taskRun: `The task config "generate_short_story" exists and the input can be completed using the non-dependent field "story concept" provided in the task step.`,
    },
    {
      stepNo: 3,
      agentConfig: `The task requires generating a short story based on a concept, which aligns with the existing agent's purpose of creating short stories from given concepts or themes. The current agent config for \`short_story_generator\` already satisfies this task without any need for structural edits or additional tools.`,
      taskConfig: `The existing task config "generate_short_story" already satisfies the requirement to write a short story based on a given concept, such as "ancient desert rituals"`,
      taskRun: `The task config "generate_short_story" exists and the input can be completed using the non-dependent field provided in the task step.`,
    },
    {
      stepNo: 4,
      agentConfig: `The task requires generating a short story based on a concept, which aligns with the existing agent's purpose of creating short stories from given concepts or themes. The current agent config for \`short_story_generator\` already satisfies this task without any need for structural edits or additional tools.`,
      taskConfig: `The existing task config "generate_short_story" already satisfies the requirement to write a short story based on a given concept, such as "urban foxes"`,
      taskRun: `The task config "generate_short_story" exists and the input can be completed using the non-dependent field "story concept" provided in the task step.`,
    },
    {
      stepNo: 5,
      agentConfig: `The task requires creating a screenplay scene by merging four short stories. This task involves generating a narrative output based on provided inputs, which aligns with the capabilities of a language model (LLM). There is no existing agent config that specifically addresses screenplay creation, and no tools are required for this task, making it suitable for creating a new LLM-based agent.`,
      taskConfig: `The task requires creating a screenplay scene by merging multiple short stories, which aligns with the purpose of the existing agent config \`screenplay_scene_creator\`. However, there is no existing task config for this purpose, so a new task config needs to be created.`,
      taskRun: `The task config "merge_short_stories_into_screenplay_scene" exists, and the input can be completed using non-dependent fields. The task run can be created using the existing task config.`,
    },
    {
      stepNo: 6,
      agentConfig: `The task requires an analytical breakdown of a screenplay scene, which involves analyzing and interpreting the content. This task is different from generating a screenplay scene or a short story, and it does not match the existing agents' purposes. Since the task relies on LLM capabilities and no specific tools are required, a new agent config is needed.`,
      taskConfig: `The task requires an analytical breakdown of a screenplay scene, which aligns with the purpose of the screenplay_scene_analyst agent. There is no existing task config for this specific analysis task, so a new task config needs to be created.`,
      taskRun: `The task config "analyze_screenplay_scene_convergence" exists, and the input can be completed using non-dependent fields. The input "screenplay scene" is marked as [from Step 5], so it will be automatically filled by the runtime engine.`,
    },
  ],
} satisfies ChoiceExplanations;

export const requestHandlerOutput = `{
  "requestType": "creative_writing",
  "primaryGoal": "Generate four short stories and a screenplay scene merging them",
  "userParameters": {
    "storyConcepts": ["time travel", "bioluminescent fungi", "ancient desert rituals", "urban foxes"]
  },
  "requiredComponents": [
    "write short story on time travel",
    "write short story on bioluminescent fungi",
    "write short story on ancient desert rituals",
    "write short story on urban foxes",
    "create screenplay scene merging all stories",
    "analytical breakdown of narrative convergence"
  ],
  "expectedDeliverables": "Four short stories, one screenplay scene, and an analytical breakdown"
}`;

const fixtures = new WorkflowComposeFixture(
  title,
  prompt,
  choiceExplanations,
  requestHandlerOutput,
  taskStepsFixtures,
  toolsFixtures,
  agentsFixtures,
  tasksFixtures,
  taskRunsFixtures,
);

export default fixtures;
