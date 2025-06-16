import * as laml from "@/laml/index.js";
import { countBy } from "remeda";
import { Context } from "../../base/context.js";
import { LLMCall, LLMCallInput } from "../../base/llm-call.js";
import { FnResult } from "../../base/retry/types.js";
import { assertTaskSteps } from "../helpers/task-step/helpers/assert.js";
import { TaskStepMapper } from "../helpers/task-step/task-step-mapper.js";
import { ProblemDecomposerInput, ProblemDecomposerOutput } from "./dto.js";
import { prompt } from "./prompt.js";
import { protocol } from "./protocol.js";

export class ProblemDecomposer extends LLMCall<
  typeof protocol,
  ProblemDecomposerInput,
  ProblemDecomposerOutput
> {
  get protocol() {
    return protocol;
  }

  protected systemPrompt(input: ProblemDecomposerInput) {
    return prompt(input);
  }

  protected async processResult(
    result: laml.ProtocolResult<typeof protocol>,
    input: LLMCallInput<ProblemDecomposerInput>,
    { onUpdate }: Context,
  ): Promise<FnResult<ProblemDecomposerOutput>> {
    switch (result.RESPONSE_TYPE) {
      case "STEP_SEQUENCE": {
        const response = result.RESPONSE_STEP_SEQUENCE;
        if (!response) {
          throw new Error(`RESPONSE_CREATE_TASK_CONFIG is missing`);
        }
        this.handleOnUpdate(onUpdate, {
          type: result.RESPONSE_TYPE,
          value: `I've decomposed problem into task's sequence:${laml.listFormatter("numbered")(response.step_sequence, "")}`,
        });

        const { resources } = input.data;
        const steps = response.step_sequence.map((s, idx) =>
          TaskStepMapper.parse(s, idx + 1, resources),
        );
        const stepsErrors = steps.filter((step) => step instanceof Error);
        if (stepsErrors.length > 0) {
          this.handleOnUpdate(onUpdate, {
            value: `Problem decomposer step errors:`,
            payload: { toJson: stepsErrors },
          });

          const counts = countBy(
            stepsErrors.map((e) => e.resourceType),
            (type) => type,
          );
          const missingAnyAgent = (counts.agent ?? 0) > 0;
          const missingAnyTool = (counts.tool ?? 0) > 0;
          const missingAnyTask = (counts.task ?? 0) > 0;

          const {
            tools: availableTools,
            agents: existingAgents,
            tasks: existingTasks,
          } = resources;

          const explanation = `The response contains the following issues:${laml.listFormatter(
            "numbered",
          )(
            stepsErrors.map((e) => e.message),
            "",
          )}
${
  ((missingAnyAgent || missingAnyTool || missingAnyTask) &&
    `\nAvailable resources that can be used:` +
      ((missingAnyTask &&
        `\n- Tasks: ${existingTasks.map((t) => t.taskType).join(", ")}`) ||
        "") +
      ((missingAnyAgent &&
        `\n- Agents: ${existingAgents.map((a) => a.agentType).join(", ")}`) ||
        "") +
      ((missingAnyTool &&
        `\n- Tools: ${availableTools.map((t) => t.toolName).join(", ")}`) ||
        "")) ||
  ""
}

Please address these issues and provide the corrected response:`;
          return {
            type: "ERROR",
            explanation,
          };
        }
        assertTaskSteps(steps);

        // Invented parameters
        const stepsWithInventedParams = steps.filter(
          (step) => (step.inputs || []).filter((i) => i.assumed).length > 0,
        );
        if (stepsWithInventedParams.length > 0) {
          this.handleOnUpdate(onUpdate, {
            value: `Problem decomposer invented inputs:`,
            payload: { toJson: stepsWithInventedParams },
          });
          const explanation = `The response contains these steps with the assumed inputs:${laml.listFormatter(
            "bullets",
          )(
            stepsWithInventedParams.map(
              (s) => `Step ${s.no}: ${TaskStepMapper.formatInputOutput(s)}`,
            ),
            "",
          )}
Please corrected response type MISSING_INPUTS:`;
          return {
            type: "ERROR",
            explanation,
          };
        }

        return {
          type: "SUCCESS",
          result: steps,
        };
      }
      case "UNSOLVABLE": {
        const response = result.RESPONSE_UNSOLVABLE;
        if (!response) {
          throw new Error(`RESPONSE_CREATE_TASK_CONFIG is missing`);
        }
        this.handleOnUpdate(onUpdate, {
          type: result.RESPONSE_TYPE,
          value: `I'm not able to decompose the problem due to:`,
          payload: response.explanation,
        });
        return {
          type: "ERROR",
          explanation: `I'm not able to decompose the problem due to: ${response.explanation}`,
          escalation: true,
        };
      }
      case "MISSING_INPUTS": {
        const response = result.RESPONSE_MISSING_INPUTS;
        if (!response) {
          throw new Error(`RESPONSE_MISSING_INPUTS is missing`);
        }

        return {
          type: "ERROR",
          explanation: response.explanation,
          escalation: true,
        };
      }
    }
  }
}
