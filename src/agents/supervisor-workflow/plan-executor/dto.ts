import { z } from "zod";

export const PlanExecutorInputSchema = z.object({
  existingResources: z.array(z.string()),
  availableFunctions: z.array(z.string()),
  plan: z.string(),
});
export type PlanExecutorInput = z.infer<typeof PlanExecutorInputSchema>;

export const PlannerOutputSchema = z.object({
  explanation: z.string(),
  plan: z.array(z.string()),
  raw: z.string(),
});
export type PlanExecutorOutput = z.infer<typeof PlannerOutputSchema>;
