import * as laml from "@/laml/index.js";
import { WorkflowComposeFixture } from "@/agents/supervisor-workflow/fixtures/base/workflow-compose-fixtures.js";
import {
  unwrapTaskStepWithAgent,
  unwrapTaskStepWithTask,
} from "@/agents/supervisor-workflow/fixtures/helpers/unwrap-task-step.js";
import { Resources } from "@/agents/supervisor-workflow/workflow-composer/helpers/resources/dto.js";
import { TaskStep } from "@/agents/supervisor-workflow/workflow-composer/helpers/task-step/dto.js";
import { TaskStepMapper } from "@/agents/supervisor-workflow/workflow-composer/helpers/task-step/task-step-mapper.js";
import { protocol } from "../../protocol.js";

export interface ExampleInput {
  title: string;
  subtitle: string;
  user: string;
  context: {
    previousSteps: TaskStep[];
    resources: Resources;
  };
  example: laml.ProtocolResult<typeof protocol>;
}

export function createExampleInput<F extends WorkflowComposeFixture>(
  scenario: "CREATE_AGENT_CONFIG",
  subtitle: string,
  step: Parameters<F["taskSteps"]["get"]>[0],
  fixtures: F,
) {
  switch (scenario) {
    case "CREATE_AGENT_CONFIG": {
      const currentStep = unwrapTaskStepWithAgent(fixtures.taskSteps.get(step));

      // All tools are already available regardless of whether they are used by any agent
      const tools = fixtures.tools.values;

      // All previous steps already have assigned tasks
      const previousSteps = fixtures.taskSteps.values
        .filter((p) => p.no < currentStep.no)
        .map((p) => unwrapTaskStepWithTask(p)); // Previous steps have tasks

      // Agents from the previous steps are available
      const agents = fixtures.taskSteps.values
        .filter((p) => p.no < currentStep.no)
        .map((p) => unwrapTaskStepWithAgent(p).resource.agent); // Previous steps have tasks

      // Tasks from previous steps are available
      const tasks = previousSteps.map((p) => p.resource.task);

      const {
        resource: { agent },
      } = unwrapTaskStepWithAgent(fixtures.taskSteps.get(step));

      return {
        title: scenario,
        subtitle,
        user: TaskStepMapper.format(currentStep),
        context: {
          previousSteps,
          resources: {
            tools,
            agents,
            tasks,
            taskRuns: [], // Not provided in task initialization
          },
        },
        example: {
          RESPONSE_CHOICE_EXPLANATION:
            "No existing agent config matches the request; a new agent config is required.",
          RESPONSE_TYPE: "CREATE_AGENT_CONFIG",
          RESPONSE_CREATE_AGENT_CONFIG: {
            instructions: agent.instructions,
            tools: agent.tools,
            agent_type: agent.agentType,
            description: agent.description,
          },
        },
      } satisfies ExampleInput;
    }
  }
}
