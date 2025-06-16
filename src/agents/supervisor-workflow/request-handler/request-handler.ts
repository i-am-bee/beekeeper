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
    const type = result.RESPONSE_TYPE;
    const explanation = result.RESPONSE_CHOICE_EXPLANATION;
    switch (result.RESPONSE_TYPE) {
      case "DIRECT_ANSWER": {
        response = result.RESPONSE_DIRECT_ANSWER;
        if (!response) {
          throw new Error(`RESPONSE_DIRECT_ANSWER is missing`);
        }
        this.handleOnUpdate(onUpdate, {
          type,
          value: `There is no need to create a workflow I can answer directly.`,
        });
        break;
      }
      case "CLARIFICATION": {
        response = result.RESPONSE_CLARIFICATION;
        if (!response) {
          throw new Error(`RESPONSE_CLARIFICATION is missing`);
        }
        this.handleOnUpdate(onUpdate, {
          type,
          value: `There is missing some information that need to be clarify.`,
        });
        break;
      }
      case "COMPOSE_WORKFLOW": {
        response = result.RESPONSE_COMPOSE_WORKFLOW;
        if (!response) {
          throw new Error(`COMPOSE_WORKFLOW is missing`);
        }
        this.handleOnUpdate(onUpdate, {
          type,
          value: `I have all information to try to compose workflow`,
        });
        break;
      }
    }

    this.handleOnUpdate(onUpdate, { value: response });

    return {
      type: result.RESPONSE_TYPE,
      explanation,
      response,
    };
  }
}
