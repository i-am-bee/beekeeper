import { BaseStateBuilder } from "@/base/state/base-state-builder.js";
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
  TaskRunInitializerEndEvent,
  TaskRunInitializerErrorEvent,
  TaskRunInitializerStartEvent,
  SupervisorWorkflowEventType,
  SupervisorWorkflowEventTypeSchema,
} from "./dto.js";

// Define update types as const to ensure type safety
export const StateUpdateType = {
  SUPERVISOR_WORKFLOW_RUN: "supervisor_workflow_run",
  REQUEST_HANDLER: "request_handler",
  WORKFLOW_COMPOSER: "workflow_composer",
  PROBLEM_DECOMPOSER: "problem_decomposer",
  TASK_STEP: "task_step",
} as const;

// Define the type for the update types
export type StateUpdateType =
  (typeof StateUpdateType)[keyof typeof StateUpdateType];

export interface NodeState<TInput = unknown, TOutput = unknown> {
  input?: TInput;
  output?: TOutput;
}

export interface NodeStateWithError<
  TInput = unknown,
  TOutput = unknown,
  TError = unknown,
> extends NodeState<TInput, TOutput> {
  errors?: TError[];
}

export interface TaskStepState {
  agent_config_initializer?: NodeStateWithError<
    AgentConfigInitializerStartEvent,
    AgentConfigInitializerEndEvent,
    AgentConfigInitializerErrorEvent
  > & {
    agent_instructions_builder?: NodeStateWithError<
      AgentInstructionsBuilderStartEvent,
      AgentInstructionsBuilderEndEvent,
      AgentInstructionsBuilderErrorEvent
    >;
  };
  task_config_initializer?: NodeStateWithError<
    TaskConfigInitializerStartEvent,
    TaskConfigInitializerEndEvent,
    TaskConfigInitializerErrorEvent
  >;
  task_run_initializer?: NodeStateWithError<
    TaskRunInitializerStartEvent,
    TaskRunInitializerEndEvent,
    TaskRunInitializerErrorEvent
  >;
}

export type SupervisorWorkflowRunState = NodeState<
  SupervisorWorkflowStartEvent,
  SupervisorWorkflowEndEvent
> & {
  request_handler?: NodeStateWithError<
    RequestHandlerStartEvent,
    RequestHandlerEndEvent,
    RequestHandlerErrorEvent
  >;
  problem_decomposer?: NodeStateWithError<
    ProblemDecomposerStartEvent,
    ProblemDecomposerEndEvent,
    ProblemDecomposerErrorEvent
  >;
  task_steps?: TaskStepState[];
};

export interface SupervisorWorkflowState {
  runs: SupervisorWorkflowRunState[];
  currentRunIndex?: number;
  currentRun?: SupervisorWorkflowRunState;
  currentStepIndex?: number;
  currentStep?: TaskStepState;
}

function assertCurrentRun(
  state: SupervisorWorkflowState,
): asserts state is SupervisorWorkflowState & {
  currentRun: SupervisorWorkflowRunState;
  currentRunIndex: number;
} {
  if (state.currentRunIndex === undefined) {
    throw new Error("Current run index is not set");
  }
  if (!state.runs[state.currentRunIndex]) {
    throw new Error("Current run does not exist");
  }
  state.currentRun = state.runs[state.currentRunIndex];
}

function assertCurrentStep(
  state: SupervisorWorkflowState,
): asserts state is SupervisorWorkflowState & {
  currentStep: TaskStepState;
  currentStepIndex: number;
} {
  assertCurrentRun(state);
  if (state.currentStepIndex === undefined) {
    throw new Error("Current step index is not set");
  }
  if (
    !state.currentRun.task_steps ||
    !state.currentRun.task_steps[state.currentStepIndex]
  ) {
    throw new Error("Current step does not exist");
  }
  state.currentStep = state.currentRun.task_steps[state.currentStepIndex];
}

export class SupervisorWorkflowStateBuilder extends BaseStateBuilder<
  typeof SupervisorWorkflowEventTypeSchema,
  SupervisorWorkflowState
> {
  constructor() {
    super(SupervisorWorkflowEventTypeSchema, { runs: [] });
  }

  protected processStateUpdate(data: SupervisorWorkflowEventType): void {
    switch (data.kind) {
      case "supervisor_workflow_start":
        this.state.runs.push({
          input: data,
          task_steps: [],
        });
        this.state.currentRunIndex = this.state.runs.length - 1;
        this.state.currentRun = this.state.runs[this.state.currentRunIndex];
        this.state.currentStepIndex = undefined;
        this.state.currentStep = undefined
        this.emit("state:updated", {
          type: StateUpdateType.SUPERVISOR_WORKFLOW_RUN,
          ids: [String(this.state.currentRunIndex)],
        });
        break;
      case "supervisor_workflow_end":        
        this.emit("state:updated", {
          type: StateUpdateType.SUPERVISOR_WORKFLOW_RUN,
          ids: [],
        });
        break;
      case "request_handler_start":
        assertCurrentRun(this.state);
        this.state.currentRun.request_handler = {
          input: data,
        };
        this.emit("state:updated", {
          type: StateUpdateType.REQUEST_HANDLER,
          ids: [String(this.state.currentRunIndex)],
        });
        break;
      case "request_handler_end":
        assertCurrentRun(this.state);
        this.state.currentRun.request_handler = {
          ...this.state.currentRun.request_handler,
          output: data,
        };
        this.emit("state:updated", {
          type: StateUpdateType.REQUEST_HANDLER,
          ids: [String(this.state.currentRunIndex)],
        });
        break;
      case "request_handler_error":
        assertCurrentRun(this.state);
        this.state.currentRun.request_handler = {
          ...this.state.currentRun.request_handler,
          errors: (this.state.currentRun.request_handler?.errors || []).concat(
            data,
          ),
        };
        this.emit("state:updated", {
          type: StateUpdateType.REQUEST_HANDLER,
          ids: [String(this.state.currentRunIndex)],
        });
        break;
      case "workflow_composer_start":
        // SKIP
        break;
      case "workflow_composer_end":
        // SKIP
        break;
      case "workflow_composer_error":
        // SKIP
        break;
      case "problem_decomposer_start":
        assertCurrentRun(this.state);
        this.state.currentRun.problem_decomposer = {
          input: this.state.currentRun.problem_decomposer?.input,
        };
        this.emit("state:updated", {
          type: StateUpdateType.PROBLEM_DECOMPOSER,
          ids: [String(this.state.currentRunIndex)],
        });
        break;
      case "problem_decomposer_end":
        assertCurrentRun(this.state);
        this.state.currentRun.problem_decomposer = {
          ...this.state.currentRun.problem_decomposer,
          output: data,
        };
        this.state.currentStep;
        this.emit("state:updated", {
          type: StateUpdateType.PROBLEM_DECOMPOSER,
          ids: [String(this.state.currentRunIndex)],
        });
        break;
      case "problem_decomposer_error":
        assertCurrentRun(this.state);
        this.state.currentRun.problem_decomposer = {
          ...this.state.currentRun.problem_decomposer,
          errors: (
            this.state.currentRun.problem_decomposer?.errors || []
          ).concat(data),
        };
        this.emit("state:updated", {
          type: StateUpdateType.PROBLEM_DECOMPOSER,
          ids: [String(this.state.currentRunIndex)],
        });
        break;
      case "task_initializer_start": {
        assertCurrentRun(this.state);
        this.state.currentRun.task_steps = (
          this.state.currentRun.task_steps || []
        ).concat({});
        this.state.currentStepIndex = this.state.currentStepIndex
          ? this.state.currentStepIndex + 1
          : 0;
        this.state.currentStep =
          this.state.currentRun.task_steps[this.state.currentStepIndex];
        this.emit("state:updated", {
          type: StateUpdateType.TASK_STEP,
          ids: [
            String(this.state.currentRunIndex),
            String(this.state.currentStepIndex),
          ],
        });
        break;
      }
      case "task_initializer_end":
        // SKIP
        break;
      case "task_initializer_error":
        // SKIP
        break;
      case "agent_config_initializer_start":
        assertCurrentStep(this.state);
        this.state.currentStep.agent_config_initializer = {
          input: data,
        };
        this.emit("state:updated", {
          type: StateUpdateType.TASK_STEP,
          ids: [
            String(this.state.currentRunIndex),
            String(this.state.currentStepIndex),
          ],
        });
        break;
      case "agent_config_initializer_end":
        assertCurrentStep(this.state);
        this.state.currentStep.agent_config_initializer = {
          ...this.state.currentStep.agent_config_initializer,
          output: data,
        };
        this.emit("state:updated", {
          type: StateUpdateType.TASK_STEP,
          ids: [
            String(this.state.currentRunIndex),
            String(this.state.currentStepIndex),
          ],
        });
        break;
      case "agent_config_initializer_error":
        assertCurrentStep(this.state);
        this.state.currentStep.agent_config_initializer = {
          ...this.state.currentStep.agent_config_initializer,
          errors: (
            this.state.currentStep.agent_config_initializer?.errors || []
          ).concat(data),
        };
        this.emit("state:updated", {
          type: StateUpdateType.TASK_STEP,
          ids: [
            String(this.state.currentRunIndex),
            String(this.state.currentStepIndex),
          ],
        });
        break;
      case "agent_instructions_builder_start":
        assertCurrentStep(this.state);
        this.state.currentStep.agent_config_initializer = {
          ...this.state.currentStep.agent_config_initializer,
          agent_instructions_builder: {
            input: data,
          },
        };
        this.emit("state:updated", {
          type: StateUpdateType.TASK_STEP,
          ids: [
            String(this.state.currentRunIndex),
            String(this.state.currentStepIndex),
          ],
        });
        break;
      case "agent_instructions_builder_end":
        assertCurrentStep(this.state);
        this.state.currentStep.agent_config_initializer = {
          ...this.state.currentStep.agent_config_initializer,
          agent_instructions_builder: {
            ...this.state.currentStep.agent_config_initializer
              ?.agent_instructions_builder,
            output: data,
          },
        };
        this.emit("state:updated", {
          type: StateUpdateType.TASK_STEP,
          ids: [
            String(this.state.currentRunIndex),
            String(this.state.currentStepIndex),
          ],
        });
        break;
      case "agent_instructions_builder_error":
        assertCurrentStep(this.state);
        this.state.currentStep.agent_config_initializer = {
          ...this.state.currentStep.agent_config_initializer,
          agent_instructions_builder: {
            ...this.state.currentStep.agent_config_initializer
              ?.agent_instructions_builder,
            errors: (
              this.state.currentStep.agent_config_initializer
                ?.agent_instructions_builder?.errors || []
            ).concat(data),
          },
        };
        this.emit("state:updated", {
          type: StateUpdateType.TASK_STEP,
          ids: [
            String(this.state.currentRunIndex),
            String(this.state.currentStepIndex),
          ],
        });
        break;
      case "task_config_initializer_start":
        assertCurrentStep(this.state);
        this.state.currentStep.task_config_initializer = {
          ...this.state.currentStep.task_config_initializer,
          input: data,
        };
        this.emit("state:updated", {
          type: StateUpdateType.TASK_STEP,
          ids: [
            String(this.state.currentRunIndex),
            String(this.state.currentStepIndex),
          ],
        });
        break;
      case "task_config_initializer_end":
        assertCurrentStep(this.state);
        this.state.currentStep.task_config_initializer = {
          ...this.state.currentStep.task_config_initializer,
          output: data,
        };
        this.emit("state:updated", {
          type: StateUpdateType.TASK_STEP,
          ids: [
            String(this.state.currentRunIndex),
            String(this.state.currentStepIndex),
          ],
        });
        break;
      case "task_config_initializer_error":
        assertCurrentStep(this.state);
        this.state.currentStep.task_config_initializer = {
          ...this.state.currentStep.task_config_initializer,
          errors: (
            this.state.currentStep.task_config_initializer?.errors || []
          ).concat(data),
        };
        this.emit("state:updated", {
          type: StateUpdateType.TASK_STEP,
          ids: [
            String(this.state.currentRunIndex),
            String(this.state.currentStepIndex),
          ],
        });
        break;
      case "task_run_initializer_start":
        assertCurrentStep(this.state);
        this.state.currentStep.task_run_initializer = {
          ...this.state.currentStep.task_run_initializer,
          input: data,
        };
        this.emit("state:updated", {
          type: StateUpdateType.TASK_STEP,
          ids: [
            String(this.state.currentRunIndex),
            String(this.state.currentStepIndex),
          ],
        });
        break;
      case "task_run_initializer_end":
        assertCurrentStep(this.state);
        this.state.currentStep.task_run_initializer = {
          ...this.state.currentStep.task_run_initializer,
          output: data,
        };
        if (
          this.state.currentRun?.task_steps &&
          this.state.currentRun.task_steps.length <
            this.state.currentStepIndex + 1
        ) {
          this.state.currentStepIndex += 1;
          this.state.currentStep =
            this.state.currentRun.task_steps[this.state.currentStepIndex];
        }
        this.emit("state:updated", {
          type: StateUpdateType.TASK_STEP,
          ids: [
            String(this.state.currentRunIndex),
            String(this.state.currentStepIndex),
          ],
        });
        break;
      case "task_run_initializer_error":
        assertCurrentStep(this.state);
        this.state.currentStep.task_run_initializer = {
          ...this.state.currentStep.task_run_initializer,
          errors: (
            this.state.currentStep.task_run_initializer?.errors || []
          ).concat(data),
        };
        this.emit("state:updated", {
          type: StateUpdateType.TASK_STEP,
          ids: [
            String(this.state.currentRunIndex),
            String(this.state.currentStepIndex),
          ],
        });
        break;
    }
  }
  protected reset(): void {
    this.state = { runs: [] };
  }
}
