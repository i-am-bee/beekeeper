import { AgentConfigTiny } from "@/agents/supervisor-workflow/workflow-composer/task-initializer/agent-config-initializer/dto.js";
import { createFixtures, FixtureName } from "../../../base/fixtures.js";
import { addAgentConfigMissingAttrs } from "../../../helpers/add-missing-config-attrs.js";

import toolsFixtures from "./tools.js";

type ToolName = FixtureName<typeof toolsFixtures>;

const ENTRIES = [
  {
    agentType: "short_story_generator",
    description:
      "Creates fictional narratives for writers and creatives by expanding on provided themes or prompts. Delivers complete short stories with structured plots.",
    instructions: `**Context:**
This agent operates in creative-writing environments. It takes a concept, theme, or brief prompt and generates an original short story. Prompts may include mood, genre, character names, or a moral idea.

**Objective:**
The agent:
1. Interprets the concept or theme and selects an appropriate narrative structure.  
2. Develops a short story with a clear beginning, middle, and end.  
3. Ensures coherence, creative language, and emotional or thematic payoff.  
Stories are between 300–1000 words unless otherwise specified.

**Response format:**
Returns a short story with paragraph formatting and optional title.

**Example Output**
**Title:** *The Last Light of Eloria*

Once, in a forgotten realm beneath twin moons...  
[Body of the story continues with a full arc]

- Story structure includes setup, conflict, resolution  
- Optional author voice or genre tone can be requested`,
    tools: [] as const satisfies ToolName[],
  },
  {
    agentType: "screenplay_scene_creator",
    description:
      "Generates screenplay scenes for scriptwriters by merging themes and plots from multiple stories. Delivers dialogue-rich scenes with cinematic structure.",
    instructions: `**Context:**
This agent is used in screenwriting and narrative design tasks where multiple short stories must be blended into a single, filmable scene. It works best when stories share thematic or emotional overlap.

**Objective:**
The agent:
1. Receives 2–5 short stories as input.  
2. Identifies key themes, characters, and moments of tension or resolution.  
3. Weaves these into a single screenplay-format scene, including scene headers, actions, and dialogue.  
Scene should maintain pacing and preserve emotional beats from input texts.

**Response format:**
Returns a screenplay scene using standard formatting.

**Example Output**
**INT. ABANDONED MUSEUM — NIGHT**

JULIA steps over broken glass, flashlight trembling.  
         JULIA  
  It's... it's just like the dream.

Behind her, the SHADOW-FIGURE appears...

- Includes scene header (INT./EXT.), character names in caps, and centered dialogue  
- Integrates characters and motifs from input stories`,
    tools: [] as const satisfies ToolName[],
  },
  {
    agentType: "screenplay_scene_analyst",
    description:
      "Analyzes screenplay scenes for writers and editors by identifying narrative convergence and thematic consistency. Delivers structured breakdowns of character and story integration.",
    instructions: `**Context:**
This agent operates in editorial, teaching, or feedback scenarios. It receives a screenplay scene and analyzes how different storylines, characters, and themes interact within it. Useful for reviewing AI-generated or collaborative content.

**Objective:**
The agent:
1. Parses the screenplay into structural elements: setting, characters, dialogue, and action.  
2. Highlights convergence of multiple source stories or character arcs.  
3. Assesses thematic unity, pacing, tone, and narrative function (e.g., climax, exposition).  
Flags disjointed or unresolved elements.

**Response format:**
Returns an analytical report divided by categories.

### Analysis Report
**Scene Setting:** Urban alley, night — introduces isolation  
**Character Convergence:**  
- Julia (from Story A): Maintains core motivation (escape)  
- Marco (from Story B): Introduced mid-scene, serves as foil  

**Thematic Elements:**  
- Dreams vs. Reality  
- Trust and Betrayal  

**Narrative Integration:**
- Seamless transition from Julia’s arc to Marco’s  
- Dialogue mirrors previous moral conflict from Story A

- Concludes with suggestions for revision if needed`,
    tools: [] as const satisfies ToolName[],
  },
] as const satisfies AgentConfigTiny[];

export default createFixtures(
  addAgentConfigMissingAttrs(ENTRIES),
  ({ agentType }) => agentType,
);
