import * as laml from "@/laml/index.js";
import { Context } from "../../base/context.js";
import { LLMCall, LLMCallInput } from "../../base/llm-call.js";
import { FnResult } from "../../base/retry/types.js";
import { TaskStepMapper } from "../task-step-mapper.js";
import { ProblemDecomposerInput, ProblemDecomposerOutput } from "./dto.js";
import { prompt } from "./prompt.js";
import { protocol } from "./protocol.js";
import { isNonNull } from "remeda";

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

        const { availableTools, existingAgents } = input.data;
        const steps = response.step_sequence.map(TaskStepMapper.parse);

        // Ensure the result utilizes existing tools and agent configurations; otherwise, it will retry
        // the LLM call with a user message highlighting the identified issues.
        let missingAnyTool = false;
        let missingAnyAgent = false;
        const stepErrors = steps
          .map(({ resource }, idx) => {
            switch (resource.type) {
              case "tools": {
                missingAnyTool = true;
                const stepNo = idx + 1;
                const { tools } = resource;
                const missingTools = tools.filter(
                  (tool) => !availableTools.find((t) => t.toolName === tool),
                );
                return missingTools.length > 0
                  ? `Step ${stepNo} references a non-existent tool(s): \`${missingTools.join(", ")}\``
                  : null;
              }
              case "agent": {
                missingAnyAgent = true;
                const stepNo = idx + 1;
                const { agentType } = resource;
                const missingAgent = !existingAgents.some(
                  (agent) => agent.agentType === agentType,
                );
                return missingAgent
                  ? `Step ${stepNo} has assigned non-existing agent: \`${agentType}\``
                  : null;
              }
              case "llm":
                return null;
            }
          })
          .filter(isNonNull);

        if (stepErrors.length > 0) {
          this.handleOnUpdate(onUpdate, {
            value: `Problem decomposer step errors:`,
            payload: { toJson: stepErrors },
          });

          const explanation = `The response contains the following issues:${laml.listFormatter("numbered")(stepErrors, "")}
${
  ((missingAnyAgent || missingAnyTool) &&
    `\nAvailable resources that can be used:` +
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
    }
  }
}
