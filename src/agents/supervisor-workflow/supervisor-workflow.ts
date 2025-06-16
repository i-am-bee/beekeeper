import { ChatModel, Logger } from "beeai-framework";
import { AgentIdValue } from "../registry/dto.js";
import { Context } from "./base/context.js";
import { Runnable } from "./base/runnable.js";
import { SupervisorWorkflowInput } from "./dto.js";
import { RequestHandler } from "./request-handler/request-handler.js";
import { WorkflowComposer } from "./workflow-composer/workflow-composer.js";
import { TaskRunStarterTool } from "./tool.js";

export class SupervisorWorkflow extends Runnable<
  SupervisorWorkflowInput,
  string
> {
  protected llm: ChatModel;
  protected requestHandler: RequestHandler;
  protected workflowComposer: WorkflowComposer;
  protected taskRunStarterTool: TaskRunStarterTool;

  constructor(logger: Logger, llm: ChatModel, agentId: AgentIdValue) {
    super(logger, agentId);
    this.llm = llm;
    this.requestHandler = new RequestHandler(this.logger, agentId);
    this.workflowComposer = new WorkflowComposer(this.logger, agentId);
    this.taskRunStarterTool = new TaskRunStarterTool();
  }

  async run({
    prompt: input,
    originTaskRunId,
    onUpdate,
  }: SupervisorWorkflowInput): Promise<string> {
    const ctx = {
      actingAgentId: this.agentId,
      llm: this.llm,
      onUpdate,
    } satisfies Context;

    const requestHandlerRunOutput = await this.requestHandler.run(
      {
        data: { request: input },
        userMessage: input,
      },
      ctx,
    );

    if (requestHandlerRunOutput.type === "ERROR") {
      throw new Error(
        `Request handler failed: ${requestHandlerRunOutput.explanation}`,
      );
    }
    const { result } = requestHandlerRunOutput;
    if (result.type === "COMPOSE_WORKFLOW") {
      const output = await this.workflowComposer.run(
        { input: result.response, originTaskRunId },
        ctx,
      );

      if (output.type === "ERROR") {
        return output.explanation;
      }

      const toolResult = await this.taskRunStarterTool.run({
        method: "scheduleStartInteractionBlockingTaskRuns",
        actingAgentId: this.agentId,
        interactionTaskRunId: originTaskRunId,
      });

      if (!toolResult.result.success) {
        return `Failed to schedule interaction blocking task runs: ${toolResult.result.data}`;
      }

      return `I have prepared these tasks for you: \n${output.result.map((t, idx) => `${idx + 1}. ${t.taskType}`).join(`\n`)}`;
    } else {
      return result.response;
    }
  }
}
