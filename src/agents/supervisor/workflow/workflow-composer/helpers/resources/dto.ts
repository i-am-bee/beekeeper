import { AgentConfigSchema } from "@/agents/registry/dto.js";
import { TaskConfigSchema, TaskRunSchema } from "@/tasks/manager/dto.js";
import { z } from "zod";

export const AgentAvailableToolSchema = z.object({
  toolName: z.string(),
  description: z.string(),
  toolInput: z.string().optional(),
});
export type AgentAvailableTool = z.infer<typeof AgentAvailableToolSchema>;

export const ResourcesSchema = z.object({
  tools: z.array(AgentAvailableToolSchema).readonly(),
  agents: z.array(AgentConfigSchema).readonly(),
  tasks: z.array(TaskConfigSchema).readonly(),
  taskRuns: z.array(TaskRunSchema).readonly(),
});
export type Resources = z.infer<typeof ResourcesSchema>;
