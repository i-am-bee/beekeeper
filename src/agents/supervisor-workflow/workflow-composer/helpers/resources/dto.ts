import { z } from "zod";
import { AgentConfigSchema } from "@/agents/registry/dto.js";
import { TaskConfigSchema, TaskRunSchema } from "@/tasks/manager/dto.js";
import { AgentAvailableToolSchema } from "../../task-initializer/agent-config-initializer/dto.js";

export const ResourcesSchema = z.object({
  tools: z.array(AgentAvailableToolSchema).readonly(),
  agents: z.array(AgentConfigSchema).readonly(),
  tasks: z.array(TaskConfigSchema).readonly(),
  taskRuns: z.array(TaskRunSchema).readonly(),
});
export type Resources = z.infer<typeof ResourcesSchema>;
