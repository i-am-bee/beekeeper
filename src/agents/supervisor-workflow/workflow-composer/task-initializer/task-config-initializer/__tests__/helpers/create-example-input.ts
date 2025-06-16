import { WorkflowComposeFixture } from "@/agents/supervisor-workflow/fixtures/base/workflow-compose-fixtures.js";
import {
  BaseCreateExampleInput,
  ExampleInput,
} from "@/agents/supervisor-workflow/fixtures/helpers/create-example.js";
import { prepareDataForWorkflowStep } from "@/agents/supervisor-workflow/fixtures/helpers/prepare-resources.js";
import { unwrapTaskStepWithTask } from "@/agents/supervisor-workflow/fixtures/helpers/unwrap-task-step.js";
import { TaskStepMapper } from "@/agents/supervisor-workflow/workflow-composer/helpers/task-step/task-step-mapper.js";
import { protocol } from "../../protocol.js";
import { TaskConfigMinimal } from "../../dto.js";
import { Resources } from "@/agents/supervisor-workflow/workflow-composer/helpers/resources/dto.js";
import { TaskStep } from "@/agents/supervisor-workflow/workflow-composer/helpers/task-step/dto.js";

export interface CreateTaskExampleInput<F extends WorkflowComposeFixture>
  extends BaseCreateExampleInput<F> {
  readonly scenario: "CREATE_TASK_CONFIG";
  responseChoiceExplanation?: string;
}

export interface SelectTaskExampleInput<F extends WorkflowComposeFixture>
  extends BaseCreateExampleInput<F> {
  readonly scenario: "SELECT_TASK_CONFIG";
  responseChoiceExplanation?: string;
}

export interface UpdateTaskExampleInput<F extends WorkflowComposeFixture>
  extends BaseCreateExampleInput<F> {
  readonly scenario: "UPDATE_TASK_CONFIG";
  responseChoiceExplanation: string;
  override: {
    previousSteps?: (
      steps: F["taskSteps"]["values"],
    ) => F["taskSteps"]["values"];
    step?: (step: TaskStep) => TaskStep;
    agents?: (agents: F["agents"]["values"]) => F["agents"]["values"];
    tasks?: (tasks: F["tasks"]["values"]) => F["tasks"]["values"];
    taskRuns?: (tasks: F["taskRuns"]["values"]) => F["taskRuns"]["values"];
  };
  update: Partial<Omit<TaskConfigMinimal, "taskType">>;
}

export interface TaskUnavailableExampleInput<F extends WorkflowComposeFixture>
  extends BaseCreateExampleInput<F> {
  readonly scenario: "TASK_CONFIG_UNAVAILABLE";
  responseChoiceExplanation: string;
  explanation: string;
  override: {
    agents?: (agents: F["agents"]["values"]) => F["agents"]["values"];
    tasks?: (agents: F["tasks"]["values"]) => F["tasks"]["values"];
  };
}

export type CreateExampleInputType<F extends WorkflowComposeFixture> =
  | CreateTaskExampleInput<F>
  | SelectTaskExampleInput<F>
  | UpdateTaskExampleInput<F>
  | TaskUnavailableExampleInput<F>;

export function createExampleInput<F extends WorkflowComposeFixture>(
  input: CreateExampleInputType<F>,
): ExampleInput<typeof protocol> {
  const {
    scenario,
    step,
    responseChoiceExplanation,
    fixtures,
    subtitle,
    note,
  } = input;

  const fullSubtitle = `${subtitle ?? fixtures.title}${note ? ` (${note})` : ""}`;

  const stepNo = fixtures.taskSteps.stepNo(step);

  const { resources, previousSteps, taskStep } = prepareDataForWorkflowStep(
    fixtures,
    "taskConfigInitializer",
    stepNo,
  );

  switch (scenario) {
    case "CREATE_TASK_CONFIG": {
      const {
        resource: { task },
      } = unwrapTaskStepWithTask(fixtures.taskSteps.get(step));

      return {
        title: scenario,
        subtitle: fullSubtitle,
        user: TaskStepMapper.format(taskStep),
        context: {
          previousSteps,
          resources,
        },
        example: {
          RESPONSE_CHOICE_EXPLANATION:
            responseChoiceExplanation ??
            fixtures.getChoiceExplanation(stepNo, "taskConfig"),
          RESPONSE_TYPE: scenario,
          RESPONSE_CREATE_TASK_CONFIG: {
            agent_type: task.agentType,
            task_type: task.taskType,
            task_config_input: task.taskConfigInput,
            description: task.description,
          },
        },
      };
    }
    case "UPDATE_TASK_CONFIG": {
      const {
        override: {
          agents: overrideAgents,
          previousSteps: overridePreviousSteps,
          tasks: overrideTasks,
          taskRuns: overrideTaskRuns,
          step: overrideStep,
        },
        update,
      } = input;

      const overriddenResources = {
        agents: overrideAgents
          ? overrideAgents(resources.agents)
          : resources.agents,
        tasks: overrideTasks ? overrideTasks(resources.tasks) : resources.tasks,
        taskRuns: overrideTaskRuns
          ? overrideTaskRuns(resources.taskRuns)
          : resources.taskRuns,
        tools: resources.tools,
      } satisfies Resources;

      const overriddenPreviousSteps = overridePreviousSteps
        ? overridePreviousSteps(previousSteps)
        : previousSteps;

      const overriddenStep = overrideStep ? overrideStep(taskStep) : taskStep;

      if (overriddenStep.resource.type !== "task") {
        throw new Error(
          `Expected overridden step to be of type "task", but got "${overriddenStep.resource.type}"`,
        );
      }

      const {
        resource: { task },
      } = overriddenStep;

      return {
        title: scenario,
        subtitle: fullSubtitle,
        user: TaskStepMapper.format(overriddenStep),
        context: {
          previousSteps: overriddenPreviousSteps,
          resources: overriddenResources,
        },
        example: {
          RESPONSE_CHOICE_EXPLANATION: responseChoiceExplanation,
          RESPONSE_TYPE: scenario,
          RESPONSE_UPDATE_TASK_CONFIG: {
            task_type: task.taskType,
            ...update,
          },
        },
      };
    }
    case "SELECT_TASK_CONFIG": {
      const {
        resource: { task },
      } = unwrapTaskStepWithTask(fixtures.taskSteps.get(step));

      return {
        title: scenario,
        subtitle: fullSubtitle,
        user: TaskStepMapper.format(taskStep),
        context: {
          previousSteps,
          resources,
        },
        example: {
          RESPONSE_CHOICE_EXPLANATION:
            responseChoiceExplanation ??
            fixtures.getChoiceExplanation(stepNo, "taskConfig"),
          RESPONSE_TYPE: scenario,
          RESPONSE_SELECT_TASK_CONFIG: {
            task_type: task.taskType,
          },
        },
      };
    }
    case "TASK_CONFIG_UNAVAILABLE": {
      const {
        override: { agents: overrideAgents, tasks: overrideTasks },
        explanation,
      } = input;

      return {
        title: scenario,
        subtitle: fullSubtitle,
        user: TaskStepMapper.format(taskStep),
        context: {
          previousSteps,
          resources: {
            ...resources,
            agents: overrideAgents
              ? overrideAgents(resources.agents)
              : resources.agents,
            tasks: overrideTasks
              ? overrideTasks(resources.tasks)
              : resources.tasks,
          },
        },
        example: {
          RESPONSE_CHOICE_EXPLANATION: responseChoiceExplanation,
          RESPONSE_TYPE: scenario,
          RESPONSE_TASK_CONFIG_UNAVAILABLE: {
            explanation,
          },
        },
      };
    }
  }
}
