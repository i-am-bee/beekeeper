import { TaskConfigSchema } from "@/tasks/manager/dto.js";
import { z } from "zod";
import { ResourcesSchema } from "../../helpers/resources/dto.js";
import { TaskStepSchema } from "../../helpers/task-step/dto.js";

export const TaskConfigMinimalSchema = TaskConfigSchema.pick({
  taskType: true,
  agentType: true,
  taskConfigInput: true,
  description: true,
});
export type TaskConfigMinimal = z.infer<typeof TaskConfigMinimalSchema>;

export const TaskConfigInitializerInputSchema = z.object({
  resources: ResourcesSchema,
  previousSteps: z.array(TaskStepSchema),
  taskStep: TaskStepSchema,
  actingAgentId: z.string(),
});
export type TaskConfigInitializerInput = z.infer<
  typeof TaskConfigInitializerInputSchema
>;

export const TaskConfigInitializerOutputSchema = z.object({
  resources: ResourcesSchema,
  taskStep: TaskStepSchema,
});
export type TaskConfigInitializerOutput = z.infer<
  typeof TaskConfigInitializerOutputSchema
>;
