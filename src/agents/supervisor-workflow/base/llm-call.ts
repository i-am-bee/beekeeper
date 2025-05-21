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
  data: TInput;
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
    this.logger.debug(input, `run`);
    const { llm } = ctx;

    const messages: Message[] = [
      new SystemMessage(this.systemPrompt(input.data)),
      new UserMessage(input.userMessage),
      // new CustomMessage("control", "thinking"),
    ];

    const resp = await llm.create({
      messages,
    });

    const raw = resp.getTextContent();
    this.logger.debug(`### INPUT`);
    this.logger.debug(input);
    this.logger.debug(`### RESPONSE`);
    this.logger.debug(`${raw}\n\n`);
    this.logger.debug(`### PARSED`);
    const parsed = this.protocol.parse(
      laml.unwrapString(raw.trim(), {
        envelops: [["`", "`"]],
        greedy: true,
      }),
    );
    this.logger.debug(`${JSON.stringify(parsed, null, " ")}\n\n`);
    this.logger.debug(`### OUTPUT`);
    const output = await this.processResult(parsed, input, ctx);
    this.logger.debug(`${JSON.stringify(output, null, " ")}\n\n`);

    return {
      raw,
      parsed,
      output,
    };
  }

  protected abstract processResult(
    result: laml.ProtocolResult<P>,
    input: LLMCallInput<TInput>,
    ctx: Context,
  ): Promise<TOutput>;
}
