import { BaseToolsFactory } from "@/base/tools-factory.js";
import { getChatLLM } from "@/helpers/llm.js";
import { Switches } from "@/runtime/factory.js";
import { TaskRunIdValue } from "@/tasks/manager/dto.js";
import { ReActAgent } from "beeai-framework/agents/react/agent";
import { AssistantMessage, ToolMessage } from "beeai-framework/backend/message";
import { TokenMemory } from "beeai-framework/memory/tokenMemory";
import { BaseAgentFactory, CreateAgentInput } from "./base/agent-factory.js";
import { SupervisorWorkflow } from "./supervisor-workflow/supervisor-workflow.js";

export type AgentUpdateCallback = (key: string, value: string) => void;

export class AgentFactory extends BaseAgentFactory<
  ReActAgent | SupervisorWorkflow
> {
  createAgent<TCreateInput extends CreateAgentInput = CreateAgentInput>(
    input: TCreateInput,
    toolsFactory: BaseToolsFactory,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    switches?: Switches,
  ) {
    const llm = getChatLLM(input.agentKind);
    const generalInstructions = `You are a ${input.agentKind} kind of agent (agentId=${input.agentId}, agentType=${input.agentType}). ${input.instructions}`;
    switch (input.agentKind) {
      case "supervisor": {
        // const tools = toolsFactory.createTools(input.tools);
        // return new ReActAgent({
        //   meta: {
        //     name: input.agentId,
        //     description: input.description,
        //   },
        //   llm,
        //   memory: new UnconstrainedMemory(),
        //   tools,
        //   templates: {
        //     system: (template) =>
        //       template.fork((config) => {
        //         config.defaults.instructions =
        //           supervisor.SUPERVISOR_INSTRUCTIONS(input.agentId, switches);
        //       }),
        //   },
        //   execution: {
        //     maxIterations: 100,
        //     maxRetriesPerStep: 2,
        //     totalMaxRetries: 10,
        //   },
        // });

        return new SupervisorWorkflow(this.logger, llm, input.agentId);
      }
      case "operator":
        return new ReActAgent({
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
    agent: ReActAgent | SupervisorWorkflow,
    prompt: string,
    onUpdate: AgentUpdateCallback,
    signal: AbortSignal,
    taskRunId: TaskRunIdValue,
    addToMemory?: (AssistantMessage | ToolMessage)[],
  ): Promise<string> {
    if (agent instanceof SupervisorWorkflow) {
      return await agent.run({ prompt, onUpdate, originTaskRunId: taskRunId });
    } else {
      if (addToMemory) {
        agent.memory.addMany(addToMemory);
      }

      const resp = await agent
        .run({ prompt }, { signal })
        .observe((emitter) => {
          emitter.on("update", async ({ update }) => {
            onUpdate(update.key, update.value);
          });
        })
        .context({ task_run_signal: signal });

      return resp.result.text;
    }
  }
}
