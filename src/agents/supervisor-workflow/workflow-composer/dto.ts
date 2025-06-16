import { TaskRunIdValueSchema, TaskRunSchema } from "@/tasks/manager/dto.js";
import { z } from "zod";

export const WorkflowComposerInputSchema = z.object({
  originTaskRunId: TaskRunIdValueSchema,
  input: z.string(),
});
export type WorkflowComposerInput = z.infer<typeof WorkflowComposerInputSchema>;

export const WorkflowComposerOutputSchema = z.array(TaskRunSchema);
export type WorkflowComposerOutput = z.infer<
  typeof WorkflowComposerOutputSchema
>;
