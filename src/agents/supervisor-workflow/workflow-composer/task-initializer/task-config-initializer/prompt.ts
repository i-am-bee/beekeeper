import { ExampleInput } from "@/agents/supervisor-workflow/fixtures/helpers/create-example.js";
import { examplesEnabled } from "@/agents/supervisor-workflow/helpers/env.js";
import { BodyTemplateBuilder } from "@/agents/supervisor-workflow/templates/body.js";
import { ChatExampleTemplateBuilder } from "@/agents/supervisor-workflow/templates/chat-example.js";
import medieval_charter_fixtures from "../../../fixtures/prompt/showcases/medieval-charter-digitisation/index.js";
import micro_grid_fixtures from "../../../fixtures/prompt/showcases/micro-grid-load-balancing/index.js";
import narrative_fusion_fixtures from "../../../fixtures/prompt/showcases/narrative-fusion/index.js";
import smart_farm_fixtures from "../../../fixtures/prompt/showcases/smart-farm-harvest-planner/index.js";
import deep_sea_fixtures from "@agents/supervisor-workflow/fixtures/prompt/showcases/deep-sea-exploration/index.js";
import beekeeping_site_fixtures from "../../../fixtures/prompt/showcases/beekeeping-site-analysis/index.js";
import { TaskStepMapper } from "../../helpers/task-step/task-step-mapper.js";
import { createExampleInput } from "./__tests__/helpers/create-example-input.js";
import { TaskConfigInitializerInput } from "./dto.js";
import { protocol } from "./protocol.js";
import { ExistingResourcesBuilder } from "./templates.js";

export const prompt = ({
  resources: { tasks: existingTaskConfigs, agents: existingAgentConfigs },
  previousSteps,
}: Pick<TaskConfigInitializerInput, "resources" | "previousSteps">) => {
  const builder = BodyTemplateBuilder.new()
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
        .taskConfigs(
          existingTaskConfigs,
          `Only the task configs explicitly listed here are considered to exist.  
Do **not** infer or invent task configs based on agent config names or similarities. `,
        )
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
      content: examples,
    });
  }
  builder.callToAction("This is the task");

  return builder.build();
};

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
4. **\`task_config_input\`** – General format of input required to run the task; typically structured as JSON.
   - **IMPORTANT:** When the input involves arrays (like multiple short stories or other lists), you **MUST NOT** specify a fixed count of items.
   - Clearly indicate array inputs using a single placeholder within brackets, such as ["<item>", "..."], explicitly signaling flexibility for 1 or more items.
   - **DO NOT** include numbered placeholders (e.g., "<item 1>", "<item 2>") that imply a fixed array length. Always generalize to allow any number of inputs (e.g., "<item>", "...").
5. **\`description\`** – Write a concise instruction for the agent executing the task, explicitly formatted as an assignment. For example: "Generate a short story based on a provided <story concept>. Ensure it has a clear beginning, middle, and end." Always use placeholders (<given location>, <story concept>, etc.) instead of specific literal examples.
6. **Uniqueness guard** – If the proposed \`task_type\` is already listed in **Existing task configs**, abort and use \`SELECT_TASK_CONFIG\` instead.  
   ⚠️ Do not assume a task exists just because an agent of a similar name is present.`,
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
  .section({
    title: {
      text: "TASK_CONFIG_UNAVAILABLE — Rules",
      level: 3,
    },
    content: `1. **When to use** – Use this response **only** if the task cannot proceed due to one of the following:
   a. When neither \`CREATE_TASK_CONFIG\`, \`UPDATE_TASK_CONFIG\`, nor \`SELECT_TASK_CONFIG\` is valid.
   b. **Missing agent config**
      • The specified \`agent_type\` is not listed under **Existing agent configs**.
2. Field requirements:
   * Keep the explanation concise and diagnostic (e.g., "Agent type 'X' not found in existing agent configs.").
   * Do not suggest alternatives, invent configs, or output other fields.`,
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
| • An existing task’s purpose **and** config input already satisfy the user need.<br>• No structural changes are required. <br>• ⚠️ The task config must be listed under "Existing task configs". | **SELECT_TASK_CONFIG** | Re-use as-is. |
| • The task’s core mission stays the same **but** you must fix clarity, widen/narrow scope a bit, edit task config input a little bit.<br>• No repurposing to a new domain. | **UPDATE_TASK_CONFIG** | Light touch edit. |
| • No current task fits.<br>• Creating a fresh task will not duplicate an existing \`task_type\`. | **CREATE_TASK_CONFIG** | Brand-new task config. |
| • Agent config is missing. | **TASK_CONFIG_UNAVAILABLE** | Configuration not possible. |

**Guidelines for all branches**

1. If more than one row seems to apply, pick the **top-most** matching row.  
2. Perform the uniqueness check for \`task_type\` **before** emitting \`CREATE_TASK_CONFIG\`; if the name already exists, return \`SELECT_TASK_CONFIG\` instead.  
3. Agent config validation: 
   - agent type must appear in **Existing agents**; otherwise respond with \`TASK_CONFIG_UNAVAILABLE\`.  
4. Task config validation: 
   - You may only reference a \`task_type\` if it is explicitly listed in the **Existing task configs**.
   - Do not infer or assume the existence of a task config based on agent configs alone.
5. Arrays (e.g., \`tools\`) must be in **alphabetical order** for deterministic grading.`,
  })
  .build();

const examples = ((inputs: ExampleInput<typeof protocol>[]) =>
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
            .taskConfigs(input.context.resources.tasks)
            .agentConfigs(input.context.resources.agents)
            .build(),
        )
        .user(input.user)
        .assistant(protocol.printExample(input.example))
        .build(),
    )
    .join("\n"))([
  // medieval_charter_fixtures
  // micro_grid_fixtures
  // smart_farm_fixtures
  // narrative_fusion_fixtures
  createExampleInput({
    scenario: "CREATE_TASK_CONFIG",
    fixtures: medieval_charter_fixtures,
    step: "Extract text from each scanned image using OCR tuned for Latin script",
  }),
  createExampleInput({
    scenario: "CREATE_TASK_CONFIG",
    fixtures: micro_grid_fixtures,
    step: "Generate an optimized dispatch schedule that meets forecasted demand using solar, battery, and EV resources, while staying within ±0.2 Hz frequency deviation",
  }),
  createExampleInput({
    scenario: "CREATE_TASK_CONFIG",
    fixtures: smart_farm_fixtures,
    step: "Check the operational readiness of harvesters, drones, and grain dryers",
  }),
  createExampleInput({
    scenario: "CREATE_TASK_CONFIG",
    fixtures: narrative_fusion_fixtures,
    step: "Write a short story based on the concept of bioluminescent fungi",
  }),
  createExampleInput({
    fixtures: deep_sea_fixtures,
    scenario: "UPDATE_TASK_CONFIG",
    step: "Enhance sonar mapping by including marine life detection alongside terrain analysis at Mariana Trench",
    responseChoiceExplanation: `The original task config focused on underwater terrain mapping. Since the agent already supports marine life detection and this new task merely extends the input and description to reflect that optional feature, an update is appropriate.`,
    override: {
      agents: () => {
        return [
          {
            ...deep_sea_fixtures.agents.get("underwater_terrain_mapper"),
            description: `Analyzes local flora to identify and validate nectar sources or butterfly host plant compatibility using satellite and ground survey data.`,
            instructions: `Context: The agent is designed to analyze local flora at a specified location to determine either nectar suitability for beekeeping or host compatibility for butterflies.
Objective: Utilize satellite imagery and ground survey data to identify plant species, validate their presence and health, and assess their nectar production or suitability as butterfly host plants using relevant database lookups.
Response format: The agent will output either nectar suitability data or butterfly host compatibility data depending on the input parameters.`,
          },
        ] as any; // FIXME any
      },
      step: (step) => {
        return {
          ...step,
          resource: {
            type: "task",
            task: deep_sea_fixtures.tasks.get(
              "sonar_mapping_underwater_terrain",
            ),
          },
        };
      },
    },
    update: {
      taskConfigInput: `{ "zone_name": "<zone_name>", "scan_resolution": "<scan_resolution>", "depth_range": "<depth_range>", "bio_frequency_range": "<bio_frequency_range>", "organism_filter": "<organism_filter>" }`,
      description: `Conduct sonar mapping to identify underwater terrain features in the specified <zone_name> using the given <scan_resolution> and <depth_range>. When biological input parameters are provided, also detect marine life using <bio_frequency_range> and <organism_filter>. Return integrated terrain and biological sonar data as output.`,
    },
  }),
  createExampleInput({
    scenario: "SELECT_TASK_CONFIG",
    fixtures: beekeeping_site_fixtures,
    step: "Analyze local flora at Meadowland Reserve for nectar sources suitable for beekeeping",
  }),
  createExampleInput({
    scenario: "SELECT_TASK_CONFIG",
    fixtures: deep_sea_fixtures,
    step: "Conduct basic sonar mapping to identify underwater terrain features in the Puerto Rico Trench",
  }),
  createExampleInput({
    scenario: "SELECT_TASK_CONFIG",
    fixtures: narrative_fusion_fixtures,
    step: "Write a short story based on the concept of ancient desert rituals",
  }),
  createExampleInput({
    scenario: "TASK_CONFIG_UNAVAILABLE",
    fixtures: beekeeping_site_fixtures,
    step: "Analyze local flora at Sunnybrook Farm for nectar sources suitable for butterfly host plants",
    override: {
      agents: (original) => {
        // Remove last agent config to trigger TASK_CONFIG_UNAVAILABLE
        return original.slice(0, -1);
      },
    },
    note: 'Missing related agent config',
    responseChoiceExplanation: "The specified agent type 'flora_butterfly_host_analysis' does not appear in the list of existing agent configs. Therefore, the task configuration cannot proceed.",
    explanation: "Agent type 'flora_butterfly_host_analysis' not found in existing agent configs.",
  }),
  //   {
  //     title: "UPDATE_TASK_CONFIG",
  //     subtitle: "Generalize restaurant recommendations",
  //     context: {
  //       previousSteps: [
  //         {
  //           no: 1,
  //           step: "Identify historical sites in Back Bay",
  //           inputOutput: "input: location; output: list of sites",
  //           resource: {
  //             type: "agent",
  //             agent: agentConfigPrompt("historical_sites_identifier"),
  //           },
  //         },
  //         {
  //           no: 2,
  //           step: "Find upcoming hockey/basketball game schedules in a given location",
  //           inputOutput: "input: sport, location; output: game list",
  //           resource: {
  //             type: "agent",
  //             agent: agentConfigPrompt("game_searcher"),
  //           },
  //         },
  //       ],
  //       existingTaskConfigs: [
  //         {
  //           taskType: "recommend_restaurants",
  //           agentType: "restaurant_recommender",
  //           taskConfigInput: `{"dining_preferences":"<preferences such as cuisine, dietary restrictions, or other preferences>","location":"<given location>"}`,
  //           description:
  //             "Task to recommend restaurants based on user-defined preferences and location.",
  //         },
  //       ],
  //       existingAgentConfigs: [
  //         agentConfigPrompt("historical_sites_identifier"),
  //         agentConfigPrompt("game_searcher"),
  //         agentConfigPrompt("restaurant_recommender"),
  //         agentConfigPrompt("3_day_itinerary_creator"),
  //       ],
  //     },
  //     user: "Recommend restaurants in Back Bay based on any user-defined preferences (input: preferences, location; output: restaurant list) [agent: restaurant_recommender]",
  //     example: {
  //       RESPONSE_CHOICE_EXPLANATION:
  //         "The existing task config for recommending restaurants can be generalized to support any user-defined preferences.",
  //       RESPONSE_TYPE: "UPDATE_TASK_CONFIG",
  //       RESPONSE_UPDATE_TASK_CONFIG: {
  //         task_type: "recommend_restaurants",
  //         agent_type: "itinerary_creator",
  //         task_config_input: `{"preferences":"<any user-defined preferences>","location":"<given location>"}`,
  //         description:
  //           "Task to recommend restaurants based on any user-defined preferences and location.",
  //       },
  //     },
  //   },
  //   {
  //     title: "UPDATE_TASK_CONFIG",
  //     subtitle: "Add user preferences to yoga classes recommendation",
  //     context: {
  //       previousSteps: [],
  //       existingTaskConfigs: [
  //         {
  //           taskType: "recommend_yoga_classes",
  //           agentType: "yoga_studio_searcher" as const satisfies AgentConfigType,
  //           taskConfigInput: `{"location":"<given location>"}`,
  //           description: "Task to recommend fitness classes in a given location.",
  //         },
  //       ],
  //       existingAgentConfigs: [
  //         agentConfigPrompt("yoga_studio_searcher"),
  //         agentConfigPrompt("class_schedule_retriever"),
  //         agentConfigPrompt("class_filter"),
  //       ],
  //     },
  //     user: "Recommend yoga classes in Back Bay that are small size and beginner-friendly, Hatha yoga is preferred (input: preferences, restrictions, location; output: class list) [task: recommend_yoga_classes]",
  //     example: {
  //       RESPONSE_CHOICE_EXPLANATION:
  //         "The existing task config for recommending yoga classes can be updated to include preferences and restrictions such as beginner-friendly options.",
  //       RESPONSE_TYPE: "UPDATE_TASK_CONFIG",
  //       RESPONSE_UPDATE_TASK_CONFIG: {
  //         task_type: "recommend_yoga_classes",
  //         agent_type: "yoga_studio_searcher" as const satisfies AgentConfigType,
  //         task_config_input: `{"preferences":"<preferences such as Hatha, Power Yoga>","restrictions": "<restrictions such as beginner-friendly, low-impact, or advanced>","location":"<given location>"}`,
  //         description:
  //           "Task to recommend fitness classes based on user-defined preferences, including restrictions, in a given location.",
  //       },
  //     },
  //   },
  //   {
  //     title: "UPDATE_TASK_CONFIG",
  //     subtitle: "Narrow movie recommendations to specific genres",
  //     context: {
  //       previousSteps: [],
  //       existingTaskConfigs: [
  //         {
  //           taskType: "recommend_movies",
  //           agentType: "movie_recommender",
  //           taskConfigInput: `{"preferences":"<preferences such as genre, language, or other criteria>","year":"<given year>"}`,
  //           description:
  //             "Task to recommend movies based on user-defined preferences and year.",
  //         },
  //       ],
  //       existingAgentConfigs: [agentConfigPrompt("movie_recommender")],
  //     },
  //     user: "Recommend action movies from 2023 (input: preferences, year; output: movie list) [task: recommend_movies]",
  //     example: {
  //       RESPONSE_CHOICE_EXPLANATION:
  //         "The existing task config for recommending movies can be narrowed to focus only on action movies.",
  //       RESPONSE_TYPE: "UPDATE_TASK_CONFIG",
  //       RESPONSE_UPDATE_TASK_CONFIG: {
  //         task_type: "recommend_movies",
  //         task_config_input: `{"preferences":"action","year":"2023"}`,
  //         description:
  //           "Task to recommend action movies from 2023 based on user-defined preferences.",
  //       },
  //     },
  //   },
  //   // FIXME Change example let f1 for demonstration
  //   //   {
  //   //     title: "UPDATE_TASK_CONFIG",
  //   //     subtitle: "Expand F1 race strategy analysis inputs",
  //   //     context: {
  //   //       previousSteps: [
  //   //         {
  //   //           no: 1,
  //   //           step: "Retrieve F1 race data for the 2023 season",
  //   //           inputOutput: "input: season year; output: race data",
  //   //           resource: { type: "agent", agent: agentConfigPrompt("f1_data_retriever") },
  //   //         },
  //   //         {
  //   //           no: 2,
  //   //           step: "Analyze pit stop strategies for each race",
  //   //           inputOutput:
  //   //             "input: race data from Step 1; output: pit stop analysis",
  //   //           resource: { type: "agent", agentType: "pit_stop_analyzer" },
  //   //         },
  //   //       ],
  //   //       existingTaskConfigs: [
  //   //         {
  //   //           taskType: "recommend_movies",
  //   //           agentType: "movie_recommender",
  //   //           taskConfigInput: `{"preferences":"<preferences such as genre, language, or other criteria>","year":"<given year>"}`,
  //   //           description:
  //   //             "Task to recommend movies based on user-defined preferences and year.",
  //   //         },
  //   //       ],
  //   //       existingAgentConfigs: [
  //   //         {
  //   //           agentType: "movie_recommender",
  //   //           tools: ["movie_search_api", "movie_info_api"],
  //   //           instructions: `Context: You are an agent specializing in recommending movies. You are activated by an external task and receive preferences and year as input. You use the movie_search_api and movie_info_api tools to gather information about movies.

  //   // Objective: Provide a list of movies based on user-defined preferences and year. Include details such as title, genre, language, and release year.

  //   // Response format: Present the information in a structured list with each movie having a title, genre, language, and release year.`,
  //   //           description:
  //   //             "Recommends movies based on user-defined preferences and year using movie search and info APIs.",
  //   //         },
  //   //       ],
  //   //     },
  //   //     user: "Recommend action movies from 2023 (input: preferences, year; output: movie list) [agent: movie_recommender]",
  //   //     example: {
  //   //       RESPONSE_CHOICE_EXPLANATION:
  //   //         "The existing task config for recommending movies can be narrowed to focus only on action movies.",
  //   //       RESPONSE_TYPE: "UPDATE_TASK_CONFIG",
  //   //       RESPONSE_UPDATE_TASK_CONFIG: {
  //   //         task_type: "recommend_movies",
  //   //         task_config_input: `{"preferences":"action","year":"2023"}`,
  //   //         description:
  //   //           "Task to recommend action movies from 2023 based on user-defined preferences.",
  //   //       },
  //   //     },
  //   //   },
  //   {
  //     title: "SELECT_TASK_CONFIG",
  //     subtitle: "Reuse farm task planning config",
  //     context: {
  //       previousSteps: [
  //         {
  //           ...farm_daily_fixtures.taskSteps.get(
  //             "Analyze soil data for nutrient levels and suitability for planned operations",
  //           ),
  //           resource: farm_daily_fixtures.taskSteps
  //             .get(
  //               "Analyze soil data for nutrient levels and suitability for planned operations",
  //             )
  //             .resource.get("agent"),
  //         },
  //         {
  //           ...farm_daily_fixtures.taskSteps.get(
  //             "Retrieve the latest status and availability of farm equipment",
  //           ),
  //           resource: farm_daily_fixtures.taskSteps
  //             .get(
  //               "Retrieve the latest status and availability of farm equipment",
  //             )
  //             .resource.get("agent"),
  //         },
  //         {
  //           ...farm_daily_fixtures.taskSteps.get(
  //             "Fetch current and forecasted weather conditions for the farm location",
  //           ),
  //           resource: farm_daily_fixtures.taskSteps
  //             .get(
  //               "Fetch current and forecasted weather conditions for the farm location",
  //             )
  //             .resource.get("agent"),
  //         },
  //       ],
  //       existingTaskConfigs: [
  //         {
  //           taskType: "analyze_soil_quality",
  //           agentType: "soil_analyzer",
  //           taskConfigInput: `{"soil_samples":"<list of soil samples>"}`,
  //           description:
  //             "Task to analyze soil quality based on provided soil samples.",
  //         },
  //         {
  //           taskType: "plan_farm_tasks",
  //           agentType: "farm_task_planner",
  //           taskConfigInput: `{"field_conditions":"<current field conditions>","equipment_status":"<status of automated equipment>","weather_forecast":"<weather forecast for the day>"}`,
  //           description:
  //             "Plan daily tasks on a fully automated farm based on field conditions, equipment status, and weather forecast.",
  //         },
  //         {
  //           taskType: "check_equipment_status",
  //           agentType: "equipment_checker",
  //           taskConfigInput: `{"equipment_list":"<list of farm equipment>"}`,
  //           description:
  //             "Task to check the operational status of automated farm equipment.",
  //         },
  //         {
  //           taskType: "retrieve_weather_forecast",
  //           agentType: "weather_forecaster",
  //           taskConfigInput: `{"location":"<farm location>"}`,
  //           description:
  //             "Task to retrieve the weather forecast for a given farm location.",
  //         },
  //       ],
  //       existingAgentConfigs: [
  //         {
  //           agentType: "soil_analyzer",
  //           tools: ["soil_analysis_api"],
  //           instructions: `Context: You are an agent specializing in soil analysis. You are activated by an external task and receive soil samples as input. You use the soil_analysis_api tool to analyze the samples.
  // Objective: Use the provided soil samples to analyze soil quality. Return the results in a structured format.
  // Response format: List each sample with its quality metrics and recommendations.`,
  //           description:
  //             "Analyzes soil quality based on provided soil samples using the soil_analysis_api tool.",
  //         },
  //         {
  //           agentType: "farm_task_planner",
  //           tools: ["farm_task_planning_api"],
  //           instructions: `Context: You are an agent specializing in farm task planning. You are activated by an external task and receive field conditions, equipment status, and weather forecast as input. You use the farm_task_planning_api tool to plan daily tasks.
  // Objective: Use the provided field conditions, equipment status, and weather forecast to plan daily tasks on a fully automated farm. Return the results in a structured format.
  // Response format: List each task with its description, priority, and estimated time.`,
  //           description:
  //             "Plans daily tasks on a fully automated farm based on field conditions, equipment status, and weather forecast using the farm_task_planning_api tool.",
  //         },
  //         {
  //           agentType: "equipment_checker",
  //           tools: ["equipment_status_api"],
  //           instructions: `Context: You are an agent specializing in checking equipment status. You are activated by an external task and receive a list of equipment as input. You use the equipment_status_api tool to check the status.
  // Objective: Use the provided equipment list to check the operational status of automated farm equipment. Return the results in a structured format.
  // Response format: List each equipment with its status and any required maintenance.`,
  //           description:
  //             "Checks the operational status of automated farm equipment using the equipment_status_api tool.",
  //         },
  //         {
  //           agentType: "weather_forecaster",
  //           tools: ["weather_forecast_api"],
  //           instructions: `Context: You are an agent specializing in weather forecasting. You are activated by an external task and receive a location as input. You use the weather_forecast_api tool to retrieve the forecast.
  // Objective: Use the provided location to retrieve the weather forecast. Return the results in a structured format.
  // Response format: Provide the weather forecast with details such as temperature, humidity, and precipitation.`,
  //           description:
  //             "Retrieves the weather forecast for a given location using the weather_forecast_api tool.",
  //         },
  //       ],
  //     },
  //     user: "Plan daily tasks for the farm based on current field conditions, equipment status, and weather forecast (input: field conditions, equipment status, weather forecast; output: task plan) [agent: farm_task_planner]",
  //     example: {
  //       RESPONSE_CHOICE_EXPLANATION:
  //         "The existing task config for planning farm tasks already satisfies the user request without modifications.",
  //       RESPONSE_TYPE: "SELECT_TASK_CONFIG",
  //       RESPONSE_SELECT_TASK_CONFIG: {
  //         task_type: "plan_farm_tasks",
  //       },
  //     },
  //   },
  //   {
  //     title: "SELECT_TASK_CONFIG",
  //     subtitle: "Correct interplanetary probe trajectory",
  //     context: {
  //       previousSteps: [
  //         {
  //           step: "Calculate the initial trajectory for an interplanetary probe",
  //           inputOutput: "input: launch parameters; output: trajectory data",
  //           resource: { type: "agent", agent: "trajectory_calculator" },
  //         },
  //         {
  //           step: "Analyze gravitational assist opportunities",
  //           inputOutput:
  //             "input: trajectory data from Step 1; output: assist options",
  //           resource: { type: "agent", agentType: "gravity_assist_analyzer" },
  //         },
  //       ],
  //       existingTaskConfigs: [
  //         {
  //           taskType: "calculate_probe_trajectory",
  //           agentType: "trajectory_calculator",
  //           taskConfigInput: `{"launch_parameters":"<parameters such as launch angle, velocity, and time>"}`,
  //           description:
  //             "Task to calculate the initial trajectory for an interplanetary probe based on launch parameters.",
  //         },
  //         {
  //           taskType: "correct_probe_trajectory",
  //           agentType: "trajectory_corrector",
  //           taskConfigInput: `{"trajectory_data":"<initial trajectory data>","assist_options":"<gravitational assist options>"}`,
  //           description:
  //             "Task to correct the trajectory of an interplanetary probe using gravitational assist opportunities.",
  //         },
  //       ],
  //       existingAgentConfigs: [
  //         {
  //           agentType: "trajectory_calculator",
  //           tools: ["trajectory_simulation_api"],
  //           instructions: `Context: You are an agent specializing in calculating probe trajectories. You are activated by an external task and receive launch parameters as input. You use the trajectory_simulation_api tool to calculate the trajectory.
  // Objective: Use the provided launch parameters to calculate the initial trajectory for an interplanetary probe. Return the results in a structured format.
  // Response format: Provide the trajectory data with details such as velocity, angle, and time.`,
  //           description:
  //             "Calculates the initial trajectory for an interplanetary probe based on launch parameters using the trajectory_simulation_api tool.",
  //         },
  //         {
  //           agentType: "gravity_assist_analyzer",
  //           tools: ["gravity_assist_api"],
  //           instructions: `Context: You are an agent specializing in analyzing gravitational assist opportunities. You are activated by an external task and receive trajectory data as input. You use the gravity_assist_api tool to identify assist options.
  // Objective: Use the provided trajectory data to analyze gravitational assist opportunities. Return the results in a structured format.
  // Response format: Provide a list of assist options with details such as planet, timing, and velocity change.`,
  //           description:
  //             "Analyzes gravitational assist opportunities based on trajectory data using the gravity_assist_api tool.",
  //         },
  //         {
  //           agentType: "trajectory_corrector",
  //           tools: ["trajectory_adjustment_api"],
  //           instructions: `Context: You are an agent specializing in correcting probe trajectories. You are activated by an external task and receive trajectory data and assist options as input. You use the trajectory_adjustment_api tool to calculate corrections.
  // Objective: Use the provided trajectory data and assist options to correct the trajectory of an interplanetary probe. Return the results in a structured format.
  // Response format: Provide the corrected trajectory data with details such as velocity, angle, and time adjustments.`,
  //           description:
  //             "Corrects the trajectory of an interplanetary probe using gravitational assist opportunities and trajectory data with the trajectory_adjustment_api tool.",
  //         },
  //       ],
  //     },
  //     user: "Correct the trajectory of an interplanetary probe using gravitational assist opportunities (input: trajectory data from Step 1, assist options from Step 2; output: corrected trajectory) [agent: trajectory_corrector]",
  //     example: {
  //       RESPONSE_CHOICE_EXPLANATION:
  //         "The existing task config for correcting probe trajectories already satisfies the user request without modifications.",
  //       RESPONSE_TYPE: "SELECT_TASK_CONFIG",
  //       RESPONSE_SELECT_TASK_CONFIG: {
  //         task_type: "correct_probe_trajectory",
  //       },
  //     },
  //   },
]);
