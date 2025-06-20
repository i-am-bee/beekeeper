import { RequestHandlerOutput } from "../../request-handler/dto.js";
import { Fixtures } from "./fixtures.js";

export interface ChoiceExplanations {
  requestHandler: string;
  problemDecomposer: string;
  steps: {
    no: number;
    agentConfig: string;
    taskConfig: string;
    taskRun: string;
  }[];
}

export class WorkflowComposeFixture<
  TTools extends Fixtures<any, any> = Fixtures<any, any>,
  TTaskSteps extends Fixtures<any, any> = Fixtures<any, any>,
  TAgents extends Fixtures<any, any> = Fixtures<any, any>,
  TTasks extends Fixtures<any, any> = Fixtures<any, any>,
  TTaskRuns extends Fixtures<any, any> = Fixtures<any, any>,
> {
  constructor(
    public readonly title: string,
    public readonly request: string,
    public readonly choiceExplanations: ChoiceExplanations,
    public readonly requestHandlerOutput: RequestHandlerOutput["response"],
    public readonly taskSteps: TTaskSteps,
    public readonly tools: TTools,
    public readonly agents: TAgents,
    public readonly tasks: TTasks,
    public readonly taskRuns: TTaskRuns,
  ) {}

  getChoiceExplanation(
    stepNo: number,
    type: "agentConfig" | "taskConfig" | "taskRun",
  ) {
    const explanation = this.choiceExplanations.steps.find(
      (step) => step.no === stepNo,
    )?.[type];

    if (!explanation) {
      throw new Error(
        `No explanation found for step ${stepNo} and type ${type}`,
      );
    }

    return explanation;
  }
}
