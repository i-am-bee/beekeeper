import blessed from "neo-blessed";
import { BaseMonitor } from "../../src/ui/base/monitor.js";
import { UIColors } from "../../src/ui/colors.js";
import {
  ControllableContainer,
  ControllableElement,
  ControlsManager,
} from "../../src/ui/controls/controls-manager.js";
import { CloseDialog } from "@/ui/shared/close-dialog.js";
import { NavigationDirection } from "../../src/ui/controls/navigation.js";

class Monitor extends BaseMonitor {
  private controlsManager: ControlsManager;
  private container: ControllableContainer;
  private leftColumn: ControllableContainer;
  private textInput: ControllableElement;
  private rightColumn: ControllableContainer;
  private closeDialog: CloseDialog;

  constructor() {
    super({ title: "Monitor" });

    this.controlsManager = new ControlsManager(this.screen);

    this.container = this.controlsManager.add({
      kind: "container",
      name: "container",
      element: blessed.box({
        parent: this.screen,
        width: "95%",
        height: "95%",
        left: 0,
        top: 0,
        focusable: false,
        content: "Container",
        border: { type: "line" },
        mouse: false,
        keys: false,
        style: {
          border: {
            fg: UIColors.white.ghost_white,
          },
          focus: {
            border: {
              fg: UIColors.blue.cyan,
            },
          },
        },
      }),
      parent: this.controlsManager.screen,
    });

    this.leftColumn = this.controlsManager.add({
      kind: "container",
      name: "leftColumn",
      element: blessed.box({
        parent: this.container.element,
        width: "50%-1",
        height: "100%-3",
        left: 0,
        top: 1,
        content: "leftColumn",
        border: { type: "line" },
        focusable: false,
        style: {
          border: {
            fg: UIColors.green.green,
          },
          focus: {
            border: {
              fg: UIColors.blue.cyan,
            },
          },
        },
      }),
      parent: this.container,
    });

    this.textInput = this.controlsManager.add({
      kind: "element",
      name: "textInput",
      element: blessed.textarea({
        parent: this.leftColumn.element,
        width: "100%-12", // Make room for abort button
        height: 5,
        left: 0,
        top: "100%-13",
        focusable: false,
        inputOnFocus: false,
        mouse: false,
        keys: false,
        border: { type: "line" },
        style: {
          focus: {
            border: {
              fg: UIColors.blue.cyan,
            },
          },
        },
      }),
      parent: this.leftColumn,
    });

    this.rightColumn = this.controlsManager.add({
      kind: "container",
      name: "rightColumn",
      element: blessed.box({
        parent: this.container.element,
        width: "50%-1",
        height: "100%-3",
        left: "50%",
        top: 1,
        content: "rightColumn",
        border: { type: "line" },
        mouse: false,
        keys: false,
        style: {
          border: {
            fg: UIColors.blue.blue,
          },
          focus: {
            border: {
              fg: UIColors.blue.cyan,
            },
          },
        },
      }),
      parent: this.container,
    });

    this.closeDialog = new CloseDialog(this.screen, this.controlsManager);
    this.setupControls();
  }

  private setupControls(shouldRender = true) {
    // Navigation
    this.controlsManager.updateNavigation(this.controlsManager.screen.id, {
      in: this.container.id,
    });
    this.controlsManager.updateNavigation(this.container.id, {
      in: this.leftColumn.id,
      out: this.controlsManager.screen.id,
    });
    this.controlsManager.updateNavigation(this.leftColumn.id, {
      in: this.textInput.id,
      out: this.container.id,
      right: this.rightColumn.id,
      next: this.rightColumn.id,
    });
    this.controlsManager.updateNavigation(this.rightColumn.id, {
      left: this.leftColumn.id,
      out: this.container.id,
      previous: this.leftColumn.id,
    });

    this.controlsManager.updateNavigation(this.textInput.id, {
      out: this.leftColumn.id,
    });

    // Global shortcuts
    this.controlsManager.updateKeyActions(this.controlsManager.screen.id, {
      kind: "exclusive",
      actions: [
        {
          key: "left",
          action: {
            description: "Move to the left element",
            listener: () => {
              this.controlsManager.navigate(NavigationDirection.LEFT);
            },
          },
        },
        {
          key: "right",
          action: {
            description: "Move to the right element",
            listener: () => {
              this.controlsManager.navigate(NavigationDirection.RIGHT);
            },
          },
        },
        {
          key: "up",
          action: {
            description: "Move to the up element",
            listener: () => {
              this.controlsManager.navigate(NavigationDirection.UP);
            },
          },
        },
        {
          key: "down",
          action: {
            description: "Move to the down element",
            listener: () => {
              this.controlsManager.navigate(NavigationDirection.DOWN);
            },
          },
        },
        {
          key: "tab",
          action: {
            description: "Move to the next element",
            listener: () => {
              this.controlsManager.navigate(NavigationDirection.NEXT);
            },
          },
        },
        {
          key: "enter",
          action: {
            description: "Enter into the element",
            listener: () => {
              this.controlsManager.navigate(NavigationDirection.IN);
            },
          },
        },
        {
          key: "escape",
          action: {
            description: "Exit from the element",
            listener: () => {
              this.controlsManager.navigate(NavigationDirection.OUT);
            },
          },
        },
        {
          key: "S-tab",
          action: {
            description: "Move to the previous element",
            listener: () => {
              this.controlsManager.navigate(NavigationDirection.PREVIOUS);
            },
          },
        },
        {
          key: "C-c",
          action: {
            description: "Quit",
            listener: () => {
              this.closeDialog.show(this.controlsManager.focused.id);
            },
          },
        },
        {
          key: "c",
          action: {
            description: "Select container",
            listener: () => {
              this.controlsManager.focus(this.container.id);
            },
          },
        },
        {
          key: "a",
          action: {
            description: "Select left column",
            listener: () => {
              this.controlsManager.focus(this.leftColumn.id);
            },
          },
        },
        {
          key: "s",
          action: {
            description: "Select right column",
            listener: () => {
              this.controlsManager.focus(this.rightColumn.id);
            },
          },
        },
        {
          key: "i",
          action: {
            description: "Select input",
            listener: () => {
              this.controlsManager.focus(this.textInput.id);
            },
          },
        },
      ],
    });

    // Text input shortcuts
    const textInputEditMode = () => {
      this.controlsManager.updateKeyActions(this.textInput.id, {
        kind: "exclusive",
        actions: [
          {
            key: "escape",
            action: {
              description: "Up to parent focus",
              listener: textInputControlMode,
            },
          },
        ],
      });

      (this.textInput.element as blessed.Widgets.TextareaElement).readInput();
    };

    const textInputControlMode = () => {
      this.controlsManager.updateKeyActions(this.textInput.id, {
        kind: "override",
        actions: [
          {
            key: "enter",
            action: {
              description: "Enter input mode",
              listener: textInputEditMode,
            },
          },
        ],
      });
    };
    textInputControlMode();

    this.controlsManager.focus(this.container.id, false);

    if (shouldRender) {
      this.screen.render();
    }
  }
}

new Monitor();
