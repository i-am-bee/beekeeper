import {
  AgentConfig,
  AgentConfigSchema,
  AgentKindEnumSchema,
} from "@/agents/registry/dto.js";
import { AgentRegistry } from "@/agents/registry/registry.js";
import { AgentRegistryToolResult } from "@/agents/registry/tool.js";
import { ServiceLocator } from "@/utils/service-locator.js";
import { Tool, JSONToolOutput, ToolEmitter, ToolInput } from "beeai-framework";
import { Emitter } from "beeai-framework/emitter/emitter";
import { z } from "zod";

export const TOOL_NAME = "agent_config_initializer";

export interface AgentConfigInitializerToolResult {
  method: "createAgentConfig" | "updateAgentConfig";
  success: boolean;
  data: AgentConfig;
}

export const CreateAgentConfigSchema = z
  .object({
    method: z.literal("createAgentConfig"),
    agentKind: z.literal(AgentKindEnumSchema.Enum.operator),
    config: AgentConfigSchema.omit({
      agentKind: true,
      agentConfigId: true,
      agentConfigVersion: true,
    }),
  })
  .describe("Create a new agent configuration.");

export const UpdateAgentConfigSchema = z
  .object({
    method: z.literal("updateAgentConfig"),
    agentKind: z.literal(AgentKindEnumSchema.Enum.operator),
    agentType: z.string(),
    config: AgentConfigSchema.partial().pick({
      instructions: true,
      description: true,
      tools: true,
      autoPopulatePool: true,
      maxPoolSize: true,
    }),
  })
  .describe("Update an existing agent configuration.");

export class AgentConfigInitializerTool extends Tool<
  JSONToolOutput<AgentConfigInitializerToolResult>
> {
  name = TOOL_NAME;
  description =
    "The agent config creator tool provides functions to create new or update existing agent configuration.";

  static {
    this.register();
  }

  public readonly emitter: ToolEmitter<
    ToolInput<this>,
    JSONToolOutput<AgentConfigInitializerToolResult>
  > = Emitter.root.child({
    namespace: ["tool", TOOL_NAME],
    creator: this,
  });

  private get agentRegistry() {
    // Weak reference to the agent registry
    return ServiceLocator.getInstance().get(AgentRegistry);
  }

  inputSchema() {
    const schemas = [CreateAgentConfigSchema, UpdateAgentConfigSchema] as const;
    return z.discriminatedUnion("method", schemas);
  }

  protected async _run(input: ToolInput<this>) {
    let data: AgentConfig;
    switch (input.method) {
      case "createAgentConfig":
        data = this.agentRegistry.createAgentConfig({
          ...input.config,
          agentKind: input.agentKind,
        });
        break;
      case "updateAgentConfig":
        data = this.agentRegistry.updateAgentConfig({
          ...input.config,
          agentKind: input.agentKind,
          agentType: input.agentType,
        });
        break;
      default:
        throw new Error(`Undefined method ${JSON.stringify(input)}`);
    }
    return new JSONToolOutput({
      method: input.method,
      success: true,
      data,
    } satisfies AgentRegistryToolResult);
  }
}
