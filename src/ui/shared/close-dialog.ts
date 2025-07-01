import blessed from "neo-blessed";
import { UIColors } from "../colors.js";
import {
  ControllableContainer,
  ControllableElement,
  ControllableScreen,
  ControlsManager,
} from "../controls/controls-manager.js";
import { keyActionListenerFactory } from "../controls/key-bindings.js";
import {
  NavigationDescription,
  NavigationDirection,
} from "../controls/navigation.js";

export class CloseDialog {
  private dialog: ControllableContainer;
  private title: blessed.Widgets.TextElement;
  private message: blessed.Widgets.TextElement;
  private screen: ControllableScreen;
  private confirmBtn: ControllableElement<blessed.Widgets.ButtonElement>;
  private cancelBtn: ControllableElement<blessed.Widgets.ButtonElement>;
  private isVisible = false;
  private onConfirm: () => void;
  private onCancel: () => void;
  private controlsManager: ControlsManager;
  private initiatorElementId?: string;

  constructor(controlsManager: ControlsManager) {
    this.controlsManager = controlsManager;
    this.screen = this.controlsManager.screen;
    this.onConfirm = () => process.exit(0); // Default action
    this.onCancel = () => {
      if (this.isVisible) {
        this.hide();
      }
    }; // Default action

    // Create dialog box
    this.dialog = this.controlsManager.add({
      kind: "container",
      name: "dialog",
      element: blessed.box({
        parent: this.screen.element,
        top: "center",
        left: "center",
        width: 50,
        height: 10,
        tags: true,
        focusable: false,
        keys: false,
        mouse: false,
        border: {
          type: "line",
        },
        style: {
          border: {
            fg: "red",
          },
          bg: "black",
        },
        hidden: true, // Initially hidden
      }),
      parent: this.controlsManager.screen,
    });

    // Dialog title
    this.title = blessed.text({
      parent: this.dialog.element,
      top: 1,
      left: "center",
      content: "Confirm Exit",
      focusable: false,
      keys: false,
      mouse: false,
      style: {
        bold: true,
        fg: "white",
      },
    });

    // Dialog message
    this.message = blessed.text({
      parent: this.dialog.element,
      top: 3,
      focusable: false,
      keys: false,
      mouse: false,
      left: "center",
      content: "Are you sure you want to exit?",
      style: {
        fg: "white",
      },
    });

    // Confirm button
    this.confirmBtn = this.controlsManager.add({
      kind: "element",
      name: "confirmBtn",
      element: blessed.button({
        parent: this.dialog.element,
        top: 6,
        left: "25%-8",
        width: 10,
        height: 1,
        content: "Yes",
        focusable: false,
        keys: false,
        mouse: false,
        style: {
          fg: UIColors.white.white,
          focus: {
            bg: UIColors.red.red,
          },
        },
        tags: true,
      }),
      parent: this.dialog,
    });

    // Cancel button
    this.cancelBtn = this.controlsManager.add({
      kind: "element",
      name: "cancelBtn",
      element: blessed.button({
        parent: this.dialog.element,
        top: 6,
        left: "75%-8",
        width: 10,
        height: 1,
        content: "No",
        focusable: false,
        keys: false,
        mouse: false,
        style: {
          fg: UIColors.white.white,
          focus: {
            bg: UIColors.blue.blue,
          },
        },
        tags: true,
      }),
      parent: this.dialog,
    });

    this.setupControls();
  }

  private setupControls(shouldRender = true) {
    // Navigation
    this.controlsManager.updateNavigation(this.confirmBtn.id, {
      right: this.cancelBtn.id,
      next: this.cancelBtn.id,
    });
    this.controlsManager.updateNavigation(this.cancelBtn.id, {
      left: this.confirmBtn.id,
      previous: this.confirmBtn.id,
    });

    // Shortcuts
    this.controlsManager.updateKeyActions(this.dialog.id, {
      kind: "exclusive",
      actions: [
        {
          key: ["C-c", "escape"],
          action: {
            description: NavigationDescription.CANCEL,
            listener: keyActionListenerFactory(() => {
              this.onCancel();
            }),
          },
        },
        {
          key: "left",
          action: {
            description: NavigationDescription.LEFT_RIGHT,
            listener: keyActionListenerFactory(() => {
              this.controlsManager.navigate(NavigationDirection.LEFT);
            }),
          },
        },
        {
          key: "right",
          action: {
            description: NavigationDescription.LEFT_RIGHT,
            listener: keyActionListenerFactory(() => {
              this.controlsManager.navigate(NavigationDirection.RIGHT);
            }),
          },
        },
        {
          key: "tab",
          action: {
            description: NavigationDescription.NEXT_PREV,
            listener: keyActionListenerFactory(() => {
              this.controlsManager.navigate(NavigationDirection.NEXT);
            }),
          },
        },
        {
          key: "S-tab",
          action: {
            description: NavigationDescription.NEXT_PREV,
            listener: keyActionListenerFactory(() => {
              this.controlsManager.navigate(NavigationDirection.PREVIOUS);
            }),
          },
        },
      ],
    });

    this.controlsManager.updateKeyActions(this.cancelBtn.id, {
      kind: "override",
      actions: [
        {
          key: "enter",
          action: {
            description: NavigationDescription.CANCEL,
            listener: keyActionListenerFactory(() => {
              this.onCancel();
            }),
          },
        },
      ],
    });

    this.controlsManager.updateKeyActions(this.confirmBtn.id, {
      kind: "override",
      actions: [
        {
          key: "enter",
          action: {
            description: NavigationDescription.EXIT_APP,
            listener: keyActionListenerFactory(() => {
              this.onConfirm();
            }),
          },
        },
      ],
    });

    if (shouldRender) {
      this.screen.element.render();
    }
  }

  /**
   * Show the dialog
   */
  public show(
    initiatorElementId: string,
    options: {
      onConfirm?: () => void;
      onCancel?: () => void;
      message?: string;
      title?: string;
    } = {},
  ): void {
    this.initiatorElementId = initiatorElementId;

    // Update handlers if provided
    if (options.onConfirm) {
      this.onConfirm = options.onConfirm;
    }

    if (options.onCancel) {
      this.onCancel = options.onCancel;
    }

    // Update message and title if provided
    if (options.message) {
      this.message.setContent(options.message);
    }

    if (options.title) {
      this.title.setContent(options.title);
    }

    // Show dialog and focus on cancel button by default (safer option)
    this.dialog.element.show();
    this.controlsManager.focus(this.cancelBtn.id);
    this.screen.element.render();
    this.isVisible = true;
  }

  /**
   * Hide the dialog
   */
  public hide(): void {
    if (!this.isVisible) {
      return;
    }

    this.dialog.element.hide();

    if (!this.initiatorElementId) {
      throw new Error(`Initiator element id is missing`);
    }
    this.isVisible = false;
    this.controlsManager.focus(this.initiatorElementId);
    this.screen.element.render();
  }

  /**
   * Check if the dialog is currently visible
   */
  public isOpen(): boolean {
    return this.isVisible;
  }
}
