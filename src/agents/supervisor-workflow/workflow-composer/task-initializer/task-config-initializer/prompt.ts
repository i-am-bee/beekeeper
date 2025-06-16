import boston_trip_fixtures from "@/agents/supervisor-workflow/fixtures/__test__/boston-trip/index.js";
import { BodyTemplateBuilder } from "@/agents/supervisor-workflow/templates/body.js";
import { ChatExampleTemplateBuilder } from "@/agents/supervisor-workflow/templates/chat-example.js";
import { TaskStepMapper } from "../../helpers/task-step/task-step-mapper.js";
import { TaskConfigInitializerInput } from "./dto.js";
import { protocol } from "./protocol.js";
import { ExistingResourcesBuilder } from "./templates.js";
import {
  createExampleInput,
  ExampleInput,
} from "./__tests__/helpers/create-example-input.js";
import { examplesEnabled } from "@/agents/supervisor-workflow/helpers/env.js";

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
4. **\`task_config_input\`** – General format of input required to run the task; often it is a JSON.
5. **\`description\`** – Describe the generic task. Use placeholders (\`<given location>\`, \`<user budget>\`, etc.) instead of literal input examples.
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

**Guidelines for all branches**

1. If more than one row seems to apply, pick the **top-most** matching row.  
2. Perform the uniqueness check for \`task_type\` **before** emitting \`CREATE_TASK_CONFIG\`; if the name already exists, return \`SELECT_TASK_CONFIG\` instead.  
3. Agent config validation: agent type must appear in **Existing agents**; otherwise respond with \`TASK_CONFIG_UNAVAILABLE\`.  
4. Task config validation: You may only reference a \`task_type\` if it is explicitly listed in the **Existing task configs**.  
   Do not infer or assume the existence of a task config based on agent configs alone.
5. Arrays (e.g., \`tools\`) must be in **alphabetical order** for deterministic grading.`,
  })
  .build();

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
            .taskConfigs(input.context.resources.tasks)
            .agentConfigs(input.context.resources.agents)
            .build(),
        )
        .user(input.user)
        .assistant(protocol.printExample(input.example))
        .build(),
    )
    .join("\n"))([
  createExampleInput(
    "CREATE_TASK_CONFIG",
    "Identify historical sites",
    "Identify historical sites in Back Bay",
    boston_trip_fixtures,
  ),
  createExampleInput(
    "CREATE_TASK_CONFIG",
    "Find game schedules",
    "Find upcoming hockey/basketball game schedules in a given location",
    boston_trip_fixtures,
  ),
  createExampleInput(
    "CREATE_TASK_CONFIG",
    "Restaurant recommendation",
    "Recommend Italian, Chinese, and French restaurants in Back Bay for each day",
    boston_trip_fixtures,
  ),
  createExampleInput(
    "CREATE_TASK_CONFIG",
    "Itinerary creation",
    "Create a balanced 3-day itinerary incorporating historical sites, games, and dining suggestions",
    boston_trip_fixtures,
  ),

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
