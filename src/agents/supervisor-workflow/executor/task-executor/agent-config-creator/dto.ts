import { AgentConfigSchema } from "@/agents/registry/dto.js";
import {
  AgentAvailableToolSchema,
  AssistantWorkflowMessageSchema,
  WorkflowMessageSchema,
} from "@/agents/supervisor-workflow/dto.js";
import { z } from "zod";

export const ExistingAgentConfigSchema = AgentConfigSchema.pick({
  agentType: true,
  description: true,
  instructions: true,
  tools: true,
});
export type ExistingAgentConfig = z.infer<typeof ExistingAgentConfigSchema>;

export const AgentConfigCreatorInputSchema = z.object({
  history: z.array(WorkflowMessageSchema).optional(),
  existingConfigs: z.array(ExistingAgentConfigSchema),
  availableTools: z.array(AgentAvailableToolSchema),
  task: z.string(),
});
export type AgentConfigCreatorInput = z.infer<
  typeof AgentConfigCreatorInputSchema
>;

export const AgentConfigCreatorOutputTypeEnumSchema = z.enum([
  "CREATE_AGENT_CONFIG",
  "UPDATE_AGENT_CONFIG",
  "SELECT_AGENT_CONFIG",
  "AGENT_CONFIG_UNAVAILABLE",
]);
export type AgentCreatorOutputTypeEnum = z.infer<
  typeof AgentConfigCreatorOutputTypeEnumSchema
>;

export const AgentConfigCreatorOutputSchema = z.object({
  type: AgentConfigCreatorOutputTypeEnumSchema,
  explanation: z.string(),
  result: AssistantWorkflowMessageSchema,
  raw: z.string(),
});
export type AgentCreatorOutput = z.infer<typeof AgentConfigCreatorOutputSchema>;
