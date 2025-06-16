import { AgentAvailableTool } from "@/agents/supervisor-workflow/dto.js";
import { BodyTemplateBuilder } from "@/agents/supervisor-workflow/templates/body.js";
import { ExistingAgentConfig } from "./dto.js";
import { ChatExampleTemplateBuilder } from "@/agents/supervisor-workflow/templates/chat-example.js";
import { ExistingResourcesBuilder } from "./templates.js";
import { protocol } from "./protocol.js";
import * as laml from "@/laml/index.js";

const guidelines = BodyTemplateBuilder.new()
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
      text: "CREATE_AGENT_CONFIG",
      level: 3,
    },
    content: `Use only when a fresh agent is required.  
- \`agent_type\`: a unique, descriptive snake_case name (lowercase, no spaces).  
- \`description\`: 1-2 sentences on the agent’s mission and scope.  
- \`instructions\`: multi-line, structured prose. Recommended subsections: **Context**, **Objective**, **Response format**. Keep it concise yet complete.  
- \`tools\`: *only* canonical tool identifiers drawn from the **Available agent tools** list, comma-separated. Never invent tools.  
- Do **not** duplicate information found in the global task description; focus on what the new agent must know.`,
  })
  .section({
    title: {
      text: "UPDATE_AGENT_CONFIG",
      level: 3,
    },
    content: `Choose when the existing agent’s purpose stays the same but small tweaks are needed.  
- Repeat \`agent_type\` **unchanged**.  
- Include only the fields you are changing; omit untouched fields.  
- When altering \`tools\`, ensure every added tool exists in **Available agent tools** and every removed tool is truly unnecessary.  
- Keep edits minimal: fix clarity, widen scope slightly, or prune excess—never repurpose.`,
  })
  .section({
    title: {
      text: "SELECT_AGENT_CONFIG",
      level: 3,
    },
    content: `Pick this when an existing agent covers the task “as-is.”  
- Provide just the \`agent_type\`.  
- Do not append any other keys or explanatory text.`,
  })
  .section({
    title: {
      text: "AGENT_CONFIG_UNAVAILABLE",
      level: 3,
    },
    newLines: {
      contentEnd: 0,
    },
    content: `Return when no viable creation or update path exists.  
- Provide an \`explanation\` that plainly cites the blocking gap (missing tool, policy limit, out-of-scope request, etc.).  
- Keep it brief and factual—no speculation, apologies, or alternative brainstorming.`,
  })
  .build();

const decisionCriteria = BodyTemplateBuilder.new()
  .section({
    title: {
      text: "AGENT_CONFIG_UNAVAILABLE",
      level: 3,
    },
    content: `Use **always** when:
- There is no suitable available agent tool or existing agent config.
- The task requires **capabilities none of the available tools provide**.
- Neither selecting, updating, nor creating an agent can achieve the goal due to **tool limitations or policy constraints**.
- The request is **out of platform scope** or would violate usage guidelines.
- Any viable solution would demand **external resources** beyond the current environment.`,
  })
  .section({
    title: {
      text: "SELECT_AGENT_CONFIG",
      level: 3,
    },
    content: `Use **always** when:
- An existing agent’s mission and capabilities **already cover the task needs** (e.g., agent specialized to recommend vegan restaurants can't be selected to recommend chinese restaurants).
- The agent’s current **tool set is sufficient**; no additions or removals are needed.
- Only **runtime inputs** (keywords, location, dates, etc.) change—**no structural edits** to the config.
- The agent’s **response format and scope** fully satisfy the user request without modification.
- The agent capabilities are more general then the requested.`,
  })
  .section({
    title: {
      text: "UPDATE_AGENT_CONFIG",
      level: 3,
    },
    content: `Use **always** when:
- The agent’s **core purpose remains unchanged**, but tweaks are required for the new task.
- You need to **add or remove tools** while keeping the same overarching mission.
- The task demands a **broader or narrower scope** (e.g., more cuisines, shorter time window) still within the original domain.
- Minor **instruction, formatting, or clarity improvements** (tone, extra fields, typo fixes) will make the agent compliant.
- You are **refreshing outdated details** or eliminating redundancies without repurposing the agent.`,
  })
  .section({
    title: {
      text: "CREATE_AGENT_CONFIG",
      level: 3,
    },
    content: `Use **always** when:
- **No existing agent** meaningfully aligns with the task’s objective.
- Meeting the request would **fundamentally repurpose** any current agent.
- The task needs a **new combination of tools, domain knowledge, or output format** not present in any config.
- A fresh config can be built with the **available tool set** to fulfill the request cleanly.
Use **NEVER** when:
- There is no suitable available tool critical for agent assignment.
- There is existing a less specialized agent config that can complete the task.`,
  })
  .build();

interface ExampleInput {
  title: string;
  subtitle: string;
  user: string;
  context: {
    existingAgentConfigs: ExistingAgentConfig[];
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
          name: "twitter_search",
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
        agent_type: "tweets_collector_24h",
        description:
          "Gathers tweets that match a user-supplied query or hashtag within a given time window (default = 24 h).",
        instructions: `Context: You are a tweet collection agent specializing in gathering tweets containing specific hashtags. You have access to a web search tool that allows you to find tweets based on search queries. Users will provide you with a hashtag and a time frame for the tweets they want collected. 

Objective: Collect tweets containing the specified hashtag from the past 24 hours. Use the web search tool to execute a search query for the hashtag and filter results to include only tweets from the past 24 hours. Provide a list of tweet URLs and their content.

Response format: Begin with a summary of the search query and time frame. Then list each tweet with its URL and content. Ensure the list is clear and organized, with each tweet entry on a new line. For example:

#AI Tweets from the past 24 hours:
1. URL: [tweet_url_1] Content: [tweet_content_1]
2. URL: [tweet_url_2] Content: [tweet_content_2]`,
        tools: ["twitter_search"],
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
          name: "image_generator",
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
          "Cannot create or update an agent because there is no tool for collect tweets.",
      },
    },
  },
  {
    title: "Update agent config",
    subtitle: "Generalization of restaurants recommendation",
    context: {
      existingAgentConfigs: [
        {
          agentType: "restaurant_recommendations",
          description: "Agent for recommending vegan restaurants in a city.",
          instructions: `Context: You are an agent specialized in finding vegan restaurants in a given city. You have access to web search tools to gather information about popular vegan dining spots. Users will provide the city and any specific dining preferences they have. 

Objective: Provide a list of vegan restaurants, including brief descriptions and any relevant details such as location, menu highlights, and reservation information. 

Response format: Present the information in a list format with each restaurant having a name, description, and dining details.`,
          tools: ["google_search", "web_extract"],
        },
      ],
      availableTools: [
        {
          name: "google_search",
          description:
            "A lightweight utility that fires off a query to Google Search and returns the top-ranked results (title, URL, snippet, and source site) in a compact JSON array. Ideal for quickly grabbing fresh, relevant links when your LLM needs up-to-date information without crawling the entire web.",
        },
        {
          name: "web_extract",
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
        agent_type: "restaurant_recommendations",
        description: "Agent for recommending restaurants in a city.",
        instructions: `Context: You are an agent specialized in finding restaurants that satisfy user-defined criteria—such as cuisine (e.g., Italian, Thai), dietary needs (e.g., vegan, gluten-free), budget, or vibe—in a given city. You have access to web search tools to gather information about popular vegan dining spots. Users will provide the city and any specific dining preferences they have. 

Objective: Return a curated list of restaurants that fit the user’s parameters, including brief descriptions and any relevant details such as location, menu highlights, and reservation information. 

Response format: Present the information in a list format with each restaurant having a name, description, and dining details.`,
        tools: ["google_search", "web_extract"],
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
          description:
            "Provides current weather information for specified locations using weather condition tool.",
          instructions: `Context: You are a weather lookup agent specializing in providing current weather information for specified locations. You have access to a weather condition tool that allows you to find weather data online. Users will provide you with a location for which they want the current weather.

Objective: Retrieve the current weather information for the specified location. Use the weather condition tool to execute a search query for the current weather in the given location. Provide details such as temperature, weather conditions, and any notable weather patterns.

Response format: Begin with a summary of the location and current date. Then provide the current temperature, weather conditions, and any notable weather patterns. Ensure the information is clear and organized. For example:

Current Weather in [Location] on [Date]:
- Temperature: [temperature]
- Conditions: [conditions]
- Notable Patterns: [patterns]`,
          tools: ["weather_conditions"],
        },
      ],
      availableTools: [
        {
          name: "web_search",
          description:
            "Perform real-time internet searches across news sites, blogs, and general web pages. Supports keyword queries, optional domain or date filters, and returns ranked snippets with titles, URLs, and brief summaries for each result.",
        },
        {
          name: "web_extract",
          description:
            "Retrieve a specific web page by URL and return its cleaned full-text content, key metadata (title, author, publish date), and any embedded assets (links, images, tables) in a structured form, removing ads and boilerplate for easier downstream processing.",
        },
        {
          name: "weather_conditions",
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
          agentType: "restaurant_recommendations",
          description: "Agent for recommending restaurants in a city.",
          instructions: `Context: You are an agent specialized in recommending restaurants in a given city. You have access to web search tools to gather information about popular dining spots, including Italian, Chinese, and French cuisines. Users will provide the city and any specific dining preferences they have. 

Objective: Provide a list of recommended restaurants, including brief descriptions and any relevant details such as location, menu highlights, and reservation information. 

Response format: Present the information in a list format with each restaurant having a name, description, and dining details.`,
          tools: ["tavily_search"],
        },
      ],
      availableTools: [
        {
          name: "tavily_search",
          description:
            "An API wrapper for Tavily’s vertical-search engine that prints a focused, relevance-ranked list of results (title, URL, brief excerpt, and score) in JSON. Great for LLMs that need domain-specific answers—especially tech, science, and developer content—without wading through the noise of general web search.",
        },
        {
          name: "sound_generator",
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
          name: "sound_generator",
          description: "Create sound from natural-language prompts.",
        },
      ],
    },
    user: "Gathers news headlines related from the past 24 hours.",
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

export const prompt = (
  configs: ExistingAgentConfig[],
  tools: AgentAvailableTool[],
) =>
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
        contentStart: 1,
        contentEnd: 0,
      },
      delimiter: {
        start: true,
        end: true,
      },
      content: ExistingResourcesBuilder.new()
        .agentConfigs(configs)
        .availableTools(tools)
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
