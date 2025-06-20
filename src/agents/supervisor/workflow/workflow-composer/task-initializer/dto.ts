import { z } from "zod";
import { ResourcesSchema } from "../helpers/resources/dto.js";
import { TaskStepSchema } from "../helpers/task-step/dto.js";

export const TaskInitializerInputSchema = z.object({
  resources: ResourcesSchema,
  previousSteps: z.array(TaskStepSchema),
  taskStep: TaskStepSchema,
});
export type TaskInitializerInput = z.infer<typeof TaskInitializerInputSchema>;

export const TaskInitializerOutputSchema = z.object({
  resources: ResourcesSchema,
  taskStep: TaskStepSchema,
});
export type TaskInitializerOutput = z.infer<typeof TaskInitializerOutputSchema>;
