import { z } from "zod";
import { ResourcesSchema } from "../helpers/resources/dto.js";
import { TaskStepSchema } from "../helpers/task-step/dto.js";

export const ProblemDecomposerInputSchema = z.object({
  resources: ResourcesSchema,
  request: z.string(),
});
export type ProblemDecomposerInput = z.infer<
  typeof ProblemDecomposerInputSchema
>;

export const ProblemDecomposerOutputSchema = z.array(TaskStepSchema);
export type ProblemDecomposerOutput = z.infer<
  typeof ProblemDecomposerOutputSchema
>;
