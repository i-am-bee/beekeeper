import { TaskConfigSchema } from "@/tasks/manager/dto.js";
import { z } from "zod";

export const TaskStepAssignedResourceEnumSchema = z.enum([
  "tools",
  "llm",
  "agent",
  "task",
]);
export type TaskStepAssignedResourceEnum = z.infer<
  typeof TaskStepAssignedResourceEnumSchema
>;

export const TaskStepToolsResourceSchema = z.object({
  type: z.literal(TaskStepAssignedResourceEnumSchema.Values.tools),
  tools: z.array(z.string()),
});
export type TaskStepToolsResource = z.infer<typeof TaskStepToolsResourceSchema>;

export const TaskStepLLMResource = z.object({
  type: z.literal(TaskStepAssignedResourceEnumSchema.Values.llm),
});
export type TaskStepLLMResource = z.infer<typeof TaskStepLLMResource>;

export const TaskStepAgentResourceSchema = z.object({
  type: z.literal(TaskStepAssignedResourceEnumSchema.Values.agent),
  agentType: z.string(),
});

export const TaskStepResourceSchema = z.discriminatedUnion("type", [
  TaskStepToolsResourceSchema,
  TaskStepLLMResource,
  TaskStepAgentResourceSchema,
]);
export type TaskStepResource = z.infer<typeof TaskStepResourceSchema>;

export const TaskStepSchema = z.object({
  step: z.string(),
  inputOutput: z.string(),
  resource: TaskStepResourceSchema,
});
export type TaskStep = z.infer<typeof TaskStepSchema>;

export const WorkflowComposerInputSchema = z.object({
  input: z.string(),
});
export type WorkflowComposerInput = z.infer<typeof WorkflowComposerInputSchema>;

export const WorkflowComposerOutputSchema = z.array(TaskConfigSchema);
export type WorkflowComposerOutput = z.infer<
  typeof WorkflowComposerOutputSchema
>;
