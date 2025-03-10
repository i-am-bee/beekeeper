import { BaseToolsFactory } from "@/base/tools-factory.js";
import { getChatLLM } from "@/helpers/llm.js";
import { Switches } from "@/runtime/factory.js";
import { BeeAgent } from "beeai-framework/agents/bee/agent";
import { TokenMemory } from "beeai-framework/memory/tokenMemory";
import { UnconstrainedMemory } from "beeai-framework/memory/unconstrainedMemory";
import { BaseAgentFactory, CreateAgentInput } from "./base/agent-factory.js";
import { supervisor } from "./index.js";

export class AgentFactory extends BaseAgentFactory<BeeAgent> {
  createAgent<TCreateInput extends CreateAgentInput = CreateAgentInput>(
    input: TCreateInput,
    toolsFactory: BaseToolsFactory,
    switches?: Switches,
  ) {
    const llm = getChatLLM(input.agentKind);
    const generalInstructions = `You are a ${input.agentKind} kind of agent (agentId=${input.agentId}, agentType=${input.agentType}). ${input.instructions}`;
    switch (input.agentKind) {
      case "supervisor": {
        const tools = toolsFactory.createTools(input.tools);

        return new BeeAgent({
          meta: {
            name: input.agentId,
            description: input.description,
          },
          llm,
          memory: new UnconstrainedMemory(),
          tools,
          templates: {
            system: (template) =>
              template.fork((config) => {
                config.defaults.instructions =
                  supervisor.SUPERVISOR_INSTRUCTIONS(input.agentId, switches);
              }),
          },
          execution: {
            maxIterations: 100,
            maxRetriesPerStep: 2,
            totalMaxRetries: 10,
          },
        });
      }
      case "operator":
        return new BeeAgent({
          meta: {
            name: input.agentId,
            description: input.description,
          },
          llm,
          memory: new TokenMemory({ maxTokens: llm.parameters.maxTokens }),
          tools: toolsFactory.createTools(input.tools),
          templates: {
            system: (template) =>
              template.fork((config) => {
                config.defaults.instructions = generalInstructions;
              }),
          },
          execution: {
            maxIterations: 8,
            maxRetriesPerStep: 2,
            totalMaxRetries: 10,
          },
        });
      default:
        throw new Error(`Undefined agent kind agentKind:${input.agentKind}`);
    }
  }

  async runAgent(
    agent: BeeAgent,
    prompt: string,
    onUpdate: (key: string, value: string) => void,
    signal?: AbortSignal,
  ): Promise<string> {
    const resp = await agent.run({ prompt }, { signal }).observe((emitter) => {
      emitter.on("update", async ({ update }) => {
        onUpdate(update.key, update.value);
      });
    });

    return resp.result.text;
  }
}
