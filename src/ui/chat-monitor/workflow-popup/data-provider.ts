import {
  StateUpdateType,
  SupervisorWorkflowStateBuilder,
} from "@/agents/supervisor/workflow/state/builder.js";
import EventEmitter from "events";
import { FlowStep, FlowStepper } from "./helpers/flow-stepper.js";

interface WorkflowPopupDataProviderEvents {
  "run:select": () => void;
  "run:data": (isEmpty: boolean) => void;
  "workflow:select": () => void;
  "mode:change": (mode: WorkflowDataProviderMode) => void;
  "auto_play:change": (enabled: boolean) => void;
  "auto_popup:change": (enabled: boolean) => void;
}

export enum WorkflowDataProviderMode {
  PLAY = "play",
  PAUSE = "pause",
}

export interface WorkflowSelection {
  runIndex: number;
  innerPath: string[];
}

const nodeFlow = () =>
  [
    { attr: "input", optional: false },
    { attr: "errors", optional: true, array: true },
    { attr: "output", optional: false },
  ] satisfies FlowStep[];
const agentConfigInitializerFlow = () =>
  [
    { attr: "input", optional: false },
    { attr: "agent_instructions_builder", optional: false, flow: nodeFlow() },
    { attr: "output", optional: false },
  ] satisfies FlowStep[];
const taskStepFlow = () =>
  [
    {
      attr: "agent_config_initializer",
      optional: true,
      flow: agentConfigInitializerFlow(),
    },
    { attr: "task_config_initializer", optional: false, flow: nodeFlow() },
    { attr: "task_run_initializer", optional: false },
  ] satisfies FlowStep[];

const supervisorWorkflowRunFlow = () =>
  [
    { attr: "input", optional: false },
    { attr: "requestHandler", optional: true, flow: nodeFlow() },
    { attr: "problemDecomposer", optional: true, flow: nodeFlow() },
    { attr: "task_steps", optional: true, array: true, flow: taskStepFlow() },
    { attr: "output", optional: false },
  ] satisfies FlowStep[];

export class WorkflowPopupDataProvider extends EventEmitter {
  private stateBuilder: SupervisorWorkflowStateBuilder;
  private workflowStateLogPath?: string;
  private _mode: WorkflowDataProviderMode;
  private _selectedRunIndex?: number;
  private _hasRuns = false;
  private _autoPlayEnabled = true;
  private _autoPopupEnabled = true;
  private workflowStepper: FlowStepper;

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

  get state() {
    return this.stateBuilder.getState();
  }

  get mode() {
    return this._mode;
  }

  get isPlaying() {
    return this._mode === WorkflowDataProviderMode.PLAY;
  }

  get hasRuns() {
    return this._hasRuns;
  }

  get autoPlayEnabled() {
    return this._autoPlayEnabled;
  }

  get autoPopupEnabled() {
    return this._autoPopupEnabled;
  }

  constructor(workflowStateLogPath: string, mode: WorkflowDataProviderMode) {
    super();
    this.stateBuilder = new SupervisorWorkflowStateBuilder();
    this._mode = mode;
    this.workflowStateLogPath = workflowStateLogPath;
    this.workflowStepper = new FlowStepper(supervisorWorkflowRunFlow(), () =>
      this.stateBuilder.getState(),
    );

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    this.stateBuilder.on("state:updated", ({ type, ids }) => {
      switch (type) {
        case StateUpdateType.SUPERVISOR_WORKFLOW_RUN:
          if (!this._hasRuns && this.stateBuilder.getState().runs.length > 0) {
            this._hasRuns = true;
          }
          this.emit("run:data", !this._hasRuns);
          break;
      }
    });
  }

  toggleAutoPlay(): void {
    this._autoPlayEnabled = !this._autoPlayEnabled;
    this.emit("auto_play:change", this._autoPlayEnabled);
  }

  toggleAutoPopup() {
    this._autoPopupEnabled = !this._autoPopupEnabled;
    this.emit("auto_popup:change", this._autoPopupEnabled);
  }

  changeMode(mode: WorkflowDataProviderMode) {
    if (this._mode === mode) {
      return; // No change, do nothing
    }
    this._mode = mode;
    this.emit("mode:change", mode);
  }

  selectRun(runIndex: number) {
    if (this._selectedRunIndex === runIndex) {
      return; // No change, do nothing
    }
    this._selectedRunIndex = runIndex;
    this.emit("run:select");
  }

  async start() {
    if (!this.workflowStateLogPath) {
      throw new Error("Workflow state log path is not set.");
    }
    // First read the entire log to build initial state
    await this.stateBuilder.watchLogFile(this.workflowStateLogPath);
  }
}
