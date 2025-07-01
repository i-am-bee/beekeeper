import { BaseStateLogger } from "@/base/state/base-state-logger.js";
import {
  AgentConfigInitializerEndEvent,
  AgentConfigInitializerErrorEvent,
  AgentConfigInitializerStartEvent,
  AgentInstructionsBuilderEndEvent,
  AgentInstructionsBuilderErrorEvent,
  AgentInstructionsBuilderStartEvent,
  ProblemDecomposerEndEvent,
  ProblemDecomposerErrorEvent,
  ProblemDecomposerStartEvent,
  RequestHandlerEndEvent,
  RequestHandlerErrorEvent,
  RequestHandlerStartEvent,
  SupervisorWorkflowEndEvent,
  SupervisorWorkflowStartEvent,
  TaskConfigInitializerEndEvent,
  TaskConfigInitializerErrorEvent,
  TaskConfigInitializerStartEvent,
  TaskInitializerEndEvent,
  TaskInitializerErrorEvent,
  TaskInitializerStartEvent,
  TaskRunInitializerEndEvent,
  TaskRunInitializerErrorEvent,
  TaskRunInitializerStartEvent,
  WorkflowComposerEndEvent,
  WorkflowComposerErrorEvent,
  WorkflowComposerStartEvent,
  WorkflowNodePhaseKindEnumSchema,
  SupervisorWorkflowEventTypeSchema,
} from "./dto.js";
import { pick } from "remeda";

export const DEFAULT_NAME = "workflow_state";
export const DEFAULT_PATH = ["state"] as readonly string[];

export class SupervisorWorkflowStateLogger extends BaseStateLogger<
  typeof SupervisorWorkflowEventTypeSchema
> {
  private static instance?: SupervisorWorkflowStateLogger;

  static init(logPath?: string) {
    if (this.instance) {
      throw new Error(`Workflow state logger is already initialized`);
    }
    this.instance = new SupervisorWorkflowStateLogger(logPath);
    return this.instance;
  }

  static getInstance() {
    if (!this.instance) {
      throw new Error(`Workflow state logger wasn't initialized yet`);
    }
    return this.instance;
  }

  static dispose() {
    if (!this.instance) {
      throw new Error(
        `Workflow state logger doesn't exist, there is nothing to dispose`,
      );
    }
    this.instance = undefined;
  }

  constructor(logPath?: string) {
    super(DEFAULT_PATH, DEFAULT_NAME, logPath);
  }

  public logSupervisorWorkflowStart(
    data: Omit<SupervisorWorkflowStartEvent, "kind">,
  ) {
    this.logUpdate({
      data: {
        kind: WorkflowNodePhaseKindEnumSchema.enum.supervisor_workflow_start,
        ...data,
      },
    });
  }
  public logSupervisorWorkflowEnd(
    data: Omit<SupervisorWorkflowEndEvent, "kind">,
  ) {
    this.logUpdate({
      data: {
        kind: WorkflowNodePhaseKindEnumSchema.enum.supervisor_workflow_end,
        ...data,
      },
    });
  }

  public logRequestHandlerStart(data: Omit<RequestHandlerStartEvent, "kind">) {
    this.logUpdate({
      data: {
        kind: WorkflowNodePhaseKindEnumSchema.enum.request_handler_start,
        ...data,
      },
    });
  }
  public logRequestHandlerEnd(data: Omit<RequestHandlerEndEvent, "kind">) {
    this.logUpdate({
      data: {
        kind: WorkflowNodePhaseKindEnumSchema.enum.request_handler_end,
        ...data,
      },
    });
  }
  public logRequestHandlerError(data: Omit<RequestHandlerErrorEvent, "kind">) {
    this.logUpdate({
      data: {
        kind: WorkflowNodePhaseKindEnumSchema.enum.request_handler_error,
        ...data,
      },
    });
  }
  public logProblemDecomposerStart(
    data: Omit<ProblemDecomposerStartEvent, "kind">,
  ) {
    this.logUpdate({
      data: {
        kind: WorkflowNodePhaseKindEnumSchema.enum.problem_decomposer_start,
        ...data,
      },
    });
  }
  public logProblemDecomposerEnd(
    data: Omit<ProblemDecomposerEndEvent, "kind">,
  ) {
    this.logUpdate({
      data: {
        kind: WorkflowNodePhaseKindEnumSchema.enum.problem_decomposer_end,
        ...data,
      },
    });
  }
  public logProblemDecomposerError(
    data: Omit<ProblemDecomposerErrorEvent, "kind">,
  ) {
    this.logUpdate({
      data: {
        kind: WorkflowNodePhaseKindEnumSchema.enum.problem_decomposer_error,
        ...data,
      },
    });
  }
  public logWorkflowComposerStart(
    data: Omit<WorkflowComposerStartEvent, "kind">,
  ) {
    this.logUpdate({
      data: {
        kind: WorkflowNodePhaseKindEnumSchema.enum.workflow_composer_start,
        ...data,
      },
    });
  }
  public logWorkflowComposerEnd(data: Omit<WorkflowComposerEndEvent, "kind">) {
    this.logUpdate({
      data: {
        kind: WorkflowNodePhaseKindEnumSchema.enum.workflow_composer_end,
        ...data,
      },
    });
  }
  public logWorkflowComposerError(
    data: Omit<WorkflowComposerErrorEvent, "kind">,
  ) {
    this.logUpdate({
      data: {
        kind: WorkflowNodePhaseKindEnumSchema.enum.workflow_composer_error,
        ...data,
      },
    });
  }
  public logTaskInitializerStart(
    data: Omit<TaskInitializerStartEvent, "kind">,
  ) {
    this.logUpdate({
      data: {
        kind: WorkflowNodePhaseKindEnumSchema.enum.task_initializer_start,
        ...data,
      },
    });
  }
  public logTaskInitializerEnd(data: Omit<TaskInitializerEndEvent, "kind">) {
    this.logUpdate({
      data: {
        kind: WorkflowNodePhaseKindEnumSchema.enum.task_initializer_end,
        output: { ...pick(data.output, ["taskStep"]) },
      },
    });
  }
  public logTaskInitializerError(
    data: Omit<TaskInitializerErrorEvent, "kind">,
  ) {
    this.logUpdate({
      data: {
        kind: WorkflowNodePhaseKindEnumSchema.enum.task_initializer_error,
        ...data,
      },
    });
  }
  public logAgentConfigInitializerStart(
    data: Omit<AgentConfigInitializerStartEvent, "kind">,
  ) {
    this.logUpdate({
      data: {
        kind: WorkflowNodePhaseKindEnumSchema.enum
          .agent_config_initializer_start,
        ...data,
      },
    });
  }
  public logAgentConfigInitializerEnd(
    data: Omit<AgentConfigInitializerEndEvent, "kind">,
  ) {
    this.logUpdate({
      data: {
        kind: WorkflowNodePhaseKindEnumSchema.enum.agent_config_initializer_end,
        output: { ...pick(data.output, ["taskStep"]) },
      },
    });
  }
  public logAgentConfigInitializerError(
    data: Omit<AgentConfigInitializerErrorEvent, "kind">,
  ) {
    this.logUpdate({
      data: {
        kind: WorkflowNodePhaseKindEnumSchema.enum
          .agent_config_initializer_error,
        ...data,
      },
    });
  }
  public logAgentInstructionsBuilderStart(
    data: Omit<AgentInstructionsBuilderStartEvent, "kind">,
  ) {
    this.logUpdate({
      data: {
        kind: WorkflowNodePhaseKindEnumSchema.enum
          .agent_instructions_builder_start,
        ...data,
      },
    });
  }
  public logAgentInstructionsBuilderEnd(
    data: Omit<AgentInstructionsBuilderEndEvent, "kind">,
  ) {
    this.logUpdate({
      data: {
        kind: WorkflowNodePhaseKindEnumSchema.enum
          .agent_instructions_builder_end,
        ...data,
      },
    });
  }
  public logAgentInstructionsBuilderError(
    data: Omit<AgentInstructionsBuilderErrorEvent, "kind">,
  ) {
    this.logUpdate({
      data: {
        kind: WorkflowNodePhaseKindEnumSchema.enum
          .agent_instructions_builder_error,
        ...data,
      },
    });
  }
  public logTaskConfigInitializerStart(
    data: Omit<TaskConfigInitializerStartEvent, "kind">,
  ) {
    this.logUpdate({
      data: {
        kind: WorkflowNodePhaseKindEnumSchema.enum
          .task_config_initializer_start,
        ...data,
      },
    });
  }
  public logTaskConfigInitializerEnd(
    data: Omit<TaskConfigInitializerEndEvent, "kind">,
  ) {
    this.logUpdate({
      data: {
        kind: WorkflowNodePhaseKindEnumSchema.enum.task_config_initializer_end,
        output: {...pick(data.output,['taskStep'])},
      },
    });
  }
  public logTaskConfigInitializerError(
    data: Omit<TaskConfigInitializerErrorEvent, "kind">,
  ) {
    this.logUpdate({
      data: {
        kind: WorkflowNodePhaseKindEnumSchema.enum
          .agent_config_initializer_error,
        ...data,
      },
    });
  }
  public logTaskRunInitializerStart(
    data: Omit<TaskRunInitializerStartEvent, "kind">,
  ) {
    this.logUpdate({
      data: {
        kind: WorkflowNodePhaseKindEnumSchema.enum
          .task_config_initializer_start,
        ...data,
      },
    });
  }
  public logTaskRunInitializerEnd(
    data: Omit<TaskRunInitializerEndEvent, "kind">,
  ) {
    this.logUpdate({
      data: {
        kind: WorkflowNodePhaseKindEnumSchema.enum.task_config_initializer_end,
        output: {...pick(data.output,['taskStep'])},
      },
    });
  }
  public logTaskRunInitializerError(
    data: Omit<TaskRunInitializerErrorEvent, "kind">,
  ) {
    this.logUpdate({
      data: {
        kind: WorkflowNodePhaseKindEnumSchema.enum.task_run_initializer_error,
        ...data,
      },
    });
  }
}
