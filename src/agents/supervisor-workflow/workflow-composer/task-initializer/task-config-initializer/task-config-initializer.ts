import {
  LLMCall,
  LLMCallInput,
} from "@/agents/supervisor-workflow/base/llm-call.js";
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
import { AgentIdValue } from "@/agents/registry/dto.js";
import { Context } from "@/agents/supervisor-workflow/base/context.js";

export class TaskConfigInitializer extends LLMCall<
  typeof protocol,
  TaskConfigInitializerInput,
  TaskConfigInitializerOutput
> {
  protected tool: TaskConfigInitializerTool;

  get protocol() {
    return protocol;
  }

  constructor(logger: Logger, agentId: AgentIdValue) {
    super(logger, agentId);
    this.tool = new TaskConfigInitializerTool();
  }

  protected systemPrompt(input: TaskConfigInitializerInput) {
    return prompt(input);
  }

  protected async processResult(
    result: laml.ProtocolResult<typeof protocol>,
    input: LLMCallInput<TaskConfigInitializerInput>,
    ctx: Context,
  ): Promise<TaskConfigInitializerOutput> {
    const { onUpdate } = ctx;

    try {
      let toolCallResult;
      switch (result.RESPONSE_TYPE) {
        case "CREATE_TASK_CONFIG": {
          const response = result.RESPONSE_CREATE_TASK_CONFIG;
          if (!response) {
            throw new Error(`RESPONSE_CREATE_TASK_CONFIG is missing`);
          }

          const config = {
            agentKind: "operator",
            agentType: response.agent_type,
            taskKind: "operator",
            taskType: response.task_type,
            description: response.description,
            taskConfigInput: response.task_config_input,
          } as const;

          this.handleOnUpdate(onUpdate, {
            type: result.RESPONSE_TYPE,
            value: `I'm going to create a brand new task config \`${config.taskType}\` for agent \`${config.agentType}\``,
          });
          this.handleOnUpdate(onUpdate, {
            value: JSON.stringify(config, null, " "),
          });

          toolCallResult = await this.tool.run({
            method: "createTaskConfig",
            config,
            actingAgentId: input.data.actingAgentId,
          });
          return {
            type: "SUCCESS",
            result: {
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

          const config = {
            description: response.description,
            taskConfigInput: response.task_config_input,
          };

          this.handleOnUpdate(onUpdate, {
            type: result.RESPONSE_TYPE,
            value: `I'm going to update an existing agent config \`${response.task_config_input}\``,
          });
          this.handleOnUpdate(onUpdate, {
            value: JSON.stringify(config, null, " "),
          });

          toolCallResult = await this.tool.run({
            method: "updateTaskConfig",
            taskKind: "operator",
            taskType: response.task_type,
            config,
            actingAgentId: input.data.actingAgentId,
          });
          return {
            type: "SUCCESS",
            result: {
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

          this.handleOnUpdate(onUpdate, {
            type: result.RESPONSE_TYPE,
            value: `I'm going to pick an existing task config \`${response.task_type}\``,
          });

          const selected = input.data.existingTaskConfigs.find(
            (c) => c.taskType === response.task_type,
          );

          if (!selected) {
            return {
              type: "ERROR",
              explanation: `Can't find selected task config \`${response.task_type}\` between existing \`${input.data.existingTaskConfigs.map((c) => c.agentType).join(",")}\``,
            };
          }

          return {
            type: "SUCCESS",
            result: clone(selected),
          };
          break;
        }

        case "TASK_CONFIG_UNAVAILABLE": {
          const response = result.RESPONSE_TASK_CONFIG_UNAVAILABLE;
          if (!response) {
            throw new Error(`RESPONSE_TASK_CONFIG_UNAVAILABLE is missing`);
          }

          this.handleOnUpdate(onUpdate, {
            type: result.RESPONSE_TYPE,
            value: `There is no suitable task config`,
          });

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
}
