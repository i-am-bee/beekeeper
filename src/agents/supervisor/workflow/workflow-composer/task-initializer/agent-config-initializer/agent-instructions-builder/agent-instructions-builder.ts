import { AgentIdValue } from "@/agents/registry/dto.js";
import {
  LLMCall,
  LLMCallInput,
  LLMCallRunOutput,
} from "@/agents/supervisor/workflow/base/llm-call.js";
import { FnResult } from "@/agents/supervisor/workflow/base/retry/dto.js";
import * as laml from "@/laml/index.js";
import { Logger } from "beeai-framework";
import { Context } from "vm";
import {
  AgentInstructionsBuilderInput,
  AgentInstructionsBuilderOutput,
} from "./dto.js";
import { prompt } from "./prompt.js";
import { protocol } from "./protocol.js";
import { SupervisorWorkflowStateLogger } from "@/agents/supervisor/workflow/state/logger.js";

export class AgentInstructionsBuilder extends LLMCall<
  typeof protocol,
  AgentInstructionsBuilderInput,
  AgentInstructionsBuilderOutput
> {
  get protocol() {
    return protocol;
  }

  protected systemPrompt(input: AgentInstructionsBuilderInput) {
    return prompt(input);
  }

  async logStateInput(
    {
      data: { taskStep, agentConfigDraft },
    }: LLMCallInput<AgentInstructionsBuilderInput>,
    state: SupervisorWorkflowStateLogger,
  ): Promise<void> {
    await state.logAgentInstructionsBuilderStart({
      input: { taskStep, agentConfigDraft },
    });
  }
  async logStateOutput(
    output: LLMCallRunOutput<AgentInstructionsBuilderOutput>,
    state: SupervisorWorkflowStateLogger,
  ): Promise<void> {
    if (output.type === "ERROR") {
      await state.logAgentInstructionsBuilderError({
        output,
      });
    } else {
      await state.logAgentInstructionsBuilderEnd({
        output: output.result,
      });
    }
  }

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
}
