import { TaskConfig } from "@/tasks/manager/dto.js";
import { Logger } from "beeai-framework";
import { Context } from "../base/context.js";
import { Runnable } from "../base/runnable.js";
import { WorkflowComposerInput, WorkflowComposerOutput } from "./dto.js";
import { ProblemDecomposer } from "./problem-decomposer/problem-decomposer.js";
import { TaskInitializer } from "./task-initializer/task-initalizer.js";
import { AgentIdValue } from "@/agents/registry/dto.js";

export class WorkflowComposer extends Runnable<
  WorkflowComposerInput,
  WorkflowComposerOutput
> {
  protected problemDecomposer: ProblemDecomposer;
  protected taskInitializer: TaskInitializer;

  constructor(logger: Logger, agentId: AgentIdValue) {
    super(logger, agentId);
    this.problemDecomposer = new ProblemDecomposer(logger, agentId);
    this.taskInitializer = new TaskInitializer(logger, agentId);
  }

  async run(
    input: WorkflowComposerInput,
    ctx: Context,
  ): Promise<WorkflowComposerOutput> {
    const { output: problemDecomposerOutput } =
      await this.problemDecomposer.run(
        { userMessage: input.input, data: input },
        ctx,
      );
    if (problemDecomposerOutput.type === "ERROR") {
      return problemDecomposerOutput;
    }

    const taskRuns: TaskConfig[] = [];
    for (const task of problemDecomposerOutput.result) {
      const taskInitializerOutput = await this.taskInitializer.run(
        { task },
        ctx,
      );

      if (taskInitializerOutput.type === "ERROR") {
        return taskInitializerOutput;
      }

      taskRuns.push(taskInitializerOutput.result);
    }

    return {
      type: "SUCCESS",
      result: taskRuns,
    };
  }
}
