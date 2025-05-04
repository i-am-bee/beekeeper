
import {
  AgentAvailableToolSchema,
} from "@/agents/supervisor-workflow/dto.js";
import { TaskConfigSchema } from "@/tasks/manager/dto.js";
import { z } from "zod";

export const ExistingTaskConfigSchema = TaskConfigSchema.pick({
  taskType: true,
  agentType: true,
  taskConfigInput: true,
  description: true,
  
});
export type ExistingTaskConfig = z.infer<typeof ExistingTaskConfigSchema>;

export const TaskConfigInitializerInputSchema = z.object({
  existingConfigs: z.array(ExistingTaskConfigSchema),
  availableTools: z.array(AgentAvailableToolSchema),
  task: z.string(),
});
export type TaskConfigInitializerInput = z.infer<
  typeof TaskConfigInitializerInputSchema
>;

export const TaskConfigInitializerOutputTypeEnumSchema = z.enum([
  "SUCCESS",
  "ERROR",
]);
export type TaskConfigInitializerOutputTypeEnum = z.infer<
  typeof TaskConfigInitializerOutputTypeEnumSchema
>;

export const TaskConfigInitializerOutputSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal(TaskConfigInitializerOutputTypeEnumSchema.Values.SUCCESS),
    taskConfig: ExistingTaskConfigSchema,
  }),
  z.object({
    type: z.literal(TaskConfigInitializerOutputTypeEnumSchema.Values.ERROR),
    explanation: z.string(),
  }),
]);
export type TaskConfigInitializerOutput = z.infer<
  typeof TaskConfigInitializerOutputSchema
>;
