import { z } from "zod";
import {
  AssistantWorkflowMessageSchema,
  WorkflowMessageSchema,
} from "../../dto.js";

export const TaskExecutorInputSchema = z.object({
  history: z.array(WorkflowMessageSchema).optional(),
  availableFunctions: z.array(z.string()),
  task: z.string(),
});
export type TaskExecutorInput = z.infer<typeof TaskExecutorInputSchema>;

export const TaskExecutorOutputTypeEnumSchema = z.enum(["SUCCESS", "FAIL"]);
export type TaskExecutorOutputTypeEnum = z.infer<
  typeof TaskExecutorOutputTypeEnumSchema
>;

export const TaskExecutorOutputSchema = z.object({
  type: TaskExecutorOutputTypeEnumSchema,
  explanation: z.string(),
  result: AssistantWorkflowMessageSchema,
  raw: z.string(),
});
export type TaskExecutorOutput = z.infer<typeof TaskExecutorOutputSchema>;
