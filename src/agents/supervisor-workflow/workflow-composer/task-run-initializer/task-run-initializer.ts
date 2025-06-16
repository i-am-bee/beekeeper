import { AgentIdValue } from "@/agents/registry/dto.js";
import * as laml from "@/laml/index.js";
import { Logger } from "beeai-framework";
import { Context } from "vm";
import { LLMCall, LLMCallInput } from "../../base/llm-call.js";
import { FnResult } from "../../base/retry/types.js";
import { extendResources } from "../helpers/resources/utils.js";
import { TaskStep } from "../helpers/task-step/dto.js";
import { assignResource } from "../helpers/task-step/helpers/assign-resource.js";
import { TaskRunInitializerInput, TaskRunInitializerOutput } from "./dto.js";
import { prompt } from "./prompt.js";
import { protocol } from "./protocol.js";
import { TaskRunInitializerTool } from "./tool.js";

export class TaskRunInitializer extends LLMCall<
  typeof protocol,
  TaskRunInitializerInput,
  TaskRunInitializerOutput
> {
  protected tool: TaskRunInitializerTool;

  get protocol() {
    return protocol;
  }

  constructor(logger: Logger, agentId: AgentIdValue) {
    super(logger, agentId);
    this.tool = new TaskRunInitializerTool();
  }

  protected systemPrompt(input: TaskRunInitializerInput) {
    return prompt(input);
  }

  protected async processResult(
    result: laml.ProtocolResult<typeof protocol>,
    input: LLMCallInput<TaskRunInitializerInput>,
    { onUpdate }: Context,
  ): Promise<FnResult<TaskRunInitializerOutput>> {
    const { data } = input;
    const { taskStep, previousSteps, resources } = data;

    try {
      switch (result.RESPONSE_TYPE) {
        case "CREATE_TASK_RUN": {
          const response = result.RESPONSE_CREATE_TASK_RUN;
          if (!response) {
            throw new Error(`RESPONSE_CREATE_TASK_RUN is missing`);
          }

          if (taskStep.resource.type !== "task") {
            throw new Error(
              `Expected taskStep.resource.type to be 'task', but got '${input.data.taskStep.resource.type}'`,
            );
          }

          const taskConfig = taskStep.resource.task;

          const collectBlockedByTaskRunIds = (
            taskStep: TaskStep,
            previousSteps: TaskStep[],
          ) => {
            return (taskStep.dependencies || []).map((dependency) => {
              const previousStep = previousSteps.find(
                (step) => step.no === dependency,
              );
              if (!previousStep) {
                throw new Error(
                  `Previous step with step.no '${dependency}' not found in previousSteps.`,
                );
              }

              if (previousStep.resource.type !== "task_run") {
                throw new Error(
                  `Expected previous step resource type to be 'task_run', but got '${previousStep.resource.type}'`,
                );
              }
              return previousStep.resource.taskRun.taskRunId;
            });
          };

          const toolInput = {
            method: "createTaskRun",
            taskType: taskConfig.taskType,
            actingAgentId: this.agentId,
            taskRunInput: response.task_run_input,
            originTaskRunId: input.data.originTaskRunId,
            blockedByTaskRunIds: collectBlockedByTaskRunIds(
              taskStep,
              previousSteps,
            ),
          } as const;

          const {
            result: { data: taskRun },
          } = await this.tool.run(toolInput);

          return {
            type: "SUCCESS",
            result: {
              resources: extendResources(resources, {
                taskRuns: [taskRun],
              }),
              taskStep: assignResource(taskStep, {
                type: "task_run",
                taskRun,
              }),
            },
          };
        }
        case "TASK_RUN_UNAVAILABLE": {
          const response = result.RESPONSE_TASK_RUN_UNAVAILABLE;
          if (!response) {
            throw new Error(`RESPONSE_TASK_RUN_UNAVAILABLE is missing`);
          }

          this.handleOnUpdate(onUpdate, {
            type: result.RESPONSE_TYPE,
            value: `The suitable task run can't be created`,
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
        explanation = `Unexpected error \`${err.name}\` when processing task run initializer result. The error message: ${err.message}`;
      } else {
        explanation = `Unexpected error \`${String(err)}\` when processing task run initializer result.`;
      }

      return {
        type: "ERROR",
        explanation,
      };
    }
  }
}
