import { z } from "zod";
import {
  AutomaticTaskRunSchema,
  InteractionTaskRunSchema,
  TaskConfigIdValueSchema,
  TaskConfigPoolStatsSchema,
  TaskConfigSchema,
  TaskRunHistoryEntrySchema,
  TaskRunIdValueSchema,
  TaskRunSchema,
  TaskTypeValueSchema,
} from "../manager/dto.js";

// Base schemas
export const TaskEventKindEnum = z.enum([
  "agent_type_register",
  "task_config_create",
  "task_config_update",
  "task_config_destroy",
  "pool_change",
  "task_run_create",
  "task_run_update",
  "task_run_destroy",
  "history_entry_create",
]);

export const BaseTaskEventSchema = z.object({
  kind: TaskEventKindEnum,
});

// Agent Types Events
export const AgentTypeRegisterEventSchema = BaseTaskEventSchema.extend({
  kind: z.literal(TaskEventKindEnum.enum.agent_type_register),
  agentTypeId: z.string(),
});
export type AgentTypeRegisterEvent = z.infer<
  typeof AgentTypeRegisterEventSchema
>;

// Task Config Events

export const BaseTaskConfigLifecycleEventSchema = BaseTaskEventSchema.extend({
  taskConfigId: TaskConfigIdValueSchema,
  taskType: TaskTypeValueSchema,
});
export type BaseTaskConfigLifecycleEvent = z.infer<
  typeof BaseTaskConfigLifecycleEventSchema
>;

export const TaskConfigCreateEventSchema =
  BaseTaskConfigLifecycleEventSchema.extend({
    kind: z.literal(TaskEventKindEnum.enum.task_config_create),
    config: TaskConfigSchema,
  });
export type TaskConfigCreateEvent = z.infer<typeof TaskConfigCreateEventSchema>;

export const TaskConfigUpdateEventSchema =
  BaseTaskConfigLifecycleEventSchema.extend({
    kind: z.literal(TaskEventKindEnum.enum.task_config_update),
    config: TaskConfigSchema,
  });
export type TaskConfigUpdateEvent = z.infer<typeof TaskConfigUpdateEventSchema>;

export const TaskConfigDestroyEventSchema =
  BaseTaskConfigLifecycleEventSchema.extend({
    kind: z.literal(TaskEventKindEnum.enum.task_config_destroy),
  });
export type TaskConfigDestroyEvent = z.infer<
  typeof TaskConfigDestroyEventSchema
>;

// Task Status Lifecycle Events

export const BaseTaskRunLifecycleEventSchema = BaseTaskEventSchema.extend({
  taskRunId: TaskRunIdValueSchema,
});
export type BaseTaskRunLifecycleEvent = z.infer<
  typeof BaseTaskRunLifecycleEventSchema
>;

export const TaskRunCreateEventSchema = BaseTaskRunLifecycleEventSchema.extend({
  kind: z.literal(TaskEventKindEnum.enum.task_run_create),
  taskConfigId: TaskConfigIdValueSchema,
  taskRun: TaskRunSchema,
});
export type TaskRunCreateEvent = z.infer<typeof TaskRunCreateEventSchema>;

export const TaskRunUpdateEventSchema = BaseTaskRunLifecycleEventSchema.extend({
  kind: z.literal(TaskEventKindEnum.enum.task_run_update),
  taskRun: z.union([
    InteractionTaskRunSchema.omit({ history: true }).partial(),
    AutomaticTaskRunSchema.omit({ history: true }).partial(),
  ]),
});

export type TaskRunUpdateEvent = z.infer<typeof TaskRunUpdateEventSchema>;

export const TaskRunDestroyEventSchema = BaseTaskRunLifecycleEventSchema.extend(
  {
    kind: z.literal(TaskEventKindEnum.enum.task_run_destroy),
  }
);
export type TaskRunDestroyEvent = z.infer<typeof TaskRunDestroyEventSchema>;

// Task History Entry
export const TaskHistoryEntryCreateEventSchema = BaseTaskEventSchema.extend({
  kind: z.literal(TaskEventKindEnum.enum.history_entry_create),
  taskRunId: TaskRunIdValueSchema,
  entry: TaskRunHistoryEntrySchema,
});
export type TaskHistoryEntryCreateEvent = z.infer<
  typeof TaskHistoryEntryCreateEventSchema
>;

// Pool Events
export const TaskPoolChangeEventSchema = BaseTaskEventSchema.extend({
  kind: z.literal(TaskEventKindEnum.enum.pool_change),
  taskTypeId: z.string(),
  poolStats: TaskConfigPoolStatsSchema,
  versions: z.array(z.tuple([z.number(), TaskConfigPoolStatsSchema])),
});
export type TaskPoolChangeEvent = z.infer<typeof TaskPoolChangeEventSchema>;

// Union of all event types
export const TaskStateDataTypeSchema = z.discriminatedUnion("kind", [
  AgentTypeRegisterEventSchema,
  TaskConfigCreateEventSchema,
  TaskConfigUpdateEventSchema,
  TaskConfigDestroyEventSchema,
  TaskRunCreateEventSchema,
  TaskRunUpdateEventSchema,
  TaskRunDestroyEventSchema,
  TaskHistoryEntryCreateEventSchema,
  TaskPoolChangeEventSchema,
]);
export type TaskStateDataType = z.infer<typeof TaskStateDataTypeSchema>;
