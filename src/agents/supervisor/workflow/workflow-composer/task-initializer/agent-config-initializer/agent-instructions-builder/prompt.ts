/* eslint-disable @typescript-eslint/no-unused-vars */
import asteroid_mining_feasibility_fixtures from "@/agents/supervisor/workflow/fixtures/prompt/showcases/asteroid-mining-feasibility/index.js";
import micro_grid_fixtures from "@/agents/supervisor/workflow/fixtures/prompt/showcases/micro-grid-load-balancing/index.js";
import smart_farm_fixtures from "@/agents/supervisor/workflow/fixtures/prompt/showcases/smart-farm-harvest-planner/index.js";
import narrative_fusion_fixtures from "@/agents/supervisor/workflow/fixtures/prompt/showcases/narrative-fusion/index.js";
import { examplesEnabled } from "@/agents/supervisor/workflow/helpers/env.js";
import { BodyTemplateBuilder } from "@/agents/supervisor/workflow/templates/body.js";
import { ChatExampleTemplateBuilder } from "@/agents/supervisor/workflow/templates/chat-example.js";
import {
  createExampleInput,
  InstructionsExampleInput,
} from "./__tests__/helpers/create-example-input.js";
import { AgentInstructionsBuilderInput } from "./dto.js";
import { protocol } from "./protocol.js";
import { ContextBuilder } from "./templates.js";
import { isNonNullish } from "remeda";
import { assertTaskStepResourceType } from "../../../helpers/task-step/helpers/assert.js";
import { unwrapTaskStepWithToolsOrLLM } from "@/agents/supervisor/workflow/fixtures/helpers/unwrap-task-step.js";

export const prompt = ({
  resources,
  previousSteps,
  taskStep,
  agentConfigDraft,
}: Pick<
  AgentInstructionsBuilderInput,
  "resources" | "previousSteps" | "taskStep" | "agentConfigDraft"
>) => {
  assertTaskStepResourceType(taskStep, ["tools", "llm"]);

  const { inputs, output, resource } = taskStep;

  let assignedTools;
  if (resource.type === "tools") {
    assignedTools = resources.tools.filter((t) =>
      resource.tools.includes(t.toolName),
    );
  }

  const builder = BodyTemplateBuilder.new()
    .introduction(
      `You are an **AgentInstructionsBuilder** — the action module in a multi-agent workflow.  
Your mission is to create **actionable instructions** for a new LLM agent configuration based on the provided agent description, available tools, and input/output parameters.`,
    )
    .section({
      title: {
        text: "Context",
        level: 2,
      },
      newLines: {
        contentStart: 0,
        contentEnd: 0,
      },
      delimiter: {
        end: true,
      },
      content: ContextBuilder.new()
        .assignedTools(assignedTools)
        .agentMetadata(agentConfigDraft)
        .inputs(previousSteps, inputs)
        .outputs(output ? [output] : [])
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
        text: "Guidelines",
        level: 2,
      },
      newLines: {
        start: 2,
        contentStart: 1,
      },
      delimiter: { end: true },
      content: `You are writing **direct instructions** that the agent itself will follow in an automated workflow. The agent cannot ask questions or access external context.

### Your instructions **MUST**:
- Begin with a **short identity declaration** (1 sentence), e.g.:  
  \`You are an agent responsible for aggregating sentiment scores to uncover emotional trends.\`

- Follow with **two structured sections**:
  - \`## Objective\`: This section must now contain both the task’s goal **and** precise procedural guidance that the agent would otherwise receive in a \`## Steps\` list.
  - \`## Output Format\`: Define exact formatting for the agent’s output. If a report is required, specify a clean ASCII-style layout.

- Use **imperative voice** (e.g., “Classify…”, “Generate…”, “Summarize…”).

- **Reference all input parameters by placeholder** (e.g., \`<location>\`, \`<query>\`), and **do not hard-code example values**.

- Keep instructions compact but unambiguous.

- Ensure the output explicitly includes any relevant IDs or unique identifiers for each item or record (e.g., site IDs, registry numbers, or tool-returned IDs).

### Your instructions **MUST NOT**:
- Include meta-language like “Your task is…” or “You will receive…”
- Describe what the agent *is* — only what it must *do*
- Use JSON or YAML in the output format`,
    })
    .section({
      title: {
        text: "Output Quality Expectation",
        level: 2,
      },
      newLines: {
        start: 2,
        contentStart: 1,
      },
      delimiter: { end: true },
      content: `The final \`INSTRUCTIONS:\` block should resemble a professional agent briefing with:
- Concise identity statement.
- Actionable objective and steps.
- Structured and explicit formatting rules.
- Human-friendly, predictable output with zero JSON.
- If a report is required, the format must follow clean ASCII-style layout, using lines, spacing, and symbols for section separation and alignment.
- All identifiers (IDs) associated with items in the output must be present and clearly labeled.`,
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

  builder.callToAction(
    "This is the task for which you need to create instructions",
  );

  return builder.build();
};

const examples = ((inputs: InstructionsExampleInput[]) =>
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
          ContextBuilder.new()
            .assignedTools(
              input.agentConfigDraft.tools
                .map((t) =>
                  input.context.resources.tools.find(
                    (tool) => tool.toolName === t,
                  ),
                )
                .filter(isNonNullish),
            )
            .agentMetadata(input.agentConfigDraft)
            .inputs(input.context.previousSteps, input.taskStep.inputs)
            .outputs(input.taskStep.output ? [input.taskStep.output] : [])
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
    fixtures: smart_farm_fixtures,
    step: "Produce a human-readable timeline with equipment assignments and rain contingency plans",
    note: "Structured Report Construction",
    instructions: `You are an agent responsible for converting technical harvest and weather data into an operator-friendly timeline plan.

## Objective
Translate the provided \`<harvest schedule>\` and \`<weather forecast>\` into a clear, time-sequenced harvest plan. For each field operation, specify the equipment to be used, the start and end time, and any weather-related contingencies. Incorporate warnings or schedule adjustments where rain is forecast. Ensure that operators can act on the timeline directly without further interpretation.

## Output Format
Return a concise ASCII-style timeline report for the day's operations.

-----------------------------------------------
SMART-FARM HARVEST PLAN — CONTINGENCY TIMELINE
-----------------------------------------------
Date:             <Derived from harvest schedule>
Weather Summary:  <Short summary from forecast>

Field Operations:
--------------------------------------------------------
| Time Slot     | Activity           | Equipment     | ID |
|---------------|--------------------|---------------|---|
| 06:00–08:00   | Drying South Field | Dryer Unit #2 | 01 |
| 08:15–11:00   | Harvest Block A    | Combine 03    | 02 |
| ...           | ...                | ...           |... |
---------------------------------------------------------

Contingencies:
- If rain is forecast during any slot, reschedule operation and mark in plan.
- <e.g., "Rain expected 14:00–16:00; delay Block B harvest to post-16:00.">
- Highlight any idle time or operational gaps due to weather shifts.

-----------------------------------------------
End of Report
-----------------------------------------------`,
  }),
  //   createExampleInput({
  //     fixtures: micro_grid_fixtures,
  //     step: "Send control vectors to implement the optimized dispatch schedule",
  //     note: "Structured Report Construction",
  //     instructions: `You are an agent responsible for implementing a finalized micro-grid dispatch plan by transmitting control vectors to the appropriate infrastructure systems.

  // ## Objective
  // Receive the \`<control vectors>\` array representing pre-optimized inverter set-points for distributed energy resources. Use the dispatch_command_api to transmit these control vectors to the relevant devices. Ensure the API call is successful and capture the returned acknowledgement(s). Do not modify the control vectors or evaluate their contents—your role is limited to execution and confirmation logging.

  // ## Output Format
  // Return a concise ASCII report confirming dispatch success.

  // ------------------------------
  // DISPATCH EXECUTION SUMMARY
  // ------------------------------
  // Status:        ✅ Dispatched
  // Timestamp:     <ISO 8601 time>
  // Vectors Sent:  <number of control vectors>
  // Response:      <API acknowledgement message or code>
  // ------------------------------`,
  //   }),
  //   createExampleInput({
  //     fixtures: asteroid_mining_feasibility_fixtures,
  //     step: "Analyze the mineral composition data of Asteroid 433-Eros",
  //     note: "Structured Report Construction",
  //     instructions: `You are an agent responsible for analyzing the mineral composition of a specified asteroid based on spectroscopic data.

  // ## Objective
  // Use the provided \`<asteroid_id>\` and \`<analysis_depth>\` to invoke the spectral_composition_analyzer_api. Retrieve detailed mineralogical and elemental composition of the asteroid. Focus on identifying the presence and proportion of economically relevant materials (e.g., nickel, iron, platinum-group metals). Include both percentage breakdowns and named mineral types. Ensure analysis is based solely on spectroscopic results from the specified depth layer.

  // ## Output Format
  // Present a structured ASCII-style report with labeled sections.

  // -------------------------------
  // ASTEROID COMPOSITION REPORT
  // Target: <asteroid_id>
  // Depth: <analysis_depth>
  // -------------------------------

  // Mineral Breakdown:
  // - Silicates:         XX.X%
  // - Iron-Nickel Alloy: XX.X%
  // - Sulfides:          XX.X%
  // - Others:            XX.X%

  // Identified Minerals:
  // - Olivine
  // - Pyroxene
  // - Troilite
  // - [etc.]

  // -------------------------------
  // Notes:
  // - All values derived from spectroscopic analysis.
  // - Percentages may not sum to 100% due to trace elements.
  // -------------------------------`,
  //   }),
  //   createExampleInput({
  //     subtitle: "Narrative Fusion",
  //     fixtures: narrative_fusion_fixtures,
  //     step: "Create a screenplay scene that merges all four stories",
  //     note: "Structured Report Construction",
  //     instructions: `You are an agent responsible for synthesizing narrative content into a cohesive screenplay scene.

  // ## Objective
  // Fuse the narrative threads, characters, and core motifs from four distinct short stories into a unified screenplay scene. The resulting scene must represent a coherent and cinematic moment that logically incorporates elements from each source. Ensure the scene includes descriptive stage direction, character dialogue, and a clear sense of atmosphere. Focus on internal consistency and emotional resonance, drawing natural connections between the story elements.

  // Begin by identifying thematic overlaps or contrasts among the four stories. Establish a shared setting that plausibly accommodates elements such as time travel, bioluminescent fungi, ancient desert rituals, and urban foxes. Introduce characters or symbolic references from each story, ensuring that every narrative source contributes meaningfully to the scene. Maintain a dramatic arc—setup, tension, resolution—and avoid fragmented storytelling.

  // ## Output Format
  // Present the screenplay scene in a clear, human-readable format using standard screenplay conventions. Use an ASCII-style layout with spacing and section headers as needed.

  // -------------------------------
  // INT./EXT. [SCENE LOCATION] – [TIME OF DAY]

  // [Brief scene description – mood, setting, notable visuals]

  // CHARACTER NAME
  // (beat, action if needed)
  // Dialogue line one.
  // Dialogue line two.

  // [Continue with action and dialogue blocks as needed.]

  // -------------------------------

  // End with a short horizontal divider and a blank line. Ensure the scene feels complete and ready for productional review. Avoid meta-comments, summaries, or any JSON-style formatting.`,
  //   }),
]);
