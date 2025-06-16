import { AgentIdValue } from "@/agents/registry/dto.js";
import { ChatModel } from "beeai-framework";

export interface Context {
    llm: ChatModel;
    supervisorAgentId: AgentIdValue;
}