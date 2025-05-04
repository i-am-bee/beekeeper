import { z } from "zod";
import { UserWorkflowMessageSchema } from "../dto.js";

export const ProblemDecomposerInputSchema = z.object({
  message: UserWorkflowMessageSchema,
});
export type ProblemDecomposerInput = z.infer<
  typeof ProblemDecomposerInputSchema
>;

export const ProblemDecomposerOutputTypeEnumSchema = z.enum([
  "STEP_SEQUENCE",
  "UNSOLVABLE",
]);
export type ProblemDecomposerOutputTypeEnum = z.infer<
  typeof ProblemDecomposerOutputTypeEnumSchema
>;

export const ProblemDecomposerOutputSchema = z.object({
  type: ProblemDecomposerOutputTypeEnumSchema,
  explanation: z.string(),
  plan: z.array(z.string()),
  raw: z.string(),
});
export type ProblemDecomposerOutput = z.infer<
  typeof ProblemDecomposerOutputSchema
>;
