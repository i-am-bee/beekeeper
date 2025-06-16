import { WorkflowComposeFixture } from "@/agents/supervisor-workflow/fixtures/base/workflow-compose-fixtures.js";
import { prepareDataForWorkflowStep } from "@/agents/supervisor-workflow/fixtures/helpers/prepare-resources.js";
import { unwrapTaskStepWithTaskRun } from "@/agents/supervisor-workflow/fixtures/helpers/unwrap-task-step.js";
import { Resources } from "@/agents/supervisor-workflow/workflow-composer/helpers/resources/dto.js";
import { TaskStep } from "@/agents/supervisor-workflow/workflow-composer/helpers/task-step/dto.js";
import { TaskStepMapper } from "@/agents/supervisor-workflow/workflow-composer/helpers/task-step/task-step-mapper.js";
import * as laml from "@/laml/index.js";
import { protocol } from "../../protocol.js";

export interface ExampleInput {
  title: string;
  subtitle: string;
  user: string;
  context: {
    previousSteps: TaskStep[];
    resources: Resources;
  };
  example: laml.ProtocolResult<typeof protocol>;
}

export function createExampleInput<F extends WorkflowComposeFixture>({
  scenario,
  step,
  responseChoiceExplanation,
  fixtures,
  subtitle,
  note,
}: {
  scenario: "CREATE_TASK_RUN";
  step: Parameters<F["taskSteps"]["get"]>[0];
  fixtures: F;
  responseChoiceExplanation?: string;
  subtitle?: string;
  note?: string;
}) {
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
      } satisfies ExampleInput;
    }
  }
}
