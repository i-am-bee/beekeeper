import * as laml from "@/laml/index.js";
import { Resources } from "../../workflow-composer/helpers/resources/dto.js";
import { TaskStep } from "../../workflow-composer/helpers/task-step/dto.js";
import { WorkflowComposeFixture } from "../base/workflow-compose-fixtures.js";

export interface BaseCreateExampleInput<F extends WorkflowComposeFixture> {
  step: Parameters<F["taskSteps"]["get"]>[0];
  fixtures: F;
  subtitle?: string;
  note?: string;
}

export interface ExampleInput<P> {
  title: string;
  subtitle: string;
  user: string;
  context: {
    previousSteps: TaskStep[];
    resources: Resources;
  };
  example: laml.ProtocolResult<P>;
}
