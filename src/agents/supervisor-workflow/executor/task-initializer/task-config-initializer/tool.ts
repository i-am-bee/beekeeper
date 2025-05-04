import {
  TaskConfig,
  TaskConfigSchema,
  AgentKindEnumSchema,
} from "@/agents/registry/dto.js";
import { AgentRegistry } from "@/agents/registry/registry.js";
import { AgentRegistryToolResult } from "@/agents/registry/tool.js";
import { ServiceLocator } from "@/utils/service-locator.js";
import { Tool, JSONToolOutput, ToolEmitter, ToolInput } from "beeai-framework";
import { Emitter } from "beeai-framework/emitter/emitter";
import { z } from "zod";

export const TOOL_NAME = "task_config_creator";

export type AgentRegistryToolResultData = TaskConfig;

export interface TaskConfigCreatorToolResult {
  method: string;
  success: boolean;
  data: AgentRegistryToolResultData;
}

export const CreateTaskConfigSchema = z
  .object({
    method: z.literal("createTaskConfig"),
    agentKind: z.literal(AgentKindEnumSchema.Enum.operator),
    config: TaskConfigSchema.omit({
      agentKind: true,
      taskConfigId: true,
      taskConfigVersion: true,
    }),
  })
  .describe("Create a new agent configuration.");

export const UpdateTaskConfigSchema = z
  .object({
    method: z.literal("updateTaskConfig"),
    agentKind: z.literal(AgentKindEnumSchema.Enum.operator),
    agentType: z.string(),
    config: TaskConfigSchema.partial().pick({
      instructions: true,
      description: true,
      tools: true,
      autoPopulatePool: true,
      maxPoolSize: true,
    }),
  })
  .describe("Update an existing agent configuration.");

export class TaskConfigInitializerTool extends Tool<
  JSONToolOutput<TaskConfigCreatorToolResult>
> {
  name = TOOL_NAME;
  description =
    "The agent config creator tool provides functions to create new or update existing agent configuration.";

  static {
    this.register();
  }

  public readonly emitter: ToolEmitter<
    ToolInput<this>,
    JSONToolOutput<TaskConfigCreatorToolResult>
  > = Emitter.root.child({
    namespace: ["tool", TOOL_NAME],
    creator: this,
  });

  private get agentRegistry() {
    // Weak reference to the agent registry
    return ServiceLocator.getInstance().get(AgentRegistry);
  }

  inputSchema() {
    const schemas = [CreateTaskConfigSchema, UpdateTaskConfigSchema] as const;
    return z.discriminatedUnion("method", schemas);
  }

  protected async _run(input: ToolInput<this>) {
    let data: AgentRegistryToolResultData;
    switch (input.method) {
      case "createTaskConfig":
        data = this.agentRegistry.createTaskConfig({
          ...input.config,
          agentKind: input.agentKind,
        });
        break;
      case "updateTaskConfig":
        data = this.agentRegistry.updateTaskConfig({
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
