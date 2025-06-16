import { examplesEnabled } from "@/agents/supervisor-workflow/helpers/env.js";
import { BodyTemplateBuilder } from "@/agents/supervisor-workflow/templates/body.js";
import { ChatExampleTemplateBuilder } from "@/agents/supervisor-workflow/templates/chat-example.js";

import { TaskStepMapper } from "../helpers/task-step/task-step-mapper.js";
import { TaskConfigInitializerInput } from "../task-initializer/task-config-initializer/dto.js";
import { ExampleInput } from "./__tests__/helpers/create-example-input.js";
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
        text: "Task and Workflow Logic",
        level: 2,
      },
      newLines: {
        start: 2,
        contentStart: 1,
        contentEnd: 0,
      },
      delimiter: { end: true },
      content: `Each task step belongs to a workflow.
Your job is to prepare a **task run** for the current task step using the assigned task config.

**Important rules:**

1. A task run is an instance of a task config. You must use the template in the task config to build the task run input.
2. Task config points to the agent config that will be used to execute the task run.
3. The runtime engine will inject the results from parent steps when it sees \`"[from Step X]"\` in the input. You do **not** need to resolve these manually.
4. Your job is to extract only non-dependent input values (i.e., input values not marked with [from Step X]) and use them to fill the matching fields from the task config input template.
⚠️ Do not include any values marked [from Step X] in the task_run_input. These will be injected by the runtime engine automatically.`,
    })
    .section({
      title: {
        text: "Step-by-step Process",
        level: 2,
      },
      newLines: {
        start: 2,
        contentStart: 1,
        contentEnd: 0,
      },
      delimiter: { end: true },
      content: `1. Look at the current task step. Find the task config name (after \`[task: ...]\`).
2. Find the matching task config from the list.
3. Use the \`task_config_input\` as a template to prepare the actual input.
4. Copy the values from the task step input that are **not** marked \`[from Step X]\`.
   a. Ignore any input parameters marked [from Step X] — do not include them in your task_run_input. These will be filled in automatically later.
5. Output a task run using the correct format.`,
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
      content: `| Situation | RESPONSE_TYPE | Explanation |
|----------|----------------|-------------|
| Task config exists and input can be completed using non-dependent fields | CREATE_TASK_RUN | Proceed to prepare the run |
| Task config does not exist or agent config is missing | TASK_RUN_UNAVAILABLE | Abort with an explanation |`,
    })
    .section({
      title: {
        text: "Final Notes",
        level: 2,
      },
      newLines: {
        start: 2,
        contentStart: 1,
        contentEnd: 0,
      },
      delimiter: { end: true },
      content: `- Do **not** generate or invent new task configs or agent configs.
- Do **not** try to resolve \`[from Step X]\` inputs. These will be filled by the engine.
- Your job is only to prepare \`task_run_input\` using what is available directly in the input field of the task step.`,
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
  builder.callToAction("This is the task step");

  return builder.build();
};

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
  // createExampleInput(
  //   "CREATE_TASK_CONFIG",
  //   "Identify historical sites",
  //   "Identify historical sites in Back Bay",
  //   boston_trip_fixtures,
  // ),
  // createExampleInput(
  //   "CREATE_TASK_CONFIG",
  //   "Find game schedules",
  //   "Find upcoming hockey/basketball game schedules in a given location",
  //   boston_trip_fixtures,
  // ),
  // createExampleInput(
  //   "CREATE_TASK_CONFIG",
  //   "Restaurant recommendation",
  //   "Recommend Italian, Chinese, and French restaurants in Back Bay for each day",
  //   boston_trip_fixtures,
  // ),
  // createExampleInput(
  //   "CREATE_TASK_CONFIG",
  //   "Itinerary creation",
  //   "Create a balanced 3-day itinerary incorporating historical sites, games, and dining suggestions",
  //   boston_trip_fixtures,
  // ),

]);
