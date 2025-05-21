import { ChatModel, Logger } from "beeai-framework";
import { AgentIdValue } from "../registry/dto.js";
import { Context } from "./base/context.js";
import { Runnable } from "./base/runnable.js";
import { SupervisorWorkflowInput } from "./dto.js";
import { RequestHandler } from "./request-handler/request-handler.js";
import { WorkflowComposer } from "./workflow-composer/workflow-composer.js";

export class SupervisorWorkflow extends Runnable<
  SupervisorWorkflowInput,
  string
> {
  protected llm: ChatModel;
  protected requestHandler: RequestHandler;
  protected workflowComposer: WorkflowComposer;

  constructor(logger: Logger, llm: ChatModel, agentId: AgentIdValue) {
    super(logger, agentId);
    this.llm = llm;
    this.requestHandler = new RequestHandler(this.logger, agentId);
    this.workflowComposer = new WorkflowComposer(this.logger, agentId);
  }

  async run({
    prompt: input,
    onUpdate,
  }: SupervisorWorkflowInput): Promise<string> {
    const ctx = {
      agentId: this.agentId,
      llm: this.llm,
      onUpdate,
    } satisfies Context;

    const { output: requestHandlerOutput } = await this.requestHandler.run(
      {
        data: { request: input },
        userMessage: input,
      },
      ctx,
    );

    if (requestHandlerOutput.type === "COMPOSE_WORKFLOW") {
      const output = await this.workflowComposer.run({ input }, ctx);

      if (output.type === "ERROR") {
        return output.explanation;
      }

      return `I have prepared these tasks for you: \n${output.result.map((t, idx) => `${idx + 1}. ${t.taskType}`).join(`\n`)}`;
    } else {
      return requestHandlerOutput.response;
    }
  }
}
