import { WorkflowComposeFixture } from "@/agents/supervisor-workflow/fixtures/base/workflow-compose-fixtures.js";
import {
  BaseCreateExampleInput,
  ExampleInput,
} from "@/agents/supervisor-workflow/fixtures/helpers/create-example.js";
import { prepareDataForWorkflowStep } from "@/agents/supervisor-workflow/fixtures/helpers/prepare-resources.js";
import { TaskStep } from "@/agents/supervisor-workflow/workflow-composer/helpers/task-step/dto.js";
import { protocol } from "../../protocol.js";
import { AgentConfigTinyDraft } from "../../../dto.js";
import { assertTaskStepResourceType } from "@/agents/supervisor-workflow/workflow-composer/helpers/task-step/helpers/assert.js";

export interface CreateExampleInput<F extends WorkflowComposeFixture>
  extends BaseCreateExampleInput<F> {
  instructions: string;
}

export interface InstructionsExampleInput
  extends ExampleInput<typeof protocol> {
  taskStep: TaskStep;
  agentConfigDraft: AgentConfigTinyDraft;
}

export function createExampleInput<F extends WorkflowComposeFixture>(
  input: CreateExampleInput<F>,
): InstructionsExampleInput {
  const { step, fixtures, subtitle, note, instructions } = input;

  const fullSubtitle = `${subtitle ?? fixtures.title}${note ? ` (${note})` : ""}`;

  const stepNo = fixtures.taskSteps.stepNo(step);

  const { resources, previousSteps, taskStep } = prepareDataForWorkflowStep(
    fixtures,
    "taskConfigInitializer",
    stepNo,
  );

  assertTaskStepResourceType(taskStep, "agent");

  const agentConfigDraft = {
    agentType: taskStep.resource.agent.agentType,
    description: taskStep.resource.agent.description,
    tools: taskStep.resource.agent.tools,
  } satisfies AgentConfigTinyDraft;

  return {
    title: "INSTRUCTIONS",
    subtitle: fullSubtitle,
    user: taskStep.step,
    context: {
      previousSteps,
      resources,
    },
    agentConfigDraft,
    taskStep,
    example: {
      INSTRUCTIONS: instructions,
    },
  };
}
