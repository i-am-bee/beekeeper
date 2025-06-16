import { Logger } from "beeai-framework";
import { Runnable } from "../base/runnable.js";
import { WorkflowComposerInput, WorkflowComposerOutput } from "./dto.js";

export class WorkflowComposer extends Runnable<
  WorkflowComposerInput,
  WorkflowComposerOutput
> {
  constructor(logger: Logger) {
    super(logger);
  }


}
