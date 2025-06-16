import { uniqueBy } from "remeda";
import { Resources } from "../../workflow-composer/helpers/resources/dto.js";
import { WorkflowComposeFixture } from "../base/workflow-compose-fixtures.js";
import {
  unwrapTaskStepWithAgent,
  unwrapTaskStepWithTask,
  unwrapTaskStepWithTaskRun,
  unwrapTaskStepWithToolsOrLLM,
} from "./unwrap-task-step.js";

export const WorkflowSteps = [
  "agentConfigInitializer",
  "taskConfigInitializer",
  "taskRunInitializer",
] as const;

export type WorkflowStep = (typeof WorkflowSteps)[number];

export function prepareDataForWorkflowStep(
  fixtures: WorkflowComposeFixture,
  workflowStep: WorkflowStep,
  stepNo: number,
) {
  const stepIndex = stepNo - 1; // Adjust for zero-based index

  const resources = {
    tools: fixtures.tools.values,
    agents: fixtures.agents.values,
    tasks: fixtures.tasks.values,
    taskRuns: [],
  } satisfies Resources;

  const previousSteps = fixtures.taskSteps.values.slice(0, stepIndex);
  const steps = fixtures.taskSteps.values.slice(0, stepIndex + 1);
  const currentStep = fixtures.taskSteps.values.at(stepIndex);

  const compareStepPositions = (fst: WorkflowStep, snd: WorkflowStep) =>
    WorkflowSteps.indexOf(fst) - WorkflowSteps.indexOf(snd);
  const sliceAndUnwrapPreviousTaskSteps = <T, U, V>(
    reference: WorkflowStep,
    current: WorkflowStep,
    steps: T[],
    unwrap: (step: T) => U,
    unique: (res: U) => V,
  ) => {
    const endIndex =
      compareStepPositions(reference, current) >= 0 ? stepIndex : stepIndex + 1;
    const sliced = steps.slice(0, endIndex);
    const mapped = sliced.map(unwrap);
    return uniqueBy(mapped, unique);
  };

  const agents = sliceAndUnwrapPreviousTaskSteps(
    "agentConfigInitializer",
    workflowStep,
    steps,
    (s) => unwrapTaskStepWithAgent(s).resource.agent,
    (it) => it.agentType,
  );
  const tasks = sliceAndUnwrapPreviousTaskSteps(
    "taskConfigInitializer",
    workflowStep,
    steps,
    (s) => unwrapTaskStepWithTask(s).resource.task,
    (it) => it.taskType,
  );
  const taskRuns = sliceAndUnwrapPreviousTaskSteps(
    "taskRunInitializer",
    workflowStep,
    steps,
    (s) => unwrapTaskStepWithTaskRun(s).resource.taskRun,
    (it) => it.taskRunId,
  );

  let taskStep;
  switch (workflowStep) {
    case "agentConfigInitializer":
      taskStep = unwrapTaskStepWithToolsOrLLM(currentStep);
      break;
    case "taskConfigInitializer":
      taskStep = unwrapTaskStepWithAgent(currentStep);
      break;
    case "taskRunInitializer":
      taskStep = unwrapTaskStepWithTask(currentStep);
      break;
    default:
      throw new Error(`Unknown workflow step: ${workflowStep}`);
  }

  return {
    resources: {
      tools: resources.tools, // Tools are not limited by step
      agents,
      tasks,
      taskRuns,
    } satisfies Resources,
    previousSteps: previousSteps.map(unwrapTaskStepWithTaskRun),
    taskStep,
  };
}
