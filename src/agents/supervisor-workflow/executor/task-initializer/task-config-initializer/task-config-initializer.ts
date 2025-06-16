import { LLMCall } from "@/agents/supervisor-workflow/llm-call.js";
import * as laml from "@/laml/index.js";
import { clone } from "remeda";
import {
  TaskConfigInitializerInput,
  TaskConfigInitializerOutput,
} from "./dto.js";
import { protocol } from "./protocol.js";
import { TaskConfigInitializerTool } from "./tool.js";
import { prompt } from "./prompt.js";
import { Logger } from "beeai-framework";

export class TaskConfigInitializer extends LLMCall<
  typeof protocol,
  TaskConfigInitializerInput,
  TaskConfigInitializerOutput
> {
  protected tool: TaskConfigInitializerTool;

  constructor(logger: Logger) {
    super(logger);
    this.tool = new TaskConfigInitializerTool();
  }

  async processResult(
    result: laml.ProtocolResult<typeof protocol>,
    context: { input: TaskConfigInitializerInput },
  ): Promise<TaskConfigInitializerOutput> {
    try {
      let toolCallResult;
      switch (result.RESPONSE_TYPE) {
        case "CREATE_TASK_CONFIG": {
          const response = result.RESPONSE_CREATE_TASK_CONFIG;
          if (!response) {
            throw new Error(`RESPONSE_CREATE_TASK_CONFIG is missing`);
          }

          toolCallResult = await this.tool.run({
            method: "createTaskConfig",
            agentKind: "operator",
            config: {
              agentType: response.agent_type,
              description: response.description,
              instructions: response.instructions,
              tools: response.tools,
            },
          });
          return {
            type: "SUCCESS",
            taskConfig: {
              agentType: toolCallResult.result.data.agentType,
              description: toolCallResult.result.data.description,
              // instructions: toolCallResult.result.data.instructions,
              // tools: clone(toolCallResult.result.data.tools),
            } as any,
          };
        }
        case "UPDATE_TASK_CONFIG": {
          const response = result.RESPONSE_UPDATE_TASK_CONFIG;
          if (!response) {
            throw new Error(`RESPONSE_UPDATE_TASK_CONFIG is missing`);
          }

          toolCallResult = await this.tool.run({
            method: "updateTaskConfig",
            agentKind: "operator",
            agentType: response.agent_type,
            config: {
              description: response.description,
              instructions: response.instructions,
              tools: response.tools,
            },
          });
          return {
            type: "SUCCESS",
            taskConfig: {
              agentType: toolCallResult.result.data.agentType,
              description: toolCallResult.result.data.description,
              // instructions: toolCallResult.result.data.instructions,
              // tools: clone(toolCallResult.result.data.tools),
            } as any,
          };
        }
        case "SELECT_TASK_CONFIG": {
          const response = result.RESPONSE_SELECT_TASK_CONFIG;
          if (!response) {
            throw new Error(`RESPONSE_SELECT_TASK_CONFIG is missing`);
          }

          const selected = context.input.existingConfigs.find(
            (c) => c.agentType === response.agent_type,
          );

          if (!selected) {
            return {
              type: "ERROR",
              explanation: `Can't find selected agent config \`${response.agent_type}\` between existing \`${context.input.existingConfigs.map((c) => c.agentType).join(",")}\``,
            };
          }

          return {
            type: "SUCCESS",
            taskConfig: clone(selected),
          };
          break;
        }

        case "TASK_CONFIG_UNAVAILABLE": {
          const response = result.RESPONSE_TASK_CONFIG_UNAVAILABLE;
          if (!response) {
            throw new Error(`RESPONSE_SELECT_TASK_CONFIG is missing`);
          }

          return {
            type: "ERROR",
            explanation: response.explanation,
          };
        }
      }
    } catch (err) {
      let explanation;
      if (err instanceof Error) {
        explanation = `Unexpected error \`${err.name}\` when processing agent config initializer result. The error message: ${err.message}`;
      } else {
        explanation = `Unexpected error \`${String(err)}\` when processing agent config initializer result.`;
      }

      return {
        type: "ERROR",
        explanation,
      };
    }
  }

  get protocol() {
    return protocol;
  }

  protected systemPrompt(input: TaskConfigInitializerInput) {
    return prompt(input);
  }
}
