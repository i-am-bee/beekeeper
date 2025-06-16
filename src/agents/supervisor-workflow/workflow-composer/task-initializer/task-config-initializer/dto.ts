import { TaskConfigSchema } from "@/tasks/manager/dto.js";
import { z } from "zod";
import { TaskStepSchema } from "../../dto.js";
import { AgentConfigMinimalSchema } from "../agent-config-initializer/dto.js";

export const TaskConfigMinimalSchema = TaskConfigSchema.pick({
  taskType: true,
  agentType: true,
  taskConfigInput: true,
  description: true,
});
export type TaskConfigMinimal = z.infer<typeof TaskConfigMinimalSchema>;

export const TaskConfigInitializerInputSchema = z.object({
  existingTaskConfigs: z.array(TaskConfigMinimalSchema),
  existingAgentConfigs: z.array(AgentConfigMinimalSchema),
  previousSteps: z.array(TaskStepSchema),
  taskStep: TaskStepSchema,
  actingAgentId: z.string(),
});
export type TaskConfigInitializerInput = z.infer<
  typeof TaskConfigInitializerInputSchema
>;

export const TaskConfigInitializerOutputSchema = TaskConfigMinimalSchema;
export type TaskConfigInitializerOutput = z.infer<
  typeof TaskConfigInitializerOutputSchema
>;
