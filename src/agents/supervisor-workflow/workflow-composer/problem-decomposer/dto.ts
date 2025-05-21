import { z } from "zod";
import { StepResultSchema } from "../../base/dto.js";
import {
  AgentAvailableToolSchema,
  AgentConfigMinimalSchema,
} from "../task-initializer/agent-config-initializer/dto.js";

export const ProblemDecomposerInputSchema = z.object({
  availableTools: z.array(AgentAvailableToolSchema),
  existingAgents: z.array(AgentConfigMinimalSchema),
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
