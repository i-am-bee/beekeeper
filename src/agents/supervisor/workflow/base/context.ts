import { AgentUpdateCallback } from "@/agents/agent-factory.js";
import { AgentIdValue } from "@/agents/registry/dto.js";
import { ChatModel } from "beeai-framework";

export interface Context {
  llm: ChatModel;
  actingAgentId: AgentIdValue;
  onUpdate: AgentUpdateCallback;
}
