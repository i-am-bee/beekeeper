import * as laml from "@/laml/index.js";
import {
  Message,
  SystemMessage,
  UserMessage,
} from "beeai-framework/backend/message";
import { Context } from "./context.js";
import { Runnable } from "./runnable.js";

export interface LLMCallInput<TInput> {
  userMessage: string;
  systemPrompt: TInput;
}

export interface LLMCallOutput<TParsed, TOutput> {
  raw: string;
  parsed: TParsed;
  output: TOutput;
}

export abstract class LLMCall<
  P extends laml.Protocol<any>,
  TInput,
  TOutput = any,
> extends Runnable<
  LLMCallInput<TInput>,
  LLMCallOutput<laml.ProtocolResult<P>, TOutput>
> {
  protected abstract systemPrompt(input: TInput): string;

  abstract get protocol(): P;

  async run(input: LLMCallInput<TInput>, ctx: Context) {
    console.log(input, `run`);

    const { llm } = ctx;

    const messages: Message[] = [
      new SystemMessage(this.systemPrompt(input.systemPrompt)),
      new UserMessage(input.userMessage),
      // new CustomMessage("control", "thinking"),
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
    const output = await this.processResult(parsed, input, ctx);
    console.log(`${JSON.stringify(output, null, " ")}\n\n`);

    return {
      raw,
      parsed,
      output,
    };
  }

  abstract processResult(
    result: laml.ProtocolResult<P>,
    input: LLMCallInput<TInput>,
    ctx: Context,
  ): Promise<TOutput>;
}
