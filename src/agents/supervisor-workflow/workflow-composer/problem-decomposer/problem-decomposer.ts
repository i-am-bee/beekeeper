import * as laml from "@/laml/index.js";
import { LLMCall } from "../../base/llm-call.js";
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

  async processResult(
    result: laml.ProtocolResult<typeof protocol>,
  ): Promise<ProblemDecomposerOutput> {
    switch (result.RESPONSE_TYPE) {
      case "STEP_SEQUENCE": {
        const response = result.RESPONSE_STEP_SEQUENCE;
        if (!response) {
          throw new Error(`RESPONSE_CREATE_TASK_CONFIG is missing`);
        }
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
        return {
          type: "ERROR",
          explanation: response.explanation,
        };
      }
    }
  }
}
