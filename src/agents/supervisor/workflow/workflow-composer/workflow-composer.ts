import { AgentIdValue } from "@/agents/registry/dto.js";
import { TaskRun } from "@/tasks/manager/dto.js";
import { Logger } from "beeai-framework";
import { Context } from "../base/context.js";
import { FnResult } from "../base/retry/types.js";
import { Runnable } from "../base/runnable.js";
import { WorkflowComposerInput, WorkflowComposerOutput } from "./dto.js";
import { collectResources } from "./helpers/resources/utils.js";
import { TaskStep } from "./helpers/task-step/dto.js";
import { TaskStepMapper } from "./helpers/task-step/task-step-mapper.js";
import { ProblemDecomposer } from "./problem-decomposer/problem-decomposer.js";
import { TaskInitializer } from "./task-initializer/task-initalizer.js";
import { TaskRunInitializer } from "./task-run-initializer/task-run-initializer.js";
import { assertTaskStepResourceType } from "./helpers/task-step/helpers/assert.js";

export class WorkflowComposer extends Runnable<
  WorkflowComposerInput,
  FnResult<WorkflowComposerOutput>
> {
  protected problemDecomposer: ProblemDecomposer;
  protected taskInitializer: TaskInitializer;
  protected taskRunInitializer: TaskRunInitializer;

  constructor(logger: Logger, agentId: AgentIdValue) {
    super(logger, agentId);
    this.problemDecomposer = new ProblemDecomposer(logger, agentId);
    this.taskInitializer = new TaskInitializer(logger, agentId);
    this.taskRunInitializer = new TaskRunInitializer(logger, agentId);
  }

  async run(
    input: WorkflowComposerInput,
    ctx: Context,
  ): Promise<FnResult<WorkflowComposerOutput>> {
    const { input: userMessage, originTaskRunId } = input;
    const { onUpdate } = ctx;
    let resources = collectResources("operator", ctx.actingAgentId);
    const problemDecomposerRunResult = await this.problemDecomposer.run(
      {
        userMessage,
        data: {
          // The existing resources that can be used to initialize tasks.
          resources,
          // The request is the original user input that needs to be decomposed into tasks.
          // It is passed to user message in the first iteration.
          request: userMessage,
        },
      },
      ctx,
    );

    if (problemDecomposerRunResult.type === "ERROR") {
      this.handleOnUpdate(
        onUpdate,
        `Problem decomposition failed: ${problemDecomposerRunResult.explanation}`,
      );
      return {
        type: "ERROR",
        explanation: problemDecomposerRunResult.explanation,
      };
    }
    const { result: problemDecomposerResult } = problemDecomposerRunResult;

    this.handleOnUpdate(onUpdate, `Initializing tasks`);

    const taskRuns: TaskRun[] = [];
    const previousSteps: TaskStep[] = [];
    for (const taskStep of problemDecomposerResult) {
      // TASK CONFIG and AGENT CONFIG INITIALIZATION
      const taskInitializerRunResult = await this.taskInitializer.run(
        { taskStep, previousSteps, resources },
        ctx,
      );

      if (taskInitializerRunResult.type === "ERROR") {
        return taskInitializerRunResult;
      }

      // TASK RUN CREATION
      const taskRunInitializerRunResult = await this.taskRunInitializer.run(
        {
          data: {
            actingAgentId: ctx.actingAgentId,
            previousSteps,
            originTaskRunId,
            resources: taskInitializerRunResult.result.resources,
            taskStep: taskInitializerRunResult.result.taskStep,
          },
          userMessage: TaskStepMapper.format(
            taskInitializerRunResult.result.taskStep,
          ),
        },
        ctx,
      );

      if (taskRunInitializerRunResult.type === "ERROR") {
        return taskRunInitializerRunResult;
      }

      const {
        result: { taskStep: newTaskStep, resources: newResources },
      } = taskRunInitializerRunResult;

      assertTaskStepResourceType(newTaskStep, "task_run");

      taskRuns.push(newTaskStep.resource.taskRun);

      resources = newResources;
      previousSteps.push(newTaskStep);
      // this.handleOnUpdate(onUpdate, {
      //   value: `Task run initialized: ${taskStep.resource.taskRun.taskRunId}`,
      //   payload: {
      //     toJson: taskStep.resource.taskRun,
      //   },
      // });
    }

    return {
      type: "SUCCESS",
      result: taskRuns,
    };
  }
}
