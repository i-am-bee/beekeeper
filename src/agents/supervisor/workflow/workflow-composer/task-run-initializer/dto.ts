import { AgentIdValueSchema } from "@/agents/registry/dto.js";
import {
  AutomaticTaskRunSchema,
  TaskRunIdValueSchema,
} from "@/tasks/manager/dto.js";
import { z } from "zod";
import { ResourcesSchema } from "../helpers/resources/dto.js";
import { TaskStepSchema } from "../helpers/task-step/dto.js";

export const TaskRunInputSchema = AutomaticTaskRunSchema.pick({
  taskType: true,
  taskRunInput: true,
  taskRunNum: true,
});
export type TaskRunMinimal = z.infer<typeof TaskRunInputSchema>;

export const TaskRunInitializerInputSchema = z.object({
  resources: ResourcesSchema,
  previousSteps: z.array(TaskStepSchema),
  taskStep: TaskStepSchema,
  actingAgentId: AgentIdValueSchema,
  originTaskRunId: TaskRunIdValueSchema,
});
export type TaskRunInitializerInput = z.infer<
  typeof TaskRunInitializerInputSchema
>;

export const TaskRunInitializerOutputSchema = z.object({
  resources: ResourcesSchema,
  taskStep: TaskStepSchema,
});
export type TaskRunInitializerOutput = z.infer<
  typeof TaskRunInitializerOutputSchema
>;
