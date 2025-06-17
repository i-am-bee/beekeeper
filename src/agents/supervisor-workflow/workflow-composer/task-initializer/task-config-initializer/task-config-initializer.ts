import { AgentIdValue } from "@/agents/registry/dto.js";
import { Context } from "@/agents/supervisor-workflow/base/context.js";
import {
  LLMCall,
  LLMCallInput,
} from "@/agents/supervisor-workflow/base/llm-call.js";
import { FnResult } from "@/agents/supervisor-workflow/base/retry/types.js";
import * as laml from "@/laml/index.js";
import { Logger } from "beeai-framework";
import { clone } from "remeda";
import {
  extendResources,
  replaceTaskByTaskTypeInResources,
} from "../../helpers/resources/utils.js";
import { assignResource } from "../../helpers/task-step/helpers/assign-resource.js";
import {
  TaskConfigInitializerInput,
  TaskConfigInitializerOutput,
} from "./dto.js";
import { prompt } from "./prompt.js";
import { protocol } from "./protocol.js";
import { TaskConfigInitializerTool } from "./tool.js";
import { TaskStepInputParameter } from "../../helpers/task-step/dto.js";

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
  ): Promise<FnResult<TaskConfigInitializerOutput>> {
    const { onUpdate } = ctx;
    const {
      data: { resources, taskStep },
    } = input;

    const { agents: existingAgentConfigs, tasks: existingTaskConfigs } =
      resources;

    const getMissingTaskTypes = (taskTypes: string | string[]) => {
      return (typeof taskTypes === "string" ? [taskTypes] : taskTypes).filter(
        (taskType) => !existingTaskConfigs.find((c) => c.taskType === taskType),
      );
    };

    const getMissingAgentTypes = (agentTypes: string | string[]) => {
      return (
        typeof agentTypes === "string" ? [agentTypes] : agentTypes
      ).filter(
        (agentType) =>
          !existingAgentConfigs.find((c) => c.agentType === agentType),
      );
    };

    try {
      switch (result.RESPONSE_TYPE) {
        case "CREATE_TASK_CONFIG": {
          const response = result.RESPONSE_CREATE_TASK_CONFIG;
          if (!response) {
            throw new Error(`RESPONSE_CREATE_TASK_CONFIG is missing`);
          }

          const sanitizeTaskConfigInput = (
            input: string,
            parameters: TaskStepInputParameter[],
          ) => {
            // Remove empty json object
            input = input.trim().replace(/^\{\s*\}$/, "");

            // No input or all parameters have dependencies
            if (
              !input ||
              !input.length ||
              parameters.every((p) => p.dependencies?.length)
            ) {
              return "";
            }
            return input;
          };

          const config = {
            agentKind: "operator",
            agentType: response.agent_type,
            taskKind: "operator",
            taskType: response.task_type,
            description: response.description,
            taskConfigInput: sanitizeTaskConfigInput(
              response.task_config_input,
              input.data.taskStep.inputs || [],
            ),
          } as const;

          this.handleOnUpdate(onUpdate, {
            type: result.RESPONSE_TYPE,
            value: `I'm going to create a brand new task config \`${config.taskType}\` for agent \`${config.agentType}\``,
          });

          if (response.agent_type) {
            const missingAgentTypes = getMissingAgentTypes(response.agent_type);
            if (missingAgentTypes.length > 0) {
              return {
                type: "ERROR",
                explanation: existingAgentConfigs.length
                  ? `You can't create a task config with agent_type:\`${response.agent_type}\` because it doesn't exist. The only existing agents are: \`${existingAgentConfigs.map((c) => c.agentType).join(", ")}\`. Please use one of them.`
                  : `You can't create a task config with agent_type:\`${response.agent_type}\` because there are no existing agents. Please create an agent first.`,
              };
            }
          }

          const toolCallResult = await this.tool.run({
            method: "createTaskConfig",
            config,
            actingAgentId: input.data.actingAgentId,
          });

          const {
            result: { data: task },
          } = toolCallResult;

          return {
            type: "SUCCESS",
            result: {
              resources: extendResources(resources, {
                tasks: [task],
              }),
              taskStep: assignResource(taskStep, {
                type: "task",
                task,
              }),
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
            payload: { toJson: config },
          });

          const missingTaskTypes = getMissingTaskTypes(response.task_type);
          if (missingTaskTypes.length > 0) {
            return {
              type: "ERROR",
              explanation: existingTaskConfigs.length
                ? `You can't update task config task_type:\`${response.task_type}\` because it doesn't exist. The only existing tasks are: \`${existingTaskConfigs.map((c) => c.taskType).join(", ")}\`. Please use one of them or create new one.`
                : `You can't update task config task_type:\`${response.task_type}\` because there are no existing tasks. Please create a task first.`,
            };
          }

          if (response.agent_type) {
            const missingAgentTypes = getMissingAgentTypes(response.agent_type);
            if (missingAgentTypes.length > 0) {
              return {
                type: "ERROR",
                explanation: `You can't update task config agent type to \`${response.agent_type}\` because it doesn't exist. The only existing agents are: \`${existingAgentConfigs.map((c) => c.agentType).join(", ")}\`. Please use one of them.`,
              };
            }
          }

          const toolCallResult = await this.tool.run({
            method: "updateTaskConfig",
            taskKind: "operator",
            taskType: response.task_type,
            config,
            actingAgentId: input.data.actingAgentId,
          });

          const {
            result: { data: task },
          } = toolCallResult;

          return {
            type: "SUCCESS",
            result: {
              resources: replaceTaskByTaskTypeInResources(resources, task),
              taskStep: assignResource(taskStep, {
                type: "task",
                task,
              }),
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

          const selected = existingTaskConfigs.find(
            (c) => c.taskType === response.task_type,
          );

          if (!selected) {
            return {
              type: "ERROR",
              explanation: existingTaskConfigs.length
                ? `You can't select task config with task_type:\`${response.task_type}\` because it doesn't exist. The only existing tasks are:\`${existingTaskConfigs.map((c) => c.taskType).join(",")}\`. Please use one of them.`
                : `You can't select task config with task_type:\`${response.task_type}\` because there are no existing tasks. Please create a task config first.`,
            };
          }

          return {
            type: "SUCCESS",
            result: {
              resources: clone(resources),
              taskStep: assignResource(taskStep, {
                type: "task",
                task: selected,
              }),
            },
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
        explanation = `Unexpected error \`${err.name}\` when processing task config initializer result. The error message: ${err.message}`;
      } else {
        explanation = `Unexpected error \`${String(err)}\` when processing task config initializer result.`;
      }

      return {
        type: "ERROR",
        explanation,
      };
    }
  }
}
