import { keyActionListenerFactory } from "@/ui/controls/key-bindings.js";
import {
  NavigationDescription,
  NavigationDirection,
} from "@/ui/controls/navigation.js";
import { Logger } from "beeai-framework";
import blessed from "neo-blessed";
import {
  ContainerComponent,
  ParentInput,
  ScreenInput,
} from "../../base/monitor.js";
import { ControllableContainer } from "../../controls/controls-manager.js";
import { Controls } from "./components/controls.js";
import { WorkflowRuns } from "./components/workflow-runs.js";
import { getWorkflowPopupStyle } from "./config.js";
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
      name: "workflow_popup_container",
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
        ...getWorkflowPopupStyle(true),
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

  private setupControls(shouldRender = true): void {
    // Shortcuts
    this.controlsManager.updateKeyActions(this.container.id, {
      kind: "exclusive",
      actions: [
        {
          key: ["C-c"],
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
        {
          key: ["enter"],
          action: {
            description: NavigationDescription.IN_OUT,
            listener: keyActionListenerFactory(() => {
              this.controlsManager.navigate(NavigationDirection.IN);
            }),
          },
        },
        {
          key: ["escape"],
          action: {
            description: NavigationDescription.IN_OUT,
            listener: keyActionListenerFactory(() => {
              if (this.controlsManager.focused.id === this.container.id) {
                this.hide();
                return;
              }
              this.controlsManager.navigate(NavigationDirection.OUT);
            }),
          },
        },
        {
          key: ["tab"],
          action: {
            description: NavigationDescription.NEXT_PREV,
            listener: keyActionListenerFactory(() => {
              this.controlsManager.navigate(NavigationDirection.NEXT);
            }),
          },
        },
        {
          key: ["S-tab"],
          action: {
            description: NavigationDescription.NEXT_PREV,
            listener: keyActionListenerFactory(() => {
              this.controlsManager.navigate(NavigationDirection.PREVIOUS);
            }),
          },
        },
        {
          key: ["left"],
          action: {
            description: NavigationDescription.LEFT_RIGHT,
            listener: keyActionListenerFactory(() => {
              this.controlsManager.navigate(NavigationDirection.LEFT);
            }),
          },
        },
        {
          key: ["right"],
          action: {
            description: NavigationDescription.LEFT_RIGHT,
            listener: keyActionListenerFactory(() => {
              this.controlsManager.navigate(NavigationDirection.RIGHT);
            }),
          },
        },
        {
          key: ["up"],
          action: {
            description: NavigationDescription.UP_DOWN,
            listener: keyActionListenerFactory(() => {
              this.controlsManager.navigate(NavigationDirection.UP);
            }),
          },
        },
        {
          key: ["down"],
          action: {
            description: NavigationDescription.UP_DOWN,
            listener: keyActionListenerFactory(() => {
              this.controlsManager.navigate(NavigationDirection.DOWN);
            }),
          },
        },
      ],
    });

    // Navigation
    this.controlsManager.updateNavigation(this.container.id, {
      in: this.workflowRuns.runList.id,
    });
    this.controlsManager.updateNavigation(this.workflowRuns.runList.id, {
      outEffect: this.hide.bind(this),
      right: this.workflowExplorer.container.id,
      next: this.workflowExplorer.container.id,
      downEffect: () =>
        this.controls.focus(this.navigateFromControls.bind(this)),
    });
    this.controlsManager.updateNavigation(this.workflowExplorer.container.id, {
      outEffect: this.hide.bind(this),
      left: this.workflowRuns.runList.id,
      previous: this.workflowRuns.runList.id,
      nextEffect: () =>
        this.controls.focus(this.navigateFromControls.bind(this)),
      rightEffect: () =>
        this.controls.focus(this.navigateFromControls.bind(this)),
      downEffect: () =>
        this.controls.focus(this.navigateFromControls.bind(this)),
    });

    if (shouldRender) {
      this.screen.element.render();
    }
  }

  private navigateFromControls(direction: NavigationDirection): void {
    switch (direction) {
      case NavigationDirection.OUT:
        this.controlsManager.focus(this.container.id);
        break;
      case NavigationDirection.UP:
        this.controlsManager.focus(this.workflowExplorer.container.id);
        break;
      case NavigationDirection.PREVIOUS:
        this.controlsManager.focus(this.workflowExplorer.container.id);
        break;
      default:
      // PASS;
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
    this.controlsManager.focus(this.workflowRuns.runList.id);
    // this.controls.focus(() => this.hide(), false);
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
