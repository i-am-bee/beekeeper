import { LLMCall } from "@/agents/supervisor-workflow/llm-call.js";
import * as laml from "@/laml/index.js";
import { Logger } from "beeai-framework";
import { clone } from "remeda";
import {
  TaskConfigInitializerInput,
  TaskConfigInitializerOutput,
} from "./dto.js";
import { prompt } from "./prompt.js";
import { protocol } from "./protocol.js";
import { TaskConfigInitializerTool } from "./tool.js";

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
            config: {
              agentKind: "operator",
              agentType: response.agent_type,
              taskKind: "operator",
              taskType: response.task_type,
              description: response.description,
              taskConfigInput: response.task_config_input,
            },
            actingAgentId: context.input.actingAgentId,
          });
          return {
            type: "SUCCESS",
            taskConfig: {
              agentType: toolCallResult.result.data.agentType,
              taskType: toolCallResult.result.data.taskType,
              description: toolCallResult.result.data.description,
              taskConfigInput: toolCallResult.result.data.taskConfigInput,
            },
          };
        }
        case "UPDATE_TASK_CONFIG": {
          const response = result.RESPONSE_UPDATE_TASK_CONFIG;
          if (!response) {
            throw new Error(`RESPONSE_UPDATE_TASK_CONFIG is missing`);
          }

          toolCallResult = await this.tool.run({
            method: "updateTaskConfig",
            taskKind: "operator",
            taskType: response.task_type,
            config: {
              description: response.description,
              taskConfigInput: response.task_config_input,
            },
            actingAgentId: context.input.actingAgentId,
          });
          return {
            type: "SUCCESS",
            taskConfig: {
              agentType: toolCallResult.result.data.agentType,
              taskType: toolCallResult.result.data.taskType,
              description: toolCallResult.result.data.description,
              taskConfigInput: toolCallResult.result.data.taskConfigInput,
            },
          };
        }
        case "SELECT_TASK_CONFIG": {
          const response = result.RESPONSE_SELECT_TASK_CONFIG;
          if (!response) {
            throw new Error(`RESPONSE_SELECT_TASK_CONFIG is missing`);
          }

          const selected = context.input.existingTaskConfigs.find(
            (c) => c.taskType === response.task_type,
          );

          if (!selected) {
            return {
              type: "ERROR",
              explanation: `Can't find selected task config \`${response.task_type}\` between existing \`${context.input.existingTaskConfigs.map((c) => c.agentType).join(",")}\``,
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
            throw new Error(`RESPONSE_TASK_CONFIG_UNAVAILABLE is missing`);
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
