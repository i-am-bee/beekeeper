import { WorkflowComposeFixture } from "@/agents/supervisor/workflow/fixtures/base/workflow-compose-fixtures.js";
import {
  BaseCreateExampleInput,
  ExampleInput,
} from "@/agents/supervisor/workflow/fixtures/helpers/create-example.js";
import { prepareDataForWorkflowStep } from "@/agents/supervisor/workflow/fixtures/helpers/prepare-resources.js";
import { unwrapTaskStepWithAgent } from "@/agents/supervisor/workflow/fixtures/helpers/unwrap-task-step.js";
import { TaskStepMapper } from "@/agents/supervisor/workflow/workflow-composer/helpers/task-step/task-step-mapper.js";
import { AgentConfigTiny } from "../../dto.js";
import { protocol } from "../../protocol.js";

export interface CreateAgentExampleInput<F extends WorkflowComposeFixture>
  extends BaseCreateExampleInput<F> {
  readonly scenario: "CREATE_AGENT_CONFIG";
  responseChoiceExplanation?: string;
}

export interface SelectAgentExampleInput<F extends WorkflowComposeFixture>
  extends BaseCreateExampleInput<F> {
  readonly scenario: "SELECT_AGENT_CONFIG";
  responseChoiceExplanation?: string;
}

export interface UpdateAgentExampleInput<F extends WorkflowComposeFixture>
  extends BaseCreateExampleInput<F> {
  readonly scenario: "UPDATE_AGENT_CONFIG";
  responseChoiceExplanation: string;
  update: Partial<Omit<AgentConfigTiny, "agentType" | "instructions">>;
}

export interface AgentUnavailableExampleInput<F extends WorkflowComposeFixture>
  extends BaseCreateExampleInput<F> {
  readonly scenario: "AGENT_CONFIG_UNAVAILABLE";
  responseChoiceExplanation: string;
  explanation: string;
  override: {
    tools: (original: F["tools"]["values"]) => F["tools"]["values"];
  };
}

export type CreateExampleInputType<
  F extends WorkflowComposeFixture = WorkflowComposeFixture,
> =
  | CreateAgentExampleInput<F>
  | SelectAgentExampleInput<F>
  | UpdateAgentExampleInput<F>
  | AgentUnavailableExampleInput<F>;

export function createExampleInput<F extends WorkflowComposeFixture>(
  input: CreateExampleInputType<F>,
): ExampleInput<typeof protocol> {
  const {
    scenario,
    step,
    responseChoiceExplanation,
    fixtures,
    subtitle,
    note,
  } = input;

  const fullSubtitle = `${subtitle ?? fixtures.title}${note ? ` (${note})` : ""}`;

  const stepNo = fixtures.taskSteps.stepNo(step);

  const { resources, previousSteps, taskStep } = prepareDataForWorkflowStep(
    fixtures,
    "agentConfigInitializer",
    stepNo,
  );

  switch (scenario) {
    case "CREATE_AGENT_CONFIG": {
      const {
        resource: { agent },
      } = unwrapTaskStepWithAgent(fixtures.taskSteps.get(step));

      return {
        title: scenario,
        subtitle: fullSubtitle,
        user: TaskStepMapper.format(taskStep),
        context: {
          previousSteps,
          resources,
        },
        example: {
          RESPONSE_CHOICE_EXPLANATION:
            responseChoiceExplanation ??
            fixtures.getChoiceExplanation(stepNo, "agentConfig"),
          RESPONSE_TYPE: scenario,
          RESPONSE_CREATE_AGENT_CONFIG: {
            agent_type: agent.agentType,
            tools: agent.tools,
            description: agent.description,
          },
        },
      };
    }
    case "SELECT_AGENT_CONFIG": {
      const {
        resource: { agent },
      } = unwrapTaskStepWithAgent(fixtures.taskSteps.get(step));

      return {
        title: scenario,
        subtitle: fullSubtitle,
        user: TaskStepMapper.format(taskStep),
        context: {
          previousSteps,
          resources,
        },
        example: {
          RESPONSE_CHOICE_EXPLANATION:
            responseChoiceExplanation ??
            fixtures.getChoiceExplanation(stepNo, "agentConfig"),
          RESPONSE_TYPE: scenario,
          RESPONSE_SELECT_AGENT_CONFIG: {
            agent_type: agent.agentType,
          },
        },
      };
    }
    case "UPDATE_AGENT_CONFIG": {
      const {
        resource: { agent },
      } = unwrapTaskStepWithAgent(fixtures.taskSteps.get(step));
      const { update } = input;

      return {
        title: scenario,
        subtitle: fullSubtitle,
        user: TaskStepMapper.format(taskStep),
        context: {
          previousSteps,
          resources,
        },
        example: {
          RESPONSE_CHOICE_EXPLANATION: responseChoiceExplanation,
          RESPONSE_TYPE: scenario,
          RESPONSE_UPDATE_AGENT_CONFIG: {
            agent_type: agent.agentType,
            ...update,
          },
        },
      };
    }
    case "AGENT_CONFIG_UNAVAILABLE": {
      const {
        override: { tools: overrideTools },
        explanation,
      } = input;

      return {
        title: scenario,
        subtitle: fullSubtitle,
        user: TaskStepMapper.format(taskStep),
        context: {
          previousSteps,
          resources: {
            ...resources,
            tools: overrideTools(resources.tools),
          },
        },
        example: {
          RESPONSE_CHOICE_EXPLANATION: responseChoiceExplanation,
          RESPONSE_TYPE: scenario,
          RESPONSE_AGENT_CONFIG_UNAVAILABLE: {
            explanation,
          },
        },
      };
    }
  }
}
