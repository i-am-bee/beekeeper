import { AgentIdValue } from "@/agents/registry/dto.js";
import {
  LLMCall,
  LLMCallInput,
} from "@/agents/supervisor-workflow/base/llm-call.js";
import { FnResult } from "@/agents/supervisor-workflow/base/retry/types.js";
import * as laml from "@/laml/index.js";
import { Logger } from "beeai-framework";
import { Context } from "vm";
import {
  AgentInstructionsBuilderInput,
  AgentInstructionsBuilderOutput,
} from "./dto.js";
import { prompt } from "./prompt.js";
import { protocol } from "./protocol.js";

export class AgentInstructionsBuilder extends LLMCall<
  typeof protocol,
  AgentInstructionsBuilderInput,
  AgentInstructionsBuilderOutput
> {
  constructor(logger: Logger, agentId: AgentIdValue) {
    super(logger, agentId);
  }

  protected async processResult(
    result: laml.ProtocolResult<typeof protocol>,
    input: LLMCallInput<AgentInstructionsBuilderInput>,
    ctx: Context,
  ): Promise<FnResult<AgentInstructionsBuilderOutput>> {
    const { onUpdate } = ctx;
    const {
      data: { agentConfigDraft },
    } = input;

    try {
      const response = result.INSTRUCTIONS;
      if (!response) {
        throw new Error(`INSTRUCTIONS are missing`);
      }

      this.handleOnUpdate(onUpdate, {
        value: `Agent's \`${agentConfigDraft.agentType}\` new instructions`,
        payload: response,
      });
      return {
        type: "SUCCESS",
        result: response,
      };
    } catch (err) {
      let explanation;
      if (err instanceof Error) {
        explanation = `Unexpected error \`${err.name}\` when processing agent instructions builder result. The error message: ${err.message}`;
      } else {
        explanation = `Unexpected error \`${String(err)}\` when processing agent instructions builder result.`;
      }

      return {
        type: "ERROR",
        explanation,
      };
    }
  }

  get protocol() {
    return protocol;
  }

  protected systemPrompt(input: AgentInstructionsBuilderInput) {
    return prompt(input);
  }
}
