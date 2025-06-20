import { examplesEnabled } from "@/agents/supervisor/workflow/helpers/env.js";
import { BodyTemplateBuilder } from "@/agents/supervisor/workflow/templates/body.js";
import { ChatExampleTemplateBuilder } from "@/agents/supervisor/workflow/templates/chat-example.js";
import { ExampleInput } from "../../fixtures/helpers/create-example.js";
import beekeeping_site_fixtures from "../../fixtures/prompt/showcases/beekeeping-site-analysis/index.js";
import deep_sea_fixtures from "../../fixtures/prompt/showcases/deep-sea-exploration/index.js";
import medieval_charter_fixtures from "../../fixtures/prompt/showcases/medieval-charter-digitisation/index.js";
import micro_grid_fixtures from "../../fixtures/prompt/showcases/micro-grid-load-balancing/index.js";
import narrative_fusion_fixtures from "../../fixtures/prompt/showcases/narrative-fusion/index.js";
import smart_farm_fixtures from "../../fixtures/prompt/showcases/smart-farm-harvest-planner/index.js";
import feedback_analysis from "../../fixtures/prompt/showcases/feedback-sentiment-analysis/index.js";
import { TaskStepMapper } from "../helpers/task-step/task-step-mapper.js";
import { TaskConfigInitializerInput } from "../task-initializer/task-config-initializer/dto.js";
import { createExampleInput } from "./__tests__/helpers/create-example-input.js";
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
   If **no** non‑dependent fields remain, leave \`task_run_input\` completely empty.
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
   a. ⚠️ You MUST NOT include any parameter marked \`[from Step X]\` in the task_run_input — not even as a placeholder or default.
   b. Never substitute inputs with angle brackets (e.g., "president_name": "<president's name>"). These are treated as violations.
   c. If all inputs are marked [from Step X], then task_run_input must be completely empty (do not even include {}).
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
- Do not try to resolve \`[from Step X]\` inputs. These will be injected at runtime by the execution engine.
- Do not include, stub, rename, or represent \`[from Step X]\` inputs in your response in any way.
- If the only inputs for the task are marked \`[from Step X]\`, then the task_run_input section must be omitted entirely (not even {} or placeholders).
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
    fixtures: medieval_charter_fixtures,
    scenario: "CREATE_TASK_RUN",
    step: "Load the verified text into the vector search system",
  }),
  createExampleInput({
    fixtures: micro_grid_fixtures,
    scenario: "CREATE_TASK_RUN",
    note: "Empty task_run_input because input is marked with [from Step X]",
    step: "Send control vectors to implement the optimized dispatch schedule",
  }),
  createExampleInput({
    fixtures: smart_farm_fixtures,
    scenario: "CREATE_TASK_RUN",
    note: "Empty task_run_input because all inputs are marked with [from Step X]",
    step: "Produce a human-readable timeline with equipment assignments and rain contingency plans",
  }),
  createExampleInput({
    fixtures: narrative_fusion_fixtures,
    scenario: "CREATE_TASK_RUN",
    step: "Write a short story based on the concept of ancient desert rituals",
  }),
  createExampleInput({
    fixtures: beekeeping_site_fixtures,
    scenario: "CREATE_TASK_RUN",
    step: "Analyze local flora at Meadowland Reserve for nectar sources suitable for butterfly host plants",
  }),
  createExampleInput({
    fixtures: deep_sea_fixtures,
    scenario: "TASK_RUN_UNAVAILABLE",
    step: "Conduct basic sonar mapping to identify underwater terrain features in the Puerto Rico Trench",
    responseChoiceExplanation: `The task config "sonar_mapping_underwater_terrain" is referenced in the task step, but it does not exist in the list of existing task configs. According to the rules, if the required task config is missing, a task run cannot be created.`,
    explanation: `Task config "sonar_mapping_underwater_terrain" is not available in the list of existing task configs, so the task run cannot be generated.`,
    override: {
      tasks: (original) => {
        // Remove last task to simulate unavailability
        return original.slice(0, -1);
      },
    },
  }),
  createExampleInput({
    fixtures: feedback_analysis,
    scenario: "CREATE_TASK_RUN",
    note: "with **all** dependent inputs",
    step: "Perform sentiment analysis on the feedback texts",
  }),
  // {
  //   title: "CREATE_TASK_RUN - Sentiment Analysis Task",
  //   subtitle: "with **all** dependent inputs",
  //   user: "Perform sentiment analysis (input: text snippets [from Step 2]; output: sentiment scores) [task: analyze_sentiment]",
  //   context: {
  //     previousSteps: [
  //       {
  //         no: 1,
  //         step: "1. Retrieve customer feedback comments[task_run: operator:retrieve_customer_feedback_comments[1]:1",
  //         inputOutput: `input: dataset ID "cust-feedback-2025-06"; output: text snippets`,
  //         resource: {
  //           type: 'task_run',
  //           taskRun: {},
  //         }
  //       },
  //     ],
  //     resources: {
  //       tasks: [],
  //       agents: [],
  //       taskRuns: [],
  //       tools: [],
  //     },
  //   },
  //   example: {
  //     RESPONSE_CHOICE_EXPLANATION:
  //       "Task config exists and every required input will be injected from Step 2, so no manual fields are needed.",
  //     RESPONSE_TYPE: "CREATE_TASK_RUN",
  //     RESPONSE_CREATE_TASK_RUN: {
  //       task_run_input: "",
  //     },
  //   },
  // },
]);
