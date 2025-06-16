import * as laml from "@/laml/index.js";
import { ChatModel, Logger } from "beeai-framework";
import {
  Message,
  SystemMessage,
  UserMessage,
} from "beeai-framework/backend/message";

export interface LLMCallInput {
  task: string;
}

export interface LLMCallOutput<TParsed, TOutput> {
  raw: string;
  parsed: TParsed;
  output: TOutput;
}

export abstract class LLMCall<
  P extends laml.Protocol<any>,
  TInput extends LLMCallInput = LLMCallInput,
  TOutput = any,
> {
  protected logger: Logger;
  protected abstract systemPrompt(input: TInput): string;

  constructor(logger: Logger) {
    this.logger = logger.child({
      name: this.constructor.name,
    });
  }

  abstract get protocol(): P;

  async run(
    llm: ChatModel,
    input: TInput,
  ): Promise<LLMCallOutput<laml.ProtocolResult<P>, TOutput>> {
    console.log(input, `run`);

    const messages: Message[] = [
      new SystemMessage(this.systemPrompt(input)),
      new UserMessage(input.task),
    ];

    const resp = await llm.create({
      messages,
    });

    const raw = resp.getTextContent();
    console.log(`### INPUT`);
    console.log(input);
    console.log(`### RESPONSE`);
    console.log(`${raw}\n\n`);
    console.log(`### PARSED`);
    const parsed = this.protocol.parse(raw);
    console.log(`${JSON.stringify(parsed, null, " ")}\n\n`);
    console.log(`### OUTPUT`);
    const output = await this.processResult(parsed, { input });
    console.log(`${JSON.stringify(output, null, " ")}\n\n`);

    return {
      raw,
      parsed,
      output,
    };
  }

  abstract processResult(
    result: laml.ProtocolResult<P>,
    context: { input: TInput },
  ): Promise<TOutput>;
}
