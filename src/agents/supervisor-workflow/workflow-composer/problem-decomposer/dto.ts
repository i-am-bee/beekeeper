import { z } from "zod";
import { TaskStepSchema } from "../dto.js";
import {
  AgentAvailableToolSchema,
  AgentConfigMinimalSchema,
} from "../task-initializer/agent-config-initializer/dto.js";

export const ProblemDecomposerInputSchema = z.object({
  availableTools: z.array(AgentAvailableToolSchema),
  existingAgents: z.array(AgentConfigMinimalSchema),
  request: z.string(),
});
export type ProblemDecomposerInput = z.infer<
  typeof ProblemDecomposerInputSchema
>;

export const ProblemDecomposerOutputSchema =
  z.array(TaskStepSchema);
export type ProblemDecomposerOutput = z.infer<
  typeof ProblemDecomposerOutputSchema
>;
