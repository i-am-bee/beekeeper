import { ChatModel, Logger } from "beeai-framework";
import { TokenMemory } from "beeai-framework/memory/tokenMemory";
import { AgentIdValue } from "../../registry/dto.js";
import { Context } from "./base/context.js";
import { Runnable } from "./base/runnable.js";
import { SupervisorWorkflowInput } from "./dto.js";
import { RequestHandler } from "./request-handler/request-handler.js";
import { TaskRunStarterTool } from "./tool.js";
import { WorkflowComposer } from "./workflow-composer/workflow-composer.js";
import { SupervisorWorkflowStateLogger } from "./state/logger.js";

export class SupervisorWorkflow extends Runnable<
  SupervisorWorkflowInput,
  string
> {
  protected llm: ChatModel;
  protected requestHandler: RequestHandler;
  protected workflowComposer: WorkflowComposer;
  protected taskRunStarterTool: TaskRunStarterTool;
  protected _memory: TokenMemory;
  protected stateLogger: SupervisorWorkflowStateLogger;

  get memory() {
    return this._memory;
  }

  async logStateInput(
    { prompt, originTaskRunId }: SupervisorWorkflowInput,
    stateLogger: SupervisorWorkflowStateLogger,
  ): Promise<void> {
    await stateLogger.logSupervisorWorkflowStart({
      input: {
        prompt,
        originTaskRunId,
      },
    });
  }
  async logStateOutput(
    output: string,
    stateLogger: SupervisorWorkflowStateLogger,
  ): Promise<void> {
    await stateLogger.logSupervisorWorkflowEnd({
      output,
    });
  }

  constructor(logger: Logger, llm: ChatModel, agentId: AgentIdValue) {
    super(logger, agentId);
    this.llm = llm;
    this.requestHandler = new RequestHandler(this.logger, agentId);
    this.workflowComposer = new WorkflowComposer(this.logger, agentId);
    this.taskRunStarterTool = new TaskRunStarterTool();
    this._memory = new TokenMemory({
      maxTokens: llm.parameters.maxTokens, // optional (default is 128k),
      capacityThreshold: 0.75, // maxTokens*capacityThreshold = threshold where we start removing old messages
      syncThreshold: 0.25, // maxTokens*syncThreshold = threshold where we start to use a real tokenization endpoint instead of guessing the number of tokens
    });
    this.stateLogger = SupervisorWorkflowStateLogger.getInstance();
  }

  override async run(input: SupervisorWorkflowInput): Promise<string> {
    const { onUpdate } = input;
    const ctx = {
      actingAgentId: this.agentId,
      llm: this.llm,
      onUpdate,
    } satisfies Context;
    return super.run(input, ctx);
  }

  protected async _run(
    {prompt: input, originTaskRunId}: SupervisorWorkflowInput,
    ctx: Context,
  ): Promise<string> {
    const requestHandlerRunOutput = await this.requestHandler.run(
      {
        data: { request: input },
        userMessage: input,
        memory: this._memory,
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

      return `I have prepared these tasks: \n${output.result
        .map(
          (t, idx) => `${idx + 1}. ${t.taskType}\n\t\t${t.config.description}`,
        )
        .join(`\n`)}

...and scheduled them to start interaction blocking task runs. Please check the task runs in the task monitor.`;
    } else {
      return result.response;
    }
  }
}
