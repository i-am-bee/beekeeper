import boston_trip_fixtures from "@/agents/supervisor-workflow/fixtures/__test__/boston-trip/index.js";
import { BodyTemplateBuilder } from "@/agents/supervisor-workflow/templates/body.js";
import { ChatExampleTemplateBuilder } from "@/agents/supervisor-workflow/templates/chat-example.js";
import { TaskStepMapper } from "../../helpers/task-step/task-step-mapper.js";
import {
  createExampleInput,
  ExampleInput,
} from "./__tests__/helpers/create-example-input.js";
import { AgentConfigInitializerInput } from "./dto.js";
import { protocol } from "./protocol.js";
import { ExistingResourcesBuilder } from "./templates.js";
import { examplesEnabled } from "@/agents/supervisor-workflow/helpers/env.js";

export const prompt = ({
  resources: { tools: availableTools, agents: existingAgentConfigs },
  previousSteps,
  selectOnly = false,
}: Pick<
  AgentConfigInitializerInput,
  "resources" | "previousSteps" | "selectOnly"
>) => {
  const builder = BodyTemplateBuilder.new()
    .introduction(
      `You are an **AgentConfigCreator** — the action module in a multi-agent workflow.  
Your mission is to process assignments in the format:  
\`<Assignment for the agent> (input: <input parameters>, output: <output value>) [<type of resource>]\`  
Based on the type of resource, you will either create, update, or select an agent config.`,
    )
    .section({
      title: {
        text: "Important Note",
        level: 2,
      },
      newLines: {
        start: 1,
        end: 0,
        contentStart: 0,
        contentEnd: 1,
      },
      delimiter: {
        start: true,
        end: true,
      },
      content:
        'Mentions of steps (e.g., "outputs from Steps 1–3") inside `<input parameters>` are **contextual references** and should not influence the agent\'s behavior or configuration. Treat them as placeholders for runtime inputs and ensure the agent remains stateless and general-purpose.',
    })
    .section({
      title: {
        text: "Context",
        level: 2,
      },
      newLines: {
        start: 2,
        contentStart: 0,
        contentEnd: 0,
      },
      delimiter: {
        end: true,
      },
      content: ExistingResourcesBuilder.new()
        .previousSteps(previousSteps.map(TaskStepMapper.format))
        .agentConfigs(existingAgentConfigs)
        .availableTools(availableTools)
        .build(),
    })
    .section({
      title: {
        text: "Response Format",
        level: 2,
      },
      newLines: {
        start: 2,
        contentStart: 1,
      },
      delimiter: { end: true },
      content: protocol.printExplanation(),
    })
    .section({
      title: {
        text: "Decision Criteria",
        level: 2,
      },
      newLines: {
        start: 2,
        contentStart: 1,
        contentEnd: 0,
      },
      delimiter: { end: true },
      content: decisionCriteria(selectOnly),
    })
    .section({
      title: {
        text: "Response Guidelines",
        level: 2,
      },
      newLines: {
        start: 2,
        contentStart: 1,
        contentEnd: 0,
      },
      delimiter: { end: true },
      content: guidelines(selectOnly),
    });

  if (examplesEnabled()) {
    builder.section({
      title: {
        text: "Examples",
        level: 2,
      },
      newLines: {
        start: 2,
        contentStart: 1,
        contentEnd: 0,
      },
      delimiter: { end: true },
      content: examples(selectOnly),
    });
  }
  builder.callToAction("This is the task");

  return builder.build();
};

const guidelines = (selectOnly: boolean) => {
  const supportedResponseTypes = selectOnly
    ? ["SELECT_AGENT_CONFIG", "AGENT_CONFIG_UNAVAILABLE"]
    : [
        "CREATE_AGENT_CONFIG",
        "UPDATE_AGENT_CONFIG",
        "SELECT_AGENT_CONFIG",
        "AGENT_CONFIG_UNAVAILABLE",
      ];

  const builder = BodyTemplateBuilder.new()
    .section({
      content: `Agent config is a **general-purpose template** for an agent that is activated externally by a task. The agent **does not self-trigger**, schedule, or continuously run on its own. Each time it executes, it receives an input payload from the task that triggered it. Therefore, define the agent’s behavior in a **stateless, input-driven** manner—ensuring it performs the assigned task only during the time it’s invoked.

**Task Input Format:**  
Assignments will be provided in the format:  
\`<Assignment for the agent> (<input parameters>, <output value>) [<type of resource>]\`  

### Type of Resource Mapping:
1. **tools: tool1, tool2** or **LLM**  
   - Create a new agent config using the specified tools or rely on LLM capabilities if no tools are provided.
   - If the resource is LLM, you may create a new agent config even when no tools are available in Available agent tools.
   - LLM-based agents are valid as long as they generalize across tasks and follow input-output conventions.
   - Do not treat lack of tools as a blocker for LLM-only agents.
2. **agent: agent_name**  
   - Select an existing agent config or update it if necessary.

**Do not hard-code any user request values** (keywords, locations, dates, etc.) inside the config.  
**Do not design agents to depend on step references** (e.g., "Step 1–3") in \`<input parameters>\`. Treat these as runtime inputs that are resolved externally.  
Do **not** design agents as continuous monitors, autonomous loopers, or triggers of other agents. Their role is **purely functional**: consume input → perform task → return result.

Each agent config should generalize across many similar tasks. Specific parameters (e.g., time ranges, coordinates, query strings) must be passed in as **runtime input**, not hardcoded.`,
    })
    .section({
      title: {
        text: "Response header",
        level: 3,
      },
      content: `1. \`RESPONSE_CHOICE_EXPLANATION\` – justifying your choice.  
2. \`RESPONSE_TYPE\` – exactly one of: ${supportedResponseTypes.map((t) => `\`${t}\``).join(", ")} without extra white spaces or new lines.
These two lines are **mandatory** and must appear first, each on its own line.`,
    });

  if (supportedResponseTypes.includes("CREATE_AGENT_CONFIG")) {
    builder.section({
      title: {
        text: "CREATE_AGENT_CONFIG — Rules",
        level: 3,
      },
      content: `1. **When to use** – only if a brand-new agent is required.
2. **\`agent_type\`** – must be unique, lowercase snake_case.
    ↳ **Uniqueness guard** – if an agent with the same name already exists, abort and use \`SELECT_AGENT_CONFIG\` instead.
    ↳ **Generic naming** – do not use specific runtime values (e.g., “war_news_search”); keep it general (e.g., “news_source_search”).
    ↳ **Conceptual parameter guard** – Never create a new agent config just because the concept, theme, or topic in the input has changed. General-purpose agents should handle such variation through runtime inputs. For example, generating title for "article A" vs "article B" still uses the same agent.

3. **\`tools\`** – list *only* tool IDs from **Available agent tools** in **Context section**.
4. **\`description\`** – 1-2 sentences describing mission & scope.
5. **\`instructions\`** – multi-line; recommended sub-headers: Context, Objective, Response format.
6. **Uniqueness guard** – If the proposed \`agent_type\` already exists, abort and use \`SELECT_AGENT_CONFIG\` instead.`,
    });
  }

  if (supportedResponseTypes.includes("UPDATE_AGENT_CONFIG")) {
    builder.section({
      title: {
        text: "UPDATE_AGENT_CONFIG — Rules",
        level: 3,
      },
      content: `1. **When to use** – choose this type only if the agent’s **core purpose remains the same** but you need minor edits (e.g., clarity fixes, small scope widening/narrowing, tool list adjustment).
2. **\`agent_type\`** – repeat the existing agent’s name **unchanged**.
3. **\`tools\` edits** – whenever you list a \`tools\` array, include **every** tool the agent will use and **verify that each tool exists in the **Available agent tools** in the **Context section**.
   ↳ If even one tool is missing, you must respond with \`AGENT_CONFIG_UNAVAILABLE\`.
4. **\`description\`** – include this field *only* if it is being changed. Ensure it reflects any changes made to tools or instructions.
5. **\`instructions\`** – include this field *only* if it is being changed. The content must align with all updated capabilities or tools.
6. **Include only changed fields** – output *only* the attributes you are modifying; omit everything that is staying the same.
7. **Diff-check guard** — Before choosing UPDATE_AGENT_CONFIG you **must** verify that at least one value you output is different from the existing config in “Existing agent configs”.
   • If every field you intend to output (tools, description, instructions, etc.) would be identical to the stored values, this is a no-op → switch to SELECT_AGENT_CONFIG instead.  
   • An UPDATE response is valid only when the diff contains a real change.
8. **Scope discipline** – edits may refine instructions, improve formatting, or prune redundancies, but they must **never repurpose** the agent for a different domain.
9. **Determinism** – list items inside any array (such as \`tools\`) in **alphabetical order** to keep outputs consistent.`,
    });
  }

  if (supportedResponseTypes.includes("SELECT_AGENT_CONFIG")) {
    builder.section({
      title: {
        text: "SELECT_AGENT_CONFIG — Rules",
        level: 3,
      },
      content: `1. **When to use** – choose this type **only** when an existing agent’s mission, instructions, and tool set **already cover the new task exactly as-is**. No structural edits are required.
2. **\`agent_type\`** – supply just the name of the selected agent config (lowercase snake_case).
   *No other keys are allowed in this response object.*
3. **No modifications** – you may **not** tweak \`instructions\`, \`description\`, or \`tools\`. If any change is needed, switch to \`UPDATE_AGENT_CONFIG\` instead.
4. **Scope confirmation** – before selecting, double-check that:
   • The requested outcome is within the agent’s stated **objective**.
   • The input values (e.g., new topics or themes) are treated as parameter values, not as justification to create or update the agent
   • All necessary capabilities are provided by the agent’s existing **tools**.
   • The agent’s **response format** matches what the user will expect.
   
5. **Scope confirmation** – You must confirm that:
   • The requested task has identical structure to what the agent already supports (e.g., story concept → short story).
   • The input type, output type, and objective of the assignment match those of an existing agent.
   • Any changes in surface wording (e.g., new topics, themes, locations) must be treated as parameters, not as grounds for config change.
   • If these conditions are met and the config fields would remain unchanged, you must respond with SELECT_AGENT_CONFIG.`,
    });
  }

  if (supportedResponseTypes.includes("AGENT_CONFIG_UNAVAILABLE")) {
    builder.section({
      title: {
        text: "AGENT_CONFIG_UNAVAILABLE — Rules",
        level: 3,
      },
      newLines: {
        contentEnd: 0,
      },
      content: `1. **When to use** – choose this type **only** when **no viable path** exists to create, update, or select an agent because of at least one blocking factor:
  • Required capability is missing from the **Available agent tools** in **Context section**
  • Fulfilling the task would repurpose an existing agent beyond its scope.
  • Any solution would need resources outside the current environment.
2. **\`explanation\`** – provide one short, factual sentence that pinpoints the blocking gap (e.g., “No tool supports 3-D rendering.”).
  • **Do not** apologise, speculate, or offer alternative brainstorming.
3. **Response structure** – after the two mandatory header lines, output exactly this object and nothing more:
\`\`\`
RESPONSE_AGENT_CONFIG_UNAVAILABLE:
  explanation: <reason>
\`\`\`
4. **Determinism** – keep the explanation as a single line of plain text; avoid line-breaks, markdown, or additional keys.`,
    });
  }

  return builder.build();
};

const decisionCriteria = (selectOnly: boolean) =>
  BodyTemplateBuilder.new()
    .section({
      title: {
        text: "DECISION CRITERIA — Plain-language checklist",
        level: 3,
      },
      content: `When you decide **which RESPONSE_TYPE to output**, run through these four options in order.
Pick the first one whose conditions are **all** true:

${[
  `**SELECT_AGENT_CONFIG** — *reuse an existing config untouched*
   * The agent’s current **purpose, instructions, and tools already satisfy the new task**.
   * **No structural edits are required.**
   * **Diff-check guard:** if you would not change **any** field (the “diff” is empty), you **must** select rather than update.`,
  !selectOnly &&
    `**UPDATE_AGENT_CONFIG** — *make light edits to an existing config*
   * The agent’s **core mission remains the same**, but you need to:
     • clarify wording, **or**
     • slightly widen/narrow scope, **or**
     • add/remove tools that are already listed in **Available agent tools**.
   * **Repurposing to a new domain is *not* allowed.**
   * **Diff-check guard:** at least **one** field you output (tools, description, or instructions) must differ from the stored config.
     • If every value is identical, switch back to **SELECT_AGENT_CONFIG**.`,
  !selectOnly &&
    `**CREATE_AGENT_CONFIG** — *define a brand-new agent*
   * No existing agent fits the task.
   * You can solve it **using only the tools in Available agent tools**.
   * The new \`agent_type\` must be unique and not duplicate any tool name.`,
  `**AGENT_CONFIG_UNAVAILABLE** — *task impossible within the environment*
   * The needed capability is missing from **Available agent tools**, **or**
   * Any viable solution would breach policy, repurpose an agent beyond its scope, or require external resources.`,
]
  .filter(Boolean)
  .map((item, idx) => `${idx + 1}. ${item}`)
  .join("\n")}


**Hard rule – “Template, not instance”**
Never embed specific runtime values (specific names, dates, keywords etc.) inside the agent config. These are runtime parameters, not grounds for creating or modifying agents. If the input/output format remains unchanged, reuse the same general-purpose agent via SELECT_AGENT_CONFIG.
`,
    })
    .section({
      title: {
        text: "Tool-existence guard",
        level: 3,
      },
      content: `After choosing a RESPONSE_TYPE, verify that:
• If your response lists tools, each tool must appear in Available agent tools.
• If your response is based on LLM only, you do not need any tools listed — this is not a reason to return AGENT_CONFIG_UNAVAILABLE.
• If no tools are listed and no tool is needed, that is acceptable only if the task is handled entirely by LLM (e.g., writing, summarizing, transforming text).`,
    })
    .section({
      title: {
        text: "`agent_type` naming guard",
        level: 3,
      },
      content: `* \`agent_type\` must be: (a) unique, (b) generic, (c) **distinct from any tool name**.`,
    })
    .section({
      title: {
        text: "Bad vs. good template example",
        level: 3,
      },
      content: `| ❌ Incorrect (hard-coded) | ✅ Correct (parameterised) |
|---|---|
| \`agent_type: cnn_war_news_search\`<br>\`instructions: …receive the query "War", source "CNN", timeframe "last 24 h"…\` | \`agent_type: news_source_search\`<br>\`instructions: …receive *search_terms*, optional *source*, and *timeframe*…\` |`,
      newLines: {
        contentEnd: 0,
      },
    })
    .build();

const examples = (selectOnly: boolean) =>
  ((inputs: ExampleInput[]) =>
    inputs
      .filter(
        (input) =>
          !selectOnly ||
          ["SELECT_AGENT_CONFIG", "AGENT_CONFIG_UNAVAILABLE"].includes(
            input.example.RESPONSE_TYPE,
          ),
      )
      .map((input, idx) =>
        ChatExampleTemplateBuilder.new()
          .title({
            position: idx + 1,
            text: input.title,
            level: 3,
            subtitle: input.subtitle,
          })
          .context(
            ExistingResourcesBuilder.new()
              .agentConfigs(input.context.resources.agents)
              .availableTools(input.context.resources.tools)
              .build(),
          )
          .user(input.user)
          .assistant(protocol.printExample(input.example))
          .build(),
      )
      .join("\n"))([
    createExampleInput(
      "CREATE_AGENT_CONFIG",
      "Find local parks",
      "Identify historical sites in Back Bay",
      boston_trip_fixtures,
    ),
    //     {
    //       title: "CREATE_AGENT_CONFIG",
    //       subtitle: "Find local parks",
    //       context: {
    //         resources: {
    //           tools: [
    //             {
    //               toolName: "parks_search_api",
    //               description:
    //                 "Search for local parks by location and return a list of parks with descriptions.",
    //             },
    //           ],
    //           agents: [],
    //           tasks: [],
    //           taskRuns: [],
    //         },
    //         previousSteps: [],
    //       },
    //       user: "Find local parks in Central Park area (input: location; output: list of parks) [tools: parks_search_api]",
    //       example: {
    //         RESPONSE_CHOICE_EXPLANATION:
    //           "No existing agent can find local parks; a new agent using the parks_search_api tool is needed.",
    //         RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
    //         RESPONSE_CREATE_AGENT_CONFIG: {
    //           agent_type: "local_parks_finder",
    //           tools: ["parks_search_api"],
    //           description:
    //             "Finds local parks in a specified area using the parks_search_api tool.",
    //           instructions: `Context: You are an agent specializing in finding local parks. You are activated by an external task and receive a location as input. You use the parks_search_api tool to retrieve a list of parks in the specified area.

    // Objective: Use the provided location to fetch a list of local parks. Return the results in a structured format.

    // Response format: List each park with its name, description, and location:

    // Local Parks in [Location]:
    // 1. Name: [Park Name 1] — Description: [Description 1] — Location: [Location 1]
    // 2. Name: [Park Name 2] — Description: [Description 2] — Location: [Location 2]`,
    //         },
    //       },
    //     },
    //     {
    //       title: "SELECT_AGENT_CONFIG",
    //       subtitle: "Fishing schedules",
    //       context: {
    //         previousSteps: [],
    //         resources: {
    //           agents: [agentConfigPrompt("fishing_schedule_finder")],
    //           tools: [
    //             toolPrompt("fishing_schedule_api"),
    //             toolPrompt("weather_alert_feed"),
    //           ],
    //           tasks: [],
    //           taskRuns: [],
    //         },
    //       },
    //       user: "Find upcoming freshwater/saltwater fishing schedules in Boston (input: fishing type, location; output: schedule list) [agent: fishing_schedule_finder]",
    //       example: {
    //         RESPONSE_CHOICE_EXPLANATION:
    //           "The existing fishing_schedule_finder agent config satisfies the new request without changes.",
    //         RESPONSE_TYPE: "SELECT_AGENT_CONFIG",
    //         RESPONSE_SELECT_AGENT_CONFIG: {
    //           agent_type: "fishing_schedule_finder",
    //         },
    //       },
    //     },
    //     {
    //       title: "CREATE_AGENT_CONFIG",
    //       subtitle: "Create a weekly workout plan (LLM)",
    //       context: {
    //         previousSteps: [
    //           // TODO: Add previous steps important for context
    //         ],
    //         resources: {
    //           tools: [toolPrompt("exercise_database")],
    //           agents: [],
    //           tasks: [],
    //           taskRuns: [],
    //         },
    //       },
    //       user: "Create a balanced weekly workout plan incorporating strength training, cardio, and flexibility exercises (input: fitness goals, available equipment, and schedule; output: detailed workout plan) [LLM]",
    //       example: {
    //         RESPONSE_CHOICE_EXPLANATION:
    //           "No existing agent can create a balanced weekly workout plan; a new agent using LLM capabilities is needed.",
    //         RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
    //         RESPONSE_CREATE_AGENT_CONFIG: {
    //           agent_type: "weekly_workout_planner",
    //           tools: [],
    //           description: `Creates a balanced weekly workout plan incorporating strength training, cardio, and flexibility exercises based on user input.`,
    //           instructions: `Context: You are an agent specializing in creating weekly workout plans. You are activated by an external task and receive fitness goals, available equipment, and schedule as input. You rely on LLM capabilities to generate a detailed workout plan.

    // Objective: Use the provided fitness goals, available equipment, and schedule to create a balanced weekly workout plan. Incorporate strength training, cardio, and flexibility exercises tailored to the user's input.

    // Response format: Provide a day-by-day workout plan with the following structure:

    // Weekly Workout Plan:
    // Day 1:
    // - Exercise: [Exercise Name] — Type: [Strength/Cardio/Flexibility] — Duration: [Time] — Equipment: [Equipment Needed]
    // Day 2:
    // - Exercise: [Exercise Name] — Type: [Strength/Cardio/Flexibility] — Duration: [Time] — Equipment: [Equipment Needed]
    // ...
    // Day 7:
    // - Exercise: [Exercise Name] — Type: [Strength/Cardio/Flexibility] — Duration: [Time] — Equipment: [Equipment Needed]`,
    //         },
    //       },
    //     },
    //     {
    //       title: "UPDATE_AGENT_CONFIG",
    //       subtitle: "Expand book_searcher to include audiobooks",
    //       context: {
    //         previousSteps: [],
    //         resources: {
    //           taskRuns: [],
    //           tasks: [],
    //           agents: [agentConfigPrompt("book_searcher")],
    //           tools: [
    //             toolPrompt("book_catalog_api"),
    //             toolPrompt("audiobook_catalog_api"),
    //           ],
    //         },
    //       },
    //       user: "Find books and audiobooks in the mystery genre (input: genre, location; output: book list) [agent: book_searcher]",
    //       example: {
    //         RESPONSE_CHOICE_EXPLANATION:
    //           "The game_searcher agent's purpose remains the same, but its scope must be expanded to include concerts.",
    //         RESPONSE_TYPE: "UPDATE_AGENT_CONFIG",
    //         RESPONSE_UPDATE_AGENT_CONFIG: {
    //           agent_type: "book_searcher",
    //           tools: ["audiobook_catalog_api", "book_catalog_api"],
    //           instructions: `Context: You are an agent specializing in finding books and audiobooks. You are activated by an external task and receive genre and location as input. You use the book_catalog_api and audiobook_catalog_api tools to retrieve listings.

    // Objective: Use the provided genre and location to fetch book and audiobook listings. Return the results in a structured format.

    // Response format: List each item with its title, author, and description:

    // Books and Audiobooks in [Genre] Genre:
    // 1. Title: [Title 1] — Author: [Author 1] — Description: [Description 1]
    // 2. Title: [Title 2] — Author: [Author 2] — Description: [Description 2]`,
    //         },
    //       },
    //     },
    //     {
    //       title: "AGENT_CONFIG_UNAVAILABLE",
    //       subtitle: "Missing tool for 3-D rendering",
    //       context: {
    //         previousSteps: [],
    //         resources: {
    //           tools: [toolPrompt("sound_generator")],
    //           agents: [],
    //           tasks: [],
    //           taskRuns: [],
    //         },
    //       },
    //       user: "Render a 3-D model of my house from this floor plan (input: floor plan; output: 3-D model) [tools: 3d_modeling_tool]",
    //       example: {
    //         RESPONSE_CHOICE_EXPLANATION:
    //           "No tool exists for 3-D modeling or rendering in the current environment.",
    //         RESPONSE_TYPE: "AGENT_CONFIG_UNAVAILABLE",
    //         RESPONSE_AGENT_CONFIG_UNAVAILABLE: {
    //           explanation:
    //             "Cannot create or update an agent because there is no tool for 3-D modeling or rendering.",
    //         },
    //       },
    //     },
    //     {
    //       title: "SELECT_AGENT_CONFIG",
    //       subtitle: "Reuse news_headlines_24",
    //       context: {
    //         previousSteps: [],
    //         resources: {
    //           agents: [agentConfigPrompt("news_headlines_24h")],
    //           tools: [tool("news_search")],
    //           tasks: [],
    //           taskRuns: [],
    //         },
    //       },
    //       user: "Gather news headlines from the past 24 hours that match user-supplied keywords (input: keywords; output: news list) [agent: news_headlines_24h]",
    //       example: {
    //         RESPONSE_CHOICE_EXPLANATION:
    //           "The existing news_headlines_24h agent config satisfies the new request without changes.",
    //         RESPONSE_TYPE: "SELECT_AGENT_CONFIG",
    //         RESPONSE_SELECT_AGENT_CONFIG: {
    //           agent_type: "news_headlines_24h",
    //         },
    //       },
    //     },
    //     {
    //       title: "UPDATE_AGENT_CONFIG",
    //       subtitle: "Generalize recipe_finder and incorporate a new tool",
    //       context: {
    //         previousSteps: [],
    //         resources: {
    //           taskRuns: [],
    //           tasks: [],
    //           agents: [agentConfigPrompt("recipe_finder")],
    //           tools: [
    //             toolPrompt("recipe_catalog_api"),
    //             toolPrompt("nutrition_analysis_api"),
    //           ],
    //         },
    //       },
    //       user: "Recommend recipes of any cuisine or dietary preference based on user-defined criteria and provide nutritional analysis (input: cuisine, dietary preference, search criteria; output: recipe list with nutritional details) [agent: recipe_finder]",
    //       example: {
    //         RESPONSE_CHOICE_EXPLANATION:
    //           "The recipe_finder agent's purpose remains the same, but its scope must be expanded to include user-defined search criteria and nutritional analysis by incorporating the nutrition_analysis_api tool.",
    //         RESPONSE_TYPE: "UPDATE_AGENT_CONFIG",
    //         RESPONSE_UPDATE_AGENT_CONFIG: {
    //           agent_type: "recipe_finder",
    //           tools: ["nutrition_analysis_api", "recipe_catalog_api"],
    //           instructions: `Context: You are an agent specializing in finding recipes and providing nutritional analysis. You are activated by an external task and receive cuisine, dietary preference, and search criteria as input. You use the recipe_catalog_api tool to retrieve a list of recipes and the nutrition_analysis_api tool to analyze their nutritional content.

    // Objective: Use the provided cuisine, dietary preference, and search criteria to fetch a list of recipes and analyze their nutritional content. Return the results in a structured format.

    // Response format: List each recipe with its name, ingredients, dietary preference, nutritional details, and instructions:

    // Recommended Recipes for [Cuisine] ([Dietary Preference]) based on [Search Criteria]:
    // 1. Name: [Recipe Name 1] — Ingredients: [Ingredients 1] — Dietary Preference: [Dietary Preference 1] — Nutritional Details: [Nutritional Details 1] — Instructions: [Instructions 1]
    // 2. Name: [Recipe Name 2] — Ingredients: [Ingredients 2] — Dietary Preference: [Dietary Preference 2] — Nutritional Details: [Nutritional Details 2] — Instructions: [Instructions 2]`,
    //         },
    //       },
    //     },
    //     {
    //       title: "AGENT_CONFIG_UNAVAILABLE",
    //       subtitle: "Missing tool for flight booking",
    //       context: {
    //         previousSteps: [],
    //         resources: {
    //           tools: [toolPrompt("hotel_search_api")],
    //           agents: [],
    //           tasks: [],
    //           taskRuns: [],
    //         },
    //       },
    //       user: "Book a flight from Boston to San Francisco (input: origin, destination; output: flight details) [tools: flight_booking_api]",
    //       example: {
    //         RESPONSE_CHOICE_EXPLANATION:
    //           "No tool exists for flight booking in the current environment.",
    //         RESPONSE_TYPE: "AGENT_CONFIG_UNAVAILABLE",
    //         RESPONSE_AGENT_CONFIG_UNAVAILABLE: {
    //           explanation:
    //             "Cannot create or update an agent because there is no tool for flight booking.",
    //         },
    //       },
    //     },
    //     {
    //       title: "SELECT_AGENT_CONFIG",
    //       subtitle: "Reuse star_gazer",
    //       context: {
    //         previousSteps: [],
    //         resources: {
    //           agents: [agentConfigPrompt("star_gazer")],
    //           tools: [toolPrompt("astronomy_search_api")],
    //           tasks: [],
    //           taskRuns: [],
    //         },
    //       },
    //       user: "Recommend celestial objects to observe in Los Angeles at 10 PM (input: location, time; output: celestial object list) [agent: star_gazer]",
    //       example: {
    //         RESPONSE_CHOICE_EXPLANATION:
    //           "The existing star_gazer agent config satisfies the new request without changes.",
    //         RESPONSE_TYPE: "SELECT_AGENT_CONFIG",
    //         RESPONSE_SELECT_AGENT_CONFIG: {
    //           agent_type: "star_gazer",
    //         },
    //       },
    //     },
  ] satisfies ExampleInput[]);
