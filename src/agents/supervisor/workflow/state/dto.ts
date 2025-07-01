import { z } from "zod";
import { crossProductEnum } from "@/utils/zod.js";
import {
  RequestHandlerInputSchema,
  RequestHandlerOutputSchema,
} from "../request-handler/dto.js";
import {
  WorkflowComposerInputSchema,
  WorkflowComposerOutputSchema,
} from "../workflow-composer/dto.js";
import {
  TaskConfigInitializerInputSchema,
  TaskConfigInitializerOutputSchema,
} from "../workflow-composer/task-initializer/task-config-initializer/dto.js";
import {
  AgentConfigInitializerInputSchema,
  AgentConfigInitializerOutputSchema,
} from "../workflow-composer/task-initializer/agent-config-initializer/dto.js";
import {
  TaskInitializerInputSchema,
  TaskInitializerOutputSchema,
} from "../workflow-composer/task-initializer/dto.js";
import {
  TaskRunInitializerInputSchema,
  TaskRunInitializerOutputSchema,
} from "../workflow-composer/task-run-initializer/dto.js";
import {
  ProblemDecomposerInputSchema,
  ProblemDecomposerOutputSchema,
} from "../workflow-composer/problem-decomposer/dto.js";
import {
  SupervisorWorkflowInputSchema,
  SupervisorWorkflowOutputSchema,
} from "../dto.js";
import {
  FnErrorResultSchema,
  RetryErrorResultSchema,
} from "../base/retry/dto.js";
import {
  AgentInstructionsBuilderInputSchema,
  AgentInstructionsBuilderOutputSchema,
} from "../workflow-composer/task-initializer/agent-config-initializer/agent-instructions-builder/dto.js";

export const WorkflowNodeKindEnumSchema = z.enum([
  "supervisor_workflow",
  "request_handler",
  "problem_decomposer",
  "workflow_composer",
  "task_initializer",
  "agent_config_initializer",
  "agent_instructions_builder",
  "task_config_initializer",
  "task_run_initializer",
]);

export const WorkflowPhaseKindEnumSchema = z.enum(["start", "end", "error"]);

export const WorkflowNodePhaseKindEnumSchema = crossProductEnum(
  WorkflowNodeKindEnumSchema,
  WorkflowPhaseKindEnumSchema,
);
export type WorkflowNodePhaseKind = z.infer<
  typeof WorkflowNodePhaseKindEnumSchema
>;

export const BaseWorkflowEventSchema = z.object({
  kind: WorkflowNodePhaseKindEnumSchema,
});

export const SupervisorWorkflowStartEventSchema =
  BaseWorkflowEventSchema.extend({
    kind: z.literal(
      WorkflowNodePhaseKindEnumSchema.enum.supervisor_workflow_start,
    ),
    input: SupervisorWorkflowInputSchema.pick({
      prompt: true,
      originTaskRunId: true,
    }),
  });
export type SupervisorWorkflowStartEvent = z.infer<
  typeof SupervisorWorkflowStartEventSchema
>;

export const SupervisorWorkflowEndEventSchema = BaseWorkflowEventSchema.extend({
  kind: z.literal(WorkflowNodePhaseKindEnumSchema.enum.supervisor_workflow_end),
  output: SupervisorWorkflowOutputSchema,
});
export type SupervisorWorkflowEndEvent = z.infer<
  typeof SupervisorWorkflowEndEventSchema
>;

export const RequestHandlerStartEventSchema = BaseWorkflowEventSchema.extend({
  kind: z.literal(WorkflowNodePhaseKindEnumSchema.enum.request_handler_start),
  input: RequestHandlerInputSchema.pick({
    request: true,
  }),
});
export type RequestHandlerStartEvent = z.infer<
  typeof RequestHandlerStartEventSchema
>;

export const RequestHandlerEndEventSchema = BaseWorkflowEventSchema.extend({
  kind: z.literal(WorkflowNodePhaseKindEnumSchema.enum.request_handler_end),
  output: RequestHandlerOutputSchema,
});
export type RequestHandlerEndEvent = z.infer<
  typeof RequestHandlerEndEventSchema
>;

export const RequestHandlerErrorEventSchema = BaseWorkflowEventSchema.extend({
  kind: z.literal(WorkflowNodePhaseKindEnumSchema.enum.request_handler_error),
  output: RetryErrorResultSchema,
});
export type RequestHandlerErrorEvent = z.infer<
  typeof RequestHandlerErrorEventSchema
>;

export const ProblemDecomposerStartEventSchema = BaseWorkflowEventSchema.extend(
  {
    kind: z.literal(
      WorkflowNodePhaseKindEnumSchema.enum.problem_decomposer_start,
    ),
    input: ProblemDecomposerInputSchema.pick({
      request: true,
    }),
  },
);
export type ProblemDecomposerStartEvent = z.infer<
  typeof ProblemDecomposerStartEventSchema
>;

export const ProblemDecomposerEndEventSchema = BaseWorkflowEventSchema.extend({
  kind: z.literal(WorkflowNodePhaseKindEnumSchema.enum.problem_decomposer_end),
  output: ProblemDecomposerOutputSchema,
});
export type ProblemDecomposerEndEvent = z.infer<
  typeof ProblemDecomposerEndEventSchema
>;

export const ProblemDecomposerErrorEventSchema = BaseWorkflowEventSchema.extend(
  {
    kind: z.literal(
      WorkflowNodePhaseKindEnumSchema.enum.problem_decomposer_error,
    ),
    output: RetryErrorResultSchema,
  },
);
export type ProblemDecomposerErrorEvent = z.infer<
  typeof ProblemDecomposerErrorEventSchema
>;

export const WorkflowComposerStartEventSchema = BaseWorkflowEventSchema.extend({
  kind: z.literal(WorkflowNodePhaseKindEnumSchema.enum.workflow_composer_start),
  input: WorkflowComposerInputSchema.pick({
    input: true,
    originTaskRunId: true,
  }),
});
export type WorkflowComposerStartEvent = z.infer<
  typeof WorkflowComposerStartEventSchema
>;

export const WorkflowComposerEndEventSchema = BaseWorkflowEventSchema.extend({
  kind: z.literal(WorkflowNodePhaseKindEnumSchema.enum.workflow_composer_end),
  output: WorkflowComposerOutputSchema,
});
export type WorkflowComposerEndEvent = z.infer<
  typeof WorkflowComposerEndEventSchema
>;

export const WorkflowComposerErrorEventSchema = BaseWorkflowEventSchema.extend({
  kind: z.literal(WorkflowNodePhaseKindEnumSchema.enum.workflow_composer_error),
  output: FnErrorResultSchema,
});
export type WorkflowComposerErrorEvent = z.infer<
  typeof WorkflowComposerErrorEventSchema
>;

export const TaskInitializerStartEventSchema = BaseWorkflowEventSchema.extend({
  kind: z.literal(WorkflowNodePhaseKindEnumSchema.enum.task_initializer_start),
  input: TaskInitializerInputSchema.pick({
    taskStep: true,
  }),
});
export type TaskInitializerStartEvent = z.infer<
  typeof TaskInitializerStartEventSchema
>;

export const TaskInitializerEndEventSchema = BaseWorkflowEventSchema.extend({
  kind: z.literal(WorkflowNodePhaseKindEnumSchema.enum.task_initializer_end),
  output: TaskInitializerOutputSchema.pick({
    taskStep: true,
  }),
});
export type TaskInitializerEndEvent = z.infer<
  typeof TaskInitializerEndEventSchema
>;

export const TaskInitializerErrorEventSchema = BaseWorkflowEventSchema.extend({
  kind: z.literal(WorkflowNodePhaseKindEnumSchema.enum.task_initializer_error),
  output: FnErrorResultSchema,
});
export type TaskInitializerErrorEvent = z.infer<
  typeof TaskInitializerErrorEventSchema
>;

export const AgentConfigInitializerStartEventSchema =
  BaseWorkflowEventSchema.extend({
    kind: z.literal(
      WorkflowNodePhaseKindEnumSchema.enum.agent_config_initializer_start,
    ),
    input: AgentConfigInitializerInputSchema.pick({
      taskStep: true,
      selectOnly: true,
    }),
  });
export type AgentConfigInitializerStartEvent = z.infer<
  typeof AgentConfigInitializerStartEventSchema
>;

export const AgentConfigInitializerEndEventSchema =
  BaseWorkflowEventSchema.extend({
    kind: z.literal(
      WorkflowNodePhaseKindEnumSchema.enum.agent_config_initializer_end,
    ),
    output: AgentConfigInitializerOutputSchema.pick({
      taskStep: true,
    }),
  });
export type AgentConfigInitializerEndEvent = z.infer<
  typeof AgentConfigInitializerEndEventSchema
>;

export const AgentConfigInitializerErrorEventSchema =
  BaseWorkflowEventSchema.extend({
    kind: z.literal(
      WorkflowNodePhaseKindEnumSchema.enum.agent_config_initializer_error,
    ),
    output: RetryErrorResultSchema,
  });
export type AgentConfigInitializerErrorEvent = z.infer<
  typeof AgentConfigInitializerErrorEventSchema
>;

export const AgentInstructionsBuilderStartEventSchema =
  BaseWorkflowEventSchema.extend({
    kind: z.literal(
      WorkflowNodePhaseKindEnumSchema.enum.agent_instructions_builder_start,
    ),
    input: AgentInstructionsBuilderInputSchema.pick({
      taskStep: true,
      agentConfigDraft: true,
    }),
  });
export type AgentInstructionsBuilderStartEvent = z.infer<
  typeof AgentInstructionsBuilderStartEventSchema
>;

export const AgentInstructionsBuilderEndEventSchema =
  BaseWorkflowEventSchema.extend({
    kind: z.literal(
      WorkflowNodePhaseKindEnumSchema.enum.agent_instructions_builder_end,
    ),
    output: AgentInstructionsBuilderOutputSchema,
  });
export type AgentInstructionsBuilderEndEvent = z.infer<
  typeof AgentInstructionsBuilderEndEventSchema
>;

export const AgentInstructionsBuilderErrorEventSchema =
  BaseWorkflowEventSchema.extend({
    kind: z.literal(
      WorkflowNodePhaseKindEnumSchema.enum.agent_instructions_builder_error,
    ),
    output: RetryErrorResultSchema,
  });
export type AgentInstructionsBuilderErrorEvent = z.infer<
  typeof AgentInstructionsBuilderErrorEventSchema
>;

export const TaskConfigInitializerStartEventSchema =
  BaseWorkflowEventSchema.extend({
    kind: z.literal(
      WorkflowNodePhaseKindEnumSchema.enum.task_config_initializer_start,
    ),
    input: TaskConfigInitializerInputSchema.pick({
      taskStep: true,
      actingAgentId: true,
    }),
  });
export type TaskConfigInitializerStartEvent = z.infer<
  typeof TaskConfigInitializerStartEventSchema
>;

export const TaskConfigInitializerEndEventSchema =
  BaseWorkflowEventSchema.extend({
    kind: z.literal(
      WorkflowNodePhaseKindEnumSchema.enum.task_config_initializer_end,
    ),
    output: TaskConfigInitializerOutputSchema.pick({
      taskStep: true,
    }),
  });
export type TaskConfigInitializerEndEvent = z.infer<
  typeof TaskConfigInitializerEndEventSchema
>;

export const TaskConfigInitializerErrorEventSchema =
  BaseWorkflowEventSchema.extend({
    kind: z.literal(
      WorkflowNodePhaseKindEnumSchema.enum.task_config_initializer_error,
    ),
    output: RetryErrorResultSchema,
  });
export type TaskConfigInitializerErrorEvent = z.infer<
  typeof TaskConfigInitializerErrorEventSchema
>;

export const TaskRunInitializerStartEventSchema =
  BaseWorkflowEventSchema.extend({
    kind: z.literal(
      WorkflowNodePhaseKindEnumSchema.enum.task_run_initializer_start,
    ),
    input: TaskRunInitializerInputSchema.pick({
      taskStep: true,
      actingAgentId: true,
      originTaskRunId: true,
    }),
  });
export type TaskRunInitializerStartEvent = z.infer<
  typeof TaskRunInitializerStartEventSchema
>;

export const TaskRunInitializerEndEventSchema = BaseWorkflowEventSchema.extend({
  kind: z.literal(
    WorkflowNodePhaseKindEnumSchema.enum.task_run_initializer_end,
  ),
  output: TaskRunInitializerOutputSchema,
});
export type TaskRunInitializerEndEvent = z.infer<
  typeof TaskRunInitializerEndEventSchema
>;

export const TaskRunInitializerErrorEventSchema =
  BaseWorkflowEventSchema.extend({
    kind: z.literal(
      WorkflowNodePhaseKindEnumSchema.enum.task_run_initializer_error,
    ),
    output: RetryErrorResultSchema,
  });
export type TaskRunInitializerErrorEvent = z.infer<
  typeof TaskRunInitializerErrorEventSchema
>;

export type SupervisorWorkflowEventType =
  | SupervisorWorkflowStartEvent
  | SupervisorWorkflowEndEvent
  | RequestHandlerStartEvent
  | RequestHandlerEndEvent
  | RequestHandlerErrorEvent
  | ProblemDecomposerStartEvent
  | ProblemDecomposerEndEvent
  | ProblemDecomposerErrorEvent
  | WorkflowComposerStartEvent
  | WorkflowComposerEndEvent
  | WorkflowComposerErrorEvent
  | TaskInitializerStartEvent
  | TaskInitializerEndEvent
  | TaskInitializerErrorEvent
  | AgentConfigInitializerStartEvent
  | AgentConfigInitializerEndEvent
  | AgentConfigInitializerErrorEvent
  | AgentInstructionsBuilderStartEvent
  | AgentInstructionsBuilderEndEvent
  | AgentInstructionsBuilderErrorEvent
  | TaskConfigInitializerStartEvent
  | TaskConfigInitializerEndEvent
  | TaskConfigInitializerErrorEvent
  | TaskRunInitializerStartEvent
  | TaskRunInitializerEndEvent
  | TaskRunInitializerErrorEvent;

// Union of all event types with explicit typing
export const SupervisorWorkflowEventTypeSchema: z.ZodType<SupervisorWorkflowEventType> =
  z.discriminatedUnion("kind", [
    SupervisorWorkflowStartEventSchema,
    SupervisorWorkflowEndEventSchema,
    RequestHandlerStartEventSchema,
    RequestHandlerEndEventSchema,
    RequestHandlerErrorEventSchema,
    ProblemDecomposerStartEventSchema,
    ProblemDecomposerEndEventSchema,
    ProblemDecomposerErrorEventSchema,
    WorkflowComposerStartEventSchema,
    WorkflowComposerEndEventSchema,
    WorkflowComposerErrorEventSchema,
    TaskInitializerStartEventSchema,
    TaskInitializerEndEventSchema,
    TaskInitializerErrorEventSchema,
    AgentConfigInitializerStartEventSchema,
    AgentConfigInitializerEndEventSchema,
    AgentConfigInitializerErrorEventSchema,
    AgentInstructionsBuilderStartEventSchema,
    AgentInstructionsBuilderEndEventSchema,
    AgentInstructionsBuilderErrorEventSchema,
    TaskConfigInitializerStartEventSchema,
    TaskConfigInitializerEndEventSchema,
    TaskConfigInitializerErrorEventSchema,
    TaskRunInitializerStartEventSchema,
    TaskRunInitializerEndEventSchema,
    TaskRunInitializerErrorEventSchema,
  ]) as any; // FIXME

// ISSUE: TypeScript is having trouble with the union type here, possibly due to the complexity of the discriminated union.
// error TS2322: Type 'ZodDiscriminatedUnion<"kind", [ZodObject<extendShape<{ kind: ZodEnum<["agent_config_initializer_error" | "agent_config_initializer_start" | "agent_config_initializer_end" | "task_config_initializer_error" | "task_config_initializer_start" | ... 15 more ... | "task_initializer_end", ...("agent_config_initializer_erro...' is not assignable to type 'ZodType<WorkflowStateDataType, ZodTypeDef, WorkflowStateDataType>'.
// Types of property '_input' are incompatible.
//   Type '{ kind: "request_handler_start"; input: { request: string; }; } | { output: { type: "COMPOSE_WORKFLOW" | "CLARIFICATION" | "DIRECT_ANSWER"; response: string; explanation: string; }; kind: "request_handler_end"; } | ... 9 more ... | { ...; }' is not assignable to type 'WorkflowStateDataType'.
//     Type '{ output: ({ status: "ABORTED" | "STOPPED" | "FAILED" | "COMPLETED" | "CREATED" | "SCHEDULED" | "EXECUTING" | "PENDING" | "AWAITING_AGENT"; config: { agentConfigVersion: number; agentKind: "supervisor" | "operator"; ... 13 more ...; maxRepeats?: number | ... 1 more ... | undefined; }; ... 26 more ...; response?: str...' is not assignable to type 'WorkflowStateDataType'.
//       Type '{ output: ({ status: "ABORTED" | "STOPPED" | "FAILED" | "COMPLETED" | "CREATED" | "SCHEDULED" | "EXECUTING" | "PENDING" | "AWAITING_AGENT"; config: { agentConfigVersion: number; agentKind: "supervisor" | "operator"; ... 13 more ...; maxRepeats?: number | ... 1 more ... | undefined; }; ... 26 more ...; response?: str...' is not assignable to type '{ output: ({ status: "ABORTED" | "STOPPED" | "FAILED" | "COMPLETED" | "CREATED" | "SCHEDULED" | "EXECUTING" | "PENDING" | "AWAITING_AGENT"; config: { agentConfigVersion: number; agentKind: "supervisor" | "operator"; ... 13 more ...; maxRepeats?: number | ... 1 more ... | undefined; }; ... 26 more ...; response?: str...'. Two different types with this name exist, but they are unrelated.
//         Types of property 'output' are incompatible.
//           Type '({ status: "ABORTED" | "STOPPED" | "FAILED" | "COMPLETED" | "CREATED" | "SCHEDULED" | "EXECUTING" | "PENDING" | "AWAITING_AGENT"; config: { agentConfigVersion: number; agentKind: "supervisor" | "operator"; ... 13 more ...; maxRepeats?: number | ... 1 more ... | undefined; }; ... 26 more ...; response?: string | unde...' is not assignable to type '({ status: "ABORTED" | "STOPPED" | "FAILED" | "COMPLETED" | "CREATED" | "SCHEDULED" | "EXECUTING" | "PENDING" | "AWAITING_AGENT"; config: { agentConfigVersion: number; agentKind: "supervisor" | "operator"; ... 13 more ...; maxRepeats?: number | ... 1 more ... | undefined; }; ... 26 more ...; response?: string | unde...'. Two different types with this name exist, but they are unrelated.
//             Type '{ status: "ABORTED" | "STOPPED" | "FAILED" | "COMPLETED" | "CREATED" | "SCHEDULED" | "EXECUTING" | "PENDING" | "AWAITING_AGENT"; config: { agentConfigVersion: number; agentKind: "supervisor" | "operator"; ... 13 more ...; maxRepeats?: number | ... 1 more ... | undefined; }; ... 26 more ...; response?: string | undef...' is not assignable to type '{ status: "ABORTED" | "STOPPED" | "FAILED" | "COMPLETED" | "CREATED" | "SCHEDULED" | "EXECUTING" | "PENDING" | "AWAITING_AGENT"; config: { agentConfigVersion: number; agentKind: "supervisor" | "operator"; ... 13 more ...; maxRepeats?: number | ... 1 more ... | undefined; }; ... 26 more ...; response?: string | undef...'. Two different types with this name exist, but they are unrelated.
//               Type '{ status: "ABORTED" | "STOPPED" | "FAILED" | "COMPLETED" | "CREATED" | "SCHEDULED" | "EXECUTING" | "PENDING" | "AWAITING_AGENT"; config: { agentConfigVersion: number; agentKind: "supervisor" | "operator"; ... 13 more ...; maxRepeats?: number | ... 1 more ... | undefined; }; ... 26 more ...; response?: string | undef...' is not assignable to type '{ status: "ABORTED" | "STOPPED" | "FAILED" | "COMPLETED" | "CREATED" | "SCHEDULED" | "EXECUTING" | "PENDING" | "AWAITING_AGENT"; config: { agentConfigVersion: number; agentKind: "supervisor" | "operator"; ... 13 more ...; maxRepeats?: number | ... 1 more ... | undefined; }; ... 26 more ...; response?: string | undef...'. Two different types with this name exist, but they are unrelated.
//                 Type '{ status: "ABORTED" | "STOPPED" | "FAILED" | "COMPLETED" | "CREATED" | "SCHEDULED" | "EXECUTING" | "PENDING" | "AWAITING_AGENT"; config: { agentConfigVersion: number; agentKind: "supervisor" | "operator"; ... 13 more ...; maxRepeats?: number | ... 1 more ... | undefined; }; ... 26 more ...; response?: string | undef...' is not assignable to type '{ status: "ABORTED" | "STOPPED" | "FAILED" | "COMPLETED" | "CREATED" | "SCHEDULED" | "EXECUTING" | "PENDING" | "AWAITING_AGENT"; config: { agentConfigVersion: number; agentKind: "supervisor" | "operator"; ... 13 more ...; maxRepeats?: number | ... 1 more ... | undefined; }; ... 26 more ...; response?: string | undef...'. Two different types with this name exist, but they are unrelated.
//                   Types of property 'currentTrajectory' are incompatible.
//                     Type '{ value: string; agentId: string; timestamp: string | Date; key: string; }[]' is not assignable to type '{ value: string; agentId: string; timestamp: Date; key: string; }[]'.
//                       Type '{ value: string; agentId: string; timestamp: string | Date; key: string; }' is not assignable to type '{ value: string; agentId: string; timestamp: Date; key: string; }'.
//                         Types of property 'timestamp' are incompatible.
//                           Type 'string | Date' is not assignable to type 'Date'.
//                             Type 'string' is not assignable to type 'Date'.
