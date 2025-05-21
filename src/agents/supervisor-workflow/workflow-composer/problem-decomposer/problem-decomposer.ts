import * as laml from "@/laml/index.js";
import { LLMCall, LLMCallInput } from "../../base/llm-call.js";
import { ProblemDecomposerInput, ProblemDecomposerOutput } from "./dto.js";
import { prompt } from "./prompt.js";
import { protocol } from "./protocol.js";
import { Context } from "../../base/context.js";

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
  ): Promise<ProblemDecomposerOutput> {
    switch (result.RESPONSE_TYPE) {
      case "STEP_SEQUENCE": {
        const response = result.RESPONSE_STEP_SEQUENCE;
        if (!response) {
          throw new Error(`RESPONSE_CREATE_TASK_CONFIG is missing`);
        }
        this.handleOnUpdate(onUpdate, {
          type: result.RESPONSE_TYPE,
          value: `I've decomposed problem into task's sequence`,
        });
        this.handleOnUpdate(onUpdate, {
          type: result.RESPONSE_TYPE,
          value: laml.listFormatter("numbered")(response.step_sequence),
        });
        return {
          type: "SUCCESS",
          result: response.step_sequence,
        };
      }
      case "UNSOLVABLE": {
        const response = result.RESPONSE_UNSOLVABLE;
        if (!response) {
          throw new Error(`RESPONSE_CREATE_TASK_CONFIG is missing`);
        }
        this.handleOnUpdate(onUpdate, {
          type: result.RESPONSE_TYPE,
          value: `I'm not able to decompose the problem due to: ${response.explanation}`,
        });
        return {
          type: "ERROR",
          explanation: response.explanation,
        };
      }
    }
  }
}
