import { Logger } from "beeai-framework";
import blessed from "neo-blessed";
import {
  ContainerComponent,
  ParentInput,
  ScreenInput,
} from "../../base/monitor.js";
import { UIConfig } from "../../config.js";
import {
  ControllableContainer,
  ControllableElement,
} from "../../controls/controls-manager.js";
import { WorkflowStep } from "./dto.js";
import { WorkflowStepsDataProvider } from "./data-provider.js";
import { UIColors } from "@/ui/colors.js";
import * as chatStyles from "../config.js";
import { keyActionListenerFactory } from "@/ui/controls/key-bindings.js";
import { NavigationDescription } from "@/ui/controls/navigation.js";

export class WorkflowPopup extends ContainerComponent {
  private _container: ControllableContainer;
  private hideButton: ControllableElement;
  private title: blessed.Widgets.TextElement;
  private table: blessed.Widgets.ListTableElement;
  private autoPopupCheckbox: blessed.Widgets.CheckboxElement;
  private steps: WorkflowStepsDataProvider;
  private onHide?: () => void;
  private onAutoPopup?: () => void;
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
    onAutoPopup?: () => void,
  ) {
    super(arg, logger);

    this.onAutoPopup = onAutoPopup;

    this.steps = new WorkflowStepsDataProvider();

    // Create dialog box
    this._container = this.controlsManager.add({
      kind: "container",
      name: "container",
      element: blessed.box({
        parent: this.parent.element,
        top: "center",
        left: "center",
        width: 100,
        height: 20,
        tags: true,
        focusable: false,
        keys: false,
        mouse: false,
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

    // Dialog title
    this.title = blessed.text({
      parent: this._container.element,
      top: 1,
      left: "center",
      content: "Workflow",
      focusable: false,
      keys: false,
      mouse: false,
      style: {
        bold: true,
        fg: "white",
      },
    });

    this.table = blessed.listtable({
      parent: this._container.element,
      top: 3,
      left: 1,
      width: "100%-4",
      height: "100%-8",
      align: "left",
      mouse: false,
      keys: false,
      tags: true,
      style: {
        bg: UIColors.black.black,
        header: {
          fg: UIColors.white.white,
          bg: UIColors.black.black,
        },
        cell: {
          fg: UIColors.white.white,
          bg: UIColors.black.black,
        },
      },
      vi: false,
    });

    this.autoPopupCheckbox = blessed.checkbox({
      parent: this._container.element,
      top: "100%-5",
      left: "100%-20",
      content: "Auto popup",
      checked: false,
      mouse: false,
      keys: false,
      style: {
        bg: UIColors.black.black,
        fg: UIColors.white.white,
        focus: {
          bg: UIColors.black.black,
          fg: UIColors.white.white,
        },
      },
    });

    // Send/abort button
    this.hideButton = this.controlsManager.add({
      kind: "element",
      name: "hideButton",
      element: blessed.button({
        parent: this._container.element,
        width: 10,
        height: 3,
        left: "50%-5",
        top: "100%-6",
        ...chatStyles.getHideButtonStyle(),
        tags: true,
        mouse: false,
      }),
      parent: this._container,
    });

    this.setupControls();
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
    this.autoPopupCheckbox.checked = !this.autoPopupCheckbox.checked;
    this.screen.element.render();
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

  addStep(step: WorkflowStep): void {
    this.steps.reduce(step);

    if (this.autoPopupCheckbox.checked && !this._isVisible) {
      this.onAutoPopup?.();
    }

    this.updateTable(this._isVisible);
  }

  private updateTable(shouldRender = true): void {
    this.table.setData(this.steps.tableData());

    if (shouldRender) {
      this.screen.element.render();
    }
  }
}
