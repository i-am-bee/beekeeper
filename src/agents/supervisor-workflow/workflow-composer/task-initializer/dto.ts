import { TaskConfigSchema } from "@/tasks/manager/dto.js";
import { z } from "zod";
import { TaskStepSchema } from "../dto.js";

export const TaskInitializerInputSchema = z.object({
  task: z.string(),
});
export type TaskInitializerInput = z.infer<typeof TaskInitializerInputSchema>;

export const TaskInitializerOutputSchema = z.object({
  taskConfig: TaskConfigSchema,
  taskStep: TaskStepSchema,
});
export type TaskInitializerOutput = z.infer<typeof TaskInitializerOutputSchema>;
