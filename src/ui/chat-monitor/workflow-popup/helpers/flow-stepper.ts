import EventEmitter from "events";
import { clone } from "remeda";
import { DataStepper } from "./data-stepper.js";
import {
  getArrayOnPath,
  getValueOnPath
} from "./flow-stepper-utils.js";

export interface FlowStep {
  /**
   * Property name (object) or index (array element)
   */
  attr: string | number;

  /**
   * Whether this level represents an array property. When true, its `flow`
   * should contain steps whose `attr` values are **indices** (number).
   */
  array?: boolean;

  /**
   * When present, describes the nested structure that should be stepped
   * through **after** this level.
   */
  flow?: FlowStep[];

  /**
   * Step can be skipped by the consumer – **DataStepper** itself does not
   * treat this flag specially but it is included here to mirror the full
   * domain model.
   */
  optional?: boolean;
}

interface WorkflowPopupDataProviderEvents {
  "step:change": (state: {
    step: FlowStep;
    path: (string | number)[];
    forwardPossible: boolean;
    backwardPossible: boolean;
  }) => void;
}

export interface FlowStepState {
  path: string;
  forwardPossible: boolean;
  backwardPossible: boolean;
}

export class FlowStepper extends EventEmitter {
  private stepsDefinition: FlowStep[];
  private dataStepper: DataStepper;
  private readState: () => any;

  public on<K extends keyof WorkflowPopupDataProviderEvents>(
    event: K,
    listener: WorkflowPopupDataProviderEvents[K],
  ): this {
    return super.on(event, listener);
  }

  public emit<K extends keyof WorkflowPopupDataProviderEvents>(
    event: K,
    ...args: Parameters<WorkflowPopupDataProviderEvents[K]>
  ): boolean {
    return super.emit(event, ...args);
  }

  constructor(stepsDefinition: FlowStep[], readState: () => any) {
    super();
    if (stepsDefinition.length === 0) {
      throw new Error("Steps cannot be empty");
    }
    this.readState = readState;
    this.stepsDefinition = stepsDefinition;
    this.dataStepper = new DataStepper();
    this.refreshState();
  }

  get currentStepState(): FlowStepState {
    return {
      path: this.dataStepper.currentPath,
      forwardPossible: this.dataStepper.isForwardPossible,
      backwardPossible: this.dataStepper.isBackwardPossible,
    };
  }

  get currentPath(): string {
    return this.dataStepper.currentPath;
  }

  forward(): FlowStepState {
    this.dataStepper.forward();
    return this.currentStepState;
  }

  backward(): FlowStepState {
    this.dataStepper.backward();
    return this.currentStepState;
  }

  refreshState() {
    this.dataStepper.flow = this.collectSteps(clone(this.stepsDefinition));
  }

  private collectSteps(flow: FlowStep[], path: (string | number)[] = []) {
    const result: FlowStep[] = [];
    for (const step of flow) {
      const stepPath = [...path, step.attr];
      const stepValue = getValueOnPath(stepPath, this.readState);
      if (stepValue === undefined) {
        continue; // Skip optional steps that are not present in the state
      }

      if (step.array) {
        const arrayItems = getArrayOnPath(stepPath, this.readState);
        if (arrayItems.length === 0) {
          break;
        }
        const newStep = clone(step);
        newStep.flow = arrayItems.map((_, i) =>
          step.flow
            ? {
                attr: i,
                flow: this.collectSteps(clone(step.flow), stepPath.concat(i)),
              }
            : { attr: i },
        );
        result.push(newStep);
      } else if (step.flow) {
        const newStep = clone(step);
        newStep.flow = this.collectSteps(clone(step.flow), stepPath);
        result.push(newStep);
      } else {
        result.push(clone(step));
      }
    }
    return result;
  }
}
