import { TaskConfigSchema } from "@/tasks/manager/dto.js";
import { z } from "zod";
import { StepResultSchema } from "../../base/dto.js";

export const TaskInitializerInputSchema = z.object({
  task: z.string(),
});
export type TaskInitializerInput = z.infer<typeof TaskInitializerInputSchema>;

export const TaskInitializerOutputSchema =
  StepResultSchema(TaskConfigSchema);
export type TaskInitializerOutput = z.infer<
  typeof TaskInitializerOutputSchema
>;
