import { AgentConfigSchema } from "@/agents/registry/dto.js";
import { TaskConfigSchema, TaskRunSchema } from "@/tasks/manager/dto.js";
import { z } from "zod";

export const TaskStepAssignedResourceEnumSchema = z.enum([
  "tools",
  "llm",
  "agent",
  "task",
  "task_run",
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
  agent: AgentConfigSchema,
});
export type TaskStepAgentResource = z.infer<typeof TaskStepAgentResourceSchema>;

export const TaskStepTaskResourceSchema = z.object({
  type: z.literal(TaskStepAssignedResourceEnumSchema.Values.task),
  task: TaskConfigSchema,
});
export type TaskStepTaskResource = z.infer<typeof TaskStepTaskResourceSchema>;

export const TaskStepRunResourceSchema = z.object({
  type: z.literal(TaskStepAssignedResourceEnumSchema.Values.task_run),
  taskRun: TaskRunSchema,
});
export type TaskStepRunResource = z.infer<typeof TaskStepRunResourceSchema>;

export const TaskStepResourceSchema = z.discriminatedUnion("type", [
  TaskStepToolsResourceSchema,
  TaskStepLLMResource,
  TaskStepAgentResourceSchema,
  TaskStepTaskResourceSchema,
  TaskStepRunResourceSchema,
]);
export type TaskStepResource = z.infer<typeof TaskStepResourceSchema>;

export const TaskStepInputParameterSchema = z.object({
  value: z.string(),
  assumed: z.boolean().optional(),
  dependencies: z.array(z.number()).optional(),
});
export type TaskStepInputParameter = z.infer<
  typeof TaskStepInputParameterSchema
>;

export const TaskStepSchema = z.object({
  no: z.number(),
  step: z.string(),
  inputs: z.array(TaskStepInputParameterSchema).optional(),
  output: z.string().optional(),
  resource: TaskStepResourceSchema,
  dependencies: z.array(z.number()).optional(),
});
export type TaskStep = z.infer<typeof TaskStepSchema>;
