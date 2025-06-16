import { BodyTemplateBuilder } from "@/agents/supervisor-workflow/templates/body.js";
import { ChatExampleTemplateBuilder } from "@/agents/supervisor-workflow/templates/chat-example.js";
import * as laml from "@/laml/index.js";
import { ExistingTaskConfig, TaskConfigInitializerInput } from "./dto.js";
import { protocol } from "./protocol.js";
import { ExistingResourcesBuilder } from "./templates.js";
import { ExistingAgentConfig } from "../agent-config-initializer/dto.js";

const guidelines = BodyTemplateBuilder.new()
  .section({
    content: `Task config is a general template or a prescription (like a class in a programming language) for task runs (like an instances) that will be actually proceed at the runtime with various values on inputs but with the same format. Keep that in mind and design task config general not just for one use. Each specific adjustments should be provided through task config input as an attributes.`,
  })
  .section({
    title: {
      text: "Response header",
      level: 3,
    },
    content: `1. \`RESPONSE_CHOICE_EXPLANATION\` – justifying your choice.  
2. \`RESPONSE_TYPE\` – exactly one of: \`CREATE_TASK_CONFIG\`, \`SELECT_TASK_CONFIG\`, \`TASK_CONFIG_UNAVAILABLE\` without extra white spaces or new lines.
These two lines are **mandatory** and must appear first, each on its own line.`,
  })
  .section({
    title: {
      text: "CREATE_TASK_CONFIG — Rules",
      level: 3,
    },
    content: `1. **When to use** – only if a brand-new task is required.  
2. **\`task_type\`** – Must be unique, lowercase snake_case.  
3. **\`task_config_input\`** – General format of input required to run the task; often it is a JSON.  
4. **\`description\`** – Detail information about the task and its context.  
5. **Uniqueness guard** – If the proposed \`task_type\` already exists, abort and use \`SELECT_TASK_CONFIG\` instead.`,
  })
  .section({
    title: {
      text: "UPDATE_TASK_CONFIG — Rules",
      level: 3,
    },
    content: `1. **When to use** – choose this type only if the task’s **core purpose remains the same** but you need minor edits (e.g., clarity fixes, small scope widening/narrowing, task config input adjustment).
2. **\`task_type\`** – repeat the existing task’s name **unchanged**.
3. **Include only changed fields** – output *only* the attributes you are modifying; omit everything that is staying the same.
4. **\`task_config_input\` edits** – General format of input required to run the task; often it is a JSON.
5. **Scope discipline** – edits may refine task config input, improve formatting, or prune redundancies, but they must **never repurpose** the task for a different domain.`,
  })
  .section({
    title: {
      text: "SELECT_TASK_CONFIG — Rules",
      level: 3,
    },
    content: `1. **When to use** – choose this type **only** when an existing task’s mission, task config input, and description **already cover the new task exactly as-is**. No structural edits are required.
2. **\`task_type\`** – supply just the name of the selected task config (lowercase snake_case).  
   *No other keys are allowed in this response object.*
3. **No modifications** – you may **not** tweak \`task_type\`, \` task_config_input\`, or \`description\`. If any change is needed, switch to \`CREATE_TASK_CONFIG\` instead.
4. **Scope confirmation** – before selecting, double-check that:  
   • The requested outcome is within the task’s stated **objective**.     
   • The task’s **config input** matches all necessary information to complete the task.`,
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
| • An existing task’s purpose **and** config input already satisfy the user need.<br>• No structural changes are required. | **SELECT_TASK_CONFIG** | Re-use as-is. |
| • The task’s core mission stays the same **but** you must fix clarity, widen/narrow scope a bit, edit task config input a little bit.<br>• No repurposing to a new domain. | **UPDATE_TASK_CONFIG** | Light touch edit. |
| • No current task fits.<br>• Creating a fresh task will not duplicate an existing \`task_type\`. | **CREATE_TASK_CONFIG** | Brand-new task config. |

**Guidelines for all branches**

1. If more than one row seems to apply, pick the **top-most** matching row.  
2. Perform the uniqueness check for \`task_type\` **before** emitting \`CREATE_TASK_CONFIG\`; if the name already exists, return \`SELECT_TASK_CONFIG\`.  
3. Agent config validation: agent type must appear in **Existing agents**; otherwise respond with \`TASK_CONFIG_UNAVAILABLE\`.  
4. Arrays (e.g., \`tools\`) must be in **alphabetical order** for deterministic grading.`,
  })
  .build();

interface ExampleInput {
  title: string;
  subtitle: string;
  user: string;
  context: {
    existingTaskConfigs: ExistingTaskConfig[];
    existingAgentConfigs: ExistingAgentConfig[];
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
            .taskConfigs(input.context.existingTaskConfigs)
            .build(),
        )
        .user(input.user)
        .assistant(protocol.printExample(input.example))
        .build(),
    )
    .join("\n"))([
  {
    title: "Create task config",
    subtitle: "Collect tweets",
    context: {
      existingTaskConfigs: [],
      existingAgentConfigs: [
        {
          agentType: "tweets_collector",
          agentConfigId: "operator:tweets_collector[1]:1",
          agentConfigVersion: 1,
          description:
            "Gathers tweets that match a user-supplied query or hashtag within a given time window (default = 24 h).",
          instructions: `Context: You are a tweet collection agent specializing in gathering tweets containing specific hashtags. You have access to a web search tool that allows you to find tweets based on search queries. Users will provide you with a hashtag and a time frame for the tweets they want collected. 

Objective: Collect tweets containing the specified hashtag from the specific time window. Use the web search tool to execute a search query for the hashtag and filter results to include only tweets from the specific time window. Provide a list of tweet URLs and their content.

Response format: Begin with a summary of the search query and time frame. Then list each tweet with its URL and content. Ensure the list is clear and organized, with each tweet entry on a new line. For example:

#AI Tweets from the past [time_window]:
1. URL: [tweet_url_1] Content: [tweet_content_1]
2. URL: [tweet_url_2] Content: [tweet_content_2]`,
          tools: ["twitter_search"],
        },
      ],
    },
    user: "Collect tweets containing the hashtag #AI from the past 24 hours.",
    example: {
      RESPONSE_CHOICE_EXPLANATION:
        "No existing agent can gather tweets on demand; a new config is required.",
      RESPONSE_TYPE: "CREATE_TASK_CONFIG",
      RESPONSE_CREATE_TASK_CONFIG: {
        task_type: "collect_tweets",
        agent_type: "tweets_collector",
        description:
          "Task to collect tweets containing a user-supplied specific hashtag and time frame.",
        task_config_input: `{"hashtag":"[hashtag_value]","timeFrame":"[time_frame_value]"}`,
      },
    },
  },
  // {
  //   title: "Task config unavailable",
  //   subtitle: "Collect tweets (No suitable existing agent config)",
  //   context: {
  //     existingTaskConfigs: [],
  //     selectedAgentConfig: {
  //       description:
  //         "Gathers tweets that match a user-supplied query or hashtag within a given time window (default = 24 h).",
  //       agentType: "",
  //       agentConfigVersion: 0,
  //       agentConfigId: "",
  //       instructions: "",
  //       tools: [],
  //     },
  //   },
  //   user: "Collect tweets containing the hashtag #AI from the past 24 hours.",
  //   example: {
  //     RESPONSE_CHOICE_EXPLANATION:
  //       "No existing agent can gather tweets on demand; a new config is required but there is no suitable tool.",
  //     RESPONSE_TYPE: "TASK_CONFIG_UNAVAILABLE",
  //     RESPONSE_TASK_CONFIG_UNAVAILABLE: {
  //       explanation:
  //         "Cannot create or update an agent because there is no tool for collecting tweets.",
  //     },
  //   },
  // },
  //   {
  //     title: "Update agent config",
  //     subtitle: "Generalization of restaurants recommendation",
  //     context: {
  //       existingTaskConfigs: [
  //         {
  //           agentType: "restaurant_recommendations",
  //           description: "Agent for recommending vegan restaurants in a city.",
  //           instructions: `Context: You are an agent specialized in finding vegan restaurants in a given city. You have access to web search tools to gather information about popular vegan dining spots. Users will provide the city and any specific dining preferences they have.

  // Objective: Provide a list of vegan restaurants, including brief descriptions and any relevant details such as location, menu highlights, and reservation information.

  // Response format: Present the information in a list format with each restaurant having a name, description, and dining details.`,
  //           tools: ["google_search", "web_extract"],
  //         },
  //       ],
  //       availableTools: [
  //         {
  //           toolName: "google_search",
  //           description:
  //             "A lightweight utility that fires off a query to Google Search and returns the top-ranked results (title, URL, snippet, and source site) in a compact JSON array. Ideal for quickly grabbing fresh, relevant links when your LLM needs up-to-date information without crawling the entire web.",
  //         },
  //         {
  //           toolName: "web_extract",
  //           description:
  //             "Retrieve a specific web page by URL and return its cleaned full-text content, key metadata (title, author, publish date), and any embedded assets (links, images, tables) in a structured form, removing ads and boilerplate for easier downstream processing.",
  //         },
  //       ],
  //     },
  //     user: "I want to recommend chinese restaurants.",
  //     example: {
  //       RESPONSE_CHOICE_EXPLANATION:
  //         "There isn’t an existing agent configuration specifically designed to find Chinese restaurants, but there is one for recommending vegan options, so I’ll update that agent to make it more general.",
  //       RESPONSE_TYPE: "UPDATE_TASK_CONFIG",
  //       RESPONSE_UPDATE_TASK_CONFIG: {
  //         agent_type: "restaurant_recommendations",
  //         description: "Agent for recommending restaurants in a city.",
  //         instructions: `Context: You are an agent specialized in finding restaurants that satisfy user-defined criteria—such as cuisine (e.g., Italian, Thai), dietary needs (e.g., vegan, gluten-free), budget, or vibe—in a given city. You have access to web search tools to gather information about popular vegan dining spots. Users will provide the city and any specific dining preferences they have.

  // Objective: Return a curated list of restaurants that fit the user’s parameters, including brief descriptions and any relevant details such as location, menu highlights, and reservation information.

  // Response format: Present the information in a list format with each restaurant having a name, description, and dining details.`,
  //         tools: ["google_search", "web_extract"],
  //       },
  //     },
  //   },
  //   {
  //     title: "Select agent config",
  //     subtitle: "Weather information",
  //     context: {
  //       existingTaskConfigs: [
  //         {
  //           agentType: "weather_lookup",
  //           description:
  //             "Provides current weather information for specified locations using weather condition tool.",
  //           instructions: `Context: You are a weather lookup agent specializing in providing current weather information for specified locations. You have access to a weather condition tool that allows you to find weather data online. Users will provide you with a location for which they want the current weather.

  // Objective: Retrieve the current weather information for the specified location. Use the weather condition tool to execute a search query for the current weather in the given location. Provide details such as temperature, weather conditions, and any notable weather patterns.

  // Response format: Begin with a summary of the location and current date. Then provide the current temperature, weather conditions, and any notable weather patterns. Ensure the information is clear and organized. For example:

  // Current Weather in [Location] on [Date]:
  // - Temperature: [temperature]
  // - Conditions: [conditions]
  // - Notable Patterns: [patterns]`,
  //           tools: ["weather_conditions"],
  //         },
  //       ],
  //       availableTools: [
  //         {
  //           toolName: "web_search",
  //           description:
  //             "Perform real-time internet searches across news sites, blogs, and general web pages. Supports keyword queries, optional domain or date filters, and returns ranked snippets with titles, URLs, and brief summaries for each result.",
  //         },
  //         {
  //           toolName: "web_extract",
  //           description:
  //             "Retrieve a specific web page by URL and return its cleaned full-text content, key metadata (title, author, publish date), and any embedded assets (links, images, tables) in a structured form, removing ads and boilerplate for easier downstream processing.",
  //         },
  //         {
  //           toolName: "weather_conditions",
  //           description:
  //             "A lightweight API wrapper that lets your LLM fetch up-to-date conditions—temperature, precipitation, wind, humidity, and short-range forecast—for any location worldwide, so it can answer weather-related questions with real-time data instead of canned text.",
  //         },
  //       ],
  //     },
  //     user: "What’s the weather right now in Prague?",
  //     example: {
  //       RESPONSE_CHOICE_EXPLANATION:
  //         "There is an existing agent configuration for getting actual weather situation that can satisfy the request without modification.",
  //       RESPONSE_TYPE: "SELECT_TASK_CONFIG",
  //       RESPONSE_SELECT_TASK_CONFIG: {
  //         agent_type: "weather_lookup",
  //       },
  //     },
  //   },
  //   {
  //     title: "Agent config unavailable",
  //     subtitle: "3-D house rendering",
  //     context: {
  //       existingTaskConfigs: [
  //         {
  //           agentType: "restaurant_recommendations",
  //           description: "Agent for recommending restaurants in a city.",
  //           instructions: `Context: You are an agent specialized in recommending restaurants in a given city. You have access to web search tools to gather information about popular dining spots, including Italian, Chinese, and French cuisines. Users will provide the city and any specific dining preferences they have.

  // Objective: Provide a list of recommended restaurants, including brief descriptions and any relevant details such as location, menu highlights, and reservation information.

  // Response format: Present the information in a list format with each restaurant having a name, description, and dining details.`,
  //           tools: ["tavily_search"],
  //         },
  //       ],
  //       availableTools: [
  //         {
  //           toolName: "tavily_search",
  //           description:
  //             "An API wrapper for Tavily’s vertical-search engine that prints a focused, relevance-ranked list of results (title, URL, brief excerpt, and score) in JSON. Great for LLMs that need domain-specific answers—especially tech, science, and developer content—without wading through the noise of general web search.",
  //         },
  //         {
  //           toolName: "sound_generator",
  //           description: "Create sound from natural-language prompts.",
  //         },
  //       ],
  //     },
  //     user: "Render a 3-D model of my house from this floor plan.",
  //     example: {
  //       RESPONSE_CHOICE_EXPLANATION:
  //         "No existing agent handles 3-D rendering and no available tool supports CAD or graphics output.",
  //       RESPONSE_TYPE: "TASK_CONFIG_UNAVAILABLE",
  //       RESPONSE_TASK_CONFIG_UNAVAILABLE: {
  //         explanation:
  //           "Cannot create or update an agent because there is no tool for 3-D modelling or rendering in the current tool-set.",
  //       },
  //     },
  //   },
  //   {
  //     title: "Agent config unavailable",
  //     subtitle: "Missing suitable tool",
  //     context: {
  //       existingTaskConfigs: [],
  //       availableTools: [
  //         {
  //           toolName: "sound_generator",
  //           description: "Create sound from natural-language prompts.",
  //         },
  //       ],
  //     },
  //     user: "Gathers news headlines from the past 24 hours that match user-supplied keywords.",
  //     example: {
  //       RESPONSE_CHOICE_EXPLANATION:
  //         "No listed tool can collect headline; agent cannot be created.",
  //       RESPONSE_TYPE: "TASK_CONFIG_UNAVAILABLE",
  //       RESPONSE_TASK_CONFIG_UNAVAILABLE: {
  //         explanation:
  //           "Cannot create or update an agent because there is no tool for collecting headlines.",
  //       },
  //     },
  //   },
]);

export const prompt = ({
  existingTaskConfigs,
  existingAgentConfigs,
  // selectedAgentConfig,
}: Pick<
  TaskConfigInitializerInput,
  "existingAgentConfigs" | "existingTaskConfigs"
>) =>
  BodyTemplateBuilder.new()
    .introduction(
      `You are an **TaskConfigInitiator** — the action module in a multi-agent workflow.  
Your mission is to select, or—if none exists—create new task config to accomplish the task. You can also update an existing config as long as the update doesn’t change its purpose. Task config is a general template for task that will be actually proceed at the runtime.`,
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
        .taskConfigs(existingTaskConfigs)
        .agentConfigs(existingAgentConfigs)
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
