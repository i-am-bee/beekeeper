import { AgentIdValue } from "@/agents/registry/dto.js";
import { Context } from "@/agents/supervisor/workflow/base/context.js";
import {
  LLMCall,
  LLMCallInput,
  LLMCallRunOutput,
} from "@/agents/supervisor/workflow/base/llm-call.js";
import { FnResult } from "@/agents/supervisor/workflow/base/retry/dto.js";
import * as laml from "@/laml/index.js";
import { Logger } from "beeai-framework";
import {
  extendResources,
  replaceAgentByAgentTypeInResources,
} from "../../helpers/resources/utils.js";
import { assignResource } from "../../helpers/task-step/helpers/assign-resource.js";
import {
  AgentConfigInitializerInput,
  AgentConfigInitializerOutput,
  AgentConfigTinyDraft,
} from "./dto.js";
import { prompt } from "./prompt.js";
import { protocol } from "./protocol.js";
import { AgentConfigInitializerTool } from "./tool.js";
import { clone } from "remeda";
import { AgentInstructionsBuilder } from "./agent-instructions-builder/agent-instructions-builder.js";
import { SupervisorWorkflowStateLogger } from "../../../state/logger.js";

/**
 * Purpose of the agent config initializer is to create a new one, or select or update existing agent configuration based on the user prompt.
 */
export class AgentConfigInitializer extends LLMCall<
  typeof protocol,
  AgentConfigInitializerInput,
  AgentConfigInitializerOutput
> {
  protected tool: AgentConfigInitializerTool;
  protected agentInstructionsBuilder: AgentInstructionsBuilder;

  get protocol() {
    return protocol;
  }

  protected systemPrompt(input: AgentConfigInitializerInput) {
    return prompt(input);
  }

  async logStateInput(
    {
      data: { taskStep, selectOnly },
    }: LLMCallInput<AgentConfigInitializerInput>,
    state: SupervisorWorkflowStateLogger,
  ): Promise<void> {
    await state.logAgentConfigInitializerStart({
      input: { taskStep, selectOnly },
    });
  }
  async logStateOutput(
    output: LLMCallRunOutput<AgentConfigInitializerOutput>,
    state: SupervisorWorkflowStateLogger,
  ): Promise<void> {
    if (output.type === "ERROR") {
      await state.logAgentConfigInitializerError({
        output,
      });
    } else {
      await state.logAgentConfigInitializerEnd({
        output: output.result,
      });
    }
  }

  constructor(logger: Logger, agentId: AgentIdValue) {
    super(logger, agentId);
    this.tool = new AgentConfigInitializerTool();
    this.agentInstructionsBuilder = new AgentInstructionsBuilder(
      logger,
      agentId,
    );
  }

  protected async processResult(
    result: laml.ProtocolResult<typeof protocol>,
    input: LLMCallInput<AgentConfigInitializerInput>,
    ctx: Context,
  ): Promise<FnResult<AgentConfigInitializerOutput>> {
    const { onUpdate } = ctx;
    const {
      data: { resources, taskStep, previousSteps },
    } = input;
    const { tools: availableTools, agents: existingAgentConfigs } = resources;

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
      switch (result.RESPONSE_TYPE) {
        case "CREATE_AGENT_CONFIG": {
          const response = result.RESPONSE_CREATE_AGENT_CONFIG;
          if (!response) {
            throw new Error(`RESPONSE_CREATE_AGENT_CONFIG is missing`);
          }

          const agentConfigDraft = {
            agentType: response.agent_type,
            description: response.description,
            tools: response.tools || [],
          } satisfies AgentConfigTinyDraft;

          if (
            resources.agents.find(
              (a) => a.agentType === agentConfigDraft.agentType,
            )
          ) {
            return {
              type: "ERROR",
              explanation: `Agent config \`${agentConfigDraft.agentType}\` already exists. Please create a different agent type, update the existing one or just select it.`,
            };
          }

          this.handleOnUpdate(onUpdate, {
            type: result.RESPONSE_TYPE,
            value: `I'm going to create a brand new agent config \`${agentConfigDraft.agentType}\``,
            payload: { toJson: agentConfigDraft },
          });

          const missingTools = getMissingTools(agentConfigDraft.tools);

          if (missingTools.length > 0) {
            const explanation = `The response contains the following issues:${laml.listFormatter("numbered")([`Can't create agent config \`${agentConfigDraft.agentType}\` because it references non-existent tool(s): \`${missingTools.join(", ")}\``], "")}
\nAvailable resources that can be used:
- Tools: ${availableTools.map((t) => t.toolName).join(", ")}

Please address these issues and provide the corrected response:`;
            return {
              type: "ERROR",
              explanation,
            };
          }

          const instructionsBuilderResponse =
            await this.agentInstructionsBuilder.run(
              {
                data: {
                  previousSteps,
                  resources,
                  agentConfigDraft,
                  taskStep,
                },
                userMessage: taskStep.step,
              },
              ctx,
            );

          if (instructionsBuilderResponse.type === "ERROR") {
            return {
              type: "ERROR",
              explanation: `Failed to build agent instructions: ${instructionsBuilderResponse.explanation}`,
              escalation: true,
            };
          }
          const { result: instructions } = instructionsBuilderResponse;

          const toolCallResult = await this.tool.run({
            method: "createAgentConfig",
            agentKind: "operator",
            config: {
              agentType: response.agent_type,
              description: response.description,
              instructions,
              tools: response.tools || [],
              autoPopulatePool: true,
              maxPoolSize: 5,
            },
          });

          const {
            result: { data: agent },
          } = toolCallResult;

          return {
            type: "SUCCESS",
            result: {
              resources: extendResources(resources, {
                agents: [agent],
              }),
              taskStep: assignResource(taskStep, {
                type: "agent",
                agent,
              }),
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
          const existingAgentConfig = resources.agents.find(
            (a) => a.agentType === response.agent_type,
          )!;

          const missingTools = getMissingTools(config.tools);
          if (missingTools.length > 0) {
            return {
              type: "ERROR",
              explanation: `Can't update agent config \`${response.agent_type}\` because it references non-existent tool(s): \`${missingTools.join(", ")}\`. Available tools: \`${availableTools.map((t) => t.toolName).join(", ")}\`.`,
            };
          }

          const agentConfigDraft = {
            agentType: response.agent_type,
            description:
              response.description || existingAgentConfig.description,
            tools: response.tools || existingAgentConfig.tools,
          } satisfies AgentConfigTinyDraft;

          const instructionsBuilderResponse =
            await this.agentInstructionsBuilder.run(
              {
                data: {
                  previousSteps,
                  resources,
                  agentConfigDraft,
                  taskStep,
                },
                userMessage: taskStep.step,
              },
              ctx,
            );

          if (instructionsBuilderResponse.type === "ERROR") {
            return {
              type: "ERROR",
              explanation: `Failed to build agent instructions: ${instructionsBuilderResponse.explanation}`,
              escalation: true,
            };
          }
          const { result: instructions } = instructionsBuilderResponse;

          const toolCallResult = await this.tool.run({
            method: "updateAgentConfig",
            agentKind: "operator",
            agentType: response.agent_type,
            config: { ...config, instructions },
          });

          const {
            result: { data: agent },
          } = toolCallResult;

          return {
            type: "SUCCESS",
            result: {
              resources: replaceAgentByAgentTypeInResources(resources, agent),
              taskStep: assignResource(taskStep, {
                type: "agent",
                agent,
              }),
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

          const selected = existingAgentConfigs.find(
            (c) => c.agentType === response.agent_type,
          );

          if (!selected) {
            return {
              type: "ERROR",
              explanation: `Can't find selected agent config \`${response.agent_type}\` between existing \`${existingAgentConfigs.map((c) => c.agentType).join(",")}\``,
            };
          }

          return {
            type: "SUCCESS",
            result: {
              resources: clone(resources),
              taskStep: assignResource(taskStep, {
                type: "agent",
                agent: selected,
              }),
            },
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
}
