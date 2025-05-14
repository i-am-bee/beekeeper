import { z } from "zod";
import { AssistantWorkflowMessageSchema } from "../dto.js";

export const ExecutorInputSchema = z.object({
  existingResources: z.array(z.string()),
  availableFunctions: z.array(z.string()),
  plan: z.array(z.string()),
});
export type ExecutorInput = z.infer<typeof ExecutorInputSchema>;

export const ExecutorOutputSchema = z.object({
  explanation: z.string(),
  message: AssistantWorkflowMessageSchema,
  raw: z.string(),
});
export type PlanExecutorOutput = z.infer<typeof ExecutorOutputSchema>;
