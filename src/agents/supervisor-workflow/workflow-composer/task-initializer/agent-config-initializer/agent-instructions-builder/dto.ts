import { z } from "zod";
import { ResourcesSchema } from "../../../helpers/resources/dto.js";
import { TaskStepSchema } from "../../../helpers/task-step/dto.js";
import { AgentConfigTinyDraftSchema } from "../dto.js";

export const AgentInstructionsBuilderInputSchema = z.object({
  resources: ResourcesSchema,
  previousSteps: z.array(TaskStepSchema),
  agentConfigDraft: AgentConfigTinyDraftSchema,
  taskStep: TaskStepSchema,
});
export type AgentInstructionsBuilderInput = z.infer<
  typeof AgentInstructionsBuilderInputSchema
>;

export const AgentInstructionsBuilderOutputSchema = z.string();
export type AgentInstructionsBuilderOutput = z.infer<
  typeof AgentInstructionsBuilderOutputSchema
>;
