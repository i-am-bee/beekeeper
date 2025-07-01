import {
  ContainerComponent,
  ParentInput,
  ScreenInput,
} from "@/ui/base/monitor.js";
import { ControllableContainer } from "@/ui/controls/controls-manager.js";
import { Logger } from "beeai-framework";
import blessed from "neo-blessed";
import { getRunListStyle } from "../config.js";
import { WorkflowPopupDataProvider } from "../data-provider.js";
import { Phases, PhaseType } from "./components/phases.js";
import { InputOutputScreen } from "./screens/input-output-screen.js";

export class WorkflowExplorer extends ContainerComponent {
  private _container: ControllableContainer;
  private dataProvider: WorkflowPopupDataProvider;
  private phases: Phases;
  private ioScreen: InputOutputScreen;

  get container() {
    return this._container;
  }

  constructor(
    arg: ParentInput | ScreenInput,
    logger: Logger,
    dataProvider: WorkflowPopupDataProvider,
  ) {
    super(arg, logger);
    this.dataProvider = dataProvider;
    this._container = this.controlsManager.add({
      kind: "container",
      name: "workflow_container",
      element: blessed.box({
        parent: this.parent.element,
        top: 3,
        left: 30,
        label: " Workflow ",
        width: "100%-32",
        height: "100%-10",
        tags: true,
        focusable: false,
        keys: false,
        mouse: false,
        vi: false,
        align: "center",
        valign: "middle",
        border: {
          type: "line",
        },
        style: getRunListStyle(),
      }),
      parent: this.parent,
    });

    this.phases = new Phases(this._container.element);
    this.phases.render({
      items: [
        { type: PhaseType.REQUEST_HANDLER, label: "Request Handler" },
        { type: PhaseType.PROBLEM_DECOMPOSER, label: "Problem Decomposer" },
        { type: PhaseType.TASK_STEP, label: "Task Step" },
      ],
      selectedType: PhaseType.TASK_STEP,
    });

    // this.ioScreen = new InputOutputScreen(
    //   {
    //     kind: "parent",
    //     parent: this._container,
    //     controlsManager: this.controlsManager,
    //   },
    //   logger,
    // );
    // this.ioScreen.input = "Sample input data";
    // this.ioScreen.output = "Sample output data";

    this.updateWorkflowExplorer(false);

    this.setupEventHandlers();
    this.setupControls();
  }

  private setupEventHandlers() {
    this.dataProvider.on("workflow:update", () => {
    });
  }

  private updateWorkflowExplorer(shouldRender = true) {
    this._container.element.setContent("No workflow data available");

    if (shouldRender) {
      this.screen.element.render();
    }
  }

  private setupControls(shouldRender = true) {
    if (shouldRender) {
      this.screen.element.render();
    }
  }
}
