import { AgentConfigSchema } from "@/agents/registry/dto.js";
import { z } from "zod";
import { TaskStepSchema } from "../../dto.js";

export const AgentAvailableToolSchema = z.object({
  toolName: z.string(),
  description: z.string(),
});
export type AgentAvailableTool = z.infer<typeof AgentAvailableToolSchema>;

export const AgentConfigMinimalSchema = AgentConfigSchema.pick({
  agentConfigId: true,
  agentConfigVersion: true,
  agentType: true,
  tools: true,
  description: true,
  instructions: true,
});
export type AgentConfigMinimal = z.infer<typeof AgentConfigMinimalSchema>;

export const AgentConfigTinySchema = AgentConfigSchema.pick({
  agentType: true,
  tools: true,
  description: true,
  instructions: true,
});
export type AgentConfigTiny = z.infer<typeof AgentConfigTinySchema>;

export const AgentConfigInitializerInputSchema = z.object({
  existingAgentConfigs: z.array(AgentConfigMinimalSchema),
  previousSteps: z.array(TaskStepSchema),
  availableTools: z.array(AgentAvailableToolSchema),
  task: z.string(),
});
export type AgentConfigInitializerInput = z.infer<
  typeof AgentConfigInitializerInputSchema
>;

export const AgentConfigInitializerOutputSchema = AgentConfigMinimalSchema;
export type AgentConfigInitializerOutput = z.infer<
  typeof AgentConfigInitializerOutputSchema
>;
