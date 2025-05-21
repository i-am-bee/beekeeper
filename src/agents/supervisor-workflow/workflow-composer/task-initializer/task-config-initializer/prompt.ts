import { BodyTemplateBuilder } from "@/agents/supervisor-workflow/templates/body.js";
import { ChatExampleTemplateBuilder } from "@/agents/supervisor-workflow/templates/chat-example.js";
import * as laml from "@/laml/index.js";
import { TaskConfigMinimal, TaskConfigInitializerInput } from "./dto.js";
import { protocol } from "./protocol.js";
import { ExistingResourcesBuilder } from "./templates.js";
import { AgentConfigMinimal } from "../agent-config-initializer/dto.js";

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
3. **\`agent_type\`** – Name of the one of the existing agent configs type.
4. **\`task_config_input\`** – General format of input required to run the task; often it is a JSON.
5. **\`description\`** – Detail information about the task and its context.
6. **Uniqueness guard** – If the proposed \`task_type\` already exists, abort and use \`SELECT_TASK_CONFIG\` instead.`,
  })
  .section({
    title: {
      text: "UPDATE_TASK_CONFIG — Rules",
      level: 3,
    },
    content: `1. **When to use** – choose this type only if the task’s **core purpose remains the same** but you need minor edits (e.g., clarity fixes, small scope widening/narrowing, task config input adjustment).
2. **\`task_type\`** – repeat the existing task’s name **unchanged**.
3. **Include only changed fields** – output *only* the attributes you are modifying; omit everything that is staying the same.
4. **\`agent_type\`** – Name of the one of the existing agent configs type.
5. **\`task_config_input\` edits** – General format of input required to run the task; often it is a JSON.
6. **\`description\`** – Detail information about the task and its context.
7. **Scope discipline** – edits may refine task config input, improve formatting, or prune redundancies, but they must **never repurpose** the task for a different domain.`,
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
    existingTaskConfigs: TaskConfigMinimal[];
    existingAgentConfigs: AgentConfigMinimal[];
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
            .agentConfigs(input.context.existingAgentConfigs)
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
        task_config_input: `{"hashtag":"[hashtag_value]","timeFrame":"[time_frame_value]"}`,
        description:
          "Task to collect tweets containing a user-supplied specific hashtag and time frame.",
      },
    },
  },
  {
    title: "Task config unavailable",
    subtitle: "Collect tweets (No suitable existing agent config)",
    context: {
      existingTaskConfigs: [],
      existingAgentConfigs: [
        {
          agentType: "flight_price_tracker_weekly",
          description: "Weekly flight-deal monitor.",
          instructions:
            "Once a week track round-trip fares on user-defined routes with flight_price_tracker and alert when the price drops below the user’s target threshold.",
          tools: ["flight_price_tracker"],
          agentConfigId: "operator:flight_price_tracker_weekly[1]:1",
          agentConfigVersion: 1,
        },
      ],
    },
    user: "Collect tweets containing the hashtag #AI from the past 24 hours.",
    example: {
      RESPONSE_CHOICE_EXPLANATION:
        "No existing agent can gather tweets on demand; a new agent config is required.",
      RESPONSE_TYPE: "TASK_CONFIG_UNAVAILABLE",
      RESPONSE_TASK_CONFIG_UNAVAILABLE: {
        explanation:
          "Cannot create or update an task config because there is no suitable agent config to use.",
      },
    },
  },
  {
    title: "Update task config",
    subtitle: "Generalization of restaurants recommendation",
    context: {
      existingTaskConfigs: [
        {
          agentType: "restaurant_recommender",
          taskType: "recommend_restaurant",
          description:
            "Task to recommend restaurants in Boston based on cuisine preferences",
          taskConfigInput:
            '{"city":"Boston","cuisines":["Italian", "Chinese", "France"]}',
        },
      ],
      existingAgentConfigs: [
        {
          agentType: "restaurant_recommender",
          tools: ["google_search", "web_extract"],
          instructions: `Context: You are an agent specialized in finding restaurants in a given city. You have access to web search tools to gather information about popular dining spots. Users will provide the city and any specific dining preferences they have.

Objective: Provide a list of restaurants, including brief descriptions and any relevant details such as location, menu highlights, and reservation information.

Response format: Present the information in a list format with each restaurant having a name, description, and dining details.`,
          description: `Agent for recommending restaurants in a city.`,
          agentConfigVersion: 1,
          agentConfigId: "operator:restaurant_recommender:1",
        },
      ],
    },
    user: "I want to recommend just chinese restaurants.",
    example: {
      RESPONSE_CHOICE_EXPLANATION:
        "An existing task configuration covers restaurant recommendations in Boston, but the new task narrows the cuisine to only Chinese, requiring a refinement of the current config.",
      RESPONSE_TYPE: "UPDATE_TASK_CONFIG",
      RESPONSE_UPDATE_TASK_CONFIG: {
        task_type: "restaurant_recommender",
        task_config_input: '{"city":"Boston","cuisines":["Chinese"]}',
        description:
          "Task to recommend restaurants in Boston serving exclusively Chinese cuisine",
      },
    },
  },
  {
    title: "Select task config",
    subtitle: "Weather information",
    context: {
      existingTaskConfigs: [
        {
          agentType: "weather_lookup",
          taskType: "get_current_weather",
          description:
            "Task to retrieve current weather conditions for a specific location.",
          taskConfigInput: '{"location":"New York"}',
        },
      ],
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
          agentConfigVersion: 1,
          agentConfigId: "operator:weather_lookup:1",
        },
      ],
    },
    user: "What’s the weather right now in Prague?",
    example: {
      RESPONSE_CHOICE_EXPLANATION:
        "There is an existing agent configuration for getting actual weather situation that can satisfy the request without modification.",
      RESPONSE_TYPE: "SELECT_TASK_CONFIG",
      RESPONSE_SELECT_TASK_CONFIG: {
        task_type: "weather_lookup",
      },
    },
  },
]);

export const prompt = ({
  existingTaskConfigs,
  existingAgentConfigs,
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
