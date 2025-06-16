import { z } from "zod";
import { StepResultSchema } from "../../base/dto.js";

export const ProblemDecomposerInputSchema = z.object({
  input: z.string(),
});
export type ProblemDecomposerInput = z.infer<
  typeof ProblemDecomposerInputSchema
>;

export const ProblemDecomposerOutputSchema = StepResultSchema(
  z.array(z.string()),
);
export type ProblemDecomposerOutput = z.infer<
  typeof ProblemDecomposerOutputSchema
>;

