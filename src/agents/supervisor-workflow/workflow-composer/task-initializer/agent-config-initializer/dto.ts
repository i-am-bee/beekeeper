import { AgentConfigSchema } from "@/agents/registry/dto.js";
import { AgentAvailableToolSchema } from "@/agents/supervisor-workflow/dto.js";
import { z } from "zod";

export const ExistingAgentConfigSchema = AgentConfigSchema.pick({
  agentConfigId: true,
  agentConfigVersion: true,
  agentType: true,
  tools: true,
  description: true,
  instructions: true,
});
export type ExistingAgentConfig = z.infer<typeof ExistingAgentConfigSchema>;

export const AgentConfigInitializerInputSchema = z.object({
  existingAgentConfigs: z.array(ExistingAgentConfigSchema),
  availableTools: z.array(AgentAvailableToolSchema),
  task: z.string(),
});
export type AgentConfigInitializerInput = z.infer<
  typeof AgentConfigInitializerInputSchema
>;

export const AgentConfigInitializerOutputTypeEnumSchema = z.enum([
  "SUCCESS",
  "ERROR",
]);
export type AgentConfigInitializerOutputTypeEnum = z.infer<
  typeof AgentConfigInitializerOutputTypeEnumSchema
>;

export const AgentConfigInitializerOutputSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal(AgentConfigInitializerOutputTypeEnumSchema.Values.SUCCESS),
    agentConfig: ExistingAgentConfigSchema,
  }),
  z.object({
    type: z.literal(AgentConfigInitializerOutputTypeEnumSchema.Values.ERROR),
    explanation: z.string(),
  }),
]);
export type AgentConfigInitializerOutput = z.infer<
  typeof AgentConfigInitializerOutputSchema
>;
