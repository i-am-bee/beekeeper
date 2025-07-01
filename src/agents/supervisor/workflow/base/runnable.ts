import { Logger } from "beeai-framework";
import { Context } from "./context.js";
import { AgentIdValue } from "@/agents/registry/dto.js";
import { AgentUpdateCallback } from "../dto.js";
import { SupervisorWorkflowStateLogger } from "../state/logger.js";

export abstract class Runnable<TInput, TOutput> {
  protected logger: Logger;
  protected stateLogger: SupervisorWorkflowStateLogger;
  private _agentId: string;
  private _name: string;

  get agentId() {
    return this._agentId;
  }

  get name() {
    return this._name;
  }

  constructor(logger: Logger, agentId: AgentIdValue) {
    this._name = this.constructor.name;
    this.logger = logger.child({
      name: this._name,
    });
    this._agentId = agentId;
    this.stateLogger = SupervisorWorkflowStateLogger.getInstance();
  }

  abstract logStateInput(
    input: TInput,
    state: SupervisorWorkflowStateLogger,
    ctx: Context,
  ): Promise<void>;

  abstract logStateOutput(
    output: TOutput,
    state: SupervisorWorkflowStateLogger,
    ctx: Context,
  ): Promise<void>;

  // FIXME: Replace with decorator for logging state start and end
  async run(input: TInput, ctx: Context): Promise<TOutput> {
    await this.logStateInput(input, this.stateLogger, ctx);
    const output = await this._run(input, ctx);
    await this.logStateOutput(output, this.stateLogger, ctx);
    return output;
  }
  protected abstract _run(input: TInput, ctx: Context): Promise<TOutput>;

  protected handleOnUpdate(
    onUpdate: AgentUpdateCallback,
    input:
      | { type?: string; value: string; payload?: string | { toJson: any } }
      | string,
  ) {
    let value;
    if (typeof input === "string") {
      value = `${this._name} > ${input}$`;
    } else {
      value = `${this._name}${input.type ? `[${input.type}] > ` : " "}${input.value}`;

      if (input.payload) {
        value += `\n${typeof input.payload === "string" ? input.payload : JSON.stringify(input.payload.toJson, null, " ")}`;
      }
    }

    onUpdate(this._agentId, value);
  }
}
