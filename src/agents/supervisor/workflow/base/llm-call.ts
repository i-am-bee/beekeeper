import * as laml from "@/laml/index.js";
import {
  AssistantMessage,
  SystemMessage,
  UserMessage,
} from "beeai-framework/backend/message";
import { BaseMemory } from "beeai-framework/memory/base";
import { TokenMemory } from "beeai-framework/memory/tokenMemory";
import { clone } from "remeda";
import { Context } from "./context.js";
import { retry } from "./retry/retry.js";
import { FnResult, FnResultWithPayload, RetryResult } from "./retry/dto.js";
import { Runnable } from "./runnable.js";
import { groundInTime } from "../workflow-composer/helpers/prompt.js";

export interface LLMCallInput<TInput> {
  userMessage: string;
  data: TInput;
  memory?: BaseMemory;
}

export type LLMCallOutput<TParsed, TOutput> = FnResultWithPayload<
  {
    raw: string;
    parsed: TParsed;
    output: TOutput;
  },
  BaseMemory
>;

export type LLMCallRunOutput<TOutput> = RetryResult<TOutput>;

export abstract class LLMCall<
  P extends laml.Protocol<any>,
  TInput,
  TOutput = any,
> extends Runnable<LLMCallInput<TInput>, LLMCallRunOutput<TOutput>> {
  protected abstract systemPrompt(input: TInput): string;

  abstract get protocol(): P;

  protected async _run(
    input: LLMCallInput<TInput>,
    ctx: Context,
  ): Promise<LLMCallRunOutput<TOutput>> {
    const { userMessage: originalUserMessage, data, memory } = input;

    const callLLM = this.callLLM.bind(this);
    const result = await retry<TOutput, BaseMemory>(
      async (
        error,
        attempt,
        payloadIn,
      ): Promise<FnResultWithPayload<TOutput, BaseMemory>> => {
        const userMessage = error?.explanation ?? originalUserMessage;
        this.handleOnUpdate(ctx.onUpdate, {
          type: "run",
          value: `Calling llm (attempt #${attempt})`,
          payload: `>>> ${userMessage}`,
        });

        const { result, payload: payload } = await callLLM(
          {
            userMessage,
            data: clone(data),
            memory: payloadIn || memory,
          },
          ctx,
        );

        if (result.type === "ERROR") {
          return {
            result,
            payload,
          };
        }

        return {
          result: {
            type: "SUCCESS",
            result: result.result.output,
          },
          payload,
        };
      },
    );

    return result;
  }

  async callLLM(
    input: LLMCallInput<TInput>,
    ctx: Context,
  ): Promise<LLMCallOutput<laml.ProtocolResult<P>, TOutput>> {
    this.logger.debug(input, `run`);
    const { llm } = ctx;
    const { userMessage, data } = input;
    let { memory } = input;

    const firstCall = !memory;
    memory =
      memory ||
      new TokenMemory({
        maxTokens: llm.parameters.maxTokens, // optional (default is 128k),
        capacityThreshold: 0.75, // maxTokens*capacityThreshold = threshold where we start removing old messages
        syncThreshold: 0.25, // maxTokens*syncThreshold = threshold where we start to use a real tokenization endpoint instead of guessing the number of tokens
      });

    if (firstCall || !memory.messages.some((m) => m.role === "system")) {
      memory.add(new SystemMessage(groundInTime(this.systemPrompt(data))));
    }
    memory.add(new UserMessage(userMessage));

    const resp = await llm.create({
      messages: [...memory.messages],
      temperature: 0,
    });
    memory.add(new AssistantMessage(resp.getTextContent()));

    const raw = resp.getTextContent();
    try {
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

      if (output.type === "ERROR") {
        return {
          result: {
            type: "ERROR",
            explanation: output.explanation,
            escalation: output.escalation,
          },
          payload: memory,
        };
      }

      return {
        result: {
          type: "SUCCESS",
          result: {
            raw,
            parsed,
            output: output.result,
          },
        },
        payload: memory,
      };
    } catch (error) {
      if (error instanceof laml.ParseError) {
        return {
          result: {
            type: "ERROR",
            explanation: `Failed to parse LLM response: ${error.message}\n\nRaw response: ${raw}`,
          },
          payload: memory,
        };
      }
      // Handle other errors, such as LLM call failures
      this.logger.error(`Error processing LLM call`, error);
      throw new Error(`Failed to process LLM call: ${error}`);
    }
  }

  protected abstract processResult(
    result: laml.ProtocolResult<P>,
    input: LLMCallInput<TInput>,
    ctx: Context,
  ): Promise<FnResult<TOutput>>;
}
