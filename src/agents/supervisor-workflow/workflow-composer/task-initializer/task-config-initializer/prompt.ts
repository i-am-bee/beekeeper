import { BodyTemplateBuilder } from "@/agents/supervisor-workflow/templates/body.js";
import { ChatExampleTemplateBuilder } from "@/agents/supervisor-workflow/templates/chat-example.js";
import * as laml from "@/laml/index.js";
import { TaskStep } from "../../dto.js";
import { TaskStepMapper } from "../../task-step-mapper.js";
import { AgentConfigTiny } from "../agent-config-initializer/dto.js";
import { TaskConfigInitializerInput, TaskConfigMinimal } from "./dto.js";
import { protocol } from "./protocol.js";
import { ExistingResourcesBuilder } from "./templates.js";

export const prompt = ({
  existingTaskConfigs,
  existingAgentConfigs,
  previousSteps,
}: Pick<
  TaskConfigInitializerInput,
  "existingAgentConfigs" | "existingTaskConfigs" | "previousSteps"
>) =>
  BodyTemplateBuilder.new()
    .introduction(
      `You are a **TaskConfigInitiator** — the action module in a multi-agent workflow.  
Your mission is to process assignments in the format:  
\`<Assignment for the agent> (input: <input parameters>, output: <output value>) [agent: <agent config type name>]\`  
Based on the agent config type, you will either create, update, or select a task config to accomplish the task. Task config is a general template for tasks that will be executed at runtime.`,
    )
    .section({
      title: {
        text: "Context",
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
        .previousSteps(previousSteps.map(TaskStepMapper.format))
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

const guidelines = BodyTemplateBuilder.new()
  .section({
    content: `Task config is a general template or a prescription (like a class in a programming language) for task runs (like instances) that will be executed at runtime with various values on inputs but with the same format. Keep that in mind and design task config general – not just for one use. **\`task_type\` and \`description\` must therefore stay *parameter‑agnostic* (use placeholders such as \`<given location>\` for description or just \`location\` for task_type instead of literal values like “London”).** Each specific adjustment should be provided through \`task_config_input\` attributes.`,
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
2. **\`task_type\`** – Must be unique, lowercase snake_case, and must **never embed a concrete input value**. Use operation‑only names (e.g., \`find_nearest_airports\`, not \`find_nearest_airports_in_london\`).
3. **\`agent_type\`** – Name of the one of the existing agent configs type.
4. **\`task_config_input\`** – General format of input required to run the task; often it is a JSON.
5. **\`description\`** – Describe the generic task. Use placeholders (\`<given location>\`, \`<user budget>\`, etc.) instead of literal input examples.
6. **Uniqueness guard** – If the proposed \`task_type\` already exists, abort and use \`SELECT_TASK_CONFIG\` instead.`,
  })
  .section({
    title: {
      text: "UPDATE_TASK_CONFIG — Rules",
      level: 3,
    },
    content: `1. **When to use** – choose this type only if the task’s **core purpose remains the same** but you need minor edits (e.g., clarity fixes, small scope widening/narrowing, task config input adjustment).
2. **\`task_type\`** – repeat the existing task’s name **unchanged**.
3. **Do not insert literal runtime values; keep placeholders intact.**
4. **Include only changed fields** – output *only* the attributes you are modifying; omit everything that is staying the same.
5. **\`agent_type\`** – Name of the one of the existing agent configs type.
6. **\`task_config_input\` edits** – General format of input required to run the task; often it is a JSON.
7. **\`description\`** – Detail information about the task and its context.
8. **Scope discipline** – edits may refine task config input, improve formatting, or prune redundancies, but they must **never repurpose** the task for a different domain.`,
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
2. Perform the uniqueness check for \`task_type\` **before** emitting \`CREATE_TASK_CONFIG\`; if the name already exists, return \`SELECT_TASK_CONFIG\` instead.  
3. Agent config validation: agent type must appear in **Existing agents**; otherwise respond with \`TASK_CONFIG_UNAVAILABLE\`.  
4. Arrays (e.g., \`tools\`) must be in **alphabetical order** for deterministic grading.`,
  })
  .build();

interface ExampleInput {
  title: string;
  subtitle: string;
  user: string;
  context: {
    previousSteps: TaskStep[];
    existingTaskConfigs: TaskConfigMinimal[];
    existingAgentConfigs: AgentConfigTiny[];
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
            .previousSteps(
              input.context.previousSteps.map(TaskStepMapper.format),
            )
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
    title: "CREATE_TASK_CONFIG",
    subtitle: "Identify historical sites",
    context: {
      previousSteps: [],
      existingTaskConfigs: [],
      existingAgentConfigs: [
        {
          agentType: "historical_sites_identifier",
          tools: ["historical_sites_search_api"],
          instructions: `Context: You are an agent specializing in identifying historical sites. You are activated by an external task and receive a location as input. You use the historical_sites_search_api tool to retrieve a list of historical sites.

Objective: Use the provided location to fetch a list of historical sites. Return the results in a structured format.

Response format: List each site with its name and a brief description.`,
          description:
            "Identifies historical sites in a given location using the historical_sites_search_api tool.",
        },
        {
          agentType: "game_searcher",
          tools: ["sports_schedule_api"],
          instructions: `Context: You are an agent specializing in finding sports game schedules. You are activated by an external task and receive sport type and location as input. You use the sports_schedule_api tool to retrieve game schedules.

Objective: Use the provided sport type and location to fetch upcoming game schedules. Return the results in a structured format.

Response format: List each game with its date, time, and teams.`,
          description:
            "Finds upcoming sports game schedules in a given location using the sports_schedule_api tool.",
        },
        {
          agentType: "restaurant_recommender",
          tools: ["google_search", "web_extract"],
          instructions: `Context: You are an agent specializing in recommending restaurants. You are activated by an external task and receive dining preferences and location as input. You use web search tools to gather information about restaurants.

Objective: Provide a list of restaurants based on user-defined preferences and location. Include details such as name, description, and contact information.

Response format: Present the information in a structured list with each restaurant having a name, description, and contact details.`,
          description:
            "Recommends restaurants based on user-defined preferences and location using web search tools.",
        },
        {
          agentType: "itinerary_creator",
          tools: ["itinerary_planner_api"],
          instructions: `Context: You are an agent specializing in creating itineraries. You are activated by an external task and receive inputs such as historical sites, games, and dining suggestions. You use the itinerary_planner_api to generate a detailed itinerary.

Objective: Create a balanced 3-day itinerary based on the provided inputs. Include day-by-day activities and details.

Response format: Present the itinerary day by day with activities and details.`,
          description:
            "Creates a balanced 3-day itinerary based on provided inputs such as historical sites, games, and dining suggestions using the itinerary_planner_api tool.",
        },
      ],
    },
    user: "Identify historical sites in Back Bay (input: location; output: list of sites) [agent: historical_sites_identifier]",
    example: {
      RESPONSE_CHOICE_EXPLANATION:
        "No existing task config matches the request; a new task config is required.",
      RESPONSE_TYPE: "CREATE_TASK_CONFIG",
      RESPONSE_CREATE_TASK_CONFIG: {
        task_type: "identify_historical_sites",
        agent_type: "historical_sites_identifier",
        task_config_input: `{"location":"<given location>"}`,
        description: "Task to identify historical sites in a given location.",
      },
    },
  },
  {
    title: "CREATE_TASK_CONFIG",
    subtitle: "Find game schedules",
    context: {
      previousSteps: [
        {
          step: "Identify historical sites in Back Bay",
          inputOutput: "input: location; output: list of sites",
          resource: { type: "agent", agentType: "historical_sites_identifier" },
        },
      ],
      existingTaskConfigs: [
        {
          taskType: "identify_historical_sites",
          agentType: "historical_sites_identifier",
          taskConfigInput: `{"location":"<given location>"}`,
          description: "Task to identify historical sites in a given location.",
        },
      ],
      existingAgentConfigs: [
        {
          agentType: "historical_sites_identifier",
          tools: ["historical_sites_search_api"],
          instructions: `Context: You are an agent specializing in identifying historical sites. You are activated by an external task and receive a location as input. You use the historical_sites_search_api tool to retrieve a list of historical sites.

Objective: Use the provided location to fetch a list of historical sites. Return the results in a structured format.

Response format: List each site with its name and a brief description.`,
          description:
            "Identifies historical sites in a given location using the historical_sites_search_api tool.",
        },
        {
          agentType: "game_searcher",
          tools: ["sports_schedule_api"],
          instructions: `Context: You are an agent specializing in finding sports game schedules. You are activated by an external task and receive sport type and location as input. You use the sports_schedule_api tool to retrieve game schedules.

Objective: Use the provided sport type and location to fetch upcoming game schedules. Return the results in a structured format.

Response format: List each game with its date, time, and teams.`,
          description:
            "Finds upcoming sports game schedules in a given location using the sports_schedule_api tool.",
        },
        {
          agentType: "restaurant_recommender",
          tools: ["google_search", "web_extract"],
          instructions: `Context: You are an agent specializing in recommending restaurants. You are activated by an external task and receive dining preferences and location as input. You use web search tools to gather information about restaurants.

Objective: Provide a list of restaurants based on user-defined preferences and location. Include details such as name, description, and contact information.

Response format: Present the information in a structured list with each restaurant having a name, description, and contact details.`,
          description:
            "Recommends restaurants based on user-defined preferences and location using web search tools.",
        },
        {
          agentType: "itinerary_creator",
          tools: ["itinerary_planner_api"],
          instructions: `Context: You are an agent specializing in creating itineraries. You are activated by an external task and receive inputs such as historical sites, games, and dining suggestions. You use the itinerary_planner_api to generate a detailed itinerary.

Objective: Create a balanced 3-day itinerary based on the provided inputs. Include day-by-day activities and details.

Response format: Present the itinerary day by day with activities and details.`,
          description:
            "Creates a balanced 3-day itinerary based on provided inputs such as historical sites, games, and dining suggestions using the itinerary_planner_api tool.",
        },
      ],
    },
    user: "Find upcoming hockey/basketball game schedules in a given location (input: sport, location; output: game list) [agent: game_searcher]",
    example: {
      RESPONSE_CHOICE_EXPLANATION:
        "No existing task config matches the request; a new task config is required.",
      RESPONSE_TYPE: "CREATE_TASK_CONFIG",
      RESPONSE_CREATE_TASK_CONFIG: {
        task_type: "find_game_schedules",
        agent_type: "game_searcher",
        task_config_input: `{"sport":"<choose sport: hockey | basketball>","location":"<given location>"}`,
        description:
          "Task to find upcoming hockey and basketball game schedules in a given location.",
      },
    },
  },
  {
    title: "CREATE_TASK_CONFIG",
    subtitle: "Recommend restaurants",
    context: {
      previousSteps: [
        {
          step: "Identify historical sites in Back Bay",
          inputOutput: "input: location; output: list of sites",
          resource: { type: "agent", agentType: "historical_sites_identifier" },
        },
        {
          step: "Find upcoming hockey/basketball game schedules in a given location",
          inputOutput: "input: sport, location; output: game list",
          resource: { type: "agent", agentType: "game_searcher" },
        },
      ],
      existingTaskConfigs: [
        {
          taskType: "identify_historical_sites",
          agentType: "historical_sites_identifier",
          taskConfigInput: `{"location":"<given location>"}`,
          description: "Task to identify historical sites in a given location.",
        },
        {
          taskType: "find_game_schedules",
          agentType: "game_searcher",
          taskConfigInput: `{"sport":"<choose sport: hockey | basketball>","location":"<given location>"}`,
          description:
            "Task to find upcoming hockey and basketball game schedules in a given location.",
        },
      ],
      existingAgentConfigs: [
        {
          agentType: "historical_sites_identifier",
          tools: ["historical_sites_search_api"],
          instructions: `Context: You are an agent specializing in identifying historical sites. You are activated by an external task and receive a location as input. You use the historical_sites_search_api tool to retrieve a list of historical sites.

Objective: Use the provided location to fetch a list of historical sites. Return the results in a structured format.

Response format: List each site with its name and a brief description.`,
          description:
            "Identifies historical sites in a given location using the historical_sites_search_api tool.",
        },
        {
          agentType: "game_searcher",
          tools: ["sports_schedule_api"],
          instructions: `Context: You are an agent specializing in finding sports game schedules. You are activated by an external task and receive sport type and location as input. You use the sports_schedule_api tool to retrieve game schedules.

Objective: Use the provided sport type and location to fetch upcoming game schedules. Return the results in a structured format.

Response format: List each game with its date, time, and teams.`,
          description:
            "Finds upcoming sports game schedules in a given location using the sports_schedule_api tool.",
        },
        {
          agentType: "restaurant_recommender",
          tools: ["google_search", "web_extract"],
          instructions: `Context: You are an agent specializing in recommending restaurants. You are activated by an external task and receive dining preferences and location as input. You use web search tools to gather information about restaurants.

Objective: Provide a list of restaurants based on user-defined preferences and location. Include details such as name, description, and contact information.

Response format: Present the information in a structured list with each restaurant having a name, description, and contact details.`,
          description:
            "Recommends restaurants based on user-defined preferences and location using web search tools.",
        },
        {
          agentType: "itinerary_creator",
          tools: ["itinerary_planner_api"],
          instructions: `Context: You are an agent specializing in creating itineraries. You are activated by an external task and receive inputs such as historical sites, games, and dining suggestions. You use the itinerary_planner_api to generate a detailed itinerary.

Objective: Create a balanced 3-day itinerary based on the provided inputs. Include day-by-day activities and details.

Response format: Present the itinerary day by day with activities and details.`,
          description:
            "Creates a balanced 3-day itinerary based on provided inputs such as historical sites, games, and dining suggestions using the itinerary_planner_api tool.",
        },
      ],
    },
    user: "Recommend Italian, Chinese, and French restaurants in Back Bay for each day (input: dining preferences, location, days; output: restaurant list) [agent: restaurant_recommender]",
    example: {
      RESPONSE_CHOICE_EXPLANATION:
        "No existing task config matches the request; a new task config is required.",
      RESPONSE_TYPE: "CREATE_TASK_CONFIG",
      RESPONSE_CREATE_TASK_CONFIG: {
        task_type: "recommend_restaurants",
        agent_type: "restaurant_recommender",
        task_config_input: `{"dining_preferences":"<preferences such as cuisine, dietary restrictions, or other preferences>","location":"<given location>", "days":"<list of days>"}`,
        description:
          "Task to recommend restaurants for each day based on user-defined preferences, location and list of the days.",
      },
    },
  },
  {
    title: "CREATE_TASK_CONFIG",
    subtitle: "Create a 3-day itinerary",
    context: {
      previousSteps: [
        {
          step: "Identify historical sites in Back Bay",
          inputOutput: "input: location; output: list of sites",
          resource: { type: "agent", agentType: "historical_sites_identifier" },
        },
        {
          step: "Find upcoming hockey/basketball game schedules in a given location",
          inputOutput: "input: sport, location; output: game list",
          resource: { type: "agent", agentType: "game_searcher" },
        },
        {
          step: "Recommend Italian, Chinese, and French restaurants in Back Bay for each day",
          inputOutput:
            "input: dining preferences, location; output: restaurant list",
          resource: { type: "agent", agentType: "restaurant_recommender" },
        },
      ],
      existingTaskConfigs: [
        {
          taskType: "identify_historical_sites",
          agentType: "historical_sites_identifier",
          taskConfigInput: `{"location":"<given location>"}`,
          description: "Task to identify historical sites in a given location.",
        },
        {
          taskType: "find_game_schedules",
          agentType: "game_searcher",
          taskConfigInput: `{"sport":"<choose sport: hockey | basketball>","location":"<given location>"}`,
          description:
            "Task to find upcoming hockey and basketball game schedules in a given location.",
        },
        {
          taskType: "recommend_restaurants",
          agentType: "restaurant_recommender",
          taskConfigInput: `{"dining_preferences":"<preferences such as cuisine, dietary restrictions, or other preferences>","location":"<given location>"}`,
          description:
            "Task to recommend restaurants based on user-defined preferences and location.",
        },
      ],
      existingAgentConfigs: [
        {
          agentType: "historical_sites_identifier",
          tools: ["historical_sites_search_api"],
          instructions: `Context: You are an agent specializing in identifying historical sites. You are activated by an external task and receive a location as input. You use the historical_sites_search_api tool to retrieve a list of historical sites.

Objective: Use the provided location to fetch a list of historical sites. Return the results in a structured format.

Response format: List each site with its name and a brief description.`,
          description:
            "Identifies historical sites in a given location using the historical_sites_search_api tool.",
        },
        {
          agentType: "game_searcher",
          tools: ["sports_schedule_api"],
          instructions: `Context: You are an agent specializing in finding sports game schedules. You are activated by an external task and receive sport type and location as input. You use the sports_schedule_api tool to retrieve game schedules.

Objective: Use the provided sport type and location to fetch upcoming game schedules. Return the results in a structured format.

Response format: List each game with its date, time, and teams.`,
          description:
            "Finds upcoming sports game schedules in a given location using the sports_schedule_api tool.",
        },
        {
          agentType: "restaurant_recommender",
          tools: ["google_search", "web_extract"],
          instructions: `Context: You are an agent specializing in recommending restaurants. You are activated by an external task and receive dining preferences and location as input. You use web search tools to gather information about restaurants.

Objective: Provide a list of restaurants based on user-defined preferences and location. Include details such as name, description, and contact information.

Response format: Present the information in a structured list with each restaurant having a name, description, and contact details.`,
          description:
            "Recommends restaurants based on user-defined preferences and location using web search tools.",
        },
        {
          agentType: "itinerary_creator",
          tools: ["itinerary_planner_api"],
          instructions: `Context: You are an agent specializing in creating itineraries. You are activated by an external task and receive inputs such as historical sites, games, and dining suggestions. You use the itinerary_planner_api to generate a detailed itinerary.

Objective: Create a balanced 3-day itinerary based on the provided inputs. Include day-by-day activities and details.

Response format: Present the itinerary day by day with activities and details.`,
          description:
            "Creates a balanced 3-day itinerary based on provided inputs such as historical sites, games, and dining suggestions using the itinerary_planner_api tool.",
        },
      ],
    },
    user: "Create a balanced 3-day itinerary incorporating historical sites, games, and dining suggestions (input: outputs from Steps 1–3; output: detailed itinerary) [agent: itinerary_creator]",
    example: {
      RESPONSE_CHOICE_EXPLANATION:
        "No existing task config matches the request; a new task config is required.",
      RESPONSE_TYPE: "CREATE_TASK_CONFIG",
      RESPONSE_CREATE_TASK_CONFIG: {
        task_type: "create_3_day_itinerary",
        agent_type: "itinerary_creator",
        task_config_input: `{"historical_sites":"<list of historical sites>","games":"<list of games>","restaurants":"<list of restaurants>"}`,
        description:
          "Task to create a balanced 3-day itinerary incorporating historical sites, games, and dining suggestions.",
      },
    },
  },
  {
    title: "UPDATE_TASK_CONFIG",
    subtitle: "Generalize restaurant recommendations",
    context: {
      previousSteps: [
        {
          step: "Identify historical sites in Back Bay",
          inputOutput: "input: location; output: list of sites",
          resource: { type: "agent", agentType: "historical_sites_identifier" },
        },
        {
          step: "Find upcoming hockey/basketball game schedules in a given location",
          inputOutput: "input: sport, location; output: game list",
          resource: { type: "agent", agentType: "game_searcher" },
        },
      ],
      existingTaskConfigs: [
        {
          taskType: "recommend_restaurants",
          agentType: "restaurant_recommender",
          taskConfigInput: `{"dining_preferences":"<preferences such as cuisine, dietary restrictions, or other preferences>","location":"<given location>"}`,
          description:
            "Task to recommend restaurants based on user-defined preferences and location.",
        },
      ],
      existingAgentConfigs: [
        {
          agentType: "restaurant_recommender",
          tools: ["google_search", "web_extract"],
          instructions: `Context: You are an agent specializing in recommending restaurants. You are activated by an external task and receive dining preferences and location as input. You use web search tools to gather information about restaurants.

Objective: Provide a list of restaurants based on user-defined preferences and location. Include details such as name, description, and contact information.

Response format: Present the information in a structured list with each restaurant having a name, description, and contact details.`,
          description:
            "Recommends restaurants based on user-defined preferences and location using web search tools.",
        },
      ],
    },
    user: "Recommend restaurants in Back Bay based on any user-defined preferences (input: preferences, location; output: restaurant list) [agent: restaurant_recommender]",
    example: {
      RESPONSE_CHOICE_EXPLANATION:
        "The existing task config for recommending restaurants can be generalized to support any user-defined preferences.",
      RESPONSE_TYPE: "CREATE_TASK_CONFIG",
      RESPONSE_CREATE_TASK_CONFIG: {
        task_type: "recommend_restaurants",
        agent_type: "itinerary_creator",
        task_config_input: `{"preferences":"<any user-defined preferences>","location":"<given location>"}`,
        description:
          "Task to recommend restaurants based on any user-defined preferences and location.",
      },
    },
  },
  {
    title: "UPDATE_TASK_CONFIG",
    subtitle: "Add restrictions to fitness class recommendations",
    context: {
      previousSteps: [
        {
          step: "Search for yoga studios in Cambridge",
          inputOutput: "input: location; output: list of studios",
          resource: { type: "agent", agentType: "yoga_studio_searcher" },
        },
        {
          step: "Retrieve schedules for yoga classes in Cambridge",
          inputOutput:
            "input: studio list from Step 1; output: class schedules",
          resource: { type: "agent", agentType: "class_schedule_retriever" },
        },
        {
          step: "Filter yoga classes based on user preferences",
          inputOutput:
            "input: class schedules from Step 2, preferences; output: filtered classes",
          resource: { type: "agent", agentType: "class_filter" },
        },
      ],
      existingTaskConfigs: [
        {
          taskType: "recommend_fitness_classes",
          agentType: "recommend_fitness_classes",
          taskConfigInput: `{"preferences":"<preferences such as yoga, pilates, or other types>","location":"<given location>"}`,
          description:
            "Task to recommend fitness classes based on user-defined preferences and location.",
        },
      ],
      existingAgentConfigs: [
        {
          agentType: "fitness_class_recommender",
          tools: ["fitness_class_api", "web_extract"],
          instructions: `Context: You are an agent specializing in recommending fitness classes. You are activated by an external task and receive preferences and location as input. You use APIs and web search tools to gather information about fitness classes.

Objective: Provide a list of fitness classes based on user-defined preferences and location. Include details such as name, description, and schedule.

Response format: Present the information in a structured list with each class having a name, description, and schedule.`,
          description:
            "Recommends fitness classes based on user-defined preferences and location using APIs and web search tools.",
        },
      ],
    },
    user: "Recommend yoga classes in Back Bay that are beginner-friendly (input: preferences, restrictions, location; output: class list) [agent: fitness_class_recommender]",
    example: {
      RESPONSE_CHOICE_EXPLANATION:
        "The existing task config for recommending fitness classes can be updated to include restrictions such as beginner-friendly options.",
      RESPONSE_TYPE: "UPDATE_TASK_CONFIG",
      RESPONSE_UPDATE_TASK_CONFIG: {
        task_type: "recommend_fitness_classes",
        agent_type: "itinerary_creator",
        task_config_input: `{"preferences":"<preferences such as yoga>","restrictions": "<restrictions such as beginner-friendly, low-impact, or advanced>","location":"<given location>"}`,
        description:
          "Task to recommend fitness classes based on user-defined preferences, including restrictions, in a given location.",
      },
    },
  },
  {
    title: "UPDATE_TASK_CONFIG",
    subtitle: "Narrow movie recommendations to specific genres",
    context: {
      previousSteps: [],
      existingTaskConfigs: [
        {
          taskType: "recommend_movies",
          agentType: "movie_recommender",
          taskConfigInput: `{"preferences":"<preferences such as genre, language, or other criteria>","year":"<given year>"}`,
          description:
            "Task to recommend movies based on user-defined preferences and year.",
        },
      ],
      existingAgentConfigs: [
        {
          agentType: "movie_recommender",
          tools: ["movie_search_api", "movie_info_api"],
          instructions: `Context: You are an agent specializing in recommending movies. You are activated by an external task and receive preferences and year as input. You use the movie_search_api and movie_info_api tools to gather information about movies.

Objective: Provide a list of movies based on user-defined preferences and year. Include details such as title, genre, language, and release year.

Response format: Present the information in a structured list with each movie having a title, genre, language, and release year.`,
          description:
            "Recommends movies based on user-defined preferences and year using movie search and info APIs.",
        },
      ],
    },
    user: "Recommend action movies from 2023 (input: preferences, year; output: movie list) [agent: movie_recommender]",
    example: {
      RESPONSE_CHOICE_EXPLANATION:
        "The existing task config for recommending movies can be narrowed to focus only on action movies.",
      RESPONSE_TYPE: "UPDATE_TASK_CONFIG",
      RESPONSE_UPDATE_TASK_CONFIG: {
        task_type: "recommend_movies",
        task_config_input: `{"preferences":"action","year":"2023"}`,
        description:
          "Task to recommend action movies from 2023 based on user-defined preferences.",
      },
    },
  },
  {
    title: "UPDATE_TASK_CONFIG",
    subtitle: "Expand F1 race strategy analysis inputs",
    context: {
      previousSteps: [
        {
          step: "Retrieve F1 race data for the 2023 season",
          inputOutput: "input: season year; output: race data",
          resource: { type: "agent", agentType: "f1_data_retriever" },
        },
        {
          step: "Analyze pit stop strategies for each race",
          inputOutput:
            "input: race data from Step 1; output: pit stop analysis",
          resource: { type: "agent", agentType: "pit_stop_analyzer" },
        },
      ],
      existingTaskConfigs: [
        {
          taskType: "recommend_movies",
          agentType: "movie_recommender",
          taskConfigInput: `{"preferences":"<preferences such as genre, language, or other criteria>","year":"<given year>"}`,
          description:
            "Task to recommend movies based on user-defined preferences and year.",
        },
      ],
      existingAgentConfigs: [
        {
          agentType: "movie_recommender",
          tools: ["movie_search_api", "movie_info_api"],
          instructions: `Context: You are an agent specializing in recommending movies. You are activated by an external task and receive preferences and year as input. You use the movie_search_api and movie_info_api tools to gather information about movies.

Objective: Provide a list of movies based on user-defined preferences and year. Include details such as title, genre, language, and release year.

Response format: Present the information in a structured list with each movie having a title, genre, language, and release year.`,
          description:
            "Recommends movies based on user-defined preferences and year using movie search and info APIs.",
        },
      ],
    },
    user: "Recommend action movies from 2023 (input: preferences, year; output: movie list) [agent: movie_recommender]",
    example: {
      RESPONSE_CHOICE_EXPLANATION:
        "The existing task config for recommending movies can be narrowed to focus only on action movies.",
      RESPONSE_TYPE: "UPDATE_TASK_CONFIG",
      RESPONSE_UPDATE_TASK_CONFIG: {
        task_type: "recommend_movies",
        task_config_input: `{"preferences":"action","year":"2023"}`,
        description:
          "Task to recommend action movies from 2023 based on user-defined preferences.",
      },
    },
  },
  {
    title: "SELECT_TASK_CONFIG",
    subtitle: "Reuse farm task planning config",
    context: {
      previousSteps: [
        {
          step: "Analyze soil quality in the farm fields",
          inputOutput: "input: soil samples; output: soil quality report",
          resource: { type: "agent", agentType: "soil_analyzer" },
        },
        {
          step: "Check the operational status of automated farm equipment",
          inputOutput: "input: equipment list; output: equipment status report",
          resource: { type: "agent", agentType: "equipment_checker" },
        },
        {
          step: "Retrieve the weather forecast for the farm location",
          inputOutput: "input: location; output: weather forecast",
          resource: { type: "agent", agentType: "weather_forecaster" },
        },
      ],
      existingTaskConfigs: [
        {
          taskType: "analyze_soil_quality",
          agentType: "soil_analyzer",
          taskConfigInput: `{"soil_samples":"<list of soil samples>"}`,
          description:
            "Task to analyze soil quality based on provided soil samples.",
        },
        {
          taskType: "plan_farm_tasks",
          agentType: "farm_task_planner",
          taskConfigInput: `{"field_conditions":"<current field conditions>","equipment_status":"<status of automated equipment>","weather_forecast":"<weather forecast for the day>"}`,
          description:
            "Plan daily tasks on a fully automated farm based on field conditions, equipment status, and weather forecast.",
        },
        {
          taskType: "check_equipment_status",
          agentType: "equipment_checker",
          taskConfigInput: `{"equipment_list":"<list of farm equipment>"}`,
          description:
            "Task to check the operational status of automated farm equipment.",
        },
        {
          taskType: "retrieve_weather_forecast",
          agentType: "weather_forecaster",
          taskConfigInput: `{"location":"<farm location>"}`,
          description:
            "Task to retrieve the weather forecast for a given farm location.",
        },
      ],
      existingAgentConfigs: [
        {
          agentType: "soil_analyzer",
          tools: ["soil_analysis_api"],
          instructions: `Context: You are an agent specializing in soil analysis. You are activated by an external task and receive soil samples as input. You use the soil_analysis_api tool to analyze the samples.
Objective: Use the provided soil samples to analyze soil quality. Return the results in a structured format.
Response format: List each sample with its quality metrics and recommendations.`,
          description:
            "Analyzes soil quality based on provided soil samples using the soil_analysis_api tool.",
        },
        {
          agentType: "farm_task_planner",
          tools: ["farm_task_planning_api"],
          instructions: `Context: You are an agent specializing in farm task planning. You are activated by an external task and receive field conditions, equipment status, and weather forecast as input. You use the farm_task_planning_api tool to plan daily tasks.
Objective: Use the provided field conditions, equipment status, and weather forecast to plan daily tasks on a fully automated farm. Return the results in a structured format.
Response format: List each task with its description, priority, and estimated time.`,
          description:
            "Plans daily tasks on a fully automated farm based on field conditions, equipment status, and weather forecast using the farm_task_planning_api tool.",
        },
        {
          agentType: "equipment_checker",
          tools: ["equipment_status_api"],
          instructions: `Context: You are an agent specializing in checking equipment status. You are activated by an external task and receive a list of equipment as input. You use the equipment_status_api tool to check the status.
Objective: Use the provided equipment list to check the operational status of automated farm equipment. Return the results in a structured format.
Response format: List each equipment with its status and any required maintenance.`,
          description:
            "Checks the operational status of automated farm equipment using the equipment_status_api tool.",
        },
        {
          agentType: "weather_forecaster",
          tools: ["weather_forecast_api"],
          instructions: `Context: You are an agent specializing in weather forecasting. You are activated by an external task and receive a location as input. You use the weather_forecast_api tool to retrieve the forecast.
Objective: Use the provided location to retrieve the weather forecast. Return the results in a structured format.
Response format: Provide the weather forecast with details such as temperature, humidity, and precipitation.`,
          description:
            "Retrieves the weather forecast for a given location using the weather_forecast_api tool.",
        },
      ],
    },
    user: "Plan daily tasks for the farm based on current field conditions, equipment status, and weather forecast (input: field conditions, equipment status, weather forecast; output: task plan) [agent: farm_task_planner]",
    example: {
      RESPONSE_CHOICE_EXPLANATION:
        "The existing task config for planning farm tasks already satisfies the user request without modifications.",
      RESPONSE_TYPE: "SELECT_TASK_CONFIG",
      RESPONSE_SELECT_TASK_CONFIG: {
        task_type: "plan_farm_tasks",
      },
    },
  },
  {
    title: "SELECT_TASK_CONFIG",
    subtitle: "Correct interplanetary probe trajectory",
    context: {
      previousSteps: [
        {
          step: "Calculate the initial trajectory for an interplanetary probe",
          inputOutput: "input: launch parameters; output: trajectory data",
          resource: { type: "agent", agentType: "trajectory_calculator" },
        },
        {
          step: "Analyze gravitational assist opportunities",
          inputOutput:
            "input: trajectory data from Step 1; output: assist options",
          resource: { type: "agent", agentType: "gravity_assist_analyzer" },
        },
      ],
      existingTaskConfigs: [
        {
          taskType: "calculate_probe_trajectory",
          agentType: "trajectory_calculator",
          taskConfigInput: `{"launch_parameters":"<parameters such as launch angle, velocity, and time>"}`,
          description:
            "Task to calculate the initial trajectory for an interplanetary probe based on launch parameters.",
        },
        {
          taskType: "correct_probe_trajectory",
          agentType: "trajectory_corrector",
          taskConfigInput: `{"trajectory_data":"<initial trajectory data>","assist_options":"<gravitational assist options>"}`,
          description:
            "Task to correct the trajectory of an interplanetary probe using gravitational assist opportunities.",
        },
      ],
      existingAgentConfigs: [
        {
          agentType: "trajectory_calculator",
          tools: ["trajectory_simulation_api"],
          instructions: `Context: You are an agent specializing in calculating probe trajectories. You are activated by an external task and receive launch parameters as input. You use the trajectory_simulation_api tool to calculate the trajectory.
Objective: Use the provided launch parameters to calculate the initial trajectory for an interplanetary probe. Return the results in a structured format.
Response format: Provide the trajectory data with details such as velocity, angle, and time.`,
          description:
            "Calculates the initial trajectory for an interplanetary probe based on launch parameters using the trajectory_simulation_api tool.",
        },
        {
          agentType: "gravity_assist_analyzer",
          tools: ["gravity_assist_api"],
          instructions: `Context: You are an agent specializing in analyzing gravitational assist opportunities. You are activated by an external task and receive trajectory data as input. You use the gravity_assist_api tool to identify assist options.
Objective: Use the provided trajectory data to analyze gravitational assist opportunities. Return the results in a structured format.
Response format: Provide a list of assist options with details such as planet, timing, and velocity change.`,
          description:
            "Analyzes gravitational assist opportunities based on trajectory data using the gravity_assist_api tool.",
        },
        {
          agentType: "trajectory_corrector",
          tools: ["trajectory_adjustment_api"],
          instructions: `Context: You are an agent specializing in correcting probe trajectories. You are activated by an external task and receive trajectory data and assist options as input. You use the trajectory_adjustment_api tool to calculate corrections.
Objective: Use the provided trajectory data and assist options to correct the trajectory of an interplanetary probe. Return the results in a structured format.
Response format: Provide the corrected trajectory data with details such as velocity, angle, and time adjustments.`,
          description:
            "Corrects the trajectory of an interplanetary probe using gravitational assist opportunities and trajectory data with the trajectory_adjustment_api tool.",
        },
      ],
    },
    user: "Correct the trajectory of an interplanetary probe using gravitational assist opportunities (input: trajectory data from Step 1, assist options from Step 2; output: corrected trajectory) [agent: trajectory_corrector]",
    example: {
      RESPONSE_CHOICE_EXPLANATION:
        "The existing task config for correcting probe trajectories already satisfies the user request without modifications.",
      RESPONSE_TYPE: "SELECT_TASK_CONFIG",
      RESPONSE_SELECT_TASK_CONFIG: {
        task_type: "correct_probe_trajectory",
      },
    },
  },
]);
