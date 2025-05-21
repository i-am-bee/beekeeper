import { TaskConfigSchema } from "@/tasks/manager/dto.js";
import { z } from "zod";
import { StepResultSchema } from "../base/dto.js";

export const WorkflowComposerInputSchema = z.object({
  input: z.string(),
});
export type WorkflowComposerInput = z.infer<typeof WorkflowComposerInputSchema>;

export const WorkflowComposerOutputSchema = StepResultSchema(
  z.array(TaskConfigSchema),
);
export type WorkflowComposerOutput = z.infer<
  typeof WorkflowComposerOutputSchema
>;
