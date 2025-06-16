import { BodyTemplateBuilder } from "@/agents/supervisor-workflow/templates/body.js";
import { ChatExampleTemplateBuilder } from "@/agents/supervisor-workflow/templates/chat-example.js";
import * as laml from "@/laml/index.js";
import {
  AgentAvailableTool,
  AgentConfigInitializerInput,
  AgentConfigTiny,
} from "./dto.js";
import { protocol } from "./protocol.js";
import { ExistingResourcesBuilder } from "./templates.js";

const guidelines = BodyTemplateBuilder.new()
  .section({
    content: `Agent config is a general template or a prescription (like a class in a programming language) for agents (like an instances) that will actually run at the runtime. They will receive an input from assigned task that is suitable to its purpose. Keep that in mind and design agent config general not just for one use with one set of parameters. Each specific adjustments should will provided through task inputs as an attributes.`,
  })
  .section({
    title: {
      text: "Response header",
      level: 3,
    },
    content: `1. \`RESPONSE_CHOICE_EXPLANATION\` – justifying your choice.  
2. \`RESPONSE_TYPE\` – exactly one of: \`CREATE_AGENT_CONFIG\`, \`UPDATE_AGENT_CONFIG\`, \`SELECT_AGENT_CONFIG\`, \`AGENT_CONFIG_UNAVAILABLE\` without extra white spaces or new lines.
These two lines are **mandatory** and must appear first, each on its own line.`,
  })
  .section({
    title: {
      text: "CREATE_AGENT_CONFIG — Rules",
      level: 3,
    },
    content: `1. **When to use** – only if a brand-new agent is required.
2. **\`agent_type\`** – must be unique, lowercase snake_case.
3. **\`tools\`** – list *only* tool IDs from **Available agent tools**.
4. **\`description\`** – 1-2 sentences describing mission & scope.
5. **\`instructions\`** – multi-line; recommended sub-headers: Context, Objective, Response format.
6. **Uniqueness guard** – If the proposed \`agent_type\` already exists, abort and use \`SELECT_AGENT_CONFIG\` instead.`,
  })
  .section({
    title: {
      text: "UPDATE_AGENT_CONFIG — Rules",
      level: 3,
    },
    content: `1. **When to use** – choose this type only if the agent’s **core purpose remains the same** but you need minor edits (e.g., clarity fixes, small scope widening/narrowing, tool list adjustment).
2. **\`agent_type\`** – repeat the existing agent’s name **unchanged**.
3. **\`tools\` edits** – whenever you list a \`tools\` array, include **every** tool the agent will use and **verify that each tool exists in the *Available agent tools* list**.
   ↳ If even one tool is missing, you must respond with \`AGENT_CONFIG_UNAVAILABLE\`.
4. **\`description\`** – include this field *only* if it is being changed. Ensure it reflects any changes made to tools or instructions.
5. **\`instructions\`** – include this field *only* if it is being changed. The content must align with all updated capabilities or tools.
6. **Include only changed fields** – output *only* the attributes you are modifying; omit everything that is staying the same.
7. **Scope discipline** – edits may refine instructions, improve formatting, or prune redundancies, but they must **never repurpose** the agent for a different domain.
8. **Determinism** – list items inside any array (such as \`tools\`) in **alphabetical order** to keep outputs consistent.`,
  })
  .section({
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
   • All necessary capabilities are provided by the agent’s existing **tools**.
   • The agent’s **response format** matches what the user will expect.`,
  })
  .section({
    title: {
      text: "AGENT_CONFIG_UNAVAILABLE — Rules",
      level: 3,
    },
    newLines: {
      contentEnd: 0,
    },
    content: `1. **When to use** – choose this type **only** when **no viable path** exists to create, update, or select an agent because of at least one blocking factor:
  • Required capability is missing from the *Available agent tools*.
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
  })
  .build();

const decisionCriteria = BodyTemplateBuilder.new()
  .section({
    title: {
      text: "DECISION CRITERIA — Quick-reference matrix ",
      level: 3,
    },
    content: `| If **ALL** these are true → | …then choose **RESPONSE_TYPE** | Short rationale |
|---|---|---|
| • An existing agent’s purpose, instructions **and** tools already satisfy the user need.<br>• No structural changes are required. | **SELECT_AGENT_CONFIG** | Re-use as-is. |
| • The agent’s core mission stays the same **but** you must fix clarity, widen/narrow scope a bit, or add/remove tools that already exist.<br>• No repurposing to a new domain. | **UPDATE_AGENT_CONFIG** | Light touch edit. |
| • No current agent fits and you can fulfil the task **using only available tools**.<br>• Creating a fresh agent will not duplicate an existing \`agent_type\`. | **CREATE_AGENT_CONFIG** | Brand-new config. |
| • Required capability is missing from *Available agent tools*, **or** any viable solution would breach policy / repurpose an agent / need external resources. | **AGENT_CONFIG_UNAVAILABLE** | Task impossible within environment. |

**Guidelines for all branches**

1. If more than one row seems to apply, pick the **top-most** matching row.  
2. Perform the uniqueness check for \`agent_type\` **before** emitting \`CREATE_AGENT_CONFIG\`; if the name already exists, use \`SELECT_AGENT_CONFIG\`.  
3. Tool validation: any tool you list must appear in **Available agent tools**; otherwise respond with \`AGENT_CONFIG_UNAVAILABLE\`.  
4. Arrays (e.g., \`tools\`) must be in **alphabetical order** for deterministic grading.`,
  })
  .build();

interface ExampleInput {
  title: string;
  subtitle: string;
  user: string;
  context: {
    existingAgentConfigs: AgentConfigTiny[];
    availableTools: AgentAvailableTool[];
  };
  example: laml.ProtocolResult<typeof protocol>;
}

const examples = ((inputs: ExampleInput[]) =>
  inputs
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
            .agentConfigs(input.context.existingAgentConfigs)
            .availableTools(input.context.availableTools)
            .build(),
        )
        .user(input.user)
        .assistant(protocol.printExample(input.example))
        .build(),
    )
    .join("\n"))([
  {
    title: "Create agent config",
    subtitle:
      "Collect tweets (Available suitable agent tool allow to create a new agent config)",
    context: {
      existingAgentConfigs: [],
      availableTools: [
        {
          toolName: "twitter_search",
          description:
            "Query the public Twitter/X API for recent tweets that match a given keyword, hashtag, or user handle. Returns tweet text, author, timestamp, and basic engagement metrics, with optional filters for time window, language, and result count.",
        },
      ],
    },
    user: "Collect tweets containing the hashtag #AI from the past 24 hours.",
    example: {
      RESPONSE_CHOICE_EXPLANATION:
        "No existing agent can gather tweets on demand; a new config is required.",
      RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
      RESPONSE_CREATE_AGENT_CONFIG: {
        agent_type: "tweets_collector",
        tools: ["twitter_search"],
        description:
          "Gathers tweets that match a user-supplied query or hashtag within a given time window (default = 24 h).",
        instructions: `Context: You are a tweet collection agent specializing in gathering tweets containing specific hashtags. You have access to a web search tool that allows you to find tweets based on search queries. Users will provide you with a hashtag and a time frame for the tweets they want collected. 

Objective: Collect tweets containing the specified hashtag from the specific time window. Use the web search tool to execute a search query for the hashtag and filter results to include only tweets from the specific time window. Provide a list of tweet URLs and their content.

Response format: Begin with a summary of the search query and time frame. Then list each tweet with its URL and content. Ensure the list is clear and organized, with each tweet entry on a new line. For example:

#AI Tweets from the past [time_window]:
1. URL: [tweet_url_1] Content: [tweet_content_1]
2. URL: [tweet_url_2] Content: [tweet_content_2]`,
      },
    },
  },
  {
    title: "Agent config unavailable",
    subtitle:
      "Collect tweets (No suitable agent tool or existing agent config)",
    context: {
      existingAgentConfigs: [],
      availableTools: [
        {
          toolName: "image_generator",
          description:
            "Create images from natural-language prompts. Accepts parameters for style, resolution, number of outputs, and (optionally) a reference image to apply targeted modifications or in-painting. Returns direct links or binary payloads for the generated images.",
        },
      ],
    },
    user: "Collect tweets containing the hashtag #AI from the past 24 hours.",
    example: {
      RESPONSE_CHOICE_EXPLANATION:
        "No existing agent can gather tweets on demand; a new config is required but there is no suitable tool.",
      RESPONSE_TYPE: "AGENT_CONFIG_UNAVAILABLE",
      RESPONSE_AGENT_CONFIG_UNAVAILABLE: {
        explanation:
          "Cannot create or update an agent because there is no tool for collecting tweets.",
      },
    },
  },
  {
    title: "Update agent config",
    subtitle: "Generalization of restaurants recommendation",
    context: {
      existingAgentConfigs: [
        {
          agentType: "restaurant_recommender",
          tools: ["google_search", "web_extract"],
          description: "Agent for recommending vegan restaurants in a city.",
          instructions: `Context: You are an agent specialized in finding vegan restaurants in a given city. You have access to web search tools to gather information about popular vegan dining spots. Users will provide the city and any specific dining preferences they have.

Objective: Provide a list of vegan restaurants, including brief descriptions and any relevant details such as location, menu highlights, and reservation information.

Response format: Present the information in a list format with each restaurant having a name, description, and dining details.`,
        },
      ],
      availableTools: [
        {
          toolName: "google_search",
          description:
            "A lightweight utility that fires off a query to Google Search and returns the top-ranked results (title, URL, snippet, and source site) in a compact JSON array. Ideal for quickly grabbing fresh, relevant links when your LLM needs up-to-date information without crawling the entire web.",
        },
        {
          toolName: "web_extract",
          description:
            "Retrieve a specific web page by URL and return its cleaned full-text content, key metadata (title, author, publish date), and any embedded assets (links, images, tables) in a structured form, removing ads and boilerplate for easier downstream processing.",
        },
      ],
    },
    user: "I want to recommend chinese restaurants.",
    example: {
      RESPONSE_CHOICE_EXPLANATION:
        "There isn’t an existing agent configuration specifically designed to find Chinese restaurants, but there is one for recommending vegan options, so I’ll update that agent to make it more general.",
      RESPONSE_TYPE: "UPDATE_AGENT_CONFIG",
      RESPONSE_UPDATE_AGENT_CONFIG: {
        agent_type: "restaurant_recommender",
        tools: ["google_search", "web_extract"],
        description: "Agent for recommending restaurants in a city.",
        instructions: `Context: You are an agent specialized in finding restaurants that satisfy user-defined criteria—such as cuisine (e.g., Italian, Thai), dietary needs (e.g., vegan, gluten-free), budget, or vibe—in a given city. You have access to web search tools to gather information about popular vegan dining spots. Users will provide the city and any specific dining preferences they have. 

Objective: Return a curated list of restaurants that fit the user’s parameters, including brief descriptions and any relevant details such as location, menu highlights, and reservation information. 

Response format: Present the information in a list format with each restaurant having a name, description, and dining details.`,
      },
    },
  },
  {
    title: "Select agent config",
    subtitle: "Weather information",
    context: {
      existingAgentConfigs: [
        {
          agentType: "weather_lookup",
          tools: ["weather_conditions"],
          description:
            "Provides current weather information for specified locations using weather condition tool.",
          instructions: `Context: You are a weather lookup agent specializing in providing current weather information for specified locations. You have access to a weather condition tool that allows you to find weather data online. Users will provide you with a location for which they want the current weather.

Objective: Retrieve the current weather information for the specified location. Use the weather condition tool to execute a search query for the current weather in the given location. Provide details such as temperature, weather conditions, and any notable weather patterns.

Response format: Begin with a summary of the location and current date. Then provide the current temperature, weather conditions, and any notable weather patterns. Ensure the information is clear and organized. For example:

Current Weather in [Location] on [Date]:
- Temperature: [temperature]
- Conditions: [conditions]
- Notable Patterns: [patterns]`,
        },
      ],
      availableTools: [
        {
          toolName: "web_search",
          description:
            "Perform real-time internet searches across news sites, blogs, and general web pages. Supports keyword queries, optional domain or date filters, and returns ranked snippets with titles, URLs, and brief summaries for each result.",
        },
        {
          toolName: "web_extract",
          description:
            "Retrieve a specific web page by URL and return its cleaned full-text content, key metadata (title, author, publish date), and any embedded assets (links, images, tables) in a structured form, removing ads and boilerplate for easier downstream processing.",
        },
        {
          toolName: "weather_conditions",
          description:
            "A lightweight API wrapper that lets your LLM fetch up-to-date conditions—temperature, precipitation, wind, humidity, and short-range forecast—for any location worldwide, so it can answer weather-related questions with real-time data instead of canned text.",
        },
      ],
    },
    user: "What’s the weather right now in Prague?",
    example: {
      RESPONSE_CHOICE_EXPLANATION:
        "There is an existing agent configuration for getting actual weather situation that can satisfy the request without modification.",
      RESPONSE_TYPE: "SELECT_AGENT_CONFIG",
      RESPONSE_SELECT_AGENT_CONFIG: {
        agent_type: "weather_lookup",
      },
    },
  },
  {
    title: "Agent config unavailable",
    subtitle: "3-D house rendering",
    context: {
      existingAgentConfigs: [
        {
          agentType: "restaurant_recommender",
          tools: ["web_search"],
          description: "Agent for recommending restaurants in a city.",
          instructions: `Context: You are an agent specialized in recommending restaurants in a given city. You have access to web search tools to gather information about popular dining spots, including Italian, Chinese, and French cuisines. Users will provide the city and any specific dining preferences they have. 

Objective: Provide a list of recommended restaurants, including brief descriptions and any relevant details such as location, menu highlights, and reservation information. 

Response format: Present the information in a list format with each restaurant having a name, description, and dining details.`,
        },
      ],
      availableTools: [
        {
          toolName: "web_search",
          description:
            "An API wrapper for Tavily’s vertical-search engine that prints a focused, relevance-ranked list of results (title, URL, brief excerpt, and score) in JSON. Great for LLMs that need domain-specific answers—especially tech, science, and developer content—without wading through the noise of general web search.",
        },
        {
          toolName: "sound_generator",
          description: "Create sound from natural-language prompts.",
        },
      ],
    },
    user: "Render a 3-D model of my house from this floor plan.",
    example: {
      RESPONSE_CHOICE_EXPLANATION:
        "No existing agent handles 3-D rendering and no available tool supports CAD or graphics output.",
      RESPONSE_TYPE: "AGENT_CONFIG_UNAVAILABLE",
      RESPONSE_AGENT_CONFIG_UNAVAILABLE: {
        explanation:
          "Cannot create or update an agent because there is no tool for 3-D modelling or rendering in the current tool-set.",
      },
    },
  },
  {
    title: "Agent config unavailable",
    subtitle: "Missing suitable tool",
    context: {
      existingAgentConfigs: [],
      availableTools: [
        {
          toolName: "sound_generator",
          description: "Create sound from natural-language prompts.",
        },
      ],
    },
    user: "Gathers news headlines from the past 24 hours that match user-supplied keywords.",
    example: {
      RESPONSE_CHOICE_EXPLANATION:
        "No listed tool can collect headline; agent cannot be created.",
      RESPONSE_TYPE: "AGENT_CONFIG_UNAVAILABLE",
      RESPONSE_AGENT_CONFIG_UNAVAILABLE: {
        explanation:
          "Cannot create or update an agent because there is no tool for collecting headlines.",
      },
    },
  },
]);

export const prompt = ({
  existingAgentConfigs,
  availableTools,
}: Pick<
  AgentConfigInitializerInput,
  "existingAgentConfigs" | "availableTools"
>) =>
  BodyTemplateBuilder.new()
    .introduction(
      `You are an **AgentConfigCreator** — the action module in a multi-agent workflow.  
Your mission is to select, or—if none exists—create new agent configs to accomplish the task. You can also update an existing config as long as the update doesn’t change its purpose.`,
    )
    .section({
      title: {
        text: "Existing resources",
        level: 2,
      },
      newLines: {
        start: 1,
        contentStart: 0,
        contentEnd: 0,
      },
      delimiter: {
        start: true,
        end: true,
      },
      content: ExistingResourcesBuilder.new()
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
      content: decisionCriteria,
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
      content: guidelines,
    })
    .section({
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
      content: examples,
    })
    .callToAction("This is the task")
    .build();
