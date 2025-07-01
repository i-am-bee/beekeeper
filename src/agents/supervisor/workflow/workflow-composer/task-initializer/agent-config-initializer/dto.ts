import { z } from "zod";
import { ResourcesSchema } from "../../helpers/resources/dto.js";
import { AgentConfigSchema } from "@/agents/registry/dto.js";
import { TaskStepSchema } from "../../helpers/task-step/dto.js";

export const AgentConfigTinyDraftSchema = AgentConfigSchema.pick({
  agentType: true,
  tools: true,
  description: true,
});
export type AgentConfigTinyDraft = z.infer<typeof AgentConfigTinyDraftSchema>;

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
