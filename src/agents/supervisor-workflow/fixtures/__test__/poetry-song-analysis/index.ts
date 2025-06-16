import {
  ChoiceExplanations,
  WorkflowComposeFixture,
} from "../../base/workflow-compose-fixtures.js";
import toolsFixtures from "./tools.js";
import agentsFixtures from "./agent-config.js";
import tasksFixtures from "./task-config.js";
import taskStepsFixtures from "./task-step.js";

const title = "Poetry and Hip-Hop Song Analysis";

const prompt =
  "Create four distinct poems on these topics: vikings, neutrinos, marshmallows, and cats. Then craft a hip-hop song that deliberately incorporates specific imagery, phrases, and themes from each poem. Then take the hip-hop song and generated poems and highlight which elements from each original poem were integrated into your hip-hop lyrics there, demonstrating parallelization and how multiple specialized outputs enhance the final creative synthesis. So the final output should consist of original poems, the song and the analysis.";

const choiceExplanations = {
  requestHandler:
    "The request involves creating multiple poems and a song, followed by an analysis, which is a complex, multi-step task.",
  problemDecomposer: "",
} satisfies ChoiceExplanations;

export const requestHandlerOutput = `{
  "requestType": "creative_writing",
  "primaryGoal": "Generate four poems, a hip-hop song, and an analysis of thematic integration",
  "userParameters": {
    "poemTopics": ["vikings", "neutrinos", "marshmallows", "cats"],
    "songStyle": "hip-hop",
    "analysisFocus": "highlighting thematic and imagery integration"
  },
  "requiredComponents": [
    "create four distinct poems on specified topics",
    "compose a hip-hop song incorporating elements from each poem",
    "analyze and highlight the integration of poem elements into the song"
  ],
  "expectedDeliverables": "Four poems, one hip-hop song, and an analysis of thematic integration"
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
);

export default fixtures;
