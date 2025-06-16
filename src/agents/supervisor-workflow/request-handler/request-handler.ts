import * as laml from "@/laml/index.js";
import { LLMCall, LLMCallInput } from "../base/llm-call.js";
import { RequestHandlerInput, RequestHandlerOutput } from "./dto.js";
import { prompt } from "./prompt.js";
import { protocol } from "./protocol.js";
import { Context } from "../base/context.js";

export class RequestHandler extends LLMCall<
  typeof protocol,
  RequestHandlerInput,
  RequestHandlerOutput
> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected systemPrompt(input: RequestHandlerInput): string {
    return prompt();
  }
  get protocol() {
    return protocol;
  }
  protected async processResult(
    result: laml.ProtocolResult<typeof protocol>,
    input: LLMCallInput<RequestHandlerInput>,
    { onUpdate }: Context,
  ): Promise<RequestHandlerOutput> {
    let response;
    switch (result.RESPONSE_TYPE) {
      case "DIRECT_ANSWER": {
        response = result.RESPONSE_DIRECT_ANSWER;
        if (!response) {
          throw new Error(`RESPONSE_DIRECT_ANSWER is missing`);
        }
        break;
      }
      case "CLARIFICATION": {
        response = result.RESPONSE_CLARIFICATION;
        if (!response) {
          throw new Error(`RESPONSE_CLARIFICATION is missing`);
        }
        break;
      }
      case "COMPOSE_WORKFLOW": {
        response = result.RESPONSE_COMPOSE_WORKFLOW;
        if (!response) {
          throw new Error(`COMPOSE_WORKFLOW is missing`);
        }
        break;
      }
    }

    const type = result.RESPONSE_TYPE;
    const explanation = result.RESPONSE_CHOICE_EXPLANATION;
    this.handleOnUpdate(onUpdate, { type, value: explanation });
    this.handleOnUpdate(onUpdate, { value: response });

    return {
      type: result.RESPONSE_TYPE,
      explanation,
      response,
    };
  }
}
