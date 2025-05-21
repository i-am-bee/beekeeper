import { Logger } from "beeai-framework";
import { Context } from "./context.js";
import { AgentIdValue } from "@/agents/registry/dto.js";
import { AgentUpdateCallback } from "../dto.js";

export abstract class Runnable<TInput, TOutput> {
  protected logger: Logger;
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
  }

  abstract run(input: TInput, ctx: Context): Promise<TOutput>;

  protected handleOnUpdate(
    onUpdate: AgentUpdateCallback,
    input: { type?: string; value: string } | string,
  ) {
    onUpdate(
      this._agentId,
      typeof input === "string"
        ? `${this._name}: ${input}`
        : `${this._name}: ${input.type ? `${input.type} > ` : ""}${input.value}`,
    );
  }
}
