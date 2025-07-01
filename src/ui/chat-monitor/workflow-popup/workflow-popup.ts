import { keyActionListenerFactory } from "@/ui/controls/key-bindings.js";
import { NavigationDescription } from "@/ui/controls/navigation.js";
import { Logger } from "beeai-framework";
import blessed from "neo-blessed";
import {
  ContainerComponent,
  ParentInput,
  ScreenInput,
} from "../../base/monitor.js";
import { UIConfig } from "../../config.js";
import { ControllableContainer } from "../../controls/controls-manager.js";
import { Controls } from "./components/controls.js";
import { WorkflowRuns } from "./components/workflow-runs.js";
import {
  WorkflowDataProviderMode,
  WorkflowPopupDataProvider,
} from "./data-provider.js";
import { WorkflowExplorer } from "./workflow-explorer/workflow-explorer.js";

export class WorkflowPopup extends ContainerComponent {
  private _container: ControllableContainer;
  private controls: Controls;
  private title: blessed.Widgets.TextElement;
  private workflowExplorer: WorkflowExplorer;
  private workflowRuns: WorkflowRuns;
  private onHide?: () => void;
  private onAutoPopup?: () => void;
  private dataProvider: WorkflowPopupDataProvider; // Assuming this is defined elsewhere
  private _isVisible = false; // Initially hidden

  private initiatorElementId?: string;

  get container() {
    return this._container;
  }

  get isVisible() {
    return this._isVisible;
  }

  constructor(
    arg: ParentInput | ScreenInput,
    logger: Logger,
    workflowStateLogPath: string,
    onAutoPopup?: () => void,
  ) {
    super(arg, logger);

    this.dataProvider = new WorkflowPopupDataProvider(
      workflowStateLogPath,
      WorkflowDataProviderMode.PAUSE,
    );

    this.onAutoPopup = onAutoPopup;

    this._container = this.controlsManager.add({
      kind: "container",
      name: "container",
      element: blessed.box({
        parent: this.parent.element,
        top: "center",
        left: "center",
        width: 150,
        height: 40,
        tags: true,
        focusable: false,
        keys: false,
        mouse: false,
        vi: false,
        border: {
          type: "line",
        },
        style: {
          ...UIConfig.borders.general.focus,
          bg: "black",
        },
        hidden: !this._isVisible, // Initially hidden
      }),
      parent: this.parent,
    });

    this.workflowExplorer = new WorkflowExplorer(
      {
        kind: "parent",
        parent: this._container,
        controlsManager: this.controlsManager,
      },
      logger,
      this.dataProvider,
    );

    this.workflowRuns = new WorkflowRuns(
      {
        kind: "parent",
        parent: this._container,
        controlsManager: this.controlsManager,
      },
      logger,
      this.dataProvider,
    );

    this.title = blessed.text({
      parent: this._container.element,
      top: 1,
      left: "center",
      content: "Supervisor Workflow",
      focusable: false,
      keys: false,
      mouse: false,
      style: {
        bold: true,
        fg: "white",
      },
    });

    // Send/abort button
    this.controls = new Controls(
      {
        kind: "parent",
        parent: this._container,
        controlsManager: this.controlsManager,
      },
      logger,
      this.dataProvider,
    );
    this.setupEventHandlers();
    this.setupControls();
    this.dataProvider.start();
  }

  private setupEventHandlers() {
    // this.state.on("state:updated", ({ type }) => {
    //   switch (type) {
    //     case StateUpdateType.SUPERVISOR_WORKFLOW_RUN:
    //       break;
    //   }
    // });
  }

  private setupControls(shouldRender = true) {
    // Shortcuts
    this.controlsManager.updateKeyActions(this.container.id, {
      kind: "exclusive",
      actions: [
        {
          key: ["C-c", "escape", "enter"],
          action: {
            description: NavigationDescription.HIDE,
            listener: keyActionListenerFactory(() => {
              this.hide();
            }),
          },
        },
        {
          key: ["t"],
          action: {
            description: NavigationDescription.TOGGLE_AUTO_POPUP,
            listener: keyActionListenerFactory(() => {
              this.toggleAutoPopup();
            }),
          },
        },
      ],
    });

    if (shouldRender) {
      this.screen.element.render();
    }
  }

  private toggleAutoPopup(): void {
    // this.autoPopupCheckbox.checked = !this.autoPopupCheckbox.checked;
    // this.screen.element.render();
  }

  show(
    initiatorElementId: string,
    options: {
      onHide?: () => void;
    } = {},
  ): void {
    if (this._isVisible) {
      return;
    }

    this.onHide = options.onHide;

    this.initiatorElementId = initiatorElementId;
    this._container.element.show();
    this.controlsManager.focus(this._container.id);
    this.screen.element.render();
    this._isVisible = true;
  }

  hide(): void {
    if (!this._isVisible) {
      return;
    }
    this._container.element.hide();
    if (!this.initiatorElementId) {
      throw new Error(`Initiator element id is missing`);
    }
    this._isVisible = false;
    this.controlsManager.focus(this.initiatorElementId);
    this.screen.element.render();
    this.onHide?.();
  }

  // addStep(step: WorkflowStep): void {
  //   this.steps.reduce(step);

  //   if (this.autoPopupCheckbox.checked && !this._isVisible) {
  //     this.onAutoPopup?.();
  //   }

  //   this.updateTable(this._isVisible);
  // }

  // private updateTable(shouldRender = true): void {
  //   this.table.setData(this.steps.tableData());

  //   if (shouldRender) {
  //     this.screen.element.render();
  //   }
  // }
}
