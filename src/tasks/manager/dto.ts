import {
  AgentConfigVersionValueSchema,
  AgentIdValueSchema,
  AgentKindEnumSchema,
  AgentTypeValueSchema,
} from "@/agents/registry/dto.js";
import { DateStringSchema } from "@/base/dto.js";
import { z } from "zod";

export const TaskKindEnumSchema = AgentKindEnumSchema.describe(
  "Specifies the kind of a task in the system.  A 'supervisor' kind of tasks are executed by supervisor kind of agents, while a 'operator' handles tasks managed by operators.",
);
export type TaskKindEnum = z.infer<typeof TaskKindEnumSchema>;

export const TaskKindValueSchema = z
  .string()
  .refine(
    (value) =>
      Object.values(TaskKindEnumSchema.enum).includes(value as TaskKindEnum),
    {
      message: `Task kind must be one of: ${Object.values(TaskKindEnumSchema.enum).join(", ")}`,
    },
  )
  .describe(
    "Specifies the kind of a task in the system.  A 'supervisor' kind of tasks are executed by supervisor kind of agents, while a 'operator' handles tasks managed by operators.",
  );
export type TaskKindValue = z.infer<typeof TaskKindValueSchema>;

export const TaskTypeValueSchema = z
  .string()
  .describe("Unique short name of the task type.");
export type TaskTypeValue = z.infer<typeof TaskTypeValueSchema>;

export const TaskRunNumValueSchema = z
  .number()
  .describe("Task run instance number.");
export type TaskRunNumValue = z.infer<typeof TaskRunNumValueSchema>;

export const TaskConfigIdValueSchema = z
  .string()
  .describe(
    "Unique task config id composed of '{taskKind}:{taskType}:{version}' e.g: 'task:poem_generation:1' or 'task:web_scrap:3'",
  );
export type TaskConfigIdValue = z.infer<typeof TaskConfigIdValueSchema>;

export const TaskConfigVersionValueSchema = z
  .number()
  .describe("Task config version number.");
export type TaskConfigVersionValue = z.infer<
  typeof TaskConfigVersionValueSchema
>;

export const TaskConcurrencyModeEnumSchema = z
  .enum(["EXCLUSIVE", "PARALLEL"])
  .describe(
    "Defines whether multiple instances of the task can run simultaneously. EXCLUSIVE allows only one instance to run at a time, while PARALLEL allows multiple concurrent executions",
  );
export type TaskConcurrencyModeEnum = z.infer<
  typeof TaskConcurrencyModeEnumSchema
>;

export const TaskConfigSchema = z
  .object({
    taskKind: TaskKindEnumSchema,
    taskType: TaskTypeValueSchema,
    taskConfigId: TaskConfigIdValueSchema,
    taskConfigVersion: z
      .number()
      .describe("Version number for the task configuration"),
    taskConfigInput: z
      .string()
      .describe(
        "Task config input should serves as a template for task run input for derived task runs.",
      ),
    description: z
      .string()
      .describe("Detail information about the task and its context"),
    intervalMs: z
      .number()
      .describe("Interval between task executions in milliseconds"),
    runImmediately: z
      .boolean()
      .describe("Whether to run the task immediately upon starting"),
    maxRetries: z
      .number()
      .describe(
        "Maximum number of retry attempts if task execution fails. undefined if no retries.",
      )
      .nullish(),
    retryDelayMs: z
      .number()
      .describe("Delay between retry attempts in milliseconds")
      .nullish(),
    ownerAgentId: z
      .string()
      .describe("Identifier of who owns/manages this task"),
    agentKind: AgentKindEnumSchema,
    agentType: AgentTypeValueSchema,
    agentConfigVersion: AgentConfigVersionValueSchema,
    concurrencyMode: TaskConcurrencyModeEnumSchema,
    maxRepeats: z
      .number()
      .describe(
        "Maximum number of times the task can execute. If not set, the task can run indefinitely",
      )
      .nullish(),
  })
  .describe("Represents a periodic task configuration.");

export type TaskConfig = z.infer<typeof TaskConfigSchema>;

export const CreateTaskConfigSchema = TaskConfigSchema.omit({
  taskConfigVersion: true,
  taskConfigId: true,
  ownerAgentId: true,
});
export type CreateTaskConfig = z.infer<typeof CreateTaskConfigSchema>;

export const TaskConfigOwnedResourceSchema = z.object({
  taskConfig: TaskConfigSchema,
  ownerId: z.string(),
});
export type TaskConfigOwnedResource = z.infer<
  typeof TaskConfigOwnedResourceSchema
>;

export const TaskRunTerminalStatusEnumSchema = z.enum([
  "STOPPED",
  "FAILED",
  "COMPLETED",
]);
export type TaskRunTerminalStatusEnum = z.infer<
  typeof TaskRunTerminalStatusEnumSchema
>;

export const TaskRunTrajectoryEntrySchema = z.object({
  timestamp: DateStringSchema,
  agentId: AgentIdValueSchema,
  key: z.string(),
  value: z
    .string()
    .describe(
      "The content of the trajectory entry, containing agent thought processes, tool calls, or execution steps",
    ),
});
export type TaskRunTrajectoryEntry = z.infer<
  typeof TaskRunTrajectoryEntrySchema
>;

export const TaskRunHistoryEntrySchema = z
  .object({
    timestamp: DateStringSchema.describe("When this task execution occurred"),
    terminalStatus: TaskRunTerminalStatusEnumSchema,
    output: z.unknown().describe("Output produced by the task callback"),
    error: z.string().optional().describe("Error message if execution failed"),
    runNumber: z.number().describe("Which run number this was (1-based)"),
    maxRuns: z
      .number()
      .describe(
        "Maximum number of times this task should execute. Undefined means infinite runs.",
      )
      .nullish(),
    retryAttempt: z
      .number()
      .describe("How many retries were needed for this execution"),
    maxRepeats: z
      .number()
      .describe(
        "Maximum number of retry attempts if task execution fails. undefined if no retries.",
      )
      .nullish(),
    agentId: z
      .string()
      .nullable()
      .describe("ID of agent that executed the task, if occupied"),
    trajectory: z.array(TaskRunTrajectoryEntrySchema),
    executionTimeMs: z
      .number()
      .describe("How long the task execution took in milliseconds"),
  })
  .describe("Records details about a single execution of a task");

export type TaskRunHistoryEntry = z.infer<typeof TaskRunHistoryEntrySchema>;

export const TaskRunStatusEnumSchema = z.enum([
  "CREATED",
  "SCHEDULED",
  "EXECUTING",
  "PENDING",
  "AWAITING_AGENT",
  "STOPPED",
  "FAILED",
  "COMPLETED",
]);
export type TaskRunStatusEnum = z.infer<typeof TaskRunStatusEnumSchema>;

export const TaskRunIdValueSchema = z
  .string()
  .describe(
    "Unique task run id composed of '{taskKind}:{taskType}[{instanceNum}]:{version}' e.g: 'task:poem_generation[1]:1' or 'task:web_scrap[2]:3'",
  );
export type TaskRunIdValue = z.infer<typeof TaskRunIdValueSchema>;

export const BaseTaskRunSchema = z
  .object({
    taskKind: TaskKindEnumSchema,
    taskType: TaskTypeValueSchema,
    taskRunId: TaskRunIdValueSchema,
    originTaskRunId: TaskRunIdValueSchema,
    taskRunNum: TaskRunNumValueSchema,
    taskConfigVersion: TaskConfigVersionValueSchema,
    taskRunInput: z
      .string()
      .describe(
        "Input data specific for this task run should follow task config input of the related task config.",
      ),
    config: TaskConfigSchema,
    status: TaskRunStatusEnumSchema.describe("The status of the task."),
    isOccupied: z
      .boolean()
      .describe(
        "Indicates if the task is currently being operated on by an agent",
      ),
    occupiedSince: DateStringSchema.optional()
      .nullable()
      .describe(
        "Timestamp when the task was marked as occupied. undefined if not occupied",
      ),
    startRunAt: DateStringSchema.optional().describe(
      "Timestamp of the execution start.",
    ),
    lastRunAt: DateStringSchema.optional().describe(
      "Timestamp of the last successful execution",
    ),
    nextRunAt: DateStringSchema.optional().describe(
      "Expected timestamp of the next scheduled execution",
    ),
    errorCount: z
      .number()
      .int()
      .describe("Count of consecutive execution failures"),
    currentRetryAttempt: z
      .number()
      .describe(
        "Current retry count. Maximum retries configured via maxRepeats",
      ),
    ownerAgentId: AgentIdValueSchema.describe(
      "ID of the agent who owns/manages this task",
    ),
    currentAgentId: z
      .string()
      .optional()
      .nullable()
      .describe(
        "ID of the agent currently operating on the task. undefined if not occupied",
      ),
    completedRuns: z
      .number()
      .int()
      .describe("Number of times this task has been successfully executed"),
    currentTrajectory: z
      .array(TaskRunTrajectoryEntrySchema)
      .describe(
        "Sequential log of the task execution process, containing entries with agent thought processes, tool calls, and execution steps with their timestamps",
      ),
    history: z
      .array(TaskRunHistoryEntrySchema)
      .describe("History of task executions"),
    maxHistoryEntries: z
      .number()
      .optional()
      .describe(
        "Maximum number of history entries to keep. Undefined means keep all history.",
      ),
    isDependent: z
      .boolean()
      .describe(
        `Indicates if it depends on another task run so then is not possible to start it manually. `,
      ),
    blockedByTaskRunIds: z
      .array(TaskRunIdValueSchema)
      .describe(
        "IDs of task runs that are blocking this task run and will provide its output.",
      ),
    blockingTaskRunIds: z
      .array(TaskRunIdValueSchema)
      .describe(
        "IDs of task runs that are blocked by this task run and will receive its output.",
      ),
  })
  .describe("Represents the current status and execution state of a task");
export type BaseTaskRun = z.infer<typeof BaseTaskRunSchema>;

export const TaskRunKindEnumSchema = z
  .enum(["interaction", "automatic"])
  .describe(
    "Specifies the kind of a task run in the system. An 'interaction' kind of task runs are these that carry the user input and through them is response back. An 'automatic' kind tasks runs are intern.",
  );
export type TaskRunKindEnum = z.infer<typeof TaskRunKindEnumSchema>;

export const InteractionTaskRunStatusEnumSchema = z.enum([
  "PENDING",
  "COMPLETED",
]);
export type InteractionTaskRunStatusEnum = z.infer<
  typeof InteractionTaskRunStatusEnumSchema
>;

export const InteractionTaskRunSchema = BaseTaskRunSchema.extend({
  taskRunKind: z
    .literal(TaskRunKindEnumSchema.enum.interaction)
    .describe(
      "Specifies this as an interaction task run that processes user input and generates responses",
    ),
  interactionStatus: InteractionTaskRunStatusEnumSchema,
  response: z
    .string()
    .optional()
    .describe("The response content that will be sent back to the user"),
});
export type InteractionTaskRun = z.infer<typeof InteractionTaskRunSchema>;

export const AutomaticTaskRunSchema = BaseTaskRunSchema.extend({
  taskRunKind: z
    .literal(TaskRunKindEnumSchema.enum.automatic)
    .describe(
      "Specifies this as an automatic task run for internal system operations",
    ),
});
export type AutomaticTaskRun = z.infer<typeof AutomaticTaskRunSchema>;

export const TaskRunSchema = z.discriminatedUnion("taskRunKind", [
  InteractionTaskRunSchema,
  AutomaticTaskRunSchema,
]);
export type TaskRun = z.infer<typeof TaskRunSchema>;

export const TaskConfigPoolStatsSchema = z
  .object({
    poolSize: z.number(),
    created: z.number(),
    terminated: z.number(),
    completed: z.number(),
    running: z.number(),

    pending: z.number(),
    awaiting_agent: z.number(),
    stopped: z.number(),
    failed: z.number(),
    active: z.number(),
    total: z.number(),
  })
  .describe("Statistics about task runs");
export type TaskConfigPoolStats = z.infer<typeof TaskConfigPoolStatsSchema>;

// Status helpers
const ACTIVE_STATUSES = [
  TaskRunStatusEnumSchema.enum.SCHEDULED,
  TaskRunStatusEnumSchema.enum.PENDING,
  TaskRunStatusEnumSchema.enum.AWAITING_AGENT,
  TaskRunStatusEnumSchema.enum.EXECUTING,
] as const;
type ActiveStatus = (typeof ACTIVE_STATUSES)[number];

export const isTaskRunActiveStatus = (
  status: TaskRunStatusEnum,
): status is ActiveStatus => ACTIVE_STATUSES.includes(status as ActiveStatus);

const TERMINATION_STATUSES = [
  TaskRunStatusEnumSchema.enum.STOPPED,
  TaskRunStatusEnumSchema.enum.FAILED,
  TaskRunStatusEnumSchema.enum.COMPLETED,
] as const;
type TerminationStatus = (typeof TERMINATION_STATUSES)[number];

export const isTaskRunTerminationStatus = (
  status: TaskRunStatusEnum,
): status is TerminationStatus =>
  TERMINATION_STATUSES.includes(status as TerminationStatus);

export const ActingAgentIdValueSchema = AgentIdValueSchema.describe(
  "ID of the agent performing this operation.",
);
export type ActingAgentIdValue = z.infer<typeof ActingAgentIdValueSchema>;
