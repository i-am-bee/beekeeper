import { WorkflowComposeFixture } from "@/agents/supervisor-workflow/fixtures/base/workflow-compose-fixtures.js";
import { unwrapTaskStepWithToolsOrLLM } from "@/agents/supervisor-workflow/fixtures/helpers/unwrap-task-step.js";
import { Resources } from "@/agents/supervisor-workflow/workflow-composer/helpers/resources/dto.js";
import { TaskStep } from "@/agents/supervisor-workflow/workflow-composer/helpers/task-step/dto.js";
import { TaskStepMapper } from "@/agents/supervisor-workflow/workflow-composer/helpers/task-step/task-step-mapper.js";
import * as laml from "@/laml/index.js";
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

export function createExampleInput<F extends WorkflowComposeFixture>({
  scenario,
  subtitle,
  note,
  fixtures,
}: {
  scenario: "STEP_SEQUENCE";
  subtitle?: string;
  note?: string;
  fixtures: F;
}) {
  switch (scenario) {
    case "STEP_SEQUENCE": {
      const user = fixtures.requestHandlerOutput;
      const tools = fixtures.tools.values;
      const step_sequence = fixtures.taskSteps.values
        .map(unwrapTaskStepWithToolsOrLLM)
        .map(TaskStepMapper.format);
      const fullSubtitle = `${subtitle ?? fixtures.title}${note ? `(${note})` : ""}`;
      return {
        title: scenario,
        subtitle: fullSubtitle,
        user,
        context: {
          previousSteps: [],
          resources: {
            tools,
            agents: [], // Unused in this step
            tasks: [], // Unused in this step
            taskRuns: [], // Unused in this step
          },
        },
        example: {
          RESPONSE_CHOICE_EXPLANATION:
            fixtures.choiceExplanations.problemDecomposer,
          RESPONSE_TYPE: "STEP_SEQUENCE",
          RESPONSE_STEP_SEQUENCE: {
            step_sequence,
          },
        },
      } satisfies ExampleInput;
    }
  }
}
