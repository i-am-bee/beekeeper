import { AgentIdValue } from "@/agents/registry/dto.js";
import { Context } from "@/agents/supervisor-workflow/base/context.js";
import {
  LLMCall,
  LLMCallInput,
} from "@/agents/supervisor-workflow/base/llm-call.js";
import { FnResult } from "@/agents/supervisor-workflow/base/retry/types.js";
import * as laml from "@/laml/index.js";
import { Logger } from "beeai-framework";
import { clone } from "remeda";
import {
  AgentConfigInitializerInput,
  AgentConfigInitializerOutput,
} from "./dto.js";
import { prompt } from "./prompt.js";
import { protocol } from "./protocol.js";
import { AgentConfigInitializerTool } from "./tool.js";

/**
 * Purpose of the agent config initializer is to create a new one, or select or update existing agent configuration based on the user prompt.
 */
export class AgentConfigInitializer extends LLMCall<
  typeof protocol,
  AgentConfigInitializerInput,
  AgentConfigInitializerOutput
> {
  protected tool: AgentConfigInitializerTool;

  constructor(logger: Logger, agentId: AgentIdValue) {
    super(logger, agentId);
    this.tool = new AgentConfigInitializerTool();
  }

  protected async processResult(
    result: laml.ProtocolResult<typeof protocol>,
    input: LLMCallInput<AgentConfigInitializerInput>,
    ctx: Context,
  ): Promise<FnResult<AgentConfigInitializerOutput>> {
    const { onUpdate } = ctx;
    const {
      data: { availableTools, existingAgentConfigs },
    } = input;

    const getMissingTools = (tools?: string[]) => {
      return (tools || []).filter(
        (tool) => !availableTools.find((t) => t.toolName === tool),
      );
    };
    const getMissingAgentTypes = (agentTypes: string | string[]) => {
      return (
        typeof agentTypes === "string" ? [agentTypes] : agentTypes
      ).filter(
        (agentType) =>
          !existingAgentConfigs.find((c) => c.agentType === agentType),
      );
    };

    try {
      let toolCallResult;
      switch (result.RESPONSE_TYPE) {
        case "CREATE_AGENT_CONFIG": {
          const response = result.RESPONSE_CREATE_AGENT_CONFIG;
          if (!response) {
            throw new Error(`RESPONSE_CREATE_AGENT_CONFIG is missing`);
          }

          const config = {
            agentType: response.agent_type,
            description: response.description,
            instructions: response.instructions,
            tools: response.tools,
          };

          this.handleOnUpdate(onUpdate, {
            type: result.RESPONSE_TYPE,
            value: `I'm going to create a brand new agent config \`${config.agentType}\``,
            payload: { toJson: config },
          });

          const missingTools = getMissingTools(config.tools);
          
          if (missingTools.length > 0) {

          const explanation = `The response contains the following issues:${laml.listFormatter("numbered")([`Can't create agent config \`${config.agentType}\` because it references non-existent tool(s): \`${missingTools.join(", ")}\``], "")}
\nAvailable resources that can be used:
- Tools: ${availableTools.map((t) => t.toolName).join(", ")}

Please address these issues and provide the corrected response:`;
            return {
              type: "ERROR",
              explanation,  // `Can't create agent config \`${config.agentType}\` because it references non-existent tool(s): \`${missingTools.join(", ")}\`. Available tools: \`${availableTools.map((t) => t.toolName).join(", ")}\`.`,
              
            };
          }

          toolCallResult = await this.tool.run({
            method: "createAgentConfig",
            agentKind: "operator",
            config,
          });
          return {
            type: "SUCCESS",
            result: {
              agentType: toolCallResult.result.data.agentType,
              description: toolCallResult.result.data.description,
              instructions: toolCallResult.result.data.instructions,
              tools: clone(toolCallResult.result.data.tools),
              agentConfigId: toolCallResult.result.data.agentConfigId,
              agentConfigVersion: toolCallResult.result.data.agentConfigVersion,
            },
          };
        }
        case "UPDATE_AGENT_CONFIG": {
          const response = result.RESPONSE_UPDATE_AGENT_CONFIG;
          if (!response) {
            throw new Error(`RESPONSE_UPDATE_AGENT_CONFIG is missing`);
          }

          const config = {
            description: response.description,
            instructions: response.instructions,
            tools: response.tools,
          };

          this.handleOnUpdate(onUpdate, {
            type: result.RESPONSE_TYPE,
            value: `I'm going to update an existing agent config \`${response.agent_type}\``,
            payload: { toJson: config },
          });

          const missingAgentTypes = getMissingAgentTypes(response.agent_type);
          if (missingAgentTypes.length > 0) {
            return {
              type: "ERROR",
              explanation: `Can't update agent config \`${response.agent_type}\` because it is not available. Available agent types: \`${existingAgentConfigs.map((c) => c.agentType).join(", ")}\`.`,
            };
          }

          const missingTools = getMissingTools(config.tools);
          if (missingTools.length > 0) {
            return {
              type: "ERROR",
              explanation: `Can't update agent config \`${response.agent_type}\` because it references non-existent tool(s): \`${missingTools.join(", ")}\`. Available tools: \`${availableTools.map((t) => t.toolName).join(", ")}\`.`,
            };
          }

          toolCallResult = await this.tool.run({
            method: "updateAgentConfig",
            agentKind: "operator",
            agentType: response.agent_type,
            config,
          });
          return {
            type: "SUCCESS",
            result: {
              agentType: toolCallResult.result.data.agentType,
              description: toolCallResult.result.data.description,
              instructions: toolCallResult.result.data.instructions,
              tools: clone(toolCallResult.result.data.tools),
              agentConfigId: toolCallResult.result.data.agentConfigId,
              agentConfigVersion: toolCallResult.result.data.agentConfigVersion,
            },
          };
        }
        case "SELECT_AGENT_CONFIG": {
          const response = result.RESPONSE_SELECT_AGENT_CONFIG;
          if (!response) {
            throw new Error(`RESPONSE_SELECT_AGENT_CONFIG is missing`);
          }

          this.handleOnUpdate(onUpdate, {
            type: result.RESPONSE_TYPE,
            value: `I'm going to pick an existing agent config \`${response.agent_type}\``,
          });

          const missingAgentTypes = getMissingAgentTypes(response.agent_type);
          if (missingAgentTypes.length > 0) {
            return {
              type: "ERROR",
              explanation: `Can't select agent config \`${response.agent_type}\` because it is not available. Available agent types: \`${existingAgentConfigs.map((c) => c.agentType).join(", ")}\`.`,
            };
          }

          const selected = input.data.existingAgentConfigs.find(
            (c) => c.agentType === response.agent_type,
          );

          if (!selected) {
            return {
              type: "ERROR",
              explanation: `Can't find selected agent config \`${response.agent_type}\` between existing \`${input.data.existingAgentConfigs.map((c) => c.agentType).join(",")}\``,
            };
          }

          return {
            type: "SUCCESS",
            result: clone(selected),
          };
        }

        case "AGENT_CONFIG_UNAVAILABLE": {
          const response = result.RESPONSE_AGENT_CONFIG_UNAVAILABLE;
          if (!response) {
            throw new Error(`RESPONSE_AGENT_CONFIG_UNAVAILABLE is missing`);
          }

          this.handleOnUpdate(onUpdate, {
            type: result.RESPONSE_TYPE,
            value: `There is no suitable agent config`,
          });

          return {
            type: "ERROR",
            explanation: response.explanation,
          };
        }
      }
    } catch (err) {
      let explanation;
      if (err instanceof Error) {
        explanation = `Unexpected error \`${err.name}\` when processing agent config initializer result. The error message: ${err.message}`;
      } else {
        explanation = `Unexpected error \`${String(err)}\` when processing agent config initializer result.`;
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

  protected systemPrompt(input: AgentConfigInitializerInput) {
    return prompt(input);
  }
}
