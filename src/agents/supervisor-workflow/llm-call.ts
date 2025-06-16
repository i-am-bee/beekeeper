import * as laml from "@/laml/index.js";
import { ChatModel } from "beeai-framework";
import {
  AssistantMessage,
  Message,
  SystemMessage,
  UserMessage,
} from "beeai-framework/backend/message";

export interface LLMCallInput {
  task: string;
}

export interface LLMCallResult<TParsed> {
  parsed: TParsed;
  message: AssistantMessage;
  raw: string;
}

export abstract class LLMCall<
  P extends laml.Protocol<any>,
  TInput extends LLMCallInput = LLMCallInput,
> {
  protected abstract systemPrompt(input: TInput): string;

  abstract get protocol(): P;

  async run(
    llm: ChatModel,
    input: TInput,
  ): Promise<LLMCallResult<laml.ProtocolResult<P>>> {
    const messages: Message[] = [
      new SystemMessage(this.systemPrompt(input)),
      new UserMessage(input.task),
    ];

    const resp = await llm.create({
      messages,
    });

    const raw = resp.getTextContent();

    console.log(`### INPUT`);
    console.log(`${input.task}\n`);
    console.log(`### RESPONSE`);
    console.log(`${raw}\n\n`);
    const parsed = this.protocol.parse(raw);
    console.log(`${JSON.stringify(parsed, null, " ")}\n\n`);

    return {
      parsed,
      message: new AssistantMessage(raw),
      raw,
    };
  }
}
