import { DateStringSchema } from "@/base/dto.js";
import {
  BaseTaskRunSchema,
  TaskRunHistoryEntrySchema,
} from "@/tasks/manager/dto.js";
import { z } from "zod";
import {
  AgentConfigIdValueSchema,
  AgentConfigPoolStatsSchema,
  AgentConfigSchema,
  AgentTypeValueSchema,
  AvailableToolSchema,
} from "../registry/dto.js";

// Base schemas
export const AgentEventKindEnum = z.enum([
  "available_tools_register",
  "agent_config_create",
  "agent_config_update",
  "agent_config_destroy",
  "pool_change",
  "agent_create",
  "agent_acquire",
  "agent_release",
  "agent_destroy",
  "assignment_assign",
  "assignment_unassign",
  "assignment_history_entry",
]);

export const BaseAgentEventSchema = z.object({
  kind: AgentEventKindEnum,
});

// Agent Config Events
export const BaseAgentConfigLifecycleEventSchema = BaseAgentEventSchema.extend({
  agentConfigId: AgentConfigIdValueSchema,
  agentType: AgentTypeValueSchema,
});
export type AgentConfigLifecycleEvent = z.infer<
  typeof BaseAgentConfigLifecycleEventSchema
>;

export const AgentConfigCreateEventSchema =
  BaseAgentConfigLifecycleEventSchema.extend({
    kind: z.literal(AgentEventKindEnum.enum.agent_config_create),
    config: AgentConfigSchema,
  });
export type AgentConfigCreateEvent = z.infer<
  typeof AgentConfigCreateEventSchema
>;

export const AgentConfigUpdateEventSchema =
  BaseAgentConfigLifecycleEventSchema.extend({
    kind: z.literal(AgentEventKindEnum.enum.agent_config_update),
    config: AgentConfigSchema,
  });
export type AgentConfigUpdateEvent = z.infer<
  typeof AgentConfigUpdateEventSchema
>;

export const AgentConfigDestroyEventSchema =
  BaseAgentConfigLifecycleEventSchema.extend({
    kind: z.literal(AgentEventKindEnum.enum.agent_config_destroy),
  });
export type AgentConfigDestroyEvent = z.infer<
  typeof AgentConfigDestroyEventSchema
>;

// Agent Lifecycle Events
export const BaseAgentLifecycleEventSchema = BaseAgentEventSchema.extend({
  agentId: z.string(),
});
export type AgentLifecycleEvent = z.infer<typeof BaseAgentLifecycleEventSchema>;

export const AgentCreateEventSchema = BaseAgentLifecycleEventSchema.extend({
  kind: z.literal(AgentEventKindEnum.enum.agent_create),
  agentConfigId: z.string(),
});
export type AgentCreateEvent = z.infer<typeof AgentCreateEventSchema>;

export const AgentAcquireEventSchema = BaseAgentLifecycleEventSchema.extend({
  kind: z.literal(AgentEventKindEnum.enum.agent_acquire),
});
export type AgentAcquireEvent = z.infer<typeof AgentAcquireEventSchema>;

export const AgentReleaseEventSchema = BaseAgentLifecycleEventSchema.extend({
  kind: z.literal(AgentEventKindEnum.enum.agent_release),
});
export type AgentReleaseEvent = z.infer<typeof AgentReleaseEventSchema>;

export const AgentDestroyEventSchema = BaseAgentLifecycleEventSchema.extend({
  kind: z.literal(AgentEventKindEnum.enum.agent_destroy),
});
export type AgentDestroyEvent = z.infer<typeof AgentDestroyEventSchema>;

// Assignment Events
export const AssignmentKindEnum = z.enum(["task"]);

export const BaseAssignmentEventSchema = BaseAgentEventSchema.extend({
  agentId: z.string(),
  assignmentId: z.string(),
  assignmentKind: AssignmentKindEnum,
});
export type BaseAssignmentEvent = z.infer<typeof BaseAssignmentEventSchema>;

export const AssignedEventSchema = <TAssignment extends z.ZodType>(
  assignmentSchema: TAssignment,
) =>
  BaseAssignmentEventSchema.extend({
    kind: z.literal(AgentEventKindEnum.enum.assignment_assign),
    assignedSince: DateStringSchema,
    assignment: assignmentSchema,
  });
export type AssignedEvent<TAssignment extends z.ZodType> = z.infer<
  ReturnType<typeof AssignedEventSchema<TAssignment>>
>;

export const UnassignedEventSchema = BaseAssignmentEventSchema.extend({
  kind: z.literal(AgentEventKindEnum.enum.assignment_unassign),
  unassignedAt: DateStringSchema,
});
export type UnassignedEvent = z.infer<typeof UnassignedEventSchema>;

export const HistoryEntryCreateEventSchema = <THistoryEntry extends z.ZodType>(
  historyEntrySchema: THistoryEntry,
) =>
  BaseAssignmentEventSchema.extend({
    kind: z.literal(AgentEventKindEnum.enum.assignment_history_entry),
    entry: historyEntrySchema,
  });
export type HistoryEntryCreateEvent<THistoryEntry extends z.ZodType> = z.infer<
  ReturnType<typeof HistoryEntryCreateEventSchema<THistoryEntry>>
>;

// Task-specific Assignment Events
export const TaskAssignedEventSchema = AssignedEventSchema(
  BaseTaskRunSchema,
).extend({
  assignmentKind: z.literal(AssignmentKindEnum.enum.task),
});
export type TaskAssignedEvent = z.infer<typeof TaskAssignedEventSchema>;

export const TaskUnassignedEventSchema = UnassignedEventSchema.extend({
  assignmentKind: z.literal(AssignmentKindEnum.enum.task),
});
export type TaskUnassignedEvent = z.infer<typeof TaskUnassignedEventSchema>;

export const TaskHistoryEntryEventSchema = HistoryEntryCreateEventSchema(
  TaskRunHistoryEntrySchema,
).extend({
  assignmentKind: z.literal(AssignmentKindEnum.enum.task),
});
export type TaskHistoryEntryEvent = z.infer<typeof TaskHistoryEntryEventSchema>;

// Available Tools Events
export const AvailableToolsEventSchema = BaseAgentEventSchema.extend({
  kind: z.literal(AgentEventKindEnum.enum.available_tools_register),
  agentKindId: z.string(),
  availableTools: z.array(AvailableToolSchema),
});
export type AvailableToolsEvent = z.infer<typeof AvailableToolsEventSchema>;

// Pool Events
export const AgentPoolChangeEventSchema = BaseAgentEventSchema.extend({
  kind: z.literal(AgentEventKindEnum.enum.pool_change),
  agentTypeId: z.string(),
  poolStats: AgentConfigPoolStatsSchema,
  versions: z.array(z.tuple([z.number(), AgentConfigPoolStatsSchema])),
});
export type AgentPoolChangeEvent = z.infer<typeof AgentPoolChangeEventSchema>;

// Union of all event types
export const AgentStateDataTypeSchema = z.discriminatedUnion("kind", [
  AvailableToolsEventSchema,
  AgentConfigCreateEventSchema,
  AgentConfigUpdateEventSchema,
  AgentConfigDestroyEventSchema,
  AgentCreateEventSchema,
  AgentAcquireEventSchema,
  AgentReleaseEventSchema,
  AgentDestroyEventSchema,
  AgentPoolChangeEventSchema,
  TaskAssignedEventSchema,
  TaskUnassignedEventSchema,
  TaskHistoryEntryEventSchema,
]);
export type AgentStateDataType = z.infer<typeof AgentStateDataTypeSchema>;
