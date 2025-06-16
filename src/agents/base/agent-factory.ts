import { BaseToolsFactory } from "@/base/tools-factory.js";
import { Switches } from "@/runtime/factory.js";
import { AssistantMessage, ToolMessage } from "beeai-framework/backend/message";
import { AgentKindEnum } from "../registry/dto.js";
import { Logger } from "beeai-framework";

export interface CreateAgentInput {
  agentKind: AgentKindEnum;
  agentType: string;
  agentId: string;
  instructions: string;
  description: string;
  tools: string[];
}

export abstract class BaseAgentFactory<TAgent> {
  protected logger: Logger;
  constructor(logger: Logger) {
    this.logger = logger.child({
      name: this.constructor.name,
    });
  }
  abstract createAgent(
    input: CreateAgentInput,
    toolsFactory: BaseToolsFactory,
    switches?: Switches,
  ): TAgent;
  abstract runAgent(
    agent: TAgent,
    prompt: string,
    onUpdate: (key: string, value: string) => void,
    signal: AbortSignal,
    addToMemory?: (AssistantMessage | ToolMessage)[],
  ): Promise<string>;
}
