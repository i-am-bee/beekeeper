import { WorkflowComposeFixture } from "@/agents/supervisor/workflow/fixtures/base/workflow-compose-fixtures.js";
import {
  BaseCreateExampleInput,
  ExampleInput,
} from "@/agents/supervisor/workflow/fixtures/helpers/create-example.js";
import { prepareDataForWorkflowStep } from "@/agents/supervisor/workflow/fixtures/helpers/prepare-resources.js";
import { protocol } from "../../protocol.js";
import { unwrapTaskStepWithTaskRun } from "@/agents/supervisor/workflow/fixtures/helpers/unwrap-task-step.js";
import { TaskStepMapper } from "../../../helpers/task-step/task-step-mapper.js";

export interface CreateTaskRunExampleInput<F extends WorkflowComposeFixture>
  extends BaseCreateExampleInput<F> {
  readonly scenario: "CREATE_TASK_RUN";
  responseChoiceExplanation?: string;
}

export interface TaskRunUnavailableExampleInput<
  F extends WorkflowComposeFixture,
> extends BaseCreateExampleInput<F> {
  readonly scenario: "TASK_RUN_UNAVAILABLE";
  responseChoiceExplanation: string;
  explanation: string;
  override: {
    tasks?: (agents: F["tasks"]["values"]) => F["tasks"]["values"];
  };
}

export type CreateExampleInputType<F extends WorkflowComposeFixture> =
  | CreateTaskRunExampleInput<F>
  | TaskRunUnavailableExampleInput<F>;

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
    "taskRunInitializer",
    stepNo,
  );

  switch (scenario) {
    case "CREATE_TASK_RUN": {
      const {
        resource: { taskRun },
      } = unwrapTaskStepWithTaskRun(fixtures.taskSteps.get(step));

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
            fixtures.getChoiceExplanation(stepNo, "taskRun"),
          RESPONSE_TYPE: scenario,
          RESPONSE_CREATE_TASK_RUN: {
            task_run_input: taskRun.taskRunInput,
          },
        },
      };
    }
    case "TASK_RUN_UNAVAILABLE": {
      const {
        override: { tasks: overrideTasks },
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
            tasks: overrideTasks
              ? overrideTasks(resources.tasks)
              : resources.tasks,
          },
        },
        example: {
          RESPONSE_CHOICE_EXPLANATION: responseChoiceExplanation,
          RESPONSE_TYPE: scenario,
          RESPONSE_TASK_RUN_UNAVAILABLE: {
            explanation,
          },
        },
      };
    }
  }
}
