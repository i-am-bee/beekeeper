import { AgentConfigSchema } from "@/agents/registry/dto.js";
import { z } from "zod";
import { ResourcesSchema } from "../../helpers/resources/dto.js";
import { TaskStepSchema } from "../../helpers/task-step/dto.js";

export const AgentAvailableToolSchema = z.object({
  toolName: z.string(),
  description: z.string(),
  toolInput: z.string().optional(),
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
  resources: ResourcesSchema,
  previousSteps: z.array(TaskStepSchema),
  selectOnly: z.boolean().optional(),
  taskStep: TaskStepSchema,
});
export type AgentConfigInitializerInput = z.infer<
  typeof AgentConfigInitializerInputSchema
>;

export const AgentConfigInitializerOutputSchema = z.object({
  resources: ResourcesSchema,
  taskStep: TaskStepSchema,
});

export type AgentConfigInitializerOutput = z.infer<
  typeof AgentConfigInitializerOutputSchema
>;
